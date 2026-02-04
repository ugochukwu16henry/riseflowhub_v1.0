import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { embedText } from '../services/embeddingService';

const router = Router();

router.use(authMiddleware);

// POST /api/embeddings — get embeddings for a list of texts (for FAISS/Milvus/Weaviate usage)
router.post('/', async (req, res) => {
  const { texts } = req.body as { texts?: string[] };
  if (!Array.isArray(texts) || !texts.length) {
    res.status(400).json({ error: 'texts must be a non-empty array' });
    return;
  }
  try {
    const vectors = await embedText(texts);
    res.json({ vectors });
  } catch (err) {
    console.error('[embeddings] error:', err);
    res.status(502).json({ error: 'Embedding service unavailable.' });
  }
});

export { router as embeddingsRoutes };

