import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as tourController from '../controllers/tourController';

const router = Router();

router.use(authMiddleware);

router.get('/progress', tourController.listProgress);
router.post('/:tourName/complete', tourController.markComplete);

export { router as tourRoutes };

