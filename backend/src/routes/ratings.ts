import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as talentRatingsController from '../controllers/talentRatingsController';

const router = Router();

// List ratings: public with query toUserId or hireId (no auth required for viewing)
router.get('/', talentRatingsController.list);

router.use(authMiddleware);

// Submit rating: auth required
router.post('/', talentRatingsController.create);

export const ratingsRoutes = router;
