import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNotificationEmail } from '../services/emailService';
import { notify } from '../services/notificationService';

const prisma = new PrismaClient();

export interface ContactMessageBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  attachmentUrl?: string;
}

/** POST /api/v1/contact — Public: submit contact message */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as ContactMessageBody;
  const { name, email, subject, message, phone, attachmentUrl } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ error: 'Name, email, and message are required' });
    return;
  }

  const contact = await prisma.contactMessage.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || null,
      message: message.trim(),
      phone: phone?.trim() || null,
      attachmentUrl: attachmentUrl?.trim() || null,
      status: 'unread',
    },
  });

  const founders = [
    process.env.FOUNDER_EMAIL_PRIMARY || 'ugochukwuhenry16@gmail.com',
    process.env.FOUNDER_EMAIL_SECONDARY || 'ugochukwuprince16@gmail.com',
  ];

  // Fire-and-forget email forwards to founders
  founders.forEach((to) => {
    if (!to) return;
    sendNotificationEmail({
      type: 'platform_message_forward',
      userEmail: to,
      dynamicData: {
        senderName: contact.name,
        senderEmail: contact.email,
        senderPhone: contact.phone,
        subject: contact.subject ?? '',
        message: contact.message,
      },
    }).catch(() => {});
  });

  // In-app notification to all Super Admins
  prisma.user
    .findMany({
      where: { role: 'super_admin' },
      select: { id: true },
    })
    .then((admins) =>
      Promise.all(
        admins.map((admin) =>
          notify({
            userId: admin.id,
            type: 'message',
            title: 'New platform message received',
            message: `${contact.name} (${contact.email}) sent a new message: ${contact.subject ?? 'No subject'}`,
            link: '/dashboard/admin/messages',
          })
        )
      )
    )
    .catch((e) => {
      console.error('[Contact] Failed to create admin notifications:', e);
    });

  res.status(201).json({
    id: contact.id,
    message: 'Your message has been sent. We will get back to you shortly.',
  });
}
