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
// HOMOPHONES — REBUILT to annie's spec (2026-08-08). Fixes the four faults she found on the
// v1 sheet:
//  1. FALSE-POSITIVE TAG. A child who picks a CORRECT part is not making the spelling error a
//     borrowed franchise tag claimed; she is making a false-positive error (thinking a correct
//     part is wrong). Every correct-part distractor carries `en-error-spot-false-positive` —
//     the nameable misconception, not a mis-describing franchise tag.
//  2. ONE COHERENT SENTENCE. The four parts are one sentence in order (not four unrelated
//     clauses), exactly one part carrying the error — the GL spot-the-mistake shape. Parts are
//     shown in sentence order, never shuffled.
//  3. NO RECURRENCE. Each item is a distinct sentence, so no fragment or key repeats.
//  4. STRUCTURAL LADDER, NOT MAGNITUDE. The ladder is carried by N-keying and near-miss
//     proximity (both genuinely structural) — NOT by word length. Word length stays a bounded
//     range but makes no ladder claim (blind-spot one from the maths pass).
// Ceiling T4 (SPaG cap, BUILD-DISTRICT-ENGLISH §1) — no T5, by the corpus, not by omission.
// ---------------------------------------------------------------------------------------
// annie's split (2026-08-08): a distractor part built as a NEAR-MISS is picked by a child
// over-applying a real rule; a PLAIN part is picked by a child who assumes something must be
// wrong and guesses. Near-miss status is DERIVED from the family's own homophone list —
// VERIFIED per part, not asserted per sentence (her third-district catch of the maths gate's
// declare-don't-verify blind spot). Each gets its own tag and its own hint.
const SPOT_RULE_OVER_APPLIED = 'en-error-spot-rule-over-applied'; // a near-miss part
const SPOT_GUESSED = 'en-error-spot-guessed-a-part'; // a plain part

// THE FAMILY'S HOMOPHONE LIST. A part is a near-miss iff a word in it is here — a lookup, so
// the count is TRUE, not declared. Kept deliberately wide (KS2 homophones): a missed entry is
// exactly how "long hours" (hours/ours) and "ring out" (ring/wring) slipped past as plain.
const HOMOPHONES = new Set<string>([
  'their', 'there', 'theyre', 'hear', 'here', 'past', 'passed', 'allowed', 'aloud',
  'weather', 'whether', 'road', 'rode', 'rowed', 'knew', 'new', 'flew', 'flu', 'flue',
  'sea', 'see', 'meet', 'meat', 'whole', 'hole', 'hours', 'hour', 'ours', 'our',
  'ring', 'wring', 'right', 'write', 'rite', 'through', 'threw', 'to', 'too', 'two',
  'for', 'four', 'fore', 'by', 'buy', 'bye', 'be', 'bee', 'no', 'know', 'one', 'won',
  'son', 'sun', 'some', 'sum', 'so', 'sew', 'sow', 'week', 'weak', 'way', 'weigh',
  'made', 'maid', 'read', 'red', 'reed', 'plane', 'plain', 'would', 'wood', 'wait', 'weight',
  'break', 'brake', 'tail', 'tale', 'sail', 'sale', 'night', 'knight', 'blue', 'blew',
  'pair', 'pear', 'pare', 'peace', 'piece', 'rain', 'reign', 'rein', 'scene', 'seen',
  'sight', 'site', 'cite', 'stair', 'stare', 'steal', 'steel', 'tide', 'tied', 'toe', 'tow',
  'wear', 'where', 'which', 'witch', 'whine', 'wine', 'in', 'inn', 'mail', 'male',
  'hair', 'hare', 'bored', 'board', 'flour', 'flower', 'great', 'grate', 'guessed', 'guest',
  'heard', 'herd', 'loan', 'lone', 'none', 'nun', 'sent', 'cent', 'scent', 'cell', 'sell',
  'waist', 'waste', 'wail', 'whale', 'war', 'wore', 'yolk', 'yoke', 'your', 'youre',
  'ewe', 'eye', 'or', 'oar', 'ore', 'ate', 'eight', 'fair', 'fare',
]);
export const partHasHomophone = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => HOMOPHONES.has(w.replace(/[^a-z]/g, '')));

