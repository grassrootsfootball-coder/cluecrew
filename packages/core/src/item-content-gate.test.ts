import { describe, expect, it } from 'vitest';
import { checkItemChildFacing, type GatableItem } from './item-content-gate';
import { isBlocking } from './content-gates';

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

describe('multi-quote stems (R136)', () => {
  const base = {
    id: 'T', mechanic: 'select-one',
    explanation: { walkScript: 'Look at line 35.', hintCore: 'Who is looking?' },
    options: [
      { content: { label: 'A', value: 'One.' }, isCorrect: false },
      { content: { label: 'B', value: 'Two.' }, isCorrect: true },
    ],
  };

  it('accepts a stem declaring TWO quotations — each quote field carries only itself', () => {
    // Broken since the mechanism was written: screening `quotes[0].text` was passed EVERY declared
    // span, so quote 1's span was sought inside quote 0's text and reported as not in it. One
    // quotation always worked, which is why nothing caught it.
    const faults = checkItemChildFacing({
      ...base,
      stem: {
        text: 'Line 35 says an ordinary observer and line 41 an extraordinary observer. Why?',
        quotes: [{ text: 'an ordinary observer' }, { text: 'an extraordinary observer' }],
      },
    }).filter(isBlocking);
    expect(faults).toEqual([]);
  });

  it('still reports a declared span that really is absent from the stem', () => {
    const faults = checkItemChildFacing({
      ...base,
      stem: { text: 'Line 35 says an ordinary observer. Why?', quotes: [{ text: 'a nonexistent span' }] },
    }).filter(isBlocking);
    expect(faults.some((f) => f.detail.includes('not in the text'))).toBe(true);
  });
});

describe('option branch takes the stem branch\'s arguments (R148)', () => {
  const base = {
    id: 'T', mechanic: 'select-one',
    explanation: { walkScript: 'Look at line 41.', hintCore: 'Who?' },
  };
  const QUOTE = 'an ordinary observer and an extraordinary observer';
  const opts = (v: string) => [
    { content: { label: 'A', value: v }, isCorrect: false },
    { content: { label: 'B', value: 'Two.' }, isCorrect: true },
  ];

  it('a stem-declared span covers an option that reproduces it', () => {
    const faults = checkItemChildFacing({
      ...base,
      stem: { text: `Line 41 says ${QUOTE}. Why?`, quotes: [{ text: QUOTE }] },
      options: opts(`He is ${QUOTE}.`),
    }).filter(isBlocking);
    expect(faults).toEqual([]);
  });

  it('an UNDECLARED span in an option still blocks — the exemption is not a blanket', () => {
    const faults = checkItemChildFacing({
      ...base, stem: { text: 'Line 41. Why?' }, options: opts(`He is ${QUOTE}.`),
    }).filter(isBlocking);
    expect(faults.some((f) => f.rule === 'long-words')).toBe(true);
  });

  it('a stem span the option does not use is NOT reported against it', () => {
    // Both quotedSpans and exemptSpans are filtered to what is present. Filtering only the first
    // made six items newly fail with "declares a quoted span that is not in the text" — the ban
    // list had received the raw stem list and judged it against an option it was never about.
    const faults = checkItemChildFacing({
      ...base,
      stem: { text: `Line 41 says ${QUOTE}. Why?`, quotes: [{ text: QUOTE }] },
      options: opts('Something else entirely.'),
    }).filter(isBlocking);
    expect(faults).toEqual([]);
  });
});
