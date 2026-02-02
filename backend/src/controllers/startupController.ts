import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const VISIBILITY_APPROVED = 'approved';

/** POST /api/v1/startups/publish — Create or update startup profile; visibility = pending_approval until admin approves */
export async function publish(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { projectId, pitchSummary, tractionMetrics, fundingNeeded, equityOffer, stage } = req.body as {
    projectId: string;
    pitchSummary: string;
    tractionMetrics?: string;
    fundingNeeded: number;
    equityOffer?: number;
    stage?: string;
  };
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  if (project.client.userId !== payload.userId && payload.role !== 'super_admin') {
    res.status(403).json({ error: 'Only the project owner or admin can publish' });
    return;
  }
  const visibilityStatus = payload.role === 'super_admin' ? 'approved' : 'pending_approval';
  const data = {
    pitchSummary,
    tractionMetrics: tractionMetrics || null,
    fundingNeeded,
    equityOffer: equityOffer != null ? equityOffer : null,
    stage: stage || project.stage,
    visibilityStatus,
  };
  const startup = await prisma.startupProfile.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
    include: { project: { select: { projectName: true, client: { select: { businessName: true } } } } },
  });
  res.status(201).json(startup);
}

/** GET /api/v1/startups/me — List startup profiles for current user's projects (client) or all (admin) */
export async function listMine(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role === 'super_admin' || payload.role === 'project_manager') {
    return listAll(req, res);
  }
  const client = await prisma.client.findUnique({
    where: { userId: payload.userId },
    select: { id: true },
  });
  if (!client) {
    res.json([]);
    return;
  }
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);
  const startups = await prisma.startupProfile.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { projectName: true, client: { select: { businessName: true } } } },
    },
  });
  res.json(startups);
}

/** GET /api/v1/startups — List all startup profiles (admin only) */
export async function listAll(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: { role: string } }).user;
  if (payload.role !== 'super_admin' && payload.role !== 'project_manager') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const startups = await prisma.startupProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { projectName: true, client: { select: { businessName: true } } } },
    },
  });
  res.json(startups);
}

/** GET /api/v1/startups/marketplace — List approved startups (investors + public); filter by industry, stage, funding */
export async function marketplace(req: Request, res: Response): Promise<void> {
  const industry = req.query.industry as string | undefined;
  const stage = req.query.stage as string | undefined;
  const fundingMin = req.query.fundingMin as string | undefined;
  const fundingMax = req.query.fundingMax as string | undefined;
  const startups = await prisma.startupProfile.findMany({
    where: {
      visibilityStatus: VISIBILITY_APPROVED,
      ...(industry && { project: { client: { industry: { contains: industry, mode: 'insensitive' } } } }),
      ...(stage && { stage }),
      ...(fundingMin && { fundingNeeded: { gte: parseFloat(fundingMin) } }),
      ...(fundingMax && { fundingNeeded: { lte: parseFloat(fundingMax) } }),
    },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
          stage: true,
          description: true,
          client: { select: { businessName: true, industry: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(startups);
}

/** GET /api/v1/startups/:id — Get startup profile by id (marketplace id = StartupProfile.id) */
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
          description: true,
          stage: true,
          status: true,
          client: { select: { businessName: true, industry: true, userId: true, user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  if (startup.visibilityStatus !== VISIBILITY_APPROVED) {
    const payload = (req as unknown as { user?: AuthPayload }).user;
    const isAdmin = payload?.role === 'super_admin' || payload?.role === 'project_manager';
    const projectWithClient = await prisma.project.findUnique({
      where: { id: startup.projectId },
      select: { client: { select: { userId: true } } },
    });
    const isOwner = projectWithClient?.client?.userId === payload?.userId;
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: 'Startup not visible' });
      return;
    }
  }
  res.json(startup);
}

/** PUT /api/v1/startups/:id/approve — Admin approve startup visibility */
export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startup = await prisma.startupProfile.findUnique({ where: { id } });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  const updated = await prisma.startupProfile.update({
    where: { id },
    data: { visibilityStatus: 'approved' },
    include: { project: { select: { projectName: true } } },
  });
  res.json(updated);
}
