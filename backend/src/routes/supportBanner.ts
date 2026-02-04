import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { logEvent } from '../controllers/supportBannerController';

const router = Router();

router.use(optionalAuth);

router.post('/events', logEvent);

export { router as supportBannerRoutes };

