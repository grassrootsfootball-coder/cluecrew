/**
 * THE ELEVEN SPaG FAMILIES (David, 2026-08-08 — "English follows the maths model").
 *
 * 4 spelling franchises + 4 punctuation franchises + 3 grammar-cloze franchises = 11,
 * the set BUILD-DISTRICT-ENGLISH §1 names (spelling: homophones, doubles, unstressed
 * suffix vowels, silent letters; punctuation: apostrophes, terminal/boundary, speech,
 * commas; cloze: word-class-by-job, tense sequence, connectives/tags). Each is a
 * `SpagFamily` on the shared engine: a tier rule, DECLARED structural parameters the
 * ladder gate checks, and GENERATOR-CONSUMED number ranges that FILTER the bank (a higher
 * tier draws a longer target word / a longer sentence — the range is the constraint, the
 * maths lesson).
 *
 * THE BANKS ARE THE AUTHORED INPUT — the SPaG analogue of maths contexts. A reviewer signs
 * the family (its tier rule + ladder) and the bank (clean, era-neutral, one error each);
 * the generator only injects and assembles. Correctness of the untouched segments is by
 * construction: distractor segments are drawn from CLEAN, and exactly one error is injected
 * into the key segment. These seed banks are deliberately small and extensible.
 */
import { randPick, type Tier } from '../maths/generator';
import type { SpagFamily, SpagItemDraft, SpagOption } from './spag-generator';

// ---------------------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------------------

const wordCount = (s: string): number => s.trim().split(/\s+/).length;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Fisher–Yates on the seeded rng. */
function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
/** Pick n distinct items. */
function pickN<T>(xs: readonly T[], n: number, r: () => number): T[] {
  return shuffle([...xs], r).slice(0, n);
}

// ---------------------------------------------------------------------------------------
// Clean segment bank — authored error-free, short, era-neutral. Distractor segments for
// error-spot come only from here, so "the other segments are correct" is guaranteed.
// ---------------------------------------------------------------------------------------
const CLEAN: string[] = [
  'she opened her notebook',
  'the bell rang for lunch',
  'we waited by the gate',
  'he counted the spare pencils',
  'the class lined up outside',
  'a light rain began to fall',
  'they packed the last few bags',
  'the coach checked her list',
  'the hall was warm and quiet',
  'two players jogged to the line',
  'she pinned the notice up',
  'the door swung shut behind them',
];

// ---------------------------------------------------------------------------------------
// SPELLING — error-spot, franchise = one spelling pattern. Numeric dial: `letters`
// (length of the misspelled target word). Structural ladder: word band + N-keying + the
// distractor proximity at the top tier.
// ---------------------------------------------------------------------------------------
const SPELL_STEM = 'Read the sentence. One part has a spelling mistake. Which part is it? If every part is right, choose N.';
const SPELL_FRANCHISES = [
  'en-homophone-by-sound',
  'en-double-consonant-boundary',
  'en-unstressed-suffix-vowel',
  'en-silent-letter-dropped',
] as const;

interface ErrClause { text: string; target: string } // text CONTAINS the misspelled target
const SPELL_ERRORS: Record<string, ErrClause[]> = {
  'en-homophone-by-sound': [
    { text: 'the twins left there lunch boxes', target: 'there' },
    { text: 'she could not here the whistle', target: 'here' },
    { text: 'the team walked passed the office', target: 'passed' },
    { text: 'he was aloud to leave early', target: 'aloud' },
    { text: 'we saw the whether change quickly', target: 'whether' },
  ],
  'en-double-consonant-boundary': [
    { text: 'Jonah was dissapointed with his score', target: 'dissapointed' },
    { text: 'the begining of the term was busy', target: 'begining' },
    { text: 'she found the work embarassing', target: 'embarassing' },
    { text: 'it was a happy occassion for all', target: 'occassion' },
    { text: 'the recomended book was long', target: 'recomended' },
  ],
  'en-unstressed-suffix-vowel': [
    { text: 'Ravi gave an excellant answer', target: 'excellant' },
    { text: 'the two desks were seperate', target: 'seperate' },
    { text: 'she made a definate choice', target: 'definate' },
    { text: 'the calender showed the date', target: 'calender' },
    { text: 'they felt independant at last', target: 'independant' },
  ],
  'en-silent-letter-dropped': [
    { text: 'on Wenesday the whole school met', target: 'Wenesday' },
    { text: 'the nite sky was full of stars', target: 'nite' },
    { text: 'there was no dout about the plan', target: 'dout' },
    { text: 'the iland lay far offshore', target: 'iland' },
    { text: 'she gave an honist reply', target: 'honist' },
  ],
};

