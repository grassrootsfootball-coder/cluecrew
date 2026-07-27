/**
 * Spaced-retrieval scheduling (P2: the spine — every session opens with review
 * of previously mastered material). SM-2-derived intervals, tuned gently:
 * a lapse is a clue, not a reset to zero.
 */

export interface ReviewState {
  intervalDays: number;
  easeFactor: number;
  lapses: number;
}

export const INITIAL_REVIEW_STATE: ReviewState = {
  intervalDays: 1,
  easeFactor: 2.3,
  lapses: 0,
};

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

export type ReviewOutcome = 'again' | 'good' | 'easy';

export interface ScheduledReview extends ReviewState {
  dueAt: Date;
}

export function scheduleNextReview(state: ReviewState, outcome: ReviewOutcome, now: Date): ScheduledReview {
  let { intervalDays, easeFactor, lapses } = state;

  if (outcome === 'again') {
    lapses += 1;
    easeFactor = clamp(easeFactor - 0.2, MIN_EASE, MAX_EASE);
    // Gentle lapse handling: drop to a short interval, not all the way back.
    intervalDays = Math.max(1, intervalDays * 0.25);
  } else {
    if (outcome === 'easy') easeFactor = clamp(easeFactor + 0.1, MIN_EASE, MAX_EASE);
    intervalDays = intervalDays <= 1 ? (outcome === 'easy' ? 4 : 2) : intervalDays * easeFactor;
  }

  intervalDays = Math.min(intervalDays, 120); // cap: nothing disappears for a whole term

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return { intervalDays, easeFactor, lapses, dueAt };
}

export interface DueUnit {
  unitKind: 'question_type' | 'word';
  unitId: string;
  dueAt: Date;
}

/** Most-overdue first; that is the warm-up order. */
export function sortForWarmup<T extends DueUnit>(units: T[], now: Date): T[] {
  return [...units]
    .filter((u) => u.dueAt.getTime() <= now.getTime())
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
