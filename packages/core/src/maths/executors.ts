/**
 * EXECUTABLE MATHS MISCONCEPTIONS (BUILD-DISTRICT-MATHS §5, advantage #2).
 *
 * In maths a distractor should not merely be TAGGED with a misconception — it
 * should BE the number that misconception produces when executed on the item's
 * own operands. "What answer does the place-value slip give for 304?" → 34.
 * These functions execute the derivable misconceptions from the reviewer's seed
 * library, keyed by her entry number, so the gate can verify a distractor
 * against the very error it claims to model.
 *
 * A CONCEPTUAL misconception (a belief or definition — "a square is not a
 * rectangle") has no single arithmetic output and is deliberately absent; the
 * gate reports those as review-only, never as a defect.
 *
 * Each executor reads the operands it needs from a named bag and returns the
 * wrong answer as a normalised string, or null when the operands do not let it
 * run (reported, so a missing operand is visible rather than silently passing).
 */

/** The item's numbers, named. Authoring supplies these alongside the solution. */
export type MathsOperands = Record<string, number | number[] | string | undefined>;

const num = (o: MathsOperands, k: string): number | null =>
  typeof o[k] === 'number' ? (o[k] as number) : null;
const list = (o: MathsOperands, k: string): number[] | null =>
  Array.isArray(o[k]) ? (o[k] as number[]) : null;

/**
 * Answer equality that tolerates float noise: (0.60/3)*5 evaluates to
 * 0.9999999999999999, which IS 1. Numeric strings compare within 1e-9; anything
 * non-numeric (a fraction "2/5", a word) falls back to normalised string match.
 */
export function answersEqual(a: unknown, b: unknown): boolean {
  const na = Number(String(a).replace(/[£,]/g, '')), nb = Number(String(b).replace(/[£,]/g, ''));
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) < 1e-9;
  return normaliseAnswer(a) === normaliseAnswer(b);
}

/** Trim, collapse inner whitespace, lowercase, drop a leading £. Units kept. */
export function normaliseAnswer(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').replace(/^£/, '').toLowerCase();
}

/** Column subtraction taking |top−bottom| in every column (the classic slip). */
function commutativeSubtraction(a: number, b: number): string {
  const width = Math.max(String(a).length, String(b).length);
  const top = String(a).padStart(width, '0');
  const bot = String(b).padStart(width, '0');
  let out = '';
  for (let i = 0; i < width; i += 1) out += String(Math.abs(Number(top[i]) - Number(bot[i])));
  return String(Number(out)); // strip leading zeros
}

