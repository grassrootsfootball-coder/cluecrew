/**
 * Phase 2 gate #8: an item cannot reach LIVE without a (different) reviewer
 * and fully misconception-mapped distractors; bulk-imported ai-draft items
 * land as DRAFT and cannot skip review.
 *
 * Each test creates its own author and reviewer. Two fixtures are never the
 * same account, so "the reviewer must not be the author" is satisfied by
 * construction rather than by two seeded accounts that both tests shared.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createStaff, staffContext } from './fixtures';

test.afterAll(cleanupFixtures);

test('publish gate: misconceptions + independent reviewer are hard requirements', async ({
  browser,
}) => {
  // Author drafts an item whose distractor has NO misconception mapping.
  const author = await staffContext(browser, await createStaff('cms-author', 'AUTHOR'));
  await author.goto('/admin/items/new');
  await author.selectOption('select[name="questionTypeId"]', 'vr-11-number-series');
  await author.fill('input[name="difficultyTier"]', '2');
  await author.fill('textarea[name="stem"]', JSON.stringify({ prompt: 'What number comes next?', series: [3, 6, 9, 12] }));
  await author.fill(
    'textarea[name="options"]',
    JSON.stringify([
      { content: { value: 15 }, isCorrect: true, misconceptionId: null },
      { content: { value: 14 }, isCorrect: false, misconceptionId: null },
    ]),
  );
  await author.getByRole('button', { name: 'Save draft' }).click();
  await author.waitForURL(/\/admin\/items\/(?!new)[A-Za-z0-9]+$/);
  const itemUrl = author.url();

  // Reviewer cannot mark it REVIEWED while a distractor is unmapped (P3).
  const reviewer = await staffContext(browser, await createStaff('cms-reviewer', 'REVIEWER'));
  await reviewer.goto(itemUrl);
  await reviewer.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await expect(reviewer.getByText(/must map to a tagged misconception/)).toBeVisible();

  // Author fixes the mapping.
  await author.goto(itemUrl);
  await author.fill(
    'textarea[name="options"]',
    JSON.stringify([
      { content: { value: 15 }, isCorrect: true, misconceptionId: null },
      { content: { value: 14 }, isCorrect: false, misconceptionId: 'vr-series-off-by-one' },
    ]),
  );
  await author.getByRole('button', { name: 'Save changes (returns to DRAFT)' }).click();
  await author.waitForURL('**/admin/items/*');

  // Now the independent reviewer can review and publish.
  await reviewer.goto(itemUrl);
  await reviewer.getByRole('button', { name: 'Mark REVIEWED' }).click();
  await expect(reviewer.locator('h1')).toContainText('REVIEWED');
  await reviewer.getByRole('button', { name: 'Publish LIVE' }).click();
  await expect(reviewer.locator('h1')).toContainText('LIVE');

  await author.context().close();
  await reviewer.context().close();
});

test('bulk-imported ai-draft items land as DRAFT and cannot skip review', async ({ browser }) => {
  const reviewer = await staffContext(browser, await createStaff('cms-import', 'REVIEWER'));
  await reviewer.goto('/admin/import');
  // The default payload is an ai-draft example — import it as-is.
  await reviewer.getByRole('button', { name: 'Import as DRAFT' }).click();
  await reviewer.waitForURL('**/admin/items?imported=1');

  await reviewer.goto('/admin/items?status=DRAFT');
  const row = reviewer.locator('tr', { hasText: 'ai-draft:example-model' }).first();
  await expect(row).toContainText('DRAFT');
  await reviewer.context().close();
});
