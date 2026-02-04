import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { requireRoles } from '../middleware/auth';
import * as businessModuleController from '../controllers/businessModuleController';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles(UserRole.client, UserRole.cofounder, UserRole.super_admin));

router.get('/status', businessModuleController.status);
router.get('/growth', businessModuleController.getGrowth);
router.post('/growth', businessModuleController.updateGrowth);
router.get('/financials', businessModuleController.listFinancials);
router.post('/financials', businessModuleController.upsertFinancial);
router.get('/reports', businessModuleController.exportReport);

export { router as businessRoutes };

