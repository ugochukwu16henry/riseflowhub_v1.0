import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Investor Marketplace (web)', () => {
  test('login as investor redirects to investor dashboard', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-investor@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/investor/, { timeout: 10000 });
    await expect(page.getByText(/Dashboard|Marketplace|investments/i)).toBeVisible({ timeout: 5000 });
  });

  test('investor sees Marketplace and My investments nav', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-investor@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/investor/, { timeout: 10000 });
    await expect(page.getByRole('link', { name: /Marketplace/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /My investments/i })).toBeVisible();
  });

  test('investor can open Marketplace and see startups list or empty', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-investor@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/investor/, { timeout: 10000 });
    await page.getByRole('link', { name: /Marketplace/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/investor\/marketplace/);
    await expect(page.getByText(/Marketplace|Startups|filter|No startup/i)).toBeVisible({ timeout: 5000 });
  });
});
