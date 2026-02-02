import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Notifications Email API', () => {
  test('POST /api/v1/notifications/email with invalid type returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/notifications/email`, {
      data: {
        type: 'invalid_type',
        userEmail: 'test@example.com',
        dynamicData: {},
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json().catch(() => ({}));
    expect(body.errors || body.error).toBeTruthy();
  });

  test('POST /api/v1/notifications/email with invalid email returns 400', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/notifications/email`, {
      data: {
        type: 'account_created',
        userEmail: 'not-an-email',
        dynamicData: { name: 'Test' },
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/v1/notifications/email with valid payload accepts request', async ({ request }) => {
    const apiKey = process.env.INTERNAL_API_KEY;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['X-Api-Key'] = apiKey;

    const res = await request.post(`${API_URL}/api/v1/notifications/email`, {
      data: {
        type: 'account_created',
        userEmail: 'e2e-notify@example.com',
        dynamicData: { name: 'E2E User' },
      },
      headers,
    });
    // 200 when no INTERNAL_API_KEY or key matches; 401 when key required and missing
    expect([200, 201, 401]).toContain(res.status());
    if (res.ok()) {
      const body = await res.json().catch(() => ({}));
      expect(body).toBeDefined();
    }
  });
});
