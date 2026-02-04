/**
 * Stripe webhook: checkout.session.completed.
 * Finds payment by client_reference_id, marks completed, updates Talent/Hirer/User.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  isStripeEnabled,
  isWebhookSecretSet,
  constructWebhookEvent,
} from '../services/stripeService';
import { createAuditLog } from '../services/auditLogService';
import { notify } from '../services/notificationService';

const prisma = new PrismaClient();

const FEE_TYPES = ['talent_marketplace_fee', 'hirer_platform_fee', 'setup_fee'] as const;

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (!isStripeEnabled() || !isWebhookSecretSet()) {
    res.status(501).json({ error: 'Stripe webhook not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature' });
    return;
  }

  let event: import('stripe').Stripe.Event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    res.status(400).json({ error: message });
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    res.json({ received: true });
    return;
  }

  const session = event.data.object as import('stripe').Stripe.Checkout.Session;
  const reference = session.client_reference_id;
  if (!reference) {
    res.status(400).json({ error: 'Missing client_reference_id' });
    return;
  }

  const payment = await prisma.userPayment.findFirst({
    where: { reference, status: 'pending' },
  });
  if (!payment) {
    res.json({ received: true });
    return;
  }

  const type = payment.type as (typeof FEE_TYPES)[number];
  const metadata = (payment.metadata as Record<string, unknown>) || {};
  const updatedMetadata = {
    ...metadata,
    stripeSessionId: session.id,
    stripePaymentStatus: session.payment_status,
    completedAt: new Date().toISOString(),
  };

  await prisma.userPayment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      metadata: updatedMetadata,
    },
  });

  if (type === 'talent_marketplace_fee') {
    await prisma.talent.updateMany({
      where: { userId: payment.userId },
      data: { feePaid: true },
    });
  } else if (type === 'hirer_platform_fee') {
    await prisma.hirer.updateMany({
      where: { userId: payment.userId },
      data: { feePaid: true, verified: true },
    });
  } else if (type === 'setup_fee') {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { setupPaid: true },
    });
  }

  createAuditLog(prisma, {
    adminId: null,
    actionType: 'payment_webhook_completed',
    entityType: 'payment',
    entityId: payment.id,
    details: { type, reference, gateway: 'stripe' },
  }).catch(() => {});

  const description = type === 'talent_marketplace_fee' ? 'Talent marketplace fee' : type === 'hirer_platform_fee' ? 'Hiring platform fee' : 'Setup fee';
  notify({
    userId: payment.userId,
    type: 'payment',
    title: 'Payment confirmed',
    message: `Your ${description} payment was successful. You now have full access.`,
    link: '/dashboard',
  }).catch(() => {});

  res.json({ received: true });
}
