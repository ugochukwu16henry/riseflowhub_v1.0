import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { recalculateFounderReputation } from '../services/founderReputationService';

const prisma = new PrismaClient();

/** GET /api/v1/founders/me/reputation */
export async function myReputation(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const breakdown = await recalculateFounderReputation(prisma, payload.userId);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message || 'Failed to calculate reputation' });
  }
}

/** GET /api/v1/founders/:userId/reputation — Super Admin / investor view */
export async function getReputation(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  if (payload.role !== UserRole.super_admin && payload.role !== UserRole.investor) {
    res.status(403).json({ error: 'Only Super Admins and investors can view other founders’ reputation.' });
    return;
  }
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  try {
    const breakdown = await recalculateFounderReputation(prisma, userId);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message || 'Failed to calculate reputation' });
  }
}

