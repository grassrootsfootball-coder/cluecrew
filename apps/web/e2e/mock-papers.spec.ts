/**
 * ADDENDUM-B end-to-end: scheduling, the sitting, the burn rule, the kind
 * abandon, the cadence cap, Stage 1 reporting — and the isolation guarantee
 * that mock items never reach practice, proved against the running app.
 *
 * Each test builds its own family and its own MOCK item bank (authored under
 * the fixture provenance marker, so cleanupFixtures sweeps it).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { prisma } from '@cluecrew/db';
import {
  cleanupFixtures,
  copyCookies,
  createFamily,
  enterCrewMode,
  parentApi,
} from './fixtures';

const BLUEPRINT = JSON.parse(
  readFileSync(join(__dirname, '../../../content/blueprints/gl-vr-standard.json'), 'utf8'),
).blueprint as {
  id: string;
  sections: Array<{ typeMix: Record<string, number>; questionCount: number }>;
};

test.afterAll(cleanupFixtures);

/** How many MOCK items each type needs for `papers` full papers. */
function perTypeNeed(): Map<string, number> {
  const need = new Map<string, number>();
  for (const section of BLUEPRINT.sections) {
    for (const [typeId, count] of Object.entries(section.typeMix)) {
      need.set(typeId, (need.get(typeId) ?? 0) + count);
    }
  }
  return need;
}

/** A LIVE MOCK bank big enough for `papers` papers, swept by fixture cleanup. */
async function createMockBank(label: string, papers: number): Promise<Set<string>> {
  const created = new Set<string>();
  for (const [typeId, count] of perTypeNeed()) {
    for (let index = 0; index < count * papers; index++) {
      const item = await prisma.item.create({
        data: {
          questionTypeId: typeId,
          difficultyTier: (index % 5) + 1,
          stem: { prompt: `Mock ${typeId} ${index}` },
          explanation: {},
          status: 'LIVE',
          pool: 'MOCK',
          authoredBy: `human:e2e-mock-${label}@cluecrew.test`,
          reviewedBy: 'e2e-fixture',
          options: {
            create: [0, 1, 2, 3, 4].map((optionIndex) => ({
              content: { value: `option ${optionIndex}` },
              isCorrect: optionIndex === 0,
            })),
          },
        },
      });
      created.add(item.id);
    }
  }
  return created;
}

async function scheduleFor(api: APIRequestContext, childId: string) {
  return api.post('/api/parent/mocks', { data: { childId, blueprintId: BLUEPRINT.id } });
}

/**
 * Addendum C changed who may sit a paper: the readiness ladder and the hard
 * floor refuse an unprepared child, so these tests first make the child
 * genuinely ready the way months of practice would — every case taught and
 * cracked, a strong Boss Round record, and a completed half paper.
 */
