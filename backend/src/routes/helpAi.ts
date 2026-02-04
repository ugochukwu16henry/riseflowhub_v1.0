import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as helpAiController from '../controllers/helpAiController';

const router = Router();

router.use(authMiddleware);

router.post('/ask', helpAiController.ask);

export { router as helpAiRoutes };

