/**
 * AI Co-Founder: structured prompts and response generators.
 * Uses context (industry, country, project stage, setupPaid) for tailored advice.
 * Replace with real LLM calls (OpenAI, etc.) when available.
 */

export type AiContext = {
  industry?: string;
  country?: string;
  projectStage?: string;
  setupPaid?: boolean;
  teamSize?: number;
};

function wrapProfessional(text: string): string {
  return text;
}

/** Idea Clarifier: refines raw idea into a clear business concept */
export function generateIdeaClarified(idea: string, ctx: AiContext): Record<string, unknown> {
  const refined = wrapProfessional(
    `**Refined concept:** ${idea}. ` +
      `Target: ${ctx.country || 'your market'}. ` +
      `Industry: ${ctx.industry || 'general'}. ` +
      `Next: validate problem with 5–10 interviews, then define MVP scope.`
  );
  return {
    refinedConcept: refined,
    questionsAnswered: ['Who is this for?', 'What problem does it solve?', 'How is it different?', 'How will it make money?'],
    summary: `Idea clarified for ${ctx.industry || 'startup'}. Refine further with customer discovery.`,
  };
}

/** Business Model Generator (Business Model Canvas style) */
export function generateBusinessModel(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    targetMarket: ctx.country ? `Primary: ${ctx.country}; expand to adjacent markets.` : 'Define primary segment (demographics, geography, use case).',
    valueProposition: `Clear value for ${idea.slice(0, 80)}... — differentiate on quality, speed, or cost.`,
    revenueStreams: ['Subscription (recurring)', 'Usage-based', 'One-time license or project fees'],
    costStructure: ['Product/engineering', 'Marketing & sales', 'Operations', 'Compliance'],
    channels: ['Direct (website, app)', 'Partnerships', 'Content & SEO', 'Paid acquisition'],
    keyActivities: ['Product development', 'Customer success', 'Marketing', 'Partnerships'],
    summary: `Business model outline for ${ctx.industry || 'venture'}. Fill with real numbers.`,
  };
}

/** Product Roadmap: MVP, Phase 2, Phase 3 */
export function generateRoadmap(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    mvp: [
      'Core feature that solves the main problem',
      'Landing page + waitlist or signup',
      'Basic analytics and feedback loop',
      '1–2 key differentiators',
    ],
    phase2: [
      'Expand features based on user feedback',
      'Integrations and API',
      'Monetization (if not in MVP)',
      'Scale infrastructure',
    ],
    phase3: [
      'New segments or geographies',
      'Enterprise or advanced tiers',
      'Ecosystem (partners, marketplace)',
      'Optimization and automation',
    ],
    summary: `Roadmap for ${idea.slice(0, 50)}... Adapt timelines to your capacity.`,
  };
}

/** Smart Pricing Engine */
export function generatePricing(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    subscriptionTiers: [
      { name: 'Starter', price: '$19/mo', features: ['Core features', 'Email support'] },
      { name: 'Pro', price: '$49/mo', features: ['All Starter', 'Priority support', 'Integrations'] },
      { name: 'Enterprise', price: 'Custom', features: ['Custom SLA', 'Dedicated success'] },
    ],
    freemiumOption: 'Free tier: limited usage or core feature to drive signups.',
    oneTimeFees: 'Consider setup or onboarding fee for enterprise.',
    marketComparison: `Benchmark against similar products in ${ctx.industry || 'your space'}; position on value, not just price.`,
    summary: `Pricing strategy for ${ctx.country || 'global'} market. Test with early users.`,
  };
}

/** Marketing Strategy */
export function generateMarketing(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    idealAudience: `Early adopters in ${ctx.industry || 'your industry'}, ${ctx.country || 'target region'}.`,
    launchStrategy: ['Build waitlist pre-launch', 'Launch on Product Hunt / community', 'Influencer or partner mentions', 'Paid launch ads'],
    socialMediaPlan: ['LinkedIn for B2B', 'Twitter/X for dev/startup', 'Meta for broad reach', 'Content: tips, case studies, demos'],
    adIdeas: ['Problem-aware keywords', 'Retargeting site visitors', 'Lookalike audiences from email list'],
    funnelStructure: 'Awareness → Interest → Trial/Signup → Activation → Revenue → Referral',
    summary: `Marketing plan for ${idea.slice(0, 50)}... Start with one channel and double down.`,
  };
}

/** Pitch Deck Creator */
export function generatePitch(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    problem: 'Current solutions are [fragmented/expensive/not tailored]. Opportunity is clear.',
    solution: `Our solution: ${idea.slice(0, 120)}...`,
    marketSize: 'TAM/SAM/SOM — cite sources; show growth rate.',
    traction: 'Early users, revenue, partnerships, or milestones.',
    revenueModel: 'Subscription / usage / hybrid. Unit economics.',
    ask: 'Amount raising; use of funds (team, product, marketing); timeline.',
    summary: `Pitch outline for ${ctx.industry || 'startup'}. Customize with real traction.`,
  };
}

/** Risk Analysis */
export function generateRiskAnalysis(idea: string, ctx: AiContext): Record<string, unknown> {
  return {
    marketRisks: [{ risk: 'Adoption and timing', mitigation: 'Validate with pilots and early adopters.' }],
    technicalRisks: [{ risk: 'Build complexity', mitigation: 'Scope MVP tightly; consider no-code or partners.' }],
    financialRisks: [{ risk: 'Runway and burn', mitigation: '18-month runway; diversify revenue early.' }],
    competition: [{ risk: 'Incumbents and copycats', mitigation: 'Focus on niche and execution speed.' }],
    investorReadinessScore: Math.min(95, 50 + Math.floor(Math.random() * 40)),
    summary: `Risk overview for ${idea.slice(0, 50)}... Address top risks before raising.`,
  };
}
