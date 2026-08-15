/**
 * WHAT COUNTS AS AN N OPTION — one definition, in core, because two would drift.
 *
 * An N option is the "no mistake here" choice on a proofread-style item. `en-n-option-avoidance`
 * describes a child who will not pick it, so the tag is only meaningful on an item that OFFERS
 * one: a carrier whose item has no N option is describing an avoidance the child could not have
 * committed.
 *
 * Calibrated against ENG-003, which holds 18 of 34 items with an N option — the figure Cowork
 * reports independently. A detector that disagreed with that would be measuring something else.
 */
export const N_OPTION = /^\s*n\s*$|^\s*none\s*$|^\s*no (change|mistake|error)\b/i;

export function isNOption(value: unknown): boolean {
  return N_OPTION.test(String(value ?? ''));
}

export function hasNOption(options: ReadonlyArray<{ content: unknown }>): boolean {
  return options.some((o) =>
    isNOption((o.content as { value?: unknown } | null)?.value ?? o.content));
}
