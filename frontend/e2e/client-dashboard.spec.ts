import { test, expect } from '@playwright/test';

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
  });

  test('dashboard shows overview section', async ({ page }) => {
    await expect(page.getByText(/Welcome back|Dashboard|Progress|Project|Stage|milestone/i)).toBeVisible();
  });

  test('sidebar shows client nav links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/project"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/tasks"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/files"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/messages"]')).toBeVisible();
    await expect(page.locator('a[href="/dashboard/payments"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /Reports/i })).toBeVisible();
  });

  test('navigate to Project page', async ({ page }) => {
    await page.locator('a[href="/dashboard/project"]').click();
    await expect(page).toHaveURL(/\/dashboard\/project/);
    await expect(page.getByText(/Project|Details|No project/i)).toBeVisible();
  });

  test('navigate to Tasks page', async ({ page }) => {
    await page.locator('a[href="/dashboard/tasks"]').click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(
      page.getByTestId('kanban-column-todo').or(page.getByText(/Tasks|No project yet/i))
    ).toBeVisible();
  });

  test('navigate to Files page', async ({ page }) => {
    await page.locator('a[href="/dashboard/files"]').click();
    await expect(page).toHaveURL(/\/dashboard\/files/);
  });

  test('navigate to Messages page', async ({ page }) => {
    await page.locator('a[href="/dashboard/messages"]').click();
    await expect(page).toHaveURL(/\/dashboard\/messages/);
  });

  test('navigate to Payments page', async ({ page }) => {
    await page.locator('a[href="/dashboard/payments"]').click();
    await expect(page).toHaveURL(/\/dashboard\/payments/);
  });

  test('Agreements to Sign section visible', async ({ page }) => {
    await expect(page.getByText(/Agreements to Sign/i)).toBeVisible();
  });

  test('dashboard shows project timeline or no project message', async ({ page }) => {
    await expect(
      page.getByText(/You don't have a project yet|Project timeline|Progress|Dashboard/i)
    ).toBeVisible();
  });
});
