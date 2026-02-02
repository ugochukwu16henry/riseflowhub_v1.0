import { test, expect } from '@playwright/test';

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
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
    await expect(page.getByRole('link', { name: /Files/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Messages/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Payments/i })).toBeVisible();
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
    await expect(page.getByText(/Todo|In Progress|Done|Blocked/i).first()).toBeVisible();
  });

  test('navigate to Files page', async ({ page }) => {
    await page.getByRole('link', { name: /Files/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/files/);
  });

  test('navigate to Messages page', async ({ page }) => {
    await page.getByRole('link', { name: /Messages/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/messages/);
  });

  test('navigate to Payments page', async ({ page }) => {
    await page.getByRole('link', { name: /Payments/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
  });

  test('Agreements to Sign section visible', async ({ page }) => {
    await expect(page.getByText(/Agreements to Sign/i)).toBeVisible();
  });

  test('dashboard shows project timeline or no project message', async ({ page }) => {
    const hasProject = await page.getByText(/You don't have a project yet/i).isVisible().catch(() => false);
    const hasTimeline = await page.getByText(/Project timeline|Progress/i).isVisible().catch(() => false);
    expect(hasProject || hasTimeline).toBeTruthy();
  });
});
