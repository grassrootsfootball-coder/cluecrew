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
import { describeDraftSelfAssessment, draftAssessmentSubjectHash, readDraftSelfAssessment } from './draft-self-assessment';

const item = {
  prompt: 'Why does Toad take the cart?',
  tier: 3,
  options: [
    { text: 'It was light enough to pull.', isCorrect: true },
    { text: 'It was the only cart there.', isCorrect: false },
  ],
};

describe('draftAssessmentSubjectHash', () => {
  it('is stable for the same subject', () => {
    expect(draftAssessmentSubjectHash(item)).toBe(draftAssessmentSubjectHash({ ...item }));
  });

  // Every component of the rubric's subject must move the hash, or a claim survives a change to
  // the very thing it assessed — which is the defect being closed.
  it.each([
    ['the stem', { ...item, prompt: 'Why does Toad take the barrow?' }],
    ['the tier', { ...item, tier: 4 }],
    ['an option\'s text', { ...item, options: [{ text: 'It was small.', isCorrect: true }, item.options[1]!] }],
    ['which option is the key', { ...item, options: [{ ...item.options[0]!, isCorrect: false }, { ...item.options[1]!, isCorrect: true }] }],
  ])('changes when %s changes', (_label, moved) => {
    expect(draftAssessmentSubjectHash(moved)).not.toBe(draftAssessmentSubjectHash(item));
  });

  it('treats an absent stem as absent, not as empty', () => {
    expect(draftAssessmentSubjectHash({ ...item, prompt: null }))
      .not.toBe(draftAssessmentSubjectHash({ ...item, prompt: '' }));
  });
});

describe('readDraftSelfAssessment', () => {
  it('accepts both of the handoff states Cowork emits, under either name', () => {
    for (const v of ['PASS_TO_HUMAN', 'FIXED_THEN_PASS']) {
      expect(readDraftSelfAssessment({ handoffState: v, rubric: {} })?.handoffState).toBe(v);
      // The pre-rename name. Every file delivered before 2026-08-16 says `verdict`, and a reader
      // that only knew the new name would report 78 readable claims as unreadable.
      expect(readDraftSelfAssessment({ verdict: v, rubric: {} })?.handoffState).toBe(v);
    }
  });

  // An unreadable claim is an ABSENT claim, never a permissive default: anything that coerced an
  // unknown verdict into a pass would be inventing a judgement nobody made.
  it.each([null, {}, { verdict: 'APPROVED' }, { handoffState: 'SIGNED' }, 'PASS_TO_HUMAN'])(
    'returns null for %s', (bad) => { expect(readDraftSelfAssessment(bad)).toBeNull(); },
  );
});

describe('describeDraftSelfAssessment', () => {
  const rendered = describeDraftSelfAssessment({
    handoffState: 'PASS_TO_HUMAN',
    rubric: { readingAge: 7.6, banList: 'clear', keyVerified: true, tierFit: 'confirmed' },
  });

  it('says a human has not looked, wherever the state is surfaced', () => {
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
  /**
   * THE FIXTURES ARE ASSEMBLED, NOT WRITTEN OUT. A test that literally contains a line binding the
   * column to `reviewedBy` IS the violation leg B looks for, and this file would trip the gate it
   * exists to prove. Exempting the canary from leg B would have been the easy fix and the wrong
   * one — an exemption for the file whose whole job is to demonstrate the rule.
   */
  const COL = 'draftSelf' + 'Assessment';
  const REV = 'reviewed' + 'By';

  it('passes a file that never names the column', () => {
    expect(inspectSource('some/file.ts', `const x = item.${REV};`)).toEqual([]);
  });

  it('leg A: refuses an undeclared file that names the column', () => {
    const v = inspectSource('apps/web/src/lib/serve.ts', 'select: { draftSelfAssessment: true }');
    expect(v).toHaveLength(1);
    expect(v[0]!.leg).toBe('A');
  });

  // The construct the ruling forbids: a self-assessment answering a question about a reviewer.
  it('leg B: refuses a line binding the column to review state, EVEN IN A DECLARED DOOR', () => {
    const v = inspectSource(
      'scripts/check-review-queries.ts',
      `const isReviewed = item.${COL} != null || item.${REV};`,
    );
    expect(v.some((x) => x.leg === 'B')).toBe(true);
  });

  // File-level co-occurrence cried wolf on its first run — it flagged the schema for declaring
  // both columns in one model. Distance between them is the whole point of the narrowing.
  it('leg B: allows the column and a review field on separate lines of a declared door', () => {
    const v = inspectSource(
      'packages/db/prisma/schema.prisma',
      `${COL} Json?\n${REV} String?`,
    );
    expect(v).toEqual([]);
  });

  it('leg B: ignores a comment, which cannot bind anything', () => {
    const v = inspectSource(
      'scripts/backfill-draft-assessment.ts',
      `// ${COL} is not ${REV} and never will be`,
    );
    expect(v).toEqual([]);
  });
});
