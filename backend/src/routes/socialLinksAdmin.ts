import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as socialMediaController from '../controllers/socialMediaController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/', socialMediaController.listAdmin);
router.post('/', socialMediaController.create);
router.put('/:id', socialMediaController.update);
router.delete('/:id', socialMediaController.remove);
router.patch('/:id/toggle', socialMediaController.toggle);

export { router as socialLinksAdminRoutes };

