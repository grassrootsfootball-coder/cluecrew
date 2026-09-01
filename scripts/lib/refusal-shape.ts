/**
 * THE SHAPE OF A REFUSAL SET IS AN INSTRUMENT HYPOTHESIS BEFORE IT IS A CONTENT FINDING
 * (David's ruling, 2026-09-01 — R961's guard, mechanised).
 *
 * Instruments here fail toward refusal: an incomplete predicate under-matches, and under-matching
 * is the default state of any pattern that is merely unfinished. A wrong PASS reads as broken and
 * gets fixed; a wrong REFUSE reads as strict, and strictness is what this estate prizes — so false
 * refusals accumulate uninvestigated, wearing the costume of rigour. Not one instrument fault in
 * the week that produced R961 failed by passing something it should have caught.
 *
 * The guard is the one thing that does not depend on anybody's suspicion: the SHAPE of the set.
 * A refusal population that is
 *
 *   REGULAR         — every refusal gives the same reason,
 *   CLUSTERED       — every refusal falls in one entry, type or artefact, or one value's rows
 *                     refuse wholesale, or
 *   ROUND_FRACTION  — the refusals are an exactly-reducible small fraction of the denominator
 *                     (9 of 15 is 3 of 5; a count too round to be about content),
 *
 * is flagged as an instrument hypothesis, in print, before anyone dispatches the refusals as
 * content faults. It is a HYPOTHESIS, not a verdict — a true content fault can be shaped (one bad
 * batch clusters in one artefact), so this never exits nonzero on shape alone. What it removes is
 * the dependence on vigilance: the line prints whether or not anybody was suspicious (R173 —
 * vigilance is not a mechanism). Asked of refusals specifically, because agreement gets
 * scrutinised now and strictness still does not.
 *
 * The fixture is CARRIED (R721): the three incidents that would have fired — 569 of 689 absent
 * under one reason, 183 refusals all within vr-17, 9 of 15 all one entry — plus one irregular
 * clean set that must NOT fire, since a guard that only ever fires has not been shown to
 * discriminate.
 */

import { assertFixture, type FixtureCase } from './carried-fixture';

export interface ScreenedRow {
  refused: boolean;
  /** The refusal's stated reason, when refused. Omit on non-refused rows. */
  reason?: string;
  /** Whatever the emitter knows about the row — entry, type, artefact, source file. */
  dims?: Record<string, string>;
}

export interface RefusalHypothesis {
  kind: 'REGULAR' | 'CLUSTERED' | 'ROUND_FRACTION';
  detail: string;
}

export interface RefusalShapeReport {
  denominator: number;
  refusals: number;
  hypotheses: RefusalHypothesis[];
}

/** Below this many refusals every set is trivially "shaped"; the shape says nothing. */
const MIN_REFUSALS = 3;
/** A fraction that reduces to n/d with d at or under this is "too round to be about content". */
const MAX_ROUND_DENOMINATOR = 12;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Pure computation — no printing, so the carried fixture can exercise it silently.
 * Throws on an empty denominator: a gate screening nothing is requirePopulation's territory
 * (R60/R61), and a shape report over nothing would launder that into a finding.
 */
export function computeRefusalShape(rows: ReadonlyArray<ScreenedRow>): RefusalShapeReport {
  if (rows.length === 0) {
    throw new Error(
      'refusal-shape: screened nothing — the shape of an empty set is not assessable. ' +
        'An empty population is requirePopulation\'s territory, not this guard\'s.',
    );
  }
  const refusals = rows.filter((r) => r.refused);
  const report: RefusalShapeReport = {
    denominator: rows.length,
    refusals: refusals.length,
    hypotheses: [],
  };
  if (refusals.length < MIN_REFUSALS) return report;

  // REGULAR — one reason accounts for every refusal.
  const reasons = refusals.map((r) => r.reason).filter((r): r is string => r !== undefined);
  if (reasons.length === refusals.length && new Set(reasons).size === 1) {
    report.hypotheses.push({
      kind: 'REGULAR',
      detail: `all ${refusals.length} refusals give one reason: "${reasons[0]}"`,
    });
  }

  // CLUSTERED — on some dimension, every refusal shares one value, or one value refuses wholesale.
  const dimKeys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.dims ?? {})) dimKeys.add(k);
  for (const key of [...dimKeys].sort()) {
    const populationValues = new Set(rows.map((r) => r.dims?.[key]).filter((v): v is string => v !== undefined));
    if (populationValues.size < 2) continue; // one value in the whole population: concentration is vacuous
    const refusalValues = refusals.map((r) => r.dims?.[key]).filter((v): v is string => v !== undefined);
    if (refusalValues.length !== refusals.length) continue; // shape only over fully-dimensioned refusals
    if (new Set(refusalValues).size === 1) {
      const value = refusalValues[0];
      const carriers = rows.filter((r) => r.dims?.[key] === value);
      const wholesale = carriers.every((r) => r.refused);
      report.hypotheses.push({
        kind: 'CLUSTERED',
        detail:
          `all ${refusals.length} refusals carry ${key}="${value}"` +
          (wholesale ? ` — and every one of its ${carriers.length} rows refused (wholesale)` : ''),
      });
    }
  }

  // ROUND_FRACTION — refusals/denominator reduces to a fraction with a small denominator.
  const d = report.denominator / gcd(report.refusals, report.denominator);
  if (d <= MAX_ROUND_DENOMINATOR) {
    const n = report.refusals / (report.denominator / d);
    report.hypotheses.push({
      kind: 'ROUND_FRACTION',
      detail: `${report.refusals} of ${report.denominator} is exactly ${n} of ${d} — a count too round to be about content`,
    });
  }

  return report;
}

