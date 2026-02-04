import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** POST /api/v1/partner — Partner With Us: submit inquiry (investors, organizations, recruiters, agencies) */
export async function submit(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    companyName: string;
    website?: string;
    partnershipType: string;
    servicesOffered?: string;
    message: string;
    contactEmail?: string;
    contactName?: string;
  };
  const { companyName, website, partnershipType, servicesOffered, message, contactEmail, contactName } = body;

  if (!companyName?.trim() || !partnershipType?.trim() || !message?.trim()) {
    res.status(400).json({ error: 'companyName, partnershipType, and message required' });
    return;
  }

  const allowed = ['Investor', 'Organization', 'Recruiter', 'Agency'];
  const type = allowed.includes(partnershipType.trim()) ? partnershipType.trim() : 'Organization';

  const inquiry = await prisma.partnerInquiry.create({
    data: {
      companyName: companyName.trim(),
      website: website?.trim() || null,
      partnershipType: type,
      servicesOffered: servicesOffered?.trim() || null,
      message: message.trim(),
      contactEmail: contactEmail?.trim() || null,
      contactName: contactName?.trim() || null,
    },
  });

  res.status(201).json({
    id: inquiry.id,
    companyName: inquiry.companyName,
    partnershipType: inquiry.partnershipType,
    message: 'Thank you. We will be in touch.',
  });
}

/** GET /api/v1/partner — Super Admin: list partner inquiries */
export async function list(req: Request, res: Response): Promise<void> {
  const list = await prisma.partnerInquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ items: list });
}
