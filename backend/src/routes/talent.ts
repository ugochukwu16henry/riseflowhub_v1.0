import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as talentController from '../controllers/talentController';

const router = Router();

// Public: list approved talents (marketplace)
router.get('/marketplace', talentController.marketplace);

// Apply: optional auth (can sign up new user or add profile to existing)
router.post('/apply', optionalAuth, talentController.apply);

// Below: auth required
router.use(authMiddleware);

// Own profile
router.get('/profile', requireRoles(UserRole.talent), talentController.profile);
router.put('/profile', requireRoles(UserRole.talent), talentController.updateProfile);

// HR / Super Admin: list all talents, approve/reject
router.get('/', requireRoles(UserRole.super_admin, UserRole.cofounder, UserRole.hr_manager), talentController.list);
router.put('/:id/approve', requireRoles(UserRole.super_admin, UserRole.cofounder, UserRole.hr_manager), talentController.approve);

export const talentRoutes = router;
