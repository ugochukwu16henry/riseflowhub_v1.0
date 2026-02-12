import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Authenticate once as super_admin and save storage state (localStorage includes riseflow_token).
 * Admin dashboard tests use this state via project dependency — no UI login in each test.
 * Prerequisites: Backend at http://localhost:4000, DB seeded (test-super_admin@example.com / Password123).
 */
export const SUPERADMIN_STORAGE = path.join(process.cwd(), 'playwright', '.auth', 'superadmin.json');
const AUTH_DIR = path.dirname(SUPERADMIN_STORAGE);

function ensureAuthDir() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
}

setup.beforeAll(() => {
  ensureAuthDir();
});

setup('authenticate as super_admin', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel(/Email/i).fill('test-super_admin@example.com');
  await page.getByLabel(/Password/i).fill('Password123');
  await page.getByRole('button', { name: /Sign in/i }).click();
  await page.waitForURL(/\/dashboard\/admin/, { timeout: 30000 });
  await page.context().storageState({ path: SUPERADMIN_STORAGE });
});
