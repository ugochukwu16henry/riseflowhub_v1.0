import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import * as uploadController from '../controllers/uploadController';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.use(authMiddleware);

router.post(
  '/',
  upload.single('file'),
  (req, res, next) => {
    if (!req.file && (req as any).files) {
      const files = (req as any).files;
      if (Array.isArray(files) && files[0]) (req as any).file = files[0];
      else if (files?.file) (req as any).file = files.file;
    }
    next();
  },
  uploadController.upload
);

export const uploadRoutes = router;
