import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Super Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test('login as super_admin redirects to admin dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/admin/);
    await expect(page.getByText(/Super Admin Dashboard|Dashboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('Super Admin Dashboard shows main content', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Super Admin Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Overview of all projects/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: /View all/i })).toBeVisible();
  });

  test('Super Admin Dashboard shows quick links: Leads, Agreements, Users, Reports', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Leads/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Agreements/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Users/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i }).first()).toBeVisible();
  });

  test('super_admin sees full admin nav: Leads, Projects, Tenants, Users, Agreements, Startup approvals, Settings', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^Dashboard$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /AI Mentor/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Leads$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Projects$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Marketing/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tenants/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Users$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Agreements/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Startup approvals/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });

  test('super_admin does not see setup fee modal', async ({ page }) => {
    const setupModal = page.getByRole('dialog', { name: /Complete your setup|Unlock your startup journey/i });
    await expect(setupModal).not.toBeVisible();
  });

  test('navigate to admin Dashboard (home) from nav', async ({ page }) => {
    await page.getByRole('link', { name: /^Dashboard$/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/?$/);
    await expect(page.getByRole('heading', { name: /Super Admin Dashboard/i })).toBeVisible();
  });

  test('navigate to Projects from dashboard View all', async ({ page }) => {
    await page.getByRole('link', { name: /View all/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/projects/);
    await expect(page.getByRole('heading', { name: /All projects|Projects/i })).toBeVisible();
  });

  test('navigate to Leads from dashboard card', async ({ page }) => {
    await page.getByRole('link', { name: /Leads/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/leads/);
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible();
  });

  test('navigate to Tenants (super_admin only)', async ({ page }) => {
    await page.getByRole('link', { name: /Tenants/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    await expect(page.getByText(/Tenants|white-label|org/i)).toBeVisible();
  });

  test('navigate to Users and see table', async ({ page }) => {
    await page.getByRole('link', { name: /^Users$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/users/);
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('navigate to Agreements', async ({ page }) => {
    await page.getByRole('link', { name: /Agreements/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/agreements/);
    await expect(page.getByText(/Agreement|agreement/i)).toBeVisible();
  });

  test('navigate to Startup approvals', async ({ page }) => {
    await page.getByRole('link', { name: /Startup approvals/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/startups/);
    await expect(page.getByText(/Startup|approval/i)).toBeVisible();
  });

  test('navigate to Reports', async ({ page }) => {
    await page.getByRole('link', { name: /Reports/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/reports/);
  });

  test('navigate to Settings', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/settings/);
  });

  test('super_admin can log out', async ({ page }) => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    await expect(page.getByLabel(/Email/i)).toBeVisible();
  });

  test('sidebar shows super_admin email and role', async ({ page }) => {
    await expect(page.getByText(/test-super_admin@example\.com/i)).toBeVisible();
    await expect(page.getByText(/super admin/i)).toBeVisible();
  });
});
