import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test('admin dashboard shows nav: Projects, Users, Agreements', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Users/i })).toBeVisible();
    await expect(page.locator('a[href="/dashboard/admin/agreements"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i })).toBeVisible();
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
    await page.locator('a[href="/dashboard/admin/agreements"]').click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/agreements/);
    await expect(page.getByText(/Agreement Management|Agreement management/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Add New Agreement/i })).toBeVisible();
  });

  test('Agreements page has table and filters', async ({ page }) => {
    await page.locator('a[href="/dashboard/admin/agreements"]').click();
    await expect(page.getByPlaceholder(/Search by user or agreement/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Assign Agreement/i })).toBeVisible();
  });

  test('Add New Agreement modal opens and closes', async ({ page }) => {
    await page.locator('a[href="/dashboard/admin/agreements"]').click();
    await page.getByRole('button', { name: /Add New Agreement/i }).click();
    await expect(page.getByRole('heading', { name: /Add New Agreement/i })).toBeVisible();
    await expect(page.getByLabel(/Title/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByRole('heading', { name: /Add New Agreement/i })).not.toBeVisible();
  });

  test('Assign Agreement modal opens', async ({ page }) => {
    await page.locator('a[href="/dashboard/admin/agreements"]').click();
    await page.getByRole('button', { name: /Assign Agreement/i }).click();
    await expect(page.getByRole('heading', { name: /Assign Agreement/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
  });

  test('navigate to Reports page', async ({ page }) => {
    await page.getByRole('link', { name: /Reports/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/reports/);
  });

  test('navigate to Settings page', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/settings/);
  });

  test('admin can log out', async ({ page }) => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
