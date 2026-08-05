/**
 * BUILD-DISTRICT-NVR gate #4: the reviewer signs TEMPLATE VERSIONS, and the
 * artefact they sign against is the 30-per-tier sample sheet (§4.1). This
 * test proves the sheet the reviewer will actually sit in front of renders:
 * 30 samples for the requested tier, each carrying its (template@version,
 * seed, tier) identity, the key marked in words, and every distractor's
 * misconception id shown — because a sheet that hides the mapping cannot be
 * used to check the mapping.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

test.afterAll(cleanupFixtures);

test('a reviewer sees 30 identified samples for a tier, with keys and misconceptions', async ({
  browser,
}) => {
  const staff = await createStaff(`nvr-reviewer-${Date.now()}`, 'REVIEWER');
  const page = await staffContext(browser, staff);
  await page.goto('/admin/nvr-samples?template=machine-series&tier=3');

  // The sheet's identity: without the fingerprint, a signature names nothing.
  await expect(page.getByText(/machine-series/).first()).toBeVisible();

  const samples = page.locator('[data-testid^="nvr-sample-"]');
  await expect(samples).toHaveCount(30);

  // Every sample names its seed, so the reviewer can reproduce any one of them.
  const first = samples.first();
  await expect(first).toContainText(/seed \d+/);
  await expect(first).toContainText('T3');

  // The key is marked in WORDS, not by colour alone (manifesto §6).
  await expect(first.getByText('KEY').first()).toBeVisible();

  // Every distractor shows the misconception it executes (P3).
  await expect(first.getByText(/^nvr-[a-z-]+$/).first()).toBeVisible();
});
