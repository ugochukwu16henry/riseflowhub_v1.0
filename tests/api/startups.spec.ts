import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

test.describe('Startups API', () => {
  test('GET /api/v1/startups/marketplace returns array (no auth)', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/startups/marketplace`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/startups/marketplace with query params returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/startups/marketplace?stage=Planning`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});
