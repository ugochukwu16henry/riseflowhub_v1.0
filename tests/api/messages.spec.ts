import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function getToken(request: any) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-client@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token;
}

async function getFirstProjectId(request: any, token: string) {
  const res = await request.get(`${API_URL}/api/v1/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const projects = await res.json();
  if (projects.length === 0) return null;
  return projects[0].id;
}

test.describe('Messages (chat) API', () => {
  test('GET /api/v1/projects/:id/messages without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/projects/00000000-0000-0000-0000-000000000000/messages`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/projects/:id/messages with token returns array', async ({ request }) => {
    const token = await getToken(request);
    const projectId = await getFirstProjectId(request, token);
    if (!projectId) {
      test.skip();
      return;
    }
    const res = await request.get(`${API_URL}/api/v1/projects/${projectId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /api/v1/projects/:id/messages with token creates message', async ({ request }) => {
    const token = await getToken(request);
    const projectId = await getFirstProjectId(request, token);
    if (!projectId) {
      test.skip();
      return;
    }
    const res = await request.post(`${API_URL}/api/v1/projects/${projectId}/messages`, {
      data: { message: 'E2E test message ' + Date.now() },
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.message).toContain('E2E test message');
    expect(body.sender).toBeDefined();
  });
});
