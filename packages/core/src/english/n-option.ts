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

/**
 * THE ZERO-OPTION: "no word is needed" on a cloze item (Annie's ruling, 2026-08-19 — R251).
 *
 * **IT IS THE SAME CLASS AS N AND WAS NOT BEING TREATED AS ONE.** A cloze card's options are
 * candidate WORDS; this one is a VERDICT ABOUT THE SENTENCE — that no word belongs in the gap at
 * all. `A2` and `B8` each carry one.
 *
 * That difference matters because **cloze options shuffle and error-spot options do not.** The
 * shuffle exempts error-spot wholesale, on the reasoning that its options are consecutive segments
 * of one sentence; cloze was left shuffling on the stated assumption that "its options are word
 * choices, not pieces of the carrier". **These two are the counter-example to that assumption.**
 * The day the shuffle lands them first, a child opens a card whose opening choice is *no word is
 * needed* before she has read a single candidate — a verdict offered before there is anything to
 * judge.
 */
export const ZERO_OPTION = /^\s*no word (is )?(needed|required)\b|^\s*no word\s*$/i;

export function isZeroOption(value: unknown): boolean {
  return ZERO_OPTION.test(String(value ?? ''));
}

/**
 * A VERDICT OPTION IS ANY OPTION THAT JUDGES THE WHOLE RATHER THAN OFFERING A CANDIDATE — N on a
 * proofread item, the zero-option on a cloze. **Both must be pinned last**, and having one
 * predicate is what stops the next family being pinned for one and not the other.
 */
export function isVerdictOption(value: unknown): boolean {
  return isNOption(value) || isZeroOption(value);
}

export function isNOption(value: unknown): boolean {
  return N_OPTION.test(String(value ?? ''));
}

export function hasNOption(options: ReadonlyArray<{ content: unknown }>): boolean {
  return options.some((o) =>
    isNOption((o.content as { value?: unknown } | null)?.value ?? o.content));
}
