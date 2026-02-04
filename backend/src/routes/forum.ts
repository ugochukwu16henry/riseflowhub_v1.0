import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as forumController from '../controllers/forumController';

const router = Router();

// Public listing & view
router.get('/posts', forumController.listPosts);
router.get('/posts/:id', forumController.getPost);

// Auth required for interactions
router.use(authMiddleware);
router.post('/posts', forumController.createPost);
router.post('/posts/:id/comments', forumController.addComment);
router.post('/posts/:id/like', forumController.toggleLike);
router.delete('/posts/:id', forumController.removePost);

export { router as forumRoutes };

