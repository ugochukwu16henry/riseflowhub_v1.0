/**
 * Financial dashboard and tax summary for Super Admin / finance team.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';
import { convertToUsd } from '../services/currencyService';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/finance/summary — KPIs and series for dashboard */
export async function summary(_req: Request, res: Response): Promise<void> {
  const [
    manualConfirmed,
    userPaymentsCompleted,
    projectPaymentsPaid,
    pendingManualCount,
    manualByType,
    userPaymentCount,
  ] = await Promise.all([
    prisma.manualPayment.findMany({
      where: { status: 'Confirmed' },
      select: { amount: true, currency: true, paymentType: true, confirmedAt: true },
    }),
    prisma.userPayment.findMany({
      where: { status: 'completed' },
      select: { amount: true, currency: true, type: true, completedAt: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid' },
      select: { amount: true, createdAt: true },
    }),
    prisma.manualPayment.count({ where: { status: 'Pending' } }),
    prisma.manualPayment.groupBy({
      by: ['paymentType'],
      where: { status: 'Confirmed' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.userPayment.count({ where: { status: 'completed' } }),
  ]);

  let totalRevenueUsd = 0;
  for (const p of manualConfirmed) {
    totalRevenueUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  for (const p of userPaymentsCompleted) {
    totalRevenueUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  totalRevenueUsd += projectPaymentsPaid.reduce((s, p) => s + Number(p.amount), 0);

  const paidUserIds = new Set<string>();
  const manualUserIds = await prisma.manualPayment.findMany({
    where: { status: 'Confirmed' },
    select: { userId: true },
  });
  manualUserIds.forEach((r) => paidUserIds.add(r.userId));
  const completedUserPayments = await prisma.userPayment.findMany({
    where: { status: 'completed' },
    select: { userId: true },
  });
  completedUserPayments.forEach((r) => paidUserIds.add(r.userId));
  const totalPaidUsers = paidUserIds.size;

  const byPaymentType = manualByType.map((g) => ({
    type: g.paymentType,
    count: g._count,
    totalAmount: Number(g._sum.amount ?? 0),
  }));

  // Revenue by month (last 12 months)
  const now = new Date();
  const revenueByMonth: { month: string; revenueUsd: number; manualUsd: number; gatewayUsd: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthManual = manualConfirmed.filter(
      (p) => p.confirmedAt && p.confirmedAt >= start && p.confirmedAt <= end
    );
    const monthUser = userPaymentsCompleted.filter(
      (p) => p.completedAt && p.completedAt >= start && p.completedAt <= end
    );
    const monthProject = projectPaymentsPaid.filter(
      (p) => p.createdAt >= start && p.createdAt <= end
    );
    let manualUsd = 0;
    for (const p of monthManual) {
      manualUsd += await convertToUsd(Number(p.amount), p.currency);
    }
    let gatewayUsd = 0;
    for (const p of monthUser) {
      gatewayUsd += await convertToUsd(Number(p.amount), p.currency);
    }
    gatewayUsd += monthProject.reduce((s, p) => s + Number(p.amount), 0);
    revenueByMonth.push({
      month: start.toISOString().slice(0, 7),
      revenueUsd: Math.round((manualUsd + gatewayUsd) * 100) / 100,
      manualUsd: Math.round(manualUsd * 100) / 100,
      gatewayUsd: Math.round(gatewayUsd * 100) / 100,
    });
  }

  res.json({
    totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
    totalPaidUsers,
    pendingApprovals: pendingManualCount,
    refundsUsd: 0,
    byPaymentType,
    revenueByMonth,
    gatewayPaymentCount: userPaymentCount,
  });
}

/** GET /api/v1/super-admin/finance/tax-summary?start=YYYY-MM-DD&end=YYYY-MM-DD — CSV export */
export async function taxSummary(req: Request, res: Response): Promise<void> {
  const admin = (req as unknown as { user?: AuthPayload }).user;
  if (!admin) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { start, end } = req.query as { start?: string; end?: string };
  const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = end ? new Date(end) : new Date();
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    res.status(400).json({ error: 'Invalid start or end date' });
    return;
  }

  const [manualPayments, userPayments] = await Promise.all([
    prisma.manualPayment.findMany({
      where: {
        status: 'Confirmed',
        confirmedAt: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { confirmedAt: 'asc' },
    }),
    prisma.userPayment.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { completedAt: 'asc' },
    }),
  ]);

  const escapeCsv = (v: string | number): string => {
    const s = String(v);
    if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const rows: string[][] = [
    ['Source', 'Date', 'Transaction ID', 'User', 'Email', 'Amount', 'Currency', 'Type'],
  ];

  for (const p of manualPayments) {
    rows.push([
      'Bank Transfer',
      (p.confirmedAt ?? p.submittedAt).toISOString().slice(0, 10),
      p.id,
      p.user.name,
      p.user.email,
      String(Number(p.amount)),
      p.currency,
      p.paymentType,
    ]);
  }
  for (const p of userPayments) {
    rows.push([
      'Gateway',
      p.completedAt ? p.completedAt.toISOString().slice(0, 10) : '',
      p.id,
      p.user.name,
      p.user.email,
      String(Number(p.amount)),
      p.currency,
      p.type,
    ]);
  }

  const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const filename = `tax_summary_${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}.csv`;

  createAuditLog(prisma, {
    adminId: admin.userId,
    actionType: 'tax_export_downloaded',
    entityType: 'payment',
    entityId: null,
    details: { start: startDate.toISOString(), end: endDate.toISOString(), filename, rowCount: rows.length - 1 },
  }).catch(() => {});

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
}
