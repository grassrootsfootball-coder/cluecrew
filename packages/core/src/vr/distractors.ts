/**
 * DERIVABLE VR DISTRACTORS (reviewer audit, 2026-08-05; David's ruling).
 *
 * The VR generators tagged distractors by fixed option slot, so a numeric
 * near-miss (answer ± 1) could wear a named misconception it does not model.
 * This module is the single source of truth the generator and the gate share:
 * every executable VR misconception is a function from the item's OPERANDS to
 * the exact wrong value(s) that error produces. The generator BUILDS each
 * distractor by calling an executor and tagging it with that id; the gate
 * VERIFIES that a distractor's value is one the executor produces. Because both
 * sides use these functions, a distractor is what its tag produces by
 * construction — the maths §5 discipline, carried into VR.
 *
 * A SEMANTIC misconception (closest meaning, a topic associate, a first-mention
 * trap) has no arithmetic output and is deliberately absent; the gate reports
 * those as review-only, never as a defect — exactly as it treats a conceptual
 * maths entry.
 *
 * Operands travel in `stem.operands`, written by the generator, the way a maths
 * item carries its named numbers — so the gate never has to guess a series' rule.
 */

const A_CODE = 65;
export const vrLetterOf = (position: number): string =>
  String.fromCharCode(A_CODE + (((position % 26) + 26) % 26));

/** The operand bag a VR item carries for its executors. Shape depends on kind. */
export interface VrOperands {
  kind: 'code' | 'letter-series' | 'number-series' | 'letter-analogy';
  /** code: letter→value; expr like "P + Q − R". */
  values?: Record<string, number>;
  expr?: string;
  /** series/analogy: positions/numbers. */
  first?: number;
  step?: number;
  answer?: number;
  /** number-series with a changing step: the last gap actually used. */
  prevStep?: number;
  last?: number;
}

/** Evaluate a left-to-right +/− expression of letter tokens under a value map. */
function evalCode(expr: string, values: Record<string, number>): number | null {
  const tokens = expr.replace(/[−–]/g, '-').match(/[A-Za-z]+|[+-]/g);
  if (!tokens) return null;
  let total = 0;
  let sign = 1;
  for (const token of tokens) {
    if (token === '+') sign = 1;
    else if (token === '-') sign = -1;
    else {
      const value = values[token];
      if (value === undefined) return null;
      total += sign * value;
    }
  }
  return total;
}

const s = (value: number | string): string => String(value);

/**
 * Executors keyed by misconception id. Each returns the set of values that
 * error produces on these operands (as strings, to compare with option values),
 * or null when the error cannot arise for this item (e.g. an operation slip with
 * nothing to slip) — which the gate treats as "this tag is not derivable here".
 */
export const VR_EXECUTORS: Record<string, (op: VrOperands) => string[] | null> = {
  // vr-07 — a wrong value comes from ONE letter read as another letter's value.
  'vr07-value-slip': (op) => {
    if (!op.values || !op.expr) return null;
    const correct = evalCode(op.expr, op.values);
    const letters = Object.keys(op.values);
    const used = [...new Set((op.expr.match(/[A-Za-z]+/g) ?? []))];
    const out = new Set<string>();
    for (const target of used) {
      for (const source of letters) {
        if (source === target) continue;
        const swapped = { ...op.values, [target]: op.values[source]! };
        const value = evalCode(op.expr, swapped);
        if (value !== null && value !== correct) out.add(s(value));
      }
    }
    return [...out];
  },
  // vr-07 — added where the sum needed the other operation (only if there is a −).
  'vr07-operation-slip': (op) => {
    if (!op.values || !op.expr || !/[−–-]/.test(op.expr)) return null;
    const allPlus = op.expr.replace(/[−–-]/g, '+');
    const value = evalCode(allPlus, op.values);
    const correct = evalCode(op.expr, op.values);
    return value !== null && value !== correct ? [s(value)] : null;
  },
  // vr-07 — stopped before using every letter, leaving off the last term
  // (reviewer-authored, 2026-08-06): P+Q on three-term items, P+Q+R on four-term.
  'vr07-term-dropped': (op) => {
    if (!op.values || !op.expr) return null;
    const correct = evalCode(op.expr, op.values);
    const dropped = op.expr.replace(/\s*[+\-−–]\s*[A-Za-z]+\s*$/, ''); // remove the final ± term
    const value = evalCode(dropped, op.values);
    return value !== null && value !== correct ? [s(value)] : null;
  },

  // vr-09 letter series
  'vr-letter-series-off-by-one': (op) =>
    op.answer === undefined ? null : [vrLetterOf(op.answer + 1), vrLetterOf(op.answer - 1)],
  'vr-letter-series-step-repeat': (op) =>
    op.answer === undefined || op.step === undefined ? null : [vrLetterOf(op.answer + op.step)],
  'vr-letter-series-direction': (op) =>
    op.first === undefined || op.step === undefined ? null : [vrLetterOf(op.first - op.step)],

  // vr-11 number series
  'vr-series-off-by-one': (op) =>
    op.answer === undefined ? null : [s(op.answer + 1), s(op.answer - 1)],
  'vr-series-step-carryover': (op) =>
    op.last === undefined || op.prevStep === undefined ? null : [s(op.last + op.prevStep)],
  'vr-series-direction': (op) =>
    op.first === undefined || op.step === undefined ? null : [s(op.first - op.step)],

  // vr-14 letter connections (analogy on letters)
  'vr14-step-size': (op) =>
    op.answer === undefined ? null : [vrLetterOf(op.answer + 1), vrLetterOf(op.answer - 1)],
  'vr14-step-direction': (op) =>
    op.first === undefined || op.step === undefined ? null : [vrLetterOf(op.first - op.step)],
};

