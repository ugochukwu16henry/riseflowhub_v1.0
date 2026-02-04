import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as faqController from '../controllers/faqController';

const router = Router();

// Public FAQ list + search
router.get('/', faqController.list);

// Admin CMS endpoints
router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/admin', faqController.adminList);
router.post('/admin', faqController.create);
router.put('/admin/:id', faqController.update);
router.delete('/admin/:id', faqController.remove);

export { router as faqRoutes };

