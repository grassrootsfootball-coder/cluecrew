import { describe, expect, it } from 'vitest';
import { bandTier, categoryTier, deductionTier, vocabTierFrom, vocabTierOfSet } from './difficulty';

describe('vocabTierFrom — content, not loop index', () => {
  it('uses the vault tier when the word is in the vault', () => {
    expect(vocabTierFrom('anything', { vaultTier: 3, familiar: true })).toBe(3);
  });
  it('keeps a vault T5 as T5 — VR has five tiers (corrected 2026-08-02)', () => {
    expect(vocabTierFrom('x', { vaultTier: 5, familiar: false })).toBe(5);
  });
  it('proxy: a familiar short word is easy, an unfamiliar long one is hard', () => {
    expect(vocabTierFrom('cat', { familiar: true })).toBeLessThan(
      vocabTierFrom('incomprehensible', { familiar: false }),
    );
  });
  it('a set is as hard as its hardest word', () => {
    expect(
      vocabTierOfSet([
        { word: 'cat', familiar: true },
        { word: 'x', vaultTier: 4, familiar: false },
      ]),
    ).toBe(4);
  });
});

describe('deductionTier — reasoning load', () => {
  it('a transitive chain beats direct clues', () => {
    expect(deductionTier({ clueCount: 2, transitive: false, peopleCount: 3 })).toBeLessThan(
      deductionTier({ clueCount: 2, transitive: true, peopleCount: 3 }),
    );
  });
});

describe('categoryTier — nearness plus vocabulary', () => {
  it('a near category with hard words outscores a far one with easy words', () => {
    expect(categoryTier({ nearness: 2, hardVocabulary: true })).toBeGreaterThan(
      categoryTier({ nearness: 0, hardVocabulary: false }),
    );
  });
});

describe('bandTier clamps to 1..5', () => {
  it('floors and caps', () => {
    expect(bandTier(-2)).toBe(1);
    expect(bandTier(9)).toBe(5);
  });
});
