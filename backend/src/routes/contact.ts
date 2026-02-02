import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as contactController from '../controllers/contactController';

const router = Router();

const validation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').optional().trim(),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

/** POST /api/v1/contact — Public: submit contact message */
router.post('/', validation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return contactController.create(req, res);
});

export { router as contactRoutes };
