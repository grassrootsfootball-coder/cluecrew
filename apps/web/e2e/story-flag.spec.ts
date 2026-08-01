/**
 * STORY BIBLE v1.2 §9: everything ships DARK behind the story flag. With
 * STORY_MODE unset (this suite's environment), the reader does not exist,
 * the shelf is absent, and the story APIs answer 404 — a child cannot tell
 * the infrastructure is there, which is the whole point of a feature flag
 * on a child-facing surface.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

test('flag off: no reader, no shelf, no story APIs', async ({ page }) => {
  const family = await createFamily(`story-dark-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);

  // The crew layout streams, so the shell commits 200 before notFound()
  // throws (the locked-case spec handles the same convention): the honest
  // assertion is the BODY — the 404 surface, and no story content at all.
  await page.goto('/crew/story/s1-ch1');
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByText('The Borrowed Coat')).toHaveCount(0);
  await expect(page.locator('.crew-story-body')).toHaveCount(0);

  await page.goto('/crew/casefile');
  await expect(page.getByTestId('chapter-shelf')).toHaveCount(0);

  const collect = await api.post(`/api/story/${family.child.id}/collect-word`, {
    data: { wordId: 'peculiar' },
  });
  expect(collect.status()).toBe(404);
  const clueTap = await api.get(`/api/story/${family.child.id}/clue-tap/any-item`);
  expect(clueTap.status()).toBe(404);

  // The mock flow keeps its plain, pre-Board voice.
  await page.goto('/crew/mock');
  await expect(page.getByText('No paper on the desk today.')).toBeVisible();
  await api.dispose();
});
