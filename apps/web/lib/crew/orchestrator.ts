/**
 * The engine↔database adapter (BUILD-PHASE-4). This file persists what the
 * pure engine decides and grades answers server-side. NO pedagogical
 * decision lives here or anywhere in the UI: item tiers, mastery, scheduling
 * and frustration handling all come from @cluecrew/core. If you find
 * yourself choosing difficulty or computing mastery in this layer — STOP.
 */
import {
  applyDecay,
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
}

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
  | {
      kind: 'word_review';
      wordId: string;
      correctOptionId: string;
    }
  | { kind: 'teachback'; content: TeachbackContent; misconceptionId: string };

async function loadState(sessionId: string): Promise<PersistedState> {
  const session = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  return session.engineState as unknown as PersistedState;
}

async function saveState(sessionId: string, state: PersistedState): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      engineState: state as unknown as Prisma.InputJsonValue,
      secondsActive: state.engine.secondsActive,
    },
  });
}

async function drainAndLog(childId: string, state: PersistedState): Promise<void> {
  const { state: engine, events } = drainEvents(state.engine);
  state.engine = engine;
  for (const event of events) {
    await logEvent({ name: event.name, childId, props: event.props });
  }
}

/** LIVE items only in production; dev/staging fall back to the whole bank. */
async function itemPool(questionTypeId: string) {
  const live = await prisma.item.findMany({
    where: { questionTypeId, status: 'LIVE' },
    include: { options: true },
  });
  if (live.length > 0 || process.env.APP_ENV === 'production') return live;
  return prisma.item.findMany({ where: { questionTypeId }, include: { options: true } });
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

  // One session per child at a time; concurrent devices resolve to the newest.
  await prisma.session.updateMany({
    where: { childId, endedAt: null },
    data: { endedAt: now },
  });

  // Focus case: the child's chosen case (autonomy within structure) or the
  // first un-cracked case in district order.
  const caseFiles = await prisma.caseFile.findMany({ where: { childId } });
  const caseFileByCase = new Map(caseFiles.map((caseFile) => [caseFile.caseId, caseFile]));
  const cases = await prisma.case.findMany({ orderBy: { orderInDistrict: 'asc' } });
  const focusCase =
    (caseIdOverride ? cases.find((candidate) => candidate.id === caseIdOverride) : undefined) ??
    cases.find((candidate) => !caseFileByCase.get(candidate.id)?.solvedAt) ??
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
  ).slice(0, ENGINE_CONFIG.session.warmupReviewUnitsMax);

  // Three collectible Word Cards per warm-up (§5): lowest-tier uncollected.
  const collected = await prisma.wordVaultEntry.findMany({ where: { childId }, select: { wordId: true } });
  const collectCards = await prisma.word.findMany({
    where: { id: { notIn: collected.map((entry) => entry.wordId) } },
    orderBy: [{ tier: 'asc' }, { id: 'asc' }],
    take: 3,
  });

  const settings = (child.settings ?? {}) as { sessionMinutes?: number };
  const engine = startSession({
    sessionId: 'pending',
    childId,
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
      family: MechanicFamily;
      plain: boolean;
      questionTypeId: string;
      rail: 'stage' | 'corner' | 'none';
      stem: unknown;
      options: Array<{ id: string; content: unknown }>;
    };

/** Builds the next renderable activity payload. Never leaks answers. */
export async function getActivity(childId: string): Promise<ActivityPayload> {
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
    state.pending = { kind: 'teachback', content, misconceptionId: chosen.id };
    await saveState(session.id, state);
    return {
      kind: 'teachback' as const,
      caseId: activity.caseId,
      working: content.working,
      corrections: content.corrections.map((correction) => correction.text),
    };
  }

  if (activity.kind === 'warmup_item') {
    const unit = activity.unit;
    if (unit.unitKind === 'word') {
      const word = await prisma.word.findUnique({ where: { id: unit.unitId } });
      if (!word) return advancePastBrokenUnit(childId, session.id, state);

      if (state.collectCardIds.includes(unit.unitId)) {
        state.pending = { kind: 'word_collect', wordId: word.id };
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
        where: { id: { not: word.id }, tier: { in: [word.tier, Math.max(1, word.tier - 1)] } },
        take: 12,
      });
      const shuffled = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const direction = state.engine.warmup.index % 2 === 0 ? 'meaning_to_word' : 'word_to_meaning';
      const optionWords = [word, ...shuffled].sort(() => 0.5 - Math.random());
      state.pending = { kind: 'word_review', wordId: word.id, correctOptionId: word.id };
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

  // practice_item | closer
  return serveItem(childId, session.id, state, {
    activityKind: activity.kind === 'closer' ? 'closer' : 'practice_item',
    questionTypeId: activity.questionTypeId,
    targetTier: activity.targetTier,
    context: activity.kind === 'closer' ? 'boss_case' : 'case_practice',
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
): Promise<ActivityPayload> {
  const pool = await itemPool(input.questionTypeId);
  const chosen = selectItem(
    pool.map((item) => ({ id: item.id, tier: item.difficultyTier, item })),
    input.targetTier,
    new Set(state.engine.focus.servedItemIds),
  );
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
        closerServed: true,
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
  const family = familyForType(input.questionTypeId);
  const plain = input.activityKind === 'closer';
  // Authored order never leaves the server: seeded on (childId, itemId) so
  // the order is stable for this child but differs between children.
  const options = shuffleOptionsForChild(item.options, childId, item.id);

  state.pending = {
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
  };
  await saveState(sessionId, state);
  return {
    kind: 'item' as const,
    activityKind: input.activityKind,
    family,
    plain,
    questionTypeId: input.questionTypeId,
    // Rail progression (§3): big on stage early, corner tool later, absent in Plain.
    rail: !plain && railAvailable(family, input.questionTypeId)
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
  cracked?: boolean;
  bonusWord?: { headword: string; definitionChild: string } | null;
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
  const seconds = Math.min(Math.max(0, body.secondsElapsed), 600);

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

  // Item answer: grade server-side.
  const chosen = pending.options.find((option) => option.id === body.optionId);
  const correct = chosen?.isCorrect === true;
  let childHint: string | undefined;
  if (!correct && chosen?.misconceptionId) {
    const misconception = await prisma.misconception.findUnique({ where: { id: chosen.misconceptionId } });
    childHint = misconception?.childHint;
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
        where: { id: { notIn: collectedIds } },
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

  return { correct, childHint, cracked: outcome.caseJustCracked, bonusWord };
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

export async function modeAction(
  childId: string,
  body: { mode: Mode; action: 'open' | 'complete' | 'decline'; secondsElapsed?: number },
) {
  const session = await openSessionFor(childId);
  if (!session) throw new Error('no_session');
  const state = await loadState(session.id);

  if (body.action === 'open') {
    state.engine = openMode(state.engine, body.mode);
    // The single permitted pointer (L2): last used mode, a UI convenience.
    await prisma.childProfile.update({ where: { id: childId }, data: { lastUsedMode: body.mode } });
  } else if (body.action === 'complete') {
    state.engine = completeMode(state.engine, body.mode);
  } else {
    state.engine = declineModeOffer(state.engine);
  }
  if (body.secondsElapsed) {
    const { tick } = await import('@cluecrew/core');
    state.engine = tick(state.engine, body.secondsElapsed);
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
  state.engine = tick(state.engine, Math.min(body.secondsElapsed, 600));
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
