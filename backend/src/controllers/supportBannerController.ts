import type { Request, Response } from 'express';
import { PrismaClient, SupportBannerEventType } from '@prisma/client';

const prisma = new PrismaClient();

/** POST /api/v1/support-banner/events — log banner interactions (shown, clicked_support, closed, dont_show_again) */
export async function logEvent(req: Request, res: Response): Promise<void> {
  const { eventType, metadata } = req.body as {
    eventType?: SupportBannerEventType | string;
    metadata?: Record<string, unknown>;
  };

  if (!eventType) {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  const allowed: SupportBannerEventType[] = [
    'shown',
    'clicked_support',
    'closed',
    'dont_show_again',
  ];
  if (!allowed.includes(eventType as SupportBannerEventType)) {
    res.status(400).json({ error: 'Invalid eventType' });
    return;
  }

  const userId = (req as any).user?.userId ?? null;

  await prisma.supportBannerEvent.create({
    data: {
      userId,
      eventType: eventType as SupportBannerEventType,
      metadata: (metadata ?? undefined) as any,
    },
  });

  res.status(201).json({ ok: true });
}

