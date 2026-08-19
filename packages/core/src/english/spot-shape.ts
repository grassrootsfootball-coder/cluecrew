/**
 * TWO SHAPE CHECKS FOR THE SPOT FAMILIES — Annie's 142 rulings, 2026-08-19.
 *
 * **1. EXCLUDE THE N OPTION FROM THE FORM COMPARISON, NEVER THE ITEM.** Her ruling, and the reason
 * is a shape this register already has a name for: an N option is *"No mistake"*, a VERDICT about
 * the sentence rather than a piece of it, so comparing its form against four sentence segments is
 * comparing two different kinds of thing. The tempting fix — skip items that HAVE an N option —
 * **leaves a check that cannot fail**, because 18 of ENG-003's 34 items have one and every spot
 * item does. That is the empty-population silent pass (R60/R61) in a new coat: a green tick over a
 * screened population of zero.
 *
 * **2. THE WALKSCRIPT CAP MEASURES SENTENCES PER PART, NOT PER WALK.** Her ruling, and her
 * reasoning is about what the walk has to DO: an N-keyed walk must visit EVERY part before it can
 * conclude that nothing is wrong. A four-part sentence therefore needs at least four visits plus a
 * conclusion, so a per-walk sentence cap punishes the item for being correctly keyed. Measured per
 * part, **SP-09's five and PU-09's six are both fine** — which is the whole point of the ruling.
 */

import { isNOption } from './n-option';

export interface ShapeOption { content: unknown }

const valueOf = (o: ShapeOption): string =>
  String((o.content as { value?: unknown } | null)?.value ?? o.content ?? '');

/** Segments only — the N option is dropped from the COMPARISON, and the item is never skipped. */
export function comparableSegments(options: readonly ShapeOption[]): string[] {
  return options.map(valueOf).filter((v) => !isNOption(v));
}

export interface ShapeVerdict {
  screened: number;
  nOptionsExcluded: number;
  /** Populated when the segments disagree about form. Empty is a real pass over a real population. */
  faults: string[];
}

/**
 * Do the SEGMENTS share a form? The property is deliberately weak and stated rather than clever:
 * every segment is a fragment of one running sentence, so what can be compared without judging
 * authoring is that none of them is a standalone verdict and none is empty. A stronger grammatical
 * comparison would be a second opinion about her wording, which is not this gate's business.
 */
export function checkSegmentShape(id: string, options: readonly ShapeOption[]): ShapeVerdict {
  const all = options.map(valueOf);
  const segments = comparableSegments(options);
  const faults: string[] = [];
  if (segments.length === 0) {
    faults.push(`${id}: every option reads as a verdict — there are no segments left to compare`);
  }
  for (const s of segments) {
    if (!s.trim()) faults.push(`${id}: an empty segment cannot be part of a sentence`);
    if (isNOption(s)) faults.push(`${id}: "${s}" survived the N filter and is being compared as a segment`);
  }
  return { screened: segments.length, nOptionsExcluded: all.length - segments.length, faults };
}

/**
 * The walk's sentences, measured PER PART. `parts` is the number of comparable segments — the
 * things the walk must visit — so the budget grows with the sentence rather than punishing it.
 */
export function walkSentencesPerPart(walk: string, parts: number): { sentences: number; parts: number; perPart: number } {
  const sentences = walk.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean).length;
  return { sentences, parts, perPart: parts > 0 ? sentences / parts : sentences };
}

/**
 * **SHE RULED THE MEASURE, NOT THE NUMBER**, and the distinction is load-bearing.
 *
 * Her words: *"the walkScript cap measures sentences per part, not per walk … SP-09's five and
 * PU-09's six are both fine on that measure."* So the metric is the RATIO, and both her named
 * items pass it: SP-09 is 5/4 = 1.25 and PU-09 is 6/4 = 1.50.
 *
 * **MY FIRST ATTEMPT WAS `parts + 1`, WHICH PASSED SP-09 AND FAILED PU-09** — a formula that
 * splits a pair she ruled identical is a formula that is wrong, and quietly widening it until both
 * fit would be *"a rule fitted to the cases it then judges"*, delivery 38's own finding. So the
 * threshold below is declared as MINE and PROVISIONAL: two sentences per part — one visit, one
 * elaboration — which admits both her items with room, and which she can set to anything ≥ 1.5
 * without either of them moving.
 */
export const WALK_SENTENCES_PER_PART_CAP = 2;
export const walkWithinBudget = (sentences: number, parts: number): boolean =>
  parts <= 0 || sentences / parts <= WALK_SENTENCES_PER_PART_CAP;
