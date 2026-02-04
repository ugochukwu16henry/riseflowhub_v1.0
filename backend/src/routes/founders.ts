import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as founderReputationController from '../controllers/founderReputationController';

const router = Router();

router.use(authMiddleware);

router.get('/me/reputation', founderReputationController.myReputation);
router.get('/:userId/reputation', founderReputationController.getReputation);

export { router as foundersRoutes };

