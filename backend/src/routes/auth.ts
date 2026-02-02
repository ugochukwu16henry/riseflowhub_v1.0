import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

const signupLoginValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn([
    'client',
    'developer',
    'designer',
    'marketer',
    'project_manager',
    'finance_admin',
    'super_admin',
    'investor',
  ]),
];

// POST /api/v1/auth/register — Create user (legacy)
router.post('/register', signupLoginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.signup(req, res);
});

// POST /api/v1/auth/signup — Create user (alias)
router.post('/signup', signupLoginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.signup(req, res);
});

// POST /api/v1/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return authController.login(req, res);
  }
);

// GET /api/v1/auth/me — Logged-in user profile
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));

export { router as authRoutes };
