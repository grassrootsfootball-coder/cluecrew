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
  /** The TOPIC tag — domain context, taught in the walk script. May be conceptual. */
  misconceptionId: string | null;
  /** The PROCESS tag (annie's two-ids model). The DERIVABLE one: the gate executes
   *  THIS on the operands, and it owns the child-facing hint at serve time. Falls
   *  back to the topic id when a distractor has only one tag. */
  processMisconceptionId?: string | null;
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
  | 'process-step-invalid'
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
  // The DERIVABLE tag is the process tag (annie's two-ids model); it falls back to
  // the topic id for a single-tagged distractor. Everything derivable runs on it.
  const execId = (d: MathsDistractor): string | null => d.processMisconceptionId ?? d.misconceptionId;
  const byId = new Map<string, Array<string | number>>();
  for (const d of spec.distractors) {
    const id = execId(d);
    if (!id) continue;
    const seen = byId.get(id) ?? [];
    seen.push(d.value);
    byId.set(id, seen);
  }
  for (const [id, values] of byId) {
    if (values.length < 2) continue;
    if (values.some((v, i) => values.findIndex((w) => answersEqual(v, w)) !== i)) {
      failures.push({ itemId: spec.id, rule: 'duplicate-id-same-value', severity: 'defect', detail: `${id} tags two distractors with the same value (${values.join(', ')}) — a shared id needs a varied parameter and so a different value` });
    }
  }

  // --- Each distractor IS its executed misconception ----------------------
  for (const distractor of spec.distractors) {
    const derivableId = execId(distractor);
    if (!derivableId) continue; // the P3 tagging gate is elsewhere

    // PROC-01 and future process tags execute against a LIST of the item's
    // intermediate results (annie, 2026-08-06): the child stopped at one of them.
    // The distractor must BE one of the declared steps; none may equal the key
    // (then the first step is the answer and stop-early does not apply); and the
    // steps must be distinct (else it is ambiguous where she stopped).
    if (derivableId.startsWith('maths-proc-')) {
      const raw = spec.operands.firstStepResults;
      const steps = Array.isArray(raw) ? raw.map(String) : null;
      if (!steps || steps.length === 0) { failures.push({ itemId: spec.id, rule: 'operands-insufficient', severity: 'report', detail: `${derivableId}: no firstStepResults list on the item` }); continue; }
      if (steps.some((s) => answersEqual(s, spec.keyValue))) { failures.push({ itemId: spec.id, rule: 'process-step-invalid', severity: 'defect', detail: `${derivableId}: an intermediate result equals the key — the first step is the answer, stop-early does not apply` }); continue; }
      if (steps.some((s, i) => steps.findIndex((t) => answersEqual(s, t)) !== i)) { failures.push({ itemId: spec.id, rule: 'process-step-invalid', severity: 'defect', detail: `${derivableId}: intermediate results are not distinct (${steps.join(', ')}) — ambiguous where she stopped` }); continue; }
      if (!steps.some((s) => answersEqual(s, distractor.value))) { failures.push({ itemId: spec.id, rule: 'distractor-not-executed-misconception', severity: 'defect', detail: `${derivableId}: distractor "${distractor.value}" is not one of the declared intermediate results (${steps.join(', ')})` }); }
      continue;
    }

    const n = mathsEntryNumber(derivableId);
    if (n === null) continue; // not a maths seed misconception
    if (CONCEPTUAL_ENTRIES.has(n)) {
      failures.push({ itemId: spec.id, rule: 'conceptual-review-only', severity: 'report', detail: `${derivableId} is conceptual — verified by review, not by this gate` });
      continue;
    }
    const executor = MISCONCEPTION_EXECUTORS[n];
    if (!executor) {
      failures.push({ itemId: spec.id, rule: 'no-executor', severity: 'report', detail: `${derivableId} is derivable but has no executor yet` });
      continue;
    }
    const produced = executor(spec.operands);
    if (produced === null) {
      failures.push({ itemId: spec.id, rule: 'operands-insufficient', severity: 'report', detail: `${derivableId}: operands do not let the misconception run (${JSON.stringify(spec.operands)})` });
      continue;
    }
    if (!answersEqual(produced, distractor.value)) {
      failures.push({
        itemId: spec.id,
        rule: 'distractor-not-executed-misconception',
        severity: 'defect',
        detail: `${derivableId} executes to "${produced}", but the distractor is "${distractor.value}" — the distractor is not the executed misconception`,
      });
    }
  }
  return failures;
}
