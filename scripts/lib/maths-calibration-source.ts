/**
 * THE MATHS CALIBRATION BATCH, as source for the two reviewer documents.
 *
 * Built in one place so the gap-family doc, the review pack and the freshness
 * checker all derive from the same reading of Cowork's batch file. The 60-entry
 * library reached authoring after this batch was drafted, so 110 of its 120
 * distractors carry a plain-language behaviour rather than a library id. This
 * clusters those behaviours into GAP FAMILIES — the recurring misconception
 * patterns authoring reached for that the library does not yet name — for the
 * reviewer to number and word.
 *
 * Clustering is by GROUP then first-matching family, so a trigger phrase can
 * never pull a behaviour into another curriculum area. Coverage is asserted:
 * an unmatched behaviour throws, so nothing falls silently between families.
 */
import { readFileSync } from 'node:fs';

export const BATCH_PATH = '/Users/davidb/Downloads/11+/items/maths/MATHS-CALIBRATION-01.json';

export const CATEGORY_NAMES: Record<string, string> = {
  NPV: 'Number & Place Value',
  CALC: 'Calculation',
  FDP: 'Fractions, Decimals & Percentages',
  MEAS: 'Measurement',
  GEOM: 'Geometry',
  STATS: 'Statistics',
};
export const GROUP_ORDER = ['NPV', 'CALC', 'FDP', 'MEAS', 'GEOM', 'STATS'];

interface FamilyDef { slug: string; group: string; title: string; description: string; triggers: string[]; }

