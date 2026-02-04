import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as shareMetaController from '../controllers/shareMetaController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/', shareMetaController.listAdmin);
router.post('/', shareMetaController.create);
router.put('/:id', shareMetaController.update);
router.delete('/:id', shareMetaController.remove);

export { router as shareMetaAdminRoutes };

