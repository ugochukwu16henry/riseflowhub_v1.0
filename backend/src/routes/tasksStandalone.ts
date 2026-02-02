import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/tasks/me — List tasks assigned to current user (for team dashboard)
router.get('/me', async (req: Request, res: Response) => {
  const payload = (req as unknown as { user: { userId: string } }).user;
  const tasks = await prisma.task.findMany({
    where: { assignedToId: payload.userId },
    include: {
      project: { select: { id: true, projectName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      milestone: { select: { id: true, title: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
  res.json(tasks);
});

// GET /api/v1/tasks?projectId= — List tasks by project (convenience)
router.get('/', async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId query is required' });
  }
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { client: true } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(payload.role);
  const isClient = project.client.userId === payload.userId;
  const isAssigned = await prisma.task.findFirst({ where: { projectId, assignedToId: payload.userId } }).then(Boolean);
  if (!isAdmin && !isClient && !isAssigned) {
    return res.status(403).json({ error: 'Cannot view this project tasks' });
  }
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignedTo: { select: { id: true, name: true, email: true } }, milestone: { select: { id: true, title: true, status: true } } },
  });
  res.json(tasks);
});

export { router as tasksStandaloneRoutes };
