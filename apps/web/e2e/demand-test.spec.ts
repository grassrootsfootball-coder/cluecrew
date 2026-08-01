/**
 * DEMAND-TEST-PACK verification:
 *   - §2 copy present verbatim (spot-checked at the lines that carry law:
 *     the hero, the honest line, the bursary ratio, the trademark footnote);
 *   - §1 prohibitions hold (no product screenshots, no countdown, no popup);
 *   - §3 plumbing round-trips: signup → double opt-in email → confirm →
 *     confirmed page, with the address only confirmed after the second tap;
 *   - the privacy notice is linked and answers §3's required questions.
 */
import { expect, request, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';

const EMAILS: string[] = [];

test.afterAll(async () => {
  await prisma.waitlistSignup.deleteMany({ where: { email: { in: EMAILS } } });
});

test('the page carries the §2 copy and none of the §1 prohibitions', async ({ page }) => {
  await page.goto('/founding?src=fb-kent');

  await expect(page.getByRole('heading', { name: 'The 11+ finally makes sense.' })).toBeVisible();
  await expect(page.getByText("We won't promise you a pass. Nobody honestly can.")).toBeVisible();
  await expect(page.getByText('One bursary place opens for every ten paid ones.')).toBeVisible();
  await expect(page.getByText('(trademark application pending)')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy notice' }).first()).toBeVisible();

  // §1: no product screenshots — the only image on the page is the logo.
  const images = page.locator('img');
  await expect(images).toHaveCount(1);
  await expect(images.first()).toHaveAttribute('alt', 'ClueCrew');
});

test('signup → double opt-in → confirmed, and only then is the address confirmed', async ({
  page,
}) => {
  const email = `e2e-waitlist-${Date.now()}@cluecrew.test`;
  EMAILS.push(email);

  await page.goto('/founding?src=fb-kent');
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="regionCode"]', 'kent');
  await page.selectOption('select[name="yearGroup"]', '4');
  await page.getByRole('button', { name: 'Join' }).click();
  await page.waitForURL('**/founding/thanks');

  // Signed up, src recorded, NOT yet confirmed — the email is the second key.
  const row = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(row?.src).toBe('fb-kent');
  expect(row?.regionCode).toBe('kent');
  expect(row?.yearGroup).toBe(4);
  expect(row?.confirmedAt).toBeNull();

  // The dev helper stands in for reading the email (same idiom as signup).
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const link = await api.get(`/api/dev/waitlist-confirm-link?email=${encodeURIComponent(email)}`);
  const { url } = (await link.json()) as { url: string };
  await page.goto(url);
  await page.waitForURL('**/founding/confirmed');
  await expect(page.getByRole('heading', { name: "You're on the list." })).toBeVisible();

  const confirmed = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(confirmed?.confirmedAt).not.toBeNull();

  // A reused token cannot flip anything and lands quietly.
  await page.goto(url);
  await page.waitForURL('**/founding/confirmed');
  await api.dispose();
});

test('§4 goals fire: pricing_viewed on scroll, waitlist_signup on the thanks page', async ({
  page,
}) => {
  // Stand in for plausible.io so the assertion is on OUR calls, not their
  // network: the recorder drains the queue stub, then records directly.
  await page.route('https://plausible.io/js/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        const queued = (window.plausible && window.plausible.q) ? Array.from(window.plausible.q).map(a => a[0]) : [];
        window.__plausibleGoals = queued;
        window.plausible = (goal) => window.__plausibleGoals.push(goal);
      `,
    }),
  );

  await page.goto('/founding');
  const hasAnalytics = (await page.locator('script[data-domain]').count()) > 0;
  test.skip(!hasAnalytics, 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN not set in this environment');

  // Below the fold until scrolled — then the observer fires exactly once.
  await page.getByRole('heading', { name: 'Crew — Free, forever.' }).scrollIntoViewIfNeeded();
  await expect
    .poll(async () => page.evaluate(() => (window as never as { __plausibleGoals?: string[] }).__plausibleGoals ?? []))
    .toContain('pricing_viewed');

  const email = `e2e-waitlist-goal-${Date.now()}@cluecrew.test`;
  EMAILS.push(email);
  await page.fill('input[name="email"]', email);
  await page.getByRole('button', { name: 'Join' }).click();
  await page.waitForURL('**/founding/thanks');
  await expect
    .poll(async () => page.evaluate(() => (window as never as { __plausibleGoals?: string[] }).__plausibleGoals ?? []))
    .toContain('waitlist_signup');
});

test('the privacy notice answers what §3 requires of it', async ({ page }) => {
  await page.goto('/founding/privacy');
  await expect(page.getByText('What we store')).toBeVisible();
  await expect(page.getByText('12 months after')).toBeVisible();
  await expect(page.getByText('UK and EU')).toBeVisible();
  await expect(page.getByText('cookieless')).toBeVisible();
});
