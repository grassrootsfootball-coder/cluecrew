/**
 * SPaG GENERATOR — English on the maths model (David, 2026-08-08).
 *
 * SPaG is 56% of a GL English paper (BUILD-DISTRICT-ENGLISH §1) and, unlike comprehension,
 * it is RULE-DRIVEN: a finite set of error franchises (spelling doubles, misplaced
 * apostrophes, tense-sequence slips) injected into a carrier the child reads. That is the
 * maths-family shape — difficulty in a declared, parameterised dial, not in novelty — so
 * SPaG families run on the SAME engine contracts as maths: a per-tier tier rule, DECLARED
 * structural parameters the ladder gate checks, GENERATOR-CONSUMED number ranges, and a
 * sample sheet that renders both.
 *
 * What it does NOT reuse is the maths derivability gate: a SPaG distractor is not an
 * executed arithmetic misconception, it is a segment a child wrongly flags (error-spot) or
 * a wrong grammatical form (cloze). So `assembleSpagItem` runs a LEGALITY gate in its place
 * — every wrong option carries a real misconception id (P3), no option repeats or equals
 * the key, the floor holds — plus the one shared child-facing gate. Correctness of the
 * UNTOUCHED material is by construction: the family draws its clean segments from a
 * pre-cleared bank and injects exactly one error, so "the other segments are correct" is a
 * property of the signed bank, not of a language validator that could not be trusted anyway.
 */
import {
  familyTiers,
  makeRng,
  renderNumberRanges,
  structuralLadderGaps,
  type LadderGap,
  type LadderedFamily,
  type Tier,
} from '../maths/generator';
import { checkItemChildFacing } from '../item-content-gate';
import { isBlocking } from '../content-gates';

export type SpagSubtype = 'spelling' | 'punctuation' | 'cloze';

export interface SpagOption {
  value: string;
  isKey: boolean;
  /** Every WRONG option carries the misconception a child executes by choosing it (P3). */
  misconceptionId?: string | null;
}

export interface SpagItemDraft {
  /** The fixed instruction (error-spot) or the gap prompt (cloze). Child-facing. */
  stem: string;
  /** The full option set — for error-spot the four segments + the N option; for cloze the
   *  paradigm. Exactly one isKey; every non-key carries a misconceptionId. */
  options: SpagOption[];
  /** Numeric dials the range gate enforces (syllables, segments, gapIndex …) plus any
   *  string labels. Only numeric entries are range-checked. */
  params: Record<string, number | string>;
  /** Sampler identity of the underlying stimulus (e.g. the carrier SENTENCE). A sample never
   *  shows the same stimulus twice — not its correct form AND its errored form — so a child is
   *  never handed the answer to one item by another (annie, 2026-08-08). Defaults to stem+options. */
  dedupKey?: string;
  /** The error CLASS being exercised (e.g. the homophone pair). A sample caps any one class to
   *  a stated share so a family samples its space rather than one pair (annie, 2026-08-08). */
  diversityKey?: string;
}

/** Satisfies LadderedFamily structurally, so it runs on the shared ladder/range machinery. */
export interface SpagFamily {
  id: string;
  name: string;
  subtype: SpagSubtype;
  /** The error franchise this family exercises as the KEY error — a misconception id. */
  franchise: string;
  tierRule: (tier: Tier) => string;
  structuralParams: (tier: Tier) => Record<string, string | number>;
  numberRanges: (tier: Tier) => Record<string, [number, number]>;
  draft: (tier: Tier, r: () => number) => SpagItemDraft;
}

export interface GenSpagItem {
  familyId: string;
  tier: Tier;
  stem: string;
  key: string;
  options: SpagOption[];
  params: Record<string, number | string>;
  dedupKey?: string;
  diversityKey?: string;
}

export class SpagGateError extends Error {}

