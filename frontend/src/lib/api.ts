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
  },
  tasks: {
    list: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/projects/${projectId}/tasks`, { token }),
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

export interface Project {
  id: string;
  projectName: string;
  description: string | null;
  stage: string;
  progressPercent: number;
  startDate: string | null;
  deadline: string | null;
  client?: { user?: { name: string; email: string } };
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
}
