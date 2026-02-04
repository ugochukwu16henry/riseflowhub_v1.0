import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Public: GET /api/v1/faq */
export async function list(req: Request, res: Response): Promise<void> {
  const { category, q, highlighted, limit } = req.query as {
    category?: string;
    q?: string;
    highlighted?: string;
    limit?: string;
  };
  const where: any = { isActive: true };
  if (category && category !== 'all') {
    where.category = category;
  }
  if (highlighted === 'true') {
    where.isHighlighted = true;
  }
  if (q && q.trim()) {
    where.OR = [
      { question: { contains: q.trim(), mode: 'insensitive' } },
      { answer: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }
  const take = limit ? Math.min(parseInt(limit, 10) || 20, 100) : undefined;
  const items = await prisma.faqItem.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    take,
  });
  res.json({ items });
}

/** Admin: GET /api/v1/faq/admin */
export async function adminList(_req: Request, res: Response): Promise<void> {
  const items = await prisma.faqItem.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  res.json({ items });
}

/** Admin: POST /api/v1/faq/admin */
export async function create(req: Request, res: Response): Promise<void> {
  const { question, answer, category, order, isActive, isHighlighted } = req.body as {
    question: string;
    answer: string;
    category: string;
    order?: number;
    isActive?: boolean;
    isHighlighted?: boolean;
  };
  if (!question?.trim() || !answer?.trim() || !category?.trim()) {
    res.status(400).json({ error: 'question, answer and category are required' });
    return;
  }
  const created = await prisma.faqItem.create({
    data: {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      order: order ?? 0,
      isActive: isActive ?? true,
      isHighlighted: isHighlighted ?? false,
    },
  });
  res.status(201).json(created);
}

/** Admin: PUT /api/v1/faq/admin/:id */
export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { question, answer, category, order, isActive, isHighlighted } = req.body as Partial<{
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
    isHighlighted: boolean;
  }>;
  try {
    const updated = await prisma.faqItem.update({
      where: { id },
      data: {
        ...(question != null && { question: question.trim() }),
        ...(answer != null && { answer: answer.trim() }),
        ...(category != null && { category: category.trim() }),
        ...(order != null && { order }),
        ...(isActive != null && { isActive }),
        ...(isHighlighted != null && { isHighlighted }),
      },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'FAQ item not found' });
  }
}

/** Admin: DELETE /api/v1/faq/admin/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    await prisma.faqItem.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'FAQ item not found' });
  }
}

