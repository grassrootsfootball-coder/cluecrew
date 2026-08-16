/**
 * THE PRE-REVIEW CANARY.
 *
 * `check:review-queries` passes over a codebase that happens to be clean, which asserts nothing
 * about the gate (R60 question 2). These drive its two legs directly on synthetic sources, and
 * cover the subject hash — the field Cowork's version does not have and the one that decides
 * whether a claim still describes its item.
 */
import { describe, expect, it } from 'vitest';
import { inspectSource } from '../../../../scripts/check-review-queries';
import { describePreReview, preReviewSubjectHash, readPreReview } from './pre-review';

const item = {
  prompt: 'Why does Toad take the cart?',
  tier: 3,
  options: [
    { text: 'It was light enough to pull.', isCorrect: true },
    { text: 'It was the only cart there.', isCorrect: false },
  ],
};

describe('preReviewSubjectHash', () => {
  it('is stable for the same subject', () => {
    expect(preReviewSubjectHash(item)).toBe(preReviewSubjectHash({ ...item }));
  });

  // Every component of the rubric's subject must move the hash, or a claim survives a change to
  // the very thing it assessed — which is the defect being closed.
  it.each([
    ['the stem', { ...item, prompt: 'Why does Toad take the barrow?' }],
    ['the tier', { ...item, tier: 4 }],
    ['an option\'s text', { ...item, options: [{ text: 'It was small.', isCorrect: true }, item.options[1]!] }],
    ['which option is the key', { ...item, options: [{ ...item.options[0]!, isCorrect: false }, { ...item.options[1]!, isCorrect: true }] }],
  ])('changes when %s changes', (_label, moved) => {
    expect(preReviewSubjectHash(moved)).not.toBe(preReviewSubjectHash(item));
  });

  it('treats an absent stem as absent, not as empty', () => {
    expect(preReviewSubjectHash({ ...item, prompt: null }))
      .not.toBe(preReviewSubjectHash({ ...item, prompt: '' }));
  });
});

describe('readPreReview', () => {
  it('accepts both of the verdicts Cowork emits', () => {
    for (const v of ['PASS_TO_HUMAN', 'FIXED_THEN_PASS']) {
      expect(readPreReview({ verdict: v, rubric: {} })?.verdict).toBe(v);
    }
  });

  // An unreadable claim is an ABSENT claim, never a permissive default: anything that coerced an
  // unknown verdict into a pass would be inventing a judgement nobody made.
  it.each([null, {}, { verdict: 'APPROVED' }, { verdict: 'SIGNED' }, 'PASS_TO_HUMAN'])(
    'returns null for %s', (bad) => { expect(readPreReview(bad)).toBeNull(); },
  );
});

describe('describePreReview', () => {
  const rendered = describePreReview({
    verdict: 'PASS_TO_HUMAN',
    rubric: { readingAge: 7.6, banList: 'clear', keyVerified: true, tierFit: 'confirmed' },
  });

  it('says a human has not looked, wherever the verdict is surfaced', () => {
    expect(rendered[0]).toContain('has NOT reviewed');
  });

  // Stored on nobody's authority is fine; mistaken later for findings is not. A bare
  // "readingAge: 7.6" reads exactly like a measurement.
  it('marks the re-derivable keys as claims and names the gate that re-derives them', () => {
    for (const [key, gate] of [['readingAge', 'reading-age lint'], ['banList', 'scan:vocab'], ['keyVerified', 'checkItemChildFacing']]) {
      const line = rendered.find((l) => l.includes(`${key}:`))!;
      expect(line).toContain('CLAIMED by the drafting agent');
      expect(line).toContain(gate!);
    }
  });

  it('marks a judgement key as a judgement no gate re-derives', () => {
    expect(rendered.find((l) => l.includes('tierFit:'))).toContain('no gate re-derives it');
  });
});

describe('check:review-queries legs', () => {
  it('passes a file that never names the column', () => {
    expect(inspectSource('some/file.ts', 'const x = item.reviewedBy;')).toEqual([]);
  });

  it('leg A: refuses an undeclared file that names the column', () => {
    const v = inspectSource('apps/web/src/lib/serve.ts', 'select: { authoringPreReview: true }');
    expect(v).toHaveLength(1);
    expect(v[0]!.leg).toBe('A');
  });

  // The construct the ruling forbids: a self-assessment answering a question about a reviewer.
  it('leg B: refuses a line binding the column to review state, EVEN IN A DECLARED DOOR', () => {
    const v = inspectSource(
      'scripts/check-review-queries.ts',
      'const reviewed = item.authoringPreReview != null || item.reviewedBy;',
    );
    expect(v.some((x) => x.leg === 'B')).toBe(true);
  });

  // File-level co-occurrence cried wolf on its first run — it flagged the schema for declaring
  // both columns in one model. Distance between them is the whole point of the narrowing.
  it('leg B: allows the column and a review field on separate lines of a declared door', () => {
    const v = inspectSource(
      'packages/db/prisma/schema.prisma',
      'authoringPreReview Json?\nreviewedBy String?',
    );
    expect(v).toEqual([]);
  });

  it('leg B: ignores a comment, which cannot bind anything', () => {
    const v = inspectSource(
      'scripts/backfill-pre-review.ts',
      '// authoringPreReview is not reviewedBy and never will be',
    );
    expect(v).toEqual([]);
  });
});
