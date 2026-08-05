import { describe, expect, it } from 'vitest';
import {
  describeProvenance,
  isVerbalMethod,
  methodNamesOccasion,
  validateVerbalRecord,
  verbalMethodFor,
} from './review-provenance';

const VALID = {
  approvedBy: 'human:reviewer@example.com',
  recordedBy: 'human:admin@example.com',
  method: 'verbal — sitting #1, 2026-08-01',
  note: 'Approved the whole NVR set; asked to see the codes wording again.',
};

describe('recording a decision made elsewhere', () => {
  it('accepts a well-formed verbal record', () => {
    expect(validateVerbalRecord(VALID)).toEqual([]);
  });

  it('REFUSES the collapse: recorder and approver being the same person', () => {
    const failures = validateVerbalRecord({ ...VALID, recordedBy: VALID.approvedBy });
    expect(failures.some((failure) => failure.field === 'recordedBy')).toBe(true);
  });

  it('refuses an unnamed approver — the decision must belong to someone', () => {
    expect(validateVerbalRecord({ ...VALID, approvedBy: '' }).some((f) => f.field === 'approvedBy')).toBe(true);
    expect(
      validateVerbalRecord({ ...VALID, approvedBy: 'the reviewer' }).some((f) => f.field === 'approvedBy'),
    ).toBe(true);
  });

  it('refuses "verbal" with no occasion or date — it cannot be checked later', () => {
    const failures = validateVerbalRecord({ ...VALID, method: 'verbal' });
    expect(failures.some((failure) => failure.field === 'method')).toBe(true);
  });

  it('accepts a verbal method that names the sitting or carries a date', () => {
    expect(validateVerbalRecord({ ...VALID, method: 'verbal — sitting #1' })).toEqual([]);
    expect(validateVerbalRecord({ ...VALID, method: 'verbal, agreed 2026-08-01' })).toEqual([]);
  });

  it('requires a note on a verbal record — it is the only record of what was said', () => {
    const failures = validateVerbalRecord({ ...VALID, note: '' });
    expect(failures.some((failure) => failure.field === 'note')).toBe(true);
  });

  it('reports every problem at once, so the admin fixes the form in one pass', () => {
    const failures = validateVerbalRecord({ approvedBy: '', recordedBy: '', method: '', note: '' });
    expect(failures.length).toBeGreaterThanOrEqual(3);
  });

  it('error messages are written for a person, not a log', () => {
    for (const failure of validateVerbalRecord({ approvedBy: '', recordedBy: '', method: 'verbal', note: '' })) {
      expect(failure.reason).toMatch(/[a-z] [a-z]/); // a sentence, not a code
      expect(failure.reason).not.toMatch(/undefined|null|Error|regex/i);
    }
  });

  it('method helpers behave', () => {
    expect(isVerbalMethod('verbal — sitting #1')).toBe(true);
    expect(isVerbalMethod('in-platform')).toBe(false);
    expect(methodNamesOccasion('verbal — sitting #1')).toBe(true);
    expect(methodNamesOccasion('verbal')).toBe(false);
    expect(verbalMethodFor('sitting #1', '2026-08-01')).toBe('verbal — sitting #1, 2026-08-01');
  });
});

describe('how the distinction reads', () => {
  it('an in-platform approval names one person', () => {
    expect(
      describeProvenance({ approvedBy: 'human:r@x.com', recordedBy: null, method: null }),
    ).toBe('approved by human:r@x.com in the platform');
  });

  it('a recorded approval always names BOTH, and never merges them', () => {
    const line = describeProvenance({
      approvedBy: 'human:r@x.com',
      recordedBy: 'human:a@x.com',
      method: 'verbal — sitting #1, 2026-08-01',
    });
    expect(line).toContain('human:r@x.com');
    expect(line).toContain('human:a@x.com');
    expect(line).toMatch(/decided by .* entered by /);
  });

  it('an unapproved record says so plainly', () => {
    expect(describeProvenance({ approvedBy: null, recordedBy: null, method: null })).toBe('not approved');
  });
});