/** Assemble a drafted SPaG item through the range + legality + child-facing gates. */
export function assembleSpagItem(family: SpagFamily, tier: Tier, r: () => number): GenSpagItem {
  const d = family.draft(tier, r);

  const keys = d.options.filter((o) => o.isKey);
  if (keys.length !== 1) throw new SpagGateError(`${family.id} T${tier}: ${keys.length} keys, expected exactly 1`);
  const key = keys[0]!.value;

  // Range enforcement — the maths lesson: a declared range is a constraint, not a label.
  const bounds = family.numberRanges(tier);
  for (const [k, [lo, hi]] of Object.entries(bounds)) {
    const v = d.params[k];
    if (typeof v !== 'number') throw new SpagGateError(`${family.id} T${tier}: range key "${k}" has no numeric param`);
    if (v < lo || v > hi) throw new SpagGateError(`${family.id} T${tier}: ${k}=${v} outside stated range ${lo}–${hi}`);
  }

  // Legality gate (stands in for maths derivability): every wrong option tagged (P3),
  // nothing repeats, nothing ties the key, floor of three distractors holds.
  const wrong = d.options.filter((o) => !o.isKey);
  if (wrong.length < 3) throw new SpagGateError(`${family.id} T${tier}: ${wrong.length} distractors, below floor 3`);
  for (const o of wrong) {
    if (!o.misconceptionId) throw new SpagGateError(`${family.id} T${tier}: an option has no misconception tag (P3): "${o.value}"`);
  }
  const values = d.options.map((o) => o.value);
  if (wrong.some((o) => o.value === key)) throw new SpagGateError(`${family.id} T${tier}: a distractor equals the key ("${key}")`);
  if (values.some((v, i) => values.indexOf(v) !== i)) throw new SpagGateError(`${family.id} T${tier}: options repeat (${values.join(' | ')})`);

  // The one shared child-facing gate — reading age, banned vocabulary, internal-id leaks
  // over the stem and every option. Runs at production so nothing generates that a serving
  // door would later reject.
  const failures = checkItemChildFacing({
    id: `${family.id}-T${tier}`,
    stem: d.stem,
    explanation: {},
    options: d.options.map((o) => ({ content: { value: o.value } })),
  });
  const blocking = failures.filter(isBlocking);
  if (blocking.length) throw new SpagGateError(`${family.id} T${tier}: ${blocking.map((f) => `${f.rule}: ${f.detail}`).join('; ')}`);

  return { familyId: family.id, tier, stem: d.stem, key, options: d.options, params: d.params, dedupKey: d.dedupKey, diversityKey: d.diversityKey };
}

/** No single error CLASS (diversityKey) may exceed this share of a sample — so a family samples
 *  its space rather than one pair. A third, per annie's pair-share rule (2026-08-08). */
const DIVERSITY_SHARE = 1 / 3;

/** Generate `count` distinct gated items for one tier, reseeding past collisions. Enforces two
 *  serving rules at sample time: no stimulus (dedupKey) appears twice — not its correct and its
 *  errored form — and no error class (diversityKey) exceeds a stated share. */
export function generateSpagSample(family: SpagFamily, tier: Tier, count: number, seed = 1): GenSpagItem[] {
  const out: GenSpagItem[] = [];
  const seen = new Set<string>();
  const classCount = new Map<string, number>();
  const cap = Math.max(1, Math.ceil(count * DIVERSITY_SHARE));
  const r = makeRng(seed * 100003 + tier * 31 + 11);
  for (let attempt = 0; attempt < count * 80 && out.length < count; attempt += 1) {
    let item: GenSpagItem;
    try {
      item = assembleSpagItem(family, tier, r);
    } catch (e) {
      if (e instanceof SpagGateError) continue;
      throw e;
    }
    const dedup = item.dedupKey ?? `${item.stem}|${item.options.map((o) => o.value).join(',')}`;
    if (seen.has(dedup)) continue;
    if (item.diversityKey && (classCount.get(item.diversityKey) ?? 0) >= cap) continue;
    seen.add(dedup);
    if (item.diversityKey) classCount.set(item.diversityKey, (classCount.get(item.diversityKey) ?? 0) + 1);
    out.push(item);
  }
  if (out.length < count) throw new SpagGateError(`${family.id} T${tier}: produced ${out.length}/${count} clean items — family defect, not a seed accident`);
  return out;
}

/** The structural-ladder gate over SPaG families — the SAME implementation as maths. */
export function spagLadderGaps(families: SpagFamily[]): LadderGap[] {
  return structuralLadderGaps(families as LadderedFamily[]);
}

/** One family's sample-sheet header line: tier rule + rendered number ranges (one source). */
export function spagFamilySheetRows(family: SpagFamily): Array<{ tier: Tier; rule: string; ranges: string }> {
  return familyTiers(family as LadderedFamily).map((tier) => ({
    tier,
    rule: family.tierRule(tier),
    ranges: renderNumberRanges(family.numberRanges(tier)),
  }));
}
