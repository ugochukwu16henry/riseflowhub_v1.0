import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { notify } from '../services/notificationService';
import { awardBadge } from '../services/badgeService';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/manual-payments — list manual bank transfers (optional status filter) */
export async function list(req: Request, res: Response): Promise<void> {
  const { status } = req.query as { status?: 'Pending' | 'Confirmed' | 'Rejected' };

  const payments = await prisma.manualPayment.findMany({
    where: status ? { status } : {},
    orderBy: { submittedAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  res.json({
    items: payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userEmail: p.user.email,
      amount: Number(p.amount),
      currency: p.currency,
      paymentType: p.paymentType,
      status: p.status,
      submittedAt: p.submittedAt,
      confirmedAt: p.confirmedAt,
      notes: p.notes,
      proofUrl: p.proofUrl ?? undefined,
    })),
  });
}

/** POST /api/v1/super-admin/manual-payments/:id/confirm — mark payment confirmed and send receipt */
export async function confirm(req: Request, res: Response): Promise<void> {
  const admin = (req as unknown as { user?: AuthPayload }).user;
  if (!admin) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const { notes } = req.body as { notes?: string };

  const payment = await prisma.manualPayment.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!payment) {
    res.status(404).json({ error: 'Manual payment not found' });
    return;
  }

  if (payment.status === 'Confirmed') {
    res.status(400).json({ error: 'Payment already confirmed' });
    return;
  }

  const updated = await prisma.manualPayment.update({
    where: { id },
    data: {
      status: 'Confirmed',
      confirmedAt: new Date(),
      notes:
        notes && notes.trim()
          ? payment.notes
            ? `${payment.notes}\n\n[Admin note] ${notes.trim()}`
            : notes.trim()
          : payment.notes,
    },
    include: { user: true },
  });

  // If this is a platform fee, unlock setup access for the user.
  if (updated.paymentType === 'platform_fee') {
    await prisma.user.update({
      where: { id: updated.userId },
      data: {
        setupPaid: true,
        setupReason: updated.notes ?? 'manual_bank_transfer',
      },
    });
  } else if (updated.paymentType === 'donation') {
    // Thank-you donor flows: mark with donor badge
    await awardBadge(prisma, { userId: updated.userId, badge: 'donor_supporter' });
  }

  // Log notification row
  await prisma.manualPaymentNotification.create({
    data: {
      userId: updated.userId,
      adminId: admin.userId,
      paymentId: updated.id,
      message: `Payment confirmed by ${admin.email}`,
    },
  });

  // Notify user with appropriate message
  const amountStr = Number(updated.amount).toLocaleString();
  const baseText = `Your payment of ${amountStr} ${updated.currency} has been confirmed.`;
  const extra =
    updated.paymentType === 'platform_fee'
      ? ' You now have full access to all platform features.'
      : ' Thank you for supporting our mission. Your contribution helps host the platform, empower founders, and grow startups in Africa.';

  await notify({
    userId: updated.userId,
    type: 'payment',
    title: 'Payment confirmed',
    message: baseText + extra,
    link: updated.paymentType === 'platform_fee' ? '/dashboard' : '/dashboard/payments',
  });

  res.json({
    id: updated.id,
    status: updated.status,
    confirmedAt: updated.confirmedAt,
    notes: updated.notes,
  });
}

/** POST /api/v1/super-admin/manual-payments/:id/reject — mark payment rejected with a reason */
export async function reject(req: Request, res: Response): Promise<void> {
  const admin = (req as unknown as { user?: AuthPayload }).user;
  if (!admin) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason?: string };

  if (!reason || !reason.trim()) {
    res.status(400).json({ error: 'Rejection reason is required' });
    return;
  }

  const payment = await prisma.manualPayment.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!payment) {
    res.status(404).json({ error: 'Manual payment not found' });
    return;
  }

  const updated = await prisma.manualPayment.update({
    where: { id },
    data: {
      status: 'Rejected',
      notes: payment.notes
        ? `${payment.notes}\n\n[Rejected] ${reason.trim()}`
        : `[Rejected] ${reason.trim()}`,
    },
    include: { user: true },
  });

  await prisma.manualPaymentNotification.create({
    data: {
      userId: updated.userId,
      adminId: admin.userId,
      paymentId: updated.id,
      message: `Payment rejected: ${reason.trim()}`,
    },
  });

  await notify({
    userId: updated.userId,
    type: 'payment',
    title: 'Payment could not be confirmed',
    message: `We could not confirm your bank transfer. Reason: ${reason.trim()}`,
    link: '/dashboard/payments',
  });

  res.json({
    id: updated.id,
    status: updated.status,
    notes: updated.notes,
  });
}

