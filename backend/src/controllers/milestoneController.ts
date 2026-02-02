import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const MILESTONE_STATUSES = ['Pending', 'InProgress', 'Completed'] as const;

async function checkProjectAccess(projectId: string, userId: string, role: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project) return false;
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(role);
  if (isAdmin) return true;
  if (project.client.userId === userId) return true;
  const assigned = await prisma.task.findFirst({
    where: { projectId, assignedToId: userId },
  });
  return !!assigned;
}

/** POST /api/v1/projects/:id/milestones */
export async function createMilestone(req: Request, res: Response): Promise<void> {
  const { id: projectId } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const allowed = await checkProjectAccess(projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot add milestone to this project' });
    return;
  }
  const { title, status, dueDate } = req.body as { title?: string; status?: string; dueDate?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title: title.trim(),
      status: status && MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number]) ? (status as (typeof MILESTONE_STATUSES)[number]) : 'Pending',
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  res.status(201).json(milestone);
}

/** GET /api/v1/projects/:id/milestones */
export async function listMilestones(req: Request, res: Response): Promise<void> {
  const { id: projectId } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const allowed = await checkProjectAccess(projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot view this project milestones' });
    return;
  }
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    include: { tasks: { select: { id: true, title: true, status: true } } },
    orderBy: { dueDate: 'asc' },
  });
  res.json(milestones);
}

/** PUT /api/v1/milestones/:id */
export async function updateMilestone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const milestone = await prisma.milestone.findUnique({ where: { id }, include: { project: { include: { client: true } } } });
  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  const allowed = await checkProjectAccess(milestone.projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot update this milestone' });
    return;
  }
  const { title, status, dueDate } = req.body as { title?: string; status?: string; dueDate?: string };
  const updated = await prisma.milestone.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(status !== undefined && MILESTONE_STATUSES.includes(status as (typeof MILESTONE_STATUSES)[number]) && { status: status as (typeof MILESTONE_STATUSES)[number] }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
  });
  res.json(updated);
}

/** DELETE /api/v1/milestones/:id */
export async function deleteMilestone(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  const milestone = await prisma.milestone.findUnique({ where: { id } });
  if (!milestone) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  const allowed = await checkProjectAccess(milestone.projectId, userId, role);
  if (!allowed) {
    res.status(403).json({ error: 'Cannot delete this milestone' });
    return;
  }
  await prisma.milestone.delete({ where: { id } });
  res.status(204).send();
}
