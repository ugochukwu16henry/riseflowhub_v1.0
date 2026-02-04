import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';
import { createAuditLog } from '../services/auditLogService';
import { fillAgreementTemplate, type AgreementTemplateKey } from '../templates/agreementTemplates';

const prisma = new PrismaClient();

const AGREEMENT_TYPES = ['NDA', 'MOU', 'CoFounder', 'Terms', 'FairTreatment', 'HireContract', 'Partnership', 'Investor'] as const;

/** List all agreement templates/documents. Admin only. Optional filter by type, status. */
export async function listAgreements(req: Request, res: Response): Promise<void> {
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const agreements = await prisma.agreement.findMany({
    where: {
      ...(type && type in AGREEMENT_TYPES && { type: type as (typeof AGREEMENT_TYPES)[number] }),
      ...(status && (status === 'Pending' || status === 'Completed') && { status: status as 'Pending' | 'Completed' }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      templateUrl: true,
      contentHtml: true,
      createdById: true,
      status: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, name: true, email: true } },
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
      createdBy: { select: { id: true, name: true, email: true } },
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

/** Create agreement template or document. Admin only. */
export async function createAgreement(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { title, type, templateUrl, contentHtml, createdById } = req.body as {
    title?: string;
    type?: string;
    templateUrl?: string;
    contentHtml?: string;
    createdById?: string;
  };
  if (!title || !type) {
    res.status(400).json({ error: 'title and type are required' });
    return;
  }
  if (!AGREEMENT_TYPES.includes(type as (typeof AGREEMENT_TYPES)[number])) {
    res.status(400).json({ error: 'type must be one of: ' + AGREEMENT_TYPES.join(', ') });
    return;
  }
  const agreement = await prisma.agreement.create({
    data: {
      title,
      type: type as (typeof AGREEMENT_TYPES)[number],
      templateUrl: templateUrl || null,
      contentHtml: contentHtml ?? null,
      createdById: createdById ?? userId,
      status: 'Pending',
      version: 1,
    },
  });
  res.status(201).json(agreement);
}

/** Update agreement template. Admin only. No editing after any signature. */
export async function updateAgreement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { title, type, templateUrl, contentHtml } = req.body as {
    title?: string;
    type?: string;
    templateUrl?: string;
    contentHtml?: string;
  };
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: { assignedAgreements: { select: { status: true } } },
  });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const anySigned = agreement.assignedAgreements.some((a) => a.status === 'Signed');
  if (anySigned) {
    res.status(403).json({ error: 'Cannot edit agreement after any party has signed' });
    return;
  }
  const updated = await prisma.agreement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && AGREEMENT_TYPES.includes(type as (typeof AGREEMENT_TYPES)[number]) && { type: type as (typeof AGREEMENT_TYPES)[number] }),
      ...(templateUrl !== undefined && { templateUrl }),
      ...(contentHtml !== undefined && { contentHtml }),
      ...(contentHtml !== undefined && { version: agreement.version + 1 }),
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

