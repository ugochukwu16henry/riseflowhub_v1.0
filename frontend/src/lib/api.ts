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
};

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
