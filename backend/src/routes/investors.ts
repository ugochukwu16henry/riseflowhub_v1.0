import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as investorController from '../controllers/investorController';

const router = Router();

// POST /api/v1/investors/register — Public: create user (investor) + Investor profile
router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firmName').optional().trim(),
    body('investmentRangeMin').optional().isFloat({ min: 0 }),
    body('investmentRangeMax').optional().isFloat({ min: 0 }),
    body('industries').optional().trim(),
    body('country').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return investorController.register(req, res);
  }
);

// GET /api/v1/investors/me — Current investor profile (investor only)
router.get('/me', authMiddleware, (req, res) => investorController.me(req, res));

// GET /api/v1/investors — List all investors (admin) or current investor profile (investor)
router.get('/', authMiddleware, (req, res) => investorController.list(req, res));

export { router as investorRoutes };
