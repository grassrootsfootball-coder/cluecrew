/**
 * The five Modes (BUILD-PHASE-3 §5) — and the L2 firewall.
 *
 * ── THE L2 FIREWALL ─────────────────────────────────────────────────────────
 * The system must not compute, store, or infer any "preferred learning
 * style", modality profile, or learner-type label from Mode choices. No
 * field, no derived analytics dimension, no recommendation weighting by
 * modality. Mode choice history exists ONLY as raw events and the single
 * "last used" pointer (ChildProfile.lastUsedMode, a UI convenience).
 *
 * Reviewer instruction: reject any PR adding a modality-shaped column,
 * score, aggregate, or helper to this file or anywhere else. Any future
 * feature wanting modality inference must amend the manifesto first.
 * A CI grep (scripts/check-l2-firewall.mjs) backs this up.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const MODES = ['watch', 'walk', 'see', 'hear', 'try'] as const;
export type Mode = (typeof MODES)[number];

/** Explanation modes — 'try' is practice entry, not an explanation. */
export const EXPLANATION_MODES: readonly Mode[] = ['watch', 'walk', 'see', 'hear'];

export function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

/**
 * "Needs a different way in" support (P1): pick a not-yet-tried explanation
 * Mode to resurface before more practice. `modesOpened` is derived from raw
 * events by the caller — it is never stored as a column.
 */
export function pickModeToResurface(modesOpened: readonly Mode[]): Mode {
  const untried = EXPLANATION_MODES.find((mode) => !modesOpened.includes(mode));
  // Every mode tried already? Rotate back to the walk-through — the mode
  // built for step-by-step repair. This is content logic, not a learner label.
  return untried ?? 'walk';
}
