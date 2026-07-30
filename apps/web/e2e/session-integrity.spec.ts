/**
 * The session state's server-side guarantees, proved over the API with no
 * browser involved — the client's own tap guard must not be what is doing the
 * work here. A stale tab, a retried request or a second device is not bound by
 * anything the runner does.
 *
 *   1. a replayed Mode `complete` is refused rather than applied twice
 *   2. the session clock can never move faster than the wall clock
 *   3. an honest stay is still charged for (the fix must not run the other way)
 *   4. two overlapping writes cannot both land
 *
 * (2) is the one that matters most: D2 measures its fifteen-minute cap against
 * that clock, so a clock that can be inflated ends a child's session early.
 */
import { expect, test, type APIRequestContext } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import { cleanupFixtures, createFamily, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

interface Crew {
  api: APIRequestContext;
  session: string;
  childId: string;
}

async function crew(label: string): Promise<Crew> {
  const family = await createFamily(label);
  const api = await parentApi(family.email);
  await api.post('/api/child-session', { data: { childId: family.child.id } });
  return { api, session: `/api/crew/${family.child.id}/session`, childId: family.child.id };
}

/** Answers through the warm-up until the forced Mode screen opens the case. */
async function reachMode({ api, session }: Crew): Promise<string> {
  await api.post(session, { data: { caseId: 'case-vr-08' } });
  for (let step = 0; step < 60; step++) {
    const current = (await (await api.get(`${session}/activity`)).json()) as {
      kind: string;
      mode?: string;
      options?: Array<{ id: string }>;
    };
    if (current.kind === 'mode_content') return current.mode!;
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

/**
 * The session clock, read straight from the row. Deliberately not exposed
 * through an API: this is the number D2 enforces against, and widening a
 * child-facing endpoint just so a test can watch it would be the wrong trade.
 */
async function clockSeconds({ childId }: Crew): Promise<number> {
  const session = await prisma.session.findFirst({
    where: { childId, endedAt: null },
    orderBy: { startedAt: 'desc' },
    select: { secondsActive: true },
  });
  return session?.secondsActive ?? 0;
}

test('a replayed Mode completion is refused, not applied twice', async () => {
  const it = await crew('integrity-replay');
  const mode = await reachMode(it);

  await it.api.post(`${it.session}/mode`, { data: { mode, action: 'open', secondsElapsed: 0 } });
  const first = await it.api.post(`${it.session}/mode`, {
    data: { mode, action: 'complete', secondsElapsed: 5 },
  });
  const replay = await it.api.post(`${it.session}/mode`, {
    data: { mode, action: 'complete', secondsElapsed: 5 },
  });

  expect(first.status(), 'the real completion is accepted').toBe(200);
  expect(replay.status(), 'the same completion again is refused').toBe(409);
  await it.api.dispose();
});

test('the session clock cannot be made to outrun the wall clock', async () => {
  test.setTimeout(120_000);
  const it = await crew('integrity-clock');
  const mode = await reachMode(it);
  const before = await clockSeconds(it);

  // Twenty taps, each claiming ten seconds, as fast as they will go. Before the
  // server owned the clock this charged the child the full two hundred.
  const startedAt = Date.now();
  for (let tap = 0; tap < 20; tap++) {
    await it.api.post(`${it.session}/mode`, { data: { mode, action: 'open', secondsElapsed: 0 } });
    await it.api.post(`${it.session}/mode`, {
      data: { mode, action: 'complete', secondsElapsed: 10 },
    });
  }
  const realSeconds = Math.ceil((Date.now() - startedAt) / 1000);
  const charged = (await clockSeconds(it)) - before;

  expect(
    charged,
    `claimed 200s in ${realSeconds}s of real time but was charged ${charged}s`,
  ).toBeLessThanOrEqual(realSeconds);
  await it.api.dispose();
});

test('an honest stay on a screen is still charged for', async () => {
  test.setTimeout(120_000);
  const it = await crew('integrity-honest');
  const mode = await reachMode(it);
  const before = await clockSeconds(it);

  await new Promise((resolve) => setTimeout(resolve, 4000));
  await it.api.post(`${it.session}/mode`, { data: { mode, action: 'open', secondsElapsed: 0 } });
  await it.api.post(`${it.session}/mode`, {
    data: { mode, action: 'complete', secondsElapsed: 4 },
  });

  // The guard must not run the other way: a child who really did spend the
  // time has to be charged for it, or the 15-minute cap never arrives.
  expect(await clockSeconds(it)).toBeGreaterThan(before);
  await it.api.dispose();
});

test('two overlapping writes cannot both land', async () => {
  test.setTimeout(120_000);
  const it = await crew('integrity-race');
  await it.api.post(it.session, { data: { caseId: 'case-vr-08' } });

  let accepted = 0;
  let refused = 0;
  let pairs = 0;
  for (let round = 0; round < 10; round++) {
    const current = (await (await it.api.get(`${it.session}/activity`)).json()) as {
      kind: string;
      options?: Array<{ id: string }>;
    };
    if (!['item', 'word_review', 'word_collect'].includes(current.kind)) break;
    const data = { optionId: current.options?.[0]?.id, secondsElapsed: 3 };
    // The same answer twice at once — a double tap that outran the client.
    const both = await Promise.all([
      it.api.post(`${it.session}/answer`, { data }),
      it.api.post(`${it.session}/answer`, { data }),
    ]);
    pairs += 1;
    accepted += both.filter((response) => response.ok()).length;
    refused += both.filter((response) => !response.ok()).length;
  }

  expect(pairs, 'the loop must actually have raced something').toBeGreaterThan(0);
  expect(accepted, 'exactly one of each simultaneous pair may be accepted').toBe(pairs);
  expect(refused, 'the other must be told it lost').toBe(pairs);
  await it.api.dispose();
});
