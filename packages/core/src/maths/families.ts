/**
 * MATHS TEMPLATE FAMILIES (annie's scheme, docs/annie-maths-families.md).
 *
 * Ported into the repo so each family is `structure + per-tier ranges + tier rule +
 * misconception constructors`, emitting through the derivability gate (see generator.ts).
 * The five added here: ROUNDING and TIME-AND-MONEY as new generators, then M-04 split by
 * distractor set into three (wrong-operation / reversed-division / misread-quantity). The
 * two two-distractor-floor families preserved from the drafting side — unit-price (M-05a)
 * and unit-fraction (M-06a) — ship exactly two distractors (a third is correct by
 * construction; calibration R9), and TIME-AND-MONEY carries the composition finding:
 * T4/T5 are multi-step compositions whose firstStepResults fall out of the steps.
 *
 * Value discipline: money is held to clean 2-decimal amounts and derived distractors are
 * only used where the executor's output is exactly the value shown — otherwise the key or
 * the distractor would fail its own gate (a rounded £0.13 ≠ the executed 0.125).
 */
import type { MathsFamily, Tier } from './generator';
import { randInt, randPick } from './generator';

const ID = {
  round9: 'maths-09-rounding-misdirection',
  revDiv: 'maths-16-reversing-division',
  wrongPlace: 'maths-65-incorrect-rounding-place',
  wrongOp: 'maths-72-wrong-operation-chosen',
  incFrac: 'maths-75-incomplete-fraction-of-an-amount',
  addDiff: 'maths-84-adding-instead-of-finding-the-difference',
  ignoreQty: 'maths-93-comparing-prices-ignoring-quantity',
  divWrong: 'maths-96-mean-calculation-slip',
  divOther: 'maths-105-divided-by-the-other-quantity',
  roundDown: 'maths-106-always-rounds-down',
  proc: 'maths-proc-01-stopped-at-the-first-answer',
  wrongCol: 'maths-61-reading-the-wrong-place-value-column',
  faceValue: 'maths-62-reading-a-digit-at-face-value',
  powerTen: 'maths-68-wrong-power-of-ten-scaling',
  commSub: 'maths-11-commutative-subtraction',
  droppedCarry: 'maths-69-dropped-calculation-carry',
  colTotals: 'maths-70-two-digit-column-totals',
  negInv: 'maths-08-negative-number-inversion',
  negMiscount: 'maths-66-negative-number-miscount',
  addNumDenom: 'maths-22-adding-numerators-and-denominators',
  largerDenom: 'maths-21-larger-denominator-means-larger-fraction',
  noCommonDenom: 'maths-29-comparing-without-common-denominators',
  pctMoney: 'maths-77-treating-a-percentage-as-money',
  pctUnit: 'maths-26-percentage-symbol-as-a-unit',
  addScale: 'maths-51-additive-scaling',
  unitarySlip: 'maths-92-unitary-proportion-slip',
  ratioFrac: 'maths-52-ratio-to-fraction-confusion',
  metricPrefix: 'maths-37-metric-prefix-confusion',
  convWrongWay: 'maths-36-multiplying-to-convert-to-a-larger-unit',
  base100time: 'maths-32-base-100-time',
  h1224: 'maths-33-12-24-hour-confusion',
  incMean: 'maths-56-incomplete-mean',
  meanMedian: 'maths-57-mean-vs-median',
  incTotal: 'maths-94-incomplete-statistical-total',
  wrongStat: 'maths-95-reading-the-wrong-statistical-quantity',
  perimAreaSwap: 'maths-87-perimeter-area-swap',
  incompletePerim: 'maths-88-incomplete-perimeter',
  composite: 'maths-90-composite-shape-area-slip',
  ranForwards: 'maths-109-ran-the-machine-forwards',
  reverseMeanAvg: 'maths-110-missing-value-equals-the-average',
  signAnswer: 'maths-14-the-sign-as-the-answer-is',
  stepsOrder: 'maths-100-steps-out-of-order',
} as const;

const pad2 = (n: number): string => String(n).padStart(2, '0');
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Column-subtraction exchange analysis: how many borrows, and whether any borrow had to
 *  pass THROUGH a zero (the across-zero case). Lets M-column tier on the exchange, not size. */
function subInfo(a: number, b: number): { borrows: number; acrossZero: boolean } {
  const da = String(a).split('').reverse().map(Number);
  const db = String(b).split('').reverse().map(Number);
  let borrow = 0, borrows = 0, acrossZero = false;
  for (let i = 0; i < da.length; i += 1) {
    if (borrow === 1 && da[i] === 0) acrossZero = true; // a 0 column was asked to lend
    const top = da[i]! - borrow;
    const bot = db[i] ?? 0;
    if (top < bot) { borrows += 1; borrow = 1; } else borrow = 0;
  }
  return { borrows, acrossZero };
}

const money = (pounds: number): string => `£${pounds.toFixed(2)}`;

// Surface contexts multiply the distinct-item count without touching the maths difficulty —
// a real bank varies the noun, not just the numbers. Dedup is on the whole stem, so these
// give a small tier its 30 distinct items honestly.
const SHARERS = ['children', 'friends', 'pupils', 'cousins', 'guests', 'players'] as const;
const OBJECTS = ['pens', 'pencils', 'apples', 'marbles', 'stickers', 'crayons', 'sweets'] as const;

// ---------- ROUNDING (new generator) ----------
// V is forced to round UP (V mod P in [P/2, P)), so "rounds down" is genuinely below the key.
const rounding: MathsFamily = {
  id: 'M-round',
  name: 'Rounding to the nearest 10 / 100 / 1000',
  shape: 'Round N to nearest 10/100/1000',
  tierRule: (t) => ['', 'nearest 10, 3-digit', 'nearest 10 or 100, 3-digit', 'nearest 100, 4-digit', 'nearest 100 or 1000, 4-digit', 'nearest 1000, 5-digit'][t]!,
  // RATIFIED as a real ladder (annie, 2026-08-07): rounding to the nearest 10 vs 1000 are
  // different jobs — the larger holds more columns and decides on a digit further from the
  // one being written. The magnitude growth is incidental, not load-bearing.
  structuralParams: (t) => ({ place: ['', '10', '10/100', '100', '100/1000', '1000'][t]! }),
  ranges: (t) => ['', '120–980 → 10', '150–980 → 10/100', '1,050–9,800 → 100', '1,050–9,800 → 100/1000', '10,500–98,000 → 1000'][t]!,
  draft: (tier: Tier, r) => {
    const place = randPick(r, ({ 1: [10], 2: [10, 100], 3: [100], 4: [100, 1000], 5: [1000] } as Record<Tier, number[]>)[tier]);
    const units = place * 10; // multiples of place available in the tier's magnitude
    const hi = place >= 1000 ? 98 : place >= 100 ? 98 : 98;
    const base = randInt(r, Math.ceil(units / place), hi) * place; // ≥ 10 places in
    const V = base + randInt(r, place / 2, place - 1); // rounds UP
    const key = Math.round(V / place) * place;
    const finer = Math.max(1, place / 10);
    const coarser = place * 10;
    return {
      stem: `Round ${V.toLocaleString('en-GB')} to the nearest ${place.toLocaleString('en-GB')}.`,
      solution: `((${V} + ${place / 2}) // ${place}) * ${place}`,
      keyValue: String(key),
      operands: { value: V, place, wrongPlace: finer },
      hint: 'Find the digit in that place. Look at the digit just to its right to decide.',
      distractors: [
        { entry: 65, id: ID.wrongPlace }, // rounded to a finer place (derived)
        { entry: 9, id: ID.round9 }, // rounded DOWN to the place (derived)
        { entry: 106, id: ID.roundDown, value: String(Math.floor(V / coarser) * coarser) }, // down to a coarser place (authored)
      ],
    };
  },
};

