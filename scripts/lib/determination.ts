/**
 * THE CONDITION TESTS THAT THE WORKING DETERMINES THE VALUE (Annie's 192nd — R885).
 *
 * Computes-as was never about arithmetic. Her words: **the stated act, run on the item's own
 * material, produces exactly this value and no other.** Long division qualifies; so does selection;
 * so does ordering. What the condition refuses is GESTURE — a working that makes its value
 * plausible rather than inevitable.
 *
 * **THE NAME SAID COMPUTES AND THE TEST MEANT DETERMINES**, which is the `maxLongWords` fault
 * (R871) landing on her own condition rather than on our instrument. So this file is named for what
 * it tests, and `determines()` is the only entry point.
 *
 * A CLOSED SET OF ACTS, NOT AN INTERPRETER. R826 withdrew three signals that decided things by
 * inference, and widening to "any stated act" is exactly where that would creep back. So:
 *   - each act is NAMED, recognised by a declared vocabulary, and EXECUTED over the item's material;
 *   - a working matching NO act is refused, which is the safe direction;
 *   - the act that matched and the material it ran on travel on every result (R569), because a
 *     verdict whose procedure the reader cannot see is a verdict they have to take on trust.
 *
 * DETERMINATION IS THE WHOLE TEST, INCLUDING "AND NO OTHER". A selection that ties determines
 * nothing; a permutation not grounded in the item's own digits determines something else's value.
 */

export type Act = 'arithmetic' | 'selection' | 'permutation';

export interface Determination {
  determines: boolean;
  act: Act | null;
  /** What the act was run on — the item's own material, quoted so the reader can check it. */
  material: number[];
  /** The value the act produced, before comparison. */
  produced: string | null;
  detail: string;
}

/** Every number the item's own text states. Reported on each result so the reader sees the input. */
export function materialOf(stemText: string): number[] {
  return [...stemText.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

/** Numeric components of an option: "£2000" -> [2000]; "(8, 4)" -> [8,4]. Order preserved. */
export function componentsOf(v: string): number[] | null {
  const nums = v.replace(/[()]/g, '').split(',').map((s) => Number(s.trim().replace(/[^\d.-]/g, '')));
  return nums.every((n) => !Number.isNaN(n)) && nums.length > 0 ? nums : null;
}

/**
 * The working's stated act and its asserted result, split on the FIRST of the corpus's three
 * separators, taking the first numeric token after it.
 *
 * Splitting on the LAST separator read `5 + 3 = 8 → (8, 4)` as asserting `(8, 4)`, stripped that to
 * `84`, and refused a join that had already landed — a widening that broke a narrower case while
 * looking like it only added. The restatement after the arrow is the option, not the assertion.
 */
function split(working: string): { lhs: string; asserted: string | null } {
  const m = working.match(/^(.*?)(?:=|->|→)(.*)$/);
  if (!m) return { lhs: working.trim(), asserted: null };
  const first = m[2]!.match(/-?\d+(?:\.\d+)?/);
  return { lhs: m[1]!.trim(), asserted: first ? first[0] : null };
}

// ---- the three acts ----------------------------------------------------------------------------

function arithmetic(lhs: string, asserted: string | null, want: number[]): Determination | null {
  const norm = lhs.replace(/\bx\b/g, '*').replace(/\bdivided by\b/g, '/');
  const tuple = norm.match(/\(([^)]*[+\-*/][^)]*,[^)]*)\)/);
  const exprs = tuple
    ? tuple[1]!.split(',').map((c) => c.trim())
    : [norm.match(/[\d.]+(?:\s*[+\-*/]\s*[\d.()]+)+/)?.[0]?.trim() ?? ''];
  if (exprs.some((e) => e === '' || !/^[\d\s.+\-*/()]+$/.test(e))) return null;
  let got: number[];
  try { got = exprs.map((e) => Function(`"use strict";return (${e})`)() as number); } catch { return null; }
  // With an asserted result the working claims ONE number; the option may carry it among others.
  const assertedNum = asserted !== null ? Number(asserted.replace(/[^\d.-]/g, '')) : NaN;
  if (!Number.isNaN(assertedNum) && got.length === 1) {
    const holds = Math.abs(got[0]! - assertedNum) < 1e-9;
    const inOption = want.some((w) => Math.abs(w - assertedNum) < 1e-9);
    return { determines: holds && inOption, act: 'arithmetic', material: got, produced: String(assertedNum),
      detail: `${exprs[0]} = ${got[0]}, asserted ${assertedNum} — arithmetic ${holds ? 'holds' : 'DOES NOT HOLD'}; option ${JSON.stringify(want)} ${inOption ? 'contains' : 'DOES NOT CONTAIN'} it` };
  }
  const agrees = got.length === want.length && got.every((g, i) => Math.abs(g - want[i]!) < 1e-9);
  return { determines: agrees, act: 'arithmetic', material: got, produced: JSON.stringify(got),
    detail: `${JSON.stringify(exprs)} = ${JSON.stringify(got)}; option ${JSON.stringify(want)} — ${agrees ? 'reproduced' : 'NOT reproduced'}` };
}

