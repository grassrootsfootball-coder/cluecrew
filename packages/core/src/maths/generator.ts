/**
 * MATHS GENERATOR ENGINE — ported into the repo (David, 2026-08-07).
 *
 * The point of the port: the library, the executors, the notation formatter and the
 * derivability gate are IMPORTS here, not reimplementations. A family is
 * `structure + per-tier number ranges + tier rule + misconception constructors`, and
 * every item it emits is assembled THROUGH the gate — a family cannot ship an item
 * whose key does not recompute or whose distractor is not its executed misconception.
 *
 * Two findings preserved from the drafting side rather than rebuilt:
 *   · COMPOSITION — T4/T5 are two- and three-step compositions of the T1-T3 primitives.
 *     `firstStepResults` falls out of the composition (the intermediate values), it is
 *     not authored; a PROC-01 distractor is one of those intermediates by construction.
 *   · THE TWO-DISTRACTOR FLOOR (calibration R9) — unit-fraction (M-06a) and unit-price
 *     (M-05a) yield only two non-colliding distractors; a third is correct by
 *     construction. Those families are allow-listed to ship two, never topped up.
 */
import { MISCONCEPTION_EXECUTORS, answersEqual, evalArithmetic, type MathsOperands } from './executors';
import { checkMathsItem, type MathsDistractor } from './check-item';
import { normaliseMathsNotation } from './notation';
import { checkItemChildFacing } from '../item-content-gate';
import { isBlocking } from '../content-gates';

export type Tier = 1 | 2 | 3 | 4 | 5;

/** Deterministic PRNG (mulberry32) — sample sheets must reproduce, and Math.random
 *  would make a signed sheet unre-generatable. Seed per (family, tier). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randInt = (r: () => number, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));
export const randPick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

export interface GenOption { value: string; isKey: boolean; misconceptionId?: string | null; processMisconceptionId?: string | null }
export interface GenMathsItem {
  familyId: string;
  tier: Tier;
  stem: string;
  key: string;
  options: GenOption[];
  solution: string | null;
  operands: MathsOperands;
  hint?: string;
}

/** A distractor declared by a family, before assembly. `entry` is the misconception
 *  number; `derive` true means the value MUST be its executor's output (the gate then
 *  reproves it); false means authored (no executor exists) and it ships disclosed. */
export interface DistractorSpec {
  entry: number;
  id: string;
  value?: string; // required when authored; ignored when derived (executor supplies it)
  process?: boolean; // tag as PROC-01 process axis (paired with the topic id)
  /** DISPLAY format for a derived value (e.g. wrap a raw executor number in £). The gate
   *  still checks the numeric equality, so £4.00 and the executed 4 remain the same. */
  format?: (raw: string) => string;
}

/** Execute a misconception on the operands, or null if it has no executor / cannot run. */
export function derive(entry: number, operands: MathsOperands): string | null {
  return MISCONCEPTION_EXECUTORS[entry]?.(operands) ?? null;
}

export interface FamilyItemDraft {
  stem: string;
  solution: string | null;
  keyValue: string;
  operands: MathsOperands;
  distractors: DistractorSpec[];
  hint?: string;
}

export interface MathsFamily {
  id: string;
  name: string;
  shape: string; // which of Cowork's 38 shapes this generates
  /** Human-readable, for the sample sheet — the reviewer signs the rule, not the output. */
  tierRule: (tier: Tier) => string;
  /**
   * DECLARED structural parameters per tier (annie's ladder gate, 2026-08-07): the
   * non-numeric dials a tier turns — shape, step count, operation, which-percentages.
   * The gate requires adjacent tiers to differ in at least ONE, so a magnitude-only
   * ladder is forced to confront itself at build time. A family with a real ladder
   * declares distinct parameters; one without either declares none (flagged) or declares
   * identical ones (flagged). BLIND SPOTS it cannot see (recorded, corpus Entry): a
   * family with no numbers at all (vr-04); intra-tier monotony where a tier is itself one
   * shape (M-place T1, every item the hundreds column); a tier whose declared parameter
   * differs but whose ITEM does not use it (M-geom T5 before the notch fix — honest
   * ladder, hollow item). The gate checks the DECLARATION, not that the item honours it.
   */
  structuralParams?: (tier: Tier) => Record<string, string | number>;
  /**
   * STRUCTURED number ranges, per tier, keyed by operand name: {l: [3, 12], w: [3, 12]}.
   * This is GENERATOR-CONSUMED, not a display label (annie, 2026-08-07: the old `ranges`
   * string was authored by hand and never enforced). assembleItem refuses any item whose
   * named operand falls outside its bound, so the stated range is the range — a family
   * cannot emit outside what its sheet claims. The sheet renders THIS, one source.
   */
  numberRanges?: (tier: Tier) => Record<string, [number, number]>;
  /** Legacy display string — used only where numberRanges is not yet declared (the
   *  families still to be rebuilt). Never enforced; the sheet marks it unverified. */
  ranges?: (tier: Tier) => string;
  /** Allow-listed to ship fewer than three distractors (the two-distractor floor, R9). */
  distractorFloor?: 2;
  draft: (tier: Tier, r: () => number) => FamilyItemDraft;
}

