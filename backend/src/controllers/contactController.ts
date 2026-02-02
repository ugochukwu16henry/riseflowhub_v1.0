import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContactMessageBody {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

/** Stub: send email notification to admin */
function notifyAdmin(msg: ContactMessageBody): void {
  console.log('[Contact] Admin notification (stub):', {
    name: msg.name,
    email: msg.email,
    subject: msg.subject,
    messagePreview: msg.message?.slice(0, 80) + '...',
  });
  // TODO: Integrate nodemailer / SendGrid to admin email
}

/** POST /api/v1/contact — Public: submit contact message */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as ContactMessageBody;
  const { name, email, subject, message } = body;

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
    },
  });

  notifyAdmin(body);

  res.status(201).json({
    id: contact.id,
    message: 'Your message has been sent. We will get back to you shortly.',
  });
}
