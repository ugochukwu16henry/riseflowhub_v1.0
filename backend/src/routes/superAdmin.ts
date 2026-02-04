import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as superAdminController from '../controllers/superAdminController';
import * as adminSkillsController from '../controllers/adminSkillsController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/overview', superAdminController.overview);
router.get('/payments', superAdminController.payments);
router.get('/activity', superAdminController.activity);
router.get('/audit-logs', superAdminController.auditLogs);
router.get('/reports', superAdminController.reports);
router.get('/consultations', superAdminController.consultations);

// Skill management (dynamic skills for talent forms and marketplace filters)
router.get('/skills', adminSkillsController.list);
router.post('/skills', adminSkillsController.create);
router.put('/skills/:id', adminSkillsController.update);
router.delete('/skills/:id', adminSkillsController.remove);

export { router as superAdminRoutes };