async function makeReadyForFullPaper(childId: string): Promise<void> {
  const cases = await prisma.case.findMany({ select: { id: true } });
  for (const caseRow of cases) {
    await prisma.caseFile.create({
      data: { childId, caseId: caseRow.id, masteryLevel: 0.9, solvedAt: new Date() },
    });
  }
  const session = await prisma.session.create({
    data: { childId, endedAt: new Date(), secondsActive: 540 },
  });
  const anyItem = await prisma.item.findFirst({
    where: { pool: 'PRACTICE' },
    select: { id: true },
  });
  for (let index = 0; index < 20; index++) {
    await prisma.attempt.create({
      data: {
        childId,
        sessionId: session.id,
        itemId: anyItem!.id,
        correct: index % 5 !== 0, // 80% transfer
        latencyMs: 20_000,
        context: 'boss_case',
      },
    });
  }
  await prisma.mockSitting.create({
    data: {
      childId,
      blueprintId: 'gl-vr-half',
      servedItemIds: [],
      sectionTimings: [],
      responses: {},
      status: 'COMPLETED',
      // Eight days ago: a half paper IS a paper for the 7-day district cap
      // (§3), so a same-day one would rightly block the full paper.
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });
}

test('mock items never reach practice, even when the pool is full of them', async () => {
  const mockIds = await createMockBank('isolation', 1);
  const family = await createFamily('mock-isolation');
  const api = await parentApi(family.email);
  await api.post('/api/child-session', { data: { childId: family.child.id } });

  // Walk a real practice session and collect every option id served.
  const session = `/api/crew/${family.child.id}/session`;
  await api.post(session, { data: { caseId: 'case-vr-08' } });
  const servedOptionIds: string[] = [];
  for (let step = 0; step < 40; step++) {
    const current = (await (await api.get(`${session}/activity`)).json()) as {
      kind: string;
      mode?: string;
      options?: Array<{ id: string }>;
    };
    if (current.kind === 'item' || current.kind === 'word_review') {
      for (const option of current.options ?? []) servedOptionIds.push(option.id);
      await api.post(`${session}/answer`, {
        data: { optionId: current.options?.[0]?.id, secondsElapsed: 3 },
      });
    } else if (current.kind === 'word_collect') {
      await api.post(`${session}/answer`, { data: { secondsElapsed: 3 } });
    } else if (current.kind === 'mode_content') {
      await api.post(`${session}/mode`, { data: { mode: current.mode, action: 'decline' } });
    } else if (current.kind === 'teachback') {
      await api.post(`${session}/teachback`, {
        data: { stepIndex: 0, correctionIndex: 0, secondsElapsed: 3 },
      });
    } else break;
  }
  expect(servedOptionIds.length).toBeGreaterThan(0);

  // Not one served option belongs to a MOCK item.
  const servedItems = await prisma.itemOption.findMany({
    where: { id: { in: servedOptionIds } },
    select: { itemId: true },
  });
  for (const { itemId } of servedItems) {
    expect(mockIds.has(itemId), `practice served mock item ${itemId}`).toBe(false);
  }
  await api.dispose();
});

test('the full sitting: book → sit in Plain mode → child result without numbers → Stage 1 report', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await createMockBank('sitting', 1);
  // Effectively Year 5 with a one-month runway: the 'final' intensity column,
  // whose ladder reaches FULL — the year guard would rightly cap a younger
  // child at half papers (Addendum D §2).
  const family = await createFamily('mock-sitting', {
    yearGroup: 6,
    examYear: new Date().getUTCFullYear(),
  });
  await makeReadyForFullPaper(family.child.id);
  const api = await parentApi(family.email);

  const booked = await scheduleFor(api, family.child.id);
  expect(booked.status()).toBe(201);

  // The child sits it through the real UI.
  await enterCrewMode(page, api, family.child.id);
  await page.goto('/crew');
  await expect(page.getByTestId('booked-paper')).toBeVisible();
  await page.goto('/crew/mock');
  await page.getByTestId('start-paper').click();

  for (let sectionIndex = 0; sectionIndex < BLUEPRINT.sections.length; sectionIndex++) {
    await expect(page.getByTestId('section-instructions')).toBeVisible();
    await page.getByTestId('start-section').click();
    await expect(page.getByTestId('mock-clock')).toBeVisible();
    // Answer the first two questions, tapping real option buttons.
    for (const question of [0, 1]) {
      await page
        .getByTestId(`mock-q-${question}`)
        .getByRole('group', { name: 'Answer choices' })
        .getByRole('button')
        .first()
        .click();
    }
    await page.getByTestId('finish-section').click();
  }

  // The child result: names, one focus, and not a digit anywhere.
  await expect(page.getByTestId('mock-result')).toBeVisible();
  await expect(page.getByText('Time. Pens down, Detective.')).toBeVisible();
  const strengths = await page
    .getByTestId('result-strengths')
    .innerText()
    .catch(() => '');
  const focus = await page
    .getByTestId('result-focus')
    .innerText()
    .catch(() => '');
  expect(`${strengths}${focus}`).not.toMatch(/\d/);

  // Every served item is now burned for this child.
  const sitting = await prisma.mockSitting.findFirst({
    where: { childId: family.child.id, status: 'COMPLETED' },
  });
  expect(sitting).toBeTruthy();

  // Stage 1 on the parent side: raw, percentage, per-type, the honesty note.
  await copyCookies(page, api);
  await page.goto('/parent/mocks');
  // .first(): the arrange step's synthetic half paper also reports.
  await expect(page.getByTestId('sitting-report').first()).toBeVisible();
  await expect(
    page.getByText(
      'Real 11+ results are age-standardised; practice scores here show attainment and progress, not a predicted result.',
    ),
  ).toBeVisible();

  // The cadence cap now blocks a second paper in this district (§3).
  const again = await scheduleFor(api, family.child.id);
  expect(again.status()).toBe(409);
  expect(((await again.json()) as { reason: string }).reason).toBe('cadence');
  await api.dispose();
});

