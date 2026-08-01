import { describe, expect, it } from 'vitest';
import {
  drainEvents,
  endSession,
  nextActivity,
  openMode,
  declineModeOffer,
  completeFluencyRound,
  completeTeachback,
  startSession,
  submitAttempt,
  tick,
  type SessionState,
  type StartSessionInputs,
} from './session';

function makeSession(overrides: Partial<StartSessionInputs> = {}): SessionState {
  return startSession({
    sessionId: 's1',
    childId: 'c1',
    reviewUnits: [
      { unitKind: 'word', unitId: 'w1' },
      { unitKind: 'word', unitId: 'w2' },
      { unitKind: 'question_type', unitId: 'vr-11' },
      { unitKind: 'question_type', unitId: 'vr-08' },
    ],
    wordCardIds: ['card1', 'card2', 'card3'],
    focusCase: {
      caseId: 'case-vr-11',
      questionTypeId: 'vr-11-number-series',
      masteryLevel: 0.5,
      attemptCount: 5,
      modesOpened: [],
      tierEstimate: 3,
      taughtBack: false,
    },
    ...overrides,
  });
}

function drainAll(state: SessionState) {
  return drainEvents(state).events.map((event) => event.name);
}

describe('the Daily Loop composition (P2: retrieval first, no exceptions)', () => {
  it('opens with warm-up, then focus, then closer, then wind-down', () => {
    let state = makeSession();
    // 4 review units + 3 word cards = 7 warm-up items
    for (let i = 0; i < 7; i++) {
      const { activity } = nextActivity(state);
      expect(activity.kind).toBe('warmup_item');
      state = submitAttempt(state, {
        activityKind: 'warmup_item',
        itemTier: 2,
        correct: true,
        secondsElapsed: 20,
      }).state;
    }
    expect(nextActivity(state).activity.kind).toBe('practice_item');

    // Practice a while (all correct — no frustration), then simulate the clock.
    state = tick(state, 13 * 60);
    const { activity } = nextActivity(state);
    expect(activity.kind).toBe('closer');
    state = submitAttempt(state, { activityKind: 'closer', itemTier: 3, correct: false, secondsElapsed: 30 }).state;
    expect(nextActivity(state).activity.kind).toBe('wind_down');
  });

  it('the closer is exam-formatted boss_case context at the estimate tier (P4)', () => {
    let state = makeSession({ reviewUnits: [], wordCardIds: [] });
    state = tick(state, 13 * 60);
    const { activity } = nextActivity(state);
    if (activity.kind !== 'closer') throw new Error('expected closer');
    expect(activity.context).toBe('boss_case');
    expect(activity.targetTier).toBe(3);
  });
});

describe('15-minute cap (D2, gate #7)', () => {
  it('stops issuing new items at 13 minutes and emits session_capped', () => {
    let state = makeSession();
    state = tick(state, 13 * 60);
    const { activity } = nextActivity(state);
    expect(['closer', 'wind_down']).toContain(activity.kind);
    expect(drainAll(state)).toContain('session_capped');
  });

  it('no code path issues a practice item after the soft stop', () => {
    let state = makeSession({ reviewUnits: [], wordCardIds: [] });
    // Enter focus, answer one item, then cross the cap mid-focus.
    state = submitAttempt(state, { activityKind: 'practice_item', itemTier: 2, correct: true, secondsElapsed: 12 * 60 + 55 }).state;
    state = tick(state, 10);
    for (let i = 0; i < 5; i++) {
      const { activity, state: next } = nextActivity(state);
      expect(activity.kind).not.toBe('practice_item');
      expect(activity.kind).not.toBe('warmup_item');
      state = next;
      if (activity.kind === 'closer') {
        state = submitAttempt(state, { activityKind: 'closer', itemTier: 3, correct: true, secondsElapsed: 20 }).state;
      }
      if (activity.kind === 'wind_down') break;
    }
  });

  it('a parent setting can shorten the session but NEVER lengthen it', () => {
    const shortened = makeSession({ parentSessionMinutes: 10 });
    expect(shortened.capSeconds).toBe(10 * 60);
    const attemptedLengthen = makeSession({ parentSessionMinutes: 45 });
    expect(attemptedLengthen.capSeconds).toBe(15 * 60);
    const attemptedTooShort = makeSession({ parentSessionMinutes: 3 });
    expect(attemptedTooShort.capSeconds).toBe(10 * 60);
  });
});

describe('frustration break inside a session (never a 4th consecutive miss)', () => {
  function focusState(): SessionState {
    return makeSession({ reviewUnits: [], wordCardIds: [] });
  }

  it('2 misses → offered (not forced) mode revisit; child may decline', () => {
    let state = focusState();
    state = submitAttempt(state, { activityKind: 'practice_item', itemTier: 2, correct: false, secondsElapsed: 30 }).state;
    state = submitAttempt(state, { activityKind: 'practice_item', itemTier: 2, correct: false, secondsElapsed: 30 }).state;
    const { activity } = nextActivity(state);
    if (activity.kind !== 'mode_content') throw new Error('expected mode offer');
    expect(activity.forced).toBe(false);
    // Declining is always allowed and returns to practice, one tier easier.
    state = declineModeOffer(state);
    const after = nextActivity(state);
    if (after.activity.kind !== 'practice_item') throw new Error('expected practice');
    expect(after.activity.targetTier).toBe(2);
  });

  it('3 misses → the activity ends via closer + wind-down; no more practice items', () => {
    let state = focusState();
    for (let i = 0; i < 3; i++) {
      state = submitAttempt(state, { activityKind: 'practice_item', itemTier: 2, correct: false, secondsElapsed: 30 }).state;
    }
    expect(drainAll(state)).toContain('frustration_break_triggered');
    const { activity } = nextActivity(state);
    expect(activity.kind).toBe('closer');
  });
});

