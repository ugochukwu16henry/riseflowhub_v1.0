import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware, requireSuperAdmin } from '../middleware/auth';
import * as teamController from '../controllers/teamController';

const router = Router();

// Public: accept invite (no auth)
router.get('/invite/accept', (req, res) => teamController.getAcceptInvite(req, res));
router.post(
  '/invite/accept',
  [
    body('token').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return teamController.postAcceptInvite(req, res);
  }
);

// Protected: Super Admin only
router.use(authMiddleware);

router.get('/', requireSuperAdmin, teamController.list);
router.post(
  '/invite',
  requireSuperAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isString().trim(),
    body('customRoleId').optional().isUUID(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return teamController.invite(req, res);
  }
);

// /roles before /:userId so "roles" is not parsed as userId
router.get('/roles', requireSuperAdmin, teamController.listCustomRoles);
router.post(
  '/roles',
  requireSuperAdmin,
  [
    body('name').trim().notEmpty(),
    body('department').optional().trim(),
    body('level').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return teamController.createCustomRole(req, res);
  }
);

router.patch(
  '/:userId',
  requireSuperAdmin,
  [
    body('role').optional().isString().trim(),
    body('customRoleId').optional().isUUID(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return teamController.updateMember(req, res);
  }
);
router.delete('/:userId', requireSuperAdmin, teamController.deleteMember);

export { router as teamRoutes };
