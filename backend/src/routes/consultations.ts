import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as consultationController from '../controllers/consultationController';

const router = Router();

const validation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('country').optional().trim(),
  body('businessIdea').optional().trim(),
  body('stage').optional().trim(),
  body('mainGoal').optional().trim(),
  body('budgetRange').optional().trim(),
  body('preferredContactMethod').optional().trim(),
  body('preferredDate').optional().trim().isISO8601().withMessage('Preferred date must be ISO date'),
  body('preferredTime').optional().trim(),
  body('timezone').optional().trim(),
];

/** POST /api/v1/consultations — Public: book a consultation */
router.post('/', validation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return consultationController.create(req, res);
});

export { router as consultationRoutes };