/** The gap families. `triggers` are lowercased substrings; first match in the group wins. */
export const FAMILIES: FamilyDef[] = [
  // --- NPV ---
  { slug: 'npv-place-value-digit-misread', group: 'NPV', title: 'Place-value digit misread', description: "Reads a digit's value from the wrong column, or gives its face value ignoring place.", triggers: ['as if it sits in the', 'face value', 'reads only the digit'] },
  { slug: 'npv-wrong-column-operation', group: 'NPV', title: 'Adds or loses a carry in the wrong column', description: 'Adds to, or loses a carry into, the wrong place-value column.', triggers: ['adds to the', 'loses the carry into'] },
  { slug: 'npv-leading-zero-ordering', group: 'NPV', title: 'Leading-zero ordering slip', description: 'Orders digits wrongly around a zero — leads with it, or builds the largest instead of the smallest.', triggers: ['puts the 0 first', 'largest number instead of the smallest', 'biggest digit to lead'] },
  { slug: 'npv-rounding-place-or-direction', group: 'NPV', title: 'Rounds to the wrong place or always down', description: 'Rounds to the wrong multiple of ten, or always rounds down.', triggers: ['rounds down by chopping', 'nearest ten instead', 'nearest thousand instead of the nearest hundred'] },
  { slug: 'npv-negative-across-zero', group: 'NPV', title: 'Negative numbers across zero', description: 'Mishandles a negative result — keeps it positive, counts the wrong way, or miscounts through zero.', triggers: ['keeps it positive', 'adds instead of counting down', 'miscounts across zero'] },
  { slug: 'npv-digit-transposition', group: 'NPV', title: 'Digit transposition or dropped placeholder', description: 'Transposes two digits, or drops a zero placeholder when writing the number.', triggers: ['swaps the', 'drops the zero placeholder'] },
  { slug: 'npv-place-value-scaling', group: 'NPV', title: 'Counts the wrong power of ten', description: 'Counts how many tens or thousands when the question asks how many hundreds.', triggers: ['counts tens instead of hundreds', 'counts whole thousands instead of hundreds'] },
  // --- CALC ---
  { slug: 'calc-drops-the-carry', group: 'CALC', title: 'Drops or mishandles the carry', description: 'Loses a carry, writes a two-digit column total without carrying, or sets column products side by side.', triggers: ['drops the carry', 'without carrying', 'forgets to add the carried', 'side by side'] },
  { slug: 'calc-forgets-part', group: 'CALC', title: 'Forgets part of a multi-step problem', description: 'Completes one step and forgets another, or rounds without compensating.', triggers: ['forgets the other', 'loose eggs', 'leaves out a whole place value', 'does not compensate'] },
  { slug: 'calc-wrong-order', group: 'CALC', title: 'Wrong order of operations', description: 'Applies the steps in the wrong order.', triggers: ['wrong order', 'before multiplying'] },
  { slug: 'calc-digitwise-division', group: 'CALC', title: 'Divides digit by digit', description: 'Divides each digit on its own and drops the remainders.', triggers: ['divides each digit'] },
  { slug: 'calc-wrong-operation', group: 'CALC', title: 'Wrong operation', description: 'Performs the wrong operation — adds instead of subtracting or multiplying, or inverts a division.', triggers: ['adds instead of', 'multiplies instead of dividing', 'subtracts instead of dividing', 'adds the total spent', 'adds the used eggs'] },
  // --- FDP ---
  { slug: 'fdp-compare-fractions', group: 'FDP', title: 'Compares fractions wrongly', description: 'Judges fractions equal on a shared numerator, or believes different denominators cannot be compared.', triggers: ['same top number and calls', 'cannot be compared'] },
  { slug: 'fdp-percent-of-amount', group: 'FDP', title: 'Percentage of an amount slip', description: 'Reads a percent as pounds, forgets the ÷100, or confuses common fraction equivalents.', triggers: ['as 25 pounds', 'forgets to divide by 100', 'as 10 pounds', 'confuses a quarter with a half'] },
  { slug: 'fdp-divide-by-fraction', group: 'FDP', title: 'Dividing by a fraction', description: 'Mishandles dividing by a fraction — adds it, or treats it as a whole.', triggers: ['adds the half instead of dividing', 'treats a half as one whole'] },
  { slug: 'fdp-add-fractions', group: 'FDP', title: 'Adding fractions', description: 'Adds fractions by combining numerators and denominators in some wrong way.', triggers: ['tops together and the bottoms', 'keeps the bigger bottom', 'but multiplies the bottoms'] },
  { slug: 'fdp-discount-not-applied', group: 'FDP', title: 'Discount not subtracted', description: 'Finds a discount but adds it, or forgets to take it off.', triggers: ['forgets to take it off', 'adds the discount instead of subtracting', 'discount but forgets'] },
  { slug: 'fdp-fraction-of-wrong-whole', group: 'FDP', title: 'Fraction of the wrong whole', description: 'Takes the fraction of the whole instead of the intended part, or forgets a final halving.', triggers: ['whole class instead of just the rest', 'halves the walkers', 'forgets to halve'] },
  { slug: 'fdp-fraction-of-amount', group: 'FDP', title: 'Fraction of an amount slip', description: 'Takes a wrong step finding a fraction of an amount — stops early, ignores the denominator, or inverts.', triggers: ['finds one third and stops', 'multiplies by the top and ignores', 'upside down', 'uses only the top', 'quarter instead of three-quarters'] },
  // --- MEAS ---
  { slug: 'meas-money-place-value', group: 'MEAS', title: 'Money place-value slip', description: 'Loses the pence, or handles pounds and pence inconsistently.', triggers: ['drops the 50p', 'pence only once'] },
  { slug: 'meas-unitary-proportion', group: 'MEAS', title: 'Unitary proportion slip', description: 'Two-step proportion error — skips finding one unit, or scales by the wrong count.', triggers: ['total price as the price of one', 'multiplies the price by the extra', 'not the new', "one person's share then multiplies", 'multiplies the amount by the extra', 'without finding one share'] },
  { slug: 'meas-incomplete-money-step', group: 'MEAS', title: 'Forgets a step in a money problem', description: 'Completes part of a multi-item money problem and forgets the rest or the change step.', triggers: ['leaves the rubber out', 'stops at the total spent', 'subtracts only the last item'] },
  { slug: 'meas-compare-ignoring-quantity', group: 'MEAS', title: 'Compares price ignoring quantity', description: 'Compares prices without accounting for different quantities.', triggers: ['compares the pack prices', 'adds the two egg prices', 'divides each price by the other'] },
  { slug: 'meas-count-or-rounding', group: 'MEAS', title: 'Miscount or rounding in measures', description: 'Off-by-one on a count, or rounds a measure wrongly.', triggers: ['one fewer pack', 'rounds 35 down', 'packs to the price instead of multiplying'] },
  { slug: 'meas-add-instead-of-subtract', group: 'MEAS', title: 'Adds instead of subtracting (change or length)', description: 'Adds when the problem calls for taking away — change, or a cut length.', triggers: ['adds the price on instead', 'adds the cut length on'] },
  // --- GEOM ---
  { slug: 'geom-perimeter-area-swap', group: 'GEOM', title: 'Perimeter/area swap', description: 'Computes area when asked for perimeter, or vice versa.', triggers: ['area instead of the perimeter', 'area as the perimeter', 'perimeter instead of area'] },
  { slug: 'geom-perimeter-incomplete', group: 'GEOM', title: 'Incomplete perimeter', description: 'Adds only some sides — forgetting to double, or to count all four.', triggers: ['forgetting the opposite sides', 'forgets one of the four sides', 'forgetting to double'] },
  { slug: 'geom-angle-wrong-total', group: 'GEOM', title: 'Wrong angle total', description: 'Uses the wrong angle sum (360 vs 180 vs a straight line), or mishandles splitting the remainder.', triggers: ['360', 'right angle of 90', 'forgets to split', 'halves 180'] },
  { slug: 'geom-coordinate-read', group: 'GEOM', title: 'Coordinate read slip', description: 'Reads a coordinate the wrong way round, or subtracts instead of matching.', triggers: ['up before across', 'subtracts the coordinates', 'from the wrong corner'] },
  { slug: 'geom-composite-area', group: 'GEOM', title: 'Composite-shape area slip', description: 'Mishandles a cut-out — forgets it, adds it, or uses the wrong operation for a missing length.', triggers: ['forgets the cut-out', 'adds the cut-out area', 'width instead of dividing'] },
  // --- STATS ---
  { slug: 'stats-incomplete-total', group: 'STATS', title: 'Incomplete total', description: 'Leaves a row or category out of a total.', triggers: ['leaves one row', 'forgetting to combine'] },
  { slug: 'stats-reads-wrong-quantity', group: 'STATS', title: 'Reads the wrong quantity', description: 'Reads or totals the wrong quantity off a table or chart.', triggers: ['counts how many children', 'largest single value instead of the total', 'adds every bar and ignores'] },
  { slug: 'stats-mean-incomplete', group: 'STATS', title: 'Mean slip', description: 'Mishandles the mean — forgets to divide, divides by the wrong count, or gives the range.', triggers: ['forgets to divide by how many', 'divides by 2', 'range instead of the mean'] },
  { slug: 'stats-missing-value-mean', group: 'STATS', title: 'Missing-value mean slip', description: 'Mishandles a missing value in a mean problem.', triggers: ['only the four given', 'multiplies the mean by four', 'missing number just equals the mean'] },
];

