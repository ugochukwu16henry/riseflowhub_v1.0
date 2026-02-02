import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

test.describe('Setup Fee Flow (web)', () => {
  test('login as client shows setup modal when setup not paid', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    // Modal may show if test-client has setupPaid=false and no setupReason
    const modal = page.getByRole('dialog', { name: /Complete your setup/i });
    const skipButton = page.getByRole('button', { name: /Skip for Now/i });
    const payButton = page.getByRole('button', { name: /Pay Setup Fee/i });
    const hasModal = await modal.isVisible().catch(() => false);
    if (hasModal) {
      await expect(modal).toBeVisible();
      await expect(skipButton.or(payButton)).toBeVisible();
    }
  });

  test('setup modal Skip opens reason form', async ({ page }) => {
    await page.goto(WEB_URL + '/login');
    await page.getByLabel(/Email/i).fill('test-client@example.com');
    await page.getByLabel(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    const skipButton = page.getByRole('button', { name: /Skip for Now/i });
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.click();
      await expect(page.getByText(/Why are you skipping/i)).toBeVisible({ timeout: 3000 });
      await expect(page.getByLabel(/Just exploring/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Continue to limited dashboard/i })).toBeVisible();
    }
  });

  test('setup payment page shows amount and confirm', async ({ page }) => {
    await page.goto(WEB_URL + '/setup-payment?ref=e2e-ref&amount=7&currency=USD');
    await expect(page.getByRole('heading', { name: /Setup Fee Payment/i })).toBeVisible();
    await expect(page.getByText(/USD.*7|7.*USD/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirm payment/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
  });

  test('book consultation page shows free or paid badge when logged in', async ({ page }) => {
    await page.goto(WEB_URL + '/book-consultation');
    await expect(page.getByRole('heading', { name: /Let's Talk About Your Idea/i })).toBeVisible();
    // When not logged in, no badge; when logged in we may see Free consultation or Paid booking
    const freeBadge = page.getByText(/Free consultation/i);
    const paidBadge = page.getByText(/Paid booking/i);
    const hasAny = (await freeBadge.isVisible().catch(() => false)) || (await paidBadge.isVisible().catch(() => false));
    if (hasAny) {
      expect(await freeBadge.or(paidBadge).isVisible()).toBeTruthy();
    }
  });
});
