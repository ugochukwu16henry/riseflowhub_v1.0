import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

/** GET /api/v1/share-meta/:page — public: fetch social share metadata for a page. */
export async function getByPage(req: Request, res: Response): Promise<void> {
  const { page } = req.params as { page: string };
  const record = await prisma.socialShareMeta.findUnique({
    where: { pageName: page },
  });

  if (!record) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json({
    id: record.id,
    pageName: record.pageName,
    title: record.title,
    description: record.description,
    imageUrl: record.imageUrl,
    canonicalUrl: record.canonicalUrl,
  });
}

/** GET /api/v1/super-admin/share-meta — Super Admin: list all social share metadata. */
export async function listAdmin(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.socialShareMeta.findMany({
    orderBy: { pageName: 'asc' },
  });
  res.json(rows);
}

/** POST /api/v1/super-admin/share-meta — Super Admin: create new metadata. */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { pageName, title, description, imageUrl, canonicalUrl } = (req.body || {}) as {
    pageName?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    canonicalUrl?: string;
  };

  if (!pageName || !title || !description || !imageUrl || !canonicalUrl) {
    res.status(400).json({ error: 'pageName, title, description, imageUrl and canonicalUrl are required' });
    return;
  }

  const created = await prisma.socialShareMeta.create({
    data: {
      pageName: pageName.trim(),
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      canonicalUrl: canonicalUrl.trim(),
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'share_meta_created',
    entityType: 'settings',
    entityId: created.id,
    details: { pageName: created.pageName },
  }).catch(() => {});

  res.status(201).json(created);
}

/** PUT /api/v1/super-admin/share-meta/:id — Super Admin: update metadata. */
export async function update(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const existing = await prisma.socialShareMeta.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const { pageName, title, description, imageUrl, canonicalUrl } = (req.body || {}) as {
    pageName?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    canonicalUrl?: string;
  };

  const updated = await prisma.socialShareMeta.update({
    where: { id },
    data: {
      pageName: pageName?.trim() ?? existing.pageName,
      title: title?.trim() ?? existing.title,
      description: description?.trim() ?? existing.description,
      imageUrl: imageUrl?.trim() ?? existing.imageUrl,
      canonicalUrl: canonicalUrl?.trim() ?? existing.canonicalUrl,
    },
  });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'share_meta_updated',
    entityType: 'settings',
    entityId: updated.id,
    details: { before: existing, after: updated },
  }).catch(() => {});

  res.json(updated);
}

/** DELETE /api/v1/super-admin/share-meta/:id — Super Admin: delete metadata. */
export async function remove(req: Request, res: Response): Promise<void> {
  const payload = (req as Request & { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { id } = req.params as { id: string };
  const existing = await prisma.socialShareMeta.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  await prisma.socialShareMeta.delete({ where: { id } });

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'share_meta_deleted',
    entityType: 'settings',
    entityId: id,
    details: { pageName: existing.pageName },
  }).catch(() => {});

  res.status(204).end();
}

