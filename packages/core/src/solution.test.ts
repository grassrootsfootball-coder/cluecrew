import { describe, expect, it } from 'vitest';
import { checkSolution, evaluateSolution, optionNumericValue, solutionTrace } from './solution';

describe('the solution evaluator (BUILD-DISTRICT-MATHS §5)', () => {
  it('evaluates arithmetic with precedence and brackets', () => {
    expect(evaluateSolution('3 * 14')).toBe(42);
    expect(evaluateSolution('(3 * 14) / 10')).toBeCloseTo(4.2);
    expect(evaluateSolution('100 - 3 * 12')).toBe(64);
    expect(evaluateSolution('0.5 * 18 + 1')).toBe(10);
    expect(evaluateSolution('-4 + 10')).toBe(6);
  });

  it('refuses anything outside the grammar — expressions are data, not code', () => {
    expect(() => evaluateSolution('Math.max(1,2)')).toThrow();
    expect(() => evaluateSolution('2 ** 3')).toThrow();
    expect(() => evaluateSolution('4 / 0')).toThrow();
    expect(() => evaluateSolution('4 +')).toThrow();
  });

  it('produces the left-to-right trace the replay templates phrase', () => {
    expect(solutionTrace('3 * 14 + 5')).toEqual([
      { operation: '3 * 14', value: 42 },
      { operation: '42 + 5', value: 47 },
    ]);
  });

  it('reads UK-formatted option values', () => {
    expect(optionNumericValue('£4.20')).toBeCloseTo(4.2);
    expect(optionNumericValue('1,250 ml')).toBe(1250);
    expect(optionNumericValue({ value: 45 })).toBe(45);
    expect(optionNumericValue('five')).toBeNull();
  });
});

describe('the CI gate (gate #3: a deliberately wrong key must fail)', () => {
  const options = (correct: string) =>
    ['42', '36', '48', '40'].map((label) => ({ content: label, isCorrect: label === correct }));

  it('passes an item whose key matches the computed value', () => {
    expect(checkSolution('3 * 14', options('42')).ok).toBe(true);
  });

  it('FAILS an item keyed to the wrong option', () => {
    const result = checkSolution('3 * 14', options('36'));
    expect(result.ok).toBe(false);
    expect(result.computed).toBe(42);
    expect(result.keyed).toBe(36);
  });

  it('FAILS an item with a broken expression or a non-numeric key', () => {
    expect(checkSolution('3 *', options('42')).ok).toBe(false);
    expect(
      checkSolution('3 * 14', [{ content: 'about forty', isCorrect: true }]).ok,
    ).toBe(false);
  });
});
