/**
 * The engine↔database adapter (BUILD-PHASE-4). This file persists what the
 * pure engine decides and grades answers server-side. NO pedagogical
 * decision lives here or anywhere in the UI: item tiers, mastery, scheduling
 * and frustration handling all come from @cluecrew/core. If you find
 * yourself choosing difficulty or computing mastery in this layer — STOP.
 */
import {
  applyDecay,
  intensityForCapture,
  applyRank,
  applyTeachbackBump,
  buildReviewPool,
  computeRank,
  countStreakWeeks,
  drainEvents,
  endSession,
  familyForType,
  nextActivity,
  railAvailable,
  scheduleNextReview,
  selectItem,
  completeFluencyRound,
  startSession,
  submitAttempt,
  teachbackContentSchema,
  openMode,
  completeMode,
  declineModeOffer,
  completeTeachback,
  INITIAL_REVIEW_STATE,
  ENGINE_CONFIG,
  type Mode,
  type SessionState,
  type TeachbackContent,
} from '@cluecrew/core';
import { logEvent, prisma, Prisma } from '@cluecrew/db';
import type { MechanicFamily } from '@cluecrew/core';
import { fluencyRound } from '@/lib/crew/fluency';
import { mathsFamilyForType, type MathsFamily } from '@/lib/crew/maths';
import { buildReplay } from '@/lib/crew/replay';
import { shuffleOptionsForChild } from '@/lib/crew/shuffle';

const DAY_MS = 86_400_000;

/** Everything persisted alongside the pure engine state. */
interface PersistedState {
  engine: SessionState;
  /** Word ids offered as collect-cards this session (vs. review quizzes). */
  collectCardIds: string[];
  /** The activity currently awaiting an answer, with grading data. */
  pending: PendingActivity | null;
  bonusWordId: string | null;
  /**
   * When the session clock was last settled, ISO. Set when an activity goes on
   * stage and again each time time is charged, so the gap between the two is
   * the real time the child spent there. See serve and chargeableSeconds.
   */
  clockAt?: string;
}

/**
 * The row version a state snapshot was read at. Keyed by a symbol so it is
 * invisible to JSON.stringify and can never leak into the stored JSON: it
 * exists only to let saveState refuse a write built on a snapshot that
 * something else has already moved past.
 */
const VERSION = Symbol('stateVersion');
type LoadedState = PersistedState & { [VERSION]: number };

type PendingActivity =
  | {
      kind: 'item';
      activityKind: 'warmup_item' | 'practice_item' | 'closer';
      itemId: string;
      itemTier: number;
      questionTypeId: string;
      context: string;
      options: Array<{ id: string; isCorrect: boolean; misconceptionId: string | null }>;
      unitId?: string;
    }
  | { kind: 'word_collect'; wordId: string }
  /** The warm-up fluency round (§6) — completes via submitFluency. */
  | { kind: 'fluency_round' }
  | {
      kind: 'word_review';
      wordId: string;
      correctOptionId: string;
    }
  | { kind: 'teachback'; content: TeachbackContent; misconceptionId: string }
  /** A Mode the child is currently looking at; consumed by complete/decline. */
  | { kind: 'mode'; mode: Mode };

async function loadState(sessionId: string): Promise<LoadedState> {
  const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  const state = session.engineState as unknown as LoadedState;
  // A session opened before Addendum C persisted `closerServed: boolean`;
  // normalise it to a one-question Boss Round so an in-flight session
  // finishes cleanly instead of crashing on the new shape.
  const legacy = state.engine as unknown as { closerServed?: boolean; bossRound?: unknown };
  if (legacy.bossRound === undefined) {
    state.engine = {
      ...state.engine,
      bossRound: { size: 1, served: legacy.closerServed ? 1 : 0, correct: 0 },
    };
  }
  state[VERSION] = session.stateVersion;
  return state;
}

/**
 * Writes the state back, but only if nothing else has written since it was
 * read. A losing write throws `state_conflict`, which the crew routes turn
 * into a 409 — the same answer a replayed submission already gets, and one the
 * runner recovers from by reloading the real activity.
 *
 * Without this, two overlapping requests both read the same snapshot, both
 * mutated it, and both saved: whichever landed first was silently discarded.
 * That is how a session could appear to go backwards mid-tap.
 */
async function saveState(sessionId: string, state: PersistedState): Promise<void> {
  const loaded = state as LoadedState;
  const version = loaded[VERSION] ?? 0;
  const result = await prisma.session.updateMany({
    where: { id: sessionId, stateVersion: version },
    data: {
      engineState: state as unknown as Prisma.InputJsonValue,
      secondsActive: state.engine.secondsActive,
      stateVersion: version + 1,
    },
  });
  if (result.count === 0) throw new Error('state_conflict');
  loaded[VERSION] = version + 1;
}

/**
 * Puts an activity on stage and starts its clock.
 *
 * Only a CHANGE of activity restarts it. The activity endpoint rewrites the
 * same pending value every time it is polled, and the Mode screen's `open`
 * rewrites the value the offer already set — neither means the child has
 * arrived at something new, and treating them as if it did would keep pushing
 * the checkpoint forward so the screen was never charged for at all.
 */
function serve(state: PersistedState, pending: PendingActivity): void {
  const unchanged = JSON.stringify(state.pending) === JSON.stringify(pending);
  state.pending = pending;
  if (!unchanged) state.clockAt = new Date().toISOString();
}

/**
 * How many seconds this submission may add to the session clock, and the
 * settling of that clock.
 *
 * The child's device reports how long a screen took, and that number used to be
 * trusted outright. Sending it twice added it twice: ten taps on the Mode
 * screen over ten real seconds charged the child about fifty-five. D2's
 * fifteen-minute cap is measured against this clock, so inflating it ends a
 * child's session early.
 *
 * The clock may now never move faster than the wall clock. The claim is still
 * honoured when it is SMALLER — a slow network, or a request the child never
 * saw, must not cost them time they did not spend.
 */
