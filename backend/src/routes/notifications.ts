import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/v1/notifications — In-dashboard notifications (stub: agreement pending, etc.)
router.get('/', async (req: Request, res: Response) => {
  const { userId } = (req as unknown as { user: { userId: string } }).user;
  const assignedAgreements = await prisma.assignedAgreement.findMany({
    where: { userId, status: 'Pending' },
    include: { agreement: { select: { title: true } } },
  });
  const items = assignedAgreements.map((a) => ({
    id: a.id,
    type: 'agreement_pending',
    title: `Agreement pending: ${a.agreement.title}`,
    createdAt: a.createdAt,
    link: '/dashboard',
  }));
  res.json({ notifications: items });
});

export { router as notificationRoutes };
