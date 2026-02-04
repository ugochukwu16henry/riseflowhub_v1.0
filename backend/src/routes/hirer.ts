import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as hirerController from '../controllers/hirerController';

const router = Router();

// Register: optional auth
router.post('/register', optionalAuth, hirerController.register);

router.use(authMiddleware);

// Own profile
router.get('/profile', requireRoles(UserRole.hirer), hirerController.profile);

// Hirer: sign Fair Treatment Agreement
router.post('/fair-treatment/sign', requireRoles(UserRole.hirer), hirerController.signFairTreatment);

// Admin: list all hirers
router.get('/', requireRoles(UserRole.super_admin, UserRole.hr_manager), hirerController.list);

export const hirerRoutes = router;
