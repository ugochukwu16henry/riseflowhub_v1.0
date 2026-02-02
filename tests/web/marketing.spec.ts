import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Marketing tab (web)', () => {
  test('client can open Marketing page and see project selector', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.getByRole('link', { name: /Marketing/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/marketing/);
    await expect(page.getByText(/Marketing Analytics|Campaigns|Funnel|ROI/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Project|Select a project/i)).toBeVisible();
  });

  test('admin can open Marketing page', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
    await page.getByRole('link', { name: /Marketing/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/marketing/);
    await expect(page.getByText(/Marketing|Campaigns|Funnel/i)).toBeVisible({ timeout: 5000 });
  });
});
