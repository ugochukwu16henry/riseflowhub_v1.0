const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export type UserRole =
  | 'client'
  | 'developer'
  | 'designer'
  | 'marketer'
  | 'project_manager'
  | 'finance_admin'
  | 'super_admin'
  | 'investor';

export interface TenantBranding {
  id: string;
  orgName: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string | null;
  planType: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
  createdAt?: string;
  tenant?: {
    id: string;
    orgName: string;
    domain: string | null;
    logo: string | null;
    primaryColor: string | null;
    planType: string;
  } | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('afrilaunch_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem('afrilaunch_token', token);
}

export function clearStoredToken() {
  meCache = null;
  if (typeof window !== 'undefined') localStorage.removeItem('afrilaunch_token');
}

let meCache: { token: string; user: User; at: number } | null = null;
const ME_CACHE_MS = 8000;

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string; role?: UserRole }, tenantDomain?: string) =>
      request<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(tenantDomain && { headers: { 'X-Tenant-Domain': tenantDomain } as HeadersInit }),
      }),
    login: (body: { email: string; password: string }, tenantDomain?: string) =>
      request<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        ...(tenantDomain && { headers: { 'X-Tenant-Domain': tenantDomain } as HeadersInit }),
      }),
    me: (token: string) => {
      if (meCache && meCache.token === token && Date.now() - meCache.at < ME_CACHE_MS) return Promise.resolve(meCache.user);
      return request<User>('/api/v1/auth/me', { token }).then((user) => {
        meCache = { token, user, at: Date.now() };
        return user;
      });
    },
    logout: (token: string) => request<{ message: string }>('/api/v1/auth/logout', { method: 'POST', token }),
  },
  tenants: {
    current: (token: string) => request<{ tenant: { id: string; orgName: string; domain: string | null; planType: string } | null; branding: { logo: string | null; primaryColor: string | null } | null }>('/api/v1/tenants/current', { token }),
    list: (token: string) => request<TenantRow[]>(`/api/v1/tenants`, { token }),
    create: (body: { orgName: string; domain?: string; logo?: string; primaryColor?: string; planType?: string }, token: string) =>
      request<Tenant>('/api/v1/tenants', { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { orgName?: string; domain?: string | null; logo?: string | null; primaryColor?: string | null; planType?: string }, token: string) =>
      request<Tenant>(`/api/v1/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(body), token }),
    billing: (tenantId: string, token: string) => request<TenantBillingRow[]>(`/api/v1/tenants/${tenantId}/billing`, { token }),
  },
  projects: {
    list: (token: string) => request<Project[]>('/api/v1/projects', { token }),
    get: (id: string, token: string) => request<Project>(`/api/v1/projects/${id}`, { token }),
    update: (id: string, body: Partial<ProjectUpdateBody>, token: string) =>
      request<Project>(`/api/v1/projects/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
  },
  milestones: {
    list: (projectId: string, token: string) => request<Milestone[]>(`/api/v1/projects/${projectId}/milestones`, { token }),
    create: (projectId: string, body: { title: string; status?: string; dueDate?: string }, token: string) =>
      request<Milestone>(`/api/v1/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { title?: string; status?: string; dueDate?: string }, token: string) =>
      request<Milestone>(`/api/v1/milestones/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (id: string, token: string) => request<void>(`/api/v1/milestones/${id}`, { method: 'DELETE', token }),
  },
  tasks: {
    list: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/projects/${projectId}/tasks`, { token }),
    listByProject: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/tasks?projectId=${projectId}`, { token }),
    myTasks: (token: string) => request<TaskWithProject[]>(`/api/v1/tasks/me`, { token }),
  },
  notifications: {
    list: (token: string) => request<{ notifications: NotificationItem[] }>('/api/v1/notifications', { token }),
  },
  payments: {
    list: (projectId: string, token: string) => request<PaymentRow[]>(`/api/v1/payments?projectId=${projectId}`, { token }),
    create: (body: { projectId: string; amount: number; currency?: string; type?: string }, token: string) =>
      request<{ paymentId: string; status: string }>('/api/v1/payments/create', { method: 'POST', body: JSON.stringify(body), token }),
  },
  ai: {
    evaluateIdea: (body: { ideaDescription: string; industry?: string; country?: string }, token: string) =>
      request<AIEvaluateIdeaResponse>('/api/v1/ai/evaluate-idea', { method: 'POST', body: JSON.stringify(body), token }),
    generateProposal: (body: { ideaSummary?: string; industry?: string; budgetRange?: string }, token: string) =>
      request<AIGenerateProposalResponse>('/api/v1/ai/generate-proposal', { method: 'POST', body: JSON.stringify(body), token }),
    pricing: (body: { amountUsd?: number; scope?: string; region?: string }, token: string) =>
      request<AIPricingResponse>('/api/v1/ai/pricing', { method: 'POST', body: JSON.stringify(body), token }),
    projectInsights: (body: { projectId?: string }, token: string) =>
      request<AIProjectInsightsResponse>('/api/v1/ai/project-insights', { method: 'POST', body: JSON.stringify(body), token }),
    marketingSuggestions: (body: { projectId?: string; traffic?: number; conversions?: number; cac?: number; roi?: number; byPlatform?: Record<string, unknown> }, token: string) =>
      request<AIMarketingSuggestionsResponse>('/api/v1/ai/marketing-suggestions', { method: 'POST', body: JSON.stringify(body), token }),
    // AI Startup Mentor
    startupCofounder: (body: { idea: string; currentRole?: string; skillsYouHave?: string[]; skillsNeeded?: string[] }, token: string) =>
      request<AIStartupCofounderResponse>('/api/v1/ai/startup-cofounder', { method: 'POST', body: JSON.stringify(body), token }),
    businessPlan: (body: { idea: string; industry?: string; targetMarket?: string; businessModel?: string }, token: string) =>
      request<AIBusinessPlanResponse>('/api/v1/ai/business-plan', { method: 'POST', body: JSON.stringify(body), token }),
    marketAnalysis: (body: { idea: string; region?: string; industry?: string }, token: string) =>
      request<AIMarketAnalysisResponse>('/api/v1/ai/market-analysis', { method: 'POST', body: JSON.stringify(body), token }),
    riskAnalysis: (body: { idea: string; projectId?: string; stage?: string }, token: string) =>
      request<AIRiskAnalysisResponse>('/api/v1/ai/risk-analysis', { method: 'POST', body: JSON.stringify(body), token }),
    ideaChat: (body: { messages: { role: 'user' | 'assistant'; content: string }[] }, token: string) =>
      request<AIIdeaChatResponse>('/api/v1/ai/idea-chat', { method: 'POST', body: JSON.stringify(body), token }),
    smartMilestones: (body: { ideaSummary?: string; projectId?: string; horizonWeeks?: number }, token: string) =>
      request<AISmartMilestonesResponse>('/api/v1/ai/smart-milestones', { method: 'POST', body: JSON.stringify(body), token }),
  },
  campaigns: {
    create: (body: { projectId: string; platform: string; budget: number; startDate: string; endDate: string }, token: string) =>
      request<Campaign>('/api/v1/campaigns', { method: 'POST', body: JSON.stringify(body), token }),
    listByProject: (projectId: string, token: string) =>
      request<CampaignWithLeads[]>(`/api/v1/campaigns/project/${projectId}`, { token }),
  },
  leads: {
    import: (body: { campaignId: string; leads: Array<{ source?: string; cost: number; conversionStatus?: string }> }, token: string) =>
      request<{ imported: number; leads: Lead[] }>('/api/v1/leads/import', { method: 'POST', body: JSON.stringify(body), token }),
  },
  analytics: {
    get: (projectId: string, token: string) =>
      request<MarketingAnalytics>(`/api/v1/analytics/${projectId}`, { token }),
  },
  agreements: {
    list: (token: string) => request<Agreement[]>(`/api/v1/agreements`, { token }),
    get: (id: string, token: string) => request<AgreementDetail>(`/api/v1/agreements/${id}`, { token }),
    create: (body: { title: string; type: AgreementType; templateUrl?: string }, token: string) =>
      request<Agreement>(`/api/v1/agreements`, { method: 'POST', body: JSON.stringify(body), token }),
    update: (id: string, body: { title?: string; type?: AgreementType; templateUrl?: string }, token: string) =>
      request<Agreement>(`/api/v1/agreements/${id}`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (id: string, token: string) =>
      request<void>(`/api/v1/agreements/${id}`, { method: 'DELETE', token }),
    listAssignments: (token: string, params?: { status?: string; type?: string }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<AssignedAgreementRow[]>(`/api/v1/agreements/assignments${q ? `?${q}` : ''}`, { token });
    },
    assign: (agreementId: string, body: { userId?: string; userIds?: string[]; deadline?: string }, token: string) =>
      request<{ assigned: { id: string; userId: string; deadline: string | null }[] }>(`/api/v1/agreements/${agreementId}/assign`, {
        method: 'POST',
        body: JSON.stringify(body),
        token,
      }),
    view: (id: string, token: string) => request<{ id: string; title: string; type: string; templateUrl: string | null }>(`/api/v1/agreements/${id}/view`, { token }),
    sign: (id: string, body: { signatureText?: string; signatureUrl?: string }, token: string) =>
      request<{ message: string; assignment: unknown }>(`/api/v1/agreements/${id}/sign`, { method: 'POST', body: JSON.stringify(body), token }),
    status: (id: string, token: string) => request<unknown[]>(`/api/v1/agreements/${id}/status`, { token }),
    logs: (id: string, token: string) => request<AgreementAuditLog[]>(`/api/v1/agreements/${id}/logs`, { token }),
    listAssignedToMe: (token: string) => request<AssignedToMe[]>(`/api/v1/agreements/assigned`, { token }),
  },
  investors: {
    register: (body: InvestorRegisterBody) =>
      request<AuthResponse>('/api/v1/investors/register', { method: 'POST', body: JSON.stringify(body) }),
    me: (token: string) => request<Investor>('/api/v1/investors/me', { token }),
    list: (token: string) => request<Investor[] | Investor>('/api/v1/investors', { token }),
  },
  startups: {
    list: (token: string) => request<StartupProfile[]>(`/api/v1/startups`, { token }),
    myProfiles: (token: string) => request<StartupProfile[]>(`/api/v1/startups/me`, { token }),
    publish: (body: StartupPublishBody, token: string) =>
      request<StartupProfile>('/api/v1/startups/publish', { method: 'POST', body: JSON.stringify(body), token }),
    marketplace: (params?: { industry?: string; stage?: string; fundingMin?: number; fundingMax?: number }) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request<StartupProfileListItem[]>(`/api/v1/startups/marketplace${q ? `?${q}` : ''}`);
    },
    get: (id: string, token?: string) =>
      request<StartupProfileDetail>(`/api/v1/startups/${id}`, token ? { token } : {}),
    approve: (id: string, token: string) =>
      request<StartupProfile>(`/api/v1/startups/${id}/approve`, { method: 'PUT', token }),
  },
  investments: {
    expressInterest: (body: { startupId: string; requestMeeting?: boolean }, token: string) =>
      request<Investment>(`/api/v1/investments/express-interest`, { method: 'POST', body: JSON.stringify(body), token }),
    commit: (body: { startupId: string; amount?: number; equityPercent?: number; agreementId?: string }, token: string) =>
      request<Investment>(`/api/v1/investments/commit`, { method: 'POST', body: JSON.stringify(body), token }),
    list: (token: string) => request<InvestmentListItem[]>(`/api/v1/investments`, { token }),
  },
};

export interface InvestorRegisterBody {
  name: string;
  email: string;
  password: string;
  firmName?: string;
  investmentRangeMin?: number;
  investmentRangeMax?: number;
  industries?: string;
  country?: string;
}

export interface Investor {
  id: string;
  userId: string;
  name: string;
  email: string;
  firmName: string | null;
  investmentRangeMin: number | null;
  investmentRangeMax: number | null;
  industries: string | null;
  country: string | null;
  verified: boolean;
  createdAt: string;
}

export interface StartupProfile {
  id: string;
  projectId: string;
  pitchSummary: string;
  tractionMetrics: string | null;
  fundingNeeded: number;
  equityOffer: number | null;
  stage: string;
  visibilityStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  project?: { projectName: string; client?: { businessName: string } };
}

export interface StartupProfileListItem extends StartupProfile {
  project: {
    id: string;
    projectName: string;
    stage: string;
    description: string | null;
    client: { businessName: string; industry: string | null };
  };
}

export interface StartupProfileDetail extends StartupProfile {
  project: {
    id: string;
    projectName: string;
    description: string | null;
    stage: string;
    status: string;
    client: { businessName: string; industry: string | null; userId: string; user: { name: string } };
  };
}

export interface StartupPublishBody {
  projectId: string;
  pitchSummary: string;
  tractionMetrics?: string;
  fundingNeeded: number;
  equityOffer?: number;
  stage?: string;
}

export interface Investment {
  id: string;
  investorId: string;
  startupId: string;
  amount: number | null;
  equityPercent: number | null;
  status: string;
  agreementId: string | null;
  createdAt: string;
  startup?: { project?: { projectName: string } };
}

export interface InvestmentListItem extends Investment {
  startup: {
    project: { projectName: string; client?: { businessName: string } };
  };
}

export type AgreementType = 'NDA' | 'MOU' | 'CoFounder' | 'Terms';

export interface Agreement {
  id: string;
  title: string;
  type: AgreementType;
  templateUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgreementDetail extends Agreement {
  assignedAgreements?: { id: string; userId: string; user: { id: string; name: string; email: string } }[];
}

export interface AssignedAgreementRow {
  id: string;
  status: 'Pending' | 'Signed' | 'Overdue';
  signedAt: string | null;
  deadline: string | null;
  agreement: { id: string; title: string; type: string; templateUrl: string | null };
  user: { id: string; name: string; email: string };
}

export interface AssignedToMe {
  id: string;
  status: 'Pending' | 'Signed' | 'Overdue';
  signedAt: string | null;
  agreement: { id: string; title: string; type: string; templateUrl: string | null };
}

export interface AgreementAuditLog {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
  action: string;
  ipAddress: string | null;
  createdAt: string;
}

export type ProjectStatus =
  | 'IdeaSubmitted'
  | 'ReviewValidation'
  | 'ProposalSent'
  | 'Development'
  | 'Testing'
  | 'Live'
  | 'Maintenance';

export interface Project {
  id: string;
  projectName: string;
  description: string | null;
  stage: string;
  status?: ProjectStatus;
  progressPercent: number;
  budget?: number | null;
  startDate: string | null;
  deadline: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
  client?: { user?: { name: string; email: string } };
  tasks?: Task[];
  milestones?: Milestone[];
}

export interface ProjectUpdateBody {
  projectName?: string;
  description?: string;
  stage?: string;
  status?: ProjectStatus;
  progressPercent?: number;
  budget?: number | null;
  startDate?: string | null;
  deadline?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  dueDate: string | null;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description: string | null;
  status: string;
  priority?: 'Low' | 'Medium' | 'High';
  dueDate: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  milestone?: { id: string; title: string; status?: string } | null;
}

export interface TaskWithProject extends Task {
  project?: { id: string; projectName: string };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  link?: string;
}

export interface PaymentRow {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export interface AIEvaluateIdeaResponse {
  feasibilityScore: number;
  riskLevel: string;
  marketPotential: string;
  suggestedMvpScope: string[];
  summary: string;
}

export interface AIGenerateProposalResponse {
  projectScope: string[];
  timelineWeeks: number;
  techStack: Record<string, string>;
  estimatedCostUsd: number;
  estimatedCostNgn?: number;
  estimatedCostEur?: number;
  estimatedCostGbp?: number;
  currency: string;
  summary: string;
}

export interface AIPricingResponse {
  amountUsd: number;
  conversions: Record<string, number>;
  regionAdjustment: number;
  summary: string;
}

export interface AIProjectInsightsResponse {
  predictedDelays: string[];
  riskAreas: string[];
  suggestions: string[];
  overallHealth: string;
  summary: string;
}

export interface AIMarketingSuggestionsResponse {
  suggestions: string[];
  summary: string;
}

export interface AIStartupCofounderResponse {
  idealCofounderProfile: string[];
  roleFit: { yourRole: string; suggestedComplement: string };
  traitsToLookFor: string[];
  redFlags: string[];
  summary: string;
}

export interface AIBusinessPlanResponse {
  executiveSummary: string;
  problemStatement: string;
  solution: string;
  marketOpportunity: { size: string; trends: string[] };
  businessModel: { revenue: string; pricing: string; unitEconomics: string };
  goToMarket: string[];
  financialProjections: { year1: string; year2: string; year3: string };
  summary: string;
}

export interface AIMarketAnalysisResponse {
  marketSize: { tam: string; sam: string; som: string };
  trends: string[];
  competitors: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
}

export interface AIRiskAnalysisResponse {
  risks: { area: string; level: string; description: string; mitigation: string }[];
  investorReadinessScore: number;
  scoreBreakdown: Record<string, number>;
  nextSteps: string[];
  summary: string;
}

export interface AIIdeaChatResponse {
  message: string;
}

export interface AISmartMilestonesResponse {
  milestones: { title: string; suggestedWeeks: number; phase: string; order: number; dueOffsetWeeks: number }[];
  horizonWeeks: number;
  summary: string;
}

export interface Tenant {
  id: string;
  orgName: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string | null;
  planType: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantRow extends Tenant {
  userCount?: number;
  createdAt: string;
}

export interface TenantBillingRow {
  id: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  projectId: string;
  platform: string;
  budget: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  campaignId: string;
  source: string;
  cost: number;
  conversionStatus: string;
  createdAt: string;
}

export interface CampaignWithLeads extends Campaign {
  leads: Lead[];
}

export interface MarketingAnalytics {
  projectId: string;
  traffic: number;
  conversions: number;
  cac: number | null;
  roi: number | null;
  totalCost: number;
  byPlatform: Record<string, { traffic: number; conversions: number; cost: number }>;
  funnel: { stage: string; count: number }[];
  snapshot: {
    traffic: number;
    conversions: number;
    cac: number | null;
    roi: number | null;
    periodStart: string;
    periodEnd: string;
  } | null;
}
