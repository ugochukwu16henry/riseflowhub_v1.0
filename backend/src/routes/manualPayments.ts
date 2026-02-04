import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as manualPaymentController from '../controllers/manualPaymentController';

const router = Router();

router.use(authMiddleware);

// User creates a manual bank transfer record after paying offline
router.post('/', manualPaymentController.create);

export { router as manualPaymentRoutes };

