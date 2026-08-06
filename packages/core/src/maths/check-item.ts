/**
 * THE DERIVABLE MATHS DISTRACTOR GATE (BUILD-DISTRICT-MATHS §5, gate #4).
 *
 * Two checks, both from the district's structural advantages:
 *   · the KEY is computed from the item's `solution`, never asserted, so a
 *     hallucinated answer key cannot ship;
 *   · every distractor tagged with a DERIVABLE misconception must EQUAL the
 *     number that misconception produces on the item's own operands — the
 *     distractor IS the executed error, not merely labelled with it.
 *
 * A conceptual misconception is reported, never failed — it has no single
 * executable answer and belongs to human review. A derivable one with no
 * executor yet is reported as a coverage gap, so what the gate cannot verify
 * is visible rather than silently passed.
 */
import {
  CONCEPTUAL_ENTRIES,
  MISCONCEPTION_EXECUTORS,
  type MathsOperands,
  answersEqual,
  evalArithmetic,
  mathsEntryNumber,
} from './executors';

export interface MathsDistractor {
  value: string | number;
  misconceptionId: string | null;
}
export interface MathsItemSpec {
  id: string;
  /** Arithmetic expression for the correct answer; recomputed and checked. */
  solution?: string | null;
  /** The correct option's value. */
  keyValue: string | number;
  /** The item's named numbers, for the executors. */
  operands: MathsOperands;
  distractors: MathsDistractor[];
}

export type MathsRule =
  | 'key-mismatch'
  | 'distractor-not-executed-misconception'
  | 'duplicate-id-same-value'
  | 'operands-insufficient'
  | 'no-executor'
  | 'conceptual-review-only';

export interface MathsFailure {
  itemId: string;
  rule: MathsRule;
  detail: string;
  /** A defect blocks; a report is visible but non-blocking. */
  severity: 'defect' | 'report';
}

export function checkMathsItem(spec: MathsItemSpec): MathsFailure[] {
  const failures: MathsFailure[] = [];

  // --- The key is computed, not asserted ----------------------------------
  if (spec.solution) {
    const computed = evalArithmetic(spec.solution);
    if (computed === null) {
      failures.push({ itemId: spec.id, rule: 'key-mismatch', severity: 'report', detail: `solution "${spec.solution}" could not be evaluated` });
    } else if (!answersEqual(computed, spec.keyValue)) {
      failures.push({ itemId: spec.id, rule: 'key-mismatch', severity: 'defect', detail: `solution "${spec.solution}" computes ${computed}, but the key is "${spec.keyValue}"` });
    }
  }

  // --- R11 + its parametric exemption (annie, 2026-08-06) -----------------
  // R11 forbids two options in one item under one misconception. The acknowledged
  // exemption (documented, like lineup-odd's single-axis one — see
  // docs/MATHS-VOLUME-RUN.md): a PARAMETER-VARIED misconception — the same error at
  // a different place, wrong column at tens vs thousands — may tag two options,
  // BECAUSE it produces two different values. So a shared id with different values
  // passes; a shared id with the SAME value means only one is really that error.
  const byId = new Map<string, Array<string | number>>();
  for (const d of spec.distractors) {
    if (!d.misconceptionId) continue;
    const seen = byId.get(d.misconceptionId) ?? [];
    seen.push(d.value);
    byId.set(d.misconceptionId, seen);
  }
  for (const [id, values] of byId) {
    if (values.length < 2) continue;
    if (values.some((v, i) => values.findIndex((w) => answersEqual(v, w)) !== i)) {
      failures.push({ itemId: spec.id, rule: 'duplicate-id-same-value', severity: 'defect', detail: `${id} tags two distractors with the same value (${values.join(', ')}) — a shared id needs a varied parameter and so a different value` });
    }
  }

  // --- Each distractor IS its executed misconception ----------------------
  for (const distractor of spec.distractors) {
    if (!distractor.misconceptionId) continue; // the P3 tagging gate is elsewhere
    const n = mathsEntryNumber(distractor.misconceptionId);
    if (n === null) continue; // not a maths seed misconception
    if (CONCEPTUAL_ENTRIES.has(n)) {
      failures.push({ itemId: spec.id, rule: 'conceptual-review-only', severity: 'report', detail: `${distractor.misconceptionId} is conceptual — verified by review, not by this gate` });
      continue;
    }
    const executor = MISCONCEPTION_EXECUTORS[n];
    if (!executor) {
      failures.push({ itemId: spec.id, rule: 'no-executor', severity: 'report', detail: `${distractor.misconceptionId} is derivable but has no executor yet` });
      continue;
    }
    const produced = executor(spec.operands);
    if (produced === null) {
      failures.push({ itemId: spec.id, rule: 'operands-insufficient', severity: 'report', detail: `${distractor.misconceptionId}: operands do not let the misconception run (${JSON.stringify(spec.operands)})` });
      continue;
    }
    if (!answersEqual(produced, distractor.value)) {
      failures.push({
        itemId: spec.id,
        rule: 'distractor-not-executed-misconception',
        severity: 'defect',
        detail: `${distractor.misconceptionId} executes to "${produced}", but the distractor is "${distractor.value}" — the distractor is not the executed misconception`,
      });
    }
  }
  return failures;
}
