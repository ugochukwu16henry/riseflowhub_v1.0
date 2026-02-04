/**
 * In-app notification system. Create notifications for payment, approval, hiring, agreement, rating, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationType =
  | 'payment'
  | 'approval'
  | 'message'
  | 'hiring'
  | 'agreement'
  | 'rating'
  | 'project_update'
  | 'talent_approved'
  | 'hire_request'
  | 'interview_invite'
  | 'investor_interest'
  | 'startup_submitted';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
}

/** Create a notification (fire-and-forget; use in controllers after DB commits) */
export async function createNotification(params: CreateNotificationParams): Promise<string> {
  const created = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });
  return created.id;
}

/** Create notification without throwing (for use in triggers) */
export async function notify(params: CreateNotificationParams): Promise<void> {
  try {
    await createNotification(params);
  } catch (e) {
    console.error('[Notification] create failed:', e);
  }
}

export async function getForUser(userId: string, options?: { limit?: number; unreadOnly?: boolean }) {
  const limit = options?.limit ?? 50;
  const where: { userId: string; read?: boolean } = { userId };
  if (options?.unreadOnly) where.read = false;
  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });
  return { items, unreadCount };
}

export async function markRead(notificationId: string, userId: string): Promise<boolean> {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!n) return false;
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  return true;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return result.count;
}
