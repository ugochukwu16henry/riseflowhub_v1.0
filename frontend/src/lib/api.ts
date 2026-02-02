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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
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
  if (typeof window !== 'undefined') localStorage.removeItem('afrilaunch_token');
}

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
    register: (body: { name: string; email: string; password: string; role?: UserRole }) =>
      request<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: (token: string) => request<User>('/api/v1/auth/me', { token }),
    logout: (token: string) => request<{ message: string }>('/api/v1/auth/logout', { method: 'POST', token }),
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
};

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
