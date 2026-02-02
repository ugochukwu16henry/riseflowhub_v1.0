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

test.describe('Admin Leads API', () => {
  test('GET /api/v1/admin/leads without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/admin/leads`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/admin/leads with admin token returns array', async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/admin/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/admin/leads?status=New with admin token returns array', async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_URL}/api/v1/admin/leads?status=New`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /api/v1/admin/leads creates lead', async ({ request }) => {
    const token = await getAdminToken(request);
    const email = `e2e-lead-${Date.now()}@example.com`;
    const res = await request.post(`${API_URL}/api/v1/admin/leads`, {
      data: {
        name: 'E2E Lead',
        email,
        country: 'Nigeria',
        ideaSummary: 'Test idea for E2E',
        stage: 'Idea',
        goal: 'Website',
        budget: '$5,000',
      },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.email).toBe(email);
    expect(body.status).toBe('New');
  });

  test('PUT /api/v1/admin/leads/:id/status updates status', async ({ request }) => {
    const token = await getAdminToken(request);
    const createRes = await request.post(`${API_URL}/api/v1/admin/leads`, {
      data: {
        name: 'E2E Status Lead',
        email: `e2e-status-${Date.now()}@example.com`,
      },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const lead = await createRes.json();
    const res = await request.put(`${API_URL}/api/v1/admin/leads/${lead.id}/status`, {
      data: { status: 'Contacted' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('Contacted');
  });

  test('PUT /api/v1/admin/leads/:id/assign with invalid userId returns 400', async ({ request }) => {
    const token = await getAdminToken(request);
    const listRes = await request.get(`${API_URL}/api/v1/admin/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const leads = await listRes.json();
    const leadId = leads[0]?.id;
    if (!leadId) {
      test.skip();
      return;
    }
    const res = await request.put(`${API_URL}/api/v1/admin/leads/${leadId}/assign`, {
      data: { assignedToId: '00000000-0000-0000-0000-000000000000' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/v1/admin/leads/:id/notes adds note', async ({ request }) => {
    const token = await getAdminToken(request);
    const createRes = await request.post(`${API_URL}/api/v1/admin/leads`, {
      data: {
        name: 'E2E Note Lead',
        email: `e2e-note-${Date.now()}@example.com`,
      },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const lead = await createRes.json();
    const res = await request.post(`${API_URL}/api/v1/admin/leads/${lead.id}/notes`, {
      data: { content: 'E2E test note' },
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.content).toBe('E2E test note');
  });
});
