import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as tenantController from '../controllers/tenantController';

const router = Router();

router.use(authMiddleware);

const PLAN_TYPES = ['free', 'starter', 'growth', 'enterprise'];

// GET /api/v1/tenants/current — branding for current user's tenant
router.get('/current', (req, res) => tenantController.getCurrent(req, res));

// GET /api/v1/tenants — list all (super_admin only)
router.get('/', (req, res) => tenantController.listAll(req, res));

// POST /api/v1/tenants — create (super_admin only)
router.post(
  '/',
  [
    body('orgName').trim().notEmpty(),
    body('domain').optional().trim(),
    body('logo').optional().trim(),
    body('primaryColor').optional().trim().isLength({ max: 20 }),
    body('planType').optional().isIn(PLAN_TYPES),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return tenantController.create(req, res);
  }
);

// PATCH /api/v1/tenants/:id — update branding / settings
router.patch(
  '/:id',
  [param('id').isUUID()],
  [
    body('orgName').optional().trim().notEmpty(),
    body('domain').optional().trim(),
    body('logo').optional().trim(),
    body('primaryColor').optional().trim().isLength({ max: 20 }),
    body('planType').optional().isIn(PLAN_TYPES),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return tenantController.update(req, res);
  }
);

// GET /api/v1/tenants/:id/billing
router.get('/:id/billing', [param('id').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return tenantController.listBilling(req, res);
});

// POST /api/v1/tenants/:id/billing — create billing record (super_admin)
router.post(
  '/:id/billing',
  [param('id').isUUID()],
  [
    body('periodStart').isISO8601(),
    body('periodEnd').isISO8601(),
    body('amount').isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'paid']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return tenantController.createBilling(req, res);
  }
);

export { router as tenantRoutes };
