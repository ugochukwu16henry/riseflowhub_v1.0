import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { convertToUsd } from '../services/currencyService';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/overview — Top metrics for Super Admin dashboard */
export async function overview(_req: Request, res: Response): Promise<void> {
  const [
    totalUsers,
    totalClients,
    totalInvestors,
    projectsAll,
    agreementsSignedCount,
    userPaymentsCompleted,
    projectPaymentsPaid,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.investor.count(),
    prisma.project.findMany({ select: { id: true, status: true } }),
    prisma.assignedAgreement.count({ where: { status: 'Signed' } }),
    prisma.userPayment.findMany({
      where: { status: 'completed' },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid' },
      select: { amount: true },
    }),
  ]);

  const ideasSubmitted = projectsAll.length; // each project starts as an idea
  const activeProjects = projectsAll.filter(
    (p) => !['IdeaSubmitted', 'ReviewValidation', 'ProposalSent'].includes(p.status)
  ).length;

  let setupFeesUsd = 0;
  let consultationPaymentsUsd = 0;
  for (const p of userPaymentsCompleted) {
    const usd = await convertToUsd(Number(p.amount), p.currency);
    if (p.type === 'setup_fee') setupFeesUsd += usd;
    else if (p.type === 'consultation') consultationPaymentsUsd += usd;
  }
  const milestoneRevenueUsd = projectPaymentsPaid.reduce((s, p) => s + Number(p.amount), 0);
  const totalRevenueUsd = setupFeesUsd + consultationPaymentsUsd + milestoneRevenueUsd;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [userPaymentsMonth, userPaymentsYear, projectPaymentsMonth, projectPaymentsYear] = await Promise.all([
    prisma.userPayment.findMany({
      where: { status: 'completed', completedAt: { gte: startOfMonth } },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.userPayment.findMany({
      where: { status: 'completed', completedAt: { gte: startOfYear } },
      select: { amount: true, currency: true, type: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid', createdAt: { gte: startOfMonth } },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: 'Paid', createdAt: { gte: startOfYear } },
      select: { amount: true },
    }),
  ]);

  let revenueMonthlyUsd = 0;
  for (const p of userPaymentsMonth) {
    revenueMonthlyUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  revenueMonthlyUsd += projectPaymentsMonth.reduce((s, p) => s + Number(p.amount), 0);

  let revenueYearlyUsd = 0;
  for (const p of userPaymentsYear) {
    revenueYearlyUsd += await convertToUsd(Number(p.amount), p.currency);
  }
  revenueYearlyUsd += projectPaymentsYear.reduce((s, p) => s + Number(p.amount), 0);

  res.json({
    totalUsers,
    totalClients,
    totalInvestors,
    ideasSubmitted,
    activeProjects,
    agreementsSigned: agreementsSignedCount,
    totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
    revenueMonthlyUsd: Math.round(revenueMonthlyUsd * 100) / 100,
    revenueYearlyUsd: Math.round(revenueYearlyUsd * 100) / 100,
    setupFeesCollectedUsd: Math.round(setupFeesUsd * 100) / 100,
    consultationPaymentsUsd: Math.round(consultationPaymentsUsd * 100) / 100,
    investorFeesUsd: 0, // placeholder until investor fee model exists
  });
}

/** GET /api/v1/super-admin/payments — Payments audit table with filters */
export async function payments(req: Request, res: Response): Promise<void> {
  const { period, userId, paymentType, format } = req.query as {
    period?: 'monthly' | 'yearly';
    userId?: string;
    paymentType?: string;
    format?: 'json' | 'csv' | 'pdf';
  };

  const now = new Date();
  let dateFrom: Date | undefined;
  if (period === 'monthly') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    dateFrom = new Date(now.getFullYear(), 0, 1);
  }

  const userPayments = await prisma.userPayment.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(paymentType ? { type: paymentType } : {}),
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const projectPaymentWhere: { createdAt?: { gte: Date }; projectId?: { in: string[] } } = {};
  if (dateFrom) projectPaymentWhere.createdAt = { gte: dateFrom };
  if (userId) {
    const projectIds = (
      await prisma.project.findMany({
        where: { client: { userId } },
        select: { id: true },
      })
    ).map((p) => p.id);
    projectPaymentWhere.projectId = { in: projectIds };
    if (projectIds.length === 0) {
      projectPaymentWhere.projectId = { in: ['__none'] };
    }
  }

  const projectPayments =
    paymentType && paymentType !== 'milestone'
      ? []
      : await prisma.payment.findMany({
          where: projectPaymentWhere,
          select: { id: true, projectId: true, amount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });

  const projects = await prisma.project.findMany({
    where: { id: { in: projectPayments.map((p) => p.projectId) } },
    include: { client: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
  });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const rows: Array<{
    userName: string;
    role: string;
    paymentType: string;
    amount: number;
    currency: string;
    convertedUsd: number;
    status: string;
    date: string;
  }> = [];

  if (!paymentType || paymentType !== 'milestone') {
    for (const p of userPayments) {
      const usd = await convertToUsd(Number(p.amount), p.currency);
      rows.push({
        userName: p.user.name,
        role: p.user.role,
        paymentType: p.type,
        amount: Number(p.amount),
        currency: p.currency,
        convertedUsd: Math.round(usd * 100) / 100,
        status: p.status,
        date: p.createdAt.toISOString(),
      });
    }
  }
  for (const p of projectPayments) {
    const proj = projectMap.get(p.projectId);
    const user = proj?.client?.user;
    rows.push({
      userName: user?.name ?? '—',
      role: user?.role ?? 'client',
      paymentType: 'milestone',
      amount: Number(p.amount),
      currency: 'USD',
      convertedUsd: Number(p.amount),
      status: p.status,
      date: p.createdAt.toISOString(),
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (format === 'csv') {
    const header = 'User Name,Role,Payment Type,Amount,Currency,Converted USD,Status,Date\n';
    const body = rows
      .map(
        (r) =>
          `"${r.userName.replace(/"/g, '""')}",${r.role},${r.paymentType},${r.amount},${r.currency},${r.convertedUsd},${r.status},${r.date}`
      )
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payments-audit.csv');
    res.send(header + body);
    return;
  }

  if (format === 'pdf') {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      message: 'PDF export: use frontend to generate PDF from data',
      rows,
    });
    return;
  }

  res.json({ rows, total: rows.length });
}

/** GET /api/v1/super-admin/activity — User activity (logins, idea submitted, setup skipped, etc.) */
export async function activity(req: Request, res: Response): Promise<void> {
  const { actionType, limit = '100' } = req.query as { actionType?: string; limit?: string };
  const take = Math.min(parseInt(limit, 10) || 100, 500);

  const where: { actionType?: string } = {};
  if (actionType) where.actionType = actionType;

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take,
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
  });

  const list = logs.map((l) => ({
    id: l.id,
    actionType: l.actionType,
    entityType: l.entityType,
    entityId: l.entityId,
    details: l.details,
    timestamp: l.timestamp,
    userEmail: (l.admin as { email?: string } | null)?.email ?? (l.details as Record<string, unknown> | null)?.email ?? null,
    userName: (l.admin as { name?: string } | null)?.name ?? (l.details as Record<string, unknown> | null)?.name ?? null,
  }));

  res.json({ items: list });
}

/** GET /api/v1/super-admin/audit-logs — Paginated audit logs */
export async function auditLogs(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50', entityType, actionType } = req.query as {
    page?: string;
    limit?: string;
    entityType?: string;
    actionType?: string;
  };
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10) || 50);
  const take = Math.min(100, parseInt(limit, 10) || 50);

  const where: { entityType?: string; actionType?: string } = {};
  if (entityType) where.entityType = entityType;
  if (actionType) where.actionType = actionType;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    items: items.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminEmail: l.admin?.email ?? null,
      actionType: l.actionType,
      entityType: l.entityType,
      entityId: l.entityId,
      details: l.details,
      timestamp: l.timestamp,
    })),
    total,
    page: parseInt(page, 10) || 1,
    limit: take,
  });
}

