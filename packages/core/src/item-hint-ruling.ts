/**
 * WHAT AN ITEM-HINT RULING WRITES (David's ruling 2, 2026-08-22 — R617).
 *
 * The pure half of the one write site in `apply-all-unlanded.ts`, extracted so a test can hold the
 * two properties the old path violated:
 *
 *   1. **`before === authored` still sets both authorship fields.** An approval is a decision whose
 *      whole content is that the text should stand, and it records like one. The old guard skipped
 *      the entire write, so approve-as-written could only travel through hand-written one-shots.
 *   2. **A ruling is never silently skipped.** Every ruling yields a verdict — REPLACED or
 *      APPROVED_AS_WRITTEN — and the refusal to rewrite unchanged text survives as the ABSENCE of a
 *      text patch, never as the absence of a write.
 */

export interface ItemHintRulingPatch {
  verdict: 'REPLACED' | 'APPROVED_AS_WRITTEN';
  /** Merge into the item's explanation. Never empty: authorship is always present. */
  patch: Record<string, unknown>;
  /** True when the wording changed and must pass the child-facing gate BEFORE this patch is written. */
  gateRequired: boolean;
}

export function itemHintRulingPatch(
  explanation: Record<string, unknown> | null | undefined,
  authored: string,
  authoredBy: string,
  authority: string,
): ItemHintRulingPatch {
  const e = explanation ?? {};
  const before = typeof e.hintCore === 'string' ? e.hintCore : null;
  const textChanges = before !== authored;
  return {
    verdict: textChanges ? 'REPLACED' : 'APPROVED_AS_WRITTEN',
    patch: {
      ...(textChanges
        ? { hintCore: authored, ...(before !== null ? { _previousHintCore: before } : {}) }
        : {}),
      hintAuthoredBy: authoredBy,
      hintAuthority: authority,
    },
    gateRequired: textChanges,
  };
}
