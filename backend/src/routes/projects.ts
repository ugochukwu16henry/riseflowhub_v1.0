import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/v1/projects
router.post(
  '/',
  requireRoles(UserRole.super_admin, UserRole.project_manager),
  [
    body('clientId').isUUID(),
    body('projectName').trim().notEmpty(),
    body('description').optional().trim(),
    body('stage').optional().isIn(['Planning', 'Development', 'Testing', 'Live']),
    body('startDate').optional().isISO8601(),
    body('deadline').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { clientId, projectName, description, stage, startDate, deadline } = req.body;
    const project = await prisma.project.create({
      data: {
        clientId,
        projectName,
        description,
        stage: stage || 'Planning',
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    res.status(201).json(project);
  }
);

// GET /api/v1/projects — all (admin) or own (client)
router.get('/', async (req, res) => {
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(payload.role);
  if (isAdmin) {
    const projects = await prisma.project.findMany({
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        tasks: { select: { id: true, title: true, status: true } },
      },
    });
    return res.json(projects);
  }
  const client = await prisma.client.findUnique({ where: { userId: payload.userId } });
  if (!client) return res.json([]);
  const projects = await prisma.project.findMany({
    where: { clientId: client.id },
    include: { tasks: { select: { id: true, title: true, status: true } } },
  });
  res.json(projects);
});

// GET /api/v1/projects/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: true,
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(payload.role);
  if (!isAdmin && project.client.userId !== payload.userId) {
    return res.status(403).json({ error: 'Cannot view this project' });
  }
  res.json(project);
});

// PUT /api/v1/projects/:id
router.put('/:id', requireRoles(UserRole.super_admin, UserRole.project_manager), async (req, res) => {
  const { id } = req.params;
  const { projectName, description, stage, progressPercent, startDate, deadline } = req.body;
  const project = await prisma.project.update({
    where: { id },
    data: {
      projectName,
      description,
      stage,
      progressPercent,
      startDate: startDate ? new Date(startDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    },
  });
  res.json(project);
});

// DELETE /api/v1/projects/:id
router.delete('/:id', requireRoles(UserRole.super_admin, UserRole.project_manager), async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export { router as projectRoutes };
