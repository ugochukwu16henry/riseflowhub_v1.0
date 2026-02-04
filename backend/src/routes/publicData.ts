import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET /api/public-data/wikipedia?q=term — lightweight Wikipedia search
router.get('/wikipedia', async (req, res) => {
  const { q } = req.query as { q?: string };
  if (!q?.trim()) {
    res.status(400).json({ error: 'q is required' });
    return;
  }
  try {
    const search = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(
        q.trim()
      )}`
    );
    if (!search.ok) {
      const text = await search.text().catch(() => '');
      throw new Error(`Wikipedia error ${search.status}: ${text}`);
    }
    const data = await search.json();
    res.json(data);
  } catch (err) {
    console.error('[public-data.wikipedia] error:', err);
    res.status(502).json({ error: 'Wikipedia API unavailable.' });
  }
});

export { router as publicDataRoutes };

