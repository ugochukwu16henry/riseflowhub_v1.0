import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const TRANSLATE_BASE_URL = (process.env.TRANSLATE_BASE_URL || 'https://libretranslate.com').replace(/\/+$/, '');

router.use(authMiddleware);

// POST /api/translate — translate text via LibreTranslate-compatible API
router.post('/', async (req, res) => {
  const { text, source = 'auto', target } = req.body as { text?: string; source?: string; target?: string };
  if (!text?.trim() || !target) {
    res.status(400).json({ error: 'text and target are required' });
    return;
  }
  try {
    const r = await fetch(`${TRANSLATE_BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      throw new Error(`Translate error ${r.status}: ${body}`);
    }
    const data = (await r.json()) as { translatedText?: string };
    res.json({ translated: data.translatedText ?? '' });
  } catch (err) {
    console.error('[translate] error:', err);
    res.status(502).json({ error: 'Translation service unavailable. Please try again later.' });
  }
});

export { router as translateRoutes };