// ---------- TIME-AND-MONEY (new generator) — carries the composition finding ----------
const timeAndMoney: MathsFamily = {
  id: 'M-money',
  name: 'Money: change and multi-item shopping',
  shape: 'Money: change, multi-item shopping',
  tierRule: (t) => ['', 'one-step change from a note', 'one-step change, larger note', 'two-step: buy several, then total', 'two-step: buy several then find change', 'three-step: items then change'][t]!,
  // Seam fixed (annie, 2026-08-07): T1 gives change in ONE part (whole pounds); T2 gives
  // it in TWO parts (pounds AND pence) — an actual second thing the child does, not just a
  // bigger note. T3–T5 is the real step ladder and is unchanged.
  structuralParams: (t) => ({ steps: [0, 1, 1, 2, 2, 3][t]!, kind: ['', 'change', 'change', 'total', 'change', 'change'][t]!, parts: ['', 'one', 'two', 'two', 'two', 'three'][t]! }),
  ranges: (t) => ['', 'item £1–£4 whole, £5 note', 'item £1.10–£8.90, £10 note', 'item £2–£6 × 2–4', 'item £2–£6 × 2–4, £20 note', 'items £2–£9, £20 note'][t]!,
  draft: (tier: Tier, r) => {
    if (tier === 1) {
      // One part: whole-pound cost, whole-pound change (£5 or £10 note for enough spread).
      const obj = randPick(r, ['toy', 'book', 'pen', 'kite', 'mug', 'cap', 'ball']);
      const note = randPick(r, [5, 10]);
      const cost = randInt(r, 1, note - 1);
      const change = note - cost;
      return {
        stem: `A ${obj} costs ${money(cost)}. You pay with a ${money(note)} note. How much change do you get?`,
        solution: `${note} - ${cost}`, keyValue: money(change), operands: { a: note, b: cost },
        hint: 'Take the cost away from the pounds you paid.',
        distractors: [
          { entry: 84, id: ID.addDiff, value: money(note + cost) }, // added instead of subtracting
          { entry: 72, id: ID.wrongOp, value: money(cost) }, // gave the cost back as the change
          { entry: 106, id: ID.roundDown, value: money(note - cost - 1) }, // counted up one short
        ],
      };
    }
    if (tier === 2) {
      // Two parts: cost in pounds and pence, so the change has BOTH pounds and pence.
      const obj = randPick(r, ['toy', 'book', 'pen', 'kite', 'mug', 'cap', 'ball']);
      const cost = randInt(r, 11, 89) / 10; // £1.10–£8.90, always carries pence
      const change = 10 - cost; // ≥ £1.10, has pounds and pence
      return {
        stem: `A ${obj} costs ${money(cost)}. You pay with a ${money(10)} note. How much change do you get?`,
        solution: `10 - ${cost}`, keyValue: money(change), operands: { a: 10, b: cost },
        hint: 'Count up to the next pound first. Then count on to ten pounds.',
        distractors: [
          { entry: 84, id: ID.addDiff, value: money(10 + cost) }, // added instead of subtracting
          { entry: 72, id: ID.wrongOp, value: money(cost) }, // gave the cost back as the change
          { entry: 106, id: ID.roundDown, value: money(10 - Math.floor(cost)) }, // dropped the pence
        ],
      };
    }
    const unit = randInt(r, 2, 8);
    const qty = randInt(r, 2, 5);
    const item = randPick(r, ['pen', 'book', 'toy', 'mug', 'plant', 'game']);
    const subtotal = qty * unit; // step 1 — becomes firstStepResults
    if (tier === 3) {
      const extra = randInt(r, 2, 6);
      const key = subtotal + extra;
      return {
        stem: `A ${item} costs ${money(unit)}. You buy ${qty} ${item}s and a ${money(extra)} notebook. What is the total?`,
        solution: `${qty} * ${unit} + ${extra}`,
        keyValue: money(key),
        operands: { firstStepResults: [subtotal] },
        hint: 'Work out the pens first. Then add the notebook.',
        distractors: [
          { entry: 0, id: ID.proc, value: money(subtotal), process: true }, // stopped at the pens (derived via firstStepResults)
          { entry: 72, id: ID.wrongOp, value: money(qty * (unit + extra)) }, // multiplied everything
          { entry: 84, id: ID.addDiff, value: money(qty + unit + extra) }, // added the quantity too
        ],
      };
    }
    const note = 20;
    if (tier === 4) {
      // Two-step change: keep the subtotal under the note (unit ≤ 5, qty ≤ 3 ⇒ ≤ 15).
      const u = randInt(r, 2, 5);
      const q = randInt(r, 2, 3);
      const sub = u * q;
      const key = note - sub;
      return {
        stem: `A ${item} costs ${money(u)}. You buy ${q} ${item}s and pay with a ${money(note)} note. How much change?`,
        solution: `${note} - ${q} * ${u}`,
        keyValue: money(key),
        operands: { firstStepResults: [sub] },
        hint: 'Work out the cost of the items first. Then take it from the note.',
        distractors: [
          { entry: 0, id: ID.proc, value: money(sub), process: true }, // stopped at the cost (derived)
          { entry: 84, id: ID.addDiff, value: money(note + sub) }, // added instead of taking away
          { entry: 72, id: ID.wrongOp, value: money(note - u) }, // took only one item off
        ],
      };
    }
    // T5 — THREE-STEP composition: two items, then change. The two intermediate subtotals
    // (pens, then pens + book) FALL OUT as firstStepResults; the PROC-01 distractor is the
    // running total after the second step (bought both, forgot the change).
    const u = randInt(r, 2, 4);
    const q = randInt(r, 2, 3);
    const book = randInt(r, 2, 6);
    const other = randPick(r, ['book', 'bag', 'hat', 'torch']);
    const pens = q * u; // step 1
    const spent = pens + book; // step 2
    const key = note - spent; // step 3
    return {
      stem: `A ${item} costs ${money(u)} and a ${other} costs ${money(book)}. You buy ${q} ${item}s and one ${other}, and pay with a ${money(note)} note. How much change?`,
      solution: `${note} - (${q} * ${u} + ${book})`,
      keyValue: money(key),
      operands: { firstStepResults: [pens, spent] },
      hint: 'Add the items up first. Then take the total from the note.',
      distractors: [
        { entry: 0, id: ID.proc, value: money(spent), process: true }, // stopped at the total spent (derived)
        { entry: 84, id: ID.addDiff, value: money(note + spent) }, // added instead of taking away
        { entry: 72, id: ID.wrongOp, value: money(note - book) }, // forgot the pens
      ],
    };
  },
};

// ---------- M-04 split by distractor set (one shape, three families) ----------

// M-04a: chose the wrong OPERATION.
const wrongOperation: MathsFamily = {
  id: 'M-04a',
  collapsed: 2, // COLLAPSED (annie, 2026-08-07). v2 ladder: one-step · remainder · two-step
  name: 'Division word problem — chose the wrong operation',
  shape: 'Multi-step / one-step operation word problem',
  tierRule: (t) => ['', 'share within times tables', 'share, 2-digit total', 'grouping, 2-digit total', 'grouping, larger total', 'two-step with a division'][t]!,
  ranges: (t) => ['', '÷ 3–5, quotient 3–8', '÷ 4–6, quotient 4–12', '÷ 4–7, quotient 4–14', '÷ 5–8, quotient 5–16', '÷ 6–9, quotient 6–18'][t]!,
  draft: (tier: Tier, r) => {
    const divisor = randInt(r, tier + 2, tier + 5);
    const quotient = randInt(r, 3, 9 + tier * 2);
    const total = divisor * quotient;
    const obj = randPick(r, OBJECTS);
    const who = randPick(r, SHARERS);
    return {
      stem: `${total} ${obj} are shared equally between ${divisor} ${who}. How many ${obj} does each one get?`,
      solution: `${total} / ${divisor}`,
      keyValue: String(quotient),
      operands: { amount: total, single: divisor, op: 'mult' },
      hint: 'Sharing equally means dividing. Split the total between the children.',
      distractors: [
        { entry: 75, id: ID.incFrac }, // multiplied instead of dividing (derived: amount × single)
        { entry: 84, id: ID.addDiff, value: String(total + divisor) }, // added
        { entry: 72, id: ID.wrongOp, value: String(total - divisor) }, // subtracted
      ],
    };
  },
};

