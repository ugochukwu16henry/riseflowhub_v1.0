import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as milestoneController from '../controllers/milestoneController';

const router = Router();

router.use(authMiddleware);

// PUT /api/v1/milestones/:id
router.put(
  '/:id',
  [param('id').isUUID(), body('title').optional().trim(), body('status').optional().isIn(['Pending', 'InProgress', 'Completed']), body('dueDate').optional().isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestoneController.updateMilestone(req, res);
  }
);

// DELETE /api/v1/milestones/:id
router.delete(
  '/:id',
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return milestoneController.deleteMilestone(req, res);
  }
);

export { router as milestoneRoutes };
