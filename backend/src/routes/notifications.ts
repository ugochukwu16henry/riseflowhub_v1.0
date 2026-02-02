import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import * as emailController from '../controllers/emailController';

const router = Router();
const prisma = new PrismaClient();

const EMAIL_TYPES = [
  'account_created',
  'consultation_booked',
  'idea_submitted',
  'proposal_ready',
  'agreement_pending',
  'agreement_signed',
  'payment_required',
  'milestone_completed',
  'project_launched',
  'investor_interest_received',
] as const;

const emailValidation = [
  body('type').isIn([...EMAIL_TYPES]).withMessage('Valid type is required'),
  body('userEmail').isEmail().normalizeEmail().withMessage('Valid userEmail is required'),
  body('dynamicData').optional().isObject(),
];

/** POST /api/v1/notifications/email — Send notification email (internal / API key) */
router.post('/email', emailValidation, async (req: Request, res: Response) => {
  const apiKey = process.env.INTERNAL_API_KEY;
  if (apiKey) {
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'];
    if (auth !== apiKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return emailController.sendEmailHandler(req, res);
});

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
