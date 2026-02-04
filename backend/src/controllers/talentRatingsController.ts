import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** POST /api/v1/ratings — Submit rating (hirer rates talent or talent rates hirer) after a completed hire */
export async function create(req: Request, res: Response): Promise<void> {
  const { toUserId, hireId, score, comment } = req.body as {
    toUserId: string;
    hireId?: string;
    score: number;
    comment?: string;
  };
  const payload = (req as unknown as { user: AuthPayload }).user;
  const fromUserId = payload.userId;

  if (!toUserId?.trim() || typeof score !== 'number' || score < 1 || score > 5) {
    res.status(400).json({ error: 'toUserId and score (1-5) required' });
    return;
  }

  if (fromUserId === toUserId) {
    res.status(400).json({ error: 'Cannot rate yourself' });
    return;
  }

  if (hireId) {
    const hire = await prisma.hire.findUnique({
      where: { id: hireId },
      include: { talent: true, hirer: true },
    });
    if (!hire || hire.status !== 'completed') {
      res.status(400).json({ error: 'Hire must be completed to rate' });
      return;
    }
    const talentUserId = hire.talent.userId;
    const hirerUserId = hire.hirer.userId;
    if (![talentUserId, hirerUserId].includes(fromUserId) || ![talentUserId, hirerUserId].includes(toUserId)) {
      res.status(403).json({ error: 'Only parties of this hire can rate each other' });
      return;
    }
  }

  const existing = await prisma.talentRating.findFirst({
    where: { fromUserId, toUserId, ...(hireId && { hireId }) },
  });
  if (existing) {
    res.status(400).json({ error: 'Already rated this user for this hire' });
    return;
  }

  const rating = await prisma.talentRating.create({
    data: {
      fromUserId,
      toUserId: toUserId.trim(),
      hireId: hireId?.trim() || null,
      score,
      comment: comment?.trim() || null,
    },
  });

  // Update talent average if toUser is a talent
  const talent = await prisma.talent.findUnique({ where: { userId: toUserId } });
  if (talent) {
    const agg = await prisma.talentRating.aggregate({
      where: { toUserId },
      _avg: { score: true },
      _count: true,
    });
    await prisma.talent.update({
      where: { id: talent.id },
      data: {
        averageRating: agg._avg.score ?? undefined,
        ratingCount: agg._count,
      },
    });
  }

  res.status(201).json({
    id: rating.id,
    fromUserId: rating.fromUserId,
    toUserId: rating.toUserId,
    hireId: rating.hireId,
    score: rating.score,
    comment: rating.comment,
    createdAt: rating.createdAt,
  });
}

/** GET /api/v1/ratings — List ratings (for a user or for a hire). Query: toUserId, or hireId */
export async function list(req: Request, res: Response): Promise<void> {
  const toUserId = req.query.toUserId as string | undefined;
  const hireId = req.query.hireId as string | undefined;

  const where: { toUserId?: string; hireId?: string } = {};
  if (toUserId) where.toUserId = toUserId;
  if (hireId) where.hireId = hireId;

  if (!where.toUserId && !where.hireId) {
    res.status(400).json({ error: 'Query toUserId or hireId required' });
    return;
  }

  const ratings = await prisma.talentRating.findMany({
    where,
    include: {
      fromUser: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: ratings.map((r) => ({
      id: r.id,
      fromUser: r.fromUser,
      toUserId: r.toUserId,
      hireId: r.hireId,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
}
