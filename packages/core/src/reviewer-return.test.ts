import { describe, expect, it } from 'vitest';
import { renderReviewerReturn, reviewerReturnBasename } from './reviewer-return';

/**
 * A FICTIONAL REVIEWER, NOT A REAL ONE (R978). This test writes to no table and so is not the harm
 * her ruling names — but a real person's identity in a fixture is a real person's identity, and
 * keeping it here would mean the borrow guard carried a permanent exception. An exception that has
 * to be remembered is the thing the guard exists to replace.
 */
const base = {
  reviewerName: 'Test Reviewer', reviewerId: 'zz-e2e-rev-fixture', recordedBy: 'human:david@cluecrew.test',
  scope: 'ENG-001-WIW-04', at: '2026-08-16T18:00:00.000Z',
};

describe('renderReviewerReturn', () => {
  it('marks the reasoning as an authored field and renders it verbatim', () => {
    const out = renderReviewerReturn({ ...base, rulings: [{ subject: 'x', verdict: 'REVIEWED', reasoning: 'The  key\nholds.' }] });
    expect(out).toContain('### reasoning (authored field — read from this file, do not retype)');
    // VERBATIM: internal whitespace and line breaks survive, or it is not her wording.
    expect(out).toContain('The  key\nholds.');
  });

  it('records a missing reason as an absence rather than omitting the heading', () => {
    const out = renderReviewerReturn({ ...base, rulings: [{ subject: 'x', verdict: 'REVIEWED' }] });
    expect(out).toContain('### reasoning');
    expect(out).toContain('No reasoning recorded with this verdict');
  });

  it('keeps whose judgement separate from who typed it', () => {
    const out = renderReviewerReturn({ ...base, rulings: [{ subject: 'x', verdict: 'REVIEWED' }] });
    expect(out).toContain('Reviewer: Test Reviewer (zz-e2e-rev-fixture)');
    expect(out).toContain('Recorded by: human:david@cluecrew.test');
  });

  it('an empty return says it should not exist, rather than reading as a clean review', () => {
    const out = renderReviewerReturn({ ...base, rulings: [] });
    expect(out).toContain('NO RULINGS RECORDED');
    expect(out).toContain('This document should not exist');
  });

  it('is pure: same input, same bytes, so the hash is stable', () => {
    const one = renderReviewerReturn({ ...base, rulings: [{ subject: 'x', verdict: 'REVIEWED', reasoning: 'r' }] });
    const two = renderReviewerReturn({ ...base, rulings: [{ subject: 'x', verdict: 'REVIEWED', reasoning: 'r' }] });
    expect(one).toBe(two);
  });

  it('names the file by scope and date', () => {
    expect(reviewerReturnBasename('ENG-001', '2026-08-16T18:00:00.000Z')).toBe('return-eng-001-2026-08-16');
  });
});
