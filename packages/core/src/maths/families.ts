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
} as const;

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

export const MATHS_FAMILIES: MathsFamily[] = [rounding, timeAndMoney, wrongOperation, reversedDivision, misreadQuantity, unitFraction, unitPrice];
