import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Investors API', () => {
  test('POST /api/v1/investors/register creates investor and returns token', async ({ request }) => {
    const email = `e2e-investor-${Date.now()}@example.com`;
    const res = await request.post(`${API_URL}/api/v1/investors/register`, {
      data: {
        name: 'E2E Investor',
        email,
        password: 'Password123',
        firmName: 'Test Fund',
        country: 'Nigeria',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe(email);
    expect(body.user.role).toBe('investor');
    expect(body.token).toBeDefined();
  });
});
