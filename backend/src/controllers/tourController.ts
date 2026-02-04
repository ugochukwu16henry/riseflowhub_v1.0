import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/tours/progress */
export async function listProgress(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const rows = await prisma.userTourProgress.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({
    items: rows.map((r) => ({
      tourName: r.tourName,
      completed: r.completed,
    })),
  });
}

/** POST /api/v1/tours/:tourName/complete */
export async function markComplete(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { tourName } = req.params;
  if (!tourName || !tourName.trim()) {
    res.status(400).json({ error: 'tourName required' });
    return;
  }
  await prisma.userTourProgress.upsert({
    where: { userId_tourName: { userId: payload.userId, tourName } },
    create: { userId: payload.userId, tourName, completed: true },
    update: { completed: true },
  });
  res.json({ ok: true, tourName });
}

