import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Tenants (admin) (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
  });

  test('admin can open Tenants page and see list or New tenant button', async ({ page }) => {
    await page.getByRole('link', { name: /Tenants/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    await expect(page.getByText(/Tenants|white-label|New tenant|tenant/i)).toBeVisible({ timeout: 5000 });
  });

  test('New tenant button opens create form or list', async ({ page }) => {
    await page.getByRole('link', { name: /Tenants/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/tenants/);
    const newBtn = page.getByRole('button', { name: /New tenant/i });
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();
    await expect(page.getByText(/Create tenant|Organization name/i)).toBeVisible({ timeout: 5000 });
  });
});
