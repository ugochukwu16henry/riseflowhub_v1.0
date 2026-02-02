import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Legal Pages', () => {
  test('Terms of Service page loads and shows content', async ({ page }) => {
    await page.goto(WEB_URL + '/terms');
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(/Acceptance of Terms|Nature of the Platform/i)).toBeVisible();
    await expect(page.getByText(/Payments|Milestone|termination/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/i })).toBeVisible();
  });

  test('Privacy Policy page loads and shows content', async ({ page }) => {
    await page.goto(WEB_URL + '/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/Data We Collect|How We Use|Data protection|Third-party/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/i })).toBeVisible();
  });

  test('User Agreement page loads and shows content', async ({ page }) => {
    await page.goto(WEB_URL + '/user-agreement');
    await expect(page.getByRole('heading', { name: /User Agreement/i })).toBeVisible();
    await expect(page.getByText(/Digital agreements|Electronic signature|Platform responsibilities|Client responsibilities/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/i })).toBeVisible();
  });

  test('Back to home from Terms navigates to home', async ({ page }) => {
    await page.goto(WEB_URL + '/terms');
    await page.getByRole('link', { name: /Back to home/i }).click();
    await expect(page).toHaveURL(new RegExp(WEB_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/?$'));
  });

  test('Footer links to Terms and Privacy from home', async ({ page }) => {
    await page.goto(WEB_URL + '/');
    await expect(page.getByRole('link', { name: /Terms/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Privacy/i })).toBeVisible();
    await page.getByRole('link', { name: /Terms/i }).first().click();
    await expect(page).toHaveURL(/\/terms/);
  });
});
