import { Router } from 'express';
import { authMiddleware, requireSuperAdmin, optionalAuth } from '../middleware/auth';
import * as cmsController from '../controllers/cmsController';

const router = Router();

// Public read (no auth)
router.get('/page/:pageName', cmsController.getByPage);
router.get('/:key', cmsController.getByKey);

// Track Revenue Model section view (optional auth — log userId when present)
router.post('/revenue-model-view', optionalAuth, cmsController.trackRevenueModelView);

// Super Admin write
router.post('/', authMiddleware, requireSuperAdmin, cmsController.create);
router.put('/page/:pageName', authMiddleware, requireSuperAdmin, cmsController.bulkUpdatePage);
router.put('/:key', authMiddleware, requireSuperAdmin, cmsController.update);
router.delete('/:key', authMiddleware, requireSuperAdmin, cmsController.remove);

export { router as cmsRoutes };
