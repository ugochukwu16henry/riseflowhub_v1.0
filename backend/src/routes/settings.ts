import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import * as settingsController from '../controllers/settingsController';

const router = Router();

router.use(authMiddleware);

// Profile & company
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);

// Security
router.put('/security/email', [body('newEmail').isEmail(), body('password').notEmpty()], settingsController.updateEmail);
router.put('/security/password', [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 8 })], settingsController.updatePassword);
router.post('/security/2fa-enable', [body('enabled').isBoolean()], settingsController.enable2FA);
router.get('/security/sessions', settingsController.listSessions);
router.delete('/security/sessions/:id', settingsController.revokeSession);

// Notifications
router.get('/notifications', settingsController.getNotificationSettings);
router.put('/notifications', settingsController.updateNotificationSettings);

// Account deletion
router.post('/delete-request', settingsController.requestDelete);
router.post('/delete-cancel', settingsController.cancelDelete);

export { router as settingsRoutes };

