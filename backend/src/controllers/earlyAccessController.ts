import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { getEarlyAccessStatus, getEarlyAccessForUser } from '../services/earlyAccessService';

const prisma = new PrismaClient();

/** GET /api/v1/early-access/status — public status of the early founder program. */
export async function status(_req: Request, res: Response): Promise<void> {
  const summary = await getEarlyAccessStatus(prisma);
  res.json(summary);
}

/** GET /api/v1/early-access/me — authenticated user's early-access status (if any). */
export async function me(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const row = await getEarlyAccessForUser(prisma, { userId: payload.userId });

  if (!row) {
    res.json({ enrolled: false });
    return;
  }

  res.json({
    enrolled: true,
    status: row.status,
    signupOrder: row.signupOrder,
    ideaSubmitted: row.ideaSubmitted,
    consultationCompleted: row.consultationCompleted,
  });
}