export interface SpotSentence { id: string; pair: string; parts: string[]; errorIndex: number; wrong: string; targetLen: number; intended: number }
// `intended` = the near-miss DISTRACTOR count this sentence is authored to carry (non-error
// parts with a homophone). A test asserts the DERIVED count equals it, so a mis-count fails CI
// instead of shipping. Error pairs are varied so a tier samples the space, not one pair.
export const HOMOPHONE_BANK: SpotSentence[] = [
  // 0 near-miss — error part homophone, the other three strictly clean.
  { id: 'h0-allowed', pair: 'allowed/aloud', parts: ['He was allowed', 'inside the hall', 'before the others', 'arrived that day'], errorIndex: 0, wrong: 'He was aloud', targetLen: 5, intended: 0 },
  { id: 'h0-hear', pair: 'hear/here', parts: ['She could hear', 'the head teacher', 'calling her name', 'after the lesson'], errorIndex: 0, wrong: 'She could here', targetLen: 4, intended: 0 },
  { id: 'h0-past', pair: 'past/passed', parts: ['We walked past', 'the science lab', 'and the library', 'that same day'], errorIndex: 0, wrong: 'We walked passed', targetLen: 6, intended: 0 },
  { id: 'h0-knew', pair: 'knew/new', parts: ['They knew the plan', 'needed more time', 'than the class', 'had expected'], errorIndex: 0, wrong: 'They new the plan', targetLen: 3, intended: 0 },
  { id: 'h0-made', pair: 'made/maid', parts: ['She made a cake', 'and iced it', 'with such care', 'that evening'], errorIndex: 0, wrong: 'She maid a cake', targetLen: 4, intended: 0 },
  { id: 'h0-won', pair: 'won/one', parts: ['The team won', 'the final match', 'after extra', 'games were played'], errorIndex: 0, wrong: 'The team one', targetLen: 3, intended: 0 },
  // 1 near-miss.
  { id: 'h1-hear', pair: 'hear/here', parts: ['She could not hear', 'the coach clearly', 'across the sea', 'that afternoon'], errorIndex: 0, wrong: 'She could not here', targetLen: 4, intended: 1 },
  { id: 'h1-rode', pair: 'rode/road', parts: ['We rode the bus', 'into the busy town', 'past the shops', 'and the park'], errorIndex: 0, wrong: 'We road the bus', targetLen: 4, intended: 1 },
  { id: 'h1-weather', pair: 'weather/whether', parts: ['They watched the weather', 'turn grey and cold', 'then packed their tents', 'away again'], errorIndex: 0, wrong: 'They watched the whether', targetLen: 7, intended: 1 },
  { id: 'h1-flew', pair: 'flew/flu', parts: ['The plane flew low', 'above the fields', 'and over the sea', 'near the cliffs'], errorIndex: 0, wrong: 'The plane flu low', targetLen: 3, intended: 1 },
  { id: 'h1-would', pair: 'would/wood', parts: ['I would like', 'a piece of cake', 'before the class', 'begins again'], errorIndex: 0, wrong: 'I wood like', targetLen: 4, intended: 1 },
  { id: 'h1-knew', pair: 'knew/new', parts: ['She knew the answer', 'right from the start', 'of the hard test', 'that morning'], errorIndex: 0, wrong: 'She new the answer', targetLen: 3, intended: 1 },
  // 2 near-miss.
  { id: 'h2-rode', pair: 'rode/road', parts: ['He rode his bike', 'past the old shops', 'to meet his friend', 'near the lake'], errorIndex: 0, wrong: 'He road his bike', targetLen: 4, intended: 2 },
  { id: 'h2-through', pair: 'through/threw', parts: ['We sailed through', 'the calm sea', 'past the tall cliffs', 'at dawn'], errorIndex: 0, wrong: 'We sailed threw', targetLen: 5, intended: 2 },
  { id: 'h2-see', pair: 'see/sea', parts: ['She could see', 'the whole field', 'from the high stair', 'above the hall'], errorIndex: 0, wrong: 'She could sea', targetLen: 3, intended: 2 },
  { id: 'h2-made', pair: 'made/maid', parts: ['They made a raft', 'from planks of wood', 'and rode the waves', 'near the shore'], errorIndex: 0, wrong: 'They maid a raft', targetLen: 4, intended: 2 },
  { id: 'h2-knight', pair: 'knight/night', parts: ['The knight rode', 'past the castle', 'near the sea', 'at dawn'], errorIndex: 0, wrong: 'The night rode', targetLen: 5, intended: 2 },
  { id: 'h2-won', pair: 'won/one', parts: ['She won the race', 'at record speed', 'by a whole', 'second or more'], errorIndex: 0, wrong: 'She one the race', targetLen: 3, intended: 2 },
  // 3 near-miss — every other part a trap.
  { id: 'h3-see', pair: 'see/sea', parts: ['She knew', 'the sea was', 'too rough', 'to sail'], errorIndex: 1, wrong: 'the see was', targetLen: 3, intended: 3 },
  { id: 'h3-past', pair: 'past/passed', parts: ['We rode', 'past the beach', 'to meet', 'the whole class'], errorIndex: 1, wrong: 'passed the beach', targetLen: 6, intended: 3 },
  { id: 'h3-ring', pair: 'ring/wring', parts: ['He heard', 'the great bells', 'ring out', 'right through town'], errorIndex: 2, wrong: 'wring out', targetLen: 4, intended: 3 },
  { id: 'h3-would', pair: 'would/wood', parts: ['I would', 'buy a pair', 'of blue boots', 'this week'], errorIndex: 0, wrong: 'I wood', targetLen: 4, intended: 3 },
  { id: 'h3-flew', pair: 'flew/flu', parts: ['They flew', 'through the night', 'past two peaks', 'by the sea'], errorIndex: 0, wrong: 'They flu', targetLen: 3, intended: 3 },
  { id: 'h3-made', pair: 'made/maid', parts: ['We made', 'a plain cake', 'for the fair', 'last week'], errorIndex: 0, wrong: 'We maid', targetLen: 4, intended: 3 },
];