/** GET /api/v1/super-admin/consultations — List all consultation bookings (Super Admin only) */
export async function consultations(_req: Request, res: Response): Promise<void> {
  const list = await prisma.consultationBooking.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}

/** GET /api/v1/super-admin/reports — Monthly/yearly reports, growth, payment trends */
export async function reports(req: Request, res: Response): Promise<void> {
  const { period = 'monthly' } = req.query as { period?: 'monthly' | 'yearly' };

  const now = new Date();
  const months: Array<{ start: Date; end: Date; label: string }> = [];
  if (period === 'yearly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }
  }

  const financialSummary: Array<{ period: string; revenueUsd: number; setupFeesUsd: number; milestoneUsd: number }> = [];
  for (const m of months) {
    const [up, pp] = await Promise.all([
      prisma.userPayment.findMany({
        where: {
          status: 'completed',
          completedAt: { gte: m.start, lte: m.end },
        },
        select: { amount: true, currency: true, type: true },
      }),
      prisma.payment.findMany({
        where: { status: 'Paid', createdAt: { gte: m.start, lte: m.end } },
        select: { amount: true },
      }),
    ]);
    let setupUsd = 0,
      consultUsd = 0;
    for (const p of up) {
      const usd = await convertToUsd(Number(p.amount), p.currency);
      if (p.type === 'setup_fee') setupUsd += usd;
      else if (p.type === 'consultation') consultUsd += usd;
    }
    const milestoneUsd = pp.reduce((s, p) => s + Number(p.amount), 0);
    financialSummary.push({
      period: m.label,
      revenueUsd: Math.round((setupUsd + consultUsd + milestoneUsd) * 100) / 100,
      setupFeesUsd: Math.round(setupUsd * 100) / 100,
      milestoneUsd: Math.round(milestoneUsd * 100) / 100,
    });
  }

  const [userCounts, projectCounts] = await Promise.all([
    prisma.user.groupBy({ by: ['createdAt'], _count: true }),
    prisma.project.groupBy({ by: ['createdAt'], _count: true }),
  ]);

  const growthMetrics = {
    totalUsers: await prisma.user.count(),
    totalProjects: await prisma.project.count(),
    newUsersLast30Days: await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    newProjectsLast30Days: await prisma.project.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  };

  res.json({
    period,
    financialSummary,
    paymentTrends: financialSummary,
    growthMetrics,
    platformUsage: {
      totalUsers: growthMetrics.totalUsers,
      totalProjects: growthMetrics.totalProjects,
      totalAgreementsSigned: await prisma.assignedAgreement.count({ where: { status: 'Signed' } }),
      totalConsultationsBooked: await prisma.consultationBooking.count(),
    },
  });
}
