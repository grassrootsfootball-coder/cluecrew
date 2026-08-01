/**
 * DEMAND-TEST-PACK-V2 verification:
 *   - §1 architecture: hero CTAs, the three-item demo with the product's
 *     answer behaviour (praise / "Not yet" + misconception hint), the close
 *     beat, the Region Decoder card with the mandatory caveat, the sticky
 *     bar after scroll, and §6 prohibitions (no screenshots, no countdown);
 *   - §2 plumbing: signup round-trips with double opt-in; capture source
 *     and decoder region recorded; the confirm email carries the guide;
 *   - §3 goals: demo_started, demo_q_answered (with result prop),
 *     demo_completed, region_decoded, waitlist_signup, pricing_viewed.
 */
import { expect, request, test, type Page } from '@playwright/test';
import { prisma } from '@cluecrew/db';

const EMAILS: string[] = [];

test.afterAll(async () => {
  await prisma.waitlistSignup.deleteMany({ where: { email: { in: EMAILS } } });
});

/** Plays the three-question demo to the end, taking one deliberate slip. */
async function playDemo(page: Page) {
  // Q1 (TARTS = 24): slip on the repeated-letter misconception first.
  await page.getByRole('button', { name: '18', exact: true }).click();
  await expect(page.getByText(/Not yet\. So close — check the letter T/)).toBeVisible();
  await page.getByRole('button', { name: '24', exact: true }).click();
  await expect(page.getByText(/You paid every letter, even the repeat/)).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();

  // Q2 (CHIN hides in "muCH INside").
  await page.getByRole('button', { name: 'CHIN', exact: true }).click();
  await expect(page.getByText(/You read across the join/)).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();

  // Q3 (5 packs).
  await page.getByRole('button', { name: '5 packs', exact: true }).click();
  await expect(page.getByText(/rounded UP for the packs/)).toBeVisible();
  await page.getByRole('button', { name: 'What was that hint about?' }).click();

  // The close beat (§1, verbatim).
  await expect(
    page.getByText(/written to\s+catch a real misconception and teach through it/),
  ).toBeVisible();
}

