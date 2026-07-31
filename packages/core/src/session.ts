/**
 * Session engine (BUILD-PHASE-3 §4): the Daily Loop as a pure reducer.
 *
 *   1. Warm-up (~3 min): due review units + word cards — every session opens
 *      with retrieval, no exceptions (P2).
 *   2. Focus Case (~9 min): the current Case; a "different way in" flag means
 *      Mode content precedes practice (P1).
 *   3. Boss-style closer: one exam-formatted item (P4), then the wind-down.
 *
 * D2 is enforced here: at (cap − 2) minutes the engine stops issuing new
 * items and routes to the closer + wind-down. Stopping early records
 * everything and punishes nothing. There is NO code path that extends a
 * session; a parent setting may shorten the cap, never lengthen it.
 *
 * Persistence and rendering live elsewhere: Phase 4 renders these states and
 * makes no pedagogical decisions. That boundary is the anti-drift line for
 * the whole child app.
 */
import {
  initialAdaptState,
  nextItemTier,
  recordOutcome,
  type AdaptState,
} from './adaptivity';
import { ENGINE_CONFIG } from './config';
import type { EventName, EventProps } from './events';
import { isMastered, needsDifferentWayIn, updateMastery } from './mastery';
import { pickModeToResurface, type Mode } from './modes';

const { session: CONFIG, frustration: FRUSTRATION } = ENGINE_CONFIG;

export interface ReviewUnitRef {
  unitKind: 'question_type' | 'word';
  unitId: string;
}

export type SessionPhase = 'warmup' | 'focus' | 'closer' | 'wind_down' | 'ended';

export interface EngineEvent {
  name: EventName;
  props: EventProps;
}

export interface SessionState {
  sessionId: string;
  childId: string;
  phase: SessionPhase;
  secondsActive: number;
  /** min(15, parent setting) × 60 — parent can shorten, never lengthen. */
  capSeconds: number;
  warmup: {
    queue: ReviewUnitRef[];
    index: number;
  };
  focus: {
    caseId: string;
    questionTypeId: string;
    masteryLevel: number;
    attemptCount: number;
    wasCrackedAtStart: boolean;
    adapt: AdaptState;
    itemsServed: number;
    servedItemIds: string[];
    /** Mode content queued to appear before (more) practice. */
    pendingMode: Mode | null;
    /** After 2 misses the engine OFFERS a revisit — never forces (§2). */
    modeRevisitOffered: boolean;
    frustrationBreak: boolean;
    teachbackPending: boolean;
    taughtBack: boolean;
  };
  /**
   * The Boss Round (ADDENDUM-C §1 rung 1): 1–5 exam-format questions closing
   * every session, replacing the single-item closer. Size comes from the
   * intensity matrix (Addendum D §2) via startSession; the child sees no
   * score, ever — completion is the beat.
   */
  bossRound: { size: number; served: number; correct: number };
  /** Events accumulated for the caller to persist (IDs and enums only). */
  pendingEvents: EngineEvent[];
}

export interface StartSessionInputs {
  sessionId: string;
  childId: string;
  /** Prioritised, capped due-review units (scheduler.buildReviewPool). */
  reviewUnits: ReviewUnitRef[];
  /** Word Vault card ids for the warm-up. */
  wordCardIds: string[];
  focusCase: {
    caseId: string;
    questionTypeId: string;
    masteryLevel: number;
    attemptCount: number;
    /** Modes this child has opened for this case — derived from raw events. */
    modesOpened: Mode[];
    tierEstimate: number;
    /**
     * The rolling outcome window persists ACROSS sessions (P5 is "last 10
     * attempts per question type", not per session). Consecutive-miss state
     * never carries over — every session starts fresh and kind.
     */
    recentOutcomes?: boolean[];
    taughtBack: boolean;
  };
  /** Parent-configured session minutes; clamped to [10, 15] — shorten only. */
  parentSessionMinutes?: number;
  /** Boss Round questions, 1–5, from the intensity matrix (Addendum D §2). */
  bossRoundSize?: number;
}

