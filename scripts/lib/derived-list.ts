/**
 * A LIST BUILT BY FILTERING ANOTHER NAMES ITS PARENT AND STATES THE NARROWING RULE
 * (David's ruling, 2026-09-05 — general).
 *
 * **THE FAULT THIS CLOSES IS THE ONE THAT KEEPS RECURRING, AND IT IS ALWAYS A SUBSET.** The child
 * lexicon is SUBTLEX minus names, and its zeros were read as verdicts until the exclusion was
 * named (R992). The generator's material is its own vocabulary minus what fails the cut. The vault
 * scored 0 of 13 because it is a 302-card teaching set, not a lexicon (R989). Every one looked like
 * a population and was a subset, and **a subset of a real population is indistinguishable from that
 * population when you cannot see what was excluded** (R595).
 *
 * So a derived list travels with three facts a reader cannot reconstruct from the rows:
 *   · the PARENT it was drawn from, and how big that parent was
 *   · the NARROWING RULE, in words
 *   · HOW MANY were excluded — because "127 words" and "127 of 4,000" are different claims
 *
 * **THE COUNT IS NOT OPTIONAL AND IT IS THE PART THAT GETS DROPPED.** A parent named without its
 * size lets a reader assume the filter did little. `pnpm check:derived-lists` refuses any emitter
 * that publishes a filtered array without naming what it filtered.
 */

export interface Derivation {
  parent: string;
  parentSize: number;
  rule: string;
  kept: number;
  excluded: number;
  /** Always present. A reader who sees only the kept count cannot tell a filter from a fetch. */
  andWHATAREADERCANNOTSEEFROMTHEROWS: string;
}

export interface DerivedList<T> { items: T[]; derivedFrom: Derivation }

/**
 * Build a list from a parent by a named rule. The predicate does the filtering so the count and
 * the description cannot drift apart — a hand-written "excluded 62,097" beside a separate
 * `.filter()` is two facts that agree until someone edits one.
 */
export function deriveList<T>(
  spec: { name: string; parent: string; rule: string },
  parent: readonly T[],
  predicate: (item: T) => boolean,
): DerivedList<T> {
  const items = parent.filter(predicate);
  return {
    items,
    derivedFrom: {
      parent: spec.parent,
      parentSize: parent.length,
      rule: spec.rule,
      kept: items.length,
      excluded: parent.length - items.length,
      andWHATAREADERCANNOTSEEFROMTHEROWS:
        `${spec.name} is a SUBSET of ${spec.parent}, not a population. ${parent.length - items.length} of ${parent.length} were excluded by: ${spec.rule}. `
        + 'A zero or a small count from this list is a fact about the narrowing as much as about the world, and nothing in the rows themselves says so.',
    },
  };
}

/** For a list already built elsewhere: record the derivation without re-filtering. */
export function declareDerivation(spec: { name: string; parent: string; parentSize: number; rule: string; kept: number }): Derivation {
  return {
    parent: spec.parent, parentSize: spec.parentSize, rule: spec.rule, kept: spec.kept,
    excluded: spec.parentSize - spec.kept,
    andWHATAREADERCANNOTSEEFROMTHEROWS:
      `${spec.name} is a SUBSET of ${spec.parent}. ${spec.parentSize - spec.kept} of ${spec.parentSize} were excluded by: ${spec.rule}.`,
  };
}
