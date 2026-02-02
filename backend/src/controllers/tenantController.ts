import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';

const prisma = new PrismaClient();

function getTenantId(req: Request): string | null {
  const user = (req as unknown as { user?: AuthPayload }).user;
  return user?.tenantId ?? null;
}

/** GET /api/v1/tenants/current — Branding for current tenant (from JWT or domain) */
export async function getCurrent(req: Request, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.json({ tenant: null, branding: null });
    return;
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      orgName: true,
      domain: true,
      logo: true,
      primaryColor: true,
      planType: true,
    },
  });
  if (!tenant) {
    res.json({ tenant: null, branding: null });
    return;
  }
  res.json({
    tenant: {
      id: tenant.id,
      orgName: tenant.orgName,
      domain: tenant.domain,
      planType: tenant.planType,
    },
    branding: {
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
    },
  });
}

/** GET /api/v1/tenants — List all tenants (super_admin only) */
export async function listAll(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin only' });
    return;
  }
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true } },
    },
  });
  res.json(
    tenants.map((t) => ({
      id: t.id,
      orgName: t.orgName,
      domain: t.domain,
      logo: t.logo,
      primaryColor: t.primaryColor,
      planType: t.planType,
      createdAt: t.createdAt,
      userCount: (t as { _count?: { users: number } })._count?.users ?? 0,
    }))
  );
}

/** POST /api/v1/tenants — Create tenant (super_admin only) */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin only' });
    return;
  }
  const { orgName, domain, logo, primaryColor, planType } = req.body as {
    orgName: string;
    domain?: string;
    logo?: string;
    primaryColor?: string;
    planType?: string;
  };
  const tenant = await prisma.tenant.create({
    data: {
      orgName,
      domain: domain?.trim() || null,
      logo: logo || null,
      primaryColor: primaryColor || null,
      planType: planType || 'free',
    },
  });
  res.status(201).json(tenant);
}

/** PATCH /api/v1/tenants/:id — Update tenant (super_admin or same-tenant admin) */
export async function update(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { id } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  const isSuperAdmin = payload.role === 'super_admin';
  const isSameTenant = payload.tenantId === tenant.id;
  if (!isSuperAdmin && !isSameTenant) {
    res.status(403).json({ error: 'Cannot update this tenant' });
    return;
  }
  const { orgName, domain, logo, primaryColor, planType } = req.body as {
    orgName?: string;
    domain?: string | null;
    logo?: string | null;
    primaryColor?: string | null;
    planType?: string;
  };
  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      ...(orgName !== undefined && { orgName }),
      ...(domain !== undefined && { domain: domain || null }),
      ...(logo !== undefined && { logo: logo || null }),
      ...(primaryColor !== undefined && { primaryColor: primaryColor || null }),
      ...(planType !== undefined && { planType: planType as 'free' | 'starter' | 'growth' | 'enterprise' }),
    },
  });
  res.json(updated);
}

/** GET /api/v1/tenants/:id/billing — List billing records for tenant */
export async function listBilling(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { id } = req.params;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    res.status(404).json({ error: 'Tenant not found' });
    return;
  }
  const isSuperAdmin = payload.role === 'super_admin';
  const isSameTenant = payload.tenantId === tenant.id;
  if (!isSuperAdmin && !isSameTenant) {
    res.status(403).json({ error: 'Cannot view this tenant billing' });
    return;
  }
  const billing = await prisma.tenantBilling.findMany({
    where: { tenantId: id },
    orderBy: { periodEnd: 'desc' },
  });
  res.json(billing);
}

/** POST /api/v1/tenants/:id/billing — Create billing record (super_admin or system) */
export async function createBilling(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  if (payload.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin only' });
    return;
  }
  const { id } = req.params;
  const { periodStart, periodEnd, amount, status } = req.body as {
    periodStart: string;
    periodEnd: string;
    amount: number;
    status?: string;
  };
  const billing = await prisma.tenantBilling.create({
    data: {
      tenantId: id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      amount,
      status: status || 'pending',
    },
  });
  res.status(201).json(billing);
}
