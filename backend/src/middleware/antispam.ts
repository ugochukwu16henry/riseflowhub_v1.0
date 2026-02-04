/**
 * Anti-spam: rate limiting and optional reCAPTCHA v2/v3 verification.
 * Apply to: talent apply, partner form, hirer register.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY?.trim();

/** 5 submissions per hour per IP for application/partner/hirer forms */
export const formRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Try again in an hour.' },
  standardHeaders: true,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
    return ip;
  },
});

/** Verify reCAPTCHA token (body.recaptchaToken or body.recaptcha). If no secret set, skip. If token missing and secret set, reject. */
export async function verifyRecaptcha(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!RECAPTCHA_SECRET) {
    next();
    return;
  }
  const token = (req.body?.recaptchaToken || req.body?.recaptcha) as string | undefined;
  if (!token?.trim()) {
    res.status(400).json({ error: 'reCAPTCHA token required. Include recaptchaToken in body.' });
    return;
  }
  try {
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(token.trim())}`;
    const resp = await fetch(url, { method: 'POST' });
    const data = (await resp.json()) as { success?: boolean; score?: number; 'error-codes'?: string[] };
    if (!data.success) {
      const codes = data['error-codes'] || [];
      if (codes.includes('timeout-or-duplicate')) {
        res.status(400).json({ error: 'reCAPTCHA expired. Please try again.' });
        return;
      }
      res.status(400).json({ error: 'reCAPTCHA verification failed.' });
      return;
    }
    (req as Request & { recaptchaScore?: number }).recaptchaScore = data.score;
    next();
  } catch (err) {
    res.status(502).json({ error: 'CAPTCHA verification unavailable.' });
  }
}
