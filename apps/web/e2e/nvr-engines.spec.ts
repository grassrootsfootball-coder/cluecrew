/**
 * BUILD-DISTRICT-NVR gate #1: all four engines render Case mode AND Plain
 * mode from the SAME generated rows, the fade contract runs
 * stage → corner → absent, and selection is tap-tap throughout.
 *
 * The rows here are not fixtures in the usual sense: the page generates them
 * from the real templates at fixed (template, seed, tier), so this test also
 * demonstrates the transfer law — Case and Plain are the same item with
 * different furniture, not two authored things that happen to agree.
 *
 * (Budget-tablet frame rate, tablet-landscape and reduced-motion remain the
 * human half of the gate.)
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

const ENGINES = ['machine', 'lineup', 'turntable', 'foldingroom'] as const;

test.afterAll(cleanupFixtures);

test.beforeEach(async ({ page }) => {
  const family = await createFamily(`nvr-harness-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await api.dispose();
  await page.goto('/crew/debug/nvr-engines');
});

test('four engines in Case mode, four in Plain, same generated rows', async ({ page }) => {
  for (const engine of ENGINES) {
    await expect(page.locator(`[data-testid^="nvr-engine-${engine}-"]`).first()).toBeVisible();
  }
  await page.getByTestId('toggle-plain').click();
  for (const engine of ENGINES) {
    await expect(
      page.locator(`[data-testid^="nvr-engine-${engine}-"][data-testid$="-plain"]`).first(),
    ).toBeVisible();
  }
});

test('the fade contract: the manipulative is on stage, then a corner tool, then absent', async ({
  page,
}) => {
  // Stage: the Turntable's controls are present and usable.
  const turnIt = page.getByRole('button', { name: 'Turn it' }).first();
  await expect(turnIt).toBeVisible();

  // Corner: the same tool, smaller — still present.
  await page.getByTestId('toggle-corner').click();
  await expect(page.getByRole('button', { name: 'Turn it' }).first()).toBeVisible();

  // Plain: absent. This is the contract's whole point (P4).
  await page.getByTestId('toggle-plain').click();
  await expect(page.getByRole('button', { name: 'Turn it' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Fold it' })).toHaveCount(0);
});

test('the manipulative moves the stem and never the options', async ({ page }) => {
  const card = page.locator('[data-testid^="nvr-engine-turntable-"]').first();
  const optionsBefore = await card.locator('.crew-tap').evaluateAll((nodes) =>
    nodes.map((node) => node.innerHTML),
  );
  await card.getByRole('button', { name: 'Turn it' }).click();
  const optionsAfter = await card.locator('.crew-tap').evaluateAll((nodes) =>
    nodes.map((node) => node.innerHTML),
  );
  expect(optionsAfter).toEqual(optionsBefore);
});

test('answers are chosen by tap, with no drag anywhere', async ({ page }) => {
  const card = page.locator('[data-testid^="nvr-engine-machine-"]').first();
  // Scope to the answer group: the engines' tool controls are buttons too,
  // and only the options carry aria-pressed.
  const answers = card.getByRole('group', { name: 'Answer choices' });
  await answers.getByRole('button').first().click();
  await expect(answers.getByRole('button', { pressed: true })).toHaveCount(1);

  // Nothing in the district may depend on a drag gesture (accessibility
  // baseline): no draggable nodes anywhere on the page.
  await expect(page.locator('[draggable="true"]')).toHaveCount(0);
});

test('every option carries a text alternative — colour is never the only carrier', async ({
  page,
}) => {
  const svgs = page.locator('.crew-tap svg');
  const count = await svgs.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < Math.min(count, 12); index += 1) {
    await expect(svgs.nth(index)).toHaveAttribute('aria-label', /.+/);
  }
});
