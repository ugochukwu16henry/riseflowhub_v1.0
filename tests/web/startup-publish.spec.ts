import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Publish to Marketplace (web)', () => {
  test('client can open Publish to Marketplace page', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.getByRole('link', { name: /Publish to Marketplace/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/startup/);
    await expect(page.getByText(/Publish to Marketplace|Submit for approval|admin approval/i)).toBeVisible({ timeout: 5000 });
  });

  test('page shows project selector or need project message', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.goto(WEB_URL + '/dashboard/startup');
    await expect(page.getByText(/Project|Pitch summary|Funding needed|need at least one project/i)).toBeVisible({ timeout: 5000 });
  });
});
