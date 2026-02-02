import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const ADMIN_OR_MARKETER = ['super_admin', 'project_manager', 'marketer', 'finance_admin'];

async function canAccessProject(userId: string, role: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { client: { select: { userId: true } } },
  });
  if (!project) return false;
  if (ADMIN_OR_MARKETER.includes(role)) return true;
  if (project.client.userId === userId) return true;
  const assigned = await prisma.task.findFirst({
    where: { projectId, assignedToId: userId },
    select: { id: true },
  });
  return !!assigned;
}

/** POST /api/v1/campaigns — Create campaign */
export async function createCampaign(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { projectId, platform, budget, startDate, endDate } = req.body as {
    projectId: string;
    platform: string;
    budget: number;
    startDate: string;
    endDate: string;
  };
  const allowed = await canAccessProject(payload.userId, payload.role, projectId);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot access this project' });
    return;
  }
  const campaign = await prisma.campaign.create({
    data: {
      projectId,
      platform,
      budget,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });
  res.status(201).json(campaign);
}

/** GET /api/v1/campaigns/project/:projectId — List campaigns by project */
export async function listCampaignsByProject(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { projectId } = req.params;
  const allowed = await canAccessProject(payload.userId, payload.role, projectId);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot access this project' });
    return;
  }
  const campaigns = await prisma.campaign.findMany({
    where: { projectId },
    include: {
      leads: { select: { id: true, source: true, cost: true, conversionStatus: true, createdAt: true } },
    },
    orderBy: { startDate: 'desc' },
  });
  res.json(campaigns);
}

/** POST /api/v1/leads/import — Bulk import leads */
export async function importLeads(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { campaignId, leads: leadsBody } = req.body as {
    campaignId: string;
    leads: Array<{ source: string; cost: number; conversionStatus: string }>;
  };
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { projectId: true },
  });
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }
  const allowed = await canAccessProject(payload.userId, payload.role, campaign.projectId);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot access this campaign' });
    return;
  }
  const created = await prisma.lead.createManyAndReturn({
    data: leadsBody.map((l) => ({
      campaignId,
      source: l.source || 'import',
      cost: l.cost,
      conversionStatus: l.conversionStatus || 'lead',
    })),
  });
  res.status(201).json({ imported: created.length, leads: created });
}

/** GET /api/v1/analytics/:projectId — Analytics for project (traffic, conversions, CAC, ROI from leads) */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { projectId } = req.params;
  const allowed = await canAccessProject(payload.userId, payload.role, projectId);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot access this project' });
    return;
  }
  const campaigns = await prisma.campaign.findMany({
    where: { projectId },
    include: { leads: true },
  });
  let traffic = 0;
  let conversions = 0;
  let totalCost = 0;
  const byPlatform: Record<string, { traffic: number; conversions: number; cost: number }> = {};
  const funnel: { stage: string; count: number }[] = [];
  const statusCounts: Record<string, number> = {};

  for (const c of campaigns) {
    if (!byPlatform[c.platform]) {
      byPlatform[c.platform] = { traffic: 0, conversions: 0, cost: 0 };
    }
    for (const lead of c.leads) {
      traffic += 1;
      totalCost += Number(lead.cost);
      byPlatform[c.platform].traffic += 1;
      byPlatform[c.platform].cost += Number(lead.cost);
      statusCounts[lead.conversionStatus] = (statusCounts[lead.conversionStatus] || 0) + 1;
      if (lead.conversionStatus === 'converted') {
        conversions += 1;
        byPlatform[c.platform].conversions += 1;
      }
    }
  }

  const cac = conversions > 0 ? totalCost / conversions : null;
  const assumedRevenuePerConversion = 100;
  const revenue = conversions * assumedRevenuePerConversion;
  const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : null;

  funnel.push({ stage: 'lead', count: statusCounts['lead'] || 0 });
  funnel.push({ stage: 'qualified', count: statusCounts['qualified'] || 0 });
  funnel.push({ stage: 'converted', count: statusCounts['converted'] || 0 });

  const snapshot = await prisma.marketingAnalyticsSnapshot.findFirst({
    where: { projectId },
    orderBy: { periodEnd: 'desc' },
  });

  res.json({
    projectId,
    traffic,
    conversions,
    cac: cac != null ? Math.round(cac * 100) / 100 : null,
    roi: roi != null ? Math.round(roi * 100) / 100 : null,
    totalCost: Math.round(totalCost * 100) / 100,
    byPlatform,
    funnel,
    snapshot: snapshot
      ? {
          traffic: snapshot.traffic,
          conversions: snapshot.conversions,
          cac: snapshot.cac != null ? Number(snapshot.cac) : null,
          roi: snapshot.roi != null ? Number(snapshot.roi) : null,
          periodStart: snapshot.periodStart,
          periodEnd: snapshot.periodEnd,
        }
      : null,
  });
}
