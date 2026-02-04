import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import { formRateLimiter, verifyRecaptcha } from '../middleware/antispam';
import * as partnerController from '../controllers/partnerController';

const router = Router();

// Public: submit Partner With Us form (rate limit + optional reCAPTCHA)
router.post('/', formRateLimiter, verifyRecaptcha, partnerController.submit);

// Super Admin: list inquiries
router.get('/', authMiddleware, requireSuperAdmin, partnerController.list);

export const partnerRoutes = router;
