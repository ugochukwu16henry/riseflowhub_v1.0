import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

const APPROVED = 'approved';

function isInvestor(role: string) {
  return role === 'investor';
}
function isAdmin(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin'].includes(role);
}

/** GET /api/v1/deal-room — List startups in Deal Room (approved + investorReady). Investor or admin. */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (!isInvestor(payload.role) && !isAdmin(payload.role)) {
    res.status(403).json({ error: 'Investor or admin only' });
    return;
  }
  const startups = await prisma.startupProfile.findMany({
    where: {
      visibilityStatus: APPROVED,
      investorReady: true,
    },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
          stage: true,
          description: true,
          problemStatement: true,
          targetMarket: true,
          workspaceStage: true,
          client: { select: { businessName: true, industry: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(startups);
}

/** GET /api/v1/deal-room/:startupId — Startup profile for Deal Room; record view if investor. */
export async function getStartup(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (!isInvestor(payload.role) && !isAdmin(payload.role)) {
    res.status(403).json({ error: 'Investor or admin only' });
    return;
  }
  const { startupId } = req.params;
  const startup = await prisma.startupProfile.findUnique({
    where: { id: startupId },
    include: {
      project: {
        include: {
          client: {
            select: {
              businessName: true,
              industry: true,
              userId: true,
              user: { select: { name: true, email: true } },
            },
          },
          milestones: { select: { id: true, title: true, status: true, dueDate: true } },
          files: { select: { id: true, fileUrl: true, category: true } },
          businessModel: true,
        },
      },
    },
  });
  if (!startup) {
    res.status(404).json({ error: 'Startup not found' });
    return;
  }
  if (startup.visibilityStatus !== APPROVED || !startup.investorReady) {
    res.status(403).json({ error: 'Startup not in Deal Room' });
    return;
  }
  if (isInvestor(payload.role)) {
    const investor = await prisma.investor.findUnique({ where: { userId: payload.userId } });
    if (investor) {
      await prisma.dealRoomView.upsert({
        where: {
          investorId_startupId: { investorId: investor.id, startupId },
        },
        create: { investorId: investor.id, startupId },
        update: { viewedAt: new Date() },
      });
    }
  }
  res.json(startup);
}

/** POST /api/v1/deal-room/save — Save startup. Investor only. */
export async function saveStartup(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'investor') {
    res.status(403).json({ error: 'Investor only' });
    return;
  }
  const investor = await prisma.investor.findUnique({ where: { userId: payload.userId } });
  if (!investor) {
    res.status(403).json({ error: 'Investor profile not found' });
    return;
  }
  const { startupId } = req.body as { startupId: string };
  const startup = await prisma.startupProfile.findUnique({
    where: { id: startupId },
    select: { visibilityStatus: true, investorReady: true },
  });
  if (!startup || startup.visibilityStatus !== APPROVED || !startup.investorReady) {
    res.status(404).json({ error: 'Startup not in Deal Room' });
    return;
  }
  await prisma.savedStartup.upsert({
    where: { investorId_startupId: { investorId: investor.id, startupId } },
    create: { investorId: investor.id, startupId },
    update: {},
  });
  res.status(201).json({ saved: true, startupId });
}

/** DELETE /api/v1/deal-room/save/:startupId — Unsave. Investor only. */
export async function unsaveStartup(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'investor') {
    res.status(403).json({ error: 'Investor only' });
    return;
  }
  const investor = await prisma.investor.findUnique({ where: { userId: payload.userId } });
  if (!investor) {
    res.status(403).json({ error: 'Investor profile not found' });
    return;
  }
  const { startupId } = req.params;
  await prisma.savedStartup.deleteMany({
    where: { investorId: investor.id, startupId },
  });
  res.status(204).send();
}

/** GET /api/v1/deal-room/saved — List saved startup IDs. Investor only. */
export async function listSaved(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'investor') {
    res.status(403).json({ error: 'Investor only' });
    return;
  }
  const investor = await prisma.investor.findUnique({ where: { userId: payload.userId } });
  if (!investor) {
    res.json([]);
    return;
  }
  const saved = await prisma.savedStartup.findMany({
    where: { investorId: investor.id },
    select: { startupId: true },
  });
  res.json(saved.map((s) => s.startupId));
}

/** POST /api/v1/deal-room/messages — Send message (investmentId, message). Investor, founder, or admin. */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { investmentId, message } = req.body as { investmentId: string; message: string };
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message required' });
    return;
  }
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      investor: { select: { userId: true } },
      startup: { include: { project: { include: { client: { select: { userId: true } } } } } },
    },
  });
  if (!investment) {
    res.status(404).json({ error: 'Investment not found' });
    return;
  }
  const founderUserId = investment.startup?.project?.client?.userId;
  const canSend =
    isAdmin(payload.role) ||
    payload.userId === investment.investor.userId ||
    payload.userId === founderUserId;
  if (!canSend) {
    res.status(403).json({ error: 'Cannot send message in this deal' });
    return;
  }
  const created = await prisma.dealRoomMessage.create({
    data: { investmentId, senderId: payload.userId, message: message.trim() },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(created);
}

/** GET /api/v1/deal-room/messages/:investmentId — List messages. Investor, founder, or admin. */
export async function listMessages(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { investmentId } = req.params;
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      investor: { select: { userId: true } },
      startup: { include: { project: { include: { client: { select: { userId: true } } } } } },
    },
  });
  if (!investment) {
    res.status(404).json({ error: 'Investment not found' });
    return;
  }
  const founderUserId = investment.startup?.project?.client?.userId;
  const canRead =
    isAdmin(payload.role) ||
    payload.userId === investment.investor.userId ||
    payload.userId === founderUserId;
  if (!canRead) {
    res.status(403).json({ error: 'Cannot read messages for this deal' });
    return;
  }
  const messages = await prisma.dealRoomMessage.findMany({
    where: { investmentId },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  res.json(messages);
}

/** GET /api/v1/deal-room/admin/deals — Admin: list deals (investments + view info). */
export async function adminDeals(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (!isAdmin(payload.role)) {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  const investments = await prisma.investment.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      investor: { select: { id: true, name: true, email: true, firmName: true } },
      startup: {
        include: {
          project: { select: { projectName: true } },
        },
      },
    },
  });
  const views = await prisma.dealRoomView.findMany({
    where: { startupId: { in: investments.map((i) => i.startupId) } },
    include: { investor: { select: { name: true, email: true } } },
  });
  const viewByKey = new Map(views.map((v) => [`${v.investorId}:${v.startupId}`, v]));
  const deals = investments.map((inv) => {
    const view = viewByKey.get(`${inv.investorId}:${inv.startupId}`);
    let interestLevel = 'Interested';
    if (inv.status === 'meeting_requested') interestLevel = 'Meeting';
    else if (['committed', 'due_diligence', 'agreement_signed'].includes(inv.status)) interestLevel = 'Due Diligence';
    return {
      id: inv.id,
      startupId: inv.startupId,
      startupName: inv.startup?.project?.projectName,
      investorId: inv.investorId,
      investorName: inv.investor.name,
      investorEmail: inv.investor.email,
      firmName: inv.investor.firmName,
      status: inv.status,
      interestLevel,
      viewedAt: view?.viewedAt ?? null,
      meetingRequestedAt: inv.meetingRequestedAt,
      amount: inv.amount,
      equityPercent: inv.equityPercent,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };
  });
  res.json(deals);
}
