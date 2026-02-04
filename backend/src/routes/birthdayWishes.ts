import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as birthdayWishesController from '../controllers/birthdayWishesController';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.get('/today', birthdayWishesController.today);
router.post('/send', birthdayWishesController.send);
router.get('/logs', birthdayWishesController.logs);

export { router as birthdayWishesRoutes };

