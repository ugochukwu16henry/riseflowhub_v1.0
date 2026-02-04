import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as badgeController from '../controllers/badgeController';

const router = Router();

router.use(authMiddleware);

router.get('/', badgeController.list);

export { router as badgeRoutes };

