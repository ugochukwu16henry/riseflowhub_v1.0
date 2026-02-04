import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { convertToUsd, convertUsdToCurrency } from '../services/currencyService';

const router = Router();

router.use(authMiddleware);

// GET /api/currency — basic currency conversion using open exchange API (already wired in currencyService).
// Query params:
// - amount: number (default 1)
// - from: currency code (default USD)
// - to: currency code (default NGN)
router.get('/', async (req, res) => {
  const { amount = '1', from = 'USD', to = 'NGN' } = req.query as {
    amount?: string;
    from?: string;
    to?: string;
  };
  const amt = Number(amount || '1');
  if (Number.isNaN(amt) || amt <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }
  try {
    if (from.toUpperCase() === 'USD') {
      const out = await convertUsdToCurrency(amt, to);
      res.json({ base: 'USD', target: out.currency, rate: out.rate, amount: amt, value: out.amount });
    } else if (to.toUpperCase() === 'USD') {
      const usd = await convertToUsd(amt, from);
      res.json({ base: from.toUpperCase(), target: 'USD', rate: usd / amt, amount: amt, value: usd });
    } else {
      // from -> USD -> to
      const usd = await convertToUsd(amt, from);
      const out = await convertUsdToCurrency(usd, to);
      res.json({ base: from.toUpperCase(), target: out.currency, amount: amt, value: out.amount });
    }
  } catch (err) {
    console.error('[currency] error:', err);
    res.status(502).json({ error: 'Currency conversion unavailable.' });
  }
});

export { router as currencyOpenRoutes };