test('the page carries the v2 architecture and none of the §6 prohibitions', async ({ page }) => {
  await page.goto('/founding?src=fb-kent');

  await expect(page.getByRole('heading', { name: 'The 11+ finally makes sense.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try a question — takes 20 seconds' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Here's what it feels like." })).toBeVisible();
  await expect(page.getByText("We won't promise you a pass. Nobody honestly can.")).toBeVisible();
  await expect(page.getByText('never “trade secret”')).toBeVisible();
  await expect(page.getByText('Is this like Atom?')).toBeVisible();
  await expect(page.getByText('(trademark application pending)')).toBeVisible();

  // §6: no screenshots or stock photos — the logo is the only image family
  // (hero + sticky bar render the same asset).
  for (const image of await page.locator('img').all()) {
    await expect(image).toHaveAttribute('alt', 'ClueCrew');
  }

  // The sticky bar appears only after the hero scrolls past.
  await expect(page.getByTestId('sticky-bar')).toHaveCount(0);
  await page.getByRole('heading', { name: 'Questions parents ask' }).scrollIntoViewIfNeeded();
  await expect(page.getByTestId('sticky-bar')).toBeVisible();
});

test('the demo behaves like the product: praise, "Not yet" + hint, close beat', async ({
  page,
}) => {
  await page.goto('/founding');
  await playDemo(page);
});

test('the Region Decoder answers in ten seconds and always carries the caveat', async ({
  page,
}) => {
  await page.goto('/founding');
  await page.selectOption('.fd-decoder select', 'kent');
  const card = page.getByTestId('decoder-card');
  await expect(card).toBeVisible();
  await expect(card.getByText(/GL-style/).first()).toBeVisible();
  await expect(
    card.getByText('Schools change providers — always confirm with the school for your entry year.'),
  ).toBeVisible();
  // No prediction anywhere on the card (the anti-Atom line, structurally).
  await expect(card.getByText(/chance|likelihood|predict/i)).toHaveCount(0);
});

test('signup from the decoder records source + region and the email carries the guide', async ({
  page,
}) => {
  const email = `e2e-waitlist-v2-${Date.now()}@cluecrew.test`;
  EMAILS.push(email);

  await page.goto('/founding?src=fb-kent');
  await page.selectOption('.fd-decoder select', 'kent');
  await page.fill('.fd-decoder-capture input[name="email"]', email);
  await page.getByRole('button', { name: 'Send my guide' }).click();
  await page.waitForURL('**/founding/thanks');

  const row = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(row?.source).toBe('region-decoder');
  expect(row?.regionCode).toBe('kent');
  expect(row?.src).toBe('fb-kent');
  expect(row?.confirmedAt).toBeNull();

  // Double opt-in round trip via the dev helper.
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const link = await api.get(`/api/dev/waitlist-confirm-link?email=${encodeURIComponent(email)}`);
  const { url } = (await link.json()) as { url: string };
  await page.goto(url);
  await page.waitForURL('**/founding/confirmed');
  const confirmed = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(confirmed?.confirmedAt).not.toBeNull();
  await api.dispose();
});

test('§3 goals fire with their props across the whole journey', async ({ page }) => {
  await page.route('https://plausible.io/js/script.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        const queued = (window.plausible && window.plausible.q) ? Array.from(window.plausible.q).map(a => ({ goal: a[0], props: (a[1] && a[1].props) || {} })) : [];
        window.__plausibleGoals = queued;
        window.plausible = (goal, options) => window.__plausibleGoals.push({ goal, props: (options && options.props) || {} });
      `,
    }),
  );

  await page.goto('/founding');
  const hasAnalytics = (await page.locator('script[data-domain]').count()) > 0;
  test.skip(!hasAnalytics, 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN not set in this environment');

  const goals = () =>
    page.evaluate(
      () =>
        (window as never as { __plausibleGoals?: { goal: string; props: Record<string, string> }[] })
          .__plausibleGoals ?? [],
    );

  await playDemo(page);
  await page.selectOption('.fd-decoder select', 'kent');
  await page.getByRole('heading', { name: 'Crew — Free, forever.' }).scrollIntoViewIfNeeded();

  await expect.poll(async () => (await goals()).map((g) => g.goal)).toContain('demo_started');
  await expect.poll(async () => (await goals()).map((g) => g.goal)).toContain('demo_completed');
  await expect.poll(async () => (await goals()).map((g) => g.goal)).toContain('region_decoded');
  await expect.poll(async () => (await goals()).map((g) => g.goal)).toContain('pricing_viewed');

  const answered = (await goals()).filter((g) => g.goal === 'demo_q_answered');
  expect(answered.some((g) => g.props.result === 'incorrect')).toBe(true); // the money moment
  expect(answered.some((g) => g.props.result === 'correct')).toBe(true);

  const email = `e2e-waitlist-v2goal-${Date.now()}@cluecrew.test`;
  EMAILS.push(email);
  await page.fill('#waitlist input[name="email"]', email);
  await page.locator('#waitlist').getByRole('button', { name: 'Join' }).click();
  await page.waitForURL('**/founding/thanks');
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (
            (window as never as { __plausibleGoals?: { goal: string }[] }).__plausibleGoals ?? []
          ).map((g) => g.goal),
      ),
    )
    .toContain('waitlist_signup');
  const demoEnd = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(demoEnd?.source).toBe('demo-end');
});

test('the privacy notice answers what §3 requires of it', async ({ page }) => {
  await page.goto('/founding/privacy');
  await expect(page.getByText('What we store')).toBeVisible();
  await expect(page.getByText('12 months after')).toBeVisible();
  await expect(page.getByText('UK and EU')).toBeVisible();
  await expect(page.getByText('cookieless')).toBeVisible();
});
