import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/users?role=developer
router.get('/', requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin), async (req, res) => {
  const role = req.query.role as string | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role: role as UserRole } : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(users);
});

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  if (payload.userId !== id && payload.role !== 'super_admin' && payload.role !== 'project_manager') {
    return res.status(403).json({ error: 'Cannot view other users' });
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/v1/users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const payload = (req as unknown as { user: { userId: string; role: string } }).user;
  if (payload.userId !== id && payload.role !== 'super_admin') {
    return res.status(403).json({ error: 'Cannot update other users' });
  }
  const { name } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: name ? { name } : undefined,
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
});

export { router as userRoutes };
