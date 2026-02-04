import type { PrismaClient, UserRole } from '@prisma/client';

export interface FounderReputationBreakdown {
  profileCompleteness: number;
  ideaClarity: number;
  projectProgress: number;
  communicationResponsiveness: number;
  meetingAttendance: number;
  teamFeedback: number;
  investorFeedback: number;
  milestonesAchieved: number;
  total: number;
  level: 'Beginner' | 'Builder' | 'Trusted Founder' | 'Elite Founder';
}

function classifyLevel(score: number): FounderReputationBreakdown['level'] {
  if (score >= 91) return 'Elite Founder';
  if (score >= 71) return 'Trusted Founder';
  if (score >= 41) return 'Builder';
  return 'Beginner';
}

export async function recalculateFounderReputation(
  prisma: PrismaClient,
  userId: string
): Promise<FounderReputationBreakdown> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      name: true,
      email: true,
      country: true,
      avatarUrl: true,
      bio: true,
      jobTitle: true,
      client: {
        select: {
          businessName: true,
          industry: true,
          ideaSummary: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error('User not found');
  }

  // Only meaningful for founders / clients / cofounders
  const founderRoles: UserRole[] = ['client', 'cofounder'];
  if (!founderRoles.includes(user.role)) {
    const empty: FounderReputationBreakdown = {
      profileCompleteness: 0,
      ideaClarity: 0,
      projectProgress: 0,
      communicationResponsiveness: 0,
      meetingAttendance: 0,
      teamFeedback: 0,
      investorFeedback: 0,
      milestonesAchieved: 0,
      total: 0,
      level: 'Beginner',
    };
    await prisma.founderReputation.upsert({
      where: { userId },
      create: { userId, scoreTotal: 0, breakdown: empty as unknown as object },
      update: { scoreTotal: 0, breakdown: empty as unknown as object },
    });
    return empty;
  }

  // 1) Profile completeness (10 pts)
  const profileFields = [
    user.name,
    user.email,
    user.country,
    user.avatarUrl,
    user.bio,
    user.jobTitle,
    user.client?.businessName,
    user.client?.industry,
    user.client?.ideaSummary,
  ];
  const filledCount = profileFields.filter((v) => typeof v === 'string' && v.trim().length > 0).length;
  const profileCompleteness = Math.round((filledCount / profileFields.length) * 10);

  // 2) Idea clarity score from StartupScore (10 pts)
  const client = await prisma.client.findFirst({
    where: { userId },
    select: { id: true },
  });
  let ideaClarity = 0;
  if (client?.id) {
    const project = await prisma.project.findFirst({
      where: { clientId: client.id },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (project?.id) {
      const startup = await prisma.startupProfile.findFirst({
        where: { projectId: project.id },
        select: { id: true, score: { select: { breakdownJson: true } } },
      });
      const breakdown = (startup?.score?.breakdownJson as any) || null;
      if (breakdown?.problemClarity != null) {
        const raw = Number(breakdown.problemClarity) || 0;
        ideaClarity = Math.max(0, Math.min(10, Math.round(raw)));
      }
    }
  }

  // 3) Project progress (20 pts) — based on task completion ratio
  let projectProgress = 0;
  if (client?.id) {
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length > 0) {
      const [totalTasks, doneTasks] = await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'Done' } }),
      ]);
      if (totalTasks > 0) {
        const ratio = doneTasks / totalTasks;
        projectProgress = Math.round(ratio * 20);
      }
    }
  }

  // 4) Communication responsiveness (10 pts) — approximate from sent messages volume
  const sentMessagesCount = await prisma.message.count({
    where: { senderId: userId },
  });
  const communicationResponsiveness = Math.max(0, Math.min(10, Math.round(Math.log10(1 + sentMessagesCount) * 4)));

  // 5) Meeting attendance (10 pts) — approximate from consultations booked & completed
  const consultationsCount = await prisma.consultationBooking.count({
    where: { userId },
  });
  const meetingAttendance = Math.max(0, Math.min(10, Math.round(Math.log10(1 + consultationsCount) * 4)));

  // 6) Team feedback (10 pts) — placeholder until explicit team ratings exist
  const teamFeedback = 0;

  // 7) Investor feedback (15 pts) — based on count of positive investments
  const investorDeals = await prisma.investment.count({
    where: { startup: { project: { client: { userId } } }, status: { in: ['committed', 'completed'] } },
  });
  const investorFeedback = Math.max(0, Math.min(15, Math.round(Math.log10(1 + investorDeals) * 6)));

  // 8) Milestones achieved (15 pts) — from BusinessGrowth checklist
  let milestonesAchieved = 0;
  if (client?.id) {
    const project = await prisma.project.findFirst({
      where: { clientId: client.id },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (project?.id) {
      const startup = await prisma.startupProfile.findFirst({
        where: { projectId: project.id },
        select: { businessGrowth: true },
      });
      const g = startup?.businessGrowth;
      if (g) {
        const flags = [
          g.ideaValidated,
          g.mvpBuilt,
          g.firstCustomer,
          g.revenueGenerated,
          g.investorOnboarded,
        ];
        const count = flags.filter(Boolean).length;
        milestonesAchieved = Math.max(0, Math.min(15, Math.round((count / flags.length) * 15)));
      }
    }
  }

  const totalRaw =
    profileCompleteness +
    ideaClarity +
    projectProgress +
    communicationResponsiveness +
    meetingAttendance +
    teamFeedback +
    investorFeedback +
    milestonesAchieved;

  const total = Math.max(0, Math.min(100, totalRaw));
  const breakdown: FounderReputationBreakdown = {
    profileCompleteness,
    ideaClarity,
    projectProgress,
    communicationResponsiveness,
    meetingAttendance,
    teamFeedback,
    investorFeedback,
    milestonesAchieved,
    total,
    level: classifyLevel(total),
  };

  await prisma.founderReputation.upsert({
    where: { userId },
    create: { userId, scoreTotal: total, breakdown: breakdown as unknown as object },
    update: { scoreTotal: total, breakdown: breakdown as unknown as object, lastUpdated: new Date() },
  });

  return breakdown;
}