// The ladder is NEAR-MISS PROXIMITY, and only that (annie, 2026-08-08): near-miss count is
// visible in the single item a child meets, so it carries the tiers on its own — T1 0, T2 1,
// T3 2, T4 3. N-keying is NOT a tier dial ("sometimes/often" are tier properties a child never
// meets, which would collapse T1 and T2); it is a SERVING-DISTRIBUTION property applied at RUNG
// MINUS ONE, so an N-keyed item — whose un-errored slot is itself a near-miss — lands on its
// tier's true count, and never at T1 (rung-1 = -1 there).
const HOMOPHONE_N_RATE = 0.2; // serving profile, not a tier parameter
function homophoneNm(tier: Tier): number {
  return ({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 } as const)[tier];
}
/** DERIVED near-miss distractor count for an error item (non-error parts with a homophone). */
export function nonErrorNearMiss(s: SpotSentence): number {
  return s.parts.filter((p, i) => i !== s.errorIndex && partHasHomophone(p)).length;
}
const HOMOPHONES_V2: SpagFamily = {
  id: 'spag-spell-homophone-by-sound',
  name: 'Homophones',
  subtype: 'spelling',
  franchise: 'en-homophone-by-sound',
  tierRule: (t) => (([1, 2, 3, 4] as Tier[]).includes(t) ? `Homophones — one sentence in four parts, spot the wrong-sound spelling; ${homophoneNm(t)} of the correct parts is a near-miss trap${homophoneNm(t) === 1 ? '' : 's'}.` : ''),
  structuralParams: (t) => ({ nearMissParts: homophoneNm(t) }),
  numberRanges: (t) => ({ letters: [3, 7], segments: [4, 4], nearMissParts: [homophoneNm(t), homophoneNm(t)] }),
  draft: (tier, r): SpagItemDraft => {
    const rung = homophoneNm(tier);
    const wantN = rung >= 1 && r() < HOMOPHONE_N_RATE; // N at rung-1; excluded at T1 automatically
    const target = wantN ? rung - 1 : rung;
    const s = randPick(r, HOMOPHONE_BANK.filter((x) => nonErrorNearMiss(x) === target));
    const opts: SpagOption[] = [];
    let nearMiss: number;
    if (wantN) {
      // No error: the un-errored slot still carries its homophone, so it is a near-miss too,
      // taking the item to `rung`. Every trap is live and the answer is still "No mistake".
      s.parts.forEach((p) => opts.push({ value: p, isKey: false, misconceptionId: partHasHomophone(p) ? SPOT_RULE_OVER_APPLIED : SPOT_GUESSED }));
      opts.push({ value: 'No mistake', isKey: true });
      nearMiss = s.parts.filter(partHasHomophone).length;
    } else {
      s.parts.forEach((p, i) => opts.push(i === s.errorIndex ? { value: s.wrong, isKey: true } : { value: p, isKey: false, misconceptionId: partHasHomophone(p) ? SPOT_RULE_OVER_APPLIED : SPOT_GUESSED }));
      opts.push({ value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' });
      nearMiss = nonErrorNearMiss(s);
    }
    return { stem: SPELL_STEM, options: opts, params: { letters: s.targetLen, segments: 4, nearMissParts: nearMiss }, dedupKey: s.id, diversityKey: s.pair };
  },
};

// ---------------------------------------------------------------------------------------
// SHARED R13 ERROR-SPOT FACTORY. Homophones proved the shape; this is that shape made reusable
// so R13's six rules are enforced ONCE for every error-spot family (spelling + punctuation):
//   · near-miss DERIVED from the family's own lookup and VERIFIED by the range gate (rule 4);
//   · the false-positive split — near-miss → rule-over-applied, plain → guessed (rule 1);
//   · one coherent sentence, parts in order (rule 2);
//   · near-miss proximity carries the ladder 0..n (rule 3), N-keying at RUNG-1 (excludes T1);
//   · dedup by sentence + pair/class share cap at sample time (rule 5, in generateSpagSample).
// A family supplies only its stem, its near-miss LOOKUP, and its verified bank. Homophones
// stays hand-written (signed 2026-08-08) so its bytes are untouched; new families use this.
export interface EsSentence { id: string; klass: string; parts: string[]; errorIndex: number; wrong: string; intended: number }
export function esNonErrorNearMiss(s: EsSentence, nearMiss: (p: string) => boolean): number {
  return s.parts.filter((p, i) => i !== s.errorIndex && nearMiss(p)).length;
}
interface EsConfig {
  id: string; name: string; subtype: 'spelling' | 'punctuation'; franchise: string; stem: string;
  nm: (tier: Tier) => number; tiers: Tier[]; bank: EsSentence[]; nearMiss: (part: string) => boolean; nRate?: number;
}
function errorSpotFamily(cfg: EsConfig): SpagFamily {
  const nRate = cfg.nRate ?? 0.2;
  const trap = (p: string): string => (cfg.nearMiss(p) ? SPOT_RULE_OVER_APPLIED : SPOT_GUESSED);
  return {
    id: cfg.id,
    name: cfg.name,
    subtype: cfg.subtype,
    franchise: cfg.franchise,
    tierRule: (t) => (cfg.tiers.includes(t) ? `${cfg.name} — one sentence in four parts, spot the slip; ${cfg.nm(t)} of the correct parts is a near-miss trap${cfg.nm(t) === 1 ? '' : 's'}.` : ''),
    structuralParams: (t) => ({ nearMissParts: cfg.nm(t) }),
    numberRanges: (t) => ({ segments: [4, 4], nearMissParts: [cfg.nm(t), cfg.nm(t)] }),
    draft: (tier, r): SpagItemDraft => {
      const rung = cfg.nm(tier);
      const wantN = rung >= 1 && r() < nRate;
      const target = wantN ? rung - 1 : rung;
      const s = randPick(r, cfg.bank.filter((x) => esNonErrorNearMiss(x, cfg.nearMiss) === target));
      const opts: SpagOption[] = [];
      let nearMiss: number;
      if (wantN) {
        s.parts.forEach((p) => opts.push({ value: p, isKey: false, misconceptionId: trap(p) }));
        opts.push({ value: 'No mistake', isKey: true });
        nearMiss = s.parts.filter(cfg.nearMiss).length;
      } else {
        s.parts.forEach((p, i) => opts.push(i === s.errorIndex ? { value: s.wrong, isKey: true } : { value: p, isKey: false, misconceptionId: trap(p) }));
        opts.push({ value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' });
        nearMiss = esNonErrorNearMiss(s, cfg.nearMiss);
      }
      return { stem: cfg.stem, options: opts, params: { segments: 4, nearMissParts: nearMiss }, dedupKey: s.id, diversityKey: s.klass };
    },
  };
}

// The 0/1/2/3 near-miss ladder every error-spot family shares (T4 ceiling; T5 out of scope).
const esNm = (tier: Tier): number => ({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 } as const)[tier];

// DOUBLE-CONSONANT BOUNDARY — proving R13 generalises to a second franchise with its own
// lookup. Near-miss = a part carrying a correctly-DOUBLED word a shaky child might flag.
const NEAR_DOUBLE = new Set<string>([
  'dinner', 'summer', 'running', 'swimming', 'better', 'letter', 'happy', 'sunny', 'funny',
  'hobby', 'rabbit', 'message', 'address', 'suddenly', 'different', 'difficult', 'appear',
  'arrive', 'collect', 'comment', 'connect', 'correct', 'apple', 'little', 'bottle', 'kettle',
  'middle', 'puddle', 'ribbon', 'ladder', 'hammer', 'mirror', 'arrow', 'borrow', 'narrow',
  'pillow', 'yellow', 'follow', 'traffic', 'bigger', 'hotter', 'hidden', 'sudden', 'common',
  'lesson', 'tennis', 'carrot', 'butter', 'cotton', 'kitten', 'berry', 'cherry', 'sorry',
]);
const partHasDouble = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => NEAR_DOUBLE.has(w.replace(/[^a-z]/g, '')));
const DOUBLE_BANK: EsSentence[] = [
  // 0 near-miss.
  { id: 'd0-disappointed', klass: 'disappointed', parts: ['Jonah was dissapointed', 'with his own score', 'yet he clapped', 'for the winner'], errorIndex: 0, wrong: 'Jonah was dissapointed', intended: 0 },
  { id: 'd0-beginning', klass: 'beginning', parts: ['At the begining', 'of the new term', 'the class chose', 'a fresh topic'], errorIndex: 0, wrong: 'At the begining', intended: 0 },
  { id: 'd0-embarrass', klass: 'embarrassing', parts: ['She found the mix-up', 'quite embarassing', 'but soon', 'laughed about it'], errorIndex: 1, wrong: 'quite embarassing', intended: 0 },
  { id: 'd0-recommend', klass: 'recommended', parts: ['The teacher recomended', 'a longer novel', 'about a brave', 'young explorer'], errorIndex: 0, wrong: 'The teacher recomended', intended: 0 },
  { id: 'd0-necessary', klass: 'necessary', parts: ['It was not necesary', 'to bring a pen', 'as the school', 'gave one out'], errorIndex: 0, wrong: 'It was not necesary', intended: 0 },
  { id: 'd0-tomorrow', klass: 'tomorrow', parts: ['We leave tomorow', 'for the coast', 'and hope', 'the sky stays clear'], errorIndex: 0, wrong: 'We leave tomorow', intended: 0 },
  // 1 near-miss.
  { id: 'd1-success', klass: 'success', parts: ['The play was a sucess', 'so the happy cast', 'took a bow', 'on the stage'], errorIndex: 0, wrong: 'The play was a sucess', intended: 1 },
  { id: 'd1-professional', klass: 'professional', parts: ['A profesional coach', 'ran the summer camp', 'for the whole', 'of the week'], errorIndex: 0, wrong: 'A profesional coach', intended: 1 },
  { id: 'd1-committed', klass: 'committed', parts: ['She was comitted', 'to her hobby', 'and practised', 'each afternoon'], errorIndex: 0, wrong: 'She was comitted', intended: 1 },
  { id: 'd1-address', klass: 'address', parts: ['He wrote the adress', 'on a yellow card', 'and posted it', 'that same day'], errorIndex: 0, wrong: 'He wrote the adress', intended: 1 },
  { id: 'd1-different', klass: 'different', parts: ['The twins chose', 'diferent hobbies', 'and rarely', 'agreed on little'], errorIndex: 1, wrong: 'diferent hobbies', intended: 1 },
  { id: 'd1-occasion', klass: 'occasion', parts: ['It was a happy', 'occassion for all', 'and the hall', 'was packed'], errorIndex: 1, wrong: 'occassion for all', intended: 1 },
  // 2 near-miss.
  { id: 'd2-accommodate', klass: 'accommodate', parts: ['The little inn', 'could not acommodate', 'the summer', 'crowds at all'], errorIndex: 1, wrong: 'could not acommodate', intended: 2 },
  { id: 'd2-beginning', klass: 'beginning', parts: ['The summer dinner', 'was a happy begining', 'to a sunny', 'and busy week'], errorIndex: 1, wrong: 'was a happy begining', intended: 2 },
  { id: 'd2-disappear', klass: 'disappear', parts: ['The rabbit seemed', 'to disapear', 'behind the yellow', 'garden shed'], errorIndex: 1, wrong: 'to disapear', intended: 2 },
  { id: 'd2-success', klass: 'success', parts: ['Her funny comment', 'was a sucess', 'and the common', 'mood lifted'], errorIndex: 1, wrong: 'was a sucess', intended: 2 },
  { id: 'd2-embarrass', klass: 'embarrassing', parts: ['The sudden noise', 'was embarassing', 'in the middle', 'of the class'], errorIndex: 1, wrong: 'was embarassing', intended: 2 },
  { id: 'd2-recommend', klass: 'recommended', parts: ['A better guide', 'recomended the arrow', 'trail past', 'the narrow gate'], errorIndex: 1, wrong: 'recomended the arrow', intended: 2 },
  // 3 near-miss.
  { id: 'd3-success', klass: 'success', parts: ['The summer dinner', 'was a sucess', 'with a happy', 'common table'], errorIndex: 1, wrong: 'was a sucess', intended: 3 },
  { id: 'd3-different', klass: 'different', parts: ['The little rabbit', 'chose a diferent', 'yellow apple', 'in the middle'], errorIndex: 1, wrong: 'chose a diferent', intended: 3 },
  { id: 'd3-beginning', klass: 'beginning', parts: ['A sunny begining', 'to the summer', 'brought better', 'traffic and hobby'], errorIndex: 0, wrong: 'A sunny begining', intended: 3 },
  { id: 'd3-tomorrow', klass: 'tomorrow', parts: ['The dinner is tomorow', 'in the common', 'hall with butter', 'and yellow cherry'], errorIndex: 0, wrong: 'The dinner is tomorow', intended: 3 },
  { id: 'd3-address', klass: 'address', parts: ['The adress on', 'the yellow letter', 'named a little', 'summer cottage'], errorIndex: 0, wrong: 'The adress on', intended: 3 },
  { id: 'd3-occasion', klass: 'occasion', parts: ['A happy occassion', 'brought butter', 'and cherry', 'to every dinner'], errorIndex: 0, wrong: 'A happy occassion', intended: 3 },
];
const DOUBLE_CONSONANT_V2 = errorSpotFamily({
  id: 'spag-spell-double-consonant-boundary', name: 'Double letters', subtype: 'spelling',
  franchise: 'en-double-consonant-boundary', stem: SPELL_STEM, nm: esNm, tiers: [1, 2, 3, 4],
  bank: DOUBLE_BANK, nearMiss: partHasDouble,
});
export { DOUBLE_BANK, partHasDouble };

// ---------------------------------------------------------------------------------------
// THE ELEVEN
// ---------------------------------------------------------------------------------------
export const SPAG_FAMILIES: SpagFamily[] = [
  // Spelling (4) — homophones REBUILT (annie 2026-08-08); the other three await the same pass.
  HOMOPHONES_V2,
  DOUBLE_CONSONANT_V2,
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