// M-04b: reversed the DIVISION. Item is small ÷ large so the reversed form is the tempting
// whole number; the key is a clean 2-decimal unit share (denominator 4/5/10/20).
const reversedDivision: MathsFamily = {
  id: 'M-04b',
  collapsed: 4, // COLLAPSED (annie, 2026-08-07). v2 ladder: one-step · remainder · two-step (reversed)
  name: 'Division word problem — reversed the division',
  shape: 'Multi-step / one-step operation word problem',
  tierRule: (t) => ['', 'share £ among 4 or 5', 'share £ among 4/5/10', 'share £ among 5/10', 'share £ among 10/20', 'share £ among 10/20, larger £'][t]!,
  ranges: (t) => ['', '£2–£3 ÷ {4,5}', '£2–£4 ÷ {4,5,10}', '£3–£5 ÷ {5,10}', '£4–£6 ÷ {10,20}', '£6–£9 ÷ {10,20}'][t]!,
  draft: (tier: Tier, r) => {
    const mult = randPick(r, ([[4, 5], [4, 5, 10], [5, 10], [10, 20], [10, 20]] as number[][])[tier - 1]!);
    const pounds = randInt(r, 1 + tier, 6 + tier);
    const people = pounds * mult; // people is a multiple of pounds → reversed division is whole
    const each = pounds / people; // = 1/mult ∈ {0.25, 0.20, 0.10, 0.05}
    const who = randPick(r, SHARERS);
    return {
      stem: `${money(pounds)} is shared equally between ${people} ${who}. How much does each one get?`,
      solution: `${pounds} / ${people}`,
      keyValue: money(each),
      operands: { dividend: pounds, divisor: people, amount: pounds, single: people, op: 'mult' },
      hint: 'The money goes inside the bus stop, the children outside. Check which number goes where.',
      distractors: [
        { entry: 16, id: ID.revDiv, format: (v) => money(Number(v)) }, // divided the wrong way round (derived → mult)
        { entry: 75, id: ID.incFrac, format: (v) => money(Number(v)) }, // multiplied the two numbers (derived)
        { entry: 72, id: ID.wrongOp, value: money(people - pounds) }, // subtracted
      ],
    };
  },
};

// M-04c: misread WHICH quantity is the divisor (divided by a price in the problem, not the
// group size). total is a multiple of the price so the wrong division is a whole number.
const misreadQuantity: MathsFamily = {
  id: 'M-04c',
  collapsed: 3, // COLLAPSED (annie, 2026-08-07). v2 ladder: two numbers · three numbers · two plausible divisors
  name: 'Division word problem — misread which quantity is which',
  shape: 'Multi-step / one-step operation word problem',
  tierRule: (t) => ['', 'two numbers + a price', 'price present, 2-digit', 'price present, larger', 'two plausible divisors', 'two-step, misread at the divide'][t]!,
  ranges: (t) => ['', 'boxes 4–6, per 4–6', 'boxes 4–8, per 4–7', 'boxes 5–9, per 5–8', 'boxes 6–10, per 6–9', 'boxes 6–12, per 6–9'][t]!,
  draft: (tier: Tier, r) => {
    const price = randPick(r, [2, 3, 5]); // the misread divisor
    const perBox = randInt(r, 4, 6 + tier);
    const boxes = price * randInt(r, 2, 3 + tier); // boxes multiple of price → total divisible by price
    const total = perBox * boxes;
    return {
      stem: `${total} eggs are packed into boxes of ${perBox}. Each box is sold for ${money(price)}. How many boxes are there?`,
      solution: `${total} / ${perBox}`,
      keyValue: String(boxes),
      operands: { total, wrongCount: price, dividend: total, divisor: perBox },
      hint: 'The price is not needed here. Divide the eggs by how many fit in a box.',
      distractors: [
        { entry: 96, id: ID.divWrong }, // divided the eggs by the price (derived: total / wrongCount)
        { entry: 105, id: ID.divOther, value: String(perBox) }, // gave the box size as the answer
        { entry: 72, id: ID.wrongOp, value: String(total - perBox) }, // subtracted
      ],
    };
  },
};

// ---------- Two-distractor-floor families (preserved; calibration R9) ----------

// M-06a: unit fraction OF an amount, bare. A third distractor is correct by construction.
const unitFraction: MathsFamily = {
  id: 'M-06a',
  collapsed: 2, // COLLAPSED (annie, 2026-08-07). v2 ladder: PERMANENT — single shape by nature, no v2 ladder
  name: 'Unit fraction of an amount (bare)',
  shape: 'Fraction of an amount',
  distractorFloor: 2,
  tierRule: (t) => ['', '1/2–1/4 of a times-table amount', '1/3–1/5 of a 2-digit amount', 'unit fraction, 2–3 digit', 'unit fraction, 2-digit answer', 'unit fraction, 3-digit amount'][t]!,
  ranges: (t) => ['', 'denom 2–4, answer 5–10', 'denom 3–5, answer 5–12', 'denom 3–6, answer 6–14', 'denom 4–8, answer 6–16', 'denom 4–9, answer 8–20'][t]!,
  draft: (tier: Tier, r) => {
    const denom = randInt(r, 2 + Math.floor(tier / 2), 4 + tier);
    const answer = randInt(r, 5, 16 + tier * 4);
    const amount = denom * answer;
    return {
      stem: `What is 1/${denom} of ${amount}?`,
      solution: `${amount} / ${denom}`,
      keyValue: String(answer),
      operands: { amount, single: denom, op: 'mult' },
      hint: 'One part means share into that many equal parts. Take one part.',
      distractors: [
        { entry: 75, id: ID.incFrac }, // multiplied by the denominator (derived: amount × denom)
        { entry: 72, id: ID.wrongOp, value: String(amount - denom) }, // subtracted the denominator
      ],
    };
  },
};

// M-05a: unit price / best buy. The two honest distractors are the pack price itself and the
// group size read as the price; a third strays into another topic (R9).
const unitPrice: MathsFamily = {
  id: 'M-05a',
  collapsed: 3, // COLLAPSED (annie, 2026-08-07). v2 ladder: find one · compare two packs · multi-buy
  name: 'Unit price / best buy',
  shape: 'Unitary proportion / best-buy',
  distractorFloor: 2,
  tierRule: (t) => ['', '', 'price for a pack, find one', 'find one, cleaner pack', 'larger pack', 'larger pack, higher unit'][t]!,
  ranges: (t) => ['', '', 'pack 4–6 at £2–£3 each', 'pack 4–8 at £2–£3 each', 'pack 5–9 at £2–£3 each', 'pack 6–10 at £2–£4 each'][t]!,
  draft: (tier: Tier, r) => {
    const each = randInt(r, 2, tier >= 5 ? 4 : 3);
    const count = randInt(r, 5, 12 + tier); // count > each, so count read-as-price ≠ key
    const packPrice = count * each;
    const obj = randPick(r, ['pens', 'pencils', 'apples', 'cakes', 'yoghurts', 'stickers']);
    const one = obj.slice(0, -1);
    return {
      stem: `A pack of ${count} ${obj} costs ${money(packPrice)}. How much is one ${one}?`,
      solution: `${packPrice} / ${count}`,
      keyValue: money(each),
      operands: { dividend: packPrice, divisor: count },
      hint: 'Share the price equally between the pens in the pack.',
      distractors: [
        { entry: 93, id: ID.ignoreQty, value: money(packPrice) }, // gave the pack price as the unit price
        { entry: 105, id: ID.divOther, value: money(count) }, // read the number of pens as the price
      ],
    };
  },
};

