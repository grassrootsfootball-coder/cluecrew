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
} as const;

const pad2 = (n: number): string => String(n).padStart(2, '0');
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

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
  ranges: (t) => ['', 'item £1.50–£4.50, £5 note', 'item £1.50–£8.50, £10 note', 'item £2–£6 × 2–4', 'item £2–£6 × 2–4, £20 note', 'items £2–£9, £20 note'][t]!,
  draft: (tier: Tier, r) => {
    if (tier <= 2) {
      const note = tier === 1 ? 5 : 10;
      const obj = randPick(r, ['toy', 'book', 'pen', 'kite', 'mug', 'cap', 'ball']);
      const cost = randInt(r, 11, note * 10 - 5) / 10; // 10p resolution, carries pence, < note
      const change = note - cost;
      return {
        stem: `A ${obj} costs ${money(cost)}. You pay with a ${money(note)} note. How much change do you get?`,
        solution: `${note} - ${cost}`,
        keyValue: money(change),
        operands: { a: note, b: cost },
        hint: 'Take the cost away from what you paid. Count up from the cost to the note.',
        distractors: [
          { entry: 84, id: ID.addDiff, value: money(note + cost) }, // added instead of subtracting
          { entry: 72, id: ID.wrongOp, value: money(cost) }, // gave the cost back as the change
          { entry: 106, id: ID.roundDown, value: money(note - Math.floor(cost)) }, // dropped the pence
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
  tierRule: (t) => ['', '2-digit − 2-digit', '3-digit − 2/3-digit', '4-digit − 3-digit', '4-digit − 4-digit with borrows', '5-digit − 4-digit'][t]!,
  ranges: (t) => ['', '20–99', '120–999', '1,200–9,999', '3,000–9,999', '12,000–99,999'][t]!,
  draft: (tier, r) => {
    const mag = [0, 10, 100, 1000, 1000, 10000][tier]!;
    const a = randInt(r, mag * (tier >= 4 ? 3 : 2), mag * 10 - 1);
    const b = randInt(r, mag, a - 1);
    const key = a - b;
    return {
      stem: `Work out ${a.toLocaleString('en-GB')} − ${b.toLocaleString('en-GB')}.`,
      solution: `${a} - ${b}`,
      keyValue: String(key),
      operands: { a, b },
      hint: 'Line up the columns. Borrow from the next column when the top digit is smaller.',
      distractors: [
        { entry: 11, id: ID.commSub }, // |top − bottom| in each column (derived)
        { entry: 84, id: ID.addDiff, value: String(a + b) }, // added instead of subtracting
        { entry: 69, id: ID.droppedCarry, value: String(key + 10) }, // a borrow slip, over by ten
      ],
    };
  },
};

// ---------- P-3 · Negative numbers ----------
const negatives: MathsFamily = {
  id: 'M-neg',
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

// ---------- P-5a · Percentage of an amount ----------
const percentageOfAmount: MathsFamily = {
  id: 'M-pct',
  name: 'Percentage of an amount',
  shape: 'Percentage of an amount / % change',
  tierRule: (t) => ['', '10% / 50% of round amounts', '10/25/50% of round amounts', 'multiples of 5% ', '5% steps, 3-digit amount', 'reverse and % change'][t]!,
  ranges: (t) => ['', '10/50% of 20–200', '10/25/50% of 40–400', '5–90% of 20–200', '5–95% of 100–900', '5–90% of 100–900'][t]!,
  draft: (tier, r) => {
    const pct = tier <= 1 ? randPick(r, [10, 50]) : tier === 2 ? randPick(r, [10, 25, 50]) : randInt(r, 1, 19) * 5;
    const step = pct % 25 === 0 ? 4 : 20; // amount a multiple that keeps the answer whole
    const amount = randInt(r, 2, 22 + tier * 4) * step * (tier >= 4 ? 5 : 1);
    const key = (pct * amount) / 100;
    return {
      stem: `What is ${pct}% of ${amount}?`,
      solution: `${pct} * ${amount} / 100`,
      keyValue: String(key),
      operands: { percent: pct, amount },
      hint: 'Find one per cent first by dividing by 100. Then multiply by the percentage.',
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
const geometryCalculate: MathsFamily = {
  id: 'M-geom',
  name: 'Geometry — perimeter and area from given lengths',
  shape: 'Perimeter / area of a rectangle',
  tierRule: (t) => ['', 'perimeter, 1-digit sides', 'perimeter, 2-digit sides', 'area, 1–2 digit sides', 'perimeter or area, larger', 'perimeter or area, 2-digit'][t]!,
  ranges: (t) => ['', 'sides 3–9 cm', 'sides 6–20 cm', 'sides 4–15 cm', 'sides 8–30 cm', 'sides 10–40 cm'][t]!,
  draft: (tier, r) => {
    const l = randInt(r, [0, 5, 8, 6, 10, 12][tier]!, [0, 16, 24, 18, 32, 44][tier]!);
    let w = randInt(r, 3, l - 1); // w < l so perimeter ≠ area coincidences are rarer
    if (w < 2) w = 2;
    const area = l * w;
    const perim = 2 * (l + w);
    if (tier === 3) { // area tier
      return {
        stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its area in cm²?`,
        solution: `${l} * ${w}`,
        keyValue: String(area),
        operands: { l, w },
        hint: 'Area is the space inside. Multiply the length by the width.',
        distractors: [
          { entry: 87, id: ID.perimAreaSwap, value: String(perim) }, // gave the perimeter
          { entry: 88, id: ID.incompletePerim, value: String(l + w) }, // added the two sides once
          { entry: 90, id: ID.composite, value: String(l * w + l) }, // an extra strip added
        ],
      };
    }
    return {
      stem: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`,
      solution: `2 * (${l} + ${w})`,
      keyValue: String(perim),
      operands: { l, w },
      hint: 'Perimeter is all the way round. Add all four sides, or double the length plus width.',
      distractors: [
        { entry: 87, id: ID.perimAreaSwap, value: String(area) }, // gave the area
        { entry: 88, id: ID.incompletePerim, value: String(l + w) }, // added the two sides once, no doubling
        { entry: 70, id: ID.colTotals, value: String(2 * l + w) }, // doubled the length only
      ],
    };
  },
};

// ---------- M-06b · Worded fraction of an amount (composition; split-child) ----------
const wordedFraction: MathsFamily = {
  id: 'M-06b',
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

export const MATHS_FAMILIES: MathsFamily[] = [
  rounding, timeAndMoney, wrongOperation, reversedDivision, misreadQuantity, unitFraction, unitPrice,
  placeValue, columnArithmetic, negatives, fractionsAddSub, percentageOfAmount, ratioShare,
  metricConversion, timeInterval, statisticsAverages, geometryCalculate, wordedFraction,
];
