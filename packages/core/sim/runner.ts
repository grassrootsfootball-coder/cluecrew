/**
 * Simulation runner (BUILD-PHASE-3 §10): drives the REAL engine — session
 * reducer, adaptivity, mastery, scheduler — for 90 simulated days per
 * learner profile. These simulations are the pedagogy laws' unit tests.
 */
import {
  applyDecay,
  buildReviewPool,
  drainEvents,
  endSession,
  isMastered,
  nextActivity,
  openMode,
  completeMode,
  completeTeachback,
  scheduleNextReview,
  startSession,
  submitAttempt,
  tick,
  INITIAL_REVIEW_STATE,
  type EngineEvent,
  type Mode,
  type ReviewState,
  type SessionState,
} from '../src/index';
import { INTENSITY_MATRIX, type IntensityColumn } from '../src/intensity';
import { makeRandom, pCorrect, type LearnerProfile } from './learners';

const QUESTION_TYPES = ['vr-01', 'vr-08', 'vr-09', 'vr-10', 'vr-11', 'vr-12'];
const WORD_COUNT = 30;
const DAY_MS = 86_400_000;
const SIM_START = new Date('2026-09-01T16:00:00Z');

interface SimCase {
  caseId: string;
  typeId: string;
  mastery: number;
  attempts: number;
  taughtBack: boolean;
  crackedOnDay: number | null;
  firstOpenedDay: number | null;
  lastPracticedDay: number | null;
  modesOpened: Mode[];
  everUncrackedByDecay: boolean;
}

interface SimReviewUnit {
  unitKind: 'question_type' | 'word';
  unitId: string;
  state: ReviewState;
  dueAt: Date;
}

export interface DailyStat {
  day: number;
  attended: boolean;
  practiceAttempts: number;
  practiceCorrect: number;
  tierEstimate: number;
  meanMastery: number;
  endedOnCompletionBeat: boolean;
  frustrationBreak: boolean;
  reviewPoolSize: number;
  maxMissStreak: number;
  secondsActive: number;
  bossRoundQuestions: number;
  newCaseOpened: boolean;
}

export interface SimResult {
  profile: string;
  days: DailyStat[];
  events: EngineEvent[];
  casesCracked: number;
  everFourConsecutiveMisses: boolean;
  crackedEverUncrackedByDecay: boolean;
  maxReviewPoolSize: number;
  scheduledIntervals: Array<{ day: number; intervalDays: number }>;
  finalAbility: number;
  /** Case types first opened after day 0 — the final stretch must add none. */
  newTypesOpened: number;
}

export interface SimOptions {
  daysToSimulate?: number;
  /** Exam date as a day index from sim start (drives horizon compression). */
  examDayIndex?: number | null;
  seed?: number;
  /** Addendum D §2: run the whole simulation in one matrix column. */
  intensityColumn?: IntensityColumn;
}

