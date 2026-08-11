/**
 * Mock papers: the IO layer for ADDENDUM-B. Every decision that matters —
 * what a blueprint is, how a paper composes, what burns, what the cap is,
 * how a sitting scores — lives in @cluecrew/core; this file persists it.
 *
 * Grading is server-side throughout: the child's device never receives an
 * isCorrect flag during a sitting, and no partial score of an abandoned
 * sitting is stored for or shown to anyone (§3).
 */
import glMathsHalf from '../../../../content/blueprints/gl-maths-half.json';
import glMathsStandard from '../../../../content/blueprints/gl-maths-standard.json';
import glVrHalf from '../../../../content/blueprints/gl-vr-half.json';
import glVrStandard from '../../../../content/blueprints/gl-vr-standard.json';
import {
  blueprintFileSchema,
  burnedItemIds,
  earlyHalfAvailable,
  hardFloorSatisfied,
  intensityForCapture,
  reachableRung,
  childMockResult,
  composeMockPaper,
  techniqueKeyOf,
  isBlueprintVerified,
  nextMockAllowedAt,
  scoreSitting,
  trajectory,
  type Blueprint,
  type MockResponse,
  type SectionTiming,
  type Stage1Report,
} from '@cluecrew/core';
import { logEvent, prisma, Prisma, type MockSitting } from '@cluecrew/db';
import { shuffleOptionsForChild } from '@/lib/crew/shuffle';

/** Bundled at build like the voice packs; validated at module load. */
const BLUEPRINTS: Blueprint[] = [glVrStandard, glVrHalf, glMathsStandard, glMathsHalf].map(
  (file) => blueprintFileSchema.parse(file).blueprint,
);

export function listBlueprints(): Blueprint[] {
  return BLUEPRINTS;
}

export function blueprintById(id: string): Blueprint | undefined {
  return BLUEPRINTS.find((blueprint) => blueprint.id === id);
}

/** Drafts never reach a real child in production (§2). */
function blueprintServable(blueprint: Blueprint): boolean {
  return isBlueprintVerified(blueprint) || process.env.APP_ENV !== 'production';
}

// ---------------------------------------------------------------------------
// Stored-JSON shapes (see prisma MockSitting comments)
// ---------------------------------------------------------------------------

type ServedSections = Array<{ itemIds: string[] }>;
type Timings = SectionTiming[];
type Responses = Record<string, MockResponse>;

function served(sitting: MockSitting): ServedSections {
  return sitting.servedItemIds as unknown as ServedSections;
}
function timings(sitting: MockSitting): Timings {
  return sitting.sectionTimings as unknown as Timings;
}
function responses(sitting: MockSitting): Responses {
  return sitting.responses as unknown as Responses;
}

/** Sitting update with the same optimistic-versioning rule sessions use. */
async function saveSitting(
  sitting: MockSitting,
  data: Partial<{
    status: MockSitting['status'];
    sectionTimings: Timings;
    responses: Responses;
  }>,
): Promise<void> {
  const result = await prisma.mockSitting.updateMany({
    where: { id: sitting.id, stateVersion: sitting.stateVersion },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.sectionTimings
        ? { sectionTimings: data.sectionTimings as unknown as Prisma.InputJsonValue }
        : {}),
      ...(data.responses ? { responses: data.responses as unknown as Prisma.InputJsonValue } : {}),
      stateVersion: sitting.stateVersion + 1,
    },
  });
  if (result.count === 0) throw new Error('state_conflict');
  sitting.stateVersion += 1;
}

async function burnedFor(childId: string): Promise<Set<string>> {
  const sittings = await prisma.mockSitting.findMany({ where: { childId } });
  return burnedItemIds(
    sittings.map((sitting) => ({
      status: sitting.status,
      servedSections: served(sitting),
      sectionTimings: timings(sitting),
    })),
  );
}

// ---------------------------------------------------------------------------
// Scheduling (parent side)
// ---------------------------------------------------------------------------

export type ScheduleResult =
  | { ok: true; sittingId: string }
  | { ok: false; reason: 'unknown_blueprint' | 'draft_blueprint' | 'already_scheduled' }
  | { ok: false; reason: 'cadence'; allowedAt: string }
  | { ok: false; reason: 'shortfall' }
  // Addendum C: the readiness ladder.
  | { ok: false; reason: 'hard_floor'; untaughtTypes: string[] }
  | { ok: false; reason: 'not_ready' };

/**
 * The frequency cap counts scheduled/sat papers in the blueprint's DISTRICT,
 * not just this blueprint — one paper per district per 7 days (§3). Abandoned
 * sittings do not count: the kind exit costs the family nothing.
 */
