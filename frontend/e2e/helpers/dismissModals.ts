import { Page } from '@playwright/test';

/** Dismiss the Welcome dialog (admin/team) if visible. */
export async function dismissWelcome(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Welcome' });
  const btn = page.getByRole('button', { name: 'Get started' });
  try {
    if (await dialog.isVisible({ timeout: 3000 })) {
      await btn.click({ timeout: 5000 });
      await page.waitForTimeout(400);
    }
  } catch {
    // No Welcome modal
  }
}

/** Dismiss the "Complete your setup" modal (client) if visible: go to choose step if needed, then Skip for Now → Continue to limited dashboard. */
export async function dismissSetupModal(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Complete your setup' });
  try {
    if (!(await dialog.isVisible({ timeout: 2000 }))) return;
    
    // Wait a bit for the modal to fully render
    await page.waitForTimeout(500);
    
    const skipBtn = page.getByRole('button', { name: 'Skip for Now' });
    if (await skipBtn.isVisible({ timeout: 1000 })) {
      await skipBtn.click();
      await page.waitForTimeout(300);
      const continueBtn = page.getByRole('button', { name: 'Continue to limited dashboard' });
      if (await continueBtn.isVisible({ timeout: 3000 })) {
        await continueBtn.click();
        await page.waitForTimeout(500);
      }
      return;
    }
    
    const continuePayment = page.getByRole('button', { name: 'Continue to payment' });
    if (await continuePayment.isVisible({ timeout: 1000 })) {
      await continuePayment.click();
      await page.waitForTimeout(400);
      const skipAfterPayment = page.getByRole('button', { name: 'Skip for Now' });
      if (await skipAfterPayment.isVisible({ timeout: 3000 })) {
        await skipAfterPayment.click();
        await page.waitForTimeout(300);
        const continueLimited = page.getByRole('button', { name: 'Continue to limited dashboard' });
        if (await continueLimited.isVisible({ timeout: 3000 })) {
          await continueLimited.click();
          await page.waitForTimeout(500);
        }
      }
    }
  } catch (err) {
    // No Setup modal or step already dismissed
    console.log('dismissSetupModal: No modal found or error dismissing:', err);
  }
}

/** Dismiss both modals so dashboard nav is clickable. Call after landing on /dashboard or /dashboard/admin. */
export async function dismissDashboardModals(page: Page): Promise<void> {
  await dismissWelcome(page);
  await page.waitForTimeout(500);
  await dismissSetupModal(page);
  await page.waitForTimeout(500);
}
