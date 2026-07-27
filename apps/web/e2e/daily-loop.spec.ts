/**
 * Phase 4 gates #1 (loop end-to-end), #5 (miss path reads kindly, no red),
 * and the Plain-mode closer (#2, P4). Drives the real child app UI with a
 * fresh family so state is deterministic.
 */
import { expect, request, test, type Page } from '@playwright/test';

const PASSWORD = 'E2eCrewLoop!2026';

async function makeChildSession(page: Page): Promise<void> {
  const email = `e2e-loop-${Date.now()}@cluecrew.test`;
  const api = await request.newContext({ baseURL: 'http://localhost:3100' });
  await api.post('/api/auth/signup', { data: { email, password: PASSWORD, displayName: 'Loop Parent' } });
  const { url } = (await (
    await api.get(`/api/dev/verification-link?email=${encodeURIComponent(email)}`)
  ).json()) as { url: string };
  await api.get(url);
  await api.dispose();

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/parent');

  await page.goto('/onboarding');
  await page.fill('input[name="crewName"]', 'Robin');
  await page.getByRole('button', { name: 'Create profile' }).click();
  await page.waitForURL('**/onboarding');
  await page.selectOption('select[name="regionCode"]', 'kent');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page
    .locator('.cc-card', { hasText: '1-Year Crew' })
    .getByRole('button', { name: /Start free trial/ })
    .click();
  await page.waitForURL('**/parent');

  await page.goto('/parent/children');
  await page.getByRole('button', { name: 'Enter Crew HQ as Robin' }).click();
  await page.waitForURL('**/crew');
}

