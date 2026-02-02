import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

const AGREEMENT_TYPES = ['NDA', 'MOU', 'CoFounder', 'Terms'] as const;

/** List all agreement templates. Admin only. */
export async function listAgreements(_req: Request, res: Response): Promise<void> {
  const agreements = await prisma.agreement.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      templateUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(agreements);
}

/** Get one agreement by id. Admin only. */
export async function getAgreement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      assignedAgreements: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  res.json(agreement);
}

/** Create agreement template. Admin only. */
export async function createAgreement(req: Request, res: Response): Promise<void> {
  const { title, type, templateUrl } = req.body as { title?: string; type?: string; templateUrl?: string };
  if (!title || !type) {
    res.status(400).json({ error: 'title and type are required' });
    return;
  }
  if (!AGREEMENT_TYPES.includes(type as (typeof AGREEMENT_TYPES)[number])) {
    res.status(400).json({ error: 'type must be NDA, MOU, CoFounder, or Terms' });
    return;
  }
  const agreement = await prisma.agreement.create({
    data: { title, type: type as (typeof AGREEMENT_TYPES)[number], templateUrl: templateUrl || null },
  });
  res.status(201).json(agreement);
}

/** Update agreement template. Admin only. */
export async function updateAgreement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, type, templateUrl } = req.body as { title?: string; type?: string; templateUrl?: string };
  const agreement = await prisma.agreement.findUnique({ where: { id } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const updated = await prisma.agreement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && AGREEMENT_TYPES.includes(type as (typeof AGREEMENT_TYPES)[number]) && { type: type as (typeof AGREEMENT_TYPES)[number] }),
      ...(templateUrl !== undefined && { templateUrl }),
    },
  });
  res.json(updated);
}

/** Delete agreement. Admin only. */
export async function deleteAgreement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agreement = await prisma.agreement.findUnique({ where: { id } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  await prisma.agreement.delete({ where: { id } });
  res.status(204).send();
}

/** Assign agreement to user(s). Super Admin only. */
export async function assignAgreement(req: Request, res: Response): Promise<void> {
  const { id: agreementId } = req.params;
  const { userId, userIds, deadline } = req.body as {
    userId?: string;
    userIds?: string[];
    deadline?: string;
  };
  const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const ids = userIds && userIds.length ? userIds : userId ? [userId] : [];
  if (ids.length === 0) {
    res.status(400).json({ error: 'userId or userIds array is required' });
    return;
  }
  const deadlineDate = deadline ? new Date(deadline) : null;
  const results: { id: string; userId: string; deadline: Date | null }[] = [];
  for (const uid of ids) {
    const existing = await prisma.assignedAgreement.findFirst({
      where: { agreementId, userId: uid },
    });
    if (existing) {
      await prisma.assignedAgreement.update({
        where: { id: existing.id },
        data: { deadline: deadlineDate },
      });
      results.push({ id: existing.id, userId: uid, deadline: deadlineDate });
    } else {
      const a = await prisma.assignedAgreement.create({
        data: { agreementId, userId: uid, deadline: deadlineDate },
      });
      results.push({ id: a.id, userId: uid, deadline: deadlineDate });
    }
  }
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true },
  });
  const deadlineStr = deadlineDate ? deadlineDate.toISOString().slice(0, 10) : undefined;
  for (const u of users) {
    sendNotificationEmail({
      type: 'agreement_pending',
      userEmail: u.email,
      dynamicData: { name: u.name, agreementTitle: agreement.title, deadline: deadlineStr },
    }).catch((e) => console.error('[Agreement] Email error:', e));
  }
  res.status(201).json({ assigned: results });
}

/** List agreements assigned to the logged-in user. */
export async function listAssigned(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const list = await prisma.assignedAgreement.findMany({
    where: { userId },
    include: {
      agreement: { select: { id: true, title: true, type: true, templateUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}

/** View agreement (fetch content for reading). Logs "viewed". */
export async function viewAgreement(req: Request, res: Response): Promise<void> {
  const { id: agreementId } = req.params;
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const assigned = await prisma.assignedAgreement.findFirst({
    where: { agreementId, userId },
  });
  if (!assigned) {
    res.status(403).json({ error: 'This agreement is not assigned to you' });
    return;
  }
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
  await prisma.agreementAuditLog.create({
    data: {
      agreementId,
      assignedAgreementId: assigned.id,
      userId,
      action: 'viewed',
      ipAddress: ip,
    },
  });
  res.json({
    id: agreement.id,
    title: agreement.title,
    type: agreement.type,
    templateUrl: agreement.templateUrl,
    contentHtml: agreement.templateUrl ? null : null, // could store HTML in DB later
  });
}

/** Sign agreement. */
export async function signAgreement(req: Request, res: Response): Promise<void> {
  const { id: agreementId } = req.params;
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { signatureText, signatureUrl } = req.body as { signatureText?: string; signatureUrl?: string };
  const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const assigned = await prisma.assignedAgreement.findFirst({
    where: { agreementId, userId },
  });
  if (!assigned) {
    res.status(403).json({ error: 'This agreement is not assigned to you' });
    return;
  }
  if (assigned.status === 'Signed') {
    res.status(400).json({ error: 'Agreement already signed' });
    return;
  }
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
  await prisma.$transaction([
    prisma.assignedAgreement.update({
      where: { id: assigned.id },
      data: {
        status: 'Signed',
        signedAt: new Date(),
        signatureUrl: signatureUrl || signatureText || null,
        ipAddress: ip,
      },
    }),
    prisma.agreementAuditLog.create({
      data: {
        agreementId,
        assignedAgreementId: assigned.id,
        userId,
        action: 'signed',
        ipAddress: ip,
      },
    }),
  ]);
  const updated = await prisma.assignedAgreement.findUnique({
    where: { id: assigned.id },
    include: { agreement: { select: { title: true, type: true } }, user: { select: { email: true, name: true } } },
  });
  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'agreement_signed',
    entityType: 'agreement',
    entityId: assigned.id,
    details: { agreementId },
  }).catch(() => {});
  if (updated?.user?.email) {
    sendNotificationEmail({
      type: 'agreement_signed',
      userEmail: updated.user.email,
      dynamicData: { name: updated.user.name, agreementTitle: updated.agreement.title },
    }).catch((e) => console.error('[Agreement] Email error:', e));
  }
  res.json({ message: 'Agreement signed successfully', assignment: updated });
}

/** Get signing status for an agreement (assignments). Super Admin only. */
export async function getStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      assignedAgreements: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  res.json(agreement.assignedAgreements);
}

/** Get audit logs for an agreement. Super Admin only. */
export async function getLogs(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agreement = await prisma.agreement.findUnique({ where: { id } });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const logs = await prisma.agreementAuditLog.findMany({
    where: { agreementId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
}

/** List assigned agreements with details (for Super Admin table). */
export async function listAssignedForAdmin(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const agreements = await prisma.assignedAgreement.findMany({
    where: {
      ...(status && { status: status as 'Pending' | 'Signed' | 'Overdue' }),
      ...(type && { agreement: { type: type as 'NDA' | 'MOU' | 'CoFounder' | 'Terms' } }),
    },
    include: {
      agreement: { select: { id: true, title: true, type: true, templateUrl: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(agreements);
}
