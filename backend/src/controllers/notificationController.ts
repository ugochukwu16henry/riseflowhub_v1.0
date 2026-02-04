import { Request, Response } from 'express';
import type { AuthPayload } from '../middleware/auth';
import * as notificationService from '../services/notificationService';

/** GET /api/v1/notifications — List user notifications */
export async function list(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
  const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';
  const { items, unreadCount } = await notificationService.getForUser(payload.userId, {
    limit,
    unreadOnly,
  });
  res.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
    unreadCount,
  });
}

/** PATCH /api/v1/notifications/:id/read — Mark one as read */
export async function markRead(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const id = req.params.id as string;
  const ok = await notificationService.markRead(id, payload.userId);
  if (!ok) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  res.json({ ok: true });
}

/** POST /api/v1/notifications/mark-all-read — Mark all as read */
export async function markAllRead(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const count = await notificationService.markAllRead(payload.userId);
  res.json({ ok: true, count });
}

/** POST /api/v1/notifications/send — Internal: create notification (API key or system) */
export async function send(req: Request, res: Response): Promise<void> {
  const apiKey = process.env.INTERNAL_API_KEY;
  if (apiKey) {
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.headers['x-api-key'];
    if (auth !== apiKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }
  const { userId, type, title, message, link } = req.body as {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
  };
  if (!userId || !type || !title || !message) {
    res.status(400).json({ error: 'userId, type, title, message required' });
    return;
  }
  const id = await notificationService.createNotification({
    userId,
    type,
    title,
    message,
    link: link || null,
  });
  res.status(201).json({ id });
}
