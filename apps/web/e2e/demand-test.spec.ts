/**
 * LIVE-LAUNCH-PACK-V3 verification (supersedes the v1/v2 assertions):
 *   - §2 architecture: Start-free hero, playable demo with the close beat
 *     and a product-delivering CTA, the "What's live today" firewall, the
 *     Region Decoder, the pricing TABLE with reserve buttons, the amended
 *     FAQ — and NO Crew Plus or Summer anywhere (absent, not teased);
 *   - the v2-review carry-overs, pinned: every wrong demo option surfaces
 *     ITS OWN misconception hint (the hint-mismatch class), and the page's
 *     images are all the (fixed) lockup;
 *   - reserve plumbing: name + email + tier recorded as paid-intent with
 *     double opt-in, explicitly not a payment;
 *   - §3 goals: demo_started/completed, region_decoded, pricing_viewed,
 *     founding_reserved, signup_started (signup_completed is covered by the
 *     billing journey's real signups; first_session/first_case stay
 *     first-party by manifesto S1 — see scripts/launch-metrics.mjs).
 */
import { expect, request, test, type Page } from '@playwright/test';
import { prisma } from '@cluecrew/db';

const EMAILS: string[] = [];

test.afterAll(async () => {
  await prisma.waitlistSignup.deleteMany({ where: { email: { in: EMAILS } } });
});

async function playDemo(page: Page) {
  await page.getByRole('button', { name: '18', exact: true }).click();
  await expect(page.getByText(/Not yet\. So close — check the letter T/)).toBeVisible();
  await page.getByRole('button', { name: '24', exact: true }).click();
  await expect(page.getByText(/You paid every letter, even the repeat/)).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();

  await page.getByRole('button', { name: 'CHIN', exact: true }).click();
  await expect(page.getByText(/You read across the join/)).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();

  await page.getByRole('button', { name: '5 packs', exact: true }).click();
  await expect(page.getByText(/rounded UP for the packs/)).toBeVisible();
  await page.getByRole('button', { name: 'What was that hint about?' }).click();

  await expect(
    page.getByText(/written to\s+catch a real misconception and teach through it/),
  ).toBeVisible();
  // V3: the close beat's button delivers the product.
  await expect(
    page.getByTestId('demo-close-beat').getByRole('link', { name: /Start free/ }),
  ).toBeVisible();
}

