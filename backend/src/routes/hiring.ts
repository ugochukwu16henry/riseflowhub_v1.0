import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as hiringController from '../controllers/hiringController';

const router = Router();

// Public: hiring config (role categories, skills, fees from CMS)
router.get('/config', hiringController.getConfig);

router.use(authMiddleware);

// Hirer: send hire request
router.post('/hire/:talentId', requireRoles(UserRole.hirer), hiringController.createHire);

// Talent, Hirer, or Admin: list hires
router.get('/hires', requireRoles(UserRole.talent, UserRole.hirer, UserRole.super_admin, UserRole.hr_manager, UserRole.legal_team), hiringController.listHires);

// HR / Super Admin: create hire contract agreement
router.post('/agreement', requireRoles(UserRole.super_admin, UserRole.hr_manager), hiringController.createHireAgreement);

// Update hire status (talent, hirer, or admin)
router.patch('/hires/:id', requireRoles(UserRole.talent, UserRole.hirer, UserRole.super_admin, UserRole.hr_manager), hiringController.updateHireStatus);

export const hiringRoutes = router;
