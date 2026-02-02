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

test.describe('Tasks API', () => {
  test('GET /api/v1/tasks/me with token returns array', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_URL}/api/v1/tasks/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/tasks/me without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/tasks/me`);
    expect(res.status()).toBe(401);
  });
});