export interface LadderGap { familyId: string; issue: string; between?: [Tier, Tier] }
/**
 * The structural-ladder gate (annie's spec). A multi-tier family must declare structural
 * parameters, and every adjacent tier pair must differ in at least one — otherwise the
 * tiers differ only in numeric range, which the range check alone would pass. Returns the
 * gaps; empty means every multi-tier family has a real (declared) ladder.
 */
export function structuralLadderGaps(families: MathsFamily[]): LadderGap[] {
  const gaps: LadderGap[] = [];
  for (const f of families) {
    const tiers = familyTiers(f);
    if (tiers.length < 2) continue; // a single-tier family makes no ladder claim to check
    if (!f.structuralParams) { gaps.push({ familyId: f.id, issue: `claims ${tiers.length} tiers but declares no structural parameter — magnitude-only by default` }); continue; }
    for (let i = 1; i < tiers.length; i += 1) {
      const a = f.structuralParams(tiers[i - 1]!), b = f.structuralParams(tiers[i]!);
      const differs = [...new Set([...Object.keys(a), ...Object.keys(b)])].some((k) => a[k] !== b[k]);
      if (!differs) gaps.push({ familyId: f.id, issue: `tiers ${tiers[i - 1]} and ${tiers[i]} share every structural parameter — they differ only in numeric range`, between: [tiers[i - 1]!, tiers[i]!] });
    }
  }
  return gaps;
}

/** Render structured numberRanges as a human range string for the sample sheet. */
export function renderNumberRanges(ranges: Record<string, [number, number]>): string {
  return Object.entries(ranges).map(([k, [lo, hi]]) => `${k} ${lo.toLocaleString('en-GB')}–${hi.toLocaleString('en-GB')}`).join(', ');
}

export class GateError extends Error {}

/** The tiers a family supports — those for which it states a tier rule. A family that
 *  starts at T3 (a two-step split-child) leaves T1-T2 blank. */
export function familyTiers(family: MathsFamily): Tier[] {
  return ([1, 2, 3, 4, 5] as Tier[]).filter((t) => family.tierRule(t).trim() !== '');
}

/**
 * Assemble a drafted item into a gated GenMathsItem. Resolves each distractor to its
 * executed value (derived) or its authored value, then runs checkMathsItem and the
 * notation gate. Any defect throws — the family cannot emit it.
 */
