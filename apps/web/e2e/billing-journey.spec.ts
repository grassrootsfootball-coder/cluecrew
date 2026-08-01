/**
 * Phase 2 gate #1 & #3 & #10: the full journey — signup → verify → child →
 * region → trial (NO card anywhere) → convert (card only at upgrade) →
 * cancel measured at two clicks. Runs against the dev payment provider.
 *
 * This is the one spec that builds its accounts by driving signup and
 * onboarding for real, because the journey IS the subject. Everything else
 * uses e2e/fixtures.ts. The accounts are still registered for cleanup so a
 * long-lived dev database does not silently fill up with abandoned families.
 */
import { expect, request, test, type Page } from '@playwright/test';
import { cleanupFixtures, trackAccount } from './fixtures';

const PASSWORD = 'E2eJourney!2026';

test.afterAll(cleanupFixtures);

async function signupAndVerify(email: string): Promise<void> {
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const signup = await api.post('/api/auth/signup', {
    data: { email, password: PASSWORD, displayName: 'Journey Parent' },
  });
  expect(signup.status()).toBe(201);
  const link = await api.get(`/api/dev/verification-link?email=${encodeURIComponent(email)}`);
  const { url } = (await link.json()) as { url: string };
  const verify = await api.get(url);
  expect(verify.ok()).toBeTruthy();
  await api.dispose();
  await trackAccount(email);
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/parent');
}

async function completeOnboarding(page: Page): Promise<void> {
  await page.goto('/onboarding');
  // Step 2: child profile
  await page.fill('input[name="crewName"]', 'Nia');
  await page.selectOption('select[name="yearGroup"]', '5');
  await page.getByRole('button', { name: 'Create profile' }).click();
  // Step 3: region wizard, with the verbatim caveat visible
  await page.waitForURL('**/onboarding');
  await expect(
    page.getByText('Schools change providers — always confirm with the school for your entry year.'),
  ).toBeVisible();
  await page.selectOption('select[name="regionCode"]', 'kent');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.waitForURL('**/onboarding');
}

test('trial requires no card; conversion collects card only at upgrade; cancel is two clicks', async ({
  page,
}) => {
  const email = `e2e-journey-${Date.now()}@cluecrew.test`;
  await signupAndVerify(email);
  await login(page, email);
  await completeOnboarding(page);

  // Steps 4–5 (Amendment 1 prices): all terms visible with TCV; start the
  // 24-month Full Crew preview.
  await expect(page.getByText('£203.76')).toBeVisible();
  await expect(page.getByText('£119.88')).toBeVisible();
  const twoYearCard = page.locator('.cc-card', { hasText: 'Full Crew — 24 months' });
  // NO card collection anywhere on the trial path (gate #10).
  await expect(page.locator('input[autocomplete*="cc-"], input[name*="card"]')).toHaveCount(0);
  await twoYearCard.getByRole('button', { name: /Start free trial/ }).click();
  await page.waitForURL('**/parent');
  await expect(page.getByText(/Trial: 7 days remaining/)).toBeVisible();

  // Billing: DMCC pre-contract clarity above the pay button (gate #2 content).
  await page.goto('/parent/billing');
  await expect(page.getByText('Free trial — no card on file')).toBeVisible();
  const dmccBlock = page.locator('.cc-card', { hasText: 'Continue after your trial' });
  await expect(dmccBlock.getByText('Total contract value: £203.76')).toBeVisible();
  await expect(dmccBlock.getByText(/two clicks/)).toBeVisible();
  await expect(dmccBlock.getByText(/£1\.50 per month used/)).toBeVisible(); // fair-exit, V2 prices

  // Convert: card is collected only now (dev provider simulates Stripe).
  await dmccBlock.getByRole('button', { name: 'Add payment details' }).click();
  await page.waitForURL('**/parent/billing/dev-checkout**');
  await page.getByRole('button', { name: 'Confirm test payment' }).click();
  await page.waitForURL('**/parent/billing');
  await expect(page.getByText('Status: Active', { exact: false })).toBeVisible();

  // Cancel: click 1…
  await page.getByRole('link', { name: 'Cancel plan' }).click();
  await page.waitForURL('**/parent/billing/cancel');
  await expect(page.getByText('Where you stand')).toBeVisible();
  // …click 2. The save-offer sits on this same screen and adds no click.
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await page.waitForURL('**/parent/billing');
  await expect(page.getByText('Status: Cancelled', { exact: false })).toBeVisible();
});

test('cooling-off refund is self-serve and returns the account to cancelled', async ({ page }) => {
  const email = `e2e-refund-${Date.now()}@cluecrew.test`;
  await signupAndVerify(email);
  await login(page, email);
  await completeOnboarding(page);
  await page
    .locator('.cc-card', { hasText: 'Full Crew — 12 months' })
    .getByRole('button', { name: /Start free trial/ })
    .click();
  await page.waitForURL('**/parent');

  await page.goto('/parent/billing');
  await page.getByRole('button', { name: 'Add payment details' }).click();
  await page.waitForURL('**/parent/billing/dev-checkout**');
  await page.getByRole('button', { name: 'Confirm test payment' }).click();
  await page.waitForURL('**/parent/billing');

  // Within 14 days of first payment → the refund button must be offered.
  await page.getByRole('button', { name: 'Refund me in full' }).click();
  await page.waitForURL('**/parent/billing');
  await expect(page.getByText('Status: Cancelled', { exact: false })).toBeVisible();
});