function spellBand(tier: Tier): [number, number] {
  return { 1: [3, 5], 2: [5, 8], 3: [8, 11], 4: [8, 13], 5: [8, 13] }[tier] as [number, number];
}
function spellStructural(tier: Tier): Record<string, string | number> {
  const band = { 1: 'short', 2: 'medium', 3: 'long', 4: 'long', 5: 'long' }[tier]!;
  const nKeyed = tier >= 2 ? 'sometimes' : 'no';
  const proximity = tier >= 4 ? 'near-miss' : 'other-franchise';
  return { wordBand: band, nKeyed, distractorProximity: proximity };
}

function spellFamily(franchise: string, name: string, tiers: Tier[]): SpagFamily {
  const siblings = SPELL_FRANCHISES.filter((f) => f !== franchise);
  return {
    id: `spag-spell-${franchise.replace('en-', '')}`,
    name,
    subtype: 'spelling',
    franchise,
    tierRule: (t) => (tiers.includes(t) ? `${name}: spot the mis-spelled word (${spellStructural(t).wordBand} words), 4 parts + N.` : ''),
    structuralParams: spellStructural,
    numberRanges: (t) => ({ letters: spellBand(t), segments: [4, 4] }),
    draft: (tier, r): SpagItemDraft => {
      const [lo, hi] = spellBand(tier);
      const pool = (SPELL_ERRORS[franchise] ?? []).filter((e) => e.target.length >= lo && e.target.length <= hi);
      const nKeyed = spellStructural(tier).nKeyed === 'sometimes' && r() < 0.2;
      if (nKeyed || pool.length === 0) {
        const cleans = pickN(CLEAN, 4, r);
        const opts: SpagOption[] = cleans.map((c, i) => ({ value: `${cap(c)},`, isKey: false, misconceptionId: siblings[i % siblings.length]! }));
        opts.push({ value: 'No mistake', isKey: true });
        return { stem: SPELL_STEM, options: shuffle(opts, r), params: { letters: lo, segments: 4, nKeyed: 'yes' } };
      }
      const err = randPick(r, pool);
      const cleans = pickN(CLEAN, 3, r);
      const opts: SpagOption[] = [
        { value: `${cap(err.text)}.`, isKey: true },
        ...cleans.map((c, i) => ({ value: `${cap(c)},`, isKey: false, misconceptionId: siblings[i % siblings.length]! })),
        { value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' },
      ];
      return { stem: SPELL_STEM, options: shuffle(opts, r), params: { letters: err.target.length, segments: 4, nKeyed: 'no' } };
    },
  };
}

// ---------------------------------------------------------------------------------------
// PUNCTUATION — error-spot, franchise = one punctuation class. Numeric dial: `words`
// (segment word count). Structural ladder: sentence context per tier.
// ---------------------------------------------------------------------------------------
const PUNCT_STEM = 'Read the sentence. One part has a punctuation mistake. Which part is it? If every part is right, choose N.';
const PUNCT_FRANCHISES = ['en-apostrophe-possession', 'en-terminal-punctuation-blind', 'en-speech-punctuation-inside', 'en-comma-subject-verb-split'] as const;

const PUNCT_ERRORS: Record<string, string[]> = {
  'en-apostrophe-possession': [
    "the childrens' coats were on the pegs",
    "the dog wagged it's tail happily",
    "she borrowed her sisters' ruler",
    "the teams' captain raised her arm",
  ],
  'en-terminal-punctuation-blind': [
    'he opened the doors the class raced out',
    'the rain stopped we went outside again',
    'she read the note then she smiled',
    'the bell rang nobody moved at first',
  ],
  'en-speech-punctuation-inside': [
    '"has anyone seen my whistle"?',
    'she asked, "where are the cones"?',
    '"stop right there"! called the coach',
    '"we won the match"! shouted the team',
  ],
  'en-comma-subject-verb-split': [
    'the boy in the blue coat, waved back',
    'the dog that barked loudly, ran off',
    'the girl with the red bag, sat down',
    'the man at the gate, checked the list',
  ],
};

function punctBand(tier: Tier): [number, number] {
  return { 1: [3, 5], 2: [4, 6], 3: [5, 8], 4: [6, 10], 5: [6, 10] }[tier] as [number, number];
}
function punctStructural(tier: Tier): Record<string, string | number> {
  const context = { 1: 'single-clause', 2: 'coordinated', 3: 'subordinated', 4: 'reported-speech', 5: 'reported-speech' }[tier]!;
  return { context, nKeyed: tier >= 2 ? 'sometimes' : 'no' };
}

function punctFamily(franchise: string, name: string, tiers: Tier[]): SpagFamily {
  const siblings = PUNCT_FRANCHISES.filter((f) => f !== franchise);
  return {
    id: `spag-punct-${franchise.replace('en-', '').replace('-punctuation', '').replace('punctuation-', '')}`,
    name,
    subtype: 'punctuation',
    franchise,
    tierRule: (t) => (tiers.includes(t) ? `${name}: spot the punctuation slip (${punctStructural(t).context}), 4 parts + N.` : ''),
    structuralParams: punctStructural,
    numberRanges: (t) => ({ words: punctBand(t), segments: [4, 4] }),
    draft: (tier, r): SpagItemDraft => {
      const [lo, hi] = punctBand(tier);
      const pool = (PUNCT_ERRORS[franchise] ?? []).filter((e) => wordCount(e) >= lo && wordCount(e) <= hi);
      const nKeyed = punctStructural(tier).nKeyed === 'sometimes' && r() < 0.2;
      if (nKeyed || pool.length === 0) {
        const cleans = pickN(CLEAN, 4, r);
        const opts: SpagOption[] = cleans.map((c, i) => ({ value: `${cap(c)},`, isKey: false, misconceptionId: siblings[i % siblings.length]! }));
        opts.push({ value: 'No mistake', isKey: true });
        return { stem: PUNCT_STEM, options: shuffle(opts, r), params: { words: lo, segments: 4, nKeyed: 'yes' } };
      }
      const err = randPick(r, pool);
      const cleans = pickN(CLEAN, 3, r);
      const opts: SpagOption[] = [
        { value: cap(err), isKey: true },
        ...cleans.map((c, i) => ({ value: `${cap(c)},`, isKey: false, misconceptionId: siblings[i % siblings.length]! })),
        { value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' },
      ];
      return { stem: PUNCT_STEM, options: shuffle(opts, r), params: { words: wordCount(err), segments: 4, nKeyed: 'no' } };
    },
  };
}

// ---------------------------------------------------------------------------------------
// CLOZE — choose the word that fits. Numeric dial: `words` (carrier sentence length).
// Structural ladder: the grammatical context per tier. Distractors are the closed
// paradigm for the target feature, each carrying its own misconception.
// ---------------------------------------------------------------------------------------
const CLOZE_STEM = (sentence: string): string => `Choose the word that fits best.  —  ${sentence}`;

interface ClozeEntry { sentence: string; key: string; distractors: Array<{ value: string; misconceptionId: string }> }
const CLOZE_BANK: Record<string, ClozeEntry[]> = {
  // word-class-by-job: adjective vs adverb vs noun form
  'en-word-class-by-ending': [
    { sentence: '"She answered the question ___."', key: 'quickly', distractors: [{ value: 'quick', misconceptionId: 'en-word-class-by-ending' }, { value: 'quickness', misconceptionId: 'en-word-class-by-ending' }, { value: 'quicken', misconceptionId: 'en-word-class-by-ending' }] },
    { sentence: '"He spoke to the class ___."', key: 'clearly', distractors: [{ value: 'clear', misconceptionId: 'en-word-class-by-ending' }, { value: 'clearness', misconceptionId: 'en-word-class-by-ending' }, { value: 'clarity', misconceptionId: 'en-word-class-by-ending' }] },
    { sentence: '"The runner moved ___ down the track."', key: 'smoothly', distractors: [{ value: 'smooth', misconceptionId: 'en-word-class-by-ending' }, { value: 'smoothness', misconceptionId: 'en-word-class-by-ending' }, { value: 'smoothen', misconceptionId: 'en-word-class-by-ending' }] },
  ],
  // tense sequence: the form the surrounding tense forces
  'en-tense-sequence': [
    { sentence: '"By lunchtime she ___ the whole plan."', key: 'had drawn', distractors: [{ value: 'drew', misconceptionId: 'en-tense-sequence' }, { value: 'has drawn', misconceptionId: 'en-tense-sequence' }, { value: 'draws', misconceptionId: 'en-tense-sequence' }] },
    { sentence: '"When the bell rang, we ___ already left."', key: 'had', distractors: [{ value: 'have', misconceptionId: 'en-tense-sequence' }, { value: 'has', misconceptionId: 'en-tense-sequence' }, { value: 'having', misconceptionId: 'en-tense-sequence' }] },
    { sentence: '"She said that she ___ tired that day."', key: 'was', distractors: [{ value: 'is', misconceptionId: 'en-tense-sequence' }, { value: 'has been', misconceptionId: 'en-tense-sequence' }, { value: 'will be', misconceptionId: 'en-tense-sequence' }] },
  ],
  // connectives / question tags: the logical link the clause needs
  'en-conjunction-logic': [
    { sentence: '"She was very tired, ___ she kept running."', key: 'but', distractors: [{ value: 'so', misconceptionId: 'en-conjunction-logic' }, { value: 'because', misconceptionId: 'en-conjunction-logic' }, { value: 'and', misconceptionId: 'en-conjunction-logic' }] },
    { sentence: '"We stayed inside ___ it was raining."', key: 'because', distractors: [{ value: 'but', misconceptionId: 'en-conjunction-logic' }, { value: 'so', misconceptionId: 'en-conjunction-logic' }, { value: 'or', misconceptionId: 'en-conjunction-logic' }] },
    { sentence: '"You are on the last leg, ___?"', key: "aren't you", distractors: [{ value: 'are you', misconceptionId: 'en-question-tag-polarity' }, { value: "isn't it", misconceptionId: 'en-question-tag-polarity' }, { value: "don't you", misconceptionId: 'en-question-tag-polarity' }] },
  ],
};

function clozeBand(tier: Tier): [number, number] {
  return { 1: [4, 7], 2: [6, 9], 3: [7, 11], 4: [8, 14], 5: [8, 14] }[tier] as [number, number];
}
function clozeStructural(tier: Tier): Record<string, string | number> {
  const context = { 1: 'single-clause', 2: 'two-clause', 3: 'across-clause', 4: 'subordinated', 5: 'subordinated' }[tier]!;
  return { context };
}

function clozeFamily(franchise: string, name: string, tiers: Tier[]): SpagFamily {
  return {
    id: `spag-cloze-${franchise.replace('en-', '')}`,
    name,
    subtype: 'cloze',
    franchise,
    tierRule: (t) => (tiers.includes(t) ? `${name}: choose the form the ${clozeStructural(t).context} sentence forces.` : ''),
    structuralParams: clozeStructural,
    numberRanges: (t) => ({ words: clozeBand(t), gaps: [1, 1] }),
    draft: (tier, r): SpagItemDraft => {
      const [lo, hi] = clozeBand(tier);
      const pool = (CLOZE_BANK[franchise] ?? []).filter((e) => wordCount(e.sentence) >= lo && wordCount(e.sentence) <= hi);
      const e = pool.length ? randPick(r, pool) : randPick(r, CLOZE_BANK[franchise] ?? []);
      const opts: SpagOption[] = [
        { value: e.key, isKey: true },
        ...e.distractors.map((d) => ({ value: d.value, isKey: false, misconceptionId: d.misconceptionId })),
      ];
      return { stem: CLOZE_STEM(e.sentence), options: shuffle(opts, r), params: { words: wordCount(e.sentence), gaps: 1 } };
    },
  };
}

// ---------------------------------------------------------------------------------------
// THE ELEVEN
// ---------------------------------------------------------------------------------------
export const SPAG_FAMILIES: SpagFamily[] = [
  // Spelling (4) — franchises span the bands their words naturally occupy.
  spellFamily('en-homophone-by-sound', 'Homophones', [1, 2]),
  spellFamily('en-double-consonant-boundary', 'Double letters', [2, 3, 4]),
  spellFamily('en-unstressed-suffix-vowel', 'Unstressed suffix vowel', [2, 3, 4]),
  spellFamily('en-silent-letter-dropped', 'Silent letters', [1, 2]),
  // Punctuation (4)
  punctFamily('en-apostrophe-possession', 'Apostrophes', [1, 2, 3, 4]),
  punctFamily('en-terminal-punctuation-blind', 'Terminal and boundary', [2, 3, 4]),
  punctFamily('en-speech-punctuation-inside', 'Speech punctuation', [2, 3, 4]),
  punctFamily('en-comma-subject-verb-split', 'Commas', [2, 3, 4]),
  // Cloze (3)
  clozeFamily('en-word-class-by-ending', 'Word class by job', [1, 2, 3]),
  clozeFamily('en-tense-sequence', 'Tense sequence', [2, 3, 4]),
  clozeFamily('en-conjunction-logic', 'Connectives and tags', [2, 3, 4]),
];
