import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

/** POST /api/v1/investments/express-interest — Investor expresses interest (status = expressed or meeting_requested) */
export async function expressInterest(req: Request, res: Response): Promise<void> {
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  if (role !== 'investor') {
    res.status(403).json({ error: 'Only investors can express interest' });
    return;
  }
  const investor = await prisma.investor.findUnique({ where: { userId } });
  if (!investor) {
    res.status(403).json({ error: 'Investor profile not found' });
    return;
  }
  const { startupId, requestMeeting } = req.body as { startupId: string; requestMeeting?: boolean };
  const startup = await prisma.startupProfile.findUnique({
    where: { id: startupId },
    include: { project: { include: { client: { include: { user: { select: { email: true, name: true } } } } } },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  if (startup.visibilityStatus !== 'approved') {
    res.status(403).json({ error: 'Startup not available for investment' });
    return;
  }
  const existing = await prisma.investment.findFirst({
    where: { investorId: investor.id, startupId },
  });
  if (existing) {
    if (requestMeeting && existing.status === 'expressed') {
      await prisma.investment.update({
        where: { id: existing.id },
        data: { status: 'meeting_requested', meetingRequestedAt: new Date() },
      });
      createAuditLog(prisma, {
        adminId: userId,
        actionType: 'investor_interest',
        entityType: 'investment',
        entityId: existing.id,
        details: { startupId, status: 'meeting_requested' },
      }).catch(() => {});
      const updated = await prisma.investment.findUnique({
        where: { id: existing.id },
        include: { startup: { include: { project: { select: { projectName: true } } } } },
      });
      return res.status(200).json(updated);
    }
    return res.status(200).json(existing);
  }
  const investment = await prisma.investment.create({
    data: {
      investorId: investor.id,
      startupId,
      status: requestMeeting ? 'meeting_requested' : 'expressed',
      meetingRequestedAt: requestMeeting ? new Date() : null,
    },
    include: {
      startup: {
        include: {
          project: {
            include: { client: { include: { user: { select: { email: true, name: true } } } } },
          },
        },
      },
    },
  });
  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'investor_interest',
    entityType: 'investment',
    entityId: investment.id,
    details: { startupId, status: investment.status },
  }).catch(() => {});
  const ownerEmail = investment?.startup?.project?.client?.user?.email;
  const investorName = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name;
  if (ownerEmail) {
    sendNotificationEmail({
      type: 'investor_interest_received',
      userEmail: ownerEmail,
      dynamicData: { startupName: investment?.startup?.project?.projectName, investorName },
    }).catch((e) => console.error('[Investment] Email error:', e));
  }
  res.status(201).json(investment);
}

/** POST /api/v1/investments/commit — Investor commits (amount, equity); status = committed */
export async function commit(req: Request, res: Response): Promise<void> {
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  if (role !== 'investor') {
    res.status(403).json({ error: 'Only investors can commit' });
    return;
  }
  const investor = await prisma.investor.findUnique({ where: { userId } });
  if (!investor) {
    res.status(403).json({ error: 'Investor profile not found' });
    return;
  }
  const { startupId, amount, equityPercent, agreementId } = req.body as {
    startupId: string;
    amount?: number;
    equityPercent?: number;
    agreementId?: string;
  };
  const startup = await prisma.startupProfile.findUnique({ where: { id: startupId } });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  if (startup.visibilityStatus !== 'approved') {
    res.status(403).json({ error: 'Startup not available' });
    return;
  }
  const existing = await prisma.investment.findFirst({
    where: { investorId: investor.id, startupId },
  });
  if (!existing) {
    res.status(400).json({ error: 'Express interest first' });
    return;
  }
  const updated = await prisma.investment.update({
    where: { id: existing.id },
    data: {
      status: 'committed',
      amount: amount != null ? amount : existing.amount,
      equityPercent: equityPercent != null ? equityPercent : existing.equityPercent,
      agreementId: agreementId || existing.agreementId,
    },
    include: {
      startup: { include: { project: { select: { projectName: true } } } },
      investor: { select: { name: true, email: true, firmName: true } },
    },
  });
  res.json(updated);
}

/** GET /api/v1/investments — List investments for current investor or admin */
export async function list(req: Request, res: Response): Promise<void> {
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  if (role === 'super_admin' || role === 'project_manager') {
    const investments = await prisma.investment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        investor: { select: { name: true, email: true, firmName: true } },
        startup: { include: { project: { select: { projectName: true } } } },
      },
    });
    return res.json(investments);
  }
  const investor = await prisma.investor.findUnique({ where: { userId } });
  if (!investor) return res.status(404).json({ error: 'Investor profile not found' });
  const investments = await prisma.investment.findMany({
    where: { investorId: investor.id },
    orderBy: { createdAt: 'desc' },
    include: {
      startup: {
        include: {
          project: { select: { projectName: true, client: { select: { businessName: true } } } },
        },
      },
    },
  });
  res.json(investments);
}

const ADMIN_ROLES = ['super_admin', 'project_manager', 'finance_admin'];
const STATUS_VALUES = ['expressed', 'meeting_requested', 'committed', 'due_diligence', 'agreement_signed', 'completed', 'withdrawn'] as const;

/** PATCH /api/v1/investments/:id/status — Admin: update deal status (e.g. due_diligence) */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { userId, role } = (req as unknown as { user: AuthPayload }).user;
  if (!ADMIN_ROLES.includes(role)) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const { id } = req.params;
  const { status } = req.body as { status: string };
  if (!status || !STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
    res.status(400).json({ error: 'Valid status required' });
    return;
  }
  const investment = await prisma.investment.findUnique({ where: { id } });
  if (!investment) {
    res.status(404).json({ error: 'Investment not found' });
    return;
  }
  const updated = await prisma.investment.update({
    where: { id },
    data: { status: status as (typeof STATUS_VALUES)[number] },
    include: {
      investor: { select: { name: true, email: true, firmName: true } },
      startup: { include: { project: { select: { projectName: true } } } },
    },
  });
  res.json(updated);
}