export function startSession(inputs: StartSessionInputs): SessionState {
  const capMinutes = Math.min(
    CONFIG.capMinutes,
    Math.max(CONFIG.parentMinimumMinutes, inputs.parentSessionMinutes ?? CONFIG.capMinutes),
  );

  const warmupReviews = inputs.reviewUnits.slice(0, CONFIG.warmupReviewUnitsMax);
  const wordCards: ReviewUnitRef[] = inputs.wordCardIds
    .slice(0, CONFIG.warmupWordCards)
    .map((wordId) => ({ unitKind: 'word', unitId: wordId }));

  const differentWay = needsDifferentWayIn(
    inputs.focusCase.masteryLevel,
    inputs.focusCase.attemptCount,
  );

  return {
    sessionId: inputs.sessionId,
    childId: inputs.childId,
    phase: 'warmup',
    secondsActive: 0,
    capSeconds: capMinutes * 60,
    warmup: { queue: [...warmupReviews, ...wordCards], index: 0 },
    focus: {
      caseId: inputs.focusCase.caseId,
      questionTypeId: inputs.focusCase.questionTypeId,
      masteryLevel: inputs.focusCase.masteryLevel,
      attemptCount: inputs.focusCase.attemptCount,
      wasCrackedAtStart: isMastered(inputs.focusCase.masteryLevel),
      adapt: {
        ...initialAdaptState(inputs.focusCase.tierEstimate),
        recent: (inputs.focusCase.recentOutcomes ?? []).slice(-ENGINE_CONFIG.band.windowSize),
      },
      itemsServed: 0,
      servedItemIds: [],
      pendingMode: differentWay ? pickModeToResurface(inputs.focusCase.modesOpened) : null,
      modeRevisitOffered: false,
      frustrationBreak: false,
      teachbackPending: false,
      taughtBack: inputs.focusCase.taughtBack,
    },
    bossRound: {
      size: Math.min(5, Math.max(1, Math.round(inputs.bossRoundSize ?? 1))),
      served: 0,
      correct: 0,
    },
    pendingEvents: [
      { name: 'session_started', props: { sessionId: inputs.sessionId } },
      ...warmupReviews.map(
        (unit): EngineEvent => ({
          name: 'review_due_served',
          props: { unitKind: unit.unitKind, unitId: unit.unitId },
        }),
      ),
    ],
  };
}

export type Activity =
  | { kind: 'warmup_item'; unit: ReviewUnitRef }
  | { kind: 'mode_content'; mode: Mode; caseId: string; forced: boolean }
  | { kind: 'practice_item'; questionTypeId: string; targetTier: number; context: 'case_practice' }
  | { kind: 'teachback'; questionTypeId: string; caseId: string }
  | {
      kind: 'closer';
      questionTypeId: string;
      targetTier: number;
      context: 'boss_case';
      round: { index: number; size: number };
    }
  | { kind: 'wind_down' };

function softStopReached(state: SessionState): boolean {
  // A bigger Boss Round reserves more of the cap: intensity changes what
  // fills the fifteen minutes, never how many minutes there are (D §3).
  const reserved =
    CONFIG.softStopBeforeCapMinutes * 60 +
    (state.bossRound.size - 1) * CONFIG.bossRoundSecondsPerQuestion;
  return state.secondsActive >= state.capSeconds - reserved;
}

/**
 * The next thing the child sees. Pure: same state ⇒ same activity.
 * After the soft stop, NO code path issues a new warm-up or practice item —
 * only the closer, teach-back already earned, and the wind-down remain.
 */