/** Executors, keyed by the reviewer's entry number. Derivable entries only. */
export const MISCONCEPTION_EXECUTORS: Record<number, (o: MathsOperands) => string | null> = {
  // 1 — Zero placeholder missing: drop ONE zero (annie: 304 → 34; removing ALL
  //     zeros, 1000 → 0, is a different error). Removes the first zero only.
  1: (o) => { const n = num(o, 'number'); if (n === null) return null; const s = String(n); return s.includes('0') ? String(Number(s.replace('0', ''))) : null; },
  // 6 — ×10 adds a zero: append a zero to the decimal instead of shifting. 3.4 → 3.40.
  6: (o) => { const n = num(o, 'value'); return n === null ? null : `${n}0`; },
  // 8 — Negative inversion: the "greater" is the one further from zero. −10 vs −5 → −10.
  8: (o) => { const xs = list(o, 'options'); return xs && xs.length ? String(xs.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m))) : null; },
  // 9 — Always rounds DOWN to the target PLACE, not to the integer (fixed 2026-08-06:
  //     floor(value) gave the unrounded number for "round 3847 to the nearest 1000").
  //     Needs a `place` operand (10/100/1000/…) so the round-down is place-relative.
  9: (o) => { const v = num(o, 'value'), p = num(o, 'place'); return v === null || p === null || p === 0 ? null : String(Math.floor(v / p) * p); },
  // 10 — Rounds an EXACT HALF down to the place instead of up (25→20, 2.5→2). Same
  //     place-relative round-down; which items carry it is the authoring distinction.
  10: (o) => { const v = num(o, 'value'), p = num(o, 'place'); return v === null || p === null || p === 0 ? null : String(Math.floor(v / p) * p); },
  // 11 — Commutative subtraction: |top−bottom| per column. 42−17 → 35? no: |4−1||2−7|→ 35 becomes 3,5.
  11: (o) => { const a = num(o, 'a'), b = num(o, 'b'); return a === null || b === null ? null : commutativeSubtraction(a, b); },
  // 16 — Reversed division: divide the other way. 3 ÷ 12 → 12 ÷ 3 = 4.
  16: (o) => { const a = num(o, 'dividend'), b = num(o, 'divisor'); return a === null || b === null || a === 0 ? null : String(b / a); },
  // 22 — Add numerators and denominators. 1/2 + 1/3 → 2/5.
  22: (o) => { const n1 = num(o, 'n1'), d1 = num(o, 'd1'), n2 = num(o, 'n2'), d2 = num(o, 'd2'); return [n1, d1, n2, d2].some((x) => x === null) ? null : `${n1! + n2!}/${d1! + d2!}`; },
  // 25 — Thirds as tenths: read the DENOMINATOR straight into the tenths (annie:
  //     "1/3 → 0.3" writes the bottom number, not the top — operand renamed 2026-08-06).
  25: (o) => { const n = num(o, 'denominator'); return n === null ? null : `0.${n}`; },
  // 26 — Percent symbol as a unit: attach % without ×100. 0.4 → 0.4%.
  26: (o) => { const n = num(o, 'decimal'); return n === null ? null : `${n}%`; },
  // 31 — RECLASSIFIED conceptual (annie, 2026-08-06): £3.50 → £3.5 is a notation
  //     error whose value is NUMERICALLY EQUAL to the key, so it cannot be a
  //     derivable distractor. Moved to CONCEPTUAL_ENTRIES; no executor.
  // 32 — Base-100 time: add the minutes with no 60 rollover. 45 + 20 → :65.
  32: (o) => { const h = num(o, 'hour'), m = num(o, 'minute'), add = num(o, 'addMinutes'); return h === null || m === null || add === null ? null : `${h}:${m + add}`; },
  // 37 — Metric prefix as ×100: 1 kg → 100 g.
  37: (o) => { const n = num(o, 'value'); return n === null ? null : String(n * 100); },
  // 51 — Additive scaling: scale up by adding the difference, not multiplying.
  //      2 eggs → 4 cakes; 4 eggs → 4 + (4−2) = 6.
  51: (o) => { const a1 = num(o, 'a1'), b1 = num(o, 'b1'), a2 = num(o, 'a2'); return a1 === null || b1 === null || a2 === null ? null : String(b1 + (a2 - a1)); },
  // 52 — Ratio read straight as a fraction: 1:3 → 1/3 (not 1/4).
  52: (o) => { const p = num(o, 'part'), q = num(o, 'other'); return p === null || q === null ? null : `${p}/${q}`; },
  // 56 — Incomplete mean: give the total, forget to divide.
  56: (o) => { const xs = list(o, 'values'); return xs && xs.length ? String(xs.reduce((s, x) => s + x, 0)) : null; },
  // 57 — Mean vs median: give the middle value instead of the mean.
  57: (o) => {
    const xs = list(o, 'values'); if (!xs || !xs.length) return null;
    const s = [...xs].sort((x, y) => x - y); const mid = Math.floor(s.length / 2);
    return String(s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2);
  },
  // 98 — Digit dropped in column work (annie's split): sets the sum out with only
  // part of one addend, losing its highest digit (234 + 158 → 234 + 58).
  98: (o) => { const a = num(o, 'a'), b = num(o, 'b'); return a === null || b === null ? null : String(a + (Number(String(Math.abs(b)).slice(1)) || 0)); },
};

