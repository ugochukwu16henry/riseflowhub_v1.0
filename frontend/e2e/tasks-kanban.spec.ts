import { test, expect } from '@playwright/test';

test.describe('Tasks Kanban', () => {
  test('client sees Tasks page with Kanban columns', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.locator('a[href="/dashboard/tasks"]').click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByText(/Tasks/i).first()).toBeVisible();
    await expect(
      page.getByTestId('kanban-column-todo').or(page.getByTestId('kanban-column-done')).or(page.getByText(/No project yet/i))
    ).toBeVisible();
  });

  test('team user sees My tasks / By project toggle', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByLabel(/Email/i).fill('test-developer@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.locator('a[href="/dashboard/tasks"]').click();
    await expect(page).toHaveURL(/\/dashboard\/tasks/);
    await expect(page.getByRole('button', { name: /By project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /My tasks/i })).toBeVisible();
  });
});