export function nextActivity(state: SessionState): { activity: Activity; state: SessionState } {
  const stopped = softStopReached(state);

  if (state.phase === 'warmup') {
    if (!stopped && state.warmup.index < state.warmup.queue.length) {
      return {
        activity: { kind: 'warmup_item', unit: state.warmup.queue[state.warmup.index]! },
        state,
      };
    }
    const next: SessionState = {
      ...state,
      phase: 'focus',
      pendingEvents: [
        ...state.pendingEvents,
        { name: 'warmup_completed', props: { sessionId: state.sessionId, unitsServed: state.warmup.index } },
        ...(stopped ? [{ name: 'session_capped', props: { sessionId: state.sessionId } } as EngineEvent] : []),
      ],
    };
    return nextActivity(next);
  }

  if (state.phase === 'focus') {
    if (state.focus.teachbackPending && !state.focus.taughtBack) {
      return {
        activity: { kind: 'teachback', questionTypeId: state.focus.questionTypeId, caseId: state.focus.caseId },
        state,
      };
    }
    if (stopped || state.focus.frustrationBreak) {
      return nextActivity({ ...state, phase: 'closer' });
    }
    if (state.focus.pendingMode) {
      return {
        activity: {
          kind: 'mode_content',
          mode: state.focus.pendingMode,
          caseId: state.focus.caseId,
          // Forced only for the "different way in" opening; the 2-miss
          // revisit is an offer the child can decline (§2).
          forced: !state.focus.modeRevisitOffered,
        },
        state,
      };
    }
    return {
      activity: {
        kind: 'practice_item',
        questionTypeId: state.focus.questionTypeId,
        targetTier: nextItemTier(state.focus.adapt, state.focus.itemsServed === 0),
        context: 'case_practice',
      },
      state,
    };
  }

  if (state.phase === 'closer') {
    if (state.bossRound.served < state.bossRound.size) {
      return {
        activity: {
          kind: 'closer',
          // The focus type is the DEFAULT; the serving layer mixes in other
          // taught types (Addendum C §2) — core owns the count and the tier.
          questionTypeId: state.focus.questionTypeId,
          targetTier: state.focus.adapt.tierEstimate,
          context: 'boss_case',
          round: { index: state.bossRound.served, size: state.bossRound.size },
        },
        state,
      };
    }
    return nextActivity({ ...state, phase: 'wind_down' });
  }

  return { activity: { kind: 'wind_down' }, state };
}

export interface AttemptSubmission {
  activityKind: 'warmup_item' | 'practice_item' | 'closer';
  itemId?: string;
  itemTier: number;
  correct: boolean;
  /** Foreground interaction seconds since the last submission. */
  secondsElapsed: number;
}

export interface AttemptOutcome {
  state: SessionState;
  /** New mastery for the focus case after this attempt (practice/closer only). */
  focusMastery: number;
  caseJustCracked: boolean;
}

export function submitAttempt(state: SessionState, submission: AttemptSubmission): AttemptOutcome {
  let next = tick(state, submission.secondsElapsed);
  const events: EngineEvent[] = [];

  if (submission.activityKind === 'warmup_item') {
    const unit = next.warmup.queue[next.warmup.index];
    events.push({
      name: 'warmup_item_result',
      props: {
        unitKind: unit?.unitKind ?? 'question_type',
        unitId: unit?.unitId ?? '',
        correct: submission.correct,
      },
    });
    next = {
      ...next,
      warmup: { ...next.warmup, index: next.warmup.index + 1 },
      pendingEvents: [...next.pendingEvents, ...events],
    };
    return { state: next, focusMastery: next.focus.masteryLevel, caseJustCracked: false };
  }

  if (submission.activityKind === 'closer') {
    const served = next.bossRound.served + 1;
    const events: EngineEvent[] = [];
    if (next.bossRound.served === 0) {
      events.push({
        name: 'boss_round_started',
        props: { sessionId: next.sessionId, size: next.bossRound.size },
      });
    }
    const correct = next.bossRound.correct + (submission.correct ? 1 : 0);
    if (served >= next.bossRound.size) {
      events.push({
        name: 'boss_round_completed',
        props: { sessionId: next.sessionId, size: next.bossRound.size, correct },
      });
    }
    next = {
      ...next,
      bossRound: { ...next.bossRound, served, correct },
      pendingEvents: [...next.pendingEvents, ...events],
    };
    return { state: next, focusMastery: next.focus.masteryLevel, caseJustCracked: false };
  }

  // Focus practice: adaptivity + mastery move together.
  const directives = recordOutcome(next.focus.adapt, submission.correct);
  const wasMastered = isMastered(next.focus.masteryLevel);
  const masteryLevel = updateMastery(next.focus.masteryLevel, {
    correct: submission.correct,
    itemTier: submission.itemTier,
    childTier: next.focus.adapt.tierEstimate,
  });
  const caseJustCracked = !wasMastered && !next.focus.wasCrackedAtStart && isMastered(masteryLevel);

  if (directives.stepChange !== 0) {
    events.push({
      name: 'difficulty_stepped',
      props: { questionTypeId: next.focus.questionTypeId, direction: directives.stepChange },
    });
  }
  if (directives.frustrationBreak) {
    events.push({
      name: 'frustration_break_triggered',
      props: { questionTypeId: next.focus.questionTypeId, sessionId: next.sessionId },
    });
  }
  if (caseJustCracked) {
    events.push({ name: 'case_cracked', props: { caseId: next.focus.caseId } });
  }

  next = {
    ...next,
    focus: {
      ...next.focus,
      adapt: directives.state,
      masteryLevel,
      attemptCount: next.focus.attemptCount + 1,
      itemsServed: next.focus.itemsServed + 1,
      servedItemIds: submission.itemId
        ? [...next.focus.servedItemIds, submission.itemId]
        : next.focus.servedItemIds,
      // The 2-miss rule offers (never forces) a Mode revisit.
      pendingMode:
        directives.offerModeRevisit && !next.focus.modeRevisitOffered
          ? pickModeToResurface([])
          : next.focus.pendingMode,
      modeRevisitOffered: next.focus.modeRevisitOffered || directives.offerModeRevisit,
      frustrationBreak: next.focus.frustrationBreak || directives.frustrationBreak,
      teachbackPending: next.focus.teachbackPending || caseJustCracked,
    },
    pendingEvents: [...next.pendingEvents, ...events],
  };

  return { state: next, focusMastery: masteryLevel, caseJustCracked };
}

