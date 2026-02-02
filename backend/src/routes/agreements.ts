import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as agreementController from '../controllers/agreementController';

const router = Router();

router.use(authMiddleware);

// —— Must be before /:id ——
// GET /api/v1/agreements/assigned — List agreements assigned to logged-in user
router.get('/assigned', (req, res) => agreementController.listAssigned(req, res));

// GET /api/v1/agreements/assignments — List all assigned agreements (admin table)
router.get(
  '/assignments',
  requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin),
  (req, res) => agreementController.listAssignedForAdmin(req, res)
);

// —— CRUD (admin only) ——
// POST /api/v1/agreements — Create template
router.post(
  '/',
  requireRoles(UserRole.super_admin),
  [body('title').trim().notEmpty(), body('type').isIn(['NDA', 'MOU', 'CoFounder', 'Terms']), body('templateUrl').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return agreementController.createAgreement(req, res);
  }
);

// GET /api/v1/agreements — List templates
router.get(
  '/',
  requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin),
  (req, res) => agreementController.listAgreements(req, res)
);

// GET /api/v1/agreements/:id — Get one template
router.get(
  '/:id',
  requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin),
  (req, res) => agreementController.getAgreement(req, res)
);

// PUT /api/v1/agreements/:id — Update template
router.put(
  '/:id',
  requireRoles(UserRole.super_admin),
  [param('id').isUUID(), body('title').optional().trim(), body('type').optional().isIn(['NDA', 'MOU', 'CoFounder', 'Terms']), body('templateUrl').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return agreementController.updateAgreement(req, res);
  }
);

// DELETE /api/v1/agreements/:id — Delete template
router.delete(
  '/:id',
  requireRoles(UserRole.super_admin),
  [param('id').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return agreementController.deleteAgreement(req, res);
  }
);

// POST /api/v1/agreements/:id/assign — Assign to user(s)
router.post(
  '/:id/assign',
  requireRoles(UserRole.super_admin),
  [param('id').isUUID(), body('userId').optional().isUUID(), body('userIds').optional().isArray(), body('deadline').optional().isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return agreementController.assignAgreement(req, res);
  }
);

// GET /api/v1/agreements/:id/view — View agreement (user); logs viewed
router.get('/:id/view', (req, res) => agreementController.viewAgreement(req, res));

// POST /api/v1/agreements/:id/sign — Sign agreement
router.post(
  '/:id/sign',
  [body('signatureText').optional().trim(), body('signatureUrl').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return agreementController.signAgreement(req, res);
  }
);

// GET /api/v1/agreements/:id/status — Assignment status (admin)
router.get(
  '/:id/status',
  requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin),
  (req, res) => agreementController.getStatus(req, res)
);

// GET /api/v1/agreements/:id/logs — Audit logs (admin)
router.get(
  '/:id/logs',
  requireRoles(UserRole.super_admin),
  (req, res) => agreementController.getLogs(req, res)
);

export { router as agreementRoutes };
