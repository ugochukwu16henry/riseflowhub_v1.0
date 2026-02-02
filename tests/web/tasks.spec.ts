import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Tasks (web)', () => {
  test('client sees Tasks page with columns', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.getByRole('link', { name: /Tasks/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByText(/Tasks/i).first()).toBeVisible();
    await expect(page.getByText(/Todo/i).first()).toBeVisible();
    await expect(page.getByText(/Done/i).first()).toBeVisible();
  });

  test('team user sees My tasks / By project toggle', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-developer@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.getByRole('link', { name: /Tasks/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByRole('button', { name: /By project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /My tasks/i })).toBeVisible();
  });
});
