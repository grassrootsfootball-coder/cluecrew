/**
 * The Word review door (2026-08-02). Until the vault import there was no
 * status on a Word at all: anything written to the table was immediately
 * collectable. The import's cards landed in DRAFT, and the only thing between
 * a DRAFT card and a child is the status filter on every child-facing query.
 * This test is that guarantee (counts are printed by the run, never written here: R180).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/**
 * WHO MAY SERVE A CARD (R1051). This test used to assert that an imported card is NEVER LIVE. That was
 * a proxy, written when no imported card had been reviewed, and it went stale the first time the door
 * above did its job (R1045 and R1047 published 11 imported cards through reviewed doors). The RULE is
 * the header's: nothing an agent drafted reaches a child unless a reviewer approved it, and the
 * evidence is the reviewed ACT, never a name in a field (R94, R203). So, over EVERY LIVE card except
 * this spec's own two fixtures (excluded by id, never by prefix):
 *   · `seed` is a CLAIM CHECKED AGAINST WHAT THE SEED WRITES: the ids in content/words/words.json plus
 *     the seed's one e2e fixture word. A card labelled `seed` that the seed does not write fails, so a
 *     mislabel cannot escape both the CHECK (which exempts `seed`) and this test;
 *   · `ai-draft:` and `agent:` are agent-authored. Any other author, null included, fails;
 *   · an agent-authored card must carry `reviewedBy: reviewer:<id>`, and there must be an APPROVED
 *     word event under that same Reviewer row, by an actor with no AUTHORED or AMENDED event on the
 *     card, and no later than the card's last AUTHORED or AMENDED event (an approval must cover the
 *     version that serves). A person's name over a machine approval is exactly what R94 forbids,
 *     so a non-`reviewer:` value never passes;
 *   · or it is a NAMED exception: published before landers wrote events, keyed by id, carrying its
 *     sign-off digest in `reviewNotes`, and cited in the register entry it names.
 * The canary test below proves each clause still fires.
 */
const DECLARED_EXCEPTIONS: Array<{ id: string; digest: string; register: string }> = [
  // Published 2026-08-22 by scripts/run-idiom-containment.ts on Annie's ninety-ninth return.
  { id: 'gave-a-disgust', digest: 'cb80fc2f', register: 'R1051' },
];
/** packages/db/prisma/seed.ts `E2E_FIXTURE_WORD_ID`: the seed's own fixture card, written as `seed`. */
const SEED_FIXTURE_WORD_ID = 'zz-e2e-fixture-word';
const CONTENT = join(__dirname, '..', '..', '..');

type Db = Pick<typeof prisma, 'word' | 'attributionEvent' | 'reviewer'>;

