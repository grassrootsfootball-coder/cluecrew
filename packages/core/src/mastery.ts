/**
 * Mastery model (P2: mastery gates progression; nothing advances on exposure
 * alone) and adaptive difficulty (P5: target the zone where the child succeeds
 * roughly 70–85% of the time).
 *
 * Phase 1 ships a simple, well-tested exponentially weighted model; live
 * calibration replaces constants later without changing the interface.
 */

/** Mastery is 0–1. A Case is considered "cracked" at or above this level. */
export const MASTERY_THRESHOLD = 0.85;

/** How much a single attempt moves the estimate. Harder items move it more when correct. */
const BASE_WEIGHT = 0.15;

export interface AttemptSignal {
  correct: boolean;
  /** Authored 1–5 difficulty tier of the item. */
  difficultyTier: number;
}

export function updateMastery(current: number, attempt: AttemptSignal): number {
  const difficulty = clamp(attempt.difficultyTier, 1, 5);
  // Correct answers on harder items are stronger evidence of mastery;
  // misses on easier items are stronger evidence it hasn't clicked yet.
  const weight = attempt.correct
    ? BASE_WEIGHT * (0.75 + difficulty * 0.15)
    : BASE_WEIGHT * (0.75 + (6 - difficulty) * 0.15);
  const target = attempt.correct ? 1 : 0;
  return clamp(current + weight * (target - current), 0, 1);
}

export function isMastered(masteryLevel: number): boolean {
  return masteryLevel >= MASTERY_THRESHOLD;
}

/** P5 success band: sustained accuracy outside 70–85% triggers difficulty adjustment, not blame. */
export const SUCCESS_BAND = { min: 0.7, max: 0.85 } as const;

export type DifficultyAdjustment = 'easier' | 'hold' | 'harder';

/**
 * @param recentAccuracy accuracy over the recent attempt window (0–1)
 * @param attemptCount attempts in the window; small samples never trigger adjustment
 */
export function recommendDifficulty(recentAccuracy: number, attemptCount: number): DifficultyAdjustment {
  if (attemptCount < 8) return 'hold';
  if (recentAccuracy < SUCCESS_BAND.min) return 'easier';
  if (recentAccuracy > SUCCESS_BAND.max) return 'harder';
  return 'hold';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
