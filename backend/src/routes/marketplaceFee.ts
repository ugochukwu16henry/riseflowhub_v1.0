import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as marketplaceFeeController from '../controllers/marketplaceFeeController';

const router = Router();

router.use(authMiddleware);

router.post('/create-session', marketplaceFeeController.createSession);
router.post('/verify', marketplaceFeeController.verify);

export const marketplaceFeeRoutes = router;
