import type { PrismaClient } from '@prisma/client';
import { notify } from './notificationService';

export type BadgeName =
  | 'idea_starter'
  | 'vision_clarifier'
  | 'business_architect'
  | 'product_builder'
  | 'first_revenue'
  | 'investor_ready'
  | 'growth_founder';

const BADGE_LABELS: Record<BadgeName, string> = {
  idea_starter: 'Idea Starter',
  vision_clarifier: 'Vision Clarifier',
  business_architect: 'Business Architect',
  product_builder: 'Product Builder',
  first_revenue: 'First Revenue',
  investor_ready: 'Investor Ready',
  growth_founder: 'Growth Founder',
};

export async function awardBadge(prisma: PrismaClient, params: { userId: string; badge: BadgeName }): Promise<void> {
  const { userId, badge } = params;
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeName: { userId, badgeName: badge } },
    select: { id: true },
  });
  if (existing) return;
  await prisma.userBadge.create({
    data: {
      userId,
      badgeName: badge,
    },
  });
  const label = BADGE_LABELS[badge];
  try {
    await notify({
      userId,
      type: 'badge',
      title: `New badge unlocked: ${label}`,
      message: `You just earned the ${label} badge for your startup journey.`,
      link: '/dashboard',
    });
  } catch {
    // Non-critical
  }
}

