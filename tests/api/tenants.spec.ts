import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function getAdminToken(request: any) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-super_admin@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token;
}

test.describe('Tenants API', () => {
  test('GET /api/v1/tenants/current with client token returns tenant or null', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'test-client@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    const { token } = await loginRes.json();
    const res = await request.get(`${API_URL}/api/v1/tenants/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('tenant');
    expect(body).toHaveProperty('branding');
  });

  test('GET /api/v1/tenants (list) with super_admin returns array', async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/tenants (list) with non-admin returns 403', async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'test-client@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    const { token } = await loginRes.json();
    const res = await request.get(`${API_URL}/api/v1/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