function chargeableSeconds(state: PersistedState, now: Date, claimed: number): number {
  const claim = Math.min(Math.max(0, claimed), 600);
  const charge = state.clockAt
    ? Math.max(0, Math.min(claim, Math.floor((now.getTime() - Date.parse(state.clockAt)) / 1000)))
    : claim;
  state.clockAt = now.toISOString();
  return charge;
}

async function drainAndLog(childId: string, state: PersistedState): Promise<void> {
  const { state: engine, events } = drainEvents(state.engine);
  state.engine = engine;
  for (const event of events) {
    await logEvent({ name: event.name, childId, props: event.props });
  }
}

/**
 * LIVE items only in production; dev/staging fall back to the whole bank.
 * PRACTICE pool only, always (Addendum B §1): mock items never reach the
 * practice engines. selectItem enforces the same rule again in core — this
 * filter is the second layer, core is the load-bearing one.
 */
async function itemPool(questionTypeId: string) {
  const live = await prisma.item.findMany({
    where: { questionTypeId, status: 'LIVE', pool: 'PRACTICE' },
    include: { options: true },
  });
  if (live.length > 0 || process.env.APP_ENV === 'production') return live;
  return prisma.item.findMany({
    where: { questionTypeId, pool: 'PRACTICE' },
    include: { options: true },
  });
}

async function modesOpenedFor(childId: string, caseId: string): Promise<Mode[]> {
  const events = await prisma.event.findMany({
    where: { childId, name: 'mode_opened' },
    select: { props: true },
    take: 500,
  });
  const modes = new Set<Mode>();
  for (const event of events) {
    const props = event.props as { caseId?: string; mode?: Mode };
    if (props.caseId === caseId && props.mode) modes.add(props.mode);
  }
  return [...modes];
}

export async function startDailyLoop(childId: string, caseIdOverride?: string) {
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const now = new Date();

  // The intensity column in force (Addendum D §2): composition, never
  // duration. Sizes the Boss Round, caps review load, and paces new cases.
  const intensity = intensityForCapture(
    child.yearGroupAtCapture,
    child.capturedAcademicYear,
    child.examYear,
    now,
  );

  // Entitlements (Amendment 1 §5.1), enforced HERE at the API — never in UI.
  const { openCaseIds } = await import('@/lib/entitlements');
  const open = await openCaseIds(childId);
  // Crew's weekly Boss Round (§1): if this week's is spent, this session
  // closes on the wind-down — size 0, imperceptible as a limit (D7).
  let bossRoundSize = intensity.bossRoundSize;
  const { entitlementsForChild } = await import('@/lib/entitlements');
  const entitlements = await entitlementsForChild(childId);
  if (entitlements.bossRoundsPerWeek !== null) {
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const roundsThisWeek = await prisma.event.count({
      where: { childId, name: 'boss_round_completed', createdAt: { gte: weekAgo } },
    });
    if (roundsThisWeek >= entitlements.bossRoundsPerWeek) bossRoundSize = 0;
  }

  // One session per child at a time; concurrent devices resolve to the newest.
  await prisma.session.updateMany({
    where: { childId, endedAt: null },
    data: { endedAt: now },
  });

  // Focus case: the child's chosen case (autonomy within structure) or the
  // first un-cracked case in district order.
  const caseFiles = await prisma.caseFile.findMany({ where: { childId } });
  const caseFileByCase = new Map(caseFiles.map((caseFile) => [caseFile.caseId, caseFile]));
  // Only cases this child's tier opens are candidates — the child's own pick
  // included: a locked case refuses at the API whatever the client sent.
  const cases = (await prisma.case.findMany({ orderBy: { orderInDistrict: 'asc' } })).filter(
    (candidate) => open === 'all' || open.has(candidate.id),
  );
  // New-case pacing (Addendum D §2). A case with no CaseFile is NEW; whether
  // one may open now depends on the column: the final stretch opens none (the
  // matrix's most important cell), coverage-driven columns pace freely toward
  // completion, and gentler columns respect the authored rate. A child's own
  // explicit pick (caseIdOverride) is honoured for cases already underway.
  const newestCaseFileAt = caseFiles.reduce<Date | null>(
    (latest, file) => (latest === null || file.createdAt > latest ? file.createdAt : latest),
    null,
  );
  const newCaseAllowed =
    intensity.newCasesPerWeek > 0 &&
    (intensity.coverageDriven ||
      newestCaseFileAt === null ||
      now.getTime() - newestCaseFileAt.getTime() >= (7 / intensity.newCasesPerWeek) * DAY_MS);
  const startedUncracked = cases.find(
    (candidate) => caseFileByCase.has(candidate.id) && !caseFileByCase.get(candidate.id)!.solvedAt,
  );
  const nextUncracked = cases.find((candidate) => !caseFileByCase.get(candidate.id)?.solvedAt);
  const focusCase =
    (caseIdOverride ? cases.find((candidate) => candidate.id === caseIdOverride) : undefined) ??
    startedUncracked ??
    (newCaseAllowed ? nextUncracked : undefined) ??
    // Nothing underway and no new case allowed: consolidate the least-mastered
    // existing case rather than opening a type three weeks before the exam.
    cases
      .filter((candidate) => caseFileByCase.has(candidate.id))
      .sort(
        (a, b) =>
          caseFileByCase.get(a.id)!.masteryLevel - caseFileByCase.get(b.id)!.masteryLevel,
      )[0] ??
    nextUncracked ??
    cases[cases.length - 1];
  if (!focusCase) throw new Error('no cases exist');

  let caseFile = caseFileByCase.get(focusCase.id);
  if (!caseFile) {
    caseFile = await prisma.caseFile.create({ data: { childId, caseId: focusCase.id } });
  }

  // Lazy decay at read time (Phase 3 §1) — never punitive.
  if (caseFile.lastPracticedAt) {
    const idleDays = (now.getTime() - caseFile.lastPracticedAt.getTime()) / DAY_MS;
    const decayed = applyDecay(caseFile.masteryLevel, idleDays, Boolean(caseFile.solvedAt));
    if (decayed.masteryLevel !== caseFile.masteryLevel) {
      caseFile = await prisma.caseFile.update({
        where: { id: caseFile.id },
        data: { masteryLevel: decayed.masteryLevel },
      });
    }
    if (decayed.triggersReview) {
      await prisma.reviewSchedule.upsert({
        where: {
          childId_unitKind_unitId: { childId, unitKind: 'question_type', unitId: focusCase.questionTypeId },
        },
        create: {
          childId,
          unitKind: 'question_type',
          unitId: focusCase.questionTypeId,
          dueAt: now,
          intervalDays: 1,
        },
        update: { dueAt: now },
      });
    }
  }

  const dueRows = await prisma.reviewSchedule.findMany({ where: { childId } });
  const pool = buildReviewPool(
    dueRows.map((row) => ({
      unitKind: row.unitKind as 'question_type' | 'word',
      unitId: row.unitId,
      dueAt: row.dueAt,
      lapses: row.lapses,
    })),
    now,
    intensity.reviewLoadCap, // the matrix's per-session review cap (D §2)
  ).slice(0, ENGINE_CONFIG.session.warmupReviewUnitsMax);

  // Three collectible Word Cards per warm-up (§5): lowest-tier uncollected.
  const collected = await prisma.wordVaultEntry.findMany({ where: { childId }, select: { wordId: true } });
  const collectCards = await prisma.word.findMany({
    where: { status: 'LIVE', id: { notIn: collected.map((entry) => entry.wordId) } },
    orderBy: [{ tier: 'asc' }, { id: 'asc' }],
    take: 3,
  });

  const settings = (child.settings ?? {}) as { sessionMinutes?: number };
  // The fluency thread (§6, ruling 2026-08-01): presence is the intensity
  // column's lever, but only once the Maths district actually exists for
  // children — with zero maths Cases seeded, the lever reads 'off' and
  // nothing changes for a VR-only child.
  const mathsCases = await prisma.case.count({
    where: { questionType: { district: 'MATHS' } },
  });
  const fluency = mathsCases > 0 ? intensity.fluency : 'off';

  const engine = startSession({
    sessionId: 'pending',
    childId,
    fluency,
    reviewUnits: pool.map((unit) => ({ unitKind: unit.unitKind, unitId: unit.unitId })),
    wordCardIds: collectCards.map((word) => word.id),
    focusCase: {
      caseId: focusCase.id,
      questionTypeId: focusCase.questionTypeId,
      masteryLevel: caseFile.masteryLevel,
      attemptCount: caseFile.attemptCount,
      modesOpened: await modesOpenedFor(childId, focusCase.id),
      tierEstimate: caseFile.tierEstimate,
      recentOutcomes: (caseFile.recentOutcomes as boolean[]) ?? [],
      taughtBack: Boolean(caseFile.taughtBackAt),
    },
    parentSessionMinutes: settings.sessionMinutes,
    bossRoundSize,
  });

  const session = await prisma.session.create({ data: { childId, engineState: {} } });
  engine.sessionId = session.id;
  const state: PersistedState = {
    engine,
    collectCardIds: collectCards.map((word) => word.id),
    pending: null,
    bonusWordId: null,
  };
  await drainAndLog(childId, state);
  await saveState(session.id, state);
  return { sessionId: session.id };
}

