import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/badges — list current user's badges */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const rows = await prisma.userBadge.findMany({
    where: { userId: payload.userId },
    orderBy: { dateAwarded: 'asc' },
  });
  res.json({
    items: rows.map((r) => ({
      badgeName: r.badgeName,
      dateAwarded: r.dateAwarded,
    })),
  });
}