/**
 * The child opens Mode content (their free choice, or the engine's
 * resurface). Exported as both openMode and chooseMode (§9 API name).
 */
export function openMode(state: SessionState, mode: Mode): SessionState {
  return {
    ...state,
    focus: { ...state.focus, pendingMode: null },
    pendingEvents: [
      ...state.pendingEvents,
      { name: 'mode_opened', props: { caseId: state.focus.caseId, mode } },
    ],
  };
}

export const chooseMode = openMode;

/** The child declines an OFFERED Mode revisit — always allowed. */
export function declineModeOffer(state: SessionState): SessionState {
  return { ...state, focus: { ...state.focus, pendingMode: null } };
}

export function completeMode(state: SessionState, mode: Mode): SessionState {
  return {
    ...state,
    pendingEvents: [
      ...state.pendingEvents,
      { name: 'mode_completed', props: { caseId: state.focus.caseId, mode } },
    ],
  };
}

export function completeTeachback(state: SessionState, success: boolean): SessionState {
  return {
    ...state,
    focus: { ...state.focus, teachbackPending: false, taughtBack: state.focus.taughtBack || success },
    pendingEvents: [
      ...state.pendingEvents,
      { name: 'teachback_completed', props: { caseId: state.focus.caseId, success } },
    ],
  };
}

/** Foreground interaction time only (D2). */
export function tick(state: SessionState, secondsElapsed: number): SessionState {
  const secondsActive = state.secondsActive + Math.max(0, secondsElapsed);
  const crossedSoftStop =
    !softStopReached(state) &&
    secondsActive >= state.capSeconds - CONFIG.softStopBeforeCapMinutes * 60;
  return {
    ...state,
    secondsActive,
    pendingEvents: crossedSoftStop
      ? [...state.pendingEvents, { name: 'session_capped', props: { sessionId: state.sessionId } }]
      : state.pendingEvents,
  };
}

export interface SessionSummary {
  state: SessionState;
  secondsActive: number;
  focusMastery: number;
  taughtBack: boolean;
}

/**
 * A child may stop at ANY moment: partial sessions record everything and
 * punish nothing.
 */
export function endSession(state: SessionState): SessionSummary {
  const ended: SessionState = {
    ...state,
    phase: 'ended',
    pendingEvents: [
      ...state.pendingEvents,
      {
        name: 'session_ended',
        props: { sessionId: state.sessionId, secondsActive: state.secondsActive },
      },
    ],
  };
  return {
    state: ended,
    secondsActive: state.secondsActive,
    focusMastery: state.focus.masteryLevel,
    taughtBack: state.focus.taughtBack,
  };
}

/** Drain accumulated events for persistence (childId attached by the caller). */
export function drainEvents(state: SessionState): { state: SessionState; events: EngineEvent[] } {
  return { state: { ...state, pendingEvents: [] }, events: state.pendingEvents };
}

export const SESSION_LIMITS = {
  capMinutes: CONFIG.capMinutes,
  softStopMinutes: CONFIG.capMinutes - CONFIG.softStopBeforeCapMinutes,
  maxConsecutiveMisses: FRUSTRATION.breakAt,
} as const;
