import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { computeScore } from '../services/startupScoringService';

const prisma = new PrismaClient();

function isAdmin(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin'].includes(role);
}

/** Internal helper: load startup + relations for scoring. */
async function loadStartup(startupId: string) {
  return prisma.startupProfile.findUnique({
    where: { id: startupId },
    include: {
      project: {
        select: {
          id: true,
          problemStatement: true,
          targetMarket: true,
          projectMembers: true,
        },
      },
      investments: true,
    },
  }) as any;
}

/** POST /api/v1/startups/:id/score/recalculate — Founder/Admin: recompute StartupScore. */
export async function recalculate(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { id } = req.params;
  const startup = await loadStartup(id);
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  const founderUserId = startup.project?.client?.userId;
  const canScore =
    isAdmin(payload.role) ||
    (!!founderUserId && founderUserId === payload.userId);
  if (!canScore) {
    res.status(403).json({ error: 'Only founder or admin can recalculate score' });
    return;
  }
  const teamSize = startup.project?.projectMembers?.length || 1;
  const breakdown = computeScore(startup, teamSize);
  await prisma.startupScore.upsert({
    where: { startupId: id },
    create: {
      startupId: id,
      scoreTotal: breakdown.total,
      breakdown,
    },
    update: {
      scoreTotal: breakdown.total,
      breakdown,
      updatedAt: new Date(),
    },
  });
  res.json({ scoreTotal: breakdown.total, breakdown });
}

/** GET /api/v1/startups/:id/score — Founder/Investor/Admin: get score + suggestions. */
export async function getScore(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id },
    include: { score: true },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  if (!startup.score) {
    res.json({ scoreTotal: 0, breakdown: null, suggestions: ['Score not calculated yet. Ask founder or admin to generate a score.'] });
    return;
  }
  const breakdown = startup.score.breakdown as any;
  const suggestions: string[] = [];
  if (breakdown.problemClarity < 7) suggestions.push('Clarify the problem and who you serve in 2–3 sentences.');
  if (breakdown.marketSize < 10) suggestions.push('Strengthen your market size narrative and add data sources.');
  if (breakdown.traction < 10) suggestions.push('Highlight concrete traction: users, revenue, pilots, or waitlist.');
  if (breakdown.teamStrength < 7) suggestions.push('Explain why this team can win (experience, past wins, complementary skills).');
  if (suggestions.length === 0) suggestions.push('Strong overall score. Focus on execution and investor readiness.');
  res.json({
    scoreTotal: startup.score.scoreTotal,
    breakdown,
    suggestions,
  });
}

/** GET /api/v1/startups/scores?minScore=70 — Investor/Admin: ranked startups. */
export async function rankedList(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (!isAdmin(payload.role) && payload.role !== 'investor') {
    res.status(403).json({ error: 'Investor or admin only' });
    return;
  }
  const minScore = Number(req.query.minScore ?? 0) || 0;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const rows = await prisma.startupScore.findMany({
    where: { scoreTotal: { gte: minScore } },
    orderBy: { scoreTotal: 'desc' },
    take: limit,
    include: {
      startup: {
        include: {
          project: {
            select: {
              projectName: true,
              stage: true,
              client: { select: { businessName: true, industry: true } },
            },
          },
        },
      },
    },
  });
  res.json({
    items: rows.map((r) => ({
      startupId: r.startupId,
      scoreTotal: r.scoreTotal,
      projectName: r.startup.project?.projectName,
      stage: r.startup.project?.stage,
      businessName: r.startup.project?.client?.businessName,
      industry: r.startup.project?.client?.industry,
    })),
  });
}

