import { Request, Response } from 'express';
import { sendEmail } from '../services/emailService';
import type { EmailType } from '../emails';

/** POST /api/v1/notifications/email */
export async function sendEmailHandler(req: Request, res: Response): Promise<void> {
  const { type, userEmail, dynamicData = {} } = req.body as {
    type: EmailType;
    userEmail: string;
    dynamicData?: Record<string, unknown>;
  };

  const result = await sendEmail({
    type,
    toEmail: userEmail,
    dynamicData,
  });

  if (result.success) {
    res.status(200).json({
      success: true,
      logId: result.logId,
      message: 'Email sent.',
    });
    return;
  }

  res.status(500).json({
    success: false,
    logId: result.logId,
    error: result.error || 'Email failed after retries',
  });
}