/** A safe evaluator for the item's `solution` — +, −, ×, ÷, parens, decimals. */
export function evalArithmetic(expr: string): number | null {
  const src = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
  if (!/^[-+*/(). \d]+$/.test(src)) return null;
  let i = 0;
  const ws = () => { while (src[i] === ' ') i += 1; };
  const peek = () => { ws(); return src[i]; };
  const parseExpr = (): number => {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') { const op = src[i++]!; const r = parseTerm(); v = op === '+' ? v + r : v - r; }
    return v;
  };
  const parseTerm = (): number => {
    let v = parseFactor();
    while (peek() === '*' || peek() === '/') {
      // `//` is integer (floor) division — the maths batch's solution keys use
      // it for rounding and remainder work (BUILD-DISTRICT-MATHS).
      if (peek() === '/' && src[i + 1] === '/') { i += 2; const r = parseFactor(); v = Math.floor(v / r); continue; }
      const op = src[i++]!; const r = parseFactor(); v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const parseFactor = (): number => {
    if (peek() === '(') { i += 1; const v = parseExpr(); if (peek() === ')') i += 1; return v; }
    if (peek() === '-') { i += 1; return -parseFactor(); }
    ws();
    let n = '';
    while (src[i] && /[\d.]/.test(src[i]!)) n += src[i++];
    return n === '' ? NaN : Number(n);
  };
  const result = parseExpr();
  return Number.isFinite(result) ? result : null;
}

/** The reviewer's conceptual entries — no single executable output. #101
 *  (unlike-denominators-cannot-be-compared, annie) is a belief that closes the
 *  question off, not a wrong number, so it is review-only like the rest. */
export const CONCEPTUAL_ENTRIES = new Set([15, 20, 27, 28, 30, 31, 40, 41, 42, 43, 49, 50, 58, 59, 101]);

/**
 * Worked examples per executor — engineering fixtures that exercise the executor,
 * each carrying the operands, the value the CHILD gives, and the correct KEY. The
 * CI test asserts BOTH: executor(operands) === childValue (a drifted executor
 * fails — this is what would have caught #9's floor), AND childValue ≠ keyValue (a
 * "distractor" equal to the key is no distractor — caught #57's median==mean and
 * would have caught #31). Where the error is PARAMETRIC there are TWO examples, one
 * canonical and one varying the parameter, so the test cannot pass by sidestepping
 * the defect the way #1's single-zero example did. Covers the 17 executor-backed
 * entries; the other 69 derivable entries need their executor authored first.
 */
export const MISCONCEPTION_EXAMPLES: Record<number, Array<{ operands: MathsOperands; childValue: string; keyValue: string }>> = {
  1: [{ operands: { number: 304 }, childValue: '34', keyValue: '304' }, { operands: { number: 1000 }, childValue: '100', keyValue: '1000' }],
  6: [{ operands: { value: 3.4 }, childValue: '3.40', keyValue: '34' }, { operands: { value: 5.2 }, childValue: '5.20', keyValue: '52' }],
  8: [{ operands: { options: [-10, -5] }, childValue: '-10', keyValue: '-5' }, { operands: { options: [-8, -3] }, childValue: '-8', keyValue: '-3' }],
  9: [{ operands: { value: 3847, place: 1000 }, childValue: '3000', keyValue: '4000' }, { operands: { value: 470, place: 100 }, childValue: '400', keyValue: '500' }],
  10: [{ operands: { value: 25, place: 10 }, childValue: '20', keyValue: '30' }, { operands: { value: 250, place: 100 }, childValue: '200', keyValue: '300' }],
  11: [{ operands: { a: 42, b: 17 }, childValue: '35', keyValue: '25' }, { operands: { a: 63, b: 28 }, childValue: '45', keyValue: '35' }],
  16: [{ operands: { dividend: 3, divisor: 12 }, childValue: '4', keyValue: '0.25' }, { operands: { dividend: 2, divisor: 10 }, childValue: '5', keyValue: '0.2' }],
  22: [{ operands: { n1: 1, d1: 2, n2: 1, d2: 3 }, childValue: '2/5', keyValue: '5/6' }, { operands: { n1: 1, d1: 4, n2: 1, d2: 6 }, childValue: '2/10', keyValue: '5/12' }],
  25: [{ operands: { denominator: 3 }, childValue: '0.3', keyValue: '0.333' }, { operands: { denominator: 5 }, childValue: '0.5', keyValue: '0.2' }],
  26: [{ operands: { decimal: 0.4 }, childValue: '0.4%', keyValue: '40%' }, { operands: { decimal: 0.7 }, childValue: '0.7%', keyValue: '70%' }],
  32: [{ operands: { hour: 2, minute: 45, addMinutes: 20 }, childValue: '2:65', keyValue: '3:05' }, { operands: { hour: 3, minute: 50, addMinutes: 20 }, childValue: '3:70', keyValue: '4:10' }],
  37: [{ operands: { value: 1 }, childValue: '100', keyValue: '1000' }, { operands: { value: 2 }, childValue: '200', keyValue: '2000' }],
  51: [{ operands: { a1: 2, b1: 4, a2: 4 }, childValue: '6', keyValue: '8' }, { operands: { a1: 3, b1: 6, a2: 6 }, childValue: '9', keyValue: '12' }],
  52: [{ operands: { part: 1, other: 3 }, childValue: '1/3', keyValue: '1/4' }, { operands: { part: 2, other: 5 }, childValue: '2/5', keyValue: '2/7' }],
  56: [{ operands: { values: [8, 4, 6, 2] }, childValue: '20', keyValue: '5' }, { operands: { values: [12, 6, 9, 3] }, childValue: '30', keyValue: '7.5' }],
  57: [{ operands: { values: [2, 4, 9] }, childValue: '4', keyValue: '5' }, { operands: { values: [1, 2, 9] }, childValue: '2', keyValue: '4' }],
  98: [{ operands: { a: 234, b: 158 }, childValue: '292', keyValue: '392' }, { operands: { a: 345, b: 167 }, childValue: '412', keyValue: '512' }],
};

/** The entry number carried in a seed id, e.g. maths-11-commutative-subtraction → 11,
 *  maths-100-steps-out-of-order → 100 (annie's splits pushed the library past 99). */
export function mathsEntryNumber(misconceptionId: string): number | null {
  const m = /^maths-(\d{1,3})-/.exec(misconceptionId);
  return m ? Number(m[1]) : null;
}
