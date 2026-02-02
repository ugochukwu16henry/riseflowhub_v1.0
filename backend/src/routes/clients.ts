import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/v1/clients — create client profile (link to user)
router.post(
  '/',
  requireRoles(UserRole.super_admin, UserRole.project_manager),
  [
    body('userId').isUUID(),
    body('businessName').trim().notEmpty(),
    body('industry').optional().trim(),
    body('ideaSummary').optional().trim(),
    body('budgetRange').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { userId, businessName, industry, ideaSummary, budgetRange } = req.body;
    const existing = await prisma.client.findUnique({ where: { userId } });
    if (existing) return res.status(400).json({ error: 'Client profile already exists for this user' });
    const client = await prisma.client.create({
      data: { userId, businessName, industry, ideaSummary, budgetRange },
    });
    res.status(201).json(client);
  }
);

// GET /api/v1/clients — list (admin only, tenant-scoped)
router.get('/', requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin), async (req, res) => {
  const payload = (req as unknown as { user: { tenantId?: string | null } }).user;
  const tenantFilter = payload.tenantId != null ? { user: { tenantId: payload.tenantId } } : { user: { tenantId: null } };
  const clients = await prisma.client.findMany({
    where: tenantFilter,
    include: { user: { select: { id: true, name: true, email: true, role: true, tenantId: true } } },
  });
  res.json(clients);
});

// GET /api/v1/clients/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  if (client.userId !== payload.userId && payload.role !== 'super_admin' && payload.role !== 'project_manager') {
    return res.status(403).json({ error: 'Cannot view this client' });
  }
  res.json(client);
});

// PUT /api/v1/clients/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return res.status(404).json({ error: 'Client not found' });
  if (client.userId !== payload.userId && payload.role !== 'super_admin' && payload.role !== 'project_manager') {
    return res.status(403).json({ error: 'Cannot update this client' });
  }
  const { businessName, industry, ideaSummary, budgetRange } = req.body;
  const updated = await prisma.client.update({
    where: { id },
    data: { businessName, industry, ideaSummary, budgetRange },
  });
  res.json(updated);
});

export { router as clientRoutes };