/** Assign agreement to user(s). Super Admin only. Optionally set role per signer. */
export async function assignAgreement(req: Request, res: Response): Promise<void> {
  const { id: agreementId } = req.params;
  const { userId, userIds, deadline, roles } = req.body as {
    userId?: string;
    userIds?: string[];
    deadline?: string;
    roles?: Record<string, string> | string; // map userId -> role, or single role for all
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
  const roleMap = typeof roles === 'string' ? undefined : roles;
  const defaultRole = typeof roles === 'string' ? roles : undefined;
  const results: { id: string; userId: string; deadline: Date | null; role: string | null }[] = [];
  for (const uid of ids) {
    const role = roleMap?.[uid] ?? defaultRole ?? null;
    const existing = await prisma.assignedAgreement.findFirst({
      where: { agreementId, userId: uid },
    });
    if (existing) {
      await prisma.assignedAgreement.update({
        where: { id: existing.id },
        data: { deadline: deadlineDate, ...(role !== undefined && { role }) },
      });
      results.push({ id: existing.id, userId: uid, deadline: deadlineDate, role });
    } else {
      const a = await prisma.assignedAgreement.create({
        data: { agreementId, userId: uid, deadline: deadlineDate, role },
      });
      results.push({ id: a.id, userId: uid, deadline: deadlineDate, role });
    }
  }
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true },
  });
  const deadlineStr = deadlineDate ? deadlineDate.toISOString().slice(0, 10) : undefined;
  const { notify } = await import('../services/notificationService');
  for (const u of users) {
    sendNotificationEmail({
      type: 'agreement_pending',
      userEmail: u.email,
      dynamicData: { name: u.name, agreementTitle: agreement.title, deadline: deadlineStr },
    }).catch((e) => console.error('[Agreement] Email error:', e));
    notify({
      userId: u.id,
      type: 'agreement',
      title: 'Agreement ready for signature',
      message: `"${agreement.title}" has been assigned to you. Please review and sign when ready.`,
      link: `/dashboard/agreements/sign/${agreementId}`,
    }).catch(() => {});
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
    contentHtml: agreement.contentHtml ?? null,
  });
}

