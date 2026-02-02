import { Router } from 'express';
import { param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as marketingController from '../controllers/marketingController';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/analytics/:projectId
router.get('/:projectId', [param('projectId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return marketingController.getAnalytics(req, res);
});

export { router as analyticsRoutes };
