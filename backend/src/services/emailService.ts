import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { getEmailContent, type EmailType } from '../emails';

const prisma = new PrismaClient();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT) || 1025;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

/** Log email attempt to DB (pending -> sent | failed) */
export async function logEmail(params: {
  type: string;
  toEmail: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<string> {
  const created = await prisma.emailLog.create({
    data: {
      type: params.type,
      toEmail: params.toEmail,
      subject: params.subject,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
      sentAt: params.status === 'sent' ? new Date() : null,
      metadata: (params.metadata ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
    },
  });
  return created.id;
}

export async function updateEmailLog(
  id: string,
  updates: { status: 'sent' | 'failed'; errorMessage?: string | null; sentAt?: Date | null }
): Promise<void> {
  await prisma.emailLog.update({
    where: { id },
    data: updates,
  });
}

/** Send one email with retries and DB logging */
export async function sendEmail(params: {
  type: EmailType;
  toEmail: string;
  dynamicData?: Record<string, unknown>;
}): Promise<{ success: boolean; logId: string; error?: string }> {
  const { type, toEmail, dynamicData = {} } = params;
  const { subject, html } = getEmailContent(type, { ...dynamicData, email: toEmail });

  const logId = await logEmail({
    type,
    toEmail,
    subject,
    status: 'pending',
    metadata: dynamicData as object,
  });

  const from = process.env.EMAIL_FROM || 'AfriLaunch Hub <noreply@afrilaunchhub.com>';
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const transport = getTransport();
      await transport.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });
      await updateEmailLog(logId, { status: 'sent', sentAt: new Date() });
      return { success: true, logId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    }
  }

  const errorMessage = lastError?.message ?? 'Unknown error';
  await updateEmailLog(logId, {
    status: 'failed',
    errorMessage,
    sentAt: null,
  });
  return { success: false, logId, error: errorMessage };
}

/** Queue-style: send email and log; do not throw (for use in hooks) */
export async function sendNotificationEmail(params: {
  type: EmailType;
  userEmail: string;
  dynamicData?: Record<string, unknown>;
}): Promise<void> {
  try {
    const result = await sendEmail({ ...params, toEmail: params.userEmail });
    if (!result.success) {
      console.error('[Email] Failed after retries:', result.logId, result.error);
    }
  } catch (e) {
    console.error('[Email] Send error:', e);
  }
}