export interface GapFamily { slug: string; group: string; title: string; description: string; items: Record<string, number>; distractors: number; }
export interface CalItem {
  itemId: string; group: string; tier: number; steps: string; stem: string; solution: string; key: string; walkScript: string;
  tierQuery: boolean;
  options: Array<{ label: string; value: string; isKey: boolean; misconceptionRef: string | null; familySlug: string | null; behaviour: string | null; working: string | null }>;
}

function assignFamily(group: string, behaviour: string): FamilyDef | null {
  const b = behaviour.toLowerCase();
  return FAMILIES.find((f) => f.group === group && f.triggers.some((t) => b.includes(t))) ?? null;
}

interface RawOption { label: string; value: unknown; isKey?: boolean; misconceptionRef?: string | null; misconceptionBehaviour?: string; distractorWorking?: string; }
interface RawItem { itemId: string; group: string; tier: number; steps: string; stem: string; solution: unknown; solutionValue: unknown; explanation?: { walkScript?: string }; options: RawOption[]; }
function loadBatch(): { items: RawItem[] } {
  return JSON.parse(readFileSync(BATCH_PATH, 'utf8'));
}

const TIER_QUERY_ITEMS = new Set(['MC01-MEAS-03', 'MC01-MEAS-06', 'MC01-GEOM-06']);

/** The PREVIOUS reviewer's tier rulings on the flagged items (her written review;
 *  reconstructed into the repo 2026-08-05). Authored before the handover — NOT the
 *  current reviewer's work. See docs/maths-misconception-seed-additions-61-97.md. */
const TIER_RULINGS: Record<string, number> = { 'MC01-MEAS-03': 2, 'MC01-MEAS-06': 2, 'MC01-GEOM-06': 4 };

