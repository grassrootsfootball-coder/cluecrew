/**
 * Phase 4 gates #1 (loop end-to-end), #5 (miss path reads kindly, no red),
 * and the Plain-mode closer (#2, P4). Drives the real child app UI with its
 * own fresh family so state is deterministic.
 */
import { expect, test, type Page } from '@playwright/test';
import { cleanupFixtures, createFamily, signInAsParent } from './fixtures';

test.afterAll(cleanupFixtures);

/**
 * Signs the parent in and hands the device over through the real "Enter Crew
 * HQ" button — the parent→child handover is part of what this test covers.
 *
 * The account and child come from the fixture rather than from walking signup
 * and onboarding. That is not only faster: it stops a change to the onboarding
 * form from breaking this test, which is about the daily loop.
 * billing-journey.spec.ts owns the signup journey and asserts on it properly.
 */
async function makeChildSession(page: Page): Promise<void> {
  const family = await createFamily('loop', { crewNames: ['Robin'] });
  await signInAsParent(page, family.email);

  await page.goto('/parent/children');
  await page.getByRole('button', { name: `Enter Crew HQ as ${family.child.crewName}` }).click();
  await page.waitForURL('**/crew');
}

test('full Daily Loop: HQ → warm-up → case → plain closer → wind-down; miss path is kind', async ({
  page,
}) => {
  // A full 15-minute loop driven click-by-click; CI runs ~5x slower than
  // local, where this takes ~55s.
  test.setTimeout(480_000);
  if (process.env.LOOP_DEBUG) {
    page.on('pageerror', (error) => console.log('PAGEERROR:', error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') console.log('CONSOLE:', message.text().slice(0, 200));
    });
  }
  await makeChildSession(page);

  await expect(page.getByRole('heading', { name: /Robin/ })).toBeVisible();
  await expect(page.getByText(/Lantern/)).toBeVisible();

  // Enter through the district map and open a NAMED case rather than tapping
  // "Start today's shift". Both are real user paths, but the shift button
  // starts on "first uncracked case" — so authoring a new case at a lower
  // orderInDistrict silently changes which mechanic this test exercises, and
  // the assertions below (miss path, plain closer) are tuned to a mechanic.
  // Pinning keeps the journey identical as content grows.
  await page.goto('/crew/case/case-vr-08');
  await page.getByRole('button', { name: 'Open the case' }).click();
  await page.waitForURL('**/crew/play');

  let sawNotYet = false;
  let sawHint = false;
  let sawPlainCloser = false;
  let sawAffirmation = false;
  let answered = 0;
  let sawTrouble = false;

  // Any single click may race a re-render (the state moved on server-side);
  // treat that as progress and re-read the page.
  async function tryClick(locator: ReturnType<Page['locator']>): Promise<void> {
    await locator.click({ timeout: 2000 }).catch(() => undefined);
  }

  let lastTick = Date.now();
  let lastBranch = 'start';
  let sawWordReview = false;
  // Steps are DOM polls, not interactions: a single warm-up item costs 2–4 of
  // them (render → answer → feedback). The budget is only a runaway guard —
  // test.setTimeout(480_000) is the real deadline — so it stays generous even
  // though this child is now created fresh and carries no review debt.
  for (let step = 0; step < 500; step++) {
    if (process.env.LOOP_DEBUG) {
      console.log(`step ${step} +${Date.now() - lastTick}ms answered=${answered} last=${lastBranch}`);
      lastTick = Date.now();
    }
    // Latch what this poll can SEE before any branch takes an action, because
    // every branch below ends in `continue`. The Plain-mode check used to sit
    // seven branches down, so a lingering "Back to the case" button starved it
    // for ~200 consecutive polls: the closer rendered, the loop never looked,
    // and the run failed at the end claiming Plain mode never appeared.
    // Latching on presence rather than visibility for the same reason — this
    // records what happened; it does not decide what to do next.
    if ((await page.locator('.crew-plain').count()) > 0) sawPlainCloser = true;

    if (await page.getByTestId('wind-down').isVisible().catch(() => false)) break;

    // A cold trail is recoverable, so recover — this loop used to burn its
    // whole budget polling a loading screen that would never resolve.
    if (await page.getByTestId('trouble').isVisible().catch(() => false)) {
      sawTrouble = true;
      lastBranch = 'trouble';
      await tryClick(page.getByRole('button', { name: 'Pick the trail up again' }));
      continue;
    }

    // Crack ceremony → continue.
    if (await page.getByTestId('case-cracked').isVisible().catch(() => false)) {
      lastBranch = 'ceremony'; await tryClick(page.getByRole('button', { name: 'Keep going' }));
      continue;
    }
    // Feedback beats.
    if (await page.locator('.crew-notyet').isVisible().catch(() => false)) {
      sawNotYet = true;
      const beat = page.locator('.crew-notyet');
      await expect(beat).toBeVisible();
      if ((await beat.locator('p').count()) > 1) sawHint = true;
      lastBranch = 'try-another'; await tryClick(page.getByTestId('try-again'));
      continue;
    }
    if (await page.locator('.crew-celebrate').first().isVisible().catch(() => false)) {
      sawAffirmation = true;
      const next = page.getByTestId('next-clue');
      if (await next.isVisible().catch(() => false)) {
        lastBranch = 'next-clue'; await tryClick(next);
        continue;
      }
    }
    // Word collection.
    if (await page.getByTestId('collect-word').isVisible().catch(() => false)) {
      lastBranch = 'collect'; await tryClick(page.getByTestId('collect-word'));
      continue;
    }
    // Mode content (offered or forced).
    if (await page.getByRole('button', { name: 'Back to the case' }).isVisible().catch(() => false)) {
      lastBranch = 'mode'; await tryClick(page.getByRole('button', { name: 'Back to the case' }));
      continue;
    }
    // Teach-back: tap a step then a correction.
    if (await page.getByText('Your turn to teach.').isVisible().catch(() => false)) {
      await tryClick(page.locator('button', { hasText: '💭' }).first());
      await page.getByText('what should I have done instead?').waitFor();
      await page
        .locator('section', { hasText: 'Your turn to teach.' })
        .locator('div')
        .last()
        .locator('button')
        .first()
        .click();
      continue;
    }
    // Items: options arrive in a per-child seeded shuffle (never authored
    // order), so answers are probabilistic: always picking the last option
    // misses ~2/3+ of the time, which reliably reaches the 3-miss frustration
    // break, the closer, and the wind-down within the step budget.
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
      lastBranch = 'word-review'; sawWordReview = true; await tryClick(wordButtons.first());
      continue;
    }
    // Plain closer options (ordered list buttons). Latch here as well as at the
    // top: the closer can render in the gap between the top-of-loop check and
    // this one, get answered here, and be replaced by its feedback before the
    // next pass — so the poll never lands on it while it is on stage. Reaching
    // this branch at all IS the closer rendering, which is what the assertion
    // is about. (The server was measured serving it 10 runs out of 10, so a
    // miss here was always the watching, never the serving.)
    const plainButtons = page.locator('.crew-plain button');
    if ((await plainButtons.count()) > 0) {
      sawPlainCloser = true;
      lastBranch = 'plain'; await tryClick(plainButtons.first());
      const confirm = page.getByRole('button', { name: "That's my answer" });
      const enabled = await expect(confirm).toBeEnabled({ timeout: 3000 }).then(() => true).catch(() => false);
      if (enabled) await tryClick(confirm);
      continue;
    }
    lastBranch = 'idle'; await page.waitForTimeout(400);
  }

  // Not an assertion: a request can legitimately fail and be recovered from.
  // But a run that needed the cold-trail path should say so rather than look
  // identical to a clean one.
  if (sawTrouble) console.log('[loop] recovered from a cold trail at least once');

  await expect(page.getByTestId('wind-down')).toBeVisible();
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

  // Back at HQ, the vault reflects what the loop actually did.
  //
  // This asserted `/in the vault/` unconditionally, which requires the loop to have taken its
  // word-review branch — and that needs LIVE vault words. Every imported card is DRAFT by design
  // (the word-draft-door spec asserts exactly that), so CI's seeded database has none and the
  // branch never runs there. The test was reporting the absence of content as a broken vault.
  //
  // Either state is correct; which one is not. So assert the page renders the state that MATCHES
  // the journey just taken.
  await page.goto('/crew/vault');
  await expect(
    page.getByText(sawWordReview ? /in the vault/ : /in the vault|Vault's bare/),
  ).toBeVisible();
});
