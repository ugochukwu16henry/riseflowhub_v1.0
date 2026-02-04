import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

/** GET /api/v1/legal/agreements — Legal team / Super Admin: view all agreements (assignments + hire contracts) */
export async function listAgreements(req: Request, res: Response): Promise<void> {
  const assignments = await prisma.assignedAgreement.findMany({
    include: {
      agreement: { select: { id: true, title: true, type: true, createdAt: true } },
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
      status: a.status,
      signedAt: a.signedAt,
      signatureUrl: a.signatureUrl,
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