export async function scheduleMock(
  childId: string,
  blueprintId: string,
  options: { earlyHalfRequest?: boolean } = {},
): Promise<ScheduleResult> {
  const blueprint = blueprintById(blueprintId);
  if (!blueprint) return { ok: false, reason: 'unknown_blueprint' };
  if (!blueprintServable(blueprint)) return { ok: false, reason: 'draft_blueprint' };

  // Amendment 1: the mock ladder is a Full Crew capability, enforced here at
  // the API — a Crew child cannot reach a paper by any route (gate #1).
  const { entitlementsForChild } = await import('@/lib/entitlements');
  if (!(await entitlementsForChild(childId)).mockLadder) {
    return { ok: false, reason: 'not_ready' };
  }

  // The readiness ladder (Addendum C §3–4). The hard floor first — a fairness
  // law with no override, on every path: no paper may contain a question type
  // the child has never been taught.
  const { readinessFor } = await import('@/lib/crew/readiness-io');
  const readiness = await readinessFor(childId, blueprint);
  const taught = new Set(
    (
      await prisma.caseFile.findMany({
        where: { childId },
        include: { case: { select: { questionTypeId: true } } },
      })
    ).map((file) => file.case.questionTypeId),
  );
  const floor = hardFloorSatisfied(blueprint, taught);
  if (!floor.ok) return { ok: false, reason: 'hard_floor', untaughtTypes: floor.untaughtTypes };

  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const intensity = intensityForCapture(
    child.yearGroupAtCapture,
    child.capturedAcademicYear,
    child.examYear,
    new Date(),
  );
  const rung = reachableRung(readiness, intensity);
  if (blueprint.variant === 'half') {
    const early = options.earlyHalfRequest && earlyHalfAvailable(readiness, intensity);
    if (rung === 'locked' && !early) return { ok: false, reason: 'not_ready' };
    if (rung === 'locked' && early) {
      // The deliberate flow (§4): the parent saw the readiness picture first.
      await logEvent({ name: 'early_half_requested', childId, props: { blueprintId } });
    }
  } else if (rung !== 'full') {
    // Full papers are never available below the FULL threshold — no early
    // path exists for them (§4).
    return { ok: false, reason: 'not_ready' };
  }

  const sittings = await prisma.mockSitting.findMany({ where: { childId } });
  const districtIds = new Set(
    BLUEPRINTS.filter((candidate) => candidate.district === blueprint.district).map(
      (candidate) => candidate.id,
    ),
  );
  const inDistrict = sittings.filter((sitting) => districtIds.has(sitting.blueprintId));

  if (inDistrict.some((sitting) => ['SCHEDULED', 'IN_PROGRESS'].includes(sitting.status))) {
    return { ok: false, reason: 'already_scheduled' };
  }
  const allowedAt = nextMockAllowedAt(
    inDistrict
      .filter((sitting) => sitting.status === 'COMPLETED')
      .map((sitting) => sitting.createdAt),
  );
  if (allowedAt > new Date()) return { ok: false, reason: 'cadence', allowedAt: allowedAt.toISOString() };

  const typeIds = [
    ...new Set(blueprint.sections.flatMap((section) => Object.keys(section.typeMix))),
  ];
  const candidates = await prisma.item.findMany({
    where: { questionTypeId: { in: typeIds } },
    select: { id: true, questionTypeId: true, difficultyTier: true, pool: true, status: true, stem: true },
  });

  const composed = composeMockPaper({
    blueprint,
    candidates: candidates.map((item) => ({
      id: item.id,
      questionTypeId: item.questionTypeId,
      tier: item.difficultyTier,
      pool: item.pool,
      status: item.status,
      // R49 — only carries a value on whole-text-purpose T4 comprehension items; absent everywhere
      // else, which composeMockPaper treats as "nothing to collide on."
      techniqueKey: techniqueKeyOf(item.stem),
    })),
    burnedItemIds: await burnedFor(childId),
    seed: `${childId}:${sittings.length}`,
  });

  if (!composed.ok) {
    // The volume-floor alert (gate #2): loud in the event stream and surfaced
    // on the admin overview, never silent.
    await logEvent({
      name: 'mock_composition_failed',
      childId,
      props: { blueprintId, shortfalls: composed.shortfalls.length },
    });
    return { ok: false, reason: 'shortfall' };
  }

  const sitting = await prisma.mockSitting.create({
    data: {
      childId,
      blueprintId,
      servedItemIds: composed.sections as unknown as Prisma.InputJsonValue,
      sectionTimings: blueprint.sections.map(() => ({})) as unknown as Prisma.InputJsonValue,
      responses: {} as unknown as Prisma.InputJsonValue,
    },
  });
  await logEvent({ name: 'mock_scheduled', childId, props: { blueprintId } });
  return { ok: true, sittingId: sitting.id };
}

