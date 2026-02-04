import type { Request, Response } from 'express';
import { PrismaClient, SecuritySeverity } from '@prisma/client';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/security/overview */
export async function overview(_req: Request, res: Response): Promise<void> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [events24h, events7d, blockedActive] = await Promise.all([
    prisma.securityEvent.count({ where: { createdAt: { gte: since24h } } }),
    prisma.securityEvent.count({ where: { createdAt: { gte: since7d } } }),
    prisma.blockedIp.count({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
  ]);

  res.json({
    eventsLast24h: events24h,
    eventsLast7d: events7d,
    blockedActive,
    topIps: [],
  });
}

/** GET /api/v1/super-admin/security/events */
export async function listEvents(req: Request, res: Response): Promise<void> {
  const { type, severity, limit = '100' } = req.query as {
    type?: string;
    severity?: SecuritySeverity;
    limit?: string;
  };
  const take = Math.min(parseInt(limit, 10) || 100, 500);

  const where: any = {};
  if (type) where.type = type;
  if (severity) where.severity = severity;

  const events = await prisma.securityEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  res.json({
    items: events.map((e) => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      message: e.message,
      ip: e.ip,
      createdAt: e.createdAt,
      autoBlocked: e.autoBlocked,
      user: e.user
        ? {
            id: e.user.id,
            email: e.user.email,
            name: e.user.name,
            role: e.user.role,
          }
        : null,
    })),
  });
}

/** GET /api/v1/super-admin/security/blocked-ips */
export async function listBlockedIps(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.blockedIp.findMany({
    orderBy: { blockedAt: 'desc' },
    take: 200,
  });
  res.json({ items: rows });
}

/** DELETE /api/v1/super-admin/security/blocked-ips/:id — manually unblock an IP */
export async function unblockIp(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const row = await prisma.blockedIp.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await prisma.blockedIp.delete({ where: { id } });
  res.json({ ok: true });
}

