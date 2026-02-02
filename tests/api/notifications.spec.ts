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

test.describe('Notifications API', () => {
  test('GET /api/v1/notifications with token returns notifications object', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_URL}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('notifications');
    expect(Array.isArray(body.notifications)).toBeTruthy();
  });
});