// ---------------------------------------------------------------------------
// The sitting (child side)
// ---------------------------------------------------------------------------

/** Late answers bounce after the section's minutes plus this much grace. */
const SECTION_GRACE_SECONDS = 30;

export type SittingView =
  | { phase: 'none' }
  | {
      phase: 'ready';
      sittingId: string;
      blueprintTitle: string;
      sectionCount: number;
      totalQuestions: number;
      totalMinutes: number;
    }
  | {
      phase: 'instructions';
      sittingId: string;
      sectionIndex: number;
      sectionCount: number;
      instructions: string;
      minutes: number;
      questionCount: number;
    }
  | {
      phase: 'section';
      sittingId: string;
      sectionIndex: number;
      sectionCount: number;
      minutes: number;
      secondsLeft: number;
      items: Array<{
        itemId: string;
        stem: unknown;
        options: Array<{ id: string; content: unknown }>;
        chosenOptionId: string | null;
      }>;
    }
  | { phase: 'finished'; sittingId: string };

async function openSitting(childId: string): Promise<MockSitting | null> {
  return prisma.mockSitting.findFirst({
    where: { childId, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
    orderBy: { createdAt: 'desc' },
  });
}

function activeSectionIndex(sitting: MockSitting): number | null {
  const sectionTimings = timings(sitting);
  for (let index = 0; index < sectionTimings.length; index++) {
    const timing = sectionTimings[index]!;
    if (timing.startedAt && !timing.endedAt) return index;
  }
  return null;
}

function nextUnstartedIndex(sitting: MockSitting): number | null {
  const sectionTimings = timings(sitting);
  for (let index = 0; index < sectionTimings.length; index++) {
    if (!sectionTimings[index]!.startedAt) return index;
  }
  return null;
}

function secondsLeft(blueprint: Blueprint, sitting: MockSitting, sectionIndex: number): number {
  const timing = timings(sitting)[sectionIndex]!;
  const budget = blueprint.sections[sectionIndex]!.minutes * 60;
  if (!timing.startedAt) return budget;
  const elapsed = Math.floor((Date.now() - Date.parse(timing.startedAt)) / 1000);
  return Math.max(0, budget - elapsed);
}

/** Reads never mutate; an over-time section is closed by the next POST. */
export async function sittingView(childId: string): Promise<SittingView> {
  // A Crew child sees no paper, ever — including one scheduled before a
  // downgrade. Nothing about WHY is visible: the desk is simply empty (D7).
  const { entitlementsForChild } = await import('@/lib/entitlements');
  if (!(await entitlementsForChild(childId)).mockLadder) return { phase: 'none' };
  const sitting = await openSitting(childId);
  if (!sitting) return { phase: 'none' };
  const blueprint = blueprintById(sitting.blueprintId);
  if (!blueprint) return { phase: 'none' };

  if (sitting.status === 'SCHEDULED') {
    return {
      phase: 'ready',
      sittingId: sitting.id,
      blueprintTitle: blueprint.title,
      sectionCount: blueprint.sections.length,
      totalQuestions: blueprint.sections.reduce((sum, section) => sum + section.questionCount, 0),
      totalMinutes: blueprint.sections.reduce((sum, section) => sum + section.minutes, 0),
    };
  }

  const active = activeSectionIndex(sitting);
  if (active !== null) {
    const section = blueprint.sections[active]!;
    const sectionItems = served(sitting)[active]!.itemIds;
    const rows = await prisma.item.findMany({
      where: { id: { in: sectionItems } },
      include: { options: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const answered = responses(sitting);
    return {
      phase: 'section',
      sittingId: sitting.id,
      sectionIndex: active,
      sectionCount: blueprint.sections.length,
      minutes: section.minutes,
      secondsLeft: secondsLeft(blueprint, sitting, active),
      // Blueprint order within the section; options in the child's stable
      // seeded shuffle — authored order never leaves the server (Phase 4 rule).
      items: sectionItems.map((itemId) => {
        const row = byId.get(itemId)!;
        return {
          itemId,
          stem: row.stem,
          options: shuffleOptionsForChild(row.options, childId, itemId).map((option) => ({
            id: option.id,
            content: option.content,
          })),
          chosenOptionId: answered[itemId]?.optionId ?? null,
        };
      }),
    };
  }

  const next = nextUnstartedIndex(sitting);
  if (next !== null) {
    const section = blueprint.sections[next]!;
    return {
      phase: 'instructions',
      sittingId: sitting.id,
      sectionIndex: next,
      sectionCount: blueprint.sections.length,
      instructions: section.instructions,
      minutes: section.minutes,
      questionCount: section.questionCount,
    };
  }
  return { phase: 'finished', sittingId: sitting.id };
}

export async function startSitting(childId: string): Promise<void> {
  const sitting = await openSitting(childId);
  if (!sitting || sitting.status !== 'SCHEDULED') throw new Error('nothing_pending');
  const result = await prisma.mockSitting.updateMany({
    where: { id: sitting.id, stateVersion: sitting.stateVersion },
    data: { status: 'IN_PROGRESS', stateVersion: sitting.stateVersion + 1 },
  });
  if (result.count === 0) throw new Error('state_conflict');
  await logEvent({ name: 'mock_started', childId, props: { blueprintId: sitting.blueprintId } });
}

export async function startSection(childId: string, sectionIndex: number): Promise<void> {
  const sitting = await openSitting(childId);
  if (!sitting || sitting.status !== 'IN_PROGRESS') throw new Error('nothing_pending');
  if (activeSectionIndex(sitting) !== null) throw new Error('section_open');
  if (nextUnstartedIndex(sitting) !== sectionIndex) throw new Error('nothing_pending');
  const sectionTimings = timings(sitting);
  sectionTimings[sectionIndex] = { startedAt: new Date().toISOString() };
  await saveSitting(sitting, { sectionTimings });
}

/**
 * Answers are changeable while the section is open — real papers allow it —
 * and graded server-side either way. After minutes + grace the section is
 * closed and the answer bounces.
 */
export async function answerMockItem(
  childId: string,
  itemId: string,
  optionId: string,
): Promise<void> {
  const sitting = await openSitting(childId);
  if (!sitting || sitting.status !== 'IN_PROGRESS') throw new Error('nothing_pending');
  const blueprint = blueprintById(sitting.blueprintId)!;
  const active = activeSectionIndex(sitting);
  if (active === null) throw new Error('nothing_pending');
  if (!served(sitting)[active]!.itemIds.includes(itemId)) throw new Error('nothing_pending');

  if (secondsLeft(blueprint, sitting, active) <= -SECTION_GRACE_SECONDS) {
    await endSection(childId, active);
    throw new Error('section_over');
  }

  const option = await prisma.itemOption.findUnique({ where: { id: optionId } });
  if (!option || option.itemId !== itemId) throw new Error('nothing_pending');

  const all = responses(sitting);
  all[itemId] = {
    optionId,
    correct: option.isCorrect,
    answeredAt: new Date().toISOString(),
  };
  await saveSitting(sitting, { responses: all });
}

export async function endSection(childId: string, sectionIndex: number): Promise<void> {
  const sitting = await openSitting(childId);
  if (!sitting || sitting.status !== 'IN_PROGRESS') throw new Error('nothing_pending');
  const blueprint = blueprintById(sitting.blueprintId)!;
  const sectionTimings = timings(sitting);
  const timing = sectionTimings[sectionIndex];
  if (!timing?.startedAt || timing.endedAt) throw new Error('nothing_pending');

  const budget = blueprint.sections[sectionIndex]!.minutes * 60;
  const elapsed = Math.floor((Date.now() - Date.parse(timing.startedAt)) / 1000);
  timing.endedAt = new Date().toISOString();
  timing.secondsUsed = Math.min(elapsed, budget);

  const isLast = sectionIndex === blueprint.sections.length - 1;
  await saveSitting(sitting, {
    sectionTimings,
    ...(isLast ? { status: 'COMPLETED' as const } : {}),
  });
  if (isLast) {
    await logEvent({ name: 'mock_completed', childId, props: { blueprintId: sitting.blueprintId } });
  }
}

/**
 * The kind exit (§3): the sitting is discarded, no partial score reaches the
 * parent, and only the sections the child opened burn.
 */
export async function abandonSitting(childId: string): Promise<void> {
  const sitting = await openSitting(childId);
  if (!sitting) throw new Error('nothing_pending');
  const result = await prisma.mockSitting.updateMany({
    where: { id: sitting.id, stateVersion: sitting.stateVersion },
    data: { status: 'ABANDONED', stateVersion: sitting.stateVersion + 1 },
  });
  if (result.count === 0) throw new Error('state_conflict');
  await logEvent({ name: 'mock_abandoned', childId, props: { blueprintId: sitting.blueprintId } });
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

async function typeNameMap(): Promise<Record<string, string>> {
  const types = await prisma.questionType.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(types.map((type) => [type.id, type.name]));
}

async function scoreOne(
  sitting: MockSitting,
  blueprint: Blueprint,
  typeNames: Record<string, string>,
): Promise<Stage1Report> {
  const itemIds = served(sitting).flatMap((section) => section.itemIds);
  const rows = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, questionTypeId: true },
  });
  return scoreSitting({
    servedSections: served(sitting),
    sectionMinutes: blueprint.sections.map((section) => section.minutes),
    responses: responses(sitting),
    sectionTimings: timings(sitting),
    itemTypeById: Object.fromEntries(rows.map((row) => [row.id, row.questionTypeId])),
    typeNames,
  });
}

/** The child's result: names, one focus, no numbers (Addendum A). */
export async function childResult(childId: string, sittingId: string) {
  const sitting = await prisma.mockSitting.findUnique({ where: { id: sittingId } });
  if (!sitting || sitting.childId !== childId || sitting.status !== 'COMPLETED') return null;
  const blueprint = blueprintById(sitting.blueprintId);
  if (!blueprint) return null;
  const report = await scoreOne(sitting, blueprint, await typeNameMap());
  return childMockResult(report.perType);
}

/** Stage 1, per child: completed sittings only, newest first, plus trajectory. */
export async function parentMockReport(childId: string) {
  const sittings = await prisma.mockSitting.findMany({
    where: { childId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
  });
  const typeNames = await typeNameMap();
  const reports = [];
  for (const sitting of sittings) {
    const blueprint = blueprintById(sitting.blueprintId);
    if (!blueprint) continue;
    reports.push({
      sittingId: sitting.id,
      blueprintId: sitting.blueprintId,
      blueprintTitle: blueprint.title,
      district: blueprint.district,
      satAt: sitting.createdAt.toISOString(),
      report: await scoreOne(sitting, blueprint, typeNames),
    });
  }
  return {
    sittings: reports,
    trajectory: trajectory(
      reports.map((entry) => ({
        createdAt: entry.satAt,
        raw: entry.report.raw,
        total: entry.report.total,
      })),
    ),
  };
}

/** What the parent scheduling card needs, per child and blueprint. */
export async function schedulingState(childId: string) {
  const sittings = await prisma.mockSitting.findMany({ where: { childId } });
  const now = new Date();
  const { readinessFor } = await import('@/lib/crew/readiness-io');
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const intensity = intensityForCapture(
    child.yearGroupAtCapture,
    child.capturedAcademicYear,
    child.examYear,
    now,
  );
  const typeNames = await typeNameMap();
  const entries = [];
  for (const blueprint of listBlueprints()) {
    const districtIds = new Set(
      BLUEPRINTS.filter((candidate) => candidate.district === blueprint.district).map(
        (candidate) => candidate.id,
      ),
    );
    const inDistrict = sittings.filter((sitting) => districtIds.has(sitting.blueprintId));
    const allowedAt = nextMockAllowedAt(
      inDistrict
        .filter((sitting) => sitting.status === 'COMPLETED')
        .map((sitting) => sitting.createdAt),
      now,
    );
    // The readiness picture (Addendum C §4): the meter frames what's LEFT,
    // by name, never a percentage judgement of the child.
    const readiness = await readinessFor(childId, blueprint);
    const rung = reachableRung(readiness, intensity);
    const unlocked =
      blueprint.variant === 'half' ? rung === 'half' || rung === 'full' : rung === 'full';
    entries.push({
      id: blueprint.id,
      title: blueprint.title,
      district: blueprint.district,
      variant: blueprint.variant,
      draft: !isBlueprintVerified(blueprint),
      servable: blueprintServable(blueprint),
      pending: inDistrict.some((sitting) =>
        ['SCHEDULED', 'IN_PROGRESS'].includes(sitting.status),
      ),
      allowedAt: allowedAt.toISOString(),
      blocked: allowedAt > now,
      unlocked,
      earlyAvailable:
        blueprint.variant === 'half' && earlyHalfAvailable(readiness, intensity),
      hardFloorMet: readiness.untaughtTypes.length === 0,
      typesStillBuilding: readiness.typesStillBuilding.map(
        (typeId) => typeNames[typeId] ?? typeId,
      ),
      intensityColumn: intensity.column,
      parentRegister: intensity.parentRegister,
    });
  }
  return entries;
}
