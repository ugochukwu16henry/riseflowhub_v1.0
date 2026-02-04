import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

/** GET /api/v1/hiring/config — Public: role categories, skill list, fees from CMS */
export async function getConfig(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.cmsContent.findMany({
    where: { page: 'hiring' },
    select: { key: true, value: true, type: true },
  });
  const config: Record<string, unknown> = {};
  for (const row of rows) {
    config[row.key] = row.type === 'json' ? (JSON.parse(row.value) as unknown) : row.value;
  }
  res.json({
    roleCategories: (config['hiring.roleCategories'] as string[]) ?? ['Tech Roles', 'Creative Roles', 'Business Roles'],
    skillList: (config['hiring.skillList'] as string[]) ?? [],
    talentFeeUsd: Number(config['hiring.talentFeeUsd']) || 7,
    companyFeeUsd: Number(config['hiring.companyFeeUsd']) || 20,
  });
}

/** POST /api/v1/hiring/hire/:talentId — Hirer: send hire request (hirer must have paid fee + signed Fair Treatment) */
export async function createHire(req: Request, res: Response): Promise<void> {
  const talentId = req.params.talentId as string;
  const { projectTitle, projectDescription } = req.body as { projectTitle: string; projectDescription?: string };
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (!projectTitle?.trim()) {
    res.status(400).json({ error: 'projectTitle required' });
    return;
  }

  const hirer = await prisma.hirer.findUnique({ where: { userId: payload.userId } });
  if (!hirer) {
    res.status(403).json({ error: 'Hirer profile required' });
    return;
  }
  if (!hirer.feePaid) {
    res.status(403).json({ error: 'Platform fee must be paid before hiring' });
    return;
  }
  if (!hirer.fairTreatmentSignedAt) {
    res.status(403).json({ error: 'Fair Treatment Agreement must be signed before hiring' });
    return;
  }

  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    include: { user: { select: { id: true } } },
  });
  if (!talent) {
    res.status(404).json({ error: 'Talent not found' });
    return;
  }
  if (talent.status !== 'approved') {
    res.status(400).json({ error: 'Talent is not approved for hiring' });
    return;
  }

  const hire = await prisma.hire.create({
    data: {
      talentId: talent.id,
      hirerId: hirer.id,
      projectTitle: projectTitle.trim(),
      projectDescription: projectDescription?.trim() || null,
      status: 'requested',
    },
    include: {
      talent: { include: { user: { select: { name: true, email: true } } } },
      hirer: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'hire_requested',
    entityType: 'hire',
    entityId: hire.id,
    details: { talentId, hirerId: hirer.id },
  }).catch(() => {});

  res.status(201).json({
    id: hire.id,
    talentId: hire.talentId,
    hirerId: hire.hirerId,
    projectTitle: hire.projectTitle,
    projectDescription: hire.projectDescription,
    status: hire.status,
    talent: hire.talent.user,
    hirer: hire.hirer.user,
    createdAt: hire.createdAt,
  });
}

/** GET /api/v1/hiring/hires — List hires for current user (talent sees their hires, hirer sees their hires, admin sees all) */
export async function listHires(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const role = payload.role;
  const isAdmin = ['super_admin', 'hr_manager', 'legal_team'].includes(role);

  const where: { talent?: { userId: string }; hirer?: { userId: string } } = {};
  if (!isAdmin) {
    if (role === 'talent') {
      where.talent = { userId: payload.userId };
    } else if (role === 'hirer' || role === 'hiring_company') {
      where.hirer = { userId: payload.userId };
    } else {
      res.status(403).json({ error: 'Not authorized to list hires' });
      return;
    }
  }

  const hires = await prisma.hire.findMany({
    where,
    include: {
      talent: { include: { user: { select: { id: true, name: true, email: true } } } },
      hirer: { include: { user: { select: { id: true, name: true, email: true } } } },
      agreement: { select: { id: true, title: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: hires.map((h) => ({
      id: h.id,
      talentId: h.talentId,
      hirerId: h.hirerId,
      projectTitle: h.projectTitle,
      projectDescription: h.projectDescription,
      agreementId: h.agreementId,
      status: h.status,
      talent: h.talent.user,
      hirer: h.hirer.user,
      agreement: h.agreement,
      createdAt: h.createdAt,
      completedAt: h.completedAt,
    })),
  });
}

/** POST /api/v1/hiring/agreement — Admin/HR: create hire contract agreement and assign to talent + hirer (or link to hire) */
export async function createHireAgreement(req: Request, res: Response): Promise<void> {
  const { hireId, title } = req.body as { hireId: string; title?: string };
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (!hireId?.trim()) {
    res.status(400).json({ error: 'hireId required' });
    return;
  }

  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: { talent: { include: { user: true } }, hirer: { include: { user: true } } },
  });
  if (!hire) {
    res.status(404).json({ error: 'Hire not found' });
    return;
  }

  const agreement = await prisma.agreement.create({
    data: {
      title: title?.trim() || `Hire Contract: ${hire.projectTitle}`,
      type: 'HireContract',
    },
  });

  await prisma.hire.update({
    where: { id: hireId },
    data: { agreementId: agreement.id, status: 'agreement_sent' },
  });

  const talentUserId = hire.talent.userId;
  const hirerUserId = hire.hirer.userId;
  await prisma.assignedAgreement.createMany({
    data: [
      { agreementId: agreement.id, userId: talentUserId },
      { agreementId: agreement.id, userId: hirerUserId },
    ],
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'hire_agreement_created',
    entityType: 'agreement',
    entityId: agreement.id,
    details: { hireId },
  }).catch(() => {});

  res.status(201).json({
    agreement: { id: agreement.id, title: agreement.title, type: agreement.type },
    hireId,
    assignedTo: [talentUserId, hirerUserId],
  });
}

/** PATCH /api/v1/hiring/hires/:id — Update hire status (e.g. completed for ratings) */
export async function updateHireStatus(req: Request, res: Response): Promise<void> {
  const hireId = req.params.id as string;
  const { status } = req.body as { status: 'in_progress' | 'completed' | 'cancelled' };
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (!status || !['in_progress', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'status must be in_progress, completed, or cancelled' });
    return;
  }

  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: { talent: true, hirer: true },
  });
  if (!hire) {
    res.status(404).json({ error: 'Hire not found' });
    return;
  }

  const isTalent = hire.talent.userId === payload.userId;
  const isHirer = hire.hirer.userId === payload.userId;
  const isAdmin = ['super_admin', 'hr_manager'].includes(payload.role);
  if (!isTalent && !isHirer && !isAdmin) {
    res.status(403).json({ error: 'Not authorized to update this hire' });
    return;
  }

  await prisma.hire.update({
    where: { id: hireId },
    data: {
      status: status as 'in_progress' | 'completed' | 'cancelled',
      ...(status === 'completed' && { completedAt: new Date() }),
    },
  });

  res.json({ ok: true, status, ...(status === 'completed' && { completedAt: new Date() }) });
}
