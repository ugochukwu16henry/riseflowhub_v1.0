import { Router } from 'express';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as partnerController from '../controllers/partnerController';

const router = Router();

// Public: submit Partner With Us form
router.post('/', partnerController.submit);

// Super Admin: list inquiries
router.get('/', authMiddleware, requireSuperAdmin, partnerController.list);

export const partnerRoutes = router;
