import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as milestoneController from '../controllers/milestoneController';

const router = Router();
const prisma = new PrismaClient();

const PROJECT_STATUSES = ['IdeaSubmitted', 'ReviewValidation', 'ProposalSent', 'Development', 'Testing', 'Live', 'Maintenance'] as const;

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
    body('status').optional().isIn([...PROJECT_STATUSES]),
    body('budget').optional().isFloat({ min: 0 }),
    body('startDate').optional().isISO8601(),
    body('deadline').optional().isISO8601(),
    body('repoUrl').optional().trim().isURL(),
    body('liveUrl').optional().trim().isURL(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { clientId, projectName, description, stage, status, budget, startDate, deadline, repoUrl, liveUrl } = req.body;
    const project = await prisma.project.create({
      data: {
        clientId,
        projectName,
        description,
        stage: stage || 'Planning',
        status: status || 'IdeaSubmitted',
        budget: budget != null ? budget : null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        repoUrl: repoUrl || null,
        liveUrl: liveUrl || null,
      },
    });
    res.status(201).json(project);
  }
);

// GET /api/v1/projects — all (admin) or own (client); team: assigned only
router.get('/', async (req, res) => {
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(payload.role);
  if (isAdmin) {
    const projects = await prisma.project.findMany({
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
        tasks: { select: { id: true, title: true, status: true } },
        milestones: { select: { id: true, title: true, status: true } },
      },
    });
    return res.json(projects);
  }
  const client = await prisma.client.findUnique({ where: { userId: payload.userId } });
  if (client) {
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: { tasks: { select: { id: true, title: true, status: true } }, milestones: { select: { id: true, title: true, status: true } } },
    });
    return res.json(projects);
  }
  // Team: assigned tasks only → projects from those tasks
  const assignedTaskIds = await prisma.task.findMany({
    where: { assignedToId: payload.userId },
    select: { projectId: true },
  });
  const projectIds = [...new Set(assignedTaskIds.map((t) => t.projectId))];
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    include: { client: { select: { id: true, businessName: true }, include: { user: { select: { name: true, email: true } } } }, tasks: { select: { id: true, title: true, status: true } }, milestones: { select: { id: true, title: true, status: true } } },
  });
  res.json(projects);
});

// POST /api/v1/projects/:id/milestones (must be before GET /:id)
router.post(
  '/:id/milestones',
  [body('title').trim().notEmpty(), body('status').optional().isIn(['Pending', 'InProgress', 'Completed']), body('dueDate').optional().isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestoneController.createMilestone(req, res);
  }
);

// GET /api/v1/projects/:id/milestones
router.get('/:id/milestones', (req, res) => milestoneController.listMilestones(req, res));

// GET /api/v1/projects/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: { include: { assignedTo: { select: { id: true, name: true, email: true } }, milestone: { select: { id: true, title: true } } } },
      milestones: true,
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const isAdmin = ['super_admin', 'project_manager', 'developer', 'designer', 'marketer', 'finance_admin'].includes(payload.role);
  const isClient = project.client.userId === payload.userId;
  const isAssigned = await prisma.task.findFirst({ where: { projectId: id, assignedToId: payload.userId } }).then(Boolean);
  if (!isAdmin && !isClient && !isAssigned) {
    return res.status(403).json({ error: 'Cannot view this project' });
  }
  res.json(project);
});

// PUT /api/v1/projects/:id
router.put('/:id', requireRoles(UserRole.super_admin, UserRole.project_manager), async (req, res) => {
  const { id } = req.params;
  const { projectName, description, stage, status, progressPercent, budget, startDate, deadline, repoUrl, liveUrl } = req.body;
  const project = await prisma.project.update({
    where: { id },
    data: {
      projectName,
      description,
      stage,
      status,
      progressPercent,
      budget: budget !== undefined ? (budget == null ? null : budget) : undefined,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
      repoUrl: repoUrl !== undefined ? repoUrl || null : undefined,
      liveUrl: liveUrl !== undefined ? liveUrl || null : undefined,
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
