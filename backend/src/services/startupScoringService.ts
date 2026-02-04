import type { StartupProfile, Project, Investment } from '@prisma/client';

export type StartupWithRelations = StartupProfile & {
  project?: Project & {
    problemStatement?: string | null;
    targetMarket?: string | null;
  } | null;
  investments?: Investment[];
};

export type ScoreBreakdown = {
  problemClarity: number;
  marketSize: number;
  businessModel: number;
  innovation: number;
  feasibility: number;
  traction: number;
  teamStrength: number;
  financialLogic: number;
  total: number;
};

// Helper to clamp scores to category max
function clamp(v: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(v)));
}

/** Compute startup score (0–100) using rule-based heuristics + AI fields on StartupProfile. */
export function computeScore(startup: StartupWithRelations, teamSize: number): ScoreBreakdown {
  const weights = {
    problemClarity: 10,
    marketSize: 15,
    businessModel: 15,
    innovation: 10,
    feasibility: 15,
    traction: 15,
    teamStrength: 10,
    financialLogic: 10,
  } as const;

  // Problem clarity – based on problemStatement length and pitchSummary quality
  const problemLen =
    (startup.project?.problemStatement?.length || 0) +
    (startup.pitchSummary?.length || 0);
  const problemClarity = clamp((problemLen / 600) * weights.problemClarity, weights.problemClarity);

  // Market size – based on targetMarket field + AI market potential
  let marketSizeBase = (startup.project?.targetMarket?.length || 0) / 500;
  if (startup.aiMarketPotential) {
    if (startup.aiMarketPotential.toLowerCase().includes('high')) marketSizeBase += 0.7;
    else if (startup.aiMarketPotential.toLowerCase().includes('medium')) marketSizeBase += 0.4;
    else marketSizeBase += 0.2;
  }
  const marketSize = clamp(marketSizeBase * weights.marketSize, weights.marketSize);

  // Business model – based on funding + equity fields presence
  let bmBase = 0;
  if (startup.fundingNeeded != null) bmBase += 0.4;
  if (startup.equityOffer != null) bmBase += 0.4;
  if (startup.tractionMetrics) bmBase += 0.2;
  const businessModel = clamp(bmBase * weights.businessModel, weights.businessModel);

  // Innovation – proxy: pitch length and AI risk level
  let innovBase = (startup.pitchSummary?.length || 0) / 800;
  if (startup.aiRiskLevel) {
    const rl = startup.aiRiskLevel.toLowerCase();
    if (rl === 'low') innovBase += 0.2;
    else if (rl === 'medium') innovBase += 0.1;
  }
  const innovation = clamp(innovBase * weights.innovation, weights.innovation);

  // Feasibility – direct from aiFeasibilityScore when present
  const feasBase =
    typeof startup.aiFeasibilityScore === 'number'
      ? startup.aiFeasibilityScore / 100
      : 0.6;
  const feasibility = clamp(feasBase * weights.feasibility, weights.feasibility);

  // Traction – based on tractionMetrics text and investments
  let tractionBase = (startup.tractionMetrics?.length || 0) / 600;
  const committedInvestments =
    startup.investments?.filter((i) => i.status === 'committed' || i.status === 'completed') || [];
  if (committedInvestments.length > 0) tractionBase += 0.6;
  const traction = clamp(tractionBase * weights.traction, weights.traction);

  // Team strength – proxy: team size (passed in) and stage
  let teamBase = Math.min(teamSize, 8) / 8;
  if (startup.stage.toLowerCase().includes('mvp') || startup.stage.toLowerCase().includes('launch')) {
    teamBase += 0.2;
  }
  const teamStrength = clamp(teamBase * weights.teamStrength, weights.teamStrength);

  // Financial logic – based on funding + equity coherence
  let finBase = 0;
  if (startup.fundingNeeded != null) {
    const fn = Number(startup.fundingNeeded as unknown as number);
    if (fn > 0) finBase += 0.4;
  }
  if (startup.equityOffer != null) {
    const eo = Number(startup.equityOffer as unknown as number);
    if (eo > 0 && eo <= 100) finBase += 0.4;
  }
  if (startup.aiRiskLevel && startup.aiRiskLevel.toLowerCase() === 'low') finBase += 0.2;
  const financialLogic = clamp(finBase * weights.financialLogic, weights.financialLogic);

  const total =
    problemClarity +
    marketSize +
    businessModel +
    innovation +
    feasibility +
    traction +
    teamStrength +
    financialLogic;

  return {
    problemClarity,
    marketSize,
    businessModel,
    innovation,
    feasibility,
    traction,
    teamStrength,
    financialLogic,
    total,
  };
}

