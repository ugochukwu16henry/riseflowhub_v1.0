import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/equity/company — list platform equity rows. */
export async function listCompany(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.companyEquity.findMany({
    orderBy: { equityPercent: 'desc' },
  });
  res.json({ items: rows });
}

/** POST /api/v1/super-admin/equity/company — create new company equity row. */
export async function createCompany(req: Request, res: Response): Promise<void> {
  const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as {
    personName: string;
    role: string;
    shares: number;
    equityPercent: number;
    vestingStart?: string;
    vestingYears: number;
  };
  const created = await prisma.companyEquity.create({
    data: {
      personName,
      role,
      shares,
      equityPercent,
      vestingStart: vestingStart ? new Date(vestingStart) : null,
      vestingYears,
    },
  });
  res.status(201).json(created);
}

/** PUT /api/v1/super-admin/equity/company/:id — update equity row. */
export async function updateCompany(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as Partial<{
    personName: string;
    role: string;
    shares: number;
    equityPercent: number;
    vestingStart: string;
    vestingYears: number;
  }>;
  const updated = await prisma.companyEquity.update({
    where: { id },
    data: {
      ...(personName !== undefined && { personName }),
      ...(role !== undefined && { role }),
      ...(shares !== undefined && { shares }),
      ...(equityPercent !== undefined && { equityPercent }),
      ...(vestingStart !== undefined && { vestingStart: vestingStart ? new Date(vestingStart) : null }),
      ...(vestingYears !== undefined && { vestingYears }),
    },
  });
  res.json(updated);
}

/** DELETE /api/v1/super-admin/equity/company/:id — delete equity row. */
export async function deleteCompany(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.companyEquity.delete({ where: { id } });
  res.status(204).send();
}

/** GET /api/v1/super-admin/equity/startup/:startupId — list startup equity rows. */
export async function listStartup(req: Request, res: Response): Promise<void> {
  const { startupId } = req.params;
  const rows = await prisma.startupEquity.findMany({
    where: { startupId },
    orderBy: { equityPercent: 'desc' },
  });
  res.json({ items: rows });
}

/** POST /api/v1/super-admin/equity/startup/:startupId — create startup equity row. */
export async function createStartup(req: Request, res: Response): Promise<void> {
  const { startupId } = req.params;
  const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as {
    personName: string;
    role: string;
    shares?: number;
    equityPercent: number;
    vestingStart?: string;
    vestingYears: number;
  };
  const created = await prisma.startupEquity.create({
    data: {
      startupId,
      personName,
      role,
      shares: shares ?? null,
      equityPercent,
      vestingStart: vestingStart ? new Date(vestingStart) : null,
      vestingYears,
    },
  });
  res.status(201).json(created);
}

/** PUT /api/v1/super-admin/equity/startup/:startupId/:id — update startup equity row. */
export async function updateStartup(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { personName, role, shares, equityPercent, vestingStart, vestingYears } = req.body as Partial<{
    personName: string;
    role: string;
    shares: number;
    equityPercent: number;
    vestingStart: string;
    vestingYears: number;
  }>;
  const updated = await prisma.startupEquity.update({
    where: { id },
    data: {
      ...(personName !== undefined && { personName }),
      ...(role !== undefined && { role }),
      ...(shares !== undefined && { shares }),
      ...(equityPercent !== undefined && { equityPercent }),
      ...(vestingStart !== undefined && { vestingStart: vestingStart ? new Date(vestingStart) : null }),
      ...(vestingYears !== undefined && { vestingYears }),
    },
  });
  res.json(updated);
}

/** DELETE /api/v1/super-admin/equity/startup/:startupId/:id — delete startup equity row. */
export async function deleteStartup(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await prisma.startupEquity.delete({ where: { id } });
  res.status(204).send();
}

