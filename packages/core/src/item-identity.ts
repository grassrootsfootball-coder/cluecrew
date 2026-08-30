/**
 * SUBSTANCE — WHAT MAKES A QUESTION THE SAME QUESTION (Cowork's withdrawal notice, 2026-08-30).
 *
 * A withdrawal keys on SUBSTANCE and never on ID. Their sentence, quoted because the whole door
 * turns on it: *"MC04-FDP-04 appears below and ALSO exists in a variant this notice does not touch.
 * A door keying on the id would refuse the repair along with the fault."*
 *
 * THE SPEC, VERBATIM FROM THE NOTICE:
 *   sha256 over item_identity.substance(item): stem, the sorted set of option values, the key,
 *   solution, solutionValue and solutionKind. Option order, labels and enrichment are DEDUCTED —
 *   a shuffle is not a different question and an unfinished copy is not a different one either.
 *
 * **THIS IMPLEMENTATION IS UNVERIFIED AGAINST THEIRS AND MUST NOT BE TRUSTED UNTIL IT REPRODUCES A
 * DECLARED DIGEST.** The notice names the FIELDS and not the SERIALISATION, and sixteen candidate
 * encodings failed to reproduce any of the 31 declared values. Two explanations remain confounded:
 * this encoding is wrong, or these rows genuinely differ from the substances named. **A matcher that
 * cannot reproduce a single known-good digest is a matcher that will match nothing and report a
 * pass** — the exact fault this register has recorded eight times — so the door canaries on a
 * declared digest and refuses to arm without one.
 */

export interface SubstanceItem {
  stem?: unknown;
  solution?: unknown;
  solutionValue?: unknown;
  solutionKind?: unknown;
  options?: ReadonlyArray<{ content?: unknown; value?: unknown; isCorrect?: boolean; isKey?: boolean }>;
}

const stemTextOf = (stem: unknown): string =>
  typeof stem === 'string' ? stem : String((stem as { text?: unknown } | null)?.text ?? '');

const valueOf = (o: { content?: unknown; value?: unknown }): string =>
  String((o.content as { value?: unknown } | undefined)?.value ?? o.value ?? '');

/**
 * The six parts, in the notice's order. Labels, option ORDER and every enrichment field are
 * deducted — the values are sorted, so a shuffle produces one substance.
 */
export function substance(item: SubstanceItem): {
  stem: string; optionValues: string[]; key: string | null;
  solution: unknown; solutionValue: unknown; solutionKind: unknown;
} {
  const options = item.options ?? [];
  return {
    stem: stemTextOf(item.stem),
    optionValues: options.map(valueOf).sort(),
    key: options.find((o) => o.isCorrect || o.isKey) ? valueOf(options.find((o) => o.isCorrect || o.isKey)!) : null,
    solution: item.solution ?? null,
    solutionValue: item.solutionValue ?? null,
    solutionKind: item.solutionKind ?? null,
  };
}

/** Canonical JSON: sorted keys, no whitespace, unicode preserved (R729). */
export function canonicalSubstance(item: SubstanceItem): string {
  const s = substance(item);
  return JSON.stringify(s, Object.keys(s).sort());
}
