import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import * as adminLeadsController from '../controllers/adminLeadsController';

const router = Router();

router.use(authMiddleware);
router.use(requireRoles(UserRole.super_admin, UserRole.project_manager, UserRole.finance_admin));

const STATUSES = ['New', 'Contacted', 'ProposalSent', 'Converted', 'Closed'];

// GET /api/v1/admin/leads — list leads (optional ?status=)
router.get('/', (req, res) => adminLeadsController.list(req, res));

// GET /api/v1/admin/leads/:id — single lead with notes
router.get(
  '/:id',
  [param('id').isUUID()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.getOne(req, res);
  }
);

// POST /api/v1/admin/leads — create lead (manual)
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('email').trim().isEmail(),
    body('country').optional().trim(),
    body('ideaSummary').optional().trim(),
    body('stage').optional().trim(),
    body('goal').optional().trim(),
    body('budget').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.create(req, res);
  }
);

// PUT /api/v1/admin/leads/:id/status — update status (Converted → auto-create project)
router.put(
  '/:id/status',
  [param('id').isUUID(), body('status').isIn(STATUSES)],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.updateStatus(req, res);
  }
);

// PUT /api/v1/admin/leads/:id/assign — assign team member
router.put(
  '/:id/assign',
  [param('id').isUUID(), body('assignedToId').optional().isUUID()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.assign(req, res);
  }
);

// POST /api/v1/admin/leads/:id/notes — add note
router.post(
  '/:id/notes',
  [param('id').isUUID(), body('content').trim().notEmpty()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.addNote(req, res);
  }
);

// GET /api/v1/admin/leads/:id/notes — list notes
router.get(
  '/:id/notes',
  [param('id').isUUID()],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return adminLeadsController.listNotes(req, res);
  }
);

export { router as adminLeadsRoutes };
