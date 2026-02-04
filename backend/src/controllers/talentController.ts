import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { hashPassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

/** POST /api/v1/talent/apply — Sign up as talent + submit profile (or add profile if already registered) */
export async function apply(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    name?: string;
    email?: string;
    password?: string;
    skills: string[];
    customRole?: string;
    roleCategory?: string;
    yearsExperience: number;
    portfolioUrl?: string;
    resumeUrl?: string;
    cvUrl?: string;
    pastProjects?: Array<{ title: string; description?: string; url?: string }>;
    shortBio?: string;
    availability?: 'full_time' | 'part_time' | 'freelance';
    country?: string;
    phone?: string;
    services?: Array<{ title: string; description?: string; rate?: string }>;
    skillRates?: Record<string, string>;
    videoUrl?: string;
  };
  const {
    name,
    email,
    password,
    skills,
    customRole,
    roleCategory,
    yearsExperience,
    portfolioUrl,
    resumeUrl,
    cvUrl,
    pastProjects,
    shortBio,
    availability,
    country,
    phone,
    services,
    skillRates,
    videoUrl,
  } = body;

  if (!Array.isArray(skills) || skills.length === 0 || typeof yearsExperience !== 'number') {
    res.status(400).json({ error: 'skills (array) and yearsExperience (number) required' });
    return;
  }

  const payload = (req as unknown as { user?: AuthPayload }).user;
  let userId: string;

  if (payload) {
    userId = payload.userId;
    const existing = await prisma.talent.findUnique({ where: { userId } });
    if (existing) {
      res.status(400).json({ error: 'Talent profile already exists' });
      return;
    }
  } else {
    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'name, email, password required when not logged in' });
      return;
    }
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existingUser) {
      const existingTalent = await prisma.talent.findUnique({ where: { userId: existingUser.id } });
      if (existingTalent) {
        res.status(400).json({ error: 'Email already registered as talent' });
        return;
      }
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'talent' },
      });
    } else {
      const defaultTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          passwordHash,
          role: 'talent',
          tenantId: defaultTenant?.id ?? undefined,
        },
      });
      userId = user.id;
    }
  }

  const talent = await prisma.talent.create({
    data: {
      userId,
      skills: skills.map((s) => String(s).trim()).filter(Boolean),
      customRole: customRole?.trim() || null,
      roleCategory: roleCategory?.trim() || null,
      yearsExperience,
      portfolioUrl: portfolioUrl?.trim() || null,
      resumeUrl: resumeUrl?.trim() || null,
      cvUrl: cvUrl?.trim() || null,
      pastProjects: pastProjects ?? null,
      shortBio: shortBio?.trim() || null,
      availability: availability ?? null,
      country: country?.trim() || null,
      phone: phone?.trim() || null,
      services: services ?? null,
      skillRates: skillRates ?? null,
      videoUrl: videoUrl?.trim() || null,
      status: 'pending',
    },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  createAuditLog(prisma, {
    adminId: userId,
    actionType: 'talent_applied',
    entityType: 'talent',
    entityId: talent.id,
    details: { email: talent.user.email },
  }).catch(() => {});

  const token = payload ? undefined : signToken({
    userId: talent.user.id,
    email: talent.user.email,
    role: 'talent',
    tenantId: null,
  });

  res.status(201).json({
    talent: {
      id: talent.id,
      status: talent.status,
      skills: talent.skills,
      yearsExperience: talent.yearsExperience,
      portfolioUrl: talent.portfolioUrl,
      user: { id: talent.user.id, name: talent.user.name, email: talent.user.email, role: talent.user.role },
    },
    ...(token && { token }),
  });
}

/** GET /api/v1/talent/marketplace — Public: list approved talents */
export async function marketplace(req: Request, res: Response): Promise<void> {
  const skills = req.query.skills as string | undefined;
  const skillList = skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const where: { status: 'approved'; skills?: { hasSome: string[] } } = { status: 'approved' };
  if (skillList.length > 0) {
    where.skills = { hasSome: skillList };
  }

  const talents = await prisma.talent.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ averageRating: 'desc' }, { ratingCount: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({
    items: talents.map((t) => ({
      id: t.id,
      name: t.user.name,
      skills: t.skills,
      customRole: t.customRole,
      roleCategory: t.roleCategory,
      yearsExperience: t.yearsExperience,
      portfolioUrl: t.portfolioUrl,
      pastProjects: t.pastProjects,
      shortBio: t.shortBio,
      availability: t.availability,
      country: t.country,
      services: t.services,
      skillRates: t.skillRates,
      videoUrl: t.videoUrl,
      averageRating: t.averageRating != null ? Number(t.averageRating) : null,
      ratingCount: t.ratingCount,
    })),
  });
}

/** GET /api/v1/talent/profile — Own talent profile (auth) */
export async function profile(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const talent = await prisma.talent.findUnique({
    where: { userId: payload.userId },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!talent) {
    res.status(404).json({ error: 'Talent profile not found' });
    return;
  }
  res.json({
    id: talent.id,
    status: talent.status,
    skills: talent.skills,
    customRole: talent.customRole,
    roleCategory: talent.roleCategory,
    yearsExperience: talent.yearsExperience,
    portfolioUrl: talent.portfolioUrl,
    resumeUrl: talent.resumeUrl,
    cvUrl: talent.cvUrl,
    pastProjects: talent.pastProjects,
    shortBio: talent.shortBio,
    availability: talent.availability,
    country: talent.country,
    phone: talent.phone,
    services: talent.services,
    skillRates: talent.skillRates,
    videoUrl: talent.videoUrl,
    feePaid: talent.feePaid,
    averageRating: talent.averageRating != null ? Number(talent.averageRating) : null,
    ratingCount: talent.ratingCount,
    createdAt: talent.createdAt,
    approvedAt: talent.approvedAt,
    user: talent.user,
  });
}

/** PUT /api/v1/talent/profile — Talent: update own profile */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const body = req.body as {
    skills?: string[];
    customRole?: string;
    roleCategory?: string;
    yearsExperience?: number;
    portfolioUrl?: string;
    resumeUrl?: string;
    cvUrl?: string;
    pastProjects?: Array<{ title: string; description?: string; url?: string }>;
    shortBio?: string;
    availability?: 'full_time' | 'part_time' | 'freelance';
    country?: string;
    phone?: string;
    services?: Array<{ title: string; description?: string; rate?: string }>;
    skillRates?: Record<string, string>;
    videoUrl?: string;
  };
  const talent = await prisma.talent.findUnique({ where: { userId: payload.userId } });
  if (!talent) {
    res.status(404).json({ error: 'Talent profile not found' });
    return;
  }
  const data: Record<string, unknown> = {};
  if (body.skills !== undefined) data.skills = body.skills.map((s) => String(s).trim()).filter(Boolean);
  if (body.customRole !== undefined) data.customRole = body.customRole?.trim() || null;
  if (body.roleCategory !== undefined) data.roleCategory = body.roleCategory?.trim() || null;
  if (body.yearsExperience !== undefined) data.yearsExperience = body.yearsExperience;
  if (body.portfolioUrl !== undefined) data.portfolioUrl = body.portfolioUrl?.trim() || null;
  if (body.resumeUrl !== undefined) data.resumeUrl = body.resumeUrl?.trim() || null;
  if (body.cvUrl !== undefined) data.cvUrl = body.cvUrl?.trim() || null;
  if (body.pastProjects !== undefined) data.pastProjects = body.pastProjects;
  if (body.shortBio !== undefined) data.shortBio = body.shortBio?.trim() || null;
  if (body.availability !== undefined) data.availability = body.availability;
  if (body.country !== undefined) data.country = body.country?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.services !== undefined) data.services = body.services;
  if (body.skillRates !== undefined) data.skillRates = body.skillRates;
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl?.trim() || null;
  const updated = await prisma.talent.update({
    where: { id: talent.id },
    data: data as import('@prisma/client').Prisma.TalentUpdateInput,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  res.json({
    id: updated.id,
    status: updated.status,
    skills: updated.skills,
    customRole: updated.customRole,
    roleCategory: updated.roleCategory,
    yearsExperience: updated.yearsExperience,
    portfolioUrl: updated.portfolioUrl,
    resumeUrl: updated.resumeUrl,
    cvUrl: updated.cvUrl,
    pastProjects: updated.pastProjects,
    shortBio: updated.shortBio,
    availability: updated.availability,
    country: updated.country,
    phone: updated.phone,
    services: updated.services,
    skillRates: updated.skillRates,
    videoUrl: updated.videoUrl,
    feePaid: updated.feePaid,
    averageRating: updated.averageRating != null ? Number(updated.averageRating) : null,
    ratingCount: updated.ratingCount,
    user: updated.user,
  });
}

/** GET /api/v1/talent — HR/Admin: list all talents with filters */
export async function list(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string | undefined;
  const where: { status?: 'pending' | 'approved' | 'rejected' } = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where.status = status as 'pending' | 'approved' | 'rejected';
  }

  const talents = await prisma.talent.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    items: talents.map((t) => ({
      id: t.id,
      status: t.status,
      skills: t.skills,
      customRole: t.customRole,
      yearsExperience: t.yearsExperience,
      portfolioUrl: t.portfolioUrl,
      feePaid: t.feePaid,
      averageRating: t.averageRating != null ? Number(t.averageRating) : null,
      ratingCount: t.ratingCount,
      createdAt: t.createdAt,
      approvedAt: t.approvedAt,
      user: t.user,
    })),
  });
}

/** PUT /api/v1/talent/:id/approve — HR/Admin: approve or reject talent */
export async function approve(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { status } = req.body as { status: 'approved' | 'rejected' };
  const payload = (req as unknown as { user: AuthPayload }).user;

  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'status must be approved or rejected' });
    return;
  }

  const talent = await prisma.talent.findUnique({ where: { id } });
  if (!talent) {
    res.status(404).json({ error: 'Talent not found' });
    return;
  }

  await prisma.talent.update({
    where: { id },
    data: {
      status,
      approvedAt: status === 'approved' ? new Date() : null,
      approvedById: status === 'approved' ? payload.userId : null,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'talent_approval',
    entityType: 'talent',
    entityId: talent.id,
    details: { status },
  }).catch(() => {});

  res.json({ ok: true, status });
}
