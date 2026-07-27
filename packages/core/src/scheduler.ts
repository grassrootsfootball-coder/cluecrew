/**
 * Spaced repetition (BUILD-PHASE-3 §3). SM-2 family, tuned for children and
 * an exam horizon: short opening ladder, 21-day max interval, and automatic
 * exam-horizon compression — no separate "revision mode" to build or explain.
 */
import { ENGINE_CONFIG } from './config';

const { scheduler: CONFIG } = ENGINE_CONFIG;

export interface ReviewState {
  intervalDays: number;
  easeFactor: number;
  lapses: number;
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  intervalDays: CONFIG.firstIntervals[0],
  easeFactor: 2.3,
  lapses: 0,
};

export interface ScheduledReview extends ReviewState {
  dueAt: Date;
}

export interface ScheduleContext {
  now: Date;
  /** The child's exam date, when known — drives horizon compression. */
  examDate?: Date | null;
}

export function scheduleNextReview(
  state: ReviewState,
  outcome: 'success' | 'lapse',
  context: ScheduleContext,
): ScheduledReview {
  let { intervalDays, easeFactor, lapses } = state;

  if (outcome === 'lapse') {
    easeFactor = Math.max(CONFIG.easeMin, easeFactor - CONFIG.easeLoss);
    intervalDays = 1;
    lapses += 1;
  } else {
    easeFactor = Math.min(CONFIG.easeMax, easeFactor + CONFIG.easeGain);
    // Child-tuned opening ladder 1 → 3 → 7, then multiplicative growth.
    if (intervalDays < CONFIG.firstIntervals[1]) intervalDays = CONFIG.firstIntervals[1];
    else if (intervalDays < CONFIG.firstIntervals[2]) intervalDays = CONFIG.firstIntervals[2];
    else intervalDays = intervalDays * easeFactor;
  }

  intervalDays = Math.min(intervalDays, CONFIG.maxIntervalDays);

  // Exam-horizon compression: review frequency tightens automatically as the
  // exam approaches.
  if (context.examDate) {
    const daysUntilExam = (context.examDate.getTime() - context.now.getTime()) / 86_400_000;
    if (daysUntilExam > 0) {
      intervalDays = Math.min(intervalDays, Math.max(1, daysUntilExam / CONFIG.examHorizonDivisor));
    }
  }

  intervalDays = Math.max(1, intervalDays);
  return {
    intervalDays,
    easeFactor,
    lapses,
    dueAt: new Date(context.now.getTime() + intervalDays * 86_400_000),
  };
}

export interface ReviewUnit {
  unitKind: 'question_type' | 'word';
  unitId: string;
  dueAt: Date;
  lapses: number;
}

/**
 * Session review pool (§3): due units only, priority overdue-longest first,
 * then lapse count, then words before types (vocabulary is the compounding
 * asset). Capped; overflow rolls forward silently — the child never sees a
 * backlog number.
 */
export function buildReviewPool<T extends ReviewUnit>(
  units: T[],
  now: Date,
  cap: number = CONFIG.dailyReviewCap,
): T[] {
  return units
    .filter((unit) => unit.dueAt.getTime() <= now.getTime())
    .sort((a, b) => {
      const overdue = a.dueAt.getTime() - b.dueAt.getTime();
      if (overdue !== 0) return overdue;
      if (a.lapses !== b.lapses) return b.lapses - a.lapses;
      if (a.unitKind !== b.unitKind) return a.unitKind === 'word' ? -1 : 1;
      return a.unitId.localeCompare(b.unitId);
    })
    .slice(0, cap);
}
