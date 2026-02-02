import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Admin Leads Dashboard (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test('admin can navigate to Leads from nav', async ({ page }) => {
    await page.getByRole('link', { name: /Leads/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/leads/);
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible();
  });

  test('Leads page shows table and filters', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/admin/leads');
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add lead/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /All statuses|status/i }).or(page.locator('select'))).toBeVisible();
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('Add lead opens modal with form', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/admin/leads');
    await page.getByRole('button', { name: /Add lead/i }).click();
    await expect(page.getByRole('dialog', { name: /Add lead/i })).toBeVisible();
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add lead/i }).last()).toBeVisible();
  });

  test('Leads page has status filter dropdown', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/admin/leads');
    const select = page.locator('select').first();
    await expect(select).toBeVisible();
    await select.selectOption({ value: 'New' });
    await expect(select).toHaveValue('New');
  });
});
