import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Workspace Dashboard (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('Project page shows My startup workspace and list or Submit idea', async ({ page }) => {
    await page.getByRole('link', { name: /Project/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/project$/);
    await expect(page.getByText(/My startup workspace/i)).toBeVisible({ timeout: 5000 });
    const hasSubmitIdea = await page.getByRole('link', { name: /Submit idea/i }).isVisible().catch(() => false);
    const hasOpenWorkspace = await page.getByText(/Open workspace/i).first().isVisible().catch(() => false);
    const hasNoProjectText = await page.getByText(/You don't have a project yet/i).isVisible().catch(() => false);
    expect(hasSubmitIdea || hasOpenWorkspace || hasNoProjectText).toBeTruthy();
  });

  test('when client has project, can open workspace and see tabs', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    await expect(page.getByText(/My startup workspace/i)).toBeVisible({ timeout: 5000 });
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project - cannot test workspace tabs');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await expect(page.getByText(/Back to projects/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Idea Vault/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Business Model/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Roadmap/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Team/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documents/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Consultation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Investor View/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Progress/i })).toBeVisible();
  });

  test('Overview tab shows startup info', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(page.getByText(/Startup name|Project name|Tagline|Stage|Founder/i)).toBeVisible({ timeout: 3000 });
  });

  test('Idea Vault tab shows content', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Idea Vault/i }).click();
    await expect(page.getByText(/Private structured storage|Save draft|Submit for review|No items yet/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('Business Model tab shows canvas sections', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Business Model/i }).click();
    await expect(
      page.getByText(/Value Proposition|Customer Segments|Revenue Streams|Cost Structure|Channels|Key Activities/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('Roadmap tab shows phases and milestones link', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Roadmap/i }).click();
    await expect(page.getByText(/Phase 1: Validation|Phase 2: Prototype|Phase 3: Launch|Phase 4: Growth/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByRole('link', { name: /tasks.*milestones/i })).toBeVisible();
  });

  test('Team tab shows members section', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Team/i }).click();
    await expect(page.getByText(/Assigned team members|Invite|No team members yet/i)).toBeVisible({ timeout: 5000 });
  });

  test('Documents tab shows files section', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Documents/i }).click();
    await expect(page.getByText(/Secure file storage|pitch deck|financial|legal|No files yet/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('Consultation tab shows booking or setup notice', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Consultation/i }).click();
    await expect(
      page.getByText(/Book consultations|Free booking|Setup fee|setup payment/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('Investor View tab shows read-only pitch', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Investor View/i }).click();
    await expect(page.getByText(/Read-only pitch|no internal notes|Startup|Tagline|Stage|Founder/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('Progress tab shows metrics', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const openLink = page.getByRole('link', { name: /Open workspace/i }).first();
    const hasProject = await openLink.isVisible().catch(() => false);
    test.skip(!hasProject, 'Client has no project');
    await openLink.click();
    await expect(page).toHaveURL(/\/dashboard\/project\/[0-9a-f-]+/i, { timeout: 5000 });
    await page.getByRole('button', { name: /Progress/i }).click();
    await expect(
      page.getByText(/Tasks completed|Milestones completed|Stage|Overall progress|progress/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('invalid project id shows error and back link', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project/00000000-0000-0000-0000-000000000001');
    await expect(page.getByText(/not found|error|Back to projects/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Back to projects/i })).toBeVisible();
  });

  test('Submit idea link when no project', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/project');
    const noProject = await page.getByText(/You don't have a project yet|Submit an idea/i).isVisible().catch(() => false);
    if (noProject) {
      await expect(page.getByRole('link', { name: /Submit idea/i })).toBeVisible();
      await page.getByRole('link', { name: /Submit idea/i }).click();
      await expect(page).toHaveURL(/submit-idea/);
    }
  });
});
