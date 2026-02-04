import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as manualPaymentAdminController from '../controllers/manualPaymentAdminController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/', manualPaymentAdminController.list);
router.post('/:id/confirm', manualPaymentAdminController.confirm);
router.post('/:id/reject', manualPaymentAdminController.reject);

export { router as manualPaymentAdminRoutes };

