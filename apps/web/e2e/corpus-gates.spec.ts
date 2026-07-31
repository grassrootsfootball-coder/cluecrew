/**
 * ADDENDUM-E gates 1 and 3, demonstrated through the running CMS:
 *
 *   - a SIMILARITY_REVIEW flag blocks REVIEWED until a reviewer clears it
 *     with a note, and the clearance is logged;
 *   - a corpus-proposed misconception is unusable by items until approved,
 *     and the import → queue → approval → usable loop works end to end.
 *
 * Everything created here carries fixture provenance for the sweep; the
 * misconception is removed explicitly (it has no cascade).
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

const PROPOSED_ID = 'e2e-corpus-proposed-misconception';

test.afterAll(async () => {
  await prisma.misconception.deleteMany({ where: { id: PROPOSED_ID } });
  await cleanupFixtures();
});

test('a similarity-flagged item cannot be REVIEWED until cleared with a note', async ({
  browser,
}) => {
  const author = await createStaff('corpus-author', 'AUTHOR');
  const reviewer = await createStaff('corpus-reviewer', 'REVIEWER');

  // A DRAFT the gate flagged on import (the flag is what is under test here;
  // the scoring itself is unit-tested in core).
  const item = await prisma.item.create({
    data: {
      questionTypeId: 'vr-11-number-series',
      difficultyTier: 2,
      stem: { prompt: 'Which number continues the pattern?', series: [4, 8, 12, 16] },
      explanation: {},
      status: 'DRAFT',
      authoredBy: `human:${author.email}`,
      similarityFlaggedAt: new Date(),
      similarityScore: 0.71,
      options: {
        create: [
          { content: { value: 20 }, isCorrect: true },
          { content: { value: 18 }, isCorrect: false, misconceptionId: 'vr-series-off-by-one' },
        ],
      },
    },
  });

  const page = await staffContext(browser, reviewer);
  await page.goto(`/admin/items/${item.id}`);
  await expect(page.getByTestId('similarity-flag')).toBeVisible();
  // The banner must never echo matched source text — it has none to echo, but
  // assert the visible copy is scores-and-ids only.
  await expect(page.getByTestId('similarity-flag')).toContainText('0.710');

  // Blocked from REVIEWED while flagged and uncleared.
  await page.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await expect(page.getByText(/similarity gate flagged this item/)).toBeVisible();

  // The false-positive escape: clearance with a reason, logged.
  await page
    .locator('[data-testid="similarity-flag"] input[name="note"]')
    .fill('Coincidence: standard 4-times-table series, no distinctive framing.');
  await page.getByRole('button', { name: 'Clear the flag (logged)' }).click();
  await expect(page.getByText(/Cleared by human:/)).toBeVisible();

  await page.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await expect(page.locator('h1')).toContainText('REVIEWED');

  const audit = await prisma.adminAuditLog.findFirst({
    where: { action: 'item.similarity_clear', targetId: item.id },
  });
  expect(audit).toBeTruthy();
  await page.context().close();
});

test('a PROPOSED misconception is unusable until approved; the import → approval loop works', async ({
  browser,
}) => {
  const reviewer = await createStaff('corpus-approver', 'REVIEWER');
  const author = await createStaff('corpus-author2', 'AUTHOR');

  // Import through the real artefact contract (Addendum E §2).
  const reviewerPage = await staffContext(browser, reviewer);
  await reviewerPage.goto('/admin/misconceptions');
  await reviewerPage.locator('textarea[name="payload"]').fill(
    JSON.stringify([
      {
        id: PROPOSED_ID,
        district: 'VR',
        description: 'Child mirrors the series instead of continuing it, reading right to left.',
        childHint: 'Read the trail left to right. The jumps point forwards.',
        sourcePattern: 'corpus-pattern-e2e-1',
        proposedBy: 'ai-corpus:v1',
        approvedBy: null,
      },
    ]),
  );
  await reviewerPage.getByRole('button', { name: 'Import as PROPOSED' }).click();
  await expect(reviewerPage.getByTestId(`proposed-${PROPOSED_ID}`)).toBeVisible();

  // Un-approved: an item referencing it is rejected server-side.
  const authorPage = await staffContext(browser, author);
  const draftItem = async () => {
    await authorPage.goto('/admin/items/new');
    await authorPage.selectOption('select[name="questionTypeId"]', 'vr-11-number-series');
    await authorPage.fill('input[name="difficultyTier"]', '2');
    await authorPage.fill(
      'textarea[name="stem"]',
      JSON.stringify({ prompt: 'What comes next?', series: [2, 4, 6, 8] }),
    );
    await authorPage.fill(
      'textarea[name="options"]',
      JSON.stringify([
        { content: { value: 10 }, isCorrect: true, misconceptionId: null },
        { content: { value: 6 }, isCorrect: false, misconceptionId: PROPOSED_ID },
      ]),
    );
    await authorPage.getByRole('button', { name: 'Save draft' }).click();
  };

  await draftItem();
  await expect(authorPage.getByText(/still PROPOSED/)).toBeVisible();

  // Approval activates (named, logged) — and the same item now saves.
  await reviewerPage
    .getByTestId(`proposed-${PROPOSED_ID}`)
    .getByRole('button', { name: 'Approve — activates' })
    .click();
  await expect(reviewerPage.getByTestId('proposed-queue')).not.toBeVisible();

  await draftItem();
  await authorPage.waitForURL(/\/admin\/items\/(?!new)[A-Za-z0-9]+$/);

  const approved = await prisma.misconception.findUniqueOrThrow({ where: { id: PROPOSED_ID } });
  expect(approved.status).toBe('ACTIVE');
  expect(approved.approvedBy).toContain('human:');

  await reviewerPage.context().close();
  await authorPage.context().close();
});