test('full Daily Loop: HQ → warm-up → case → plain closer → wind-down; miss path is kind', async ({
  page,
}) => {
  test.setTimeout(240_000);
  if (process.env.LOOP_DEBUG) {
    page.on('pageerror', (error) => console.log('PAGEERROR:', error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') console.log('CONSOLE:', message.text().slice(0, 200));
    });
  }
  await makeChildSession(page);

  await expect(page.getByText('Welcome back, Robin.')).toBeVisible();
  await expect(page.getByText(/Lantern/)).toBeVisible();
  await page.getByRole('button', { name: "Start today's loop" }).click();
  await page.waitForURL('**/crew/play');

  let sawNotYet = false;
  let sawHint = false;
  let sawPlainCloser = false;
  let sawAffirmation = false;
  let answered = 0;

  // Any single click may race a re-render (the state moved on server-side);
  // treat that as progress and re-read the page.
  async function tryClick(locator: ReturnType<Page['locator']>): Promise<void> {
    await locator.click({ timeout: 2000 }).catch(() => undefined);
  }

  let lastTick = Date.now();
  let lastBranch = 'start';
  for (let step = 0; step < 220; step++) {
    if (process.env.LOOP_DEBUG) {
      console.log(`step ${step} +${Date.now() - lastTick}ms answered=${answered} last=${lastBranch}`);
      lastTick = Date.now();
    }
    if (await page.getByText('See you tomorrow, Detective.').isVisible().catch(() => false)) break;

    // Crack ceremony → continue.
    if (await page.getByText('CASE CRACKED ✓').isVisible().catch(() => false)) {
      lastBranch = 'ceremony'; await tryClick(page.getByRole('button', { name: 'Continue' }));
      continue;
    }
    // Feedback beats.
    if (await page.locator('.crew-notyet').isVisible().catch(() => false)) {
      sawNotYet = true;
      const beat = page.locator('.crew-notyet');
      await expect(beat).toContainText('Not yet');
      if ((await beat.locator('p').count()) > 1) sawHint = true;
      lastBranch = 'try-another'; await tryClick(page.getByRole('button', { name: 'Try another?' }));
      continue;
    }
    if (await page.locator('.crew-celebrate').first().isVisible().catch(() => false)) {
      sawAffirmation = true;
      const next = page.getByRole('button', { name: 'Next clue' });
      if (await next.isVisible().catch(() => false)) {
        lastBranch = 'next-clue'; await tryClick(next);
        continue;
      }
    }
    // Word collection.
    if (await page.getByRole('button', { name: 'Add it to my Vault' }).isVisible().catch(() => false)) {
      lastBranch = 'collect'; await tryClick(page.getByRole('button', { name: 'Add it to my Vault' }));
      continue;
    }
    // Mode content (offered or forced).
    if (await page.getByRole('button', { name: 'Done — back to the case' }).isVisible().catch(() => false)) {
      lastBranch = 'mode'; await tryClick(page.getByRole('button', { name: 'Done — back to the case' }));
      continue;
    }
    // Teach-back: tap a step then a correction.
    if (await page.getByText('Your turn to teach!').isVisible().catch(() => false)) {
      await tryClick(page.locator('button', { hasText: '💭' }).first());
      await page.getByText('what should the mascot do instead?').waitFor();
      await page
        .locator('section', { hasText: 'Your turn to teach!' })
        .locator('div')
        .last()
        .locator('button')
        .first()
        .click();
      continue;
    }
    // Items: first options for a few (exercising the celebrate path), then
    // always the last option — generated items author the correct option
    // first, so this deterministically walks the miss path to the 3-miss
    // frustration break, the closer, and the wind-down.
    if (await page.locator('.crew-plain').isVisible().catch(() => false)) sawPlainCloser = true;
    const groups = page.locator('[role="group"][aria-label="Answer choices"] button');
    if ((await groups.count()) > 0) {
      const count = await groups.count();
      lastBranch = 'item'; await tryClick(groups.nth(answered < 2 ? 0 : count - 1));
      answered++;
      const confirm = page.getByRole('button', { name: "That's my answer" });
      const enabled = await expect(confirm).toBeEnabled({ timeout: 3000 }).then(() => true).catch(() => false);
      if (enabled) await tryClick(confirm);
      continue;
    }
    // Word review options are plain buttons inside the panel (never the speaker).
    const wordButtons = page.locator(
      'section.crew-panel button.crew-tap:not(.primary):not([aria-label="Hear it read aloud"])',
    );
    if ((await wordButtons.count()) > 0) {
      lastBranch = 'word-review'; await tryClick(wordButtons.first());
      continue;
    }
    // Plain closer options (ordered list buttons).
    const plainButtons = page.locator('.crew-plain button');
    if ((await plainButtons.count()) > 0) {
      lastBranch = 'plain'; await tryClick(plainButtons.first());
      const confirm = page.getByRole('button', { name: "That's my answer" });
      const enabled = await expect(confirm).toBeEnabled({ timeout: 3000 }).then(() => true).catch(() => false);
      if (enabled) await tryClick(confirm);
      continue;
    }
    lastBranch = 'idle'; await page.waitForTimeout(400);
  }

  await expect(page.getByText('See you tomorrow, Detective.')).toBeVisible();
  expect(answered).toBeGreaterThan(3);
  expect(sawPlainCloser, 'the boss closer must render in Plain mode (P4)').toBe(true);
  expect(sawNotYet || sawAffirmation, 'feedback beats must appear').toBe(true);
  if (sawNotYet) {
    expect(sawHint, 'a miss must show the authored misconception hint').toBe(true);
  }

  // D1: no red anywhere on the wind-down (or at any point we asserted coral).
  const redElements = await page.evaluate(() =>
    [...document.querySelectorAll('*')].filter((element) => {
      const color = getComputedStyle(element).backgroundColor;
      return color === 'rgb(255, 0, 0)' || color === 'rgb(220, 38, 38)';
    }).length,
  );
  expect(redElements).toBe(0);

  // Back at HQ, the vault holds today's words.
  await page.goto('/crew/vault');
  await expect(page.getByText(/words collected/)).toBeVisible();
});