test('the page carries the v3 two-step architecture', async ({ page }) => {
  await page.goto('/founding?src=fb-kent');

  await expect(page.getByRole('heading', { name: 'The 11+ finally makes sense.' })).toBeVisible();
  const hero = page.locator('.mk-hero');
  await expect(hero.getByRole('link', { name: 'Start free — no card, no clock' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Try a question first — 20 seconds' })).toBeVisible();

  // The honesty roadmap.
  await expect(page.getByRole('heading', { name: "What's live today" })).toBeVisible();
  await expect(page.getByTestId('live-now')).toContainText('all 21 GL-style question types');

  // Pricing is a table: Crew row starts free; Full Crew rows reserve.
  const table = page.locator('.fd-pricing table');
  await expect(table.getByRole('link', { name: 'Start free' })).toBeVisible();
  await expect(table.getByRole('button', { name: 'Reserve the founding rate' })).toHaveCount(3);
  await expect(table.getByText('£203.76 total')).toBeVisible();
  await expect(table.getByText('£119.88 total')).toBeVisible();

  // Hidden at launch: absent, not "coming soon" (§1).
  await expect(page.getByText(/Crew Plus|Summer Intensive|£24\.99|£69/)).toHaveCount(0);

  // FAQ amendments.
  await expect(page.getByText('What do I get free?')).toBeVisible();
  await expect(page.getByText('When do the other subjects arrive?')).toBeVisible();
  await expect(page.getByText('When does it launch?')).toHaveCount(0);
  await expect(page.getByText('Is this like Atom?')).toBeVisible();

  // Every image is the lockup.
  for (const image of await page.locator('img').all()) {
    await expect(image).toHaveAttribute('alt', 'ClueCrew');
  }

  // Sticky bar: Start free after scroll.
  await expect(page.getByTestId('sticky-bar')).toHaveCount(0);
  await page.getByRole('heading', { name: 'Questions parents ask' }).scrollIntoViewIfNeeded();
  await expect(page.getByTestId('sticky-bar').getByRole('link', { name: 'Start free' })).toBeVisible();
});

test('the demo plays start to finish with the product behaviour', async ({ page }) => {
  await page.goto('/founding');
  await playDemo(page);
});

test('every wrong option surfaces its own hint — the hint-mismatch pin', async ({ page }) => {
  await page.goto('/founding');

  // Q1 TARTS: each distractor's hint names ITS misconception.
  await page.getByRole('button', { name: '18', exact: true }).click();
  await expect(page.getByText(/It appears twice, and it gets paid both times/)).toBeVisible();
  await page.getByRole('button', { name: '23', exact: true }).click();
  await expect(page.getByText(/add the five prices one step at a time/)).toBeVisible();
  await page.getByRole('button', { name: '20', exact: true }).click();
  await expect(page.getByText(/Five letters need five prices/)).toBeVisible();
  await page.getByRole('button', { name: '24', exact: true }).click();
  await page.getByRole('button', { name: 'Next question' }).click();

  // Q2 CHIN: the three distractors, each to its own hint.
  await page.getByRole('button', { name: 'MUCH', exact: true }).click();
  await expect(page.getByText(/MUCH is standing in plain sight/)).toBeVisible();
  await page.getByRole('button', { name: 'SIDE', exact: true }).click();
  await expect(page.getByText(/SIDE lives inside one word/)).toBeVisible();
  await page.getByRole('button', { name: 'BOX', exact: true }).click();
  await expect(page.getByText(/BOX is a whole word doing its own job/)).toBeVisible();
  await page.getByRole('button', { name: 'CHIN', exact: true }).click();
  await page.getByRole('button', { name: 'Next question' }).click();

  // Q3 fence packs.
  await page.getByRole('button', { name: '4 packs', exact: true }).click();
  await expect(page.getByText(/4 packs only brings 40/)).toBeVisible();
  await page.getByRole('button', { name: '42 packs', exact: true }).click();
  await expect(page.getByText(/42 is the number of PLANKS/)).toBeVisible();
  await page.getByRole('button', { name: '6 packs', exact: true }).click();
  await expect(page.getByText(/Six packs would cover it/)).toBeVisible();
});

test('five ways in: every tab is real, the rail scrubs, the try item plays (V3.1 §A)', async ({
  page,
}) => {
  await page.goto('/founding');
  const section = page.getByTestId('five-ways');

  // Watch + Hear carry their honest in-production tags, never a fake player.
  await expect(section.getByText('the animation is in production')).toBeVisible();

  // Walk: three steps, scaffold fading, the solo step ends in the repeat trap.
  await section.getByRole('tab', { name: 'Walk it' }).click();
  await expect(section.getByText('CAB costs 11')).toBeVisible();
  await section.getByRole('button', { name: 'Next step' }).click();
  await section.getByRole('button', { name: 'Show the finish' }).click();
  await expect(section.getByText('B‑A‑T is 7 + 6 = 13.')).toBeVisible();
  await section.getByRole('button', { name: 'Next step' }).click();
  await section.getByRole('button', { name: 'Show the finish' }).click();
  await expect(section.getByText('T + A + C + T = 6 + 2 + 4 + 6 = 18.')).toBeVisible();

  // See: the REAL Alphabet Rail — tap two letters, the jump counts.
  await section.getByRole('tab', { name: 'See it' }).click();
  await section.getByRole('button', { name: 'B', exact: true }).click();
  await section.getByRole('button', { name: 'E', exact: true }).click();
  await expect(section.getByText('B to E: 3 jumps')).toBeVisible();

  // Hear: transcript visible with the device-speech tag.
  await section.getByRole('tab', { name: 'Hear it' }).click();
  await expect(section.getByText('Read aloud by your device')).toBeVisible();
  await expect(section.getByText(/it gets paid both times/)).toBeVisible();

  // Try: the letter-code item with the product behaviour.
  await section.getByRole('tab', { name: 'Try it' }).click();
  await section.getByRole('button', { name: '18', exact: true }).click();
  await expect(section.getByText(/Not yet\. So close — check the letter T/)).toBeVisible();
  await section.getByRole('button', { name: '24', exact: true }).click();
  await expect(section.getByText(/You paid every letter, even the repeat/)).toBeVisible();
});

test('under the bonnet: six entries and the transparency link (V3.1 §B)', async ({ page }) => {
  await page.goto('/founding');
  await expect(page.getByRole('heading', { name: 'Built like it matters. Because it does.' })).toBeVisible();
  for (const lead of [
    'Review timed to the forgetting curve.',
    'Difficulty that keeps them in the zone.',
    'Every wrong answer is authored.',
    "Mock exams that wait until they're ready.",
    'Intensity that follows the calendar.',
    'The exam format, made boring.',
  ]) {
    await expect(page.getByText(lead)).toBeVisible();
  }
  await page.getByRole('link', { name: 'How we teach' }).click();
  await page.waitForURL('**/how-we-teach');
  await expect(page.getByRole('heading', { name: 'How ClueCrew teaches' })).toBeVisible();
  // The shell never pretends: it says the write-up is on its way.
  await expect(page.getByText('is being finished and lands here')).toBeVisible();
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
  await expect(card.getByText(/chance|likelihood|predict/i)).toHaveCount(0);
});

test('reserving the founding rate records paid-intent, explicitly not a payment', async ({
  page,
}) => {
  const email = `e2e-reserve-${Date.now()}@cluecrew.test`;
  EMAILS.push(email);

  await page.goto('/founding?src=fb-kent');
  await page
    .locator('.fd-pricing tbody tr', { hasText: '24 months' })
    .getByRole('button', { name: 'Reserve the founding rate' })
    .click();
  const form = page.getByTestId('reserve-form');
  await expect(form.getByText('This is not a payment and nothing is owed.')).toBeVisible();
  await form.locator('input[name="name"]').fill('Test Parent');
  await form.locator('input[name="email"]').fill(email);
  await form.getByRole('button', { name: 'Reserve — not a payment' }).click();
  await page.waitForURL('**/founding/reserved');

  const row = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(row?.source).toBe('founding-reserve');
  expect(row?.reservedTier).toBe('FULL_24');
  expect(row?.name).toBe('Test Parent');
  expect(row?.src).toBe('fb-kent');
  expect(row?.confirmedAt).toBeNull();

  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  const link = await api.get(`/api/dev/waitlist-confirm-link?email=${encodeURIComponent(email)}`);
  const { url } = (await link.json()) as { url: string };
  await page.goto(url);
  await page.waitForURL('**/founding/confirmed');
  const confirmed = await prisma.waitlistSignup.findUnique({ where: { email } });
  expect(confirmed?.confirmedAt).not.toBeNull();
  await api.dispose();
});

test('§3 goals fire across the journey', async ({ page }) => {
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

  const goals = () =>
    page.evaluate(
      () => (window as never as { __plausibleGoals?: string[] }).__plausibleGoals ?? [],
    );

  await playDemo(page);
  await page.selectOption('.fd-decoder select', 'kent');
  await page.getByRole('heading', { name: 'Pricing' }).scrollIntoViewIfNeeded();

  await expect.poll(goals).toContain('demo_started');
  await expect.poll(goals).toContain('demo_completed');
  await expect.poll(goals).toContain('region_decoded');
  await expect.poll(goals).toContain('pricing_viewed');

  // founding_reserved on the reserved page; signup_started on /signup.
  await page.goto('/founding/reserved');
  await expect.poll(goals).toContain('founding_reserved');
  await page.goto('/signup');
  await expect.poll(goals).toContain('signup_started');
});

test('the privacy notice answers what §3 requires of it', async ({ page }) => {
  await page.goto('/founding/privacy');
  await expect(page.getByText('What we store')).toBeVisible();
  await expect(page.getByText('12 months after')).toBeVisible();
  await expect(page.getByText('UK and EU')).toBeVisible();
  await expect(page.getByText('cookieless')).toBeVisible();
});
