import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { convertUsdToCurrency } from '../services/currencyService';
import { createAuditLog } from '../services/auditLogService';
import { getPricingConfig, IDEA_STARTER_SETUP_FEE_USD, INVESTOR_SETUP_FEE_USD } from '../config/pricing';

const prisma = new PrismaClient();

/** GET /api/v1/setup-fee/config — Public: centralized pricing config (Idea Starter setup fee, etc.) */
export async function config(_req: Request, res: Response): Promise<void> {
  res.json(getPricingConfig());
}

/** GET /api/v1/setup-fee/quote?currency=NGN — amount in user's currency */
export async function quote(req: Request, res: Response): Promise<void> {
  const currency = (req.query.currency as string) || 'USD';
  const payload = (req as unknown as { user?: AuthPayload }).user;
  const role = payload?.role;
  const usdAmount = role === 'investor' ? INVESTOR_SETUP_FEE_USD : IDEA_STARTER_SETUP_FEE_USD;
  try {
    const result = await convertUsdToCurrency(usdAmount, currency);
    res.json({
      amountUsd: usdAmount,
      amount: result.amount,
      currency: result.currency,
      rate: result.rate,
    });
  } catch (e) {
    res.status(500).json({ error: 'Currency conversion failed' });
  }
}

/** POST /api/v1/setup-fee/create-session — create payment (simulated or gateway); returns checkout URL or session */
export async function createSession(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { currency = 'USD' } = req.body as { currency?: string };
  const usdAmount = payload.role === 'investor' ? INVESTOR_SETUP_FEE_USD : IDEA_STARTER_SETUP_FEE_USD;
  const converted = await convertUsdToCurrency(usdAmount, currency);
  const reference = `setup_${payload.userId}_${Date.now()}`;
  await prisma.userPayment.create({
    data: {
      userId: payload.userId,
      amount: converted.amount,
      currency: converted.currency,
      type: 'setup_fee',
      status: 'pending',
      reference,
    },
  });
  // Simulated: in production replace with Stripe Checkout / Paystack etc.
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/dashboard?setup_success=1&ref=${encodeURIComponent(reference)}`;
  const cancelUrl = `${baseUrl}/dashboard?setup_cancel=1`;
  res.json({
    sessionId: reference,
    checkoutUrl: `${baseUrl}/setup-payment?ref=${encodeURIComponent(reference)}&amount=${converted.amount}&currency=${converted.currency}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`,
    amount: converted.amount,
    currency: converted.currency,
    amountUsd: usdAmount,
  });
}

/** POST /api/v1/setup-fee/verify — verify payment and unlock (call after gateway callback or simulated success) */
export async function verify(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { reference } = req.body as { reference: string };
  if (!reference?.trim()) {
    res.status(400).json({ error: 'reference required' });
    return;
  }
  const payment = await prisma.userPayment.findFirst({
    where: { reference: reference.trim(), userId: payload.userId, type: 'setup_fee' },
  });
  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }
  if (payment.status === 'completed') {
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { setupPaid: true } });
    res.json({ ok: true, setupPaid: user?.setupPaid ?? true });
    return;
  }
  await prisma.$transaction([
    prisma.userPayment.update({
      where: { id: payment.id },
      data: { status: 'completed', completedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: payload.userId },
      data: { setupPaid: true },
    }),
  ]);
  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'setup_paid',
    entityType: 'payment',
    entityId: payment.id,
    details: { type: 'setup_fee' },
  }).catch(() => {});
  res.json({ ok: true, setupPaid: true });
}

/** PUT /api/v1/setup-fee/skip — save skip reason and continue to limited dashboard */
export async function skip(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { reason } = req.body as { reason: string };
  const allowed = ['cant_afford', 'pay_later', 'exploring', 'other'];
  const value = allowed.includes(reason) ? reason : 'other';
  await prisma.user.update({
    where: { id: payload.userId },
    data: { setupReason: value },
  });
  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'setup_skipped',
    entityType: 'user',
    entityId: payload.userId,
    details: { reason: value },
  }).catch(() => {});
  res.json({ ok: true, setupReason: value });
}
