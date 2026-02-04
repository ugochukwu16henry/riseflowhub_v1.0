import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as legalController from '../controllers/legalController';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles(UserRole.legal_team, UserRole.super_admin));

router.get('/agreements', legalController.listAgreements);

export const legalRoutes = router;
