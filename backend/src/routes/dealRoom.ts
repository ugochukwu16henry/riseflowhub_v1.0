import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as dealRoomController from '../controllers/dealRoomController';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/deal-room — List startups in Deal Room (approved + investorReady)
router.get('/', dealRoomController.list);

// GET /api/v1/deal-room/admin/deals — Admin: list deals (must be before /:startupId)
router.get('/admin/deals', dealRoomController.adminDeals);

// GET /api/v1/deal-room/saved — List saved startup IDs (investor only)
router.get('/saved', dealRoomController.listSaved);

// POST /api/v1/deal-room/save — Save startup (investor only)
router.post(
  '/save',
  [body('startupId').isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return dealRoomController.saveStartup(req, res);
  }
);

// POST /api/v1/deal-room/messages — Send message (investmentId, message)
router.post(
  '/messages',
  [body('investmentId').isUUID(), body('message').trim().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return dealRoomController.sendMessage(req, res);
  }
);

// GET /api/v1/deal-room/messages/:investmentId — List messages for a deal
router.get('/messages/:investmentId', [param('investmentId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return dealRoomController.listMessages(req, res);
});

// DELETE /api/v1/deal-room/save/:startupId — Unsave (investor only)
router.delete('/save/:startupId', [param('startupId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return dealRoomController.unsaveStartup(req, res);
});

// GET /api/v1/deal-room/:startupId — Startup profile for Deal Room (record view if investor)
router.get('/:startupId', [param('startupId').isUUID()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return dealRoomController.getStartup(req, res);
});

export { router as dealRoomRoutes };
