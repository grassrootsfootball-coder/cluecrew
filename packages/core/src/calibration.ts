/**
 * Empirical item calibration (BUILD-PHASE-3 §2). Simple proportion-correct
 * blended by attempt volume — deliberately not IRT. Items whose calibrated
 * value drifts ≥ DRIFT_FLAG_TIERS from the authored tier are flagged to the
 * CMS review queue: the live QC net for authoring errors, including
 * AI-drafted ones.
 */

export const DRIFT_FLAG_TIERS = 1.5;

/** Attempt volume at which the empirical estimate carries equal weight to the authored prior. */
const PRIOR_WEIGHT_ATTEMPTS = 20;
const MIN_ATTEMPTS_TO_CALIBRATE = 5;

export interface CalibrationResult {
  calibratedDifficulty: number | null;
  driftFlagged: boolean;
}

export function calibrateItem(
  authoredTier: number,
  attempts: Array<{ correct: boolean }>,
): CalibrationResult {
  if (attempts.length < MIN_ATTEMPTS_TO_CALIBRATE) {
    return { calibratedDifficulty: null, driftFlagged: false };
  }

  // Laplace-smoothed proportion correct → difficulty on the 1–5 tier scale
  // (all correct ⇒ 1, none correct ⇒ 5).
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const proportion = (correct + 1) / (attempts.length + 2);
  const empiricalTier = 1 + 4 * (1 - proportion);

  // Blend with the authored prior by volume so thin data cannot yank an item.
  const weight = attempts.length / (attempts.length + PRIOR_WEIGHT_ATTEMPTS);
  const calibrated = weight * empiricalTier + (1 - weight) * authoredTier;

  return {
    calibratedDifficulty: Math.round(calibrated * 100) / 100,
    driftFlagged: Math.abs(calibrated - authoredTier) >= DRIFT_FLAG_TIERS,
  };
}
