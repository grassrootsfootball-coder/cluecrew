import { describe, expect, it } from 'vitest';
import { buildReplay } from './replay';

// R1064: the replay a child reads — house notation, the key as displayed, the authored templates.
describe('worked-example replay (ratified spec addition)', () => {
  it('walks the exact question through the authored template, in house notation', () => {
    const lines = buildReplay('3 * 14 + 5', 'arithmetic-chain', { stemText: 'Three bags of 14, and 5 more.', keyDisplay: '47' });
    expect(lines).toEqual([
      "Let's walk through this one together, one step at a time.",
      '3 × 14 makes 42.',
      '42 + 5 makes 47.',
      'So the answer is 47.',
    ]);
  });

  it('walks money in pounds and pence', () => {
    const lines = buildReplay('1.70 + 2.60', 'money-chain', { stemText: 'A ruler for £1.70 and a pen for £2.60.', keyDisplay: '£4.30' });
    expect(lines).toEqual([
      "Let's work out the money together, one step at a time.",
      '£1.70 + £2.60 makes £4.30.',
      'So the answer is £4.30.',
    ]);
  });

  it('never renders without its ingredients, and never approximates', () => {
    const item = { stemText: '', keyDisplay: '7' };
    expect(buildReplay(null, 'arithmetic-chain', item)).toBeNull();
    expect(buildReplay('3 + 4', 'no-such-template', item)).toBeNull();
    expect(buildReplay('nonsense !', 'arithmetic-chain', item)).toBeNull();
    expect(buildReplay('7', 'arithmetic-chain', item)).toBeNull(); // a bare number has no steps to walk
    expect(buildReplay('1 / 3', 'arithmetic-chain', { stemText: '', keyDisplay: '1/3' })).toBeNull();
  });

  it('every template line passes as child copy: no em dash, short sentences', () => {
    const lines = buildReplay('4120 - (18 * 145 + 320)', 'arithmetic-chain', { stemText: 'A stadium holds 4,120 people.', keyDisplay: '1190' })!;
    for (const line of lines) {
      expect(line).not.toMatch(/—/);
      expect(line.split(/\s+/).length).toBeLessThanOrEqual(16);
    }
  });
});
