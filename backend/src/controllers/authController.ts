import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import type { AuthPayload } from '../middleware/auth';
import { sendNotificationEmail } from '../services/emailService';

const prisma = new PrismaClient();

/** Resolve tenant id from request: X-Tenant-Domain header, or Host, or default first tenant */
export async function resolveTenantIdFromRequest(req: Request): Promise<string | null> {
  const domain =
    (req.headers['x-tenant-domain'] as string) ||
    (req.headers.host || '').split(':')[0] ||
    '';
  if (domain) {
    const tenant = await prisma.tenant.findUnique({
      where: { domain: domain.toLowerCase() },
      select: { id: true },
    });
    if (tenant) return tenant.id;
  }
  const defaultTenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return defaultTenant?.id ?? null;
}

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password, role = 'client' } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  };
  const tenantId = await resolveTenantIdFromRequest(req);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, tenantId },
    select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
  });
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  });
  sendNotificationEmail({
    type: 'account_created',
    userEmail: user.email,
    dynamicData: { name: user.name },
  }).catch((e) => console.error('[Auth] Welcome email error:', e));

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    token,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId ?? undefined,
  });
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    },
    token,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as unknown as { user: AuthPayload }).user;
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
      tenant: {
        select: {
          id: true,
          orgName: true,
          domain: true,
          logo: true,
          primaryColor: true,
          planType: true,
        },
      },
    },
  });
  if (!profile) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { tenant, ...userFields } = profile;
  res.json({
    ...userFields,
    tenant: tenant
      ? {
          id: tenant.id,
          orgName: tenant.orgName,
          domain: tenant.domain,
          logo: tenant.logo,
          primaryColor: tenant.primaryColor,
          planType: tenant.planType,
        }
      : null,
  });
}

export function logout(_req: Request, res: Response): void {
  res.json({ message: 'Logged out' });
}
