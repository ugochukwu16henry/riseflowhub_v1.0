import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as superAdminController from '../controllers/superAdminController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/overview', superAdminController.overview);
router.get('/payments', superAdminController.payments);
router.get('/activity', superAdminController.activity);
router.get('/audit-logs', superAdminController.auditLogs);
router.get('/reports', superAdminController.reports);
router.get('/consultations', superAdminController.consultations);

export { router as superAdminRoutes };
