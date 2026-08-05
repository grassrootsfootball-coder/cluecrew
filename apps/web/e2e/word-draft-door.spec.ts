/**
 * The Word review door (2026-08-02). Until the vault import there was no
 * status on a Word at all: anything written to the table was immediately
 * collectable. 183 AI-drafted cards now sit in DRAFT, and the only thing
 * between them and a child is the status filter on every child-facing query.
 * This test is that guarantee.
 */
import { expect, test } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';

const DRAFT_ID = 'zz-e2e-draft-word';
const LIVE_ID = 'zz-e2e-live-word';

test.beforeAll(async () => {
  await prisma.word.deleteMany({ where: { id: { in: [DRAFT_ID, LIVE_ID] } } });
  await prisma.word.createMany({
    data: [
      {
        id: DRAFT_ID,
        headword: 'zzdraftword',
        definitionChild: 'A card awaiting a reviewer.',
        sentence: 'This card is not approved yet.',
        tier: 1,
        status: 'DRAFT',
        authoredBy: 'ai-draft:test',
      },
      {
        id: LIVE_ID,
        headword: 'zzliveword',
        definitionChild: 'A card a reviewer approved.',
        sentence: 'This card is approved.',
        tier: 1,
        status: 'LIVE',
        authoredBy: 'ai-draft:test',
        reviewedBy: 'human:test@cluecrew.test',
      },
    ],
  });
});

test.afterAll(async () => {
  await prisma.word.deleteMany({ where: { id: { in: [DRAFT_ID, LIVE_ID] } } });
  await cleanupFixtures();
});

test('a DRAFT word never reaches a child’s vault; a LIVE one does', async ({ page }) => {
  const family = await createFamily(`worddoor-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await api.dispose();

  await page.goto('/crew/vault');

  // The vault names a card only once it is collected; uncollected ones show
  // as "N cards still out there". That count IS the observable: it must equal
  // the LIVE total, never the whole table.
  const [live, everything] = await Promise.all([
    prisma.word.count({ where: { status: 'LIVE' } }),
    prisma.word.count(),
  ]);
  expect(everything).toBeGreaterThan(live); // the DRAFT backlog exists

  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  const shown = [...text.matchAll(/(\d+|One|Two|Three|Four|Five) cards? still out there/gi)]
    .map((match) => {
      const word = match[1]!.toLowerCase();
      return { one: 1, two: 2, three: 3, four: 4, five: 5 }[word] ?? Number(word);
    })
    .reduce((sum, n) => sum + n, 0);

  expect(shown, 'the vault must offer exactly the LIVE cards').toBe(live);
  await expect(page.locator('main')).not.toContainText('zzdraftword');
});

test('the database refuses a two-sense card with no second sense', async () => {
  await expect(
    prisma.word.create({
      data: {
        id: 'zz-e2e-bad-two-sense',
        headword: 'zzbad',
        definitionChild: 'x',
        sentence: 'y',
        tier: 1,
        twoMeanings: true, // …with no senseB
      },
    }),
  ).rejects.toThrow();
});

test('every imported vault card is DRAFT and names its author', async () => {
  const imported = await prisma.word.count({ where: { authoredBy: 'ai-draft:cowork-okafor-v1' } });
  const live = await prisma.word.count({
    where: { authoredBy: 'ai-draft:cowork-okafor-v1', status: 'LIVE' },
  });
  expect(imported).toBe(183);
  expect(live).toBe(0);
});
