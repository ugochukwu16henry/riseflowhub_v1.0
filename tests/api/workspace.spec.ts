import { test, expect } from '@playwright/test';

const API_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function getClientToken(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-client@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token as string;
}

async function getAdminToken(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API_URL}/api/v1/auth/login`, {
    data: { email: 'test-super_admin@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  return body.token as string;
}

async function getFirstProjectId(request: import('@playwright/test').APIRequestContext, token: string): Promise<string | null> {
  const res = await request.get(`${API_URL}/api/v1/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const projects = await res.json();
  return Array.isArray(projects) && projects.length > 0 ? projects[0].id : null;
}

test.describe('Workspace API', () => {
  test('GET /api/v1/workspace/:projectId without token returns 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/workspace/00000000-0000-0000-0000-000000000001`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/workspace/:projectId with invalid uuid returns 404', async ({ request }) => {
    const token = await getClientToken(request);
    const res = await request.get(`${API_URL}/api/v1/workspace/00000000-0000-0000-0000-000000000001`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/workspace/:projectId with client token returns workspace overview when client has project', async ({
    request,
  }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('projectName');
    expect(body).toHaveProperty('access');
    expect(['full', 'team', 'investor']).toContain(body.access);
    expect(body).toHaveProperty('id', projectId);
  });

  test('PATCH /api/v1/workspace/:projectId updates overview (tagline, stage)', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.patch(`${API_URL}/api/v1/workspace/${projectId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { tagline: 'E2E test tagline', workspaceStage: 'Validation' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.tagline).toBe('E2E test tagline');
    expect(body.workspaceStage).toBe('Validation');
    // Restore for other tests
    await request.patch(`${API_URL}/api/v1/workspace/${projectId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { tagline: null, workspaceStage: 'Idea' },
    });
  });

  test('GET /api/v1/workspace/:projectId/idea-vault returns array', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/idea-vault`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /api/v1/workspace/:projectId/idea-vault creates note and PATCH submit for review', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const createRes = await request.post(`${API_URL}/api/v1/workspace/${projectId}/idea-vault`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { type: 'note', title: 'E2E test note', content: 'Test content' },
    });
    expect(createRes.status()).toBe(201);
    const item = await createRes.json();
    expect(item).toHaveProperty('id');
    expect(item.title).toBe('E2E test note');
    expect(item.status).toBe('draft');
    const patchRes = await request.patch(
      `${API_URL}/api/v1/workspace/${projectId}/idea-vault/${item.id}`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { status: 'submitted_for_review' },
      }
    );
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.status).toBe('submitted_for_review');
    await request.delete(`${API_URL}/api/v1/workspace/${projectId}/idea-vault/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('GET /api/v1/workspace/:projectId/business-model returns object', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/business-model`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('projectId', projectId);
    expect(body).toHaveProperty('valueProposition');
  });

  test('PATCH /api/v1/workspace/:projectId/business-model updates fields', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.patch(`${API_URL}/api/v1/workspace/${projectId}/business-model`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { valueProposition: 'E2E value prop', customerSegments: 'E2E segments' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.valueProposition).toBe('E2E value prop');
    expect(body.customerSegments).toBe('E2E segments');
  });

  test('GET /api/v1/workspace/:projectId/team returns array', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/team`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/workspace/:projectId/files returns array', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/v1/workspace/:projectId/investor-view returns read-only pitch', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/investor-view`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('projectName');
    expect(body).toHaveProperty('id', projectId);
    expect(body).not.toHaveProperty('members');
  });

  test('GET /api/v1/workspace/:projectId/progress returns metrics', async ({ request }) => {
    const token = await getClientToken(request);
    const projectId = await getFirstProjectId(request, token);
    test.skip(!projectId, 'Client has no project');
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.progressPercent).toBe('number');
    expect(typeof body.tasksCompleted).toBe('number');
    expect(typeof body.tasksTotal).toBe('number');
    expect(typeof body.milestonesCompleted).toBe('number');
    expect(typeof body.milestonesTotal).toBe('number');
    expect(body).toHaveProperty('workspaceStage');
  });

  test('GET /api/v1/workspace/:projectId with admin token returns workspace when admin has access', async ({
    request,
  }) => {
    const token = await getAdminToken(request);
    const projectId = await getFirstProjectId(request, token);
    if (!projectId) {
      const adminProjectsRes = await request.get(`${API_URL}/api/v1/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adminProjects = await adminProjectsRes.json();
      test.skip(!Array.isArray(adminProjects) || adminProjects.length === 0, 'No projects in system');
      const firstId = adminProjects[0].id;
      const res = await request.get(`${API_URL}/api/v1/workspace/${firstId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body).toHaveProperty('projectName');
      expect(body).toHaveProperty('access');
      return;
    }
    const res = await request.get(`${API_URL}/api/v1/workspace/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('projectName');
    expect(body).toHaveProperty('access');
  });
});