/**
 * The guard as an emitter calls it: compute, then PRINT — the same station requirePopulation's
 * denominator line holds. Never exits nonzero on shape alone; a hypothesis orders a reading of the
 * instrument, it does not issue a verdict on the content.
 */
export function assessRefusalShape(gate: string, rows: ReadonlyArray<ScreenedRow>): RefusalShapeReport {
  const report = computeRefusalShape(rows);
  if (report.refusals === 0) {
    console.log(`${gate}: refusal shape — 0 of ${report.denominator} refused; nothing to shape.`);
    return report;
  }
  if (report.hypotheses.length === 0) {
    console.log(
      `${gate}: refusal shape — ${report.refusals} of ${report.denominator} refused; ` +
        'the set is irregular. No instrument hypothesis; read the refusals as content.',
    );
    return report;
  }
  console.log(`\n${gate}: INSTRUMENT HYPOTHESIS BEFORE CONTENT FINDING (R961).`);
  console.log(`  ${report.refusals} of ${report.denominator} refused, and the set is shaped:`);
  for (const h of report.hypotheses) console.log(`    ${h.kind}: ${h.detail}`);
  console.log(
    '  A shaped refusal set is the signature of an incomplete predicate, not of content that\n' +
      '  failed in unison. Investigate the instrument before dispatching one of these refusals\n' +
      '  as a content fault. If the instrument survives the reading, the refusals stand.\n',
  );
  return report;
}

// ---------------------------------------------------------------------------------------------
// THE CARRIED FIXTURE — the three incidents that would have fired, and one clean set (R721).
// Synthetic reconstructions the instrument owns; they cannot be repaired out from under it.
// ---------------------------------------------------------------------------------------------

function walkerCase(): ScreenedRow[] {
  // R955: the walker blind to a second artefact shape reported 569 of 689 executions absent —
  // 565 of them present under keys it did not read. Every refusal gave the same reason.
  const rows: ScreenedRow[] = [];
  for (let i = 0; i < 689; i += 1) {
    const artefact = `crossed-artefact-${i % 3}`;
    rows.push(
      i < 569
        ? { refused: true, reason: 'value absent at expected key', dims: { artefact } }
        : { refused: false, dims: { artefact } },
    );
  }
  return rows;
}

function vr17Case(): ScreenedRow[] {
  // R955: a number/string type mismatch refused 183 seats, every one within vr-17, while every
  // other question type passed. Reasons varied in wording per seat, so REGULAR need not carry it;
  // the cluster must.
  const rows: ScreenedRow[] = [];
  for (let i = 0; i < 183; i += 1) {
    rows.push({ refused: true, reason: `declared "${i}" does not equal derived ${i}`, dims: { type: 'vr-17' } });
  }
  for (let i = 0; i < 118; i += 1) {
    rows.push({ refused: false, dims: { type: `vr-${(i % 16) + 1}` } });
  }
  return rows;
}

function wrongScopeCase(): ScreenedRow[] {
  // R960: the derivation check condemned 9 of 15 executions, all carrying the one entry whose
  // predicted property it scored as a failure. 9 of 15 is also exactly 3 of 5.
  const rows: ScreenedRow[] = [];
  for (let i = 0; i < 9; i += 1) {
    rows.push({ refused: true, reason: 'citation outside window', dims: { entry: 'en-wrong-scope-retrieval' } });
  }
  const others = ['en-attribute-transfer', 'en-extreme-option-pull', 'en-form-without-meaning'];
  for (let i = 0; i < 6; i += 1) {
    rows.push({ refused: false, dims: { entry: others[i % others.length]! } });
  }
  return rows;
}

function irregularCleanCase(): ScreenedRow[] {
  // A refusal set with the shape content faults actually have: sparse, scattered across entries,
  // several distinct reasons, an irreducible fraction (7 of 214). Must be caught by NOTHING.
  const rows: ScreenedRow[] = [];
  const refusedAt = [3, 41, 77, 102, 150, 188, 209];
  const reasons = ['key missing', 'span not in text', 'option count', 'notation'];
  for (let i = 0; i < 214; i += 1) {
    const entry = `entry-${i % 11}`;
    const hit = refusedAt.indexOf(i);
    rows.push(
      hit >= 0
        ? { refused: true, reason: reasons[hit % reasons.length], dims: { entry } }
        : { refused: false, dims: { entry } },
    );
  }
  return rows;
}

export const REFUSAL_SHAPE_FIXTURE: ReadonlyArray<FixtureCase<ScreenedRow[]>> = [
  { name: '569 of 689 absent under one reason (R955 walker)', input: walkerCase(), mustBeCaught: true },
  { name: '183 refusals all within vr-17 (R955 type mismatch)', input: vr17Case(), mustBeCaught: true },
  { name: '9 of 15 all one entry (R960 wrong-scope)', input: wrongScopeCase(), mustBeCaught: true },
  { name: '7 of 214, scattered entries, four reasons (clean)', input: irregularCleanCase(), mustBeCaught: false },
];

/** Run the carried fixture. Any emitter may call this before its sweep; check:refusal-shape runs it in CI. */
export function runRefusalShapeFixture(): void {
  assertFixture('refusal-shape', REFUSAL_SHAPE_FIXTURE, (rows) => computeRefusalShape(rows).hypotheses.length > 0);
}