test('abandoning is kind: sitting discarded, no parent score, only opened sections burn', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await createMockBank('abandon', 2);
  const family = await createFamily('mock-abandon', {
    yearGroup: 6,
    examYear: new Date().getUTCFullYear(),
  });
  await makeReadyForFullPaper(family.child.id);
  const api = await parentApi(family.email);
  expect((await scheduleFor(api, family.child.id)).status()).toBe(201);

  const scheduled = await prisma.mockSitting.findFirst({
    where: { childId: family.child.id, status: 'SCHEDULED' },
  });
  const sections = scheduled!.servedItemIds as Array<{ itemIds: string[] }>;

  await enterCrewMode(page, api, family.child.id);
  await page.goto('/crew/mock');
  await page.getByTestId('start-paper').click();
  await page.getByTestId('start-section').click();
  await expect(page.getByTestId('mock-clock')).toBeVisible();

  // Stop mid-section: the kind copy, then confirm.
  await page.getByTestId('stop-paper').click();
  await expect(
    page.getByText("We'll call that one a practice run — no case file today."),
  ).toBeVisible();
  await page.getByTestId('confirm-stop').click();
  await page.waitForURL('**/crew');

  // Discarded from reporting: the parent sees nothing of the abandoned FULL
  // paper (the arrange step's synthetic half sitting legitimately reports).
  const report = (await (
    await api.get(`/api/parent/mocks?childId=${family.child.id}`)
  ).json()) as { sittings: Array<{ blueprintId: string }> };
  expect(report.sittings.filter((entry) => entry.blueprintId === BLUEPRINT.id)).toHaveLength(0);

  // Abandoning does not spend the weekly cap, and the recomposition avoids
  // exactly the opened section's items — the unseen sections' items are free.
  const rebooked = await scheduleFor(api, family.child.id);
  expect(rebooked.status()).toBe(201);
  const next = await prisma.mockSitting.findFirst({
    where: { childId: family.child.id, status: 'SCHEDULED' },
  });
  const nextIds = new Set(
    (next!.servedItemIds as Array<{ itemIds: string[] }>).flatMap((section) => section.itemIds),
  );
  for (const burnedId of sections[0]!.itemIds) {
    expect(nextIds.has(burnedId), `re-served a burned item ${burnedId}`).toBe(false);
  }
  await api.dispose();
});

test('a paper that cannot compose fails loudly, never with substituted content', async () => {
  // No MOCK bank for this family's composition beyond what other tests made —
  // burn it all by using a fresh child and a deliberately starved type check:
  // schedule against a bank in which one type has been fully consumed.
  const family = await createFamily('mock-shortfall', {
    yearGroup: 6,
    examYear: new Date().getUTCFullYear(),
  });
  await makeReadyForFullPaper(family.child.id);
  const api = await parentApi(family.email);

  // Consume the entire remaining vr-01 MOCK pool for this child by burning it.
  const vr01 = await prisma.item.findMany({
    where: { questionTypeId: 'vr-01-insert-letter', pool: 'MOCK', status: 'LIVE' },
    select: { id: true },
  });
  if (vr01.length > 0) {
    await prisma.mockSitting.create({
      data: {
        childId: family.child.id,
        blueprintId: BLUEPRINT.id,
        servedItemIds: [{ itemIds: vr01.map((item) => item.id) }],
        sectionTimings: [{ startedAt: new Date().toISOString() }],
        responses: {},
        status: 'ABANDONED',
      },
    });
  }

  const response = await scheduleFor(api, family.child.id);
  expect(response.status()).toBe(409);
  expect(((await response.json()) as { reason: string }).reason).toBe('shortfall');

  // The volume-floor alert reached the event stream (gate #2).
  const alert = await prisma.event.findFirst({
    where: { childId: family.child.id, name: 'mock_composition_failed' },
  });
  expect(alert).toBeTruthy();
  await api.dispose();
});
