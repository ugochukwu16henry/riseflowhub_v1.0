import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Admin Dashboard (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test('admin dashboard shows nav: Projects, Users, Agreements, Tenants', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Users/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Agreements/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tenants/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Startup approvals/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });

  test('navigate to Projects page', async ({ page }) => {
    await page.getByRole('link', { name: /Projects/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/projects/);
    await expect(page.getByText(/Projects/i)).toBeVisible();
  });

  test('navigate to Users page', async ({ page }) => {
    await page.getByRole('link', { name: /Users/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/users/);
    await expect(page.getByText(/Users/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('navigate to Agreements page', async ({ page }) => {
    await page.getByRole('link', { name: /Agreements/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/agreements/);
    await expect(page.getByText(/Agreement Management|Agreement management/i)).toBeVisible();
  });

  test('navigate to Tenants page', async ({ page }) => {
    await page.getByRole('link', { name: /Tenants/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    await expect(page.getByText(/Tenants|white-label/i)).toBeVisible();
  });

  test('navigate to Startup approvals page', async ({ page }) => {
    await page.getByRole('link', { name: /Startup approvals/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/startups/);
    await expect(page.getByText(/Startup|approval/i)).toBeVisible();
  });

  test('admin can log out', async ({ page }) => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
