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

/** Matches `clueTap.itemId` in e2e/fixtures/chapters/s1-ch1.json. */
const CLUE_ITEM = 'e2e-story-clue-item';
/** Matches the `[[brave]]` marker and `seededWordIds` in the same fixture. */
const SEEDED_WORD = 'brave';

const CORRECT = 'courageous';
const DISTRACTOR = 'cautious';

test.beforeAll(async () => {
  // A LIVE item for the clue-tap. vr-04-closest-meaning is created by the seed, so the
  // questionType exists in CI; the item itself is ours.
  await prisma.itemOption.deleteMany({ where: { itemId: CLUE_ITEM } });
  await prisma.item.deleteMany({ where: { id: CLUE_ITEM } });
  await prisma.item.create({
    data: {
      id: CLUE_ITEM,
      questionTypeId: 'vr-04-closest-meaning',
      difficultyTier: 2,
      stem: { prompt: 'Which word is closest in meaning to brave?' },
      explanation: {},
      status: 'LIVE',
      authoredBy: 'e2e:story-lit',
      options: {
        create: [
          { content: { value: CORRECT }, isCorrect: true },
          { content: { value: DISTRACTOR }, isCorrect: false },
        ],
      },
    },
  });

  // The reader only renders a WordTap for a word that is LIVE in the Vault. `reviewedBy` is
  // not decoration: the DB enforces `word_live_needs_reviewer` (the Word review door), so a LIVE
  // word without a reviewer is rejected at the database. The fixture satisfies the real rule
  // rather than working around it.
  await prisma.word.upsert({
    where: { id: SEEDED_WORD },
    create: {
      id: SEEDED_WORD,
      headword: SEEDED_WORD,
      definitionChild: 'Willing to do something that frightens you.',
      sentence: 'She was brave enough to knock on the door.',
      tier: 2,
      status: 'LIVE',
      authoredBy: 'e2e:story-lit',
      reviewedBy: 'human:e2e@cluecrew.test',
    },
    update: { status: 'LIVE', reviewedBy: 'human:e2e@cluecrew.test' },
  });
});

test.afterAll(async () => {
  await prisma.itemOption.deleteMany({ where: { itemId: CLUE_ITEM } });
  await prisma.item.deleteMany({ where: { id: CLUE_ITEM } });
  await prisma.word.updateMany({ where: { id: SEEDED_WORD }, data: { status: 'DRAFT' } });
  await cleanupFixtures();
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
