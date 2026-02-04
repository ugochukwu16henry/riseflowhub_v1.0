import { Router } from 'express';
import { authMiddleware, requireRoles, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as jobRequestController from '../controllers/jobRequestController';

const router = Router();

// List: public (open jobs only) or auth (hirer own, admin all)
router.get('/', optionalAuth, jobRequestController.list);

router.use(authMiddleware);

// Hirer: post job request
router.post('/', requireRoles(UserRole.hirer, UserRole.hiring_company), jobRequestController.create);

export const jobRequestRoutes = router;
