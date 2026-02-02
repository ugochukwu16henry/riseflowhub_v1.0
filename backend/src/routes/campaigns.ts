import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as marketingController from '../controllers/marketingController';

const router = Router();

router.use(authMiddleware);

const PLATFORMS = ['Meta', 'Google', 'Email'];

// POST /api/v1/campaigns
router.post(
  '/',
  [
    body('projectId').isUUID(),
    body('platform').isIn(PLATFORMS),
    body('budget').isFloat({ min: 0 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return marketingController.createCampaign(req, res);
  }
);

// GET /api/v1/campaigns/project/:projectId — must be before /:id if we add get-one
router.get('/project/:projectId', [param('projectId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return marketingController.listCampaignsByProject(req, res);
});

export { router as campaignRoutes };
