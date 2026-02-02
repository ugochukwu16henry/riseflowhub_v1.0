import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

export interface ConsultationBookingBody {
  fullName: string;
  email: string;
  country?: string;
  businessIdea?: string;
  stage?: string;
  mainGoal?: string;
  budgetRange?: string;
  preferredContactMethod?: string;
  preferredDate?: string; // ISO date YYYY-MM-DD
  preferredTime?: string; // e.g. "09:00"
  timezone?: string;
}

import { sendNotificationEmail } from '../services/emailService';

/** POST /api/v1/consultations — Public: create consultation booking */
export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as ConsultationBookingBody;
  const {
    fullName,
    email,
    country,
    businessIdea,
    stage,
    mainGoal,
    budgetRange,
    preferredContactMethod,
    preferredDate,
    preferredTime,
    timezone,
  } = body;

  if (!fullName?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'Full name and email are required' });
    return;
  }

  const booking = await prisma.consultationBooking.create({
    data: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      country: country?.trim() || null,
      businessIdea: businessIdea?.trim() || null,
      stage: stage?.trim() || null,
      mainGoal: mainGoal?.trim() || null,
      budgetRange: budgetRange?.trim() || null,
      preferredContactMethod: preferredContactMethod?.trim() || null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime: preferredTime?.trim() || null,
      timezone: timezone?.trim() || null,
    },
  });

  createAuditLog(prisma, {
    adminId: null,
    actionType: 'consultation_booked',
    entityType: 'consultation',
    entityId: booking.id,
    details: { email: booking.email, fullName: booking.fullName },
  }).catch(() => {});

  sendNotificationEmail({
    type: 'consultation_booked',
    userEmail: body.email.trim().toLowerCase(),
    dynamicData: {
      name: body.fullName.trim(),
      preferredDate: body.preferredDate,
      preferredTime: body.preferredTime,
      timezone: body.timezone,
    },
  }).catch((e) => console.error('[Consultation] Email error:', e));

  res.status(201).json({
    id: booking.id,
    message: 'Your consultation has been booked. We will confirm by email shortly.',
  });
}
