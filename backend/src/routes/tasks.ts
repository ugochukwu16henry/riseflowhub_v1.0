import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/v1/projects/:id/tasks — :id = projectId
router.post(
  '/:id/tasks',
  requireRoles(UserRole.super_admin, UserRole.project_manager),
  [
    body('title').trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['Todo', 'InProgress', 'Done', 'Blocked']),
    body('assignedToId').optional().isUUID(),
    body('milestoneId').optional().isUUID(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const projectId = req.params.id;
    const { title, description, status, assignedToId, milestoneId, priority, dueDate } = req.body;
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'Todo',
        assignedToId: assignedToId || null,
        milestoneId: milestoneId || null,
        priority: priority || 'Medium',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    res.status(201).json(task);
  }
);

// GET /api/v1/projects/:id/tasks
router.get('/:id/tasks', async (req, res) => {
  const projectId = req.params.id;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { client: true } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer'].includes(payload.role);
  if (!isAdmin && project.client.userId !== payload.userId) {
    return res.status(403).json({ error: 'Cannot view this project tasks' });
  }
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignedTo: { select: { id: true, name: true, email: true } }, milestone: { select: { id: true, title: true, status: true } } },
  });
  res.json(tasks);
});

// PUT /api/v1/projects/:id/tasks/:taskId
router.put('/:id/tasks/:taskId', async (req, res) => {
  const { id: projectId, taskId } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, include: { project: { include: { client: true } } } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer'].includes(payload.role);
  const isAssigned = task.assignedToId === payload.userId;
  if (!isAdmin && task.project.client.userId !== payload.userId && !isAssigned) {
    return res.status(403).json({ error: 'Cannot update this task' });
  }
  const { title, description, status, assignedToId, milestoneId, priority, dueDate } = req.body;
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      status,
      assignedToId,
      milestoneId: milestoneId !== undefined ? milestoneId || null : undefined,
      priority: priority !== undefined ? priority : undefined,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
    },
  });
  res.json(updated);
});

// DELETE /api/v1/projects/:id/tasks/:taskId
router.delete('/:id/tasks/:taskId', requireRoles(UserRole.super_admin, UserRole.project_manager), async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.taskId } });
  res.status(204).send();
});

export { router as taskRoutes };
