import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getUsersWithBirthdayToday, sendBirthdayWishesForToday } from '../services/birthdayService';

const prisma = new PrismaClient();

/** GET /api/v1/super-admin/birthday-wishes/today — Super Admin: users with birthdays today. */
export async function today(_req: Request, res: Response): Promise<void> {
  const users = await getUsersWithBirthdayToday();
  res.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      birthday: u.birthday,
      timezone: u.timezone,
      sent: Boolean(u.log),
      log: u.log
        ? {
            sentEmail: u.log.sentEmail,
            sentInApp: u.log.sentInApp,
            sentPush: u.log.sentPush,
            sentAt: u.log.sentAt,
          }
        : null,
    }))
  );
}

/** POST /api/v1/super-admin/birthday-wishes/send — Super Admin: trigger sending birthday wishes for today. */
export async function send(_req: Request, res: Response): Promise<void> {
  const result = await sendBirthdayWishesForToday();
  res.json(result);
}

/** GET /api/v1/super-admin/birthday-wishes/logs — Super Admin: view birthday wishes log (paginated). */
export async function logs(req: Request, res: Response): Promise<void> {
  const { page = '1', limit = '50' } = req.query as { page?: string; limit?: string };
  const pageNum = Math.max(1, parseInt(page || '1', 10));
  const take = Math.min(parseInt(limit || '50', 10), 200);
  const skip = (pageNum - 1) * take;

  const [items, total] = await Promise.all([
    prisma.birthdayWishLog.findMany({
      orderBy: { sentAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.birthdayWishLog.count(),
  ]);

  res.json({
    total,
    page: pageNum,
    limit: take,
    items: items.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
      role: row.user.role,
      sentEmail: row.sentEmail,
      sentInApp: row.sentInApp,
      sentPush: row.sentPush,
      sentAt: row.sentAt,
    })),
  });
}