export function runSimulation(profile: LearnerProfile, options: SimOptions = {}): SimResult {
  const daysToSimulate = options.daysToSimulate ?? 90;
  const examDate =
    options.examDayIndex != null ? new Date(SIM_START.getTime() + options.examDayIndex * DAY_MS) : null;
  const random = makeRandom(options.seed ?? 42);
  const levers = INTENSITY_MATRIX[options.intensityColumn ?? 'building'];

  let ability = profile.startAbility;
  const cases: SimCase[] = QUESTION_TYPES.map((typeId) => ({
    caseId: `case-${typeId}`,
    typeId,
    mastery: 0,
    attempts: 0,
    taughtBack: false,
    crackedOnDay: null,
    firstOpenedDay: null,
    lastPracticedDay: null,
    modesOpened: [],
    everUncrackedByDecay: false,
  }));
  const tierEstimates = new Map<string, number>(QUESTION_TYPES.map((typeId) => [typeId, 2]));
  const recentByType = new Map<string, boolean[]>(QUESTION_TYPES.map((typeId) => [typeId, []]));
  const reviews = new Map<string, SimReviewUnit>();
  for (let wordIndex = 0; wordIndex < WORD_COUNT; wordIndex++) {
    reviews.set(`word-${wordIndex}`, {
      unitKind: 'word',
      unitId: `word-${wordIndex}`,
      state: { ...INITIAL_REVIEW_STATE },
      dueAt: new Date(SIM_START.getTime() + (wordIndex % 7) * DAY_MS),
    });
  }

  const result: SimResult = {
    profile: profile.name,
    days: [],
    events: [],
    casesCracked: 0,
    everFourConsecutiveMisses: false,
    crackedEverUncrackedByDecay: false,
    maxReviewPoolSize: 0,
    scheduledIntervals: [],
    finalAbility: ability,
    newTypesOpened: 0,
  };

  for (let day = 0; day < daysToSimulate; day++) {
    const now = new Date(SIM_START.getTime() + day * DAY_MS);
    const attended = profile.attends(day, random);
    const mood = (random() * 2 - 1) * profile.noise;

    if (!attended) {
      result.days.push({
        day,
        attended: false,
        practiceAttempts: 0,
        practiceCorrect: 0,
        tierEstimate: meanTier(tierEstimates),
        meanMastery: meanMastery(cases),
        endedOnCompletionBeat: false,
        frustrationBreak: false,
        reviewPoolSize: 0,
        maxMissStreak: 0,
        secondsActive: 0,
        bossRoundQuestions: 0,
        newCaseOpened: false,
      });
      continue;
    }

    // Lazy decay at read time for the focus candidate pool.
    for (const simCase of cases) {
      if (simCase.lastPracticedDay === null) continue;
      const idleDays = day - simCase.lastPracticedDay;
      if (idleDays <= 0) continue;
      const wasCracked = simCase.crackedOnDay !== null;
      const decayed = applyDecay(simCase.mastery, idleDays, wasCracked);
      simCase.mastery = decayed.masteryLevel;
      if (wasCracked && !isMastered(simCase.mastery)) simCase.everUncrackedByDecay = true;
      if (decayed.triggersReview) {
        const unit = reviews.get(simCase.typeId);
        if (unit && unit.dueAt.getTime() > now.getTime()) unit.dueAt = now;
      }
    }

    const pool = buildReviewPool(
      [...reviews.values()].map((unit) => ({ ...unit, lapses: unit.state.lapses })),
      now,
      levers.reviewLoadCap,
    );
    result.maxReviewPoolSize = Math.max(result.maxReviewPoolSize, pool.length);

    const startedUncracked = cases.find(
      (simCase) => simCase.attempts > 0 && simCase.crackedOnDay === null,
    );
    const nextNew = cases.find((simCase) => simCase.attempts === 0);
    const lastOpenedDay = cases.reduce<number | null>(
      (latest, simCase) =>
        simCase.firstOpenedDay !== null &&
        (latest === null || simCase.firstOpenedDay > latest)
          ? simCase.firstOpenedDay
          : latest,
      null,
    );
    const newCaseAllowed =
      levers.newCasesPerWeek > 0 &&
      (levers.coverageDriven ||
        lastOpenedDay === null ||
        day - lastOpenedDay >= 7 / levers.newCasesPerWeek);
    const leastMastered = [...cases]
      .filter((simCase) => simCase.attempts > 0)
      .sort((a, b) => a.mastery - b.mastery)[0];
    const focus =
      startedUncracked ??
      (newCaseAllowed ? nextNew : undefined) ??
      leastMastered ??
      nextNew ??
      cases[cases.length - 1]!;
    const isNewOpen = focus.attempts === 0;
    if (isNewOpen && day > 0) result.newTypesOpened += 1;
    if (focus.firstOpenedDay === null) focus.firstOpenedDay = day;
    let state: SessionState = startSession({
      bossRoundSize: levers.bossRoundSize,
      sessionId: `s-${profile.name}-${day}`,
      childId: `sim-${profile.name}`,
      reviewUnits: pool.map((unit) => ({ unitKind: unit.unitKind, unitId: unit.unitId })),
      wordCardIds: [`word-${day % WORD_COUNT}`, `word-${(day + 1) % WORD_COUNT}`, `word-${(day + 2) % WORD_COUNT}`],
      focusCase: {
        caseId: focus.caseId,
        questionTypeId: focus.typeId,
        masteryLevel: focus.mastery,
        attemptCount: focus.attempts,
        modesOpened: focus.modesOpened,
        tierEstimate: tierEstimates.get(focus.typeId)!,
        recentOutcomes: recentByType.get(focus.typeId)!,
        taughtBack: focus.taughtBack,
      },
    });

    let practiceAttempts = 0;
    let practiceCorrect = 0;
    let missStreak = 0;
    let maxMissStreak = 0;
    let frustrationBreak = false;
    let closerAnswered = false;
    let bossRoundQuestions = 0;

    let guard = 0;
    while (guard++ < 200) {
      const { activity, state: advanced } = nextActivity(state);
      state = advanced;

      if (activity.kind === 'wind_down') break;

      if (activity.kind === 'warmup_item') {
        const unit = reviews.get(activity.unit.unitId);
        const tier = unit?.unitKind === 'word' ? 1.6 : tierEstimates.get(activity.unit.unitId) ?? 2;
        const correct = random() < pCorrect(ability, tier, mood);
        state = submitAttempt(state, {
          activityKind: 'warmup_item',
          itemTier: Math.round(tier),
          correct,
          secondsElapsed: 18 + Math.floor(random() * 14),
        }).state;
        if (unit) {
          const scheduled = scheduleNextReview(unit.state, correct ? 'success' : 'lapse', { now, examDate });
          unit.state = scheduled;
          unit.dueAt = scheduled.dueAt;
          result.scheduledIntervals.push({ day, intervalDays: scheduled.intervalDays });
        }
        continue;
      }

      if (activity.kind === 'mode_content') {
        state = openMode(state, activity.mode);
        if (!focus.modesOpened.includes(activity.mode)) focus.modesOpened.push(activity.mode);
        state = completeMode(state, activity.mode);
        // Mode content takes real time (a Watch clip is up to 90s).
        state = tick(state, 60 + Math.floor(random() * 30));
        continue;
      }

      if (activity.kind === 'practice_item' || activity.kind === 'closer') {
        const correct = random() < pCorrect(ability, activity.targetTier, mood);
        const outcome = submitAttempt(state, {
          activityKind: activity.kind,
          itemId: `${activity.questionTypeId}-t${activity.targetTier}-${guard}`,
          itemTier: activity.targetTier,
          correct,
          secondsElapsed: 25 + Math.floor(random() * 20),
        });
        state = outcome.state;

        if (activity.kind === 'closer') {
          closerAnswered = true;
          bossRoundQuestions += 1;
          continue;
        }

        practiceAttempts += 1;
        if (correct) {
          practiceCorrect += 1;
          missStreak = 0;
          ability += profile.learnRate * (profile.maxAbility - ability);
        } else {
          missStreak += 1;
          maxMissStreak = Math.max(maxMissStreak, missStreak);
          ability += 0.3 * profile.learnRate * (profile.maxAbility - ability);
        }
        focus.mastery = outcome.focusMastery;
        focus.attempts += 1;
        focus.lastPracticedDay = day;
        if (outcome.caseJustCracked) {
          focus.crackedOnDay = day;
          result.casesCracked += 1;
        }
        if (state.focus.frustrationBreak) frustrationBreak = true;
        continue;
      }

      if (activity.kind === 'teachback') {
        const success = random() < 0.85;
        state = completeTeachback(state, success);
        if (success) focus.taughtBack = true;
        state = tick(state, 45 + Math.floor(random() * 30));
        continue;
      }
    }

    const summary = endSession(state);
    tierEstimates.set(focus.typeId, state.focus.adapt.tierEstimate);
    recentByType.set(focus.typeId, state.focus.adapt.recent);
    const drained = drainEvents(summary.state);
    result.events.push(...drained.events);
    if (maxMissStreak >= 4) result.everFourConsecutiveMisses = true;

    result.days.push({
      day,
      attended: true,
      practiceAttempts,
      practiceCorrect,
      tierEstimate: meanTier(tierEstimates),
      meanMastery: meanMastery(cases),
      endedOnCompletionBeat: closerAnswered && !frustrationBreak,
      frustrationBreak,
      reviewPoolSize: pool.length,
      maxMissStreak,
      secondsActive: summary.secondsActive,
      bossRoundQuestions,
      newCaseOpened: isNewOpen,
    });
  }

  result.crackedEverUncrackedByDecay = cases.some((simCase) => simCase.everUncrackedByDecay);
  result.finalAbility = ability;
  return result;
}

function meanTier(tierEstimates: Map<string, number>): number {
  const values = [...tierEstimates.values()];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanMastery(cases: SimCase[]): number {
  return cases.reduce((sum, simCase) => sum + simCase.mastery, 0) / cases.length;
}

/** Rolling practice success over the trailing `window` attended days. */
export function trailingSuccessRate(result: SimResult, window: number): number {
  const attended = result.days.filter((day) => day.attended && day.practiceAttempts > 0).slice(-window);
  const attempts = attended.reduce((sum, day) => sum + day.practiceAttempts, 0);
  const correct = attended.reduce((sum, day) => sum + day.practiceCorrect, 0);
  return attempts === 0 ? 0 : correct / attempts;
}
