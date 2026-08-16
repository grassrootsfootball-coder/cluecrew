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
import { checkAttractorDefeater, quoteLinesOutsideWindow } from '../line-refs';
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

describe('CHECK 11 — containment, not equality', () => {
  // The two cases that settled the rule. An EQUALITY check passes the second and fails the first,
  // making the narrower — correct — value look like the defect.
  it('accepts a quote span narrower than the item window', () => {
    expect(quoteLinesOutsideWindow([56, 57, 58, 59, 60, 61, 62], [56, 57])).toEqual([]);
    expect(quoteLinesOutsideWindow([57, 58, 59], [57, 58])).toEqual([]);
  });

  it('accepts a span equal to the window', () => {
    expect(quoteLinesOutsideWindow([4, 5], [4, 5])).toEqual([]);
  });

  it('names every line that reaches outside the window', () => {
    expect(quoteLinesOutsideWindow([4, 5, 6], [5, 9, 3])).toEqual([3, 9]);
  });

  // No window is not a violation: there is nothing to be contained IN, and reporting one here
  // would put the missing-window fault on the quote that did nothing wrong.
  it.each([[null, [1, 2]], [[1, 2], null], [[], [1]], [[1], []]])(
    'reports nothing when a side is absent or empty (%s, %s)', (win, q) => {
      expect(quoteLinesOutsideWindow(win as number[] | null, q as number[] | null)).toEqual([]);
    },
  );
});

describe('Addendum 36 — attractor and defeater', () => {
  const window = [10, 11, 12, 13];

  it('accepts a sound pair inside the window', () => {
    expect(checkAttractorDefeater({ itemLineRefs: window, attractorLine: 11, defeaterLine: 13 })).toEqual([]);
  });

  // One line can carry both the pull and the correction, so EQUAL is legitimate.
  it('accepts attractor and defeater on the same line', () => {
    expect(checkAttractorDefeater({ itemLineRefs: window, attractorLine: 12, defeaterLine: 12 })).toEqual([]);
  });

  it('accepts an absent pair — the backfill is scoped separately', () => {
    expect(checkAttractorDefeater({ itemLineRefs: window })).toEqual([]);
  });

  it.each([
    ['only the attractor', { attractorLine: 11 }, 'both are required'],
    ['only the defeater', { defeaterLine: 11 }, 'both are required'],
  ])('refuses %s', (_l, partial, expected) => {
    expect(checkAttractorDefeater({ itemLineRefs: window, ...partial }).join(' ')).toContain(expected);
  });

  it('refuses a line outside the item window', () => {
    const out = checkAttractorDefeater({ itemLineRefs: window, attractorLine: 9, defeaterLine: 13 });
    expect(out.join(' ')).toContain('attractorLine 9 is outside');
  });

  // A defeater the child had already read and passed is not a defeater.
  it('refuses a defeater before its attractor', () => {
    expect(checkAttractorDefeater({ itemLineRefs: window, attractorLine: 13, defeaterLine: 11 }).join(' '))
      .toContain('comes before');
  });

  it('still checks ordering when the item declares no window', () => {
    expect(checkAttractorDefeater({ attractorLine: 13, defeaterLine: 11 })).toHaveLength(1);
  });
});
