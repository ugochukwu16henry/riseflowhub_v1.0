import { Router } from 'express';
import * as shareMetaController from '../controllers/shareMetaController';

const router = Router();

// Public: fetch share metadata for a page
router.get('/:page', shareMetaController.getByPage);

export { router as shareMetaRoutes };

