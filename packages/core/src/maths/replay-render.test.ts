import { describe, expect, it } from 'vitest';
import { renderReplay } from './replay-render';

const T = { intro: 'Intro.', step: '{operation} makes {value}.', outro: 'So the answer is {value}.' };

describe('the worked-example replay, rendered for a child (R1064)', () => {
  it('uses × and thousands commas, and ends on the key as shown', () => {
    const r = renderReplay('4120 - (18 * 145 + 320)', T, { stemText: 'A stadium holds 4,120 people.', keyDisplay: '1190' });
    expect(r).toEqual({ ok: true, lines: ['Intro.', '18 × 145 makes 2,610.', '2,610 + 320 makes 2,930.', '4,120 − 2,930 makes 1,190.', 'So the answer is 1,190.'] });
  });

  it('shows money in £ with pence, and the key exactly as stored', () => {
    const r = renderReplay('1.70 + 2.60', T, { stemText: 'A ruler for £1.70 and a pen for £2.60.', keyDisplay: '£4.30' });
    expect(r).toEqual({ ok: true, lines: ['Intro.', '£1.70 + £2.60 makes £4.30.', 'So the answer is £4.30.'] });
  });

  it('tracks money through the working: £ × a count is money, £ ÷ £ is a count', () => {
    const a = renderReplay('3 * 1.25', T, { stemText: 'Three pens at £1.25 each.', keyDisplay: '£3.75' });
    expect(a.ok && a.lines[1]).toBe('3 × £1.25 makes £3.75.');
    const b = renderReplay('10 / 2.50', T, { stemText: 'How many £2.50 tickets can £10 buy?', keyDisplay: '4' });
    expect(b.ok && b.lines[1]).toBe('£10.00 ÷ £2.50 makes 4.');
    const c = renderReplay('80 / 4', T, { stemText: 'Share £80 between 4.', keyDisplay: '£20' });
    expect(c.ok && c.lines[1]).toBe('£80 ÷ 4 makes £20.');
  });

  it('styles the last line like the working: commas and a true minus sign, unit kept', () => {
    expect(renderReplay('1200 * 3', T, { stemText: '£1,200 a month for 3 months.', keyDisplay: '£3600' })).toMatchObject({ ok: true, lines: expect.arrayContaining(['So the answer is £3,600.']) });
    expect(renderReplay('6 * 1000', T, { stemText: '6 kg in grams.', keyDisplay: '6000 g' })).toMatchObject({ ok: true, lines: expect.arrayContaining(['So the answer is 6,000 g.']) });
    expect(renderReplay('5 - 8', T, { stemText: 'It is 5°C and falls by 8°C.', keyDisplay: '-3°C' })).toMatchObject({ ok: true, lines: expect.arrayContaining(['So the answer is −3°C.']) });
  });

  it('uses a true minus sign for a negative', () => {
    const r = renderReplay('5 - 8', T, { stemText: 'It is 5°C and falls by 8°C.', keyDisplay: '−3°C' });
    expect(r.ok && r.lines[1]).toBe('5 − 8 makes −3.');
  });

  it('refuses a value that cannot be shown exactly, never 0.333333', () => {
    expect(renderReplay('1 / 3', T, { stemText: '', keyDisplay: '1/3' })).toMatchObject({ ok: false });
  });

  it('refuses a fraction answer and an item priced in pence', () => {
    expect(renderReplay('3 / 5', T, { stemText: 'Which is the bigger fraction, 3/8 or 3/5?', keyDisplay: '3/5' })).toMatchObject({ ok: false, reason: expect.stringContaining('fraction') });
    expect(renderReplay('(200 - 130) / 100', T, { stemText: '3 pencils at 30p each. He pays with £2.', keyDisplay: '£0.70' })).toMatchObject({ ok: false, reason: expect.stringContaining('pence') });
  });

  it('refuses a bare value, which has no working to walk', () => {
    expect(renderReplay('42', T, { stemText: '', keyDisplay: '42' })).toMatchObject({ ok: false, reason: expect.stringContaining('bare') });
  });

  it('refuses when the walk does not end at the key', () => {
    expect(renderReplay('2 + 2', T, { stemText: '', keyDisplay: '5' })).toMatchObject({ ok: false, reason: expect.stringContaining('key') });
  });
});
