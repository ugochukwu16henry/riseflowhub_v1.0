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

test.describe('AI API', () => {
  test('POST /api/v1/ai/evaluate-idea without token returns 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/ai/evaluate-idea`, {
      data: { ideaDescription: 'A mobile app for farmers' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/ai/evaluate-idea with token returns feasibility and summary', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.post(`${API_URL}/api/v1/ai/evaluate-idea`, {
      data: { ideaDescription: 'A mobile app for farmers to sell produce' },
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('feasibilityScore');
    expect(body).toHaveProperty('riskLevel');
    expect(body).toHaveProperty('marketPotential');
    expect(body).toHaveProperty('summary');
  });

  test('POST /api/v1/ai/project-insights with token returns suggestions', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.post(`${API_URL}/api/v1/ai/project-insights`, {
      data: {},
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('suggestions');
    expect(body).toHaveProperty('overallHealth');
    expect(body).toHaveProperty('summary');
  });
});