// ---------- P-1 · Place value & ordering ----------
const placeValue: MathsFamily = {
  id: 'M-place',
  collapsed: 2, // COLLAPSED (annie, 2026-08-07). v2 ladder: which column · then decimals (and fix the T1 monotony)
  name: 'Place value — value of a digit',
  shape: 'Value of a digit / place value',
  tierRule: (t) => ['', '3-digit whole number', '4-digit whole number', '5-digit whole number', '5-digit, higher columns', '6-digit whole number'][t]!,
  ranges: (t) => ['', '100–999', '1,000–9,999', '10,000–99,999', '10,000–99,999', '100,000–999,999'][t]!,
  draft: (tier, r) => {
    const len = [0, 3, 4, 5, 5, 6][tier]!;
    const posIdx = randInt(r, 2, len - 1); // hundreds or higher, so #61 ≠ face value
    const place = 10 ** posIdx;
    const d = randInt(r, 1, 9);
    const digits: number[] = [];
    for (let i = len - 1; i >= 0; i -= 1) {
      if (i === posIdx) { digits.push(d); continue; }
      let x = randInt(r, i === len - 1 ? 1 : 0, 9);
      while (x === d) x = randInt(r, i === len - 1 ? 1 : 0, 9); // keep d unique in the number
      digits.push(x);
    }
    const num = Number(digits.join(''));
    return {
      stem: `In ${num.toLocaleString('en-GB')}, what is the value of the digit ${d}?`,
      solution: `${d} * ${place}`,
      keyValue: String(d * place),
      operands: { digit: d, place, shift: -1 },
      hint: 'Find which column the digit sits in. Its value is the digit times that column.',
      distractors: [
        { entry: 61, id: ID.wrongCol }, // read one column to the right (derived)
        { entry: 62, id: ID.faceValue, value: String(d) }, // face value
        { entry: 68, id: ID.powerTen, value: String(d * place * 10) }, // read one column to the left
      ],
    };
  },
};

// ---------- P-2 · Column arithmetic (bare subtraction) ----------
const columnArithmetic: MathsFamily = {
  id: 'M-column',
  name: 'Column arithmetic — subtraction',
  shape: 'Bare column arithmetic (+ − × ÷)',
  // Real EXCHANGE ladder (annie, 2026-08-07 — the family that proves KEEP is not a loophole):
  // the tier turns the borrow structure, and the draft HONOURS it by regenerating until the
  // subtraction has the required exchange. Size grows too, but the exchange is what's load-bearing.
  tierRule: (t) => ['', 'no exchange (no borrow)', 'a single borrow', 'several borrows', 'a borrow across a zero', 'a borrow across two zeros'][t]!,
  structuralParams: (t) => ({ exchange: ['', 'none', 'single', 'multiple', 'across-zero', 'across-zeros'][t]! }),
  numberRanges: (t) => ({ a: [[0, 20, 100, 1000, 1000, 10000][t]!, [0, 99, 999, 9999, 9999, 99999][t]!] }),
  draft: (tier, r) => {
    const [lo, hi] = [[0, 20, 100, 1000, 1000, 10000][tier]!, [0, 99, 999, 9999, 9999, 99999][tier]!];
    const a = randInt(r, lo, hi);
    const b = randInt(r, Math.floor(lo / 2) || 1, a - 1);
    const info = subInfo(a, b);
    const want = tier; // 1 none, 2 single, 3 multiple, 4 across-zero, 5 across-zeros
    const ok = want === 1 ? info.borrows === 0
      : want === 2 ? info.borrows === 1 && !info.acrossZero
        : want === 3 ? info.borrows >= 2 && !info.acrossZero
          : want === 4 ? info.acrossZero && String(a).replace(/[^0]/g, '').length === 1
            : info.acrossZero && String(a).replace(/[^0]/g, '').length >= 2; // T5: two+ zeros
    if (!ok) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // regenerate until the exchange matches
    const key = a - b;
    // With NO borrow, |top−bottom| per column equals the real answer — the commutative-
    // subtraction error (#11) produces the key, so it cannot be a distractor at T1.
    const distractors = info.borrows > 0
      ? [
        { entry: 11, id: ID.commSub }, // |top − bottom| in each column (derived)
        { entry: 84, id: ID.addDiff, value: String(a + b) }, // added instead of subtracting
        { entry: 69, id: ID.droppedCarry, value: String(key + 10) }, // a borrow slip, over by ten
      ]
      : [
        { entry: 84, id: ID.addDiff, value: String(a + b) }, // added instead of subtracting
        { entry: 69, id: ID.droppedCarry, value: String(key + 10) }, // a place slip, over by ten
        { entry: 70, id: ID.colTotals, value: String(key + 1) }, // an off-by-one column slip
      ];
    return {
      stem: `Work out ${a.toLocaleString('en-GB')} − ${b.toLocaleString('en-GB')}.`,
      solution: `${a} - ${b}`, keyValue: String(key), operands: { a, b }, distractors,
      hint: 'Line up the columns. Borrow from the next column when the top digit is smaller.',
    };
  },
};

// ---------- P-3 · Negative numbers ----------
const negatives: MathsFamily = {
  id: 'M-neg',
  collapsed: 2, // COLLAPSED (annie, 2026-08-07). v2 ladder: compare · count across zero · temperature change
  name: 'Negative numbers — greatest of a set',
  shape: 'Negative numbers / temperature change',
  tierRule: (t) => ['', 'greatest of three, −10..0', 'greatest of four, −15..0', 'greatest of four, −20..5', 'greatest of four, −30..10', 'order of five, −30..10'][t]!,
  ranges: (t) => ['', '−10 to 0', '−15 to 0', '−20 to 5', '−30 to 10', '−30 to 10'][t]!,
  draft: (tier, r) => {
    const lo = [0, -10, -15, -20, -30, -30][tier]!;
    const hi = [0, 0, 0, 5, 10, 10][tier]!;
    const set = new Set<number>();
    while (set.size < 4) set.add(randInt(r, lo, hi));
    const nums = [...set];
    const key = Math.max(...nums);
    const furthest = nums.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m));
    const others = nums.filter((n) => n !== key && n !== furthest);
    return {
      stem: 'Which of these numbers is the greatest?',
      solution: null,
      keyValue: String(key),
      operands: { options: nums },
      hint: 'On a number line, greater means further to the right. Zero beats every minus.',
      distractors: [
        { entry: 8, id: ID.negInv }, // furthest from zero read as greatest (derived)
        { entry: 66, id: ID.negMiscount, value: String(others[0]) },
        { entry: 66, id: ID.negMiscount, value: String(others[1]) },
      ],
    };
  },
};

