/**
 * STORY MODE WITH THE FLAG ON — the half that had never been exercised.
 *
 * `story-flag.spec.ts` proves the surface is DARK with STORY_MODE unset: no reader, no shelf,
 * story APIs 404. That is the easier half, and until now it was the only half. Every piece of the
 * lit path — the shelf filter, the chapter loader, the reader's [[word]] substitution, the
 * clue-tap fetch and its local grading — had shipped without a single test rendering it.
 *
 * Runs under `playwright.story.config.ts`, which is the only place STORY_MODE=on is set. It has
 * its own server on its own port, because a suite cannot prove both the dark and the lit path
 * against one process.
 *
 * BUILDS ITS OWN DATA, like every other fixture here. A fresh CI database has NO live content:
 * the seed and `content:generate` both write DRAFT, so anything asserting on a LIVE item or a
 * tappable word has to create it. This spec makes one LIVE item and one LIVE word, and removes
 * both afterwards.
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';
import { assertServerEnv } from '../playwright.story.config';

/**
 * THE SEEDED FIXTURES — read, never written. Both rows are created by the seed
 * (`seedE2eFixtures`), live permanently, and are asserted against by id. This spec creates
 * nothing and mutates nothing, which is the point of their existing: it previously reached for
 * `brave`, a real vault card, and its teardown demoted live content. Caught only because someone
 * noticed a LIVE-word count move (David, 2026-08-12).
 */
const CLUE_ITEM = 'zz-e2e-fixture-item';
/** The fixture word's HEADWORD — what `[[lantern]]` in the chapter body resolves against. */
const SEEDED_WORD = 'lantern';

const CORRECT = 'courageous';
const DISTRACTOR = 'cautious';

test.afterAll(cleanupFixtures);

/** Same reason as the gated spec: prove the adopted server is the one this suite configured. */
test.beforeAll(async () => {
  await assertServerEnv(`http://localhost:${process.env.E2E_PORT ?? 3101}`, process.env.APP_ENV ?? 'dev');
});

test('flag on: the shelf lists the chapter, the reader renders it, and the clue-tap answers', async ({
  page,
}) => {
  const family = await createFamily(`story-lit-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);

  // --- The shelf (Law 3: opt-in, never gating) ------------------------------
  await page.goto('/crew/casefile');
  const shelf = page.getByTestId('chapter-shelf');
  await expect(shelf).toBeVisible();
  await expect(shelf.getByRole('link', { name: 'The Test Chapter' })).toBeVisible();

  // --- The reader -----------------------------------------------------------
  await shelf.getByRole('link', { name: 'The Test Chapter' }).click();
  await expect(page).toHaveURL(/\/crew\/story\/s1-ch1$/);
  await expect(page.getByRole('heading', { name: 'The Test Chapter' })).toBeVisible();
  await expect(page.locator('.crew-story-body')).toContainText('The office was quiet.');

  // Law 4: a released chapter carries narration, and the reader offers it.
  await expect(page.locator('audio.crew-story-audio')).toHaveCount(1);

  // Law 5: the [[brave]] marker resolved to a tappable word rather than leaking its brackets.
  await expect(page.locator('.crew-story-body')).not.toContainText('[[');
  await expect(page.getByRole('button', { name: SEEDED_WORD })).toBeVisible();

  // --- The clue-tap (Real-Puzzle Law: a REAL item, no stakes) ---------------
  await page.getByRole('button', { name: /closest in meaning/ }).click();
  const clue = page.getByRole('group', { name: 'A clue to try' });
  await expect(clue).toBeVisible();
  await expect(clue).toContainText('Which word is closest in meaning to brave?');

  // A wrong pick invites another look and does not lock the beat.
  await clue.getByRole('button', { name: DISTRACTOR }).click();
  await expect(clue).toContainText('Not yet');

  // The right one resolves it.
  await clue.getByRole('button', { name: CORRECT }).click();
  await expect(clue).toContainText('There it is.');

  // NOTHING IS RECORDED. The clue-tap is a taste, not assessment — no attempt row,
  // ever, which is the property most likely to be broken by a well-meaning refactor.
  const attempts = await prisma.attempt.count({ where: { itemId: CLUE_ITEM } });
  expect(attempts, 'the clue-tap must never record an attempt').toBe(0);
});
