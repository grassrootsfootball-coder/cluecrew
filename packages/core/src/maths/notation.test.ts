import { describe, expect, it } from 'vitest';
import { checkMathsNotation, normaliseMathsNotation } from './notation';

describe('house notation — the batch 04/05 regression', () => {
  it('normalises money words to the £ symbol', () => {
    expect(normaliseMathsNotation('It costs 8.40 pounds altogether.')).toBe('It costs £8.40 altogether.');
    expect(normaliseMathsNotation('She paid 20 pound.')).toBe('She paid £20.');
    expect(normaliseMathsNotation('50 pence change')).toBe('50p change');
  });
  it('normalises unit powers to a real superscript', () => {
    expect(normaliseMathsNotation('area 48 cm2')).toBe('area 48 cm²');
    expect(normaliseMathsNotation('volume 12 m3')).toBe('volume 12 m³');
  });
  it('does not touch already-correct notation, nor plain words', () => {
    expect(normaliseMathsNotation('£5.00 and 4°C and 48 cm²')).toBe('£5.00 and 4°C and 48 cm²');
    expect(normaliseMathsNotation('how many pounds do you have')).toBe('how many pounds do you have');
    expect(normaliseMathsNotation('80p')).toBe('80p'); // already the symbol form
  });
  it('flags every defect, and reports the temperature it will not auto-edit', () => {
    const money = checkMathsNotation('5.00 pounds');
    expect(money[0]).toMatchObject({ kind: 'money-word', suggestion: '£5.00' });
    const area = checkMathsNotation('cm2');
    expect(area[0]).toMatchObject({ kind: 'unit-power', suggestion: 'cm²' });
    const temp = checkMathsNotation('The reading was 5C at dawn.');
    expect(temp[0]).toMatchObject({ kind: 'temperature', found: '5C', suggestion: '5°C' });
    expect(checkMathsNotation('4°C')).toEqual([]); // the degree form passes
  });
});
