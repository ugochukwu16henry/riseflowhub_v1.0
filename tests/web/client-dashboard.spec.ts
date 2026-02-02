import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Client Dashboard (web)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('dashboard shows overview section', async ({ page }) => {
    await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Progress|Project|Stage|milestone/i)).toBeVisible();
  });

  test('sidebar shows client nav links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Project/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Tasks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Marketing/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Publish to Marketplace/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i })).toBeVisible();
  });

  test('navigate to Project page', async ({ page }) => {
    await page.getByRole('link', { name: /Project/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/project/);
    await expect(page.getByText(/Project|Details/i)).toBeVisible();
  });

  test('navigate to Tasks page', async ({ page }) => {
    await page.getByRole('link', { name: /Tasks/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByText(/Tasks/i)).toBeVisible();
  });

  test('navigate to Marketing page', async ({ page }) => {
    await page.getByRole('link', { name: /Marketing/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/marketing/);
    await expect(page.getByText(/Marketing|Analytics|Campaigns/i)).toBeVisible();
  });

  test('navigate to Publish to Marketplace page', async ({ page }) => {
    await page.getByRole('link', { name: /Publish to Marketplace/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/startup/);
    await expect(page.getByText(/Publish to Marketplace|Submit for approval/i)).toBeVisible();
  });
});
