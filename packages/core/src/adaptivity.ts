/**
 * Adaptive difficulty (BUILD-PHASE-3 §2). Target success band 70–85% rolling
 * over the last 10 attempts per question type (P5). The anti-frustration
 * rules are HARD and outrank the band. Sustained scores outside the band
 * trigger difficulty adjustment, not blame.
 */
import { ENGINE_CONFIG } from './config';

const { band: BAND, frustration: FRUSTRATION } = ENGINE_CONFIG;

export interface AdaptState {
  /** The child's estimated tier for this question type, 1–5. */
  tierEstimate: number;
  /** Rolling window of recent attempt outcomes (newest last). */
  recent: boolean[];
  consecutiveMisses: number;
}

export function initialAdaptState(tierEstimate = 2): AdaptState {
  return { tierEstimate: clampTier(tierEstimate), recent: [], consecutiveMisses: 0 };
}

export interface AdaptDirectives {
  state: AdaptState;
  /** −1 | 0 | +1 — the estimate moves one step at a time, never jumps. */
  stepChange: -1 | 0 | 1;
  /** After 2 consecutive misses: offer (never force) a Mode revisit. */
  offerModeRevisit: boolean;
  /**
   * After 3 consecutive misses: the current activity ends on the mascot's
   * encouraging state and the authored "let's look at this another way"
   * transition. There is never a fourth consecutive miss on the same type in
   * one session. This outranks the band.
   */
  frustrationBreak: boolean;
}

export function recordOutcome(state: AdaptState, correct: boolean): AdaptDirectives {
  const recent = [...state.recent, correct].slice(-BAND.windowSize);
  const consecutiveMisses = correct ? 0 : state.consecutiveMisses + 1;

  // Anti-frustration rules first — they outrank the band.
  if (!correct && consecutiveMisses >= FRUSTRATION.breakAt) {
    return {
      state: { ...state, recent, consecutiveMisses },
      stepChange: 0,
      offerModeRevisit: false,
      frustrationBreak: true,
    };
  }
  if (!correct && consecutiveMisses >= FRUSTRATION.easeAndOfferAt) {
    return {
      state: { ...state, recent, consecutiveMisses },
      stepChange: 0,
      offerModeRevisit: true,
      frustrationBreak: false,
    };
  }

  // Band adjustment only on a full window; one step at a time.
  let stepChange: -1 | 0 | 1 = 0;
  let tierEstimate = state.tierEstimate;
  if (recent.length >= BAND.windowSize) {
    const rate = recent.filter(Boolean).length / recent.length;
    if (rate > BAND.max && tierEstimate < 5) {
      stepChange = 1;
      tierEstimate += 1;
    } else if (rate < BAND.min && tierEstimate > 1) {
      stepChange = -1;
      tierEstimate -= 1;
    }
  }

  return {
    state: { tierEstimate, recent: stepChange === 0 ? recent : [], consecutiveMisses },
    stepChange,
    offerModeRevisit: false,
    frustrationBreak: false,
  };
}

/**
 * Which tier the NEXT item should sit at.
 * - Confidence-building open: the first item of any type in any session sits
 *   one tier below estimate (success early stabilises effort).
 * - After 2 consecutive misses: one tier easier.
 */
export function nextItemTier(state: AdaptState, isFirstOfTypeInSession: boolean): number {
  if (isFirstOfTypeInSession) return clampTier(state.tierEstimate - 1);
  if (state.consecutiveMisses >= FRUSTRATION.easeAndOfferAt) return clampTier(state.tierEstimate - 1);
  return clampTier(state.tierEstimate);
}

export interface SelectableItem {
  id: string;
  tier: number;
  /**
   * ADDENDUM-B §1. Practice selection refuses MOCK items unconditionally: a
   * mock only measures if the child has not seen its questions, so mock items
   * are held out from practice permanently. Optional so existing callers whose
   * rows predate the field keep working — absent means PRACTICE.
   */
  pool?: 'PRACTICE' | 'MOCK';
}

/**
 * Closest-tier selection from LIVE items, avoiding repeats within a session.
 * MOCK-pool items are excluded here, at the last line of defence, regardless
 * of what a caller passes in (Addendum B §1) — the orchestrator also filters
 * its query, but the guarantee lives where every practice/warm-up/review path
 * converges.
 */
export function selectItem<T extends SelectableItem>(
  items: T[],
  targetTier: number,
  excludeIds: ReadonlySet<string> = new Set(),
): T | null {
  const candidates = items.filter((item) => item.pool !== 'MOCK' && !excludeIds.has(item.id));
  if (candidates.length === 0) return null;
  return candidates.reduce((best, item) => {
    const bestDistance = Math.abs(best.tier - targetTier);
    const distance = Math.abs(item.tier - targetTier);
    return distance < bestDistance ? item : best;
  });
}

function clampTier(tier: number): number {
  return Math.min(5, Math.max(1, Math.round(tier)));
}
