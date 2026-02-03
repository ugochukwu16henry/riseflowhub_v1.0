import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as workspaceController from '../controllers/workspaceController';

const router = Router();

router.use(authMiddleware);

router.get('/:projectId', workspaceController.getWorkspace);
router.patch(
  '/:projectId',
  [
    body('projectName').optional().trim(),
    body('tagline').optional().trim(),
    body('problemStatement').optional().trim(),
    body('targetMarket').optional().trim(),
    body('workspaceStage').optional().isIn(['Idea', 'Validation', 'Building', 'Growth']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return workspaceController.updateWorkspace(req, res);
  }
);

router.get('/:projectId/idea-vault', workspaceController.listIdeaVault);
router.post(
  '/:projectId/idea-vault',
  [
    body('type').optional().isIn(['note', 'pitch_draft']),
    body('title').optional().trim(),
    body('content').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return workspaceController.createIdeaVaultItem(req, res);
  }
);
router.patch(
  '/:projectId/idea-vault/:itemId',
  [
    body('title').optional().trim(),
    body('content').optional().trim(),
    body('status').optional().isIn(['draft', 'submitted_for_review']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return workspaceController.updateIdeaVaultItem(req, res);
  }
);
router.delete('/:projectId/idea-vault/:itemId', workspaceController.deleteIdeaVaultItem);

router.get('/:projectId/business-model', workspaceController.getBusinessModel);
router.patch(
  '/:projectId/business-model',
  [
    body('valueProposition').optional().trim(),
    body('customerSegments').optional().trim(),
    body('revenueStreams').optional().trim(),
    body('costStructure').optional().trim(),
    body('channels').optional().trim(),
    body('keyActivities').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return workspaceController.updateBusinessModel(req, res);
  }
);

router.get('/:projectId/team', workspaceController.listProjectTeam);
router.post(
  '/:projectId/team',
  [body('userId').isUUID(), body('role').optional().isIn(['member', 'viewer'])],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return workspaceController.addProjectMember(req, res);
  }
);
router.delete('/:projectId/team/:userId', workspaceController.removeProjectMember);

router.get('/:projectId/files', workspaceController.listWorkspaceFiles);

router.get('/:projectId/investor-view', workspaceController.getInvestorView);
router.get('/:projectId/progress', workspaceController.getProgress);

export { router as workspaceRoutes };
