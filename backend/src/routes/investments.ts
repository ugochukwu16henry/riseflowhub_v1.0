import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as investmentController from '../controllers/investmentController';

const router = Router();

router.use(authMiddleware);

// POST /api/v1/investments/express-interest — Investor: express interest or request meeting
router.post(
  '/express-interest',
  [body('startupId').isUUID(), body('requestMeeting').optional().isBoolean()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return investmentController.expressInterest(req, res);
  }
);

// POST /api/v1/investments/commit — Investor: commit (amount, equity)
router.post(
  '/commit',
  [
    body('startupId').isUUID(),
    body('amount').optional().isFloat({ min: 0 }),
    body('equityPercent').optional().isFloat({ min: 0, max: 100 }),
    body('agreementId').optional().isUUID(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return investmentController.commit(req, res);
  }
);

// GET /api/v1/investments — List investments (investor: own; admin: all)
router.get('/', (req, res) => investmentController.list(req, res));

export { router as investmentRoutes };