// ---------- P-4 · Fractions: add / subtract ----------
const fractionsAddSub: MathsFamily = {
  id: 'M-frac',
  collapsed: 4, // COLLAPSED (annie, 2026-08-07). v2 ladder: same denominator · related · unrelated
  name: 'Fractions — adding unit fractions',
  shape: 'Add / subtract / compare fractions',
  tierRule: (t) => ['', 'proper fractions, denominators to 5', 'proper fractions, denominators to 5', 'proper fractions, denominators to 6', 'proper fractions, denominators to 8', 'proper fractions, denominators to 9'][t]!,
  ranges: (t) => ['', 'denom 2–5', 'denom 2–5', 'denom 2–6', 'denom 3–8', 'denom 3–9'][t]!,
  draft: (tier, r) => {
    const cap = [0, 5, 5, 6, 8, 9][tier]!;
    const d1 = randInt(r, 2, cap);
    const d2 = randInt(r, 2, cap);
    const n1 = randInt(r, 1, d1 - 1);
    const n2 = randInt(r, 1, d2 - 1);
    const num = n1 * d2 + n2 * d1;
    const den = d1 * d2;
    if (num >= den) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // proper sum only — retry
    const g = gcd(num, den);
    return {
      stem: `What is ${n1}/${d1} + ${n2}/${d2}?`,
      solution: null,
      keyValue: `${num / g}/${den / g}`,
      operands: { n1, d1, n2, d2 },
      hint: 'Give the two fractions the same bottom number first. Then add the tops.',
      distractors: [
        { entry: 22, id: ID.addNumDenom }, // add tops and bottoms: (n1+n2)/(d1+d2) (derived)
        { entry: 21, id: ID.largerDenom, value: `${n1 + n2}/${Math.max(d1, d2)}` }, // added tops, kept the larger bottom
        { entry: 29, id: ID.noCommonDenom, value: `${n1 + n2}/${den}` }, // added tops over the multiplied bottom
      ],
    };
  },
};

// ---------- P-5a · Percentage (rebuilt to annie's review, 2026-08-07) ----------
// Single source: the tier CONFIG below drives generation AND renders the range/rule, so
// they cannot diverge. The ladder is by SHAPE, not magnitude — friendly %, then multiples
// of ten, then multiples of five, then a % CHANGE composition, then a REVERSE %. Per-tier
// hints. The amount is always a multiple of `step` so the answer is whole and in range.
const PCT_TIERS: Record<Tier, { pcts: number[]; step: number; amtLo: number; amtHi: number; shape: 'of' | 'change' | 'reverse'; rule: string; hint: string }> = {
  1: { pcts: [10, 25, 50], step: 20, amtLo: 1, amtHi: 15, shape: 'of', rule: 'friendly percentages (½, ¼, ⅒) of a round amount', hint: 'Fifty per cent is half. Twenty-five per cent is a quarter. Ten per cent is one tenth.' },
  2: { pcts: [10, 20, 30, 40, 60, 70, 80, 90], step: 10, amtLo: 3, amtHi: 30, shape: 'of', rule: 'multiples of ten per cent of a round amount', hint: 'Find ten per cent by dividing by ten. Then count how many tens you need.' },
  3: { pcts: [5, 15, 35, 45, 55, 65, 85, 95], step: 20, amtLo: 3, amtHi: 22, shape: 'of', rule: 'multiples of five per cent', hint: 'Find ten per cent, then halve it for five per cent. Build the percentage from those.' },
  4: { pcts: [10, 20, 25, 50], step: 20, amtLo: 6, amtHi: 45, shape: 'change', rule: 'percentage decrease — find the new price', hint: 'Find the discount first. Then take it off the original price.' },
  5: { pcts: [10, 20, 25, 50], step: 1, amtLo: 3, amtHi: 40, shape: 'reverse', rule: 'reverse — the percentage is known, find the whole', hint: 'You are told what the percentage is worth. Work back to the whole.' },
};
const pctAmtRange = (c: (typeof PCT_TIERS)[Tier]): string => `${c.amtLo * c.step}–${c.amtHi * c.step}`;
const percentageOfAmount: MathsFamily = {
  id: 'M-pct',
  name: 'Percentage',
  shape: 'Percentage of an amount / % change / reverse',
  tierRule: (t) => PCT_TIERS[t].rule,
  structuralParams: (t) => ({ shape: PCT_TIERS[t].shape, band: PCT_TIERS[t].pcts.join(',') }),
  numberRanges: (t): Record<string, [number, number]> => {
    const c = PCT_TIERS[t];
    return c.shape === 'reverse' ? { part: [c.amtLo, c.amtHi] } : { amount: [c.amtLo * c.step, c.amtHi * c.step] };
  },
  ranges: (t) => {
    const c = PCT_TIERS[t];
    if (c.shape === 'change') return `${c.pcts.join('/')}% off amounts ${pctAmtRange(c)}`;
    if (c.shape === 'reverse') return `${c.pcts.join('/')}%, the part worth ${c.amtLo}–${c.amtHi}`;
    return `${c.pcts.join('/')}% of amounts ${pctAmtRange(c)}`;
  },
  draft: (tier, r) => {
    const c = PCT_TIERS[tier];
    const pct = randPick(r, c.pcts);
    if (c.shape === 'change') {
      const amount = randInt(r, c.amtLo, c.amtHi) * c.step;
      const discount = (pct * amount) / 100; // step 1
      const key = amount - discount;
      return {
        stem: `A coat costs ${money(amount)}. In a sale it is reduced by ${pct}%. What is the new price?`,
        solution: `${amount} - ${pct} * ${amount} / 100`,
        keyValue: money(key),
        operands: { amount, firstStepResults: [discount] },
        hint: c.hint,
        distractors: [
          { entry: 0, id: ID.proc, value: money(discount), process: true }, // gave the discount, stopped
          { entry: 77, id: ID.pctMoney, value: money(amount + discount) }, // added the discount on
          { entry: 92, id: ID.unitarySlip, value: money(pct) }, // read the percentage as pounds
        ],
      };
    }
    if (c.shape === 'reverse') {
      const whole = randInt(r, c.amtLo, c.amtHi) * (100 / pct); // whole is a clean multiple
      const part = (pct * whole) / 100;
      return {
        stem: `${pct}% of a number is ${part}. What is the number?`,
        solution: `${part} * 100 / ${pct}`,
        keyValue: String(whole),
        operands: { percent: pct, part },
        hint: c.hint,
        distractors: [
          { entry: 92, id: ID.unitarySlip, value: String(part) }, // gave the part back
          { entry: 26, id: ID.pctUnit, value: String(part * (pct / 10)) }, // scaled by pct/10, not 100/pct
          { entry: 77, id: ID.pctMoney, value: String(part + pct) }, // added the percentage on
        ],
      };
    }
    const amount = randInt(r, c.amtLo, c.amtHi) * c.step;
    const key = (pct * amount) / 100;
    return {
      stem: `What is ${pct}% of ${amount}?`,
      solution: `${pct} * ${amount} / 100`,
      keyValue: String(key),
      operands: { percent: pct, amount },
      hint: c.hint,
      distractors: [
        { entry: 77, id: ID.pctMoney, value: String(pct) }, // read the percentage as the answer
        { entry: 26, id: ID.pctUnit, value: String((pct * amount) / 10) }, // divided by 10, not 100
        { entry: 92, id: ID.unitarySlip, value: String(amount + key) }, // added the percentage on instead
      ],
    };
  },
};

