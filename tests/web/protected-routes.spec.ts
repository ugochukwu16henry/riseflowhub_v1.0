import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Protected routes (web)', () => {
  test('unauthenticated user visiting /dashboard redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated user visiting /dashboard/admin redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated user visiting /dashboard/tasks redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/tasks');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated user visiting /dashboard/admin/agreements redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/admin/agreements');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('unauthenticated user visiting /dashboard/investor redirects to login', async ({ page }) => {
    await page.goto(WEB_URL + '/dashboard/investor');
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('login and register pages are accessible without auth', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await expect(page).toHaveURL(/\/login/);
    await page.goto(WEB_URL + '/register');
    await expect(page).toHaveURL(/\/register/);
  });
});
