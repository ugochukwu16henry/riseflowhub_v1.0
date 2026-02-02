import { test, expect } from '@playwright/test';

test.describe('Auth API', () => {
  test('POST /api/v1/auth/login with invalid credentials returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'invalid@example.com', password: 'wrong' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body.error || body.message || res.statusText()).toBeTruthy();
  });

  test('POST /api/v1/auth/login with valid credentials returns user and token', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'test-client@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('test-client@example.com');
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
  });

  test('GET /api/v1/auth/me with valid token returns user', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: 'test-client@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    const { token } = await loginRes.json();
    const meRes = await request.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.ok()).toBeTruthy();
    const user = await meRes.json();
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test-client@example.com');
    expect(user.role).toBeDefined();
    expect(typeof user.setupPaid).toBe('boolean');
    expect(user.setupReason === null || typeof user.setupReason === 'string').toBeTruthy();
  });

  test('GET /api/v1/auth/me without token returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/auth/register creates user and returns token', async ({ request }) => {
    const email = `e2e-api-${Date.now()}@example.com`;
    const res = await request.post('/api/v1/auth/register', {
      data: { name: 'E2E API User', email, password: 'Password123', role: 'client' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(email);
    expect(body.token).toBeDefined();
  });
});
