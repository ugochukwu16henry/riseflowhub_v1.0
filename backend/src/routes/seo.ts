import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/seo/meta?page=home — thin wrapper around SocialShareMeta
router.get('/meta', async (req, res) => {
  const { page } = req.query as { page?: string };
  if (!page) {
    res.status(400).json({ error: 'page is required' });
    return;
  }
  try {
    const record = await prisma.socialShareMeta.findUnique({
      where: { pageName: page },
    });
    if (!record) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    console.error('[seo.meta] error:', err);
    res.status(500).json({ error: 'Could not load SEO meta' });
  }
});

export { router as seoRoutes };

