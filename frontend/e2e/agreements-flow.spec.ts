import { test, expect } from '@playwright/test';

test.describe('Agreements flow', () => {
  test('admin can create agreement template', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });

    await page.getByRole('link', { name: /Agreements/i }).click();
    await page.getByRole('button', { name: /Add New Agreement/i }).click();
    await page.getByLabel(/Title/i).fill(`E2E Agreement ${Date.now()}`);
    await page.locator('.fixed.inset-0 select').selectOption('NDA');
    await page.getByRole('button', { name: /Create/i }).click();
    await expect(page.getByText(/Agreement created|created\./i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /Add New Agreement/i })).not.toBeVisible();
  });

  test('client sees Agreements to Sign section', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Agreements to Sign/i)).toBeVisible();
  });
});