/** Sign agreement. Records user, timestamp, IP, device info. When all signers have signed, sets agreement status to Completed and notifies all parties. */
export async function signAgreement(req: Request, res: Response): Promise<void> {
  const { id: agreementId } = req.params;
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { signatureText, signatureUrl, deviceInfo } = req.body as {
    signatureText?: string;
    signatureUrl?: string;
    deviceInfo?: string;
  };
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
  const device = deviceInfo ?? (req.headers['user-agent'] as string)?.slice(0, 500) ?? null;
  await prisma.$transaction([
    prisma.assignedAgreement.update({
      where: { id: assigned.id },
      data: {
        status: 'Signed',
        signedAt: new Date(),
        signatureUrl: signatureUrl || signatureText || null,
        ipAddress: ip,
        deviceInfo: device,
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
  const allAssignments = await prisma.assignedAgreement.findMany({
    where: { agreementId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const allSigned = allAssignments.every((a) => a.status === 'Signed');
  if (allSigned) {
    await prisma.agreement.update({
      where: { id: agreementId },
      data: { status: 'Completed' },
    });
    for (const a of allAssignments) {
      if (a.user.email) {
        sendNotificationEmail({
          type: 'agreement_signed',
          userEmail: a.user.email,
          dynamicData: {
            name: a.user.name,
            agreementTitle: agreement.title,
            copySent: true,
          },
        }).catch((e) => console.error('[Agreement] Email error:', e));
      }
      const { notify } = await import('../services/notificationService');
      notify({
        userId: a.userId,
        type: 'agreement',
        title: 'Agreement completed',
        message: `"${agreement.title}" has been fully signed by all parties. A copy has been recorded.`,
        link: '/dashboard/legal',
      }).catch(() => {});
    }
  } else {
    const updated = await prisma.assignedAgreement.findUnique({
      where: { id: assigned.id },
      include: { agreement: { select: { title: true, type: true } }, user: { select: { email: true, name: true } } },
    });
    if (updated?.user?.email) {
      sendNotificationEmail({
        type: 'agreement_signed',
        userEmail: updated.user.email,
        dynamicData: { name: updated.user.name, agreementTitle: updated.agreement.title },
      }).catch((e) => console.error('[Agreement] Email error:', e));
    }
    const { notify } = await import('../services/notificationService');
    notify({
      userId,
      type: 'agreement',
      title: 'Agreement signed',
      message: `You signed "${updated?.agreement?.title ?? 'Agreement'}". It has been recorded.`,
      link: '/dashboard',
    }).catch(() => {});
  }
  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'agreement_signed',
    entityType: 'agreement',
    entityId: assigned.id,
    details: { agreementId },
  }).catch(() => {});
  const updated = await prisma.assignedAgreement.findUnique({
    where: { id: assigned.id },
    include: { agreement: { select: { title: true, type: true, status: true } }, user: { select: { email: true, name: true } } },
  });
  res.json({ message: 'Agreement signed successfully', assignment: updated, allSigned });
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
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
}

/** List assigned agreements with details (for Super Admin table). Filter by type, status (assignment or document). */
export async function listAssignedForAdmin(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const documentStatus = req.query.documentStatus as string | undefined;
  const agreements = await prisma.assignedAgreement.findMany({
    where: {
      ...(status && { status: status as 'Pending' | 'Signed' | 'Overdue' }),
      ...(type && { agreement: { type: type as 'NDA' | 'MOU' | 'CoFounder' | 'Terms' } }),
      ...(documentStatus && (documentStatus === 'Pending' || documentStatus === 'Completed') && {
        agreement: { status: documentStatus as 'Pending' | 'Completed' },
      }),
    },
    include: {
      agreement: { select: { id: true, title: true, type: true, templateUrl: true, status: true, version: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(agreements);
}

/** GET /agreements/:id/export — Export agreement as HTML for download/Print to PDF. Legal/Admin only. */
export async function exportAgreement(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      assignedAgreements: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!agreement) {
    res.status(404).json({ error: 'Agreement not found' });
    return;
  }
  const content = agreement.contentHtml ?? `<p>No content stored. Template: ${agreement.templateUrl ?? 'none'}</p>`;
  const signersTable = agreement.assignedAgreements
    .map(
      (a) =>
        `<tr><td>${escapeHtml(a.user.name)}</td><td>${escapeHtml(a.user.email)}</td><td>${escapeHtml(a.role ?? '—')}</td><td>${a.signedAt ? a.signedAt.toISOString() : '—'}</td><td>${escapeHtml(a.ipAddress ?? '—')}</td></tr>`
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(agreement.title)}</title></head><body>
<h1>${escapeHtml(agreement.title)}</h1>
<p><strong>Type:</strong> ${agreement.type} &nbsp; <strong>Status:</strong> ${agreement.status} &nbsp; <strong>Version:</strong> ${agreement.version}</p>
<hr/>
<div class="content">${content}</div>
<hr/>
<h2>Signature log</h2>
<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
<thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Signed at</th><th>IP</th></tr></thead>
<tbody>${signersTable}</tbody>
</table>
<p><small>Exported ${new Date().toISOString()}. PDF hash: ${agreement.pdfHash ?? 'not generated'}</small></p>
</body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${agreement.title.replace(/[^a-z0-9-_]/gi, '_')}.html"`);
  res.send(html);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** POST /agreements/from-template — Create agreement from template with auto-filled content. Super Admin only. */
export async function createFromTemplate(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const { title, type, dynamicData } = req.body as {
    title?: string;
    type?: string;
    dynamicData?: Record<string, string>;
  };
  if (!title || !type) {
    res.status(400).json({ error: 'title and type are required' });
    return;
  }
  const key = type as AgreementTemplateKey;
  const validKeys: AgreementTemplateKey[] = ['NDA', 'MOU', 'HireContract', 'Partnership', 'Investor', 'Terms', 'FairTreatment', 'CoFounder'];
  if (!validKeys.includes(key)) {
    res.status(400).json({ error: 'type must be a valid template: NDA, MOU, HireContract, Partnership, Investor, Terms, FairTreatment, CoFounder' });
    return;
  }
  const contentHtml = fillAgreementTemplate(key, dynamicData ?? {});
  const agreement = await prisma.agreement.create({
    data: {
      title,
      type: key as (typeof AGREEMENT_TYPES)[number],
      contentHtml,
      createdById: userId,
      status: 'Pending',
      version: 1,
    },
  });
  res.status(201).json(agreement);
}
