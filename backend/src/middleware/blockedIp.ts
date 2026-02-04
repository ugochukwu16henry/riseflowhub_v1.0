import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getClientIp, logSecurityEvent } from '../services/securityService';

const prisma = new PrismaClient();

/** Blocks requests from IPs recorded in BlockedIp table (auto or manual). */
export async function blockedIpMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = getClientIp(req);
  if (!ip || ip === 'unknown') {
    next();
    return;
  }

  try {
    const blocked = await prisma.blockedIp.findFirst({
      where: {
        ip,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!blocked) {
      next();
      return;
    }

    await logSecurityEvent({
      ip,
      userId: (req as any).user?.userId ?? null,
      userAgent: req.headers['user-agent'] as string | undefined,
      type: 'ip_blocked',
      severity: 'high',
      message: `Request blocked for IP in BlockedIp table`,
      metadata: {
        path: req.path,
        method: req.method,
        reason: blocked.reason,
        source: blocked.source,
      },
    }).catch(() => {});

    res.status(429).json({
      error: 'Too many suspicious requests detected from this IP. Please try again later.',
    });
  } catch (e) {
    console.error('[Security] blockedIpMiddleware error:', e);
    next();
  }
}