/** Is this misconception one the gate can execute (vs a semantic, review-only one)? */
export function isExecutableVrMisconception(id: string): boolean {
  return id in VR_EXECUTORS;
}

/**
 * Build derived distractors: walk the ids, take the first value each executor
 * yields that is not already used (the key or an earlier distractor), drop an id
 * whose values all collide. The single builder the content generator AND the
 * seed share, so a distractor is what its tag produces by construction on both.
 */
export function buildDerivedVrDistractors(
  keyValue: string | number,
  operands: VrOperands,
  ids: string[],
): Array<{ value: string | number; misconceptionId: string }> {
  const used = new Set<string>([String(keyValue)]);
  const out: Array<{ value: string | number; misconceptionId: string }> = [];
  for (const id of ids) {
    const produced = VR_EXECUTORS[id]?.(operands) ?? null;
    if (!produced) continue;
    const pick = produced.find((value) => !used.has(String(value)));
    if (pick === undefined) continue;
    used.add(String(pick));
    out.push({ value: /^-?\d+$/.test(pick) ? Number(pick) : pick, misconceptionId: id });
  }
  return out;
}

export interface VrDistractorFailure {
  where: string;
  rule: 'not-derivable' | 'value-not-produced' | 'uncovered';
  detail: string;
  severity: 'defect' | 'report';
}

export interface VrGatableOption {
  value: unknown;
  isCorrect: boolean;
  misconceptionId: string | null;
}
export interface VrGatableItem {
  id: string;
  operands?: VrOperands;
  options: VrGatableOption[];
}

/**
 * The gate: every wrong option whose tag is executable must carry a value that
 * tag actually produces on the operands. A tag with no executor is semantic and
 * reported review-only (not a defect). A tag whose executor cannot run here
 * (returns null) is a real defect — the tag is a lie on this item.
 */
export function checkVrDistractors(item: VrGatableItem): VrDistractorFailure[] {
  const executableWrong = item.options.filter(
    (o) => !o.isCorrect && o.misconceptionId && isExecutableVrMisconception(o.misconceptionId),
  );
  // No executable tags → nothing this gate can verify (all-semantic bank). Silent.
  if (executableWrong.length === 0) return [];
  // Executable tags but no operands → an uncovered item (legacy / seed-authored,
  // no derivation metadata). Reported so it is visible, never a hard defect —
  // exactly how the maths gate treats an item missing its operands.
  if (!item.operands) {
    return [{
      where: item.id,
      rule: 'uncovered',
      detail: `carries executable tags but no stem.operands — not gate-verifiable`,
      severity: 'report',
    }];
  }
  const failures: VrDistractorFailure[] = [];
  item.options.forEach((option, index) => {
    if (option.isCorrect || !option.misconceptionId) return;
    const id = option.misconceptionId;
    if (!isExecutableVrMisconception(id)) return; // semantic → review-only, silent
    const produced = VR_EXECUTORS[id]!(item.operands!);
    if (produced === null) {
      failures.push({
        where: `${item.id} option ${index}`,
        rule: 'not-derivable',
        detail: `tag "${id}" cannot arise on this item — the error it names has no output here`,
        severity: 'defect',
      });
      return;
    }
    if (!produced.map(String).includes(String(option.value))) {
      failures.push({
        where: `${item.id} option ${index}`,
        rule: 'value-not-produced',
        detail: `value "${String(option.value)}" is not what "${id}" produces (${produced.join(', ')})`,
        severity: 'defect',
      });
    }
  });
  return failures;
}
