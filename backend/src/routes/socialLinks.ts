import { Router } from 'express';
import * as socialMediaController from '../controllers/socialMediaController';

const router = Router();

// Public: active links for headers/footers and dashboards
router.get('/', socialMediaController.listPublic);

// Optional analytics: click tracking (no auth required)
router.post('/:id/click', socialMediaController.trackClick);

export { router as socialLinksRoutes };

