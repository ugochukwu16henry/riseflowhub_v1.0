import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

/** GET /api/v1/social-links — public: list all active social media links for display. */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  const links = await prisma.socialMediaLink.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(
    links.map((l) => ({
      id: l.id,
      platformName: l.platformName,
      url: l.url,
      iconUrl: l.iconUrl,
      active: l.active,
      clickCount: l.clickCount,
    }))
  );
}

/** POST /api/v1/social-links/:id/click — optional: track clicks for analytics. */
export async function trackClick(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  try {
    await prisma.socialMediaLink.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
    res.status(204).end();
  } catch {
    // Silently ignore errors to avoid breaking UX.
    res.status(204).end();
  }
}

/** GET /api/v1/super-admin/social-links — Super Admin: list all social links (active + inactive). */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  const links = await prisma.socialMediaLink.findMany({
    orderBy: { createdAt: 'asc' },
  });
  res.json(
    links.map((l) => ({
      id: l.id,
      platformName: l.platformName,
      url: l.url,
      iconUrl: l.iconUrl,
      active: l.active,
      clickCount: l.clickCount,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }))
  );
}

/** POST /api/v1/super-admin/social-links — Super Admin: create a new social media link. */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { platformName, url, iconUrl, active } = (req.body || {}) as {
    platformName?: string;
    url?: string;
    iconUrl?: string | null;
    active?: boolean;
  };

  if (!platformName || !url) {
    res.status(400).json({ error: 'platformName and url are required' });
    return;
  }

  const link = await prisma.socialMediaLink.create({
    data: {
      platformName: platformName.trim(),
      url: url.trim(),
      iconUrl: iconUrl?.trim() || null,
      active: active ?? true,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'social_link_created',
    entityType: 'settings',
    entityId: link.id,
    details: { platformName: link.platformName, url: link.url },
  }).catch(() => {});

  res.status(201).json(link);
}

/** PUT /api/v1/super-admin/social-links/:id — Super Admin: update an existing social link. */
export async function update(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const { platformName, url, iconUrl, active } = (req.body || {}) as {
    platformName?: string;
    url?: string;
    iconUrl?: string | null;
    active?: boolean;
  };

  const existing = await prisma.socialMediaLink.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Social link not found' });
    return;
  }

  const updated = await prisma.socialMediaLink.update({
    where: { id },
    data: {
      platformName: platformName?.trim() ?? existing.platformName,
      url: url?.trim() ?? existing.url,
      iconUrl: iconUrl === undefined ? existing.iconUrl : iconUrl?.trim() || null,
      active: active ?? existing.active,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'social_link_updated',
    entityType: 'settings',
    entityId: updated.id,
    details: { before: existing, after: updated },
  }).catch(() => {});

  res.json(updated);
}

/** DELETE /api/v1/super-admin/social-links/:id — Super Admin: delete a link. */
export async function remove(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const existing = await prisma.socialMediaLink.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Social link not found' });
    return;
  }

  await prisma.socialMediaLink.delete({ where: { id } });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'social_link_deleted',
    entityType: 'settings',
    entityId: id,
    details: { platformName: existing.platformName, url: existing.url },
  }).catch(() => {});

  res.status(204).end();
}

/** PATCH /api/v1/super-admin/social-links/:id/toggle — Super Admin: enable/disable a link. */
export async function toggle(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const existing = await prisma.socialMediaLink.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Social link not found' });
    return;
  }

  const updated = await prisma.socialMediaLink.update({
    where: { id },
    data: { active: !existing.active },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'social_link_toggled',
    entityType: 'settings',
    entityId: updated.id,
    details: { active: updated.active },
  }).catch(() => {});

  res.json(updated);
}

