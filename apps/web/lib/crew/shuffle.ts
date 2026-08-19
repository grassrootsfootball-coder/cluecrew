/**
 * Deterministic option shuffling (Phase 4 gate follow-up). Items are stored
 * in authored order (correct option first, by convention of the generators);
 * children must never receive that order.
 *
 * The shuffle is seeded on (childId, itemId): stable for a given child across
 * revisits — the same item never silently rearranges under a child — but
 * different children see different orders. Server-side ONLY: no client ever
 * receives authored order. Applied identically in Case mode, Plain mode,
 * Boss Cases, and the CMS review preview.
 */

/** FNV-1a 32-bit string hash → seed. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG — small, deterministic, well distributed. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a seeded PRNG. Never mutates the input. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = makeRandom(hashSeed(seed));
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

import { isVerdictOption } from '@cluecrew/core';

/**
 * SOME OPTIONS ARE ORDERED BY CONSTRUCTION AND MUST NOT BE SHUFFLED (David's ruling, 2026-08-17 —
 * R192). Error-spot options are consecutive SEGMENTS OF ONE SENTENCE: joining them in label order
 * reconstructs the sentence, in 18 of 18 items. **A shuffled sentence is not a harder item, it is
 * not the item** — the child is asked to find a punctuation error in something that is no longer
 * prose.
 *
 * **KEYED ON A STRUCTURAL PROPERTY, NEVER ON A QUESTION-TYPE NAME.** `stem.segmentsInOptions` is the
 * authored declaration that the options ARE the sentence in order — the same field the renderer uses
 * to decide whether to lay them out as prose. A list of type ids would have to be found and edited
 * by whoever adds the next such family, and would not be (R57: an allowlist that drops what it
 * cannot name is a gate that fails open). Cloze is the other candidate and Cowork reports it
 * shuffles safely: its options are word choices, not pieces of the carrier.
 */
export function optionsAreOrderedByConstruction(stem: unknown): boolean {
  return typeof stem === 'object' && stem !== null
    && (stem as { segmentsInOptions?: unknown }).segmentsInOptions === true;
}

/**
 * The one canonical way to order an item's options for a viewer.
 *
 * **`stem` IS REQUIRED, NOT OPTIONAL, AND THAT IS THE POINT.** An optional parameter would let a
 * call site that forgot it fall through to shuffling — the gate failing OPEN, silently, on exactly
 * the items it exists to protect. Required, the type checker visits every caller.
 */
export function shuffleOptionsForChild<T>(
  options: readonly T[],
  childId: string,
  itemId: string,
  stem: unknown,
): T[] {
  if (optionsAreOrderedByConstruction(stem)) return [...options];
  const shuffled = seededShuffle(options, `${childId}:${itemId}`);
  return pinVerdictOptionsLast(shuffled);
}

/**
 * A VERDICT OPTION IS PINNED LAST, WHATEVER THE SHUFFLE DID (Annie's ruling, 2026-08-19 — R251).
 *
 * **THIS IS A RULING ABOUT THE SHUFFLE, NOT THE LAYOUT.** `no word is needed` is last on both
 * cards that carry it TODAY, in authored order — which is exactly why it had to be asserted rather
 * than drawn: the property holds by accident of authoring, and the shuffle is free to break it on
 * any child's next session. A card whose first choice is a verdict offers the child a judgement
 * before she has read a single candidate.
 *
 * Error-spot never reached this code — `optionsAreOrderedByConstruction` returns before it — and
 * that is why N looked handled. It was handled by a family-wide exemption that cloze does not have.
 * **Same predicate for both** (`isVerdictOption`), so the next family with a verdict option cannot
 * be pinned for one shape and not the other.
 *
 * Order among verdict options is preserved, in the vanishing case of an item carrying two.
 */
function pinVerdictOptionsLast<T>(options: readonly T[]): T[] {
  // Read untyped rather than constraining T: adding `T extends { content?: unknown }` collapsed
  // inference at a call site that reads per-option fields, and this pin is UNCONDITIONAL — there
  // is no optional parameter here to fall through, which is the failure mode the constraint would
  // have been guarding against.
  const valueOf = (option: T): unknown => {
    const content = (option as { content?: unknown }).content;
    return (content as { value?: unknown } | null | undefined)?.value ?? content;
  };
  const verdicts = options.filter((option) => isVerdictOption(valueOf(option)));
  if (verdicts.length === 0) return [...options];
  return [...options.filter((option) => !isVerdictOption(valueOf(option))), ...verdicts];
}