// ---------- P-5b · Ratio share ----------
const ratioShare: MathsFamily = {
  id: 'M-ratio',
  collapsed: 3, // COLLAPSED (annie, 2026-08-07). v2 ladder: larger share · either share · three-part
  name: 'Ratio share',
  shape: 'Ratio share',
  tierRule: (t) => ['', '', 'two-part ratio, larger share', 'two-part ratio, either share', 'two-part, larger totals', 'two-part, 3-digit totals'][t]!,
  ranges: (t) => ['', '', 'ratio parts 1–4, total to 60', 'parts 1–5, total to 90', 'parts 1–6, total to 150', 'parts 2–7, total to 300'][t]!,
  draft: (tier, r) => {
    const a = randInt(r, 1, 3 + tier);
    let b = randInt(r, 1, 3 + tier);
    while (b === a) b = randInt(r, 1, 3 + tier);
    const parts = a + b;
    const unit = randInt(r, 3, 6 + tier * 2);
    const total = parts * unit;
    const large = Math.max(a, b) * unit;
    return {
      stem: `${total} sweets are shared in the ratio ${a} : ${b}. What is the larger share?`,
      solution: `${Math.max(a, b)} * ${total} / ${parts}`,
      keyValue: String(large),
      operands: { total, a, b },
      hint: 'Add the ratio numbers to find how many equal parts. Share the total into those.',
      distractors: [
        { entry: 92, id: ID.unitarySlip, value: String(Math.min(a, b) * unit) }, // gave the smaller share
        { entry: 51, id: ID.addScale, value: String(unit) }, // gave one part only
        { entry: 52, id: ID.ratioFrac, value: String(total) }, // gave the whole total, did not share
      ],
    };
  },
};

// ---------- P-6a · Metric conversion ----------
const metricConversion: MathsFamily = {
  id: 'M-convert',
  collapsed: 2, // COLLAPSED (annie, 2026-08-07). v2 ladder: adjacent units · multi-step · up-and-down
  name: 'Metric unit conversion',
  shape: 'Unit conversion (length/mass/volume)',
  tierRule: (t) => ['', 'kg→g, whole', 'km→m / l→ml, whole', 'kg→g, 2-digit', 'larger whole values', 'multi-unit values'][t]!,
  ranges: (t) => ['', '1–9 kg', '1–9 km/l', '10–90 kg', '10–900', '100–9,000'][t]!,
  draft: (tier, r) => {
    // All ×1000 conversions, so #37 (prefix-as-×100) is always a wrong value, never the key.
    const [big, small, factor] = randPick(r, [['kg', 'g', 1000], ['km', 'm', 1000], ['litres', 'ml', 1000], ['g', 'mg', 1000]] as [string, string, number][]);
    const value = randInt(r, 1, [0, 12, 12, 90, 900, 9000][tier]!);
    const key = value * factor;
    return {
      stem: `Convert ${value} ${big} to ${small}.`,
      solution: `${value} * ${factor}`,
      keyValue: String(key),
      operands: { value },
      hint: 'There are 1000 small units in each big one. Multiply to go from big to small.',
      distractors: [
        { entry: 37, id: ID.metricPrefix }, // ×100 not ×1000 (derived)
        { entry: 36, id: ID.convWrongWay, value: String(value) }, // did not convert
        { entry: 68, id: ID.powerTen, value: String(value * factor * 10) }, // ×10000
      ],
    };
  },
};

// ---------- P-6b · Time interval ----------
const timeInterval: MathsFamily = {
  id: 'M-time',
  collapsed: 3, // COLLAPSED (annie, 2026-08-07). v2 ladder: within the hour · across it · across midnight
  name: 'Time interval',
  shape: 'Time interval / timetable journey',
  tierRule: (t) => ['', 'add minutes across the hour', 'add across the hour, larger', 'add across the hour, any start', 'add over an hour', 'timetable across the hour'][t]!,
  ranges: (t) => ['', 'start :35–:55, add 10–35', 'start :30–:55, add 10–40', 'start :20–:55, add 15–45', 'start :15–:55, add 20–50', 'start any, add 20–55'][t]!,
  draft: (tier, r) => {
    const startH = randInt(r, 1, 5);
    const startM = randInt(r, 3, 11) * 5; // 15–55
    const addM = randInt(r, 3, 11) * 5;
    if (startM + addM < 60) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // forces a retry (crosses the hour)
    const endM = startM + addM - 60;
    const key = `${startH + 1}:${pad2(endM)}`;
    return {
      stem: `A film starts at ${startH}:${pad2(startM)} and lasts ${addM} minutes. What time does it end?`,
      solution: null,
      keyValue: key,
      operands: { hour: startH, minute: startM, addMinutes: addM },
      hint: 'Count on to the next hour first. Then add the minutes that are left.',
      distractors: [
        { entry: 32, id: ID.base100time }, // no 60 rollover: H:(m+add) (derived)
        { entry: 33, id: ID.h1224, value: `${startH + 1}:${pad2(startM)}` }, // added an hour, kept the minutes
        { entry: 70, id: ID.colTotals, value: `${startH}:${pad2(endM)}` }, // right minutes, forgot the hour
      ],
    };
  },
};

// ---------- P-7 · Statistics: averages ----------
const statisticsAverages: MathsFamily = {
  id: 'M-stats',
  collapsed: 3, // COLLAPSED (annie, 2026-08-07). v2 ladder: mean · median/mode · missing value
  name: 'Statistics — mean of a list',
  shape: 'Mean of a list',
  tierRule: (t) => ['', 'mean of four small values', 'mean of four values', 'mean of five values', 'mean of five, larger', 'mean of six values'][t]!,
  ranges: (t) => ['', '4 values 1–12', '4 values 1–20', '5 values 1–20', '5 values 1–40', '6 values 1–40'][t]!,
  draft: (tier, r) => {
    const count = [0, 4, 4, 5, 5, 6][tier]!;
    const hi = [0, 12, 20, 20, 40, 40][tier]!;
    const mean = randInt(r, 3, hi - 2);
    const vals: number[] = [];
    for (let i = 0; i < count - 1; i += 1) vals.push(randInt(r, 1, hi));
    const last = mean * count - vals.reduce((s, x) => s + x, 0);
    if (last < 1 || last > hi) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // retry: keep the last value in range
    vals.push(last);
    const sum = mean * count;
    const sorted = [...vals].sort((x, y) => x - y);
    const median = count % 2 ? sorted[(count - 1) / 2]! : (sorted[count / 2 - 1]! + sorted[count / 2]!) / 2;
    return {
      stem: `A team scored ${vals.join(', ')} points in ${count} games. What is the mean score?`,
      solution: `(${vals.join(' + ')}) / ${count}`,
      keyValue: String(mean),
      operands: { values: vals },
      hint: 'Add all the scores together. Then divide by how many games there were.',
      distractors: [
        { entry: 56, id: ID.incMean }, // gave the total, forgot to divide (derived)
        { entry: 57, id: ID.meanMedian, value: String(median) }, // gave the median
        { entry: 95, id: ID.wrongStat, value: String(Math.max(...vals) - Math.min(...vals)) }, // gave the range
      ],
    };
  },
};

