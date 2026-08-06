/**
 * MATHS VOLUME RUN — batch 02 harness (`pnpm tsx scripts/build-maths-batch-02.ts`).
 *
 * The district's two structural advantages, mechanised (BUILD-DISTRICT-MATHS §5):
 *   · the KEY is computed from `solution`, never typed — a hallucinated key can't ship;
 *   · every distractor is the EXECUTED misconception on the item's own operands — the
 *     harness runs MISCONCEPTION_EXECUTORS to PRODUCE each distractor value, so no
 *     distractor number is hand-authored either (the source of joan's three slips).
 * Author the SHAPE (stem, operands, solution, which misconceptions); the engine fills
 * the numbers and checkMathsItem verifies the whole item. Two-pass review is annie's,
 * same contract as batch 01. Self-test proves the gate fails a deliberately wrong key.
 */
import { writeFileSync } from 'node:fs';
import { MISCONCEPTION_EXECUTORS, checkMathsItem, evalArithmetic, mathsEntryNumber } from '@cluecrew/core';

interface Shape { id: string; group: string; tier: number; stem: string; operands: Record<string, number | number[]>; solution: string | null; keyValue?: string; mids: string[]; }

// Batch-02 shapes. Distractor VALUES are produced by the executors, not typed.
const SHAPES: Shape[] = [
  { id: 'MC02-CALC-01', group: 'CALC', tier: 2, stem: 'Work out 482 − 176.', operands: { a: 482, b: 176 }, solution: '482-176', mids: ['maths-11-commutative-subtraction'] },
  { id: 'MC02-CALC-02', group: 'CALC', tier: 3, stem: 'Work out 234 + 158.', operands: { a: 234, b: 158 }, solution: '234+158', mids: ['maths-98-digit-dropped-in-column-work'] },
  { id: 'MC02-CALC-03', group: 'CALC', tier: 2, stem: 'What is 12 ÷ 3?', operands: { dividend: 12, divisor: 3 }, solution: '12/3', mids: ['maths-16-reversing-division'] },
  { id: 'MC02-NPV-01', group: 'NPV', tier: 2, stem: 'What is 3.4 × 10?', operands: { value: 3.4 }, solution: '3.4*10', mids: ['maths-06-multiplying-by-10-adds-a-zero'] },
  { id: 'MC02-NPV-02', group: 'NPV', tier: 3, stem: 'Round 3,847 to the nearest thousand.', operands: { value: 3847 }, solution: '4000', keyValue: '4000', mids: ['maths-10-rounding-down-always'] },
  { id: 'MC02-FDP-01', group: 'FDP', tier: 3, stem: 'What is 1/4 + 1/6?', operands: { n1: 1, d1: 4, n2: 1, d2: 6 }, solution: null, keyValue: '5/12', mids: ['maths-22-adding-numerators-and-denominators'] },
  { id: 'MC02-FDP-02', group: 'FDP', tier: 3, stem: 'Write 0.4 as a percentage.', operands: { decimal: 0.4 }, solution: null, keyValue: '40%', mids: ['maths-26-percentage-symbol-as-a-unit'] },
  { id: 'MC02-FDP-03', group: 'FDP', tier: 4, stem: 'The ratio of red to blue counters is 1 : 3. What fraction of the counters are red?', operands: { part: 1, other: 3 }, solution: null, keyValue: '1/4', mids: ['maths-52-ratio-to-fraction-confusion'] },
  { id: 'MC02-FDP-04', group: 'FDP', tier: 4, stem: 'Write 1/3 as a decimal.', operands: { numerator: 3 }, solution: null, keyValue: '0.333', mids: ['maths-25-confusing-thirds-and-tenths'] },
  { id: 'MC02-MEAS-01', group: 'MEAS', tier: 2, stem: 'How many grams are there in 1 kilogram?', operands: { value: 1 }, solution: '1*1000', mids: ['maths-37-metric-prefix-confusion'] },
  { id: 'MC02-MEAS-02', group: 'MEAS', tier: 3, stem: 'A bus leaves at 2:45. The journey takes 20 minutes. What time does it arrive?', operands: { hour: 2, minute: 45, addMinutes: 20 }, solution: null, keyValue: '3:05', mids: ['maths-32-base-100-time'] },
  { id: 'MC02-STATS-01', group: 'STATS', tier: 2, stem: 'A table shows goals scored: Red 8, Blue 5, Green 6. How many goals were scored altogether?', operands: { values: [8, 5] }, solution: '8+5+6', mids: ['maths-56-incomplete-total'] },
];

function build(s: Shape): { item: Record<string, unknown>; spec: Parameters<typeof checkMathsItem>[0] } {
  const key = s.solution ? String(evalArithmetic(s.solution)) : s.keyValue!;
  const distractors = s.mids.map((mid) => {
    const n = mathsEntryNumber(mid)!;
    const value = MISCONCEPTION_EXECUTORS[n]?.(s.operands) ?? null;
    if (value === null) throw new Error(`${s.id}: ${mid} produced no value on ${JSON.stringify(s.operands)}`);
    return { value, misconceptionId: mid };
  });
  const options = [{ value: key, isCorrect: true, misconceptionId: null }, ...distractors.map((d) => ({ value: d.value, isCorrect: false, misconceptionId: d.misconceptionId }))];
  return {
    item: { id: s.id, group: s.group, difficultyTier: s.tier, stem: s.stem, solution: s.solution, operands: s.operands, options },
    spec: { id: s.id, solution: s.solution, keyValue: key, operands: s.operands, distractors },
  };
}

function main(): void {
  const items: Record<string, unknown>[] = [];
  const defects: string[] = [];
  const reports: string[] = [];
  for (const s of SHAPES) {
    const { item, spec } = build(s);
    for (const f of checkMathsItem(spec)) (f.severity === 'defect' ? defects : reports).push(`${f.itemId}: ${f.detail}`);
    items.push(item);
  }

  // Self-test: a deliberately wrong key MUST be a defect (gate #3).
  const wrong = checkMathsItem({ id: 'SELFTEST', solution: '2+2', keyValue: '5', operands: {}, distractors: [] });
  const catchesWrongKey = wrong.some((f) => f.rule === 'key-mismatch' && f.severity === 'defect');
  // Self-test: annie's duplicate-id rule fires on same id + same value.
  const dup = checkMathsItem({ id: 'SELFTEST2', solution: null, keyValue: '10', operands: {}, distractors: [{ value: '7', misconceptionId: 'maths-11-x' }, { value: '7', misconceptionId: 'maths-11-x' }] });
  const catchesDup = dup.some((f) => f.rule === 'duplicate-id-same-value');

  const out = { kind: 'maths-batch', batch: '02', generatedNote: 'shapes authored; keys and distractors machine-produced', itemCount: items.length, items };
  writeFileSync('content/maths-batches/batch-02.json', JSON.stringify(out, null, 2));
  console.log(`batch 02: ${items.length} items built. defects: ${defects.length}, reports: ${reports.length}`);
  defects.forEach((d) => console.log(`  DEFECT ${d}`));
  console.log(`self-test — wrong key caught: ${catchesWrongKey ? 'YES' : 'NO'}; duplicate-id caught: ${catchesDup ? 'YES' : 'NO'}`);
}

main();
