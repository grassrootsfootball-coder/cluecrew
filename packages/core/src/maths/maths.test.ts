import { describe, expect, it } from 'vitest';
import { MISCONCEPTION_EXECUTORS, evalArithmetic } from './executors';
import { checkMathsItem, type MathsItemSpec } from './check-item';

describe('misconception executors', () => {
  it('11 commutative subtraction: |top−bottom| per column', () => {
    // 42 − 17: |4−1|=3, |2−7|=5  →  35 (the classic slip; true answer is 25).
    expect(MISCONCEPTION_EXECUTORS[11]!({ a: 42, b: 17 })).toBe('35');
  });
  it('16 reversed division: divides the other way', () => {
    expect(MISCONCEPTION_EXECUTORS[16]!({ dividend: 3, divisor: 12 })).toBe('4');
  });
  it('22 adds numerators and denominators', () => {
    expect(MISCONCEPTION_EXECUTORS[22]!({ n1: 1, d1: 2, n2: 1, d2: 3 })).toBe('2/5');
  });
  it('6 multiplying by 10 appends a zero to a decimal', () => {
    expect(MISCONCEPTION_EXECUTORS[6]!({ value: 3.4 })).toBe('3.40');
  });
  it('52 reads a ratio straight as a fraction', () => {
    expect(MISCONCEPTION_EXECUTORS[52]!({ part: 1, other: 3 })).toBe('1/3');
  });
  it('56 incomplete mean gives the total; 57 gives the median', () => {
    expect(MISCONCEPTION_EXECUTORS[56]!({ values: [2, 4, 9] })).toBe('15');
    expect(MISCONCEPTION_EXECUTORS[57]!({ values: [2, 4, 9] })).toBe('4');
  });
  it('returns null when the operands do not let it run', () => {
    expect(MISCONCEPTION_EXECUTORS[11]!({ a: 42 })).toBeNull();
  });
});

describe('solution evaluator', () => {
  it('evaluates the four operations and parentheses', () => {
    expect(evalArithmetic('42 - 17')).toBe(25);
    expect(evalArithmetic('3 × (4 + 5)')).toBe(27);
    expect(evalArithmetic('13 / 4')).toBe(3.25);
  });
  it('refuses anything that is not arithmetic', () => {
    expect(evalArithmetic('process.exit(1)')).toBeNull();
  });
});

describe('checkMathsItem', () => {
  const sound: MathsItemSpec = {
    id: 'mq-ex-1',
    solution: '42 - 17',
    keyValue: '25',
    operands: { a: 42, b: 17, dividend: 42, divisor: 17 },
    distractors: [{ value: '35', misconceptionId: 'maths-11-commutative-subtraction' }],
  };

  it('passes when key and distractor both check out', () => {
    expect(checkMathsItem(sound).filter((f) => f.severity === 'defect')).toEqual([]);
  });
  it('flags a distractor that is not the executed misconception', () => {
    const bad = { ...sound, distractors: [{ value: '99', misconceptionId: 'maths-11-commutative-subtraction' }] };
    const defects = checkMathsItem(bad).filter((f) => f.severity === 'defect');
    expect(defects).toHaveLength(1);
    expect(defects[0]!.rule).toBe('distractor-not-executed-misconception');
  });
  it('flags a key that its own solution does not produce', () => {
    const bad = { ...sound, keyValue: '26' };
    expect(checkMathsItem(bad).filter((f) => f.rule === 'key-mismatch' && f.severity === 'defect')).toHaveLength(1);
  });
  it('reports a conceptual misconception as review-only, never a defect', () => {
    const spec = { ...sound, distractors: [{ value: 'diamond', misconceptionId: 'maths-41-orientation-changes-shape' }] };
    const found = checkMathsItem(spec);
    expect(found.some((f) => f.rule === 'conceptual-review-only')).toBe(true);
    expect(found.filter((f) => f.severity === 'defect')).toEqual([]);
  });
});

describe('solution evaluator: integer division', () => {
  it('floors on // (used by rounding/remainder keys)', () => {
    expect(evalArithmetic('((3762 + 50) // 100) * 100')).toBe(3800);
    expect(evalArithmetic('13 // 5')).toBe(2);
  });
});

describe('worked-example CI — every executor produces its description example', () => {
  // annie's mechanism: the reframed description carries the child's value, so the
  // executor run on the example's operands must equal it. This is what catches an
  // executor that has drifted from its own error (it would have failed #9's floor).
  it('each executor matches MISCONCEPTION_EXAMPLES, and no example equals its key', async () => {
    const { MISCONCEPTION_EXAMPLES, answersEqual } = await import('./executors');
    for (const [n, examples] of Object.entries(MISCONCEPTION_EXAMPLES)) {
      for (const ex of examples) {
        const produced = MISCONCEPTION_EXECUTORS[Number(n)]!(ex.operands);
        // (1) the executor produces exactly what the child gives
        expect(produced, `#${n} on ${JSON.stringify(ex.operands)} produced null`).not.toBeNull();
        expect(answersEqual(produced, ex.childValue), `#${n}: executor ${produced} ≠ child ${ex.childValue}`).toBe(true);
        // (2) the child's value is a real distractor — never equal to the key
        expect(answersEqual(ex.childValue, ex.keyValue), `#${n}: distractor ${ex.childValue} equals key ${ex.keyValue}`).toBe(false);
      }
    }
  });
});
