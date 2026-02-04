import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/messages — list contact messages with basic filters */
export async function list(req: Request, res: Response): Promise<void> {
  const { status, limit = '50' } = req.query as { status?: string; limit?: string };
  const take = Math.min(parseInt(limit, 10) || 50, 200);

  const where: { status?: string } = {};
  if (status) where.status = status;

  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  });

  res.json({
    items: messages,
  });
}

/** PATCH /api/v1/super-admin/messages/:id — update status (read/replied) */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status?: string };
  if (!status) {
    res.status(400).json({ error: 'status is required' });
    return;
  }
  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  res.json(updated);
}