export function buildCalibration(): { items: CalItem[]; families: GapFamily[] } {
  const batch = loadBatch();
  const famMap = new Map<string, GapFamily>();
  const unmatched: string[] = [];
  const items: CalItem[] = batch.items.map((it) => {
    const options = it.options.map((o) => {
      let familySlug: string | null = null;
      if (!o.isKey && !o.misconceptionRef) {
        const fam = assignFamily(it.group, o.misconceptionBehaviour ?? '');
        if (!fam) unmatched.push(`${it.itemId}: ${o.misconceptionBehaviour}`);
        else {
          familySlug = fam.slug;
          const g = famMap.get(fam.slug) ?? { slug: fam.slug, group: fam.group, title: fam.title, description: fam.description, items: {}, distractors: 0 };
          g.items[it.itemId.replace('MC01-', '')] = (g.items[it.itemId.replace('MC01-', '')] ?? 0) + 1;
          g.distractors += 1;
          famMap.set(fam.slug, g);
        }
      }
      return {
        label: o.label, value: String(o.value), isKey: !!o.isKey,
        misconceptionRef: o.misconceptionRef ?? null, familySlug,
        behaviour: o.isKey ? null : (o.misconceptionBehaviour ?? null), working: o.distractorWorking ?? null,
      };
    });
    return {
      itemId: it.itemId, group: it.group, tier: TIER_RULINGS[it.itemId] ?? it.tier, steps: it.steps,
      stem: it.stem, solution: String(it.solution), key: String(it.solutionValue),
      walkScript: it.explanation?.walkScript ?? '', tierQuery: TIER_QUERY_ITEMS.has(it.itemId),
      options,
    };
  });
  if (unmatched.length) throw new Error(`Unclustered behaviours (${unmatched.length}):\n${unmatched.join('\n')}`);
  // families in FAMILIES order, then group order
  const families = FAMILIES.map((f) => famMap.get(f.slug)).filter((g): g is GapFamily => !!g);
  return { items, families };
}

/**
 * The PREVIOUS reviewer's additions 61-97 (her predecessor, authored before the
 * handover — NOT the current reviewer) were written directly from these gap
 * families, in doc order (docs/maths-misconception-seed-additions-61-97.md). The
 * 2026-08-06 date below is only when this family->id mapping was encoded in code,
 * not when she authored the additions. Four families were split into two ids each
 * so no single item can
 * carry two options under one misconception (the R11 rule): place-value reading
 * (61 wrong column / 62 face value), the calculation carry (69 dropped / 70 two-
 * digit total), fraction-of-an-amount (75 incomplete / 76 inverted) and
 * percentage-of-an-amount (77 as money / 78 fraction confusion). Every populated
 * family maps; `calc-wrong-order` carries no distractors in this batch and no
 * addition was written for it. Split families resolve by the distractor's own
 * behaviour so each distractor lands on exactly one id.
 */
const FAMILY_ADDITION: Record<string, number> = {
  'npv-wrong-column-operation': 63, 'npv-leading-zero-ordering': 64, 'npv-rounding-place-or-direction': 65,
  'npv-negative-across-zero': 66, 'npv-digit-transposition': 67, 'npv-place-value-scaling': 68,
  'calc-forgets-part': 71, 'calc-wrong-operation': 72, 'calc-digitwise-division': 73,
  'fdp-compare-fractions': 74, 'fdp-divide-by-fraction': 79, 'fdp-add-fractions': 80,
  'fdp-discount-not-applied': 81, 'fdp-fraction-of-wrong-whole': 82,
  'meas-money-place-value': 83, 'meas-add-instead-of-subtract': 84, 'meas-count-or-rounding': 85,
  'meas-incomplete-money-step': 86, 'meas-unitary-proportion': 92, 'meas-compare-ignoring-quantity': 93,
  'geom-perimeter-area-swap': 87, 'geom-perimeter-incomplete': 88, 'geom-angle-wrong-total': 89,
  'geom-composite-area': 90, 'geom-coordinate-read': 91,
  'stats-incomplete-total': 94, 'stats-reads-wrong-quantity': 95, 'stats-mean-incomplete': 96, 'stats-missing-value-mean': 97,
};

/** The addition id (61-97) a gap-family distractor maps to; null if its family has no addition. */
export function additionIdFor(familySlug: string, behaviour: string): number | null {
  const b = behaviour.toLowerCase();
  switch (familySlug) {
    case 'npv-place-value-digit-misread': return /face value|reads only the digit/.test(b) ? 62 : 61;
    case 'calc-drops-the-carry': return /without carrying|side by side/.test(b) ? 70 : 69;
    case 'fdp-fraction-of-amount': return /upside down/.test(b) ? 76 : 75;
    case 'fdp-percent-of-amount': return /quarter with a half/.test(b) ? 78 : 77;
    default: return FAMILY_ADDITION[familySlug] ?? null;
  }
}
