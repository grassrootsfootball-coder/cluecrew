/**
 * The Mode screen's "Back to the case" tap (Addendum A §2.2, the 100ms rule).
 *
 * Leaving this screen costs two POSTs and a GET — about a second — during
 * which the button used to look untouched. A child taps again, and each extra
 * tap posted `open` + `complete` afresh: duplicate mode_opened/mode_completed
 * events, and a session clock that ran ahead of the real world because
 * secondsElapsed is time-since-the-screen-appeared and is tick()ed in every
 * time. That clock is what D2's fifteen-minute cap is measured against, so
 * tapping was shortening the session.
 */
import { expect, test, type APIRequestContext } from '@playwright/test';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

/** Answers through the warm-up until the forced Mode screen opens the case. */
async function walkToModeScreen(api: APIRequestContext, childId: string): Promise<void> {
  const session = `/api/crew/${childId}/session`;
  await api.post(session, { data: { caseId: 'case-vr-08' } });
  for (let step = 0; step < 60; step++) {
    const current = (await (await api.get(`${session}/activity`)).json()) as {
      kind: string;
      options?: Array<{ id: string }>;
    };
    if (current.kind === 'mode_content') return;
    if (current.kind === 'item' || current.kind === 'word_review') {
      await api.post(`${session}/answer`, {
        data: { optionId: current.options?.[0]?.id, secondsElapsed: 4 },
      });
    } else if (current.kind === 'word_collect') {
      await api.post(`${session}/answer`, { data: { secondsElapsed: 3 } });
    } else break;
  }
  throw new Error('never reached the Mode screen');
}

test('the Mode screen answers a tap at once and cannot be double-posted', async ({ page }) => {
  test.setTimeout(120_000);
  const family = await createFamily('mode-screen');
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await walkToModeScreen(api, family.child.id);
  await api.dispose();

  const modePosts: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/session/mode')) modePosts.push(String(request.postData()));
  });

  await page.goto('/crew/play');
  const back = page.getByRole('button', { name: /Back to the case|On our way back/ });
  await back.waitFor();
  await expect(back).toHaveText('Back to the case');

  // Tap, then tap twice more while the round trip is still in the air.
  await back.click();
  await expect(back).toHaveAttribute('aria-busy', 'true', { timeout: 100 });
  await expect(back).toHaveText('On our way back…');
  await back.click({ timeout: 800 }).catch(() => undefined);
  await page.waitForTimeout(150);
  await back.click({ timeout: 800 }).catch(() => undefined);
  await page.waitForTimeout(2000);

  // One tap's worth of traffic: open, then complete. Not three taps' worth.
  expect(modePosts, `three fast taps must post once: ${modePosts.join(' | ')}`).toHaveLength(2);
  expect(modePosts[0]).toContain('"action":"open"');
  expect(modePosts[1]).toContain('"action":"complete"');
});