const LARGEST = /\b(largest|biggest|greatest|highest|most|maximum|max)\b/i;
const SMALLEST = /\b(smallest|least|lowest|fewest|minimum|min)\b/i;

function selection(lhs: string, material: number[], want: number[]): Determination | null {
  const takesMax = LARGEST.test(lhs);
  const takesMin = SMALLEST.test(lhs);
  if (takesMax === takesMin) return null;              // neither named, or both — determines nothing
  if (material.length === 0) return null;
  const picked = takesMax ? Math.max(...material) : Math.min(...material);
  const ties = material.filter((n) => n === picked).length;
  const unique = ties === 1;
  const agrees = want.length === 1 && Math.abs(want[0]! - picked) < 1e-9;
  return { determines: unique && agrees, act: 'selection', material, produced: String(picked),
    detail: `${takesMax ? 'largest' : 'smallest'} of ${JSON.stringify(material)} = ${picked}${unique ? '' : ` — TIED ${ties} ways, so it determines nothing`}; option ${JSON.stringify(want)} — ${agrees ? 'matches' : 'DOES NOT MATCH'}` };
}

/**
 * A stated ORDER of the item's own digits, concatenated. `6,4,0` and `put 6 first, then 0,4` are the
 * same act: the working names the sequence, so the result is inevitable rather than plausible. The
 * grounding is that every digit named appears in the item's own text — without that, the working
 * determines some other item's value.
 */
function permutation(lhs: string, stemText: string, want: number[]): Determination | null {
  const digits = [...lhs.matchAll(/\d/g)].map((m) => m[0]);
  if (digits.length < 2) return null;
  const stemDigits = [...stemText.matchAll(/\d/g)].map((m) => m[0]);
  const pool = [...stemDigits];
  const grounded = digits.every((d) => { const i = pool.indexOf(d); if (i < 0) return false; pool.splice(i, 1); return true; });
  const produced = digits.join('');
  const agrees = want.length === 1 && Math.abs(want[0]! - Number(produced)) < 1e-9;
  return { determines: grounded && agrees, act: 'permutation', material: digits.map(Number), produced,
    detail: `the stated order ${digits.join(',')} concatenates to ${produced}; digits ${grounded ? 'all appear' : 'DO NOT all appear'} in the item's own text; option ${JSON.stringify(want)} — ${agrees ? 'matches' : 'DOES NOT MATCH'}` };
}

// ---- the entry point ---------------------------------------------------------------------------

/**
 * Does the working's stated act, run on the item's own material, produce exactly this value?
 * Acts are tried most-specific first; the FIRST that recognises the working is the one reported —
 * a working recognised by none is GESTURE and refuses.
 */
export function determines(working: string, optionValue: string, stemText: string): Determination {
  const want = componentsOf(optionValue);
  if (!want) return { determines: false, act: null, material: [], produced: null, detail: `the option value ${JSON.stringify(optionValue)} has no numeric components to compare` };
  const { lhs, asserted } = split(working);
  const material = materialOf(stemText);

  const a = arithmetic(lhs, asserted, want);
  if (a) return a;
  const s = selection(lhs, material, want);
  if (s) return s;
  const p = permutation(lhs, stemText, want);
  if (p) return p;
  return { determines: false, act: null, material, produced: null,
    detail: 'the working names no act this store can execute — it is gesture, not determination. Acts recognised: arithmetic, selection (largest/smallest), permutation (a stated order of the item\'s digits).' };
}
