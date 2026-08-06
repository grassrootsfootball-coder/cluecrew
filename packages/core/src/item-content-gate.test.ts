import { describe, expect, it } from 'vitest';
import { checkItemChildFacing, type GatableItem } from './item-content-gate';

/**
 * A carrier sentence (vr-04 tiers 4-5; vr-06's cloze sentence) disambiguates a
 * word's sense and may run long, so `stem.sentence` is gated at the WORD-CARD
 * role: no sentence-length cap, but the vocabulary ceiling (four-syllable
 * words, max one) still holds and the headword stays exempt via testedTokens.
 * Every OTHER stem field keeps the item's own stem role — the prompt stays
 * capped. (Reviewer ratification, 2026-08-06.)
 */
describe('carrier sentence takes the word-card role', () => {
  const base: Omit<GatableItem, 'stem'> = {
    id: 'vr04-x',
    mechanic: 'select-one',
    options: [{ content: { value: 'infamous' } }, { content: { value: 'famous' } }],
  };
  // 21 words — well over the 16-word item-stem cap.
  const longSentence =
    'The reporter said the football player was very notorious after the long and very difficult match at the stadium.';

  it('lets a long carrier sentence through, headword exempt', () => {
    const failures = checkItemChildFacing({
      ...base,
      stem: {
        prompt: 'Which word is closest in meaning to the word on the card?',
        words: ['notorious'],
        sentence: longSentence,
        testedTokens: ['notorious'],
      },
    });
    expect(failures).toEqual([]);
  });

  it('still caps the same words when they sit in the prompt (item-stem role)', () => {
    const failures = checkItemChildFacing({
      ...base,
      stem: { prompt: longSentence, words: ['notorious'] },
    });
    expect(failures.map((f) => f.rule)).toContain('sentence-length');
  });

  it('keeps the vocabulary ceiling on the carrier sentence', () => {
    const failures = checkItemChildFacing({
      ...base,
      stem: {
        prompt: 'Which word is closest in meaning to the word on the card?',
        words: ['notorious'],
        sentence: 'His notorious melancholy suggested unmistakable desperation.',
        testedTokens: ['notorious'],
      },
    });
    expect(failures.map((f) => f.rule)).toContain('long-words');
  });

  it("applies the same rule to vr-06's cloze sentence field", () => {
    const failures = checkItemChildFacing({
      id: 'vr06-x',
      mechanic: 'letter-slot',
      options: [{ content: { value: 'DOC' } }],
      stem: {
        prompt: 'Three letters that make a word are missing. Which three?',
        sentence: 'When I felt poorly, Mum took me all the way across town to see the ___TOR at the surgery today.',
      },
    });
    expect(failures.filter((f) => f.rule === 'sentence-length')).toEqual([]);
  });
});
