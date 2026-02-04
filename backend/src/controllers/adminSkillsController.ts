import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/skills — List all skills (optionally by category) */
export async function list(req: Request, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const where = category?.trim() ? { category: category.trim() } : {};
  const skills = await prisma.skill.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json({
    items: skills.map((s) => ({ id: s.id, name: s.name, category: s.category, createdAt: s.createdAt })),
  });
}

/** POST /api/v1/super-admin/skills — Create skill */
export async function create(req: Request, res: Response): Promise<void> {
  const { name, category } = req.body as { name: string; category?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'name required' });
    return;
  }
  const skill = await prisma.skill.create({
    data: {
      name: name.trim(),
      category: category?.trim() || null,
    },
  });
  res.status(201).json({ id: skill.id, name: skill.name, category: skill.category, createdAt: skill.createdAt });
}

/** PUT /api/v1/super-admin/skills/:id — Update skill */
export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { name, category } = req.body as { name?: string; category?: string };
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }
  const data: { name?: string; category?: string | null } = {};
  if (name !== undefined) data.name = name.trim() || skill.name;
  if (category !== undefined) data.category = category?.trim() || null;
  const updated = await prisma.skill.update({
    where: { id },
    data,
  });
  res.json({ id: updated.id, name: updated.name, category: updated.category, createdAt: updated.createdAt });
}

/** DELETE /api/v1/super-admin/skills/:id — Delete skill */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    res.status(404).json({ error: 'Skill not found' });
    return;
  }
  await prisma.skill.delete({ where: { id } });
  res.json({ ok: true, id });
}
