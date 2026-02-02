import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function getSuperAdminToken(request: any) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-super_admin@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token;
}

async function getClientToken(request: any) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-client@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token;
}

test.describe('Super Admin API', () => {
  test('super_admin login returns user with role super_admin', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'test-super_admin@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.role).toBe('super_admin');
    expect(body.user.email).toBe('test-super_admin@example.com');
    expect(body.token).toBeDefined();
  });

  test('GET /api/v1/tenants with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/tenants with client returns 403', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.get(`${API_URL}/api/v1/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/v1/users with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/projects with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/agreements with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/agreements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/admin/leads with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/admin/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/startups with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/startups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/investors with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/investors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/agreements/assignments with super_admin returns array', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/agreements/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('super_admin bypasses setup fee: GET /api/v1/ai/evaluate-idea succeeds', async ({ request }) => {
    const token = await getSuperAdminToken(request);
    const res = await request.post(`${API_URL}/api/v1/ai/evaluate-idea`, {
      data: { ideaDescription: 'Test idea', industry: 'Tech', country: 'NG' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.feasibilityScore).toBeDefined();
    expect(body.riskLevel).toBeDefined();
  });
});
