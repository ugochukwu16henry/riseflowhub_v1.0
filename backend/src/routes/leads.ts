import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as marketingController from '../controllers/marketingController';

const router = Router();

router.use(authMiddleware);

// POST /api/v1/leads/import
router.post(
  '/import',
  [
    body('campaignId').isUUID(),
    body('leads').isArray(),
    body('leads.*.source').optional().trim(),
    body('leads.*.cost').isFloat({ min: 0 }),
    body('leads.*.conversionStatus').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return marketingController.importLeads(req, res);
  }
);

export { router as leadRoutes };
