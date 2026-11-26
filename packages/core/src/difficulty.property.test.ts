/**
 * PROPERTY TESTS FOR CONTENT-DRIVEN DIFFICULTY (R1075). Each property is a sentence the function's
 * own doc comment already states, now tested over drawn inputs instead of two hand-picked examples:
 * tiers stay in 1..5, more of the thing that makes an item harder never lowers its tier, and a set
 * is as hard as its hardest word.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { bandTier, categoryTier, deductionTier, vocabTierFrom, vocabTierOfSet } from './difficulty';

const word = fc.stringMatching(/^[a-z]{1,14}$/);
const entry = fc.record({ word, vaultTier: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }), familiar: fc.boolean() });
const inBand = (t: number) => Number.isInteger(t) && t >= 1 && t <= 5;

describe('difficulty: properties', () => {
  it('bandTier stays in 1..5 and never decreases as the score rises', () => {
    fc.assert(fc.property(fc.double({ min: -50, max: 50, noNaN: true }), fc.double({ min: 0, max: 50, noNaN: true }), (s, d) => {
      expect(inBand(bandTier(s))).toBe(true);
      expect(bandTier(s + d)).toBeGreaterThanOrEqual(bandTier(s));
    }));
  });

  it('a vault tier is used directly; without one, an unfamiliar word never rates easier than the same word familiar', () => {
    fc.assert(fc.property(word, fc.integer({ min: 1, max: 5 }), fc.boolean(), (w, v, fam) => {
      expect(vocabTierFrom(w, { vaultTier: v, familiar: fam })).toBe(v);
      expect(vocabTierFrom(w, { familiar: false })).toBeGreaterThan(vocabTierFrom(w, { familiar: true }));
    }));
  });

  it('a set is as hard as its hardest word, and adding a word never makes it easier', () => {
    fc.assert(fc.property(fc.array(entry, { minLength: 1, maxLength: 6 }), entry, (set, extra) => {
      const t = vocabTierOfSet(set);
      expect(t).toBe(Math.max(...set.map((e) => vocabTierFrom(e.word, e))));
      expect(vocabTierOfSet([...set, extra])).toBeGreaterThanOrEqual(t);
    }));
  });

  it('deductionTier: more clues, a transitive step or more people never lower the tier', () => {
    const inp = fc.record({ clueCount: fc.integer({ min: 1, max: 8 }), transitive: fc.boolean(), peopleCount: fc.integer({ min: 2, max: 6 }) });
    fc.assert(fc.property(inp, (x) => {
      const t = deductionTier(x);
      expect(inBand(t)).toBe(true);
      expect(deductionTier({ ...x, clueCount: x.clueCount + 1 })).toBeGreaterThanOrEqual(t);
      expect(deductionTier({ ...x, transitive: true })).toBeGreaterThanOrEqual(t);
      expect(deductionTier({ ...x, peopleCount: x.peopleCount + 1 })).toBeGreaterThanOrEqual(t);
    }));
  });

  it('categoryTier: a nearer category or harder words never lower the tier', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 2 }), fc.boolean(), (n, h) => {
      const t = categoryTier({ nearness: n, hardVocabulary: h });
      expect(inBand(t)).toBe(true);
      if (n < 2) expect(categoryTier({ nearness: n + 1, hardVocabulary: h })).toBeGreaterThanOrEqual(t);
      expect(categoryTier({ nearness: n, hardVocabulary: true })).toBeGreaterThanOrEqual(t);
    }));
  });
});