export function assembleItem(family: MathsFamily, tier: Tier, r: () => number): GenMathsItem {
  const d = family.draft(tier, r);

  // Key must recompute from its own solution (when one is given).
  if (d.solution !== null) {
    const computed = evalArithmetic(d.solution);
    if (computed === null || !answersEqual(String(computed), d.keyValue)) {
      throw new GateError(`${family.id} T${tier}: solution "${d.solution}" => ${computed}, key ${d.keyValue}`);
    }
  }

  const options: GenOption[] = [{ value: d.keyValue, isKey: true }];
  const specForCheck: MathsDistractor[] = [];
  for (const ds of d.distractors) {
    let value = ds.value;
    const derived = derive(ds.entry, d.operands);
    if (derived !== null) {
      // Derived: the executor is the source of truth; an authored value must match it.
      if (value !== undefined && !answersEqual(value, derived)) {
        throw new GateError(`${family.id} T${tier}: #${ds.entry} authored "${value}" != executed "${derived}"`);
      }
      value = ds.format ? ds.format(derived) : derived;
    }
    if (value === undefined) throw new GateError(`${family.id} T${tier}: #${ds.entry} has no executor and no authored value`);
    const opt: GenOption = ds.process
      ? { value, isKey: false, misconceptionId: ds.id.startsWith('maths-proc') ? null : ds.id, processMisconceptionId: 'maths-proc-01-stopped-at-the-first-answer' }
      : { value, isKey: false, misconceptionId: ds.id };
    options.push(opt);
    specForCheck.push({ value, misconceptionId: opt.misconceptionId ?? null, processMisconceptionId: opt.processMisconceptionId });
  }

  const floor = family.distractorFloor ?? 3;
  if (d.distractors.length < floor) throw new GateError(`${family.id} T${tier}: ${d.distractors.length} distractors, below floor ${floor}`);

  // Scope line, DONE-5: no distractor equals the key, none repeats within the item.
  // A collision here is a generation accident on this seed, not a family fault — the
  // sample builder reseeds and retries. Throwing keeps a bad item from ever emitting.
  const wrong = options.filter((o) => !o.isKey).map((o) => o.value);
  if (wrong.some((v) => answersEqual(v, d.keyValue))) throw new GateError(`${family.id} T${tier}: a distractor equals the key (${d.keyValue})`);
  if (wrong.some((v, i) => wrong.findIndex((w) => answersEqual(v, w)) !== i)) throw new GateError(`${family.id} T${tier}: distractors repeat (${wrong.join(', ')})`);

  // Range enforcement (annie, 2026-08-07): every named operand must fall inside the
  // family's declared numberRanges for this tier. This is what makes the stated range a
  // constraint rather than a label — a family that generates outside its own range throws.
  const bounds = family.numberRanges?.(tier);
  if (bounds) {
    for (const [key, [lo, hi]] of Object.entries(bounds)) {
      const v = d.operands[key];
      if (typeof v === 'number' && (v < lo || v > hi)) throw new GateError(`${family.id} T${tier}: ${key}=${v} outside stated range ${lo}–${hi}`);
    }
  }

  // The derivability gate — key recompute, distractor-executes-misconception, R11
  // parametric exemption, PROC-01 firstStepResults. Defects (not review-only) block.
  const failures = checkMathsItem({ id: `${family.id}-T${tier}`, solution: d.solution, keyValue: d.keyValue, operands: d.operands, distractors: specForCheck });
  const defects = failures.filter((f) => f.severity === 'defect');
  if (defects.length) throw new GateError(`${family.id} T${tier}: ${defects.map((f) => `${f.rule}: ${f.detail}`).join('; ')}`);

  // The ONE child-facing gate (Entry 50 discipline) — reading age, banned vocabulary,
  // internal-id leaks AND house notation, applied to stem, options and the hint at
  // production so nothing generates that a serving door would later reject. The stem is
  // notation-normalised first (money on £, never patched per batch).
  const stem = normaliseMathsNotation(d.stem);
  const childFacing = checkItemChildFacing({
    id: `${family.id}-T${tier}`,
    stem,
    explanation: d.hint ? { hintCore: d.hint } : {},
    options: options.map((o) => ({ content: { value: o.value } })),
  });
  const blocking = childFacing.filter(isBlocking);
  if (blocking.length) throw new GateError(`${family.id} T${tier}: ${blocking.map((f) => `${f.rule}: ${f.detail}`).join('; ')}`);

  return { familyId: family.id, tier, stem, key: d.keyValue, options, solution: d.solution, operands: d.operands, hint: d.hint };
}

/**
 * Generate `count` distinct, gated items for one tier. A GateError on a seed (a
 * collision, or an operand set an executor can't run) is retried with the next seed,
 * not surfaced — the invariant is upheld by reseeding. Stems are de-duplicated so a
 * sheet never shows the same numbers twice. Throws only if the family cannot produce
 * `count` clean items within a bounded number of attempts (a real family defect).
 */
export function generateSample(family: MathsFamily, tier: Tier, count: number, seed = 1): GenMathsItem[] {
  const out: GenMathsItem[] = [];
  const seen = new Set<string>();
  const r = makeRng(seed * 100003 + tier * 31 + 7);
  for (let attempt = 0; attempt < count * 40 && out.length < count; attempt += 1) {
    let item: GenMathsItem;
    try {
      item = assembleItem(family, tier, r);
    } catch (e) {
      if (e instanceof GateError) continue;
      throw e;
    }
    // Dedup on stem AND option values — a "pick the greatest" family shares one stem
    // but varies the options, so the stem alone would collapse the whole sheet.
    const key = `${item.stem}|${item.options.map((o) => o.value).sort().join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  if (out.length < count) throw new GateError(`${family.id} T${tier}: produced ${out.length}/${count} clean items — family defect, not a seed accident`);
  return out;
}

/** Which of a family's distractor entries are DERIVED (an executor reproduces them) vs
 *  AUTHORED — Annie's per-family requirement #2. Sampled across tiers via a draft. */
export function familyExecutorCoverage(family: MathsFamily): { derived: number[]; authored: number[] } {
  const derivedSet = new Set<number>();
  const authoredSet = new Set<number>();
  for (const tier of [1, 2, 3, 4, 5] as Tier[]) {
    let d: FamilyItemDraft;
    try {
      d = family.draft(tier, makeRng(tier * 7919 + 1));
    } catch {
      continue;
    }
    for (const ds of d.distractors) (derive(ds.entry, d.operands) !== null ? derivedSet : authoredSet).add(ds.entry);
  }
  return { derived: [...derivedSet].sort((a, b) => a - b), authored: [...authoredSet].sort((a, b) => a - b) };
}
