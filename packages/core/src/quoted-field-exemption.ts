/**
 * QUOTED SPANS ARE EXEMPT FROM THE BAN LISTS AND THE US-SPELLING CHECK, DECLARED PER FIELD
 * (David's ruling, 2026-08-19 — R320).
 *
 * **A QUOTATION RECORDS WHAT A SOURCE SAYS.** Changing it to satisfy our own house rules **makes
 * the record false** — and Annie has already ruled these source-of-truth fields, checked by exact
 * match against the passage (R291). A field cannot be both *"must match the source exactly"* and
 * *"must obey our spelling"* when the source is an American novel published in 1903.
 *
 * `ENG-018-RB-01` is the case: it was refused for **"favoring"**, inside
 * `'Mr. Jeremiah Cobb was favoring the horses as much'` — **Kate Douglas Wiggin's own words**. The
 * only way to satisfy the spelling rule is to misquote her.
 *
 * **DECLARED PER FIELD, NEVER INFERRED, AND UNDECLARED REFUSES.** A field is exempt because it is
 * NAMED here as one that records a source. Guessing is wrong in both directions: treat an authored
 * field as quoted and our own house style stops being enforced anywhere it matters; treat a quoted
 * field as authored and the record has to be falsified to pass. **Where every default is wrong,
 * refuse** (R299).
 *
 * **THE EXEMPTION IS NARROW BY DESIGN.** It lifts the BAN LIST and the US-SPELLING check, which are
 * rules about OUR voice. It does not lift the reading-age cap, the long-word ceiling, or the
 * internal-id-leak rule — a quotation that is unreadable to a child is still unreadable, and an id
 * leaking through a quotation is still a leak.
 */

export type QuotedFieldVerdict = 'QUOTED — exempt' | 'AUTHORED — in scope' | 'UNDECLARED — refuse';

/**
 * Fields that RECORD A SOURCE. Annie named the first two; the third is any span an item declares as
 * quoting its passage, which the gate already resolves through `quotedSpans`.
 */
export const QUOTED_FIELDS: readonly string[] = [
  'attractorQuote',
  'defeaterQuote',
];

/**
 * Fields carrying OUR wording, where the ban list and the spelling rules apply in full. Listed so
 * that "not quoted" is a decision on the record rather than the absence of one.
 */
export const AUTHORED_FIELDS: readonly string[] = [
  'text', 'prompt', 'sentence', 'value', 'label',
  'walkScript', 'walk', 'hintCore', 'note',
];

const QUOTED = new Set(QUOTED_FIELDS);
const AUTHORED = new Set(AUTHORED_FIELDS);

/** The last path segment, array index stripped: `options[2].attractorQuote` -> `attractorQuote`. */
export function fieldOf(path: string): string {
  return (path.split('.').pop() ?? '').replace(/\[\d+\]$/, '');
}

/**
 * Is this field's text a record of a source, our own wording, or neither?
 * **Neither is an answer, and it means refuse** — not "probably fine".
 */
export function quotedFieldVerdict(path: string): QuotedFieldVerdict {
  const field = fieldOf(path);
  if (QUOTED.has(field)) return 'QUOTED — exempt';
  if (AUTHORED.has(field)) return 'AUTHORED — in scope';
  return 'UNDECLARED — refuse';
}

/** Convenience for a gate: does the ban list and the spelling check apply to this field? */
export function houseRulesApply(path: string): boolean {
  return quotedFieldVerdict(path) !== 'QUOTED — exempt';
}