export async function openSessionFor(childId: string) {
  return prisma.session.findFirst({ where: { childId, endedAt: null }, orderBy: { startedAt: 'desc' } });
}

export type ActivityPayload =
  | { kind: 'no_session' }
  | { kind: 'wind_down'; sessionId: string }
  | {
      kind: 'fluency_round';
      intensity: 'light' | 'standard';
      questions: Array<{ prompt: string; answer: number }>;
    }
  | { kind: 'mode_content'; mode: Mode; forced: boolean; caseId: string; caseTitle: string; modes: unknown }
  | { kind: 'teachback'; caseId: string; working: string[]; corrections: string[] }
  | {
      kind: 'word_collect';
      word: { headword: string; definitionChild: string; sentence: string; tier: number; rootFamily: string | null };
    }
  | { kind: 'word_review'; direction: string; prompt: string; options: Array<{ id: string; label: string }> }
  | {
      kind: 'item';
      activityKind: 'warmup_item' | 'practice_item' | 'closer';
      family: MechanicFamily | MathsFamily;
      plain: boolean;
      round?: { index: number; size: number };
      questionTypeId: string;
      rail: 'stage' | 'corner' | 'none';
      stem: unknown;
      options: Array<{ id: string; content: unknown }>;
    };

/**
 * Builds the next renderable activity payload. Never leaks answers.
 *
 * Reading the next activity can write (it records what went on stage), so it
 * can lose a version race with a submission landing at the same moment. A read
 * must not fail for that: it simply re-reads and asks again, which is safe
 * because the activity is derived from state rather than advancing it.
 */
export async function getActivity(childId: string, attempt = 0): Promise<ActivityPayload> {
  try {
    return await buildActivity(childId);
  } catch (error) {
    if ((error as Error).message === 'state_conflict' && attempt < 2) {
      return getActivity(childId, attempt + 1);
    }
    throw error;
  }
}