describe('"different way in" (P1 doing real work)', () => {
  it('low mastery after ≥10 attempts puts Mode content before practice', () => {
    let state = makeSession({
      reviewUnits: [],
      wordCardIds: [],
      focusCase: {
        caseId: 'case-vr-11',
        questionTypeId: 'vr-11-number-series',
        masteryLevel: 0.3,
        attemptCount: 12,
        modesOpened: ['watch'],
        tierEstimate: 2,
        taughtBack: false,
      },
    });
    const { activity } = nextActivity(state);
    if (activity.kind !== 'mode_content') throw new Error('expected mode content first');
    expect(activity.forced).toBe(true);
    expect(activity.mode).toBe('walk'); // first untried explanation mode
    state = openMode(state, activity.mode);
    expect(nextActivity(state).activity.kind).toBe('practice_item');
  });
});

describe('teach-back trigger and cracked detection', () => {
  it('cracking the case mid-session queues teach-back before the closer', () => {
    let state = makeSession({
      reviewUnits: [],
      wordCardIds: [],
      focusCase: {
        caseId: 'case-vr-11',
        questionTypeId: 'vr-11-number-series',
        masteryLevel: 0.78,
        attemptCount: 20,
        modesOpened: [],
        tierEstimate: 3,
        taughtBack: false,
      },
    });
    let cracked = false;
    for (let i = 0; i < 5 && !cracked; i++) {
      const outcome = submitAttempt(state, { activityKind: 'practice_item', itemTier: 4, correct: true, secondsElapsed: 20 });
      state = outcome.state;
      cracked = outcome.caseJustCracked;
    }
    expect(cracked).toBe(true);
    expect(drainAll(state)).toContain('case_cracked');
    const { activity } = nextActivity(state);
    expect(activity.kind).toBe('teachback');
    state = completeTeachback(state, true);
    expect(state.focus.taughtBack).toBe(true);
  });
});

describe('stopping early punishes nothing', () => {
  it('endSession works from any phase and records everything', () => {
    let state = makeSession();
    state = submitAttempt(state, { activityKind: 'warmup_item', itemTier: 2, correct: false, secondsElapsed: 45 }).state;
    const summary = endSession(state);
    expect(summary.secondsActive).toBe(45);
    const names = drainEvents(summary.state).events.map((event) => event.name);
    expect(names).toContain('session_started');
    expect(names).toContain('warmup_item_result');
    expect(names).toContain('session_ended');
    // No punitive event exists in the vocabulary at all.
    expect(names.join(',')).not.toMatch(/lost|broken|penal/);
  });
});

describe('the fluency round (BUILD-DISTRICT-MATHS §6, wired by ruling 2026-08-01)', () => {
  it('opens the warm-up when the intensity column asks for it, and only then', () => {
    const withFluency = makeSession({ fluency: 'standard' });
    const first = nextActivity(withFluency);
    expect(first.activity).toEqual({ kind: 'fluency_round', intensity: 'standard' });

    const without = makeSession();
    expect(nextActivity(without).activity.kind).toBe('warmup_item');
  });

  it('charges its seconds against the D2 cap, clamped to the 90s envelope', () => {
    const state = makeSession({ fluency: 'light' });
    const after = completeFluencyRound(state, {
      correctCount: 6,
      questionCount: 8,
      secondsElapsed: 600, // a wedged client cannot spend ten minutes here
    });
    expect(after.secondsActive).toBe(90);
    expect(after.warmup.fluencyDone).toBe(true);
    // The round is done: the warm-up queue takes over.
    expect(nextActivity(after).activity.kind).toBe('warmup_item');
  });

  it('never outranks the cap: at the soft stop the round is skipped like everything else', () => {
    let state = makeSession({ fluency: 'standard' });
    state = tick(state, state.capSeconds); // an exhausted session
    const next = nextActivity(state);
    expect(next.activity.kind).not.toBe('fluency_round');
    expect(next.activity.kind).not.toBe('warmup_item');
  });

  it('reports facts through the existing warm-up event — streak logic untouched', () => {
    const state = makeSession({ fluency: 'light' });
    const after = completeFluencyRound(state, { correctCount: 8, questionCount: 8, secondsElapsed: 62 });
    const drained = drainEvents(after).events;
    const fluencyEvent = drained.find(
      (event) => event.name === 'warmup_item_result' && event.props.fluency === true,
    );
    expect(fluencyEvent?.props).toMatchObject({ correct: 8, of: 8 });
  });
});
