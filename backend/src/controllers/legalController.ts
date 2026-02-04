import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/legal/agreements — Legal team / Super Admin: view all agreements. Optional filter: type, status, documentStatus. */
export async function listAgreements(req: Request, res: Response): Promise<void> {
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;
  const documentStatus = req.query.documentStatus as string | undefined;
  const assignments = await prisma.assignedAgreement.findMany({
    where: {
      ...(type && { agreement: { type: type as 'NDA' | 'MOU' | 'CoFounder' | 'Terms' | 'FairTreatment' | 'HireContract' | 'Partnership' | 'Investor' } }),
      ...(status && { status: status as 'Pending' | 'Signed' | 'Overdue' | 'Disputed' }),
      ...(documentStatus && (documentStatus === 'Pending' || documentStatus === 'Completed') && { agreement: { status: documentStatus as 'Pending' | 'Completed' } }),
    },
    include: {
      agreement: { select: { id: true, title: true, type: true, status: true, version: true, createdAt: true } },
      user: { select: { id: true, name: true, email: true } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const hiresWithAgreement = await prisma.hire.findMany({
    where: { agreementId: { not: null } },
    include: {
      agreement: true,
      talent: { include: { user: { select: { id: true, name: true, email: true } } } },
      hirer: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    assignments: assignments.map((a) => ({
      id: a.id,
      agreementId: a.agreementId,
      agreement: a.agreement,
      userId: a.userId,
      user: a.user,
      role: a.role,
      status: a.status,
      signedAt: a.signedAt,
      signatureUrl: a.signatureUrl,
      ipAddress: a.ipAddress,
      deviceInfo: a.deviceInfo,
      deadline: a.deadline,
      createdAt: a.createdAt,
      auditLogs: a.auditLogs,
    })),
    hireContracts: hiresWithAgreement.map((h) => ({
      hireId: h.id,
      agreementId: h.agreementId,
      agreement: h.agreement,
      projectTitle: h.projectTitle,
      talent: h.talent.user,
      hirer: h.hirer.user,
      status: h.status,
      createdAt: h.createdAt,
    })),
  });
}

/** GET /api/v1/legal/disputes — Legal team / Super Admin: agreements with status Disputed */
export async function listDisputes(req: Request, res: Response): Promise<void> {
  const assignments = await prisma.assignedAgreement.findMany({
    where: { status: 'Disputed' },
    include: {
      agreement: { select: { id: true, title: true, type: true } },
      user: { select: { id: true, name: true, email: true } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: assignments.map((a) => ({
      id: a.id,
      agreementId: a.agreementId,
      agreement: a.agreement,
      user: a.user,
      status: a.status,
      signedAt: a.signedAt,
      deadline: a.deadline,
      createdAt: a.createdAt,
      auditLogs: a.auditLogs,
    })),
  });
}
