import { describe, expect, it } from 'vitest';
import { isTwoSenseSeed, screenVocabItem, vocabSeedCoverage, type TwoSenseCard } from './vocab-in-context';

const AMBITIOUS: TwoSenseCard = {
  headword: 'ambitious',
  tier: 3,
  definitionChild: 'wanting very much to do well, and willing to work hard for it',
  wordClass: 'adjective',
  senseBDefinition: 'big and difficult, and needing a lot of work to finish',
  senseBWordClass: 'adjective',
  likelierKnown: 'A',
};

describe('vocab-in-context (two-sense screen)', () => {
  it('accepts a clean bare card whose distractors avoid the other sense', () => {
    const res = screenVocabItem(AMBITIOUS, {
      key: 'determined',
      distractors: ['gentle', 'cautious', 'ordinary'],
      otherSenseWords: ['demanding', 'huge', 'tough'], // sense B synonyms — none used as a distractor
    });
    expect(res.ok).toBe(true);
    expect(res.row?.carrier).toBeNull();
  });

  it('forbids a distractor that is correct in the OTHER sense (a second answer)', () => {
    const res = screenVocabItem(AMBITIOUS, {
      key: 'determined',
      distractors: ['gentle', 'demanding', 'ordinary'], // "demanding" fits sense B
      otherSenseWords: ['demanding', 'huge', 'tough'],
    });
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/other sense/i);
  });

  it('rejects a card that is not two-sense', () => {
    expect(isTwoSenseSeed({ ...AMBITIOUS, senseBDefinition: null })).toBe(false);
  });

  it('reports seed coverage by tier', () => {
    const cov = vocabSeedCoverage([AMBITIOUS, { ...AMBITIOUS, headword: 'novel', tier: 4 }]);
    expect(cov.totalTwoSense).toBe(2);
    expect(cov.byTier).toEqual({ 3: 1, 4: 1 });
  });
});
