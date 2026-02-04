import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as earlyAccessController from '../controllers/earlyAccessController';

const router = Router();

// Public: program capacity status
router.get('/status', earlyAccessController.status);

// Authenticated: current user's enrollment/progress
router.get('/me', authMiddleware, earlyAccessController.me);

export { router as earlyAccessRoutes };

