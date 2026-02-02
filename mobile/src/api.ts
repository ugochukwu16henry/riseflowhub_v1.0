const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Project {
  id: string;
  projectName: string;
  description?: string | null;
  stage: string;
  progressPercent: number;
  client?: { user?: { name: string; email: string } };
  tasks?: { id: string; title: string; status: string }[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string;
  dueDate?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  project?: { projectName: string };
}

export interface Agreement {
  id: string;
  title: string;
  type: string;
}

export interface AssignedToMe {
  id: string;
  status: string;
  signedAt: string | null;
  agreement: { id: string; title: string; type: string };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
}

export interface AIProjectInsightsResponse {
  predictedDelays: string[];
  riskAreas: string[];
  suggestions: string[];
  overallHealth: string;
  summary: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
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
    myTasks: (token: string) => request<Task[]>(`/api/v1/tasks/me`, { token }),
    listByProject: (projectId: string, token: string) =>
      request<Task[]>(`/api/v1/tasks?projectId=${projectId}`, { token }),
  },
  agreements: {
    listAssignedToMe: (token: string) => request<AssignedToMe[]>('/api/v1/agreements/assigned', { token }),
    view: (id: string, token: string) =>
      request<{ id: string; title: string; type: string; templateUrl: string | null }>(`/api/v1/agreements/${id}/view`, { token }),
    sign: (id: string, body: { signatureText?: string }, token: string) =>
      request<{ message: string }>(`/api/v1/agreements/${id}/sign`, { method: 'POST', body: JSON.stringify(body), token }),
  },
  notifications: {
    list: (token: string) => request<{ notifications: NotificationItem[] }>('/api/v1/notifications', { token }),
  },
  messages: {
    list: (projectId: string, token: string) =>
      request<ChatMessage[]>(`/api/v1/projects/${projectId}/messages`, { token }),
    send: (projectId: string, message: string, token: string) =>
      request<ChatMessage>(`/api/v1/projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
        token,
      }),
  },
  ai: {
    projectInsights: (body: { projectId?: string }, token: string) =>
      request<AIProjectInsightsResponse>('/api/v1/ai/project-insights', { method: 'POST', body: JSON.stringify(body), token }),
    evaluateIdea: (body: { ideaDescription: string; industry?: string }, token: string) =>
      request<{ feasibilityScore: number; riskLevel: string; marketPotential: string; summary: string }>(
        '/api/v1/ai/evaluate-idea',
        { method: 'POST', body: JSON.stringify(body), token }
      ),
  },
};
