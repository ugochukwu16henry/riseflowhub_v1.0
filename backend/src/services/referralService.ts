import type { PrismaClient } from '@prisma/client';

type ReferralStage = 'signed_up' | 'idea_submitted' | 'startup_launched';

const STAGE_ORDER: ReferralStage[] = ['signed_up', 'idea_submitted', 'startup_launched'];

function isHigherStage(current: ReferralStage | null, next: ReferralStage): boolean {
  if (!current) return true;
  return STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(current);
}

export async function recordSignupReferral(prisma: PrismaClient, params: { referrerId: string; referredUserId: string }) {
  const { referrerId, referredUserId } = params;
  if (!referrerId || !referredUserId || referrerId === referredUserId) return;
  const referrer = await prisma.user.findUnique({ where: { id: referrerId }, select: { id: true } });
  if (!referrer) return;
  await prisma.referral.upsert({
    where: {
      referrerId_referredUserId: {
        referrerId,
        referredUserId,
      },
    },
    create: {
      referrerId,
      referredUserId,
      stageCompleted: 'signed_up',
    },
    update: {
      stageCompleted: 'signed_up',
    },
  });
}

export async function recordReferralStage(
  prisma: PrismaClient,
  params: { referredUserId: string; stage: ReferralStage }
) {
  const { referredUserId, stage } = params;
  const row = await prisma.referral.findFirst({
    where: { referredUserId },
    orderBy: { createdAt: 'asc' },
  });
  if (!row) return;
  const current = (row.stageCompleted as ReferralStage | null) ?? null;
  if (!isHigherStage(current, stage)) return;
  await prisma.referral.update({
    where: { id: row.id },
    data: { stageCompleted: stage },
  });
}