async function servingDoorFaults(db: Db): Promise<{ screened: number; seed: number; agentAuthored: number; faults: string[] }> {
  const live = await db.word.findMany({
    where: { status: 'LIVE', id: { notIn: [DRAFT_ID, LIVE_ID] } },
    select: { id: true, authoredBy: true, reviewedBy: true, reviewNotes: true },
  });
  const seedIds = new Set([
    ...(JSON.parse(readFileSync(join(CONTENT, 'content', 'words', 'words.json'), 'utf8')) as { words: Array<{ id: string }> }).words.map((w) => w.id),
    SEED_FIXTURE_WORD_ID,
  ]);
  const isAgent = (a: string | null) => !!a && (a.startsWith('ai-draft:') || a.startsWith('agent:'));
  const agent = live.filter((w) => isAgent(w.authoredBy));
  const events = await db.attributionEvent.findMany({
    where: { recordType: 'word', recordId: { in: agent.map((w) => w.id) } },
    select: { recordId: true, action: true, actor: true, reviewerId: true, at: true },
  });
  const reviewers = new Set((await db.reviewer.findMany({ select: { id: true } })).map((r) => r.id));
  const register = readFileSync(join(CONTENT, 'docs', 'authoring-calibration-log.md'), 'utf8');
  const faults: string[] = [];
  let seed = 0;
  for (const w of live) {
    if (w.authoredBy === 'seed') {
      seed += 1;
      if (!seedIds.has(w.id)) faults.push(`${w.id}: labelled seed, but the seed does not write it`);
    } else if (!isAgent(w.authoredBy)) faults.push(`${w.id}: LIVE with an undeclared author (${w.authoredBy ?? 'null'})`);
  }
  for (const w of agent) {
    const mine = events.filter((e) => e.recordId === w.id);
    const edits = mine.filter((e) => e.action === 'AUTHORED' || e.action === 'AMENDED');
    const drafters = new Set(edits.map((e) => e.actor));
    const lastEdit = Math.max(0, ...edits.map((e) => e.at.getTime()));
    const machine = w.reviewedBy?.startsWith('reviewer:') ? w.reviewedBy.slice('reviewer:'.length) : null;
    const ok = machine !== null && mine.some((e) => e.action === 'APPROVED' && e.reviewerId === machine && reviewers.has(machine) && !drafters.has(e.actor) && e.at.getTime() >= lastEdit);
    if (ok) continue;
    const ex = DECLARED_EXCEPTIONS.find((x) => x.id === w.id);
    if (ex) {
      const section = register.split(/^## /m).find((s) => s.startsWith(`${ex.register} `)) ?? '';
      if (!w.reviewNotes?.includes(ex.digest)) faults.push(`${w.id}: declared exception, but reviewNotes no longer carries digest ${ex.digest}`);
      if (!section.includes(ex.id)) faults.push(`${w.id}: declared exception, but register ${ex.register} does not cite it`);
      continue;
    }
    faults.push(`${w.id}: agent-authored and LIVE, but no APPROVED event by reviewer:<id> that matches reviewedBy ("${w.reviewedBy}"), comes from an actor other than its drafter, and covers its latest edit`);
  }
  return { screened: live.length, seed, agentAuthored: agent.length, faults };
}

test('every LIVE card has a declared author, and no agent-drafted card serves without a reviewed act', async () => {
  const { screened, seed, agentAuthored, faults } = await servingDoorFaults(prisma);
  // R60: the population is printed, and an empty one is not a pass.
  console.log(`word serving door: ${screened} LIVE card(s) screened — ${seed} seed, ${agentAuthored} agent-authored`);
  expect(screened, 'no LIVE cards: a blind run, not a pass').toBeGreaterThan(0);
  expect(faults).toEqual([]);
});

test('the serving-door check still fires on each clause (canaries, rolled back)', async () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date('2026-01-02T00:00:00Z');
  const result = await prisma
    .$transaction(async (tx) => {
      const card = (id: string, authoredBy: string | null, reviewedBy: string) => ({
        id, headword: id, definitionChild: 'a canary card', sentence: 'A canary card.', tier: 1, status: 'LIVE' as const, authoredBy, reviewedBy,
      });
      await tx.word.createMany({ data: [
        card('zz-canary-bare-name', 'ai-draft:test', 'human:someone@cluecrew.test'),
        card('zz-canary-machine-no-event', 'agent:drafter', 'reviewer:rev-agent-01'),
        card('zz-canary-self-approved', 'agent:drafter', 'reviewer:rev-agent-01'),
        card('zz-canary-undeclared', 'mystery', 'human:someone@cluecrew.test'),
        card('zz-canary-name-over-machine', 'agent:drafter', 'Annie'),
        card('zz-canary-stale-approval', 'agent:drafter', 'reviewer:rev-agent-01'),
        card('zz-canary-false-seed', 'seed', 'human:someone@cluecrew.test'),
      ] });
      const ev = (recordId: string, action: 'AUTHORED' | 'AMENDED' | 'APPROVED', actor: string, at: Date) =>
        ({ recordType: 'word', recordId, action, actor, reviewerId: 'rev-agent-01', recordedBy: 'e2e', at });
      await tx.attributionEvent.createMany({ data: [
        ev('zz-canary-self-approved', 'AUTHORED', 'agent-x', t0), ev('zz-canary-self-approved', 'APPROVED', 'agent-x', t0),
        ev('zz-canary-name-over-machine', 'AUTHORED', 'agent-drafter', t0), ev('zz-canary-name-over-machine', 'APPROVED', 'agent-reviewer', t0),
        ev('zz-canary-stale-approval', 'APPROVED', 'agent-reviewer', t0), ev('zz-canary-stale-approval', 'AMENDED', 'agent-drafter', t1),
      ] });
      // The exception's own clause: strip the digest from the declared exception, inside the rollback.
      await tx.word.update({ where: { id: 'gave-a-disgust' }, data: { reviewNotes: 'digest removed by the canary' } });
      const out = await servingDoorFaults(tx);
      throw Object.assign(new Error('ROLLBACK'), { out });
    })
    .catch((e: Error & { out?: Awaited<ReturnType<typeof servingDoorFaults>> }) => {
      if (e.message !== 'ROLLBACK') throw e;
      return e.out!;
    });
  for (const id of ['zz-canary-bare-name', 'zz-canary-machine-no-event', 'zz-canary-self-approved', 'zz-canary-undeclared',
    'zz-canary-name-over-machine', 'zz-canary-stale-approval', 'zz-canary-false-seed']) {
    expect(result.faults.some((f) => f.startsWith(`${id}:`)), `canary ${id} must be caught`).toBe(true);
  }
  expect(result.faults.some((f) => f.startsWith('gave-a-disgust: declared exception, but reviewNotes')), 'the exception digest clause must fire').toBe(true);
  expect(await prisma.word.count({ where: { id: { startsWith: 'zz-canary-' } } })).toBe(0);
  expect((await prisma.word.findUniqueOrThrow({ where: { id: 'gave-a-disgust' } })).reviewNotes).toContain('cb80fc2f');
});
