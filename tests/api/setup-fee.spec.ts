import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function getClientToken(request: any) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-client@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token;
}

test.describe('Setup Fee API', () => {
  test('GET /api/v1/setup-fee/quote without auth returns amount in USD', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/setup-fee/quote?currency=USD`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.amountUsd).toBe(7);
    expect(body.amount).toBeDefined();
    expect(body.currency).toBe('USD');
    expect(body.rate).toBeDefined();
  });

  test('GET /api/v1/setup-fee/quote?currency=NGN returns converted amount', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/setup-fee/quote?currency=NGN`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.amountUsd).toBe(7);
    expect(body.currency).toBe('NGN');
    expect(typeof body.amount).toBe('number');
    expect(body.rate).toBeDefined();
  });

  test('GET /api/v1/setup-fee/quote with client token returns entrepreneur fee', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.get(`${API_URL}/api/v1/setup-fee/quote?currency=USD`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.amountUsd).toBe(7);
  });

  test('POST /api/v1/setup-fee/create-session without token returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/setup-fee/create-session`, {
      data: { currency: 'USD' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/setup-fee/create-session with token returns checkoutUrl', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.post(`${API_URL}/api/v1/setup-fee/create-session`, {
      data: { currency: 'USD' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.checkoutUrl).toBeDefined();
    expect(body.sessionId).toBeDefined();
    expect(body.amount).toBeDefined();
    expect(body.currency).toBeDefined();
    expect(body.amountUsd).toBe(7);
  });

  test('PUT /api/v1/setup-fee/skip with invalid reason returns 400', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.put(`${API_URL}/api/v1/setup-fee/skip`, {
      data: { reason: 'invalid_reason' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
  });

  test('PUT /api/v1/setup-fee/skip with valid reason returns ok', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.put(`${API_URL}/api/v1/setup-fee/skip`, {
      data: { reason: 'exploring' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(['cant_afford', 'pay_later', 'exploring', 'other']).toContain(body.setupReason);
  });

  test('POST /api/v1/setup-fee/verify without reference returns 400', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.post(`${API_URL}/api/v1/setup-fee/verify`, {
      data: {},
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
  });
});