async function buildActivity(childId: string): Promise<ActivityPayload> {
  const session = await openSessionFor(childId);
  if (!session) return { kind: 'no_session' as const };
  const state = await loadState(session.id);
  const { activity, state: engine } = nextActivity(state.engine);
  state.engine = engine;

  if (activity.kind === 'wind_down') {
    return { kind: 'wind_down' as const, sessionId: session.id };
  }

  if (activity.kind === 'mode_content') {
    const focusCase = await prisma.case.findUniqueOrThrow({ where: { id: activity.caseId } });
    // Record what is on stage, exactly as every other activity does, so a
    // second complete/decline for it can be recognised as a replay.
    serve(state, { kind: 'mode', mode: activity.mode });
    await saveState(session.id, state);
    return {
      kind: 'mode_content' as const,
      mode: activity.mode,
      forced: activity.forced,
      caseId: activity.caseId,
      caseTitle: focusCase.title,
      modes: focusCase.modes,
    };
  }

  if (activity.kind === 'teachback') {
    const misconceptions = await prisma.misconception.findMany({
      where: { options: { some: { item: { questionTypeId: activity.questionTypeId } } }, teachback: { not: Prisma.AnyNull } },
    });
    const chosen = misconceptions[0];
    if (!chosen) {
      // No authored teach-back content for this type: skip it (S3 — the
      // engine never generates text, so no content means no teach-back).
      state.engine = { ...state.engine, focus: { ...state.engine.focus, teachbackPending: false } };
      await saveState(session.id, state);
      return getActivity(childId);
    }
    const content = teachbackContentSchema.parse(chosen.teachback);
    serve(state, { kind: 'teachback', content, misconceptionId: chosen.id });
    await saveState(session.id, state);
    return {
      kind: 'teachback' as const,
      caseId: activity.caseId,
      working: content.working,
      corrections: content.corrections.map((correction) => correction.text),
    };
  }

  if (activity.kind === 'fluency_round') {
    // Facts are generated, not authored (§6): seeded per child per day so a
    // refresh never re-rolls the round. Light rounds are shorter.
    const dayKey = new Date().toISOString().slice(0, 10);
    const questions = fluencyRound(childId, dayKey);
    serve(state, { kind: 'fluency_round' });
    await saveState(session.id, state);
    return {
      kind: 'fluency_round' as const,
      intensity: activity.intensity,
      questions: activity.intensity === 'light' ? questions.slice(0, 6) : questions,
    };
  }

  if (activity.kind === 'warmup_item') {
    const unit = activity.unit;
    if (unit.unitKind === 'word') {
      const word = await prisma.word.findUnique({ where: { id: unit.unitId } });
      if (!word) return advancePastBrokenUnit(childId, session.id, state);

      if (state.collectCardIds.includes(unit.unitId)) {
        serve(state, { kind: 'word_collect', wordId: word.id });
        await saveState(session.id, state);
        return {
          kind: 'word_collect' as const,
          word: {
            headword: word.headword,
            definitionChild: word.definitionChild,
            sentence: word.sentence,
            tier: word.tier,
            rootFamily: word.rootFamily,
          },
        };
      }

      // Review quiz: alternate meaning→word and word→meaning (§5).
      const distractors = await prisma.word.findMany({
        where: { status: 'LIVE', id: { not: word.id }, tier: { in: [word.tier, Math.max(1, word.tier - 1)] } },
        take: 12,
      });
      const shuffled = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const direction = state.engine.warmup.index % 2 === 0 ? 'meaning_to_word' : 'word_to_meaning';
      const optionWords = [word, ...shuffled].sort(() => 0.5 - Math.random());
      serve(state, { kind: 'word_review', wordId: word.id, correctOptionId: word.id });
      await saveState(session.id, state);
      return {
        kind: 'word_review' as const,
        direction,
        prompt: direction === 'meaning_to_word' ? word.definitionChild : word.headword,
        options: optionWords.map((candidate) => ({
          id: candidate.id,
          label: direction === 'meaning_to_word' ? candidate.headword : candidate.definitionChild,
        })),
      };
    }
    // question_type review unit → one item of that type in Case mode.
    return serveItem(childId, session.id, state, {
      activityKind: 'warmup_item',
      questionTypeId: unit.unitId,
      targetTier: 2,
      context: 'warmup_review',
      unitId: unit.unitId,
    });
  }

  if (activity.kind === 'closer') {
    // The Boss Round mixes question types the child has already been taught
    // (Addendum C §2): the focus type is only the fallback. Taught = a case
    // file exists — the case was opened, so its type has been introduced.
    const taught = await prisma.caseFile.findMany({
      where: { childId },
      include: { case: { select: { questionTypeId: true } } },
    });
    const taughtTypes = [...new Set(taught.map((file) => file.case.questionTypeId))];
    const roundType =
      taughtTypes.length > 0
        ? taughtTypes[
            // Seeded rotation: varied within the round, stable per session.
            (activity.round.index +
              [...state.engine.sessionId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) %
              taughtTypes.length
          ]!
        : activity.questionTypeId;
    // Prefer items unseen in the last 14 days (§2) — a preference, not a
    // requirement: the exclusion set is dropped when it would empty the pool.
    const fortnight = new Date(Date.now() - 14 * DAY_MS);
    const recent = await prisma.attempt.findMany({
      where: { childId, createdAt: { gte: fortnight } },
      select: { itemId: true },
    });
    return serveItem(
      childId,
      session.id,
      state,
      {
        activityKind: 'closer',
        questionTypeId: roundType,
        targetTier: activity.targetTier,
        context: 'boss_case',
      },
      new Set(recent.map((attempt) => attempt.itemId)),
    );
  }

  return serveItem(childId, session.id, state, {
    activityKind: 'practice_item',
    questionTypeId: activity.questionTypeId,
    targetTier: activity.targetTier,
    context: 'case_practice',
  });
}

async function advancePastBrokenUnit(
  childId: string,
  sessionId: string,
  state: PersistedState,
): Promise<ActivityPayload> {
  state.engine = submitAttempt(state.engine, {
    activityKind: 'warmup_item',
    itemTier: 1,
    correct: true,
    secondsElapsed: 0,
  }).state;
  await saveState(sessionId, state);
  return getActivity(childId);
}

async function serveItem(
  childId: string,
  sessionId: string,
  state: PersistedState,
  input: {
    activityKind: 'warmup_item' | 'practice_item' | 'closer';
    questionTypeId: string;
    targetTier: number;
    context: string;
    unitId?: string;
  },
  preferUnseen: ReadonlySet<string> = new Set(),
): Promise<ActivityPayload> {
  const pool = await itemPool(input.questionTypeId);
  const candidates = pool.map((item) => ({
    id: item.id,
    tier: item.difficultyTier,
    pool: item.pool,
    item,
  }));
  const exclude = new Set([...state.engine.focus.servedItemIds, ...preferUnseen]);
  const chosen =
    selectItem(
      // pool is passed through so core's MOCK exclusion is live on this path,
      // not just in tests — the query filter above is the second layer.
      candidates,
      input.targetTier,
      exclude,
    ) ??
    // The 14-day recency rule is a preference (Addendum C §2): when honouring
    // it would leave nothing to serve, recently-seen items return.
    selectItem(candidates, input.targetTier, new Set(state.engine.focus.servedItemIds));
  if (!chosen) {
    // Nothing left to serve for this type. Routing to the closer is the
    // graceful end — but if we are ALREADY serving the closer there is
    // nothing behind it, and re-entering getActivity would ask for the closer
    // again, find the pool empty again, and recurse until the request dies.
    // That is not hypothetical: a case whose question type has no LIVE items
    // hangs every request a child makes. End the session instead.
    if (input.activityKind === 'closer') {
      state.engine = {
        ...state.engine,
        bossRound: { ...state.engine.bossRound, served: state.engine.bossRound.size },
        phase: 'wind_down',
        focus: { ...state.engine.focus, frustrationBreak: false },
      };
      await saveState(sessionId, state);
      return getActivity(childId);
    }
    state.engine = { ...state.engine, focus: { ...state.engine.focus, frustrationBreak: false }, phase: 'closer' };
    await saveState(sessionId, state);
    return getActivity(childId);
  }
  const item = chosen.item;
  // Maths types (mq-*) resolve through the district registry; core's VR map
  // stays untouched (BUILD-DISTRICT-MATHS: no core changes beyond spec'd
  // integration points).
  let family: MechanicFamily | MathsFamily = familyForType(input.questionTypeId);
  if (input.questionTypeId.startsWith('mq-')) {
    const questionType = await prisma.questionType.findUnique({
      where: { id: input.questionTypeId },
      select: { mechanic: true },
    });
    family = mathsFamilyForType(input.questionTypeId, questionType?.mechanic) ?? family;
  }
  const plain = input.activityKind === 'closer';
  // Authored order never leaves the server: seeded on (childId, itemId) so
  // the order is stable for this child but differs between children.
  const options = shuffleOptionsForChild(item.options, childId, item.id);

  serve(state, {
    kind: 'item',
    activityKind: input.activityKind,
    itemId: item.id,
    itemTier: item.difficultyTier,
    questionTypeId: input.questionTypeId,
    context: input.context,
    unitId: input.unitId,
    options: options.map((option) => ({
      id: option.id,
      isCorrect: option.isCorrect,
      misconceptionId: option.misconceptionId,
    })),
  });
  await saveState(sessionId, state);
  return {
    kind: 'item' as const,
    activityKind: input.activityKind,
    family,
    plain,
    // The Boss Round frame (Addendum C §2): index/size for "2 of 3", framed
    // once client-side with the Addendum A line. Absent outside the round.
    ...(input.activityKind === 'closer'
      ? { round: { index: state.engine.bossRound.served, size: state.engine.bossRound.size } }
      : {}),
    questionTypeId: input.questionTypeId,
    // Rail progression (§3): big on stage early, corner tool later, absent in
    // Plain. Maths engines follow the same fade with their own furniture —
    // the Bar Model Builder and manipulatives ride the rail contract
    // (BUILD-DISTRICT-MATHS §3); Mark-the-Homework carries no side tool.
    rail: !plain &&
      (input.questionTypeId.startsWith('mq-')
        ? family !== 'markhomework'
        : railAvailable(family as MechanicFamily, input.questionTypeId))
      ? state.engine.focus.itemsServed < 2
        ? 'stage'
        : 'corner'
      : 'none',
    stem: item.stem,
    options: options.map((option) => ({ id: option.id, content: option.content })),
  };
}

export interface AnswerResult {
  correct: boolean;
  /**
   * Authored hint for the chosen distractor, shown verbatim (Addendum A §1.2).
   * The "correct" line is NOT sent from here — it is drawn from the voice pack
   * client-side so it can rotate without immediate repeats (§1.4).
   */
  childHint?: string;
  /**
   * Worked-example replay (BUILD-DISTRICT-MATHS, ratified addition): on a
   * missed maths item, Walk-mode lines for THIS exact question, generated
   * from its solution expression through authored templates only. Sent only
   * AFTER an answer — the solution never travels with the question.
   */
  replaySteps?: string[];
  cracked?: boolean;
  bonusWord?: { headword: string; definitionChild: string } | null;
  /** Present for Boss Round answers INSTEAD of correct/childHint: the child
   *  sees no score, ever — completion is the beat (Addendum C §2). */
  bossRound?: { answered: number; size: number; done: boolean };
}

/**
 * Completes the warm-up fluency round (§6, ruling 2026-08-01). Seconds pass
 * through the same wall-clock-clamped charge as every submission, then the
 * engine's own 90s envelope — the round can never buy or cost more time
 * than it truly took, and never more than its slot.
 */
export async function submitFluency(
  childId: string,
  body: { correctCount: number; questionCount: number; secondsElapsed: number },
): Promise<{ done: true }> {
  const session = await openSessionFor(childId);
  if (!session) throw new Error('no_session');
  const state = await loadState(session.id);
  if (state.pending?.kind !== 'fluency_round') throw new Error('nothing_pending');
  const seconds = chargeableSeconds(state, new Date(), body.secondsElapsed);
  state.engine = completeFluencyRound(state.engine, {
    correctCount: Math.max(0, Math.min(body.correctCount, body.questionCount)),
    questionCount: body.questionCount,
    secondsElapsed: seconds,
  });
  state.pending = null;
  await drainAndLog(childId, state);
  await saveState(session.id, state);
  return { done: true };
}

export async function submitAnswer(
  childId: string,
  body: { optionId?: string; secondsElapsed: number },
): Promise<AnswerResult> {
  const session = await openSessionFor(childId);
  if (!session) throw new Error('no_session');
  const state = await loadState(session.id);
  const pending = state.pending;
  if (!pending) throw new Error('nothing_pending');
  const now = new Date();
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const seconds = chargeableSeconds(state, now, body.secondsElapsed);

  if (pending.kind === 'word_collect') {
    await prisma.wordVaultEntry.upsert({
      where: { childId_wordId: { childId, wordId: pending.wordId } },
      create: { childId, wordId: pending.wordId },
      update: {},
    });
    await prisma.reviewSchedule.upsert({
      where: { childId_unitKind_unitId: { childId, unitKind: 'word', unitId: pending.wordId } },
      create: {
        childId,
        unitKind: 'word',
        unitId: pending.wordId,
        dueAt: new Date(now.getTime() + DAY_MS),
        intervalDays: 1,
      },
      update: {},
    });
    await logEvent({ name: 'word_collected', childId, props: { wordId: pending.wordId } });
    state.engine = submitAttempt(state.engine, {
      activityKind: 'warmup_item',
      itemTier: 1,
      correct: true,
      secondsElapsed: seconds,
    }).state;
    state.pending = null;
    await drainAndLog(childId, state);
    await saveState(session.id, state);
    return { correct: true };
  }

  if (pending.kind === 'teachback') {
    throw new Error('use_teachback_endpoint');
  }

  if (pending.kind === 'mode') {
    // A Mode is on stage, not a question. Reaching here means an answer
    // arrived for a screen the session has already left behind.
    throw new Error('nothing_pending');
  }

  if (pending.kind === 'word_review') {
    const correct = body.optionId === pending.correctOptionId;
    await applyReviewOutcome(childId, 'word', pending.wordId, correct, now, child.examYear);
    const entry = await prisma.wordVaultEntry.findUnique({
      where: { childId_wordId: { childId, wordId: pending.wordId } },
    });
    if (entry) {
      const { updateMastery } = await import('@cluecrew/core');
      await prisma.wordVaultEntry.update({
        where: { id: entry.id },
        data: { masteryLevel: updateMastery(entry.masteryLevel, { correct, itemTier: 2, childTier: 2 }) },
      });
    }
    state.engine = submitAttempt(state.engine, {
      activityKind: 'warmup_item',
      itemTier: 2,
      correct,
      secondsElapsed: seconds,
    }).state;
    state.pending = null;
    await drainAndLog(childId, state);
    await saveState(session.id, state);
    return { correct };
  }

  if (pending.kind === 'fluency_round') {
    // The round has its own completion call; an answer here is a stray.
    throw new Error('use_fluency_endpoint');
  }

  // Item answer: grade server-side.
  const chosen = pending.options.find((option) => option.id === body.optionId);
  const correct = chosen?.isCorrect === true;
  let childHint: string | undefined;
  if (!correct && chosen?.misconceptionId) {
    const misconception = await prisma.misconception.findUnique({ where: { id: chosen.misconceptionId } });
    childHint = misconception?.childHint;
  }
  // Worked-example replay (ratified addition): only after a miss, only from
  // the item's own solution expression, only through authored templates.
  let replaySteps: string[] | undefined;
  if (!correct) {
    const missed = await prisma.item.findUnique({
      where: { id: pending.itemId },
      select: { solution: true, explanation: true },
    });
    if (missed?.solution) {
      const templateId = (missed.explanation as { replayTemplate?: string } | null)
        ?.replayTemplate;
      replaySteps = buildReplay(missed.solution, templateId ?? undefined) ?? undefined;
    }
  }

  await prisma.attempt.create({
    data: {
      childId,
      itemId: pending.itemId,
      sessionId: session.id,
      chosenOptionId: body.optionId ?? null,
      correct,
      latencyMs: seconds * 1000,
      context: pending.context,
    },
  });
  await logEvent({
    name: 'attempt_submitted',
    childId,
    props: { itemId: pending.itemId, correct, latencyMs: seconds * 1000, context: pending.context },
  });

  const outcome = submitAttempt(state.engine, {
    activityKind: pending.activityKind,
    itemId: pending.itemId,
    itemTier: pending.itemTier,
    correct,
    secondsElapsed: seconds,
  });
  state.engine = outcome.state;

  let bonusWord: AnswerResult['bonusWord'] = null;

  if (pending.activityKind === 'warmup_item' && pending.unitId) {
    await applyReviewOutcome(childId, 'question_type', pending.unitId, correct, now, child.examYear);
  }

  if (pending.activityKind === 'closer') {
    // Boss Round (Addendum C §2): misses are NOT reviewed in the moment — the
    // round closes the session — but the missed type becomes review priority
    // for the scheduler, so next session's warm-up picks it up.
    if (!correct) {
      await applyReviewOutcome(childId, 'question_type', pending.questionTypeId, false, now, child.examYear);
    }
    state.pending = null;
    await drainAndLog(childId, state);
    await saveState(session.id, state);
    // No correct flag, no hint: the child's device never learns the score.
    return {
      correct: false, // constant — carries no signal; the runner ignores it
      bossRound: {
        answered: state.engine.bossRound.served,
        size: state.engine.bossRound.size,
        done: state.engine.bossRound.served >= state.engine.bossRound.size,
      },
    };
  }

  if (pending.activityKind === 'practice_item') {
    const caseFile = await prisma.caseFile.findUniqueOrThrow({
      where: { childId_caseId: { childId, caseId: state.engine.focus.caseId } },
    });
    await prisma.caseFile.update({
      where: { id: caseFile.id },
      data: {
        masteryLevel: outcome.focusMastery,
        attemptCount: { increment: 1 },
        lastPracticedAt: now,
        tierEstimate: state.engine.focus.adapt.tierEstimate,
        recentOutcomes: state.engine.focus.adapt.recent,
        ...(outcome.caseJustCracked ? { solvedAt: now } : {}),
      },
    });

    if (outcome.caseJustCracked) {
      // Cracked cases enter the long-term review rotation (P2)…
      await prisma.reviewSchedule.upsert({
        where: {
          childId_unitKind_unitId: {
            childId,
            unitKind: 'question_type',
            unitId: state.engine.focus.questionTypeId,
          },
        },
        create: {
          childId,
          unitKind: 'question_type',
          unitId: state.engine.focus.questionTypeId,
          dueAt: new Date(now.getTime() + DAY_MS),
          intervalDays: 1,
        },
        update: {},
      });
      // …and the ceremony includes a bonus Word Card draw (§4.5).
      const collectedIds = (
        await prisma.wordVaultEntry.findMany({ where: { childId }, select: { wordId: true } })
      ).map((entry) => entry.wordId);
      const bonus = await prisma.word.findFirst({
        where: { status: 'LIVE', id: { notIn: collectedIds } },
        orderBy: [{ tier: 'asc' }, { id: 'desc' }],
      });
      if (bonus) {
        await prisma.wordVaultEntry.create({ data: { childId, wordId: bonus.id } });
        await logEvent({ name: 'word_collected', childId, props: { wordId: bonus.id } });
        bonusWord = { headword: bonus.headword, definitionChild: bonus.definitionChild };
      }
    }
  }

  state.pending = null;
  await drainAndLog(childId, state);
  await saveState(session.id, state);

  return { correct, childHint, replaySteps, cracked: outcome.caseJustCracked, bonusWord };
}

async function applyReviewOutcome(
  childId: string,
  unitKind: 'word' | 'question_type',
  unitId: string,
  correct: boolean,
  now: Date,
  examYear: number | null,
): Promise<void> {
  const row = await prisma.reviewSchedule.findUnique({
    where: { childId_unitKind_unitId: { childId, unitKind, unitId } },
  });
  const stateBefore = row
    ? { intervalDays: row.intervalDays, easeFactor: row.easeFactor, lapses: row.lapses }
    : { ...INITIAL_REVIEW_STATE };
  const examDate = examYear ? new Date(Date.UTC(examYear, 8, 1)) : null;
  const next = scheduleNextReview(stateBefore, correct ? 'success' : 'lapse', { now, examDate });
  await prisma.reviewSchedule.upsert({
    where: { childId_unitKind_unitId: { childId, unitKind, unitId } },
    create: { childId, unitKind, unitId, dueAt: next.dueAt, intervalDays: next.intervalDays, easeFactor: next.easeFactor, lapses: next.lapses },
    update: { dueAt: next.dueAt, intervalDays: next.intervalDays, easeFactor: next.easeFactor, lapses: next.lapses },
  });
}

/**
 * Modes are the one activity that used to change the session without the
 * server having recorded that it was showing them, so there was nothing to
 * check a second, identical request against. Every other activity is written
 * into `pending` when it goes on stage and consumed when it is answered — a
 * replayed answer finds nothing pending and is refused. Modes now work the
 * same way:
 *
 *   open      the child is looking at this Mode. Sets the pending mode, so it
 *             covers both the Mode the engine offered and one the child asked
 *             for from a miss beat. Repeating it writes the same value.
 *   complete  the child is done with it. REQUIRES the pending mode, and clears
 *             it, so a second `complete` is refused.
 *   decline   the child waved the offer away. Same rule.
 *
 * Only `complete` and `decline` carry time, so refusing their replays is what
 * stops a tapped button from spending the child's session.
 */
export async function modeAction(
  childId: string,
  body: { mode: Mode; action: 'open' | 'complete' | 'decline'; secondsElapsed?: number },
) {
  const session = await openSessionFor(childId);
  if (!session) throw new Error('no_session');
  const state = await loadState(session.id);

  if (body.action === 'open') {
    state.engine = openMode(state.engine, body.mode);
    serve(state, { kind: 'mode', mode: body.mode });
    // The single permitted pointer (L2): last used mode, a UI convenience.
    await prisma.childProfile.update({ where: { id: childId }, data: { lastUsedMode: body.mode } });
  } else {
    if (state.pending?.kind !== 'mode' || state.pending.mode !== body.mode) {
      throw new Error('nothing_pending');
    }
    state.engine =
      body.action === 'complete'
        ? completeMode(state.engine, body.mode)
        : declineModeOffer(state.engine);
    state.pending = null;
  }

  if (body.secondsElapsed) {
    const { tick } = await import('@cluecrew/core');
    state.engine = tick(state.engine, chargeableSeconds(state, new Date(), body.secondsElapsed));
  }
  await drainAndLog(childId, state);
  await saveState(session.id, state);
  return { ok: true };
}

export async function answerTeachback(
  childId: string,
  body: { stepIndex: number; correctionIndex: number; secondsElapsed: number },
) {
  const session = await openSessionFor(childId);
  if (!session) throw new Error('no_session');
  const state = await loadState(session.id);
  if (state.pending?.kind !== 'teachback') throw new Error('nothing_pending');

  const { evaluateTeachback, tick } = await import('@cluecrew/core');
  const result = evaluateTeachback(state.pending.content, {
    chosenStepIndex: body.stepIndex,
    chosenCorrectionIndex: body.correctionIndex,
  });
  state.engine = tick(state.engine, chargeableSeconds(state, new Date(), body.secondsElapsed));
  state.engine = completeTeachback(state.engine, result.success);

  if (result.success) {
    const caseFile = await prisma.caseFile.findUnique({
      where: { childId_caseId: { childId, caseId: state.engine.focus.caseId } },
    });
    if (caseFile) {
      await prisma.caseFile.update({
        where: { id: caseFile.id },
        data: {
          taughtBackAt: new Date(),
          masteryLevel: applyTeachbackBump(caseFile.masteryLevel),
        },
      });
    }
  }
  state.pending = null;
  await drainAndLog(childId, state);
  await saveState(session.id, state);
  return result;
}

export async function endDailyLoop(childId: string) {
  const session = await openSessionFor(childId);
  if (!session) return { ok: true };
  const state = await loadState(session.id);
  const summary = endSession(state.engine);
  state.engine = summary.state;
  await drainAndLog(childId, state);
  await prisma.session.update({
    where: { id: session.id },
    data: {
      endedAt: new Date(),
      secondsActive: summary.secondsActive,
      engineState: state as unknown as Prisma.InputJsonValue,
    },
  });
  const rollup = await rollupStreakAndRank(childId);
  // Readiness recomputes on session end as well as nightly (Addendum C §3);
  // failures here must never cost the child their wind-down.
  try {
    const { snapshotReadiness } = await import('@/lib/crew/readiness-io');
    await snapshotReadiness(childId);
  } catch (error) {
    console.error('readiness snapshot failed', error);
  }
  const collectedToday = await prisma.wordVaultEntry.findMany({
    where: { childId, collectedAt: { gte: new Date(Date.now() - DAY_MS) } },
    include: { word: { select: { headword: true } } },
    orderBy: { collectedAt: 'desc' },
    take: 8,
  });
  return {
    ok: true,
    secondsActive: summary.secondsActive,
    wordsToday: collectedToday.map((entry) => entry.word.headword),
    // Drives the rank-up set piece client-side (Addendum A §2.2).
    rankUp: rollup.rankUp,
  };
}

async function rollupStreakAndRank(childId: string): Promise<{ rankUp: string | null }> {
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const now = new Date();
  const since = new Date(now.getTime() - 8 * 7 * DAY_MS);
  const sessions = await prisma.session.findMany({
    where: { childId, startedAt: { gte: since } },
    select: { startedAt: true, secondsActive: true },
  });

  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const key = session.startedAt.toISOString().slice(0, 10);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.secondsActive / 60);
  }
  const dailyActivity = [...minutesByDay.entries()].map(([key, minutes]) => ({
    date: new Date(`${key}T00:00:00Z`),
    minutesActive: minutes,
  }));
  const weekStarts: Date[] = [];
  const monday = mondayOf(since);
  for (let start = monday; start.getTime() < now.getTime(); start = new Date(start.getTime() + 7 * DAY_MS)) {
    weekStarts.push(start);
  }
  const weeks = countStreakWeeks(dailyActivity, weekStarts, now);
  if (weeks > child.streakWeeks) {
    await prisma.childProfile.update({ where: { id: childId }, data: { streakWeeks: weeks } });
    await logEvent({ name: 'streak_week_earned', childId, props: { totalWeeks: weeks } });
  }

  const [casesCracked, taughtBackCount, bossCount] = await Promise.all([
    prisma.caseFile.count({ where: { childId, solvedAt: { not: null } } }),
    prisma.caseFile.count({ where: { childId, taughtBackAt: { not: null } } }),
    prisma.attempt.count({ where: { childId, context: 'boss_case' } }),
  ]);
  const computed = computeRank({
    casesCracked,
    streakWeeks: Math.max(weeks, child.streakWeeks),
    taughtBackCount,
    bossCaseParticipated: bossCount > 0,
  });
  const applied = applyRank(child.rank, computed);
  if (applied !== child.rank) {
    await prisma.childProfile.update({ where: { id: childId }, data: { rank: applied } });
    await logEvent({ name: 'rank_up', childId, props: { rank: applied } });
    const { RANK_LABELS } = await import('@cluecrew/core');
    return { rankUp: RANK_LABELS[applied] };
  }
  return { rankUp: null };
}