// ---------- P-8 · Geometry: calculate from given numbers (annie's axis) ----------
// Numbers are GIVEN in the stem — the "calculate" family. The diagram-READING family
// (find the numbers off a figure) groups with scale-reading and needs a render component.
// ---------- P-8 · Geometry — CALCULATE from given numbers (rebuilt to annie's review) ----------
// Ladder by SHAPE, not size: T1 perimeter · T2 area (a different skill, not a bigger one) ·
// T3 mixed (child reads which is asked) · T4 composite L-shape (COMPOSITION of two rectangles,
// firstStepResults are the two areas) · T5 composite where a missing side must be found first.
// Sides come from one bound per tier that also renders as the stated range. Per-tier hints.
const GEOM_TIERS: Record<Tier, { lo: number; hi: number; shape: 'perimeter' | 'area' | 'mixed' | 'lshape' | 'notch'; rule: string; hint: string }> = {
  1: { lo: 3, hi: 12, shape: 'perimeter', rule: 'perimeter of a rectangle', hint: 'Perimeter is all the way round. Add every side, or double the length plus the width.' },
  2: { lo: 3, hi: 12, shape: 'area', rule: 'area of a rectangle (a different job from perimeter)', hint: 'Area is the space inside. Multiply the length by the width.' },
  3: { lo: 6, hi: 15, shape: 'mixed', rule: 'perimeter OR area — read which is asked', hint: 'Read the question. Round the edge is perimeter; the space inside is area.' },
  4: { lo: 4, hi: 12, shape: 'lshape', rule: 'area of an L-shape (two rectangles joined)', hint: 'Split the L into two rectangles. Find each area, then add them.' },
  5: { lo: 5, hi: 14, shape: 'notch', rule: 'perimeter of a rectangle with a notch cut into one side', hint: 'A notch adds two new edges. Find its depth and add it to the perimeter twice.' },
};
const geometryCalculate: MathsFamily = {
  id: 'M-geom',
  name: 'Geometry — calculate from given lengths',
  shape: 'Perimeter / area of a rectangle and composite',
  tierRule: (t) => GEOM_TIERS[t].rule,
  structuralParams: (t) => ({ shape: GEOM_TIERS[t].shape }),
  numberRanges: (t) => {
    const c = GEOM_TIERS[t];
    const base: Record<string, [number, number]> = { l: [c.lo, c.hi], w: [c.lo, c.hi] };
    if (c.shape === 'notch') { base.nw = [2, c.hi - 1]; base.nd = [2, c.hi - 1]; } // the notch operands are bound too
    return base;
  },
  ranges: (t) => `sides ${GEOM_TIERS[t].lo}–${GEOM_TIERS[t].hi} cm`,
  draft: (tier, r) => {
    const c = GEOM_TIERS[tier];
    const l = randInt(r, c.lo + 1, c.hi);
    const w = randInt(r, c.lo, l - 1);
    if (c.shape === 'perimeter') {
      return {
        stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`,
        solution: `2 * (${l} + ${w})`, keyValue: String(2 * (l + w)), operands: { l, w }, hint: c.hint,
        distractors: [
          { entry: 87, id: ID.perimAreaSwap, value: String(l * w) }, // gave the area
          { entry: 88, id: ID.incompletePerim, value: String(l + w) }, // added the two sides once
          { entry: 70, id: ID.colTotals, value: String(2 * l + w) }, // doubled the length only
        ],
      };
    }
    if (c.shape === 'area') {
      return {
        stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in cm²?`,
        solution: `${l} * ${w}`, keyValue: String(l * w), operands: { l, w }, hint: c.hint,
        distractors: [
          { entry: 87, id: ID.perimAreaSwap, value: String(2 * (l + w)) }, // gave the perimeter
          { entry: 88, id: ID.incompletePerim, value: String(l + w) }, // added the sides once
          { entry: 90, id: ID.composite, value: String(l * w + l) }, // an extra strip added
        ],
      };
    }
    if (c.shape === 'mixed') {
      const askArea = r() < 0.5;
      return askArea
        ? { stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in cm²?`, solution: `${l} * ${w}`, keyValue: String(l * w), operands: { l, w }, hint: c.hint,
          distractors: [{ entry: 87, id: ID.perimAreaSwap, value: String(2 * (l + w)) }, { entry: 88, id: ID.incompletePerim, value: String(l + w) }, { entry: 90, id: ID.composite, value: String(l * w + l) }] }
        : { stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, solution: `2 * (${l} + ${w})`, keyValue: String(2 * (l + w)), operands: { l, w }, hint: c.hint,
          distractors: [{ entry: 87, id: ID.perimAreaSwap, value: String(l * w) }, { entry: 88, id: ID.incompletePerim, value: String(l + w) }, { entry: 70, id: ID.colTotals, value: String(2 * l + w) }] };
    }
    // Composite L-shape: a big rectangle l×w with a smaller a×b corner removed. The
    // stem is split into short sentences so it clears the reading-age cap.
    if (l - 2 < c.lo || w - 2 < c.lo) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // the corner would not fit — retry
    const a = randInt(r, c.lo, l - 2);
    const b = randInt(r, c.lo, w - 2);
    const bigArea = l * w;
    const cutArea = a * b;
    if (c.shape === 'lshape') {
      const key = bigArea - cutArea;
      return {
        stem: `An L-shape is made from a ${l} cm by ${w} cm rectangle. A ${a} cm by ${b} cm corner is removed. What is the area in cm²?`,
        solution: `${l} * ${w} - ${a} * ${b}`, keyValue: String(key), operands: { l, w, firstStepResults: [bigArea, cutArea] }, hint: c.hint,
        distractors: [
          { entry: 0, id: ID.proc, value: String(bigArea), process: true }, // gave the whole rectangle, forgot the cut
          { entry: 90, id: ID.composite, value: String(bigArea + cutArea) }, // added the corner instead of removing it
          { entry: 88, id: ID.incompletePerim, value: String(cutArea) }, // gave only the corner
        ],
      };
    }
    // NOTCH (annie's T5 fix, 2026-08-07): a rectangular slot cut into one long side ADDS
    // 2 × depth to the perimeter (a corner cut would not — that was the hollow item). So the
    // answer depends on the notch, and a child who ignores it (2(l+w)) is now WRONG, not right.
    const nd = randInt(r, 2, w - 1); // notch depth, bound ≥ 2 and < width
    const nw = randInt(r, 2, l - 1); // notch width, bound ≥ 2 and < length
    const key = 2 * (l + w) + 2 * nd;
    return {
      stem: `A rectangle is ${l} cm by ${w} cm. A notch ${nw} cm wide and ${nd} cm deep is cut into one long side. What is the perimeter in cm?`,
      solution: `2 * (${l} + ${w}) + 2 * ${nd}`, keyValue: String(key), operands: { l, w, nw, nd, firstStepResults: [2 * (l + w), 2 * nd] }, hint: c.hint,
      distractors: [
        { entry: 88, id: ID.incompletePerim, value: String(2 * (l + w)) }, // ignored the notch entirely (the 30/30 trap, now wrong)
        { entry: 90, id: ID.composite, value: String(2 * (l + w) + nd) }, // added the depth once, not twice
        { entry: 87, id: ID.perimAreaSwap, value: String(l * w - nw * nd) }, // gave the area instead
      ],
    };
  },
};

// ---------- M-06b · Worded fraction of an amount (composition; split-child) ----------
const wordedFraction: MathsFamily = {
  id: 'M-06b',
  collapsed: 4, // COLLAPSED (annie, 2026-08-07). v2 ladder: one-step worded · two-step · of-the-remainder
  name: 'Fraction of an amount — worded (two-step)',
  shape: 'Fraction of an amount',
  tierRule: (t) => ['', '', '', 'find a unit fraction, then the rest', 'unit fraction of a 2-digit amount, then the rest', 'unit fraction of a 3-digit amount, then the rest'][t]!,
  ranges: (t) => ['', '', '', 'denom 2–4, amount 12–48', 'denom 3–5, amount 30–120', 'denom 3–6, amount 60–240'][t]!,
  draft: (tier, r) => {
    const denom = randInt(r, 2 + Math.floor((tier - 3) / 1), 4 + (tier - 3));
    const part = randInt(r, 6, 12 + (tier - 3) * 12);
    const amount = denom * part; // 1/denom of amount = part (whole)
    const key = amount - part; // how many are LEFT
    const obj = randPick(r, OBJECTS);
    return {
      stem: `There are ${amount} ${obj}. One ${obj.slice(0, -1)} in ${denom} is taken. How many are left?`,
      solution: `${amount} - ${amount} / ${denom}`,
      keyValue: String(key),
      operands: { firstStepResults: [part] },
      hint: 'Work out how many are taken first. Then take that from the total.',
      distractors: [
        { entry: 0, id: ID.proc, value: String(part), process: true }, // stopped at the part taken (derived)
        { entry: 84, id: ID.addDiff, value: String(amount + part) }, // added the part instead
        { entry: 92, id: ID.unitarySlip, value: String(amount - denom) }, // took the denominator, not the part
      ],
    };
  },
};

// ---------- INVERSE REASONING (the nineteenth; annie 2026-08-07) ----------
// Knowing the output, working back to the input. Resolves the algebra and reverse-mean
// orphans (both are backwards reasoning). Tiered on STEPS TO UNDO, not number size —
// T1 one operation, T3 two, T5 two where the undoing order decides. Draws the two new
// ids (#109/#110), the three reassignments (#14/#100/#72) and PROC-01, widened for a
// chain worked backwards. One of the few families that carries T4/T5 honestly.
const inverseReasoning: MathsFamily = {
  id: 'M-inverse',
  name: 'Inverse reasoning — work back to the input',
  shape: 'Missing number / function machine (early algebra) + reverse mean',
  // Adjusted to annie's two notes (2026-08-07): the pairs no longer differ by size —
  // T2 makes the child SPOT which operation to undo (not just a bigger ×), and T4 is a
  // genuinely ORDER-SENSITIVE two-step (undo the outside first). T5's rule no longer
  // claims "order decides" — reverse mean is an extra step back, not an order case.
  tierRule: (t) => ['', 'one operation — division to undo', 'one operation — spot which to undo', 'two operations — take away, then divide', 'two operations — order decides (undo the outside first)', 'reverse mean — recover a value from the average'][t]!,
  structuralParams: (t) => ({ steps: [0, 1, 1, 2, 2, 3][t]!, mode: ['', 'known-op', 'spot-op', 'ordered', 'order-decides', 'reverse-mean'][t]! }),
  ranges: (t) => ['', '□ × 2–5, answer 2–9', '□ ?(×/+) 2–9, answer 2–10', '□ × a + b, a 2–4, answer 3–9', '(□ + a) × b, b 2–4, answer 3–8', '5 numbers, mean 4–9, values 1–14'][t]!,
  draft: (tier, r) => {
    if (tier === 1) {
      // One-step, known operation: □ × c = result. Undo = divide.
      const c = randInt(r, 2, 5);
      const q = randInt(r, 2, 9);
      const result = q * c;
      return {
        stem: `□ × ${c} = ${result}. What is □?`,
        solution: `${result} / ${c}`, keyValue: String(q), operands: { result, c, op: 'mult' },
        hint: 'Going backwards undoes the step. Divide where it multiplied.',
        distractors: [
          { entry: 109, id: ID.ranForwards }, // multiplied instead of dividing (derived)
          { entry: 14, id: ID.signAnswer, value: String(result) }, // gave the number after the = sign
          { entry: 72, id: ID.wrongOp, value: String(result - c) }, // subtracted instead of dividing
        ],
      };
    }
    if (tier === 2) {
      // One-step, but the child must SPOT the operation (× or +) before undoing it.
      const mult = r() < 0.5;
      const c = randInt(r, 2, 9);
      const q = randInt(r, 2, 10);
      const result = mult ? q * c : q + c;
      return {
        stem: `□ ${mult ? '×' : '+'} ${c} = ${result}. What is □?`,
        solution: mult ? `${result} / ${c}` : `${result} - ${c}`, keyValue: String(q),
        operands: { result, c, op: mult ? 'mult' : 'add' },
        hint: 'Spot the operation, then undo it. Divide undoes times; take away undoes plus.',
        distractors: [
          { entry: 109, id: ID.ranForwards }, // ran the machine forwards (derived: applies the stated op)
          { entry: 14, id: ID.signAnswer, value: String(result) }, // gave the number after the = sign
          { entry: 72, id: ID.wrongOp, value: String(mult ? result - c : result * c) }, // undid with the wrong operation
        ],
      };
    }
    if (tier === 3) {
      // Two operations, one sensible undo order: □ × a + b = result. Take away, then divide.
      const a = randInt(r, 2, 4);
      const q = randInt(r, 3, 9);
      const m = randInt(r, 1, 5);
      const b = a * m;
      const result = a * q + b;
      return {
        stem: `□ × ${a} + ${b} = ${result}. What is □?`,
        solution: `(${result} - ${b}) / ${a}`, keyValue: String(q),
        operands: { result, c: b, op: 'sub', firstStepResults: [a * q] },
        hint: 'Undo the last step first. Take away the number added, then divide.',
        distractors: [
          { entry: 0, id: ID.proc, value: String(a * q), process: true }, // took away b, stopped before dividing (derived)
          { entry: 72, id: ID.wrongOp, value: String(q + m) }, // divided first, ignored the + b
          { entry: 14, id: ID.signAnswer, value: String(result) }, // gave the number after the = sign
        ],
      };
    }
    if (tier === 4) {
      // Two operations where ORDER DECIDES: (□ + a) × b = result. Undo ÷b, then − a.
      // a is a multiple of b so the wrong-order value stays whole (that is the trap).
      const b = randInt(r, 2, 4);
      const k = randInt(r, 1, 3);
      const a = b * k;
      const q = randInt(r, 3, 8);
      const result = (q + a) * b;
      return {
        stem: `(□ + ${a}) × ${b} = ${result}. What is □?`,
        solution: `${result} / ${b} - ${a}`, keyValue: String(q),
        operands: { firstStepResults: [result / b] },
        hint: 'Undo the outside first. Divide by the multiplier, then take away.',
        distractors: [
          { entry: 100, id: ID.stepsOrder, value: String(q + k * (b - 1)) }, // took away first, then divided — wrong order
          { entry: 0, id: ID.proc, value: String(result / b), process: true }, // divided, stopped before taking away (derived)
          { entry: 72, id: ID.wrongOp, value: String(result - a) }, // took a off the result, ignored ×b
        ],
      };
    }
    // T5 — reverse mean: five numbers, one unknown; order/steps decide.
    const mean = randInt(r, 4, 9);
    const known: number[] = [];
    for (let i = 0; i < 4; i += 1) known.push(randInt(r, 1, 14));
    const total = mean * 5;
    const sumKnown = known.reduce((s, x) => s + x, 0);
    const missing = total - sumKnown;
    if (missing < 1 || missing > 14 || missing === mean) return { stem: '', solution: null, keyValue: 'x', operands: {}, distractors: [] }; // retry: keep the answer in range and off the mean
    return {
      stem: `Five numbers have a mean of ${mean}. Four of them are ${known.join(', ')}. What is the fifth?`,
      solution: `${mean} * 5 - (${known.join(' + ')})`,
      keyValue: String(missing),
      operands: { mean, firstStepResults: [sumKnown, total] },
      hint: 'The mean is what they share out to. Find the total first, then take the four away.',
      distractors: [
        { entry: 110, id: ID.reverseMeanAvg }, // gave the mean itself (derived)
        { entry: 0, id: ID.proc, value: String(total), process: true }, // found the total, stopped (derived)
        { entry: 14, id: ID.signAnswer, value: String(sumKnown) }, // gave the sum of the four
      ],
    };
  },
};

export const MATHS_FAMILIES: MathsFamily[] = [
  rounding, timeAndMoney, wrongOperation, reversedDivision, misreadQuantity, unitFraction, unitPrice,
  placeValue, columnArithmetic, negatives, fractionsAddSub, percentageOfAmount, ratioShare,
  metricConversion, timeInterval, statisticsAverages, geometryCalculate, wordedFraction, inverseReasoning,
];
