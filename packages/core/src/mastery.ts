/**
 * Mastery model (BUILD-PHASE-3 §1). masteryLevel ∈ [0,1] per CaseFile and per
 * WordVaultEntry. Exponential moving average with difficulty-relative α, lazy
 * time decay that never punishes, and config-driven thresholds.
 */
import { ENGINE_CONFIG } from './config';

const { mastery: CONFIG } = ENGINE_CONFIG;

export interface MasteryAttempt {
  correct: boolean;
  /** Item difficulty tier 1–5 (calibrated where available). */
  itemTier: number;
  /** The child's current estimated tier for this question type. */
  childTier: number;
}

/**
 * m' = m + α(target − m). α scales with item difficulty relative to the
 * child's level: harder-than-level correct answers move mastery up more;
 * easier-than-level misses move it down less (a miss on an easy item is
 * noise, not collapse).
 */
export function updateMastery(current: number, attempt: MasteryAttempt): number {
  const relative = clamp(attempt.itemTier, 1, 5) - clamp(attempt.childTier, 1, 5);
  const alpha = attempt.correct
    ? CONFIG.baseAlpha * clamp(1 + 0.25 * relative, 0.5, 2)
    : CONFIG.baseAlpha * clamp(1 + 0.3 * relative, 0.3, 1.2);
  const target = attempt.correct ? 1 : 0;
  return clamp(current + alpha * (target - current), 0, 1);
}

export interface DecayResult {
  masteryLevel: number;
  /** True when decay on a cracked case hit the floor — schedule review instead of dropping (P2). */
  triggersReview: boolean;
}

/**
 * Lazy decay, applied at read time: mastery decays toward decayFloorFactor ×
 * its value over decayDays without practice. Decay never drops a cracked
 * case below the cracked threshold — it triggers review scheduling instead;
 * it does not punish.
 */
export function applyDecay(current: number, daysSincePractice: number, isCracked: boolean): DecayResult {
  if (daysSincePractice <= 0) return { masteryLevel: current, triggersReview: false };
  const progress = Math.min(daysSincePractice, CONFIG.decayDays) / CONFIG.decayDays;
  const decayed = current * (1 - (1 - CONFIG.decayFloorFactor) * progress);
  if (isCracked && decayed < CONFIG.cracked) {
    return { masteryLevel: CONFIG.cracked, triggersReview: true };
  }
  return { masteryLevel: decayed, triggersReview: false };
}

export type MasteryStatus = 'not_yet' | 'progressing' | 'cracked';

export function masteryStatus(masteryLevel: number): MasteryStatus {
  if (masteryLevel >= CONFIG.cracked) return 'cracked';
  if (masteryLevel >= CONFIG.progressing) return 'progressing';
  return 'not_yet';
}

export function isMastered(masteryLevel: number): boolean {
  return masteryLevel >= CONFIG.cracked;
}

/**
 * "Needs a different way in" (P1 doing real work): low mastery after real
 * effort means the explanation is wrong for this child, not the child —
 * resurface a not-yet-tried Mode before more practice.
 */
export function needsDifferentWayIn(masteryLevel: number, attemptCount: number): boolean {
  return attemptCount >= CONFIG.differentWayMinAttempts && masteryLevel < CONFIG.differentWayBelow;
}

export function applyTeachbackBump(current: number): number {
  return clamp(current + CONFIG.teachbackBump, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