export function mondayOf(date: Date): Date {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  return new Date(utc.getTime() - ((day + 6) % 7) * DAY_MS);
}

/** Crew HQ state (Phase 3 §9 getCrewState wiring). */
export async function hqState(childId: string) {
  const { getCrewState } = await import('@cluecrew/core');
  const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const now = new Date();
  const since = new Date(now.getTime() - 8 * 7 * DAY_MS);
  const sessions = await prisma.session.findMany({
    where: { childId, startedAt: { gte: since } },
    select: { startedAt: true, secondsActive: true },
  });
  const minutesByDay = new Map<string, number>();
  for (const session of sessions) {
    const key = session.startedAt.toISOString().slice(0, 10);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.secondsActive / 60);
  }
  const weekStarts: Date[] = [];
  for (
    let start = mondayOf(since);
    start.getTime() < now.getTime();
    start = new Date(start.getTime() + 7 * DAY_MS)
  ) {
    weekStarts.push(start);
  }
  const caseFiles = await prisma.caseFile.findMany({
    where: { childId },
    include: { case: { select: { title: true } } },
  });
  const [dueCount, taughtBackCount, bossCount] = await Promise.all([
    prisma.reviewSchedule.count({ where: { childId, dueAt: { lte: now } } }),
    prisma.caseFile.count({ where: { childId, taughtBackAt: { not: null } } }),
    prisma.attempt.count({ where: { childId, context: 'boss_case' } }),
  ]);

  return {
    child,
    // Raw counts the case file needs to say what comes next; getCrewState
    // deliberately hides numbers HQ has no business showing.
    stats: {
      taughtBackCount,
      bossCaseParticipated: bossCount > 0,
      casesCracked: caseFiles.filter((caseFile) => caseFile.solvedAt).length,
    },
    crew: getCrewState({
      currentRank: child.rank,
      casesCracked: caseFiles.filter((caseFile) => caseFile.solvedAt).length,
      taughtBackCount,
      bossCaseParticipated: bossCount > 0,
      streakWeeksTotal: child.streakWeeks,
      dailyActivity: [...minutesByDay.entries()].map(([key, minutes]) => ({
        date: new Date(`${key}T00:00:00Z`),
        minutesActive: minutes,
      })),
      weekStarts,
      now,
      dueReviewCount: dueCount,
      caseFiles: caseFiles.map((caseFile) => ({
        caseId: caseFile.caseId,
        title: caseFile.case.title,
        masteryLevel: caseFile.masteryLevel,
        solvedAt: caseFile.solvedAt,
        taughtBack: Boolean(caseFile.taughtBackAt),
      })),
    }),
  };
}
