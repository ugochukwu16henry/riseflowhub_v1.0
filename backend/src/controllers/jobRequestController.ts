import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** POST /api/v1/job-requests — Hirer: post a job request */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    title: string;
    description?: string;
    roleCategory?: string;
    skills?: string[];
    budget?: string;
  };
  const { title, description, roleCategory, skills, budget } = body;

  if (!title?.trim()) {
    res.status(400).json({ error: 'title required' });
    return;
  }

  const hirer = await prisma.hirer.findUnique({ where: { userId: payload.userId } });
  if (!hirer) {
    res.status(403).json({ error: 'Hirer profile required' });
    return;
  }
  if (!hirer.feePaid) {
    res.status(403).json({ error: 'Platform fee must be paid before posting jobs' });
    return;
  }

  const job = await prisma.jobRequest.create({
    data: {
      hirerId: hirer.id,
      title: title.trim(),
      description: description?.trim() || null,
      roleCategory: roleCategory?.trim() || null,
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [],
      budget: budget?.trim() || null,
      status: 'open',
    },
    include: { hirer: { include: { user: { select: { name: true, email: true } } } } },
  });

  res.status(201).json({
    id: job.id,
    title: job.title,
    description: job.description,
    roleCategory: job.roleCategory,
    skills: job.skills,
    budget: job.budget,
    status: job.status,
    hirer: job.hirer.user,
    createdAt: job.createdAt,
  });
}

/** GET /api/v1/job-requests — List job requests (public: open only; hirer auth: own; admin: all) */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  const roleCategory = req.query.roleCategory as string | undefined;
  const skills = req.query.skills as string | undefined;
  const skillList = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const isHirer = payload?.role === 'hirer';
  const isAdmin = payload && ['super_admin', 'hr_manager'].includes(payload.role);

  let where: { status?: string; hirerId?: string; roleCategory?: string; skills?: { hasSome: string[] } } = {};
  if (isAdmin && req.query.hirerId) {
    where.hirerId = req.query.hirerId as string;
  } else if (isHirer) {
    const hirer = await prisma.hirer.findUnique({ where: { userId: payload.userId }, select: { id: true } });
    if (hirer) where.hirerId = hirer.id;
  } else {
    where.status = 'open';
  }
  if (roleCategory) where.roleCategory = roleCategory;
  if (skillList.length > 0) where.skills = { hasSome: skillList };

  const jobs = await prisma.jobRequest.findMany({
    where,
    include: { hirer: { include: { user: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      roleCategory: j.roleCategory,
      skills: j.skills,
      budget: j.budget,
      status: j.status,
      hirer: j.hirer.user,
      createdAt: j.createdAt,
    })),
  });
}
