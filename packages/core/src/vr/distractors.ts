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
  /**
   * vr-07 — a letter read off the NEIGHBOURING ROW of the code table.
   *
   * NARROWED ON THE REVIEWER'S RULING (Annie, 2026-08-17). It substituted the value of ANY other
   * letter in the table, which is **a random draw and no hint reaches it**. Her reasoning: a child
   * misreading a code table SLIPS ONE ROW, and that is a mechanism a hint can teach against. The
   * entry's description — *"Substituted one letter with the neighbouring value"* — was right and the
   * code was wider than it; **the executor moved to the description, not the description to the
   * code**, because the description names a teachable error and the code named an accident.
   *
   * Key order in `values` IS the table's row order, so the neighbours of a letter are the keys
   * either side of it.
   */
  'vr07-value-slip': (op) => {
    if (!op.values || !op.expr) return null;
    const correct = evalCode(op.expr, op.values);
    const rows = Object.keys(op.values);
    const used = [...new Set((op.expr.match(/[A-Za-z]+/g) ?? []))];
    const out = new Set<string>();
    for (const target of used) {
      const at = rows.indexOf(target);
      if (at < 0) continue;
      for (const source of [rows[at - 1], rows[at + 1]]) {
        if (!source || source === target) continue;
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
  // Constant-series diagnoses (reviewer-authored, 2026-08-06, after direction was
  // retired). On a constant step the last term is answer − step, so both compute
  // from {answer, step} alone.
  // step-applied-twice: two jumps of the step from the last term (last + 2·step).
  'vr-series-step-applied-twice': (op) =>
    op.answer === undefined || op.step === undefined ? null : [s(op.answer + op.step)],
  // sum-of-last-two: read as Fibonacci — the last two shown terms added
  // ((last−step) + last = 2·answer − 3·step).
  'vr-series-sum-of-last-two': (op) =>
    op.answer === undefined || op.step === undefined ? null : [s(2 * op.answer - 3 * op.step)],

  // vr-14 letter connections (analogy on letters)
  'vr14-step-size': (op) =>
    op.answer === undefined ? null : [vrLetterOf(op.answer + 1), vrLetterOf(op.answer - 1)],
  'vr14-step-direction': (op) =>
    op.first === undefined || op.step === undefined ? null : [vrLetterOf(op.first - op.step)],
  // (A 'vr14-step-applied-twice' executor was proposed for R1030 and REFUSED by the reviewer: not a mistake
  // children are known to make on letter ANALOGIES, and the value came before the story. The key's rank is
  // spread instead by BACKWARD questions, where step-direction lands above the key — see letterConnections.)
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
  /** Values never to offer (R1030): printed in the stem, or a letter that wraps past A or Z. Default none, so a door that passes nothing re-derives exactly as before. */
  forbidden: ReadonlySet<string> = new Set(),
): Array<{ value: string | number; misconceptionId: string }> {
  const used = new Set<string>([String(keyValue), ...forbidden]);
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

/**
 * SPREAD THE KEY (R1030, 2026-11-20). `buildDerivedVrDistractors` takes each executor's FIRST value, and
 * the executors list their overshoot first (answer + 1 before answer − 1), so on vr-14 the key was the
 * second-latest letter on 25 of 25 rows, on vr-11 the smallest of four on 13 of 13. A child learns the
 * position, not the rule.
 *
 * This builder chooses among EVERY value the door's executors genuinely produce, so each distractor is
 * still exactly what its tag produces, and the gate (`checkVrDistractors`) is unchanged. It picks the
 * combination that puts the key at the rank used least so far on this door (`rankCounts`, mutated).
 * Ties go to the combination covering more distinct mistakes, then to the one closest to the legacy
 * pick (least churn). Values are compared as a child orders them: numbers by size, letters by
 * alphabet position.
 *
 * REVISED AFTER REVIEW (R1030):
 *   1. `forbidden` values never appear (printed in the stem, or a letter that wraps past A or Z). The
 *      first version picked values the stem prints, which a child eliminates without reasoning.
 *   2. the least-used rank;
 *   3. then the key not the middle of a run (key - 1 and key + 1 both offered);
 *   4. then as many different mistakes as possible; then the least churn from the legacy pick.
 * Putting variety FIRST was measured and is worse on vr-07 and vr-09: one of each mistake drags the key
 * back to one end. On vr-07, putting RANK first piled value-slip into 44 of 75 seats, all one side, a tell
 * of its own. So vr-07 does not use this builder; its fix needs different QUESTIONS (R1030).
 *
 * Opt-in per door. The legacy builder is untouched, so a door that does not ask for spreading
 * re-derives exactly as before, and reviewed rows stay unchanged under R62's guard.
 */
export function buildSpreadVrDistractors(
  keyValue: string | number,
  operands: VrOperands,
  ids: string[],
  count: number,
  rankCounts: number[],
  forbidden: ReadonlySet<string> = new Set(),
): Array<{ value: string | number; misconceptionId: string }> {
  const key = String(keyValue);
  const mag = (v: string): number => (/^-?\d+$/.test(v) ? Number(v) : v.toUpperCase().charCodeAt(0) - A_CODE);
  const menu: Array<{ value: string; id: string }> = [];
  for (const id of [...new Set(ids)]) for (const v of VR_EXECUTORS[id]?.(operands) ?? []) {
    if (v !== key && !forbidden.has(v) && !menu.some((m) => m.value === v)) menu.push({ value: v, id });
  }
  const legacy = new Set(buildDerivedVrDistractors(keyValue, operands, ids).map((d) => String(d.value)));
  const distinctAvailable = Math.min(count, new Set(menu.map((m) => m.id)).size);
  let best: { pick: typeof menu; score: number[] } | null = null;
  const better = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! < b[i]!; return false; };
  const choose = (start: number, acc: typeof menu): void => {
    if (acc.length === count) {
      const rank = acc.filter((m) => mag(m.value) < mag(key)).length;
      const vals = new Set(acc.map((m) => mag(m.value)));
      const middleOfRun = vals.has(mag(key) - 1) && vals.has(mag(key) + 1) ? 1 : 0;
      const score = [rankCounts[rank] ?? 0, middleOfRun, distinctAvailable - new Set(acc.map((m) => m.id)).size, acc.filter((m) => !legacy.has(m.value)).length];
      if (!best || better(score, best.score)) best = { pick: [...acc], score };
      return;
    }
    for (let i = start; i < menu.length; i++) choose(i + 1, [...acc, menu[i]!]);
  };
  choose(0, []);
  if (!best) return buildDerivedVrDistractors(keyValue, operands, ids); // too few values to choose from
  const chosen = (best as { pick: typeof menu }).pick;
  const rank = chosen.filter((m) => mag(m.value) < mag(key)).length;
  rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
  return chosen.map((m) => ({ value: /^-?\d+$/.test(m.value) ? Number(m.value) : m.value, misconceptionId: m.id }));
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
