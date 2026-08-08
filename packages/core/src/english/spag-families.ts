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
export interface EsSentence {
  id: string; klass: string; parts: string[]; errorIndex: number; wrong: string; intended: number;
  /** Contraction only (annie 2026-08-08): the indices of NON-error parts whose set-member is the
   *  CORRECT form for THIS sentence — a reviewed per-sentence judgement, because a contraction trap
   *  word can be genuinely wrong (`they're` with no plural referent), which a word-list lookup
   *  cannot catch. A CI test asserts this equals the parts the lookup flags, so no set-member in a
   *  clean part ships unreviewed. */
  nmVerified?: number[];
}
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
      return { stem: cfg.stem, options: opts, params: { segments: 4, nearMissParts: nearMiss }, dedupKey: s.id, diversityKey: s.klass, errorTokenKey: wantN ? undefined : s.klass };
    },
  };
}

// The 0/1/2/3 near-miss ladder every error-spot family shares (T4 ceiling; T5 out of scope).
const esNm = (tier: Tier): number => ({ 1: 0, 2: 1, 3: 2, 4: 3, 5: 3 } as const)[tier];

// DOUBLE-CONSONANT BOUNDARY. Near-miss is NOT "any doubled consonant" — the regex was
// over-inclusive (happens, summer, grassy pose no decision). The trap is where the double is
// UNCERTAIN: a prefix/suffix boundary, or an INERT double not predicted by the vowel (removing it
// wouldn't change the sound — necessary, embarrass). Realised as a reviewed pool of recognisable
// such words (annie 2026-08-08); audible short-vowel doubles (summer, little) are OUT. Traps only
// need to be RECOGNISABLE, so the pool is wide; KEYS are restricted to child-USED words (below).
const DOUBLE_POOL = new Set<string>([
  'necessary', 'embarrass', 'accommodate', 'occur', 'occurred', 'occurrence', 'commit', 'committee',
  'committed', 'professional', 'assess', 'assessment', 'difficult', 'difficulty', 'disappoint',
  'disappointed', 'recommend', 'recommended', 'begin', 'beginning', 'travel', 'travelling',
  'immediate', 'immediately', 'occasion', 'occasionally', 'address', 'success', 'successful',
  'tomorrow', 'possess', 'possession', 'exaggerate', 'parallel', 'apparent', 'appropriate',
  'aggressive', 'arrange', 'arrangement', 'appear', 'disappear', 'appreciate', 'associate',
  'correspond', 'interrupt', 'opposite', 'support', 'suppose', 'surround', 'different', 'suddenly',
]);
export const partHasDouble = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => DOUBLE_POOL.has(w.replace(/[^a-z]/g, '')));
export const DOUBLE_BANK: EsSentence[] = [
  // 4 per rung (16), keys restricted to child-USED words; traps from the wider recognisable pool.
  // 0 near-miss — error part CORRECTED; no other pool word.
  { id: 'd0-beginning', klass: 'beginning', parts: ['At the beginning', 'of the day', 'we made', 'a plan'], errorIndex: 0, wrong: 'At the begining', intended: 0 },
  { id: 'd0-tomorrow', klass: 'tomorrow', parts: ['We leave tomorrow', 'for the coast', 'and hope', 'for sun'], errorIndex: 0, wrong: 'We leave tomorow', intended: 0 },
  { id: 'd0-address', klass: 'address', parts: ['She wrote the address', 'on a card', 'and sent', 'it off'], errorIndex: 0, wrong: 'She wrote the adress', intended: 0 },
  { id: 'd0-success', klass: 'success', parts: ['It was a success', 'from the start', 'and all', 'felt glad'], errorIndex: 0, wrong: 'It was a sucess', intended: 0 },
  // 1 near-miss — one other part carries a pool word.
  { id: 'd1-difficulty', klass: 'difficulty', parts: ['The difficulty grew', 'with each address', 'she wrote', 'that day'], errorIndex: 0, wrong: 'The dificulty grew', intended: 1 },
  { id: 'd1-disappoint', klass: 'disappoint', parts: ['They did not disappoint', 'the beginning class', 'then went', 'back home'], errorIndex: 0, wrong: 'They did not disapoint', intended: 1 },
  { id: 'd1-recommend', klass: 'recommend', parts: ['I would recommend', 'the new address', 'to any', 'keen reader'], errorIndex: 0, wrong: 'I would recomend', intended: 1 },
  { id: 'd1-possess', klass: 'possess', parts: ['They possess', 'a fine success', 'in every', 'small way'], errorIndex: 0, wrong: 'They posess', intended: 1 },
  // 2 near-miss.
  { id: 'd2-necessary', klass: 'necessary', parts: ['A pass is necessary', 'for the address', 'and the success', 'of the trip'], errorIndex: 0, wrong: 'A pass is necesary', intended: 2 },
  { id: 'd2-embarrass', klass: 'embarrass', parts: ['It would embarrass', 'the beginning class', 'and the address', 'was read out'], errorIndex: 0, wrong: 'It would embarass', intended: 2 },
  { id: 'd2-occurred', klass: 'occurred', parts: ['The change occurred', 'after the success', 'and the difficulty', 'was clear'], errorIndex: 0, wrong: 'The change occured', intended: 2 },
  { id: 'd2-immediately', klass: 'immediately', parts: ['She left immediately', 'past the beginning', 'of the address', 'and ran'], errorIndex: 0, wrong: 'She left immediatly', intended: 2 },
  // 3 near-miss — natural shape, no list; traps drawn wide from the pool.
  { id: 'd3-different', klass: 'different', parts: ['A different result', 'pleased the committee', 'despite the difficulty', 'of the address'], errorIndex: 0, wrong: 'A diferent result', intended: 3 },
  { id: 'd3-suddenly', klass: 'suddenly', parts: ['Suddenly it changed', 'across the committee', 'despite the difficulty', 'of the occasion'], errorIndex: 0, wrong: 'Sudenly it changed', intended: 3 },
  { id: 'd3-travelling', klass: 'travelling', parts: ['Travelling improved', 'with a professional', 'despite the difficulty', 'of the address'], errorIndex: 0, wrong: 'Traveling improved', intended: 3 },
  { id: 'd3-occasionally', klass: 'occasionally', parts: ['Occasionally it helps', 'to appear professional', 'beyond the difficulty', 'of the success'], errorIndex: 0, wrong: 'Ocasionally it helps', intended: 3 },
];
const DOUBLE_CONSONANT_V2 = errorSpotFamily({
  id: 'spag-spell-double-consonant-boundary', name: 'Double letters', subtype: 'spelling',
  franchise: 'en-double-consonant-boundary', stem: SPELL_STEM, nm: esNm, tiers: [1, 2, 3, 4],
  bank: DOUBLE_BANK, nearMiss: partHasDouble,
});

// UNSTRESSED SUFFIX VOWEL — near-miss = a part with a correctly-spelled word ending in the
// ambiguous unstressed suffix a child mis-vowels (-ent/-ant, -ence/-ance, -able/-ible).
export const partHasSuffix = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => {
    const c = w.replace(/[^a-z]/g, '');
    return c.length >= 6 && /(?:ent|ant|ence|ance|able|ible|ary|ery|ory)$/.test(c);
  });
export const SUFFIX_BANK: EsSentence[] = [
  // 0 near-miss — error part CORRECTED; the other three carry no ambiguous suffix. 24 distinct keys.
  { id: 'su0-important', klass: 'important', parts: ['He made an important', 'choice last night', 'and told', 'no one'], errorIndex: 0, wrong: 'He made an importent', intended: 0 },
  { id: 'su0-different', klass: 'different', parts: ['She chose a different', 'path this time', 'and walked', 'back home'], errorIndex: 0, wrong: 'She chose a differant', intended: 0 },
  { id: 'su0-silent', klass: 'silent', parts: ['The silent room', 'felt cold', 'so we', 'left quickly'], errorIndex: 0, wrong: 'The silant room', intended: 0 },
  { id: 'su0-present', klass: 'present', parts: ['He gave a present', 'to his mum', 'on her', 'big day'], errorIndex: 0, wrong: 'He gave a presant', intended: 0 },
  { id: 'su0-distant', klass: 'distant', parts: ['A distant sound', 'woke the dog', 'but it', 'soon slept'], errorIndex: 0, wrong: 'A distent sound', intended: 0 },
  { id: 'su0-absent', klass: 'absent', parts: ['She was absent', 'on Monday', 'with a', 'bad cold'], errorIndex: 0, wrong: 'She was absant', intended: 0 },
  // 1.
  { id: 'su1-obedient', klass: 'obedient', parts: ['The obedient dog', 'sat silent', 'by the', 'front door'], errorIndex: 0, wrong: 'The obediant dog', intended: 1 },
  { id: 'su1-relevant', klass: 'relevant', parts: ['She found the relevant', 'page quickly', 'and read', 'one moment'], errorIndex: 0, wrong: 'She found the relevent', intended: 1 },
  { id: 'su1-assistant', klass: 'assistant', parts: ['The assistant gave', 'a patient smile', 'then turned', 'away'], errorIndex: 0, wrong: 'The assistent gave', intended: 1 },
  { id: 'su1-independent', klass: 'independent', parts: ['They felt independent', 'and confident', 'walking', 'to school'], errorIndex: 0, wrong: 'They felt independant', intended: 1 },
  { id: 'su1-excellent', klass: 'excellent', parts: ['She wrote an excellent', 'opening sentence', 'then paused', 'a while'], errorIndex: 0, wrong: 'She wrote an excellant', intended: 1 },
  { id: 'su1-permanent', klass: 'permanent', parts: ['He left a permanent', 'mark on', 'the present', 'wooden desk'], errorIndex: 0, wrong: 'He left a permanant', intended: 1 },
  // 2.
  { id: 'su2-apparent', klass: 'apparent', parts: ['It was apparent', 'the patient team', 'gave a different', 'quiet look'], errorIndex: 0, wrong: 'It was apparant', intended: 2 },
  { id: 'su2-brilliant', klass: 'brilliant', parts: ['A brilliant idea', 'filled the silent', 'important room', 'at once'], errorIndex: 0, wrong: 'A brillient idea', intended: 2 },
  { id: 'su2-necessary', klass: 'necessary', parts: ['The necessary form', 'named a distant', 'and different', 'small town'], errorIndex: 0, wrong: 'The necessery form', intended: 2 },
  { id: 'su2-ordinary', klass: 'ordinary', parts: ['An ordinary day', 'brought a present', 'and a pleasant', 'warm meal'], errorIndex: 0, wrong: 'An ordinery day', intended: 2 },
  { id: 'su2-library', klass: 'library', parts: ['The library kept', 'an ancient sentence', 'and a distant', 'stone shelf'], errorIndex: 0, wrong: 'The librery kept', intended: 2 },
  { id: 'su2-memory', klass: 'memory', parts: ['A memory of', 'the patient crowd', 'and the distant', 'city lights'], errorIndex: 0, wrong: 'A memery of', intended: 2 },
  // 3 — a normal sentence where three of the four parts carry an ambiguous suffix.
  { id: 'su3-victory', klass: 'victory', parts: ['The victory went', 'to the patient team', 'after a different', 'final moment'], errorIndex: 0, wrong: 'The victery went', intended: 3 },
  { id: 'su3-factory', klass: 'factory', parts: ['The factory made', 'a brilliant toy', 'a different game', 'and elegant art'], errorIndex: 0, wrong: 'The factary made', intended: 3 },
  { id: 'su3-category', klass: 'category', parts: ['Each category held', 'a different item', 'an elegant label', 'and silent code'], errorIndex: 0, wrong: 'Each categery held', intended: 3 },
  { id: 'su3-distance', klass: 'distance', parts: ['The distance felt', 'important and long', 'to the patient', 'silent crowd'], errorIndex: 0, wrong: 'The distence felt', intended: 3 },
  { id: 'su3-entrance', klass: 'entrance', parts: ['The entrance led', 'to a pleasant', 'and elegant', 'silent hall'], errorIndex: 0, wrong: 'The entrence led', intended: 3 },
  { id: 'su3-sentence', klass: 'sentence', parts: ['The sentence named', 'a distant parent', 'a patient child', 'and silent dog'], errorIndex: 0, wrong: 'The sentance named', intended: 3 },
];
const UNSTRESSED_V2 = errorSpotFamily({
  id: 'spag-spell-unstressed-suffix-vowel', name: 'Unstressed suffix vowel', subtype: 'spelling',
  franchise: 'en-unstressed-suffix-vowel', stem: SPELL_STEM, nm: esNm, tiers: [1, 2, 3, 4],
  bank: SUFFIX_BANK, nearMiss: partHasSuffix,
});

// SILENT LETTER DROPPED — near-miss = membership in the REVIEWED 36-word KS2 silent-letter list
// (annie, 2026-08-08). No generative rule exists — silent gh is in both `knight` and `right`, so
// the criterion "do children omit it" is empirical, a fact about children, not the word. Hence a
// reviewed list, and it says so. Automatic patterns (right/light/walk/would) and rejected proposals
// (climb/numb — automatic final-b; ghost — stored whole; biscuit — a ui-digraph) are OUT.
const SILENT_LIST = new Set<string>([
  // seed 26
  'knight', 'knee', 'knife', 'know', 'wrist', 'write', 'wrong', 'lamb', 'comb', 'thumb', 'island',
  'honest', 'hour', 'castle', 'listen', 'muscle', 'doubt', 'debt', 'science', 'scissors', 'gnaw',
  'rhythm', 'whistle', 'half', 'calf', 'salmon',
  // added 10 (ratified)
  'knock', 'gnome', 'wren', 'crumb', 'plumber', 'fasten', 'autumn', 'column', 'sword', 'tongue',
]);
export const partHasSilent = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => SILENT_LIST.has(w.replace(/[^a-z]/g, '')));
export const SILENT_BANK: EsSentence[] = [
  // 0 near-miss — error part CORRECTED; no other silent-list word. 24 distinct keys.
  { id: 'sl0-knife', klass: 'knife', parts: ['He held the knife', 'by its handle', 'and cut', 'the ripe pear'], errorIndex: 0, wrong: 'He held the nife', intended: 0 },
  { id: 'sl0-wrist', klass: 'wrist', parts: ['She hurt her wrist', 'in the match', 'but played', 'to the end'], errorIndex: 0, wrong: 'She hurt her rist', intended: 0 },
  { id: 'sl0-doubt', klass: 'doubt', parts: ['There was no doubt', 'in her mind', 'about the', 'best plan'], errorIndex: 0, wrong: 'There was no dout', intended: 0 },
  { id: 'sl0-island', klass: 'island', parts: ['The island lay', 'far out', 'beyond the', 'grey bay'], errorIndex: 0, wrong: 'The iland lay', intended: 0 },
  { id: 'sl0-honest', klass: 'honest', parts: ['She gave an honest', 'and clear reply', 'to every', 'tricky part'], errorIndex: 0, wrong: 'She gave an onest', intended: 0 },
  { id: 'sl0-science', klass: 'science', parts: ['The science test', 'felt hard', 'so she', 'read it twice'], errorIndex: 0, wrong: 'The sience test', intended: 0 },
  // 1 near-miss — one other part carries a silent-list word (a different group).
  { id: 'sl1-knee', klass: 'knee', parts: ['She hurt her knee', 'near the castle', 'last', 'cold day'], errorIndex: 0, wrong: 'She hurt her nee', intended: 1 },
  { id: 'sl1-thumb', klass: 'thumb', parts: ['He cut his thumb', 'on the sword', 'then washed', 'the deep cut'], errorIndex: 0, wrong: 'He cut his thum', intended: 1 },
  { id: 'sl1-castle', klass: 'castle', parts: ['The castle stood', 'beside an island', 'on a', 'windy hill'], errorIndex: 0, wrong: 'The casle stood', intended: 1 },
  { id: 'sl1-listen', klass: 'listen', parts: ['We stopped to listen', 'for the whistle', 'across the', 'wide field'], errorIndex: 0, wrong: 'We stopped to lisen', intended: 1 },
  { id: 'sl1-autumn', klass: 'autumn', parts: ['In autumn the', 'tall column', 'stood grey', 'and bare'], errorIndex: 0, wrong: 'In autum the', intended: 1 },
  { id: 'sl1-column', klass: 'column', parts: ['The stone column', 'held an honest', 'plain badge', 'for years'], errorIndex: 0, wrong: 'The stone colum', intended: 1 },
  // 2 near-miss — two other parts, two different groups; third part clean.
  { id: 'sl2-comb', klass: 'comb', parts: ['He found the comb', 'beside the knife', 'and the honest', 'old note'], errorIndex: 0, wrong: 'He found the com', intended: 2 },
  { id: 'sl2-wrong', klass: 'wrong', parts: ['She got it wrong', 'about the island', 'and the castle', 'last week'], errorIndex: 0, wrong: 'She got it rong', intended: 2 },
  { id: 'sl2-muscle', klass: 'muscle', parts: ['He pulled a muscle', 'near his wrist', 'and his knee', 'one cold night'], errorIndex: 0, wrong: 'He pulled a musle', intended: 2 },
  { id: 'sl2-whistle', klass: 'whistle', parts: ['The whistle blew', 'past the castle', 'and the island', 'far away'], errorIndex: 0, wrong: 'The wisle blew', intended: 2 },
  { id: 'sl2-sword', klass: 'sword', parts: ['The sword hung', 'above the comb', 'and the honest', 'plain shield'], errorIndex: 0, wrong: 'The sord hung', intended: 2 },
  { id: 'sl2-tongue', klass: 'tongue', parts: ['She held her tongue', 'near the knight', 'and the wren', 'sang on'], errorIndex: 0, wrong: 'She held her tonge', intended: 2 },
  // 3 near-miss — three different groups, natural shape, no list.
  { id: 'sl3-knock', klass: 'knock', parts: ['A knock came', 'from the castle', 'beyond the island', 'in cold autumn'], errorIndex: 0, wrong: 'A nock came', intended: 3 },
  { id: 'sl3-crumb', klass: 'crumb', parts: ['A crumb dropped', 'onto the honest', 'science notes', 'near the castle'], errorIndex: 0, wrong: 'A crum dropped', intended: 3 },
  { id: 'sl3-gnome', klass: 'gnome', parts: ['The gnome sat', 'beside the castle', 'near the island', 'in cold autumn'], errorIndex: 0, wrong: 'The nome sat', intended: 3 },
  { id: 'sl3-salmon', klass: 'salmon', parts: ['The salmon swam', 'past the island', 'beneath the castle', 'one grey autumn'], errorIndex: 0, wrong: 'The samon swam', intended: 3 },
  { id: 'sl3-rhythm', klass: 'rhythm', parts: ['The rhythm carried', 'across the island', 'over the castle', 'to a wren'], errorIndex: 0, wrong: 'The rythm carried', intended: 3 },
  { id: 'sl3-scissors', klass: 'scissors', parts: ['The scissors lay', 'beside the comb', 'near the island', 'in cold autumn'], errorIndex: 0, wrong: 'The sissors lay', intended: 3 },
];
const SILENT_V2 = errorSpotFamily({
  id: 'spag-spell-silent-letter-dropped', name: 'Silent letters', subtype: 'spelling',
  franchise: 'en-silent-letter-dropped', stem: SPELL_STEM, nm: esNm, tiers: [1, 2, 3, 4],
  bank: SILENT_BANK, nearMiss: partHasSilent,
});

// ---------------------------------------------------------------------------------------
// APOSTROPHE — CONTRACTION (spot-the-mistake, annie 2026-08-08). its/it's, they're/their/there,
// you're/your, we're/were, who's/whose — UNARGUABLE (one form right, one wrong). Runs on the
// error-spot factory exactly like a spelling franchise: trap = a part with a contraction-set word
// (either form), a reviewed word LIST (the fourth no-rule case). Apostrophes are stripped in the
// lookup, so `it's` and `its` both normalise to `its` and both count.
// ---------------------------------------------------------------------------------------
const PUNCT_SPOT_STEM = 'Read the sentence. One part has a punctuation mistake. Which part is it? If every part is right, choose N.';
const CONTRACTIONS = new Set<string>(['its', 'theyre', 'their', 'there', 'youre', 'your', 'were', 'whos', 'whose']);
export const partHasContraction = (part: string): boolean =>
  part.toLowerCase().split(/\s+/).some((w) => CONTRACTIONS.has(w.replace(/[^a-z]/g, '')));
export const CONTRACTION_BANK: EsSentence[] = [
  // 0 near-miss — error part CORRECTED; the other three carry no contraction word. Distinct keys.
  { id: 'ct0-its', klass: "it's", parts: ["It's very cold", 'in the old', 'school hall', 'this week'], errorIndex: 0, wrong: 'Its very cold', intended: 0, nmVerified: [] },
  { id: 'ct0-your', klass: 'your', parts: ['Your new book', 'is on the', 'wooden desk', 'by the shelf'], errorIndex: 0, wrong: "You're new book", intended: 0, nmVerified: [] },
  { id: 'ct0-whos', klass: "who's", parts: ["Who's coming", 'to the big', 'match', 'this Saturday'], errorIndex: 0, wrong: 'Whose coming', intended: 0, nmVerified: [] },
  { id: 'ct0-their', klass: 'their', parts: ['Their coats', 'hung on the', 'pegs', 'all day'], errorIndex: 0, wrong: 'There coats', intended: 0, nmVerified: [] },
  // 1 near-miss — one other part carries a contraction word, CORRECT for the sentence (referent present).
  { id: 'ct1-itsposs', klass: 'its', parts: ['The dog chased its ball', 'near the children', 'in the park', "while they're cheering"], errorIndex: 0, wrong: "The dog chased it's ball", intended: 1, nmVerified: [3] }, // they're → the children (plural)
  { id: 'ct1-theyre', klass: "they're", parts: ["They're going out", 'to play', 'in your garden', 'after lunch'], errorIndex: 0, wrong: 'Their going out', intended: 1, nmVerified: [2] }, // your → garden
  { id: 'ct1-youre', klass: "you're", parts: ["You're very kind", 'to lend', 'me your pen', 'today'], errorIndex: 0, wrong: 'Your very kind', intended: 1, nmVerified: [2] }, // your → pen
  { id: 'ct1-were', klass: "we're", parts: ["We're leaving now", 'before it', 'gets dark', 'over there'], errorIndex: 0, wrong: 'Were leaving now', intended: 1, nmVerified: [3] }, // there → locative
  // 2 near-miss — two other parts carry contraction words, each CORRECT for the sentence.
  { id: 'ct2-there', klass: 'there', parts: ['There are three children', 'playing with their ball', 'in your garden', 'right now'], errorIndex: 0, wrong: 'Their are three children', intended: 2, nmVerified: [1, 2] }, // key there→their (a real KS2 slip: "their are"); their → the children; your → garden
  { id: 'ct2-wereverb', klass: 'were', parts: ['The girls were happy', "when you're kind", 'and their friends', 'cheer loudly'], errorIndex: 0, wrong: "The girls we're happy", intended: 2, nmVerified: [1, 2] }, // you're → you are; their → the girls
  { id: 'ct2-whose', klass: 'whose', parts: ['Whose turn is it', 'now the girls', 'are sharing their books', 'near your desk'], errorIndex: 0, wrong: "Who's turn is it", intended: 2, nmVerified: [2, 3] }, // their → the girls; your → desk
];
const CONTRACTION_V2 = errorSpotFamily({
  id: 'spag-punct-apostrophe-contraction', name: 'Apostrophes (contraction)', subtype: 'punctuation',
  franchise: 'en-apostrophe-contraction', stem: PUNCT_SPOT_STEM, nm: esNm, tiers: [1, 2, 3],
  bank: CONTRACTION_BANK, nearMiss: partHasContraction,
});

// ---------------------------------------------------------------------------------------
// COMMAS — the REFRAME (annie 2026-08-08): "which part NEEDS a comma", not spot-the-mistake
// (which rests on "no comma is acceptable here", nearly empty at phrase boundaries). THREE parts
// + N, so every part is a constituent; comma serves T1–T3 (three parts can't hold three optional
// sites plus a main verb, so rung 3 is unreachable). Site typing is REVIEWED per sentence (the
// third no-rule case) — R required beyond argument, O optional (a trap), F forbidden. Key = the R
// part, or N. Ladder = number of O parts (rung 0/1/2). diversityKey = the opening construction,
// capped like the errored token because the R-well is narrow (fronted clauses + lists only).
// ---------------------------------------------------------------------------------------
const COMMA_STEM = 'One part must have a comma but does not. Which part is it? If every part is right, choose N.';
type CommaSite = 'R' | 'O' | 'F';
const COMMA_TAG: Record<'O' | 'F', string> = { O: 'en-comma-over-applied', F: 'en-comma-not-a-comma-site' };
export interface CommaSentence { id: string; open: string; parts: [string, CommaSite][] }
export const commaRung = (s: CommaSentence): number => s.parts.filter((p) => p[1] === 'O').length;
export const commaKeyIndex = (s: CommaSentence): number => s.parts.findIndex((p) => p[1] === 'R');
const commaNm = (tier: Tier): number => tier - 1; // T1→0, T2→1, T3→2
export const COMMA_BANK: CommaSentence[] = [
  // RUNG 0 — KEYED-ONLY (fronted clause, R + F + F). N cannot live here: an N item needs an O site,
  // and an N item with one O is a rung-1 item (annie 2026-08-08).
  { id: 'c0-when', open: 'when', parts: [['When the fire alarm rang', 'R'], ['the class left', 'F'], ['the quiet room', 'F']] },
  { id: 'c0-because', open: 'because', parts: [['Because the bus was late', 'R'], ['we missed', 'F'], ['the early train', 'F']] },
  { id: 'c0-although', open: 'although', parts: [['Although he was tired', 'R'], ['he finished', 'F'], ['the whole race', 'F']] },
  { id: 'c0-once', open: 'once', parts: [['Once the film ended', 'R'], ['we cleared', 'F'], ['the small room', 'F']] },
  { id: 'c0-while', open: 'while', parts: [['While we waited', 'R'], ['she read', 'F'], ['a long book', 'F']] },
  { id: 'c0-if', open: 'if', parts: [['If the rain stops', 'R'], ['we will eat', 'F'], ['our packed lunch', 'F']] },
  // RUNG 1 — one O. Keyed = fronted clause + trailing PP (key A). N = a TRAILING subordinate clause
  // (the O — where a child over-applies the fronted-clause rule), so the same subordinators appear
  // off the front and the opening word stops predicting the key.
  { id: 'c1-before', open: 'before', parts: [['Before the storm came', 'R'], ['we ran', 'F'], ['to the house', 'O']] },
  { id: 'c1-when', open: 'when', parts: [['When the bell rang', 'R'], ['she hurried', 'F'], ['into the hall', 'O']] },
  { id: 'c1-since', open: 'since', parts: [['Since the shop shut', 'R'], ['we walked', 'F'], ['down the road', 'O']] },
  { id: 'c1-nt1', open: 'none', parts: [['We cleared', 'F'], ['the small room', 'F'], ['once the film ended', 'O']] },
  { id: 'c1-nt2', open: 'none', parts: [['She read', 'F'], ['a long book', 'F'], ['while we waited', 'O']] },
  { id: 'c1-nt3', open: 'none', parts: [['He finished', 'F'], ['the whole race', 'F'], ['although he was tired', 'O']] },
  { id: 'c1-np1', open: 'none', parts: [['The children', 'F'], ['played games', 'F'], ['in the park', 'O']] },
  // RUNG 2 — two O. Keyed only via LIST (verb inside the list part); the rest N.
  { id: 'c2-list1', open: 'list', parts: [['We packed apples', 'R'], ['pears and plums', 'O'], ['for the trip', 'O']] },
  { id: 'c2-list2', open: 'list', parts: [['For the fair', 'O'], ['we baked cakes', 'R'], ['buns and tarts', 'O']] },
  { id: 'c2-list3', open: 'list', parts: [['On Friday', 'O'], ['we bought bread', 'R'], ['milk and eggs', 'O']] },
  { id: 'c2-list4', open: 'list', parts: [['She grew beans', 'R'], ['peas and corn', 'O'], ['in the garden', 'O']] },
  { id: 'c2-n1', open: 'none', parts: [['The bus stopped', 'F'], ['at the corner', 'O'], ['near the market', 'O']] },
  { id: 'c2-n2', open: 'none', parts: [['The plane flew', 'F'], ['over the hills', 'O'], ['past the clouds', 'O']] },
  { id: 'c2-nt1', open: 'none', parts: [['We ate our lunch', 'F'], ['by the river', 'O'], ['before the game', 'O']] },
  { id: 'c2-n4', open: 'none', parts: [['The river flowed', 'F'], ['under the bridge', 'O'], ['into the lake', 'O']] },
];
const COMMA_NEEDS_V2: SpagFamily = {
  id: 'spag-punct-comma-needs',
  name: 'Commas (needs a comma)',
  subtype: 'punctuation',
  franchise: 'en-comma-subject-verb-split',
  tierRule: (t) => (([1, 2, 3] as Tier[]).includes(t) ? `Commas — three parts; which part must have a comma? ${commaNm(t)} of the other parts is a place a comma may sit but need not.` : ''),
  structuralParams: (t) => ({ optionalParts: commaNm(t) }),
  numberRanges: (t) => ({ segments: [3, 3], optionalParts: [commaNm(t), commaNm(t)] }),
  draft: (tier, r): SpagItemDraft => {
    const rung = commaNm(tier);
    const s = randPick(r, COMMA_BANK.filter((x) => commaRung(x) === rung));
    const key = commaKeyIndex(s);
    const opts: SpagOption[] = s.parts.map(([text, site], i) => (i === key ? { value: text, isKey: true } : { value: text, isKey: false, misconceptionId: COMMA_TAG[site as 'O' | 'F'] }));
    opts.push(key < 0 ? { value: 'No mistake', isKey: true } : { value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' });
    return { stem: COMMA_STEM, options: opts, params: { segments: 3, optionalParts: commaRung(s) }, dedupKey: s.id, diversityKey: s.open };
  },
};

// ---------------------------------------------------------------------------------------
// APOSTROPHE (POSSESSIVE) — the REFRAME "which part needs an apostrophe" (annie 2026-08-08).
// Spot-the-mistake dies here: a noun-modifier is permissive (`the girls coats` has three readings),
// so clean parts can't be unimpeachable (R15). THREE parts + N, T1–T3, same shape as comma.
// TYPING (reviewed per sentence): R = required, and only from the three ratified WELL TYPES —
// proper name (`Toms bike`), singular determiner + singular noun (`My brothers coat` — the
// determiner fixes number), irregular plural (`The childrens shoes`, bare plural never right).
// O = a NATURAL ATTRIBUTIVE noun-modifier (`the teachers lounge`, `the school gate`) — arguable,
// so no apostrophe is required. A CONCRETE possession (`boys ball`) is never O: it has no reading
// but ownership, so it would be a second R and a second answer. F = no site at all.
// Key parts print WITHOUT the apostrophe — identifying the part IS the task.
// ---------------------------------------------------------------------------------------
const POSSESSIVE_STEM = 'One part must have an apostrophe but does not. Which part is it? If every part is right, choose N.';
type PossSite = 'R' | 'O' | 'F';
const POSS_TAG: Record<'O' | 'F', string> = { O: 'en-apostrophe-attributive', F: 'en-apostrophe-not-a-site' };
export interface PossSentence { id: string; well: string; parts: [string, PossSite][] }
export const possRung = (s: PossSentence): number => s.parts.filter((p) => p[1] === 'O').length;
export const possKeyIndex = (s: PossSentence): number => s.parts.findIndex((p) => p[1] === 'R');
// TWO well types only (annie 2026-08-08): a required site must be unambiguous AS PRESENTED, and the
// apostrophe is stripped in the item. `Toms`/`childrens` are not words, so those readings are
// forced; `the girls purse` is NOT (girl's / girls' / plural attributive), so the singular-
// determiner type is dropped and its six sentences re-authored. Keys pushed to B and C, since two
// well types plus position movement is what keeps the key spread honest.
export const POSSESSIVE_BANK: PossSentence[] = [
  // rung 0 — one R, zero O.
  { id: 'p0-tom', well: 'name', parts: [['Toms bike', 'R'], ['was chained', 'F'], ['to the rail', 'F']] },
  { id: 'p0-children', well: 'irreg', parts: [['The childrens shoes', 'R'], ['were left', 'F'], ['in the hall', 'F']] },
  { id: 'p0-sara', well: 'name', parts: [['We found', 'F'], ['Saras gloves', 'R'], ['on the step', 'F']] },
  { id: 'p0-mens', well: 'irreg', parts: [['The cleaner swept', 'F'], ['the hall', 'F'], ['and the mens room', 'R']] },
  { id: 'p0-amir', well: 'name', parts: [['We waited', 'F'], ['outside', 'F'], ['for Amirs bus', 'R']] },
  // rung 1 — one O (a natural attributive).
  { id: 'p1-noah', well: 'name', parts: [['Noahs ball', 'R'], ['rolled under', 'F'], ['the garden shed', 'O']] },
  { id: 'p1-priya', well: 'name', parts: [['We queued', 'F'], ['by the car park', 'O'], ['for Priyas ticket', 'R']] },
  { id: 'p1-lounge', well: 'none', parts: [['The teachers lounge', 'O'], ['had new chairs', 'F'], ['this term', 'F']] },
  { id: 'p1-gate', well: 'none', parts: [['The school gate', 'O'], ['was painted', 'F'], ['last week', 'F']] },
  // rung 2 — two O. N items carry an O so the child must DECLINE the tempting site.
  { id: 'p2-womens', well: 'irreg', parts: [['The womens team', 'R'], ['trained by the changing room', 'O'], ['near the school gate', 'O']] },
  { id: 'p2-leila', well: 'name', parts: [['The teachers lounge', 'O'], ['held Leilas bag', 'R'], ['near the school gate', 'O']] },
  { id: 'p2-omar', well: 'name', parts: [['The bus stop', 'O'], ['stood by the changing room', 'O'], ['and Omars club', 'R']] },
  { id: 'p2-lounge', well: 'none', parts: [['The teachers lounge', 'O'], ['by the bus stop', 'O'], ['was locked', 'F']] },
];
const POSSESSIVE_V2: SpagFamily = {
  id: 'spag-punct-apostrophe-possessive',
  name: 'Apostrophes (needs an apostrophe)',
  subtype: 'punctuation',
  franchise: 'en-apostrophe-possession',
  tierRule: (t) => (([1, 2, 3] as Tier[]).includes(t) ? `Apostrophes — three parts; which part must have one? ${t - 1} of the other parts is a noun describing a noun, where none is needed.` : ''),
  structuralParams: (t) => ({ attributiveParts: t - 1 }),
  numberRanges: (t) => ({ segments: [3, 3], attributiveParts: [t - 1, t - 1] }),
  draft: (tier, r): SpagItemDraft => {
    const s = randPick(r, POSSESSIVE_BANK.filter((x) => possRung(x) === tier - 1));
    const key = possKeyIndex(s);
    const opts: SpagOption[] = s.parts.map(([text, site], i) => (i === key ? { value: text, isKey: true } : { value: text, isKey: false, misconceptionId: POSS_TAG[site as 'O' | 'F'] }));
    opts.push(key < 0 ? { value: 'No mistake', isKey: true } : { value: 'No mistake', isKey: false, misconceptionId: 'en-n-option-avoidance' });
    return { stem: POSSESSIVE_STEM, options: opts, params: { segments: 3, attributiveParts: possRung(s) }, dedupKey: s.id, diversityKey: s.well };
  },
};

// ---------------------------------------------------------------------------------------
// CLOZE (4 families) — R18. No N option, deliberately: in a gap-fill one option is better BY
// CONSTRUCTION, so "none fits" would either never be the key or concede the item is broken.
// Every item DECLARES a typed deciding factor. `grammar` and `sense` only — `register` and
// `collocation` are forbidden, being the dimensions where English permits a second answer.
// The parse-count ladder is a sound TEST but does not discriminate difficulty here, so each family
// takes its honest tier(s) rather than a fabricated ladder (annie, 2026-08-08). Distractor
// closeness is NOT a second dimension: in cloze the distractors ARE the paradigm, so they cannot be
// tuned without changing what the family tests.
// ---------------------------------------------------------------------------------------
const CLOZE_STEM_V2 = 'Choose the word that fits the gap best.';
export interface ClozeSentence {
  id: string; klass: string; sentence: string; key: string;
  distractors: Array<{ value: string; misconceptionId: string }>;
  /** How many of the four options grammatically PARSE in the slot. */
  parses: number;
  /** Ratified deciding factor. `register`/`collocation` are forbidden (R18). */
  factor: 'grammar' | 'sense';
  /** For tense: the marker that FORCES the choice. Named, or "grammar" is being over-claimed. */
  marker?: string;
}
function clozeFamilyV2(cfg: { id: string; name: string; franchise: string; tiers: Tier[]; bank: ClozeSentence[]; rule: (t: Tier) => string; tierOf: (s: ClozeSentence) => Tier }): SpagFamily {
  return {
    id: cfg.id, name: cfg.name, subtype: 'cloze', franchise: cfg.franchise,
    tierRule: (t) => (cfg.tiers.includes(t) ? cfg.rule(t) : ''),
    structuralParams: (t) => ({ optionsThatParse: cfg.bank.filter((s) => cfg.tierOf(s) === t)[0]?.parses ?? 0 }),
    numberRanges: () => ({ options: [4, 4] }),
    draft: (tier, r): SpagItemDraft => {
      const s = randPick(r, cfg.bank.filter((x) => cfg.tierOf(x) === tier));
      const opts: SpagOption[] = shuffle([
        { value: s.key, isKey: true },
        ...s.distractors.map((d) => ({ value: d.value, isKey: false, misconceptionId: d.misconceptionId })),
      ], r);
      return { stem: `${CLOZE_STEM_V2}  —  ${s.sentence}`, options: opts, params: { options: 4 }, dedupKey: s.id, diversityKey: s.klass };
    },
  };
}

const WC = 'en-word-class-by-ending';
const WORD_CLASS_BANK: ClozeSentence[] = [
  { id: 'wc-quickly', klass: 'quick', sentence: 'She answered the question ___.', key: 'quickly', distractors: [{ value: 'quick', misconceptionId: WC }, { value: 'quickness', misconceptionId: WC }, { value: 'quicken', misconceptionId: WC }], parses: 1, factor: 'grammar' },
  { id: 'wc-clearly', klass: 'clear', sentence: 'He spoke to the class ___.', key: 'clearly', distractors: [{ value: 'clear', misconceptionId: WC }, { value: 'clearness', misconceptionId: WC }, { value: 'clarity', misconceptionId: WC }], parses: 1, factor: 'grammar' },
  { id: 'wc-smoothly', klass: 'smooth', sentence: 'The runner moved ___ down the track.', key: 'smoothly', distractors: [{ value: 'smooth', misconceptionId: WC }, { value: 'smoothness', misconceptionId: WC }, { value: 'smoothen', misconceptionId: WC }], parses: 1, factor: 'grammar' },
  { id: 'wc-carefully', klass: 'careful', sentence: 'She placed the vase ___ on the shelf.', key: 'carefully', distractors: [{ value: 'careful', misconceptionId: WC }, { value: 'carefulness', misconceptionId: WC }, { value: 'care', misconceptionId: WC }], parses: 1, factor: 'grammar' },
  { id: 'wc-loudly', klass: 'loud', sentence: 'The crowd cheered ___ at the end.', key: 'loudly', distractors: [{ value: 'loud', misconceptionId: WC }, { value: 'loudness', misconceptionId: WC }, { value: 'louden', misconceptionId: WC }], parses: 1, factor: 'grammar' },
  { id: 'wc-neatly', klass: 'neat', sentence: 'He wrote the answer ___ in his book.', key: 'neatly', distractors: [{ value: 'neat', misconceptionId: WC }, { value: 'neatness', misconceptionId: WC }, { value: 'neaten', misconceptionId: WC }], parses: 1, factor: 'grammar' },
];
const WORD_CLASS_V2 = clozeFamilyV2({
  id: 'spag-cloze-word-class', name: 'Word class by job', franchise: WC, tiers: [2],
  bank: WORD_CLASS_BANK, tierOf: () => 2,
  rule: () => 'Word class — choose the form the job in the sentence requires. Single tier: only one form fits a slot, so the parse-count ladder does not climb.',
});

const TS = 'en-tense-sequence';
const TENSE_BANK: ClozeSentence[] = [
  // T2 — one parse; a forcing MARKER rules out the other three on grammar alone.
  { id: 'tn-yesterday', klass: 'walk', sentence: 'Yesterday we ___ to the park.', key: 'walked', distractors: [{ value: 'walk', misconceptionId: TS }, { value: 'have walked', misconceptionId: TS }, { value: 'will walk', misconceptionId: TS }], parses: 1, factor: 'grammar', marker: 'Yesterday (definite past)' },
  { id: 'tn-lastnight', klass: 'blow', sentence: 'Last night the wind ___ very loudly.', key: 'blew', distractors: [{ value: 'blows', misconceptionId: TS }, { value: 'has blown', misconceptionId: TS }, { value: 'will blow', misconceptionId: TS }], parses: 1, factor: 'grammar', marker: 'Last night (definite past)' },
  { id: 'tn-hourago', klass: 'ring', sentence: 'An hour ago the bell ___ for lunch.', key: 'rang', distractors: [{ value: 'rings', misconceptionId: TS }, { value: 'has rung', misconceptionId: TS }, { value: 'will ring', misconceptionId: TS }], parses: 1, factor: 'grammar', marker: 'An hour ago (definite past)' },
  { id: 'tn-lastweek', klass: 'finish', sentence: 'Last week she ___ her project.', key: 'finished', distractors: [{ value: 'finishes', misconceptionId: TS }, { value: 'has finished', misconceptionId: TS }, { value: 'will finish', misconceptionId: TS }], parses: 1, factor: 'grammar', marker: 'Last week (definite past)' },
  // T4 — two parse; the choice is still GRAMMAR (annie retyped these from sense, 2026-08-08).
  { id: 'tn-bell', klass: 'run', sentence: 'When the bell rang, the class ___ outside and lined up.', key: 'ran', distractors: [{ value: 'had run', misconceptionId: TS }, { value: 'runs', misconceptionId: TS }, { value: 'will run', misconceptionId: TS }], parses: 2, factor: 'grammar', marker: 'past-tense subordinate clause + coordinated past main verb (lined up)' },
  { id: 'tn-bytime', klass: 'start', sentence: 'By the time we arrived, the film ___ without us.', key: 'had started', distractors: [{ value: 'started', misconceptionId: TS }, { value: 'starts', misconceptionId: TS }, { value: 'will start', misconceptionId: TS }], parses: 2, factor: 'grammar', marker: 'by the time (completed prior event forces past perfect)' },
];
const TENSE_V2 = clozeFamilyV2({
  id: 'spag-cloze-tense', name: 'Tense sequence', franchise: TS, tiers: [2, 4],
  bank: TENSE_BANK, tierOf: (s) => (s.parses === 1 ? 2 : 4),
  rule: (t) => (t === 2 ? 'Tense — a time marker forces one form; the other three are ungrammatical.' : 'Tense — two forms parse and the sentence syntax decides which is right.'),
});

const CN = 'en-conjunction-logic';
const CONNECTIVE_BANK: ClozeSentence[] = [
  { id: 'cn-because', klass: 'cause', sentence: 'We stayed inside ___ it was raining.', key: 'because', distractors: [{ value: 'but', misconceptionId: CN }, { value: 'so', misconceptionId: CN }, { value: 'or', misconceptionId: CN }], parses: 4, factor: 'sense' },
  { id: 'cn-but', klass: 'contrast', sentence: 'She was very tired, ___ she kept running.', key: 'but', distractors: [{ value: 'so', misconceptionId: CN }, { value: 'because', misconceptionId: CN }, { value: 'and', misconceptionId: CN }], parses: 4, factor: 'sense' },
  { id: 'cn-so', klass: 'consequence', sentence: 'The bus was late, ___ we missed the film.', key: 'so', distractors: [{ value: 'but', misconceptionId: CN }, { value: 'because', misconceptionId: CN }, { value: 'or', misconceptionId: CN }], parses: 4, factor: 'sense' },
  { id: 'cn-or', klass: 'alternative', sentence: 'We can walk to the park, ___ we can take the bus.', key: 'or', distractors: [{ value: 'but', misconceptionId: CN }, { value: 'because', misconceptionId: CN }, { value: 'so', misconceptionId: CN }], parses: 4, factor: 'sense' },
  { id: 'cn-and', klass: 'sequence', sentence: 'She opened her book, ___ she began to read.', key: 'and', distractors: [{ value: 'but', misconceptionId: CN }, { value: 'or', misconceptionId: CN }, { value: 'because', misconceptionId: CN }], parses: 4, factor: 'sense' },
  { id: 'cn-because2', klass: 'cause-2', sentence: 'The path was muddy, ___ it had rained all night.', key: 'because', distractors: [{ value: 'but', misconceptionId: CN }, { value: 'or', misconceptionId: CN }, { value: 'so', misconceptionId: CN }], parses: 4, factor: 'sense' },
];
const CONNECTIVES_V2 = clozeFamilyV2({
  id: 'spag-cloze-connectives', name: 'Connectives', franchise: CN, tiers: [3],
  bank: CONNECTIVE_BANK, tierOf: () => 3,
  rule: () => 'Connectives — all four parse, so the logical relation decides. Single tier at the top of the parse ladder.',
});

const TG = 'en-question-tag-polarity';
const TAG_BANK: ClozeSentence[] = [
  { id: 'tg-arent-you', klass: 'be-2sg', sentence: 'You are on the last leg, ___?', key: "aren't you", distractors: [{ value: 'are you', misconceptionId: TG }, { value: "isn't it", misconceptionId: TG }, { value: "don't you", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-isnt-he', klass: 'be-3sg', sentence: 'He is coming with us, ___?', key: "isn't he", distractors: [{ value: 'is he', misconceptionId: TG }, { value: "aren't they", misconceptionId: TG }, { value: "doesn't he", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-didnt-she', klass: 'past-simple', sentence: 'She finished her work, ___?', key: "didn't she", distractors: [{ value: 'did she', misconceptionId: TG }, { value: "hasn't she", misconceptionId: TG }, { value: "wasn't she", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-cant-we', klass: 'modal-can', sentence: 'We can go now, ___?', key: "can't we", distractors: [{ value: 'can we', misconceptionId: TG }, { value: "don't we", misconceptionId: TG }, { value: "aren't we", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-wont-they', klass: 'modal-will', sentence: 'They will wait for us, ___?', key: "won't they", distractors: [{ value: 'will they', misconceptionId: TG }, { value: "don't they", misconceptionId: TG }, { value: "aren't they", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-havent-you', klass: 'perfect', sentence: 'You have seen this film, ___?', key: "haven't you", distractors: [{ value: 'have you', misconceptionId: TG }, { value: "didn't you", misconceptionId: TG }, { value: "aren't you", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-wasnt-it', klass: 'be-past', sentence: 'It was very cold, ___?', key: "wasn't it", distractors: [{ value: 'was it', misconceptionId: TG }, { value: "isn't it", misconceptionId: TG }, { value: "didn't it", misconceptionId: TG }], parses: 1, factor: 'grammar' },
  { id: 'tg-doesnt-she', klass: 'present-simple', sentence: 'She plays the piano, ___?', key: "doesn't she", distractors: [{ value: 'does she', misconceptionId: TG }, { value: "isn't she", misconceptionId: TG }, { value: "hasn't she", misconceptionId: TG }], parses: 1, factor: 'grammar' },
];
const TAGS_V2 = clozeFamilyV2({
  id: 'spag-cloze-tags', name: 'Question tags', franchise: TG, tiers: [3],
  bank: TAG_BANK, tierOf: () => 3,
  rule: () => 'Question tags — the tag must match the subject, the auxiliary and the polarity. Only one option parses.',
});

// ---------------------------------------------------------------------------------------
// TERMINAL AND BOUNDARY — spot-form, TWO error types (annie, 2026-08-08). RUN-ONS DROPPED: the
// missing full stop sits at a part JOIN, so nothing is wrong inside either part and a child naming
// the second part has reasoned identically to one naming the first — a defensible wrong answer with
// no location, unfixable by rewording. Kept: the SPLICE (long non-parallel clauses — short parallel
// ones excluded because a child cannot judge parallelism) and the FRAGMENT after a subordinator.
// Both put a visible mark INSIDE a part.
// TRAP = a part holding a REQUIRED comma — after a fronted subordinate clause, or internal to a
// list. NOT a semicolon and NOT comma-plus-coordinator: those are punctuation CHOICES, and the
// comma family's clean-part rule applies here too — a clean part may hold a punctuation RULE, never
// a choice, or a child taught "no comma before and" is right to flag it.
// Consequence: rung 3 needs three required-comma parts in one item, which does not occur without
// strain, so terminal serves T1–T3.
// ---------------------------------------------------------------------------------------
const PUNCT_STEM_SPOT = 'Read the sentence. One part has a punctuation mistake. Which part is it? If every part is right, choose N.';
export const partHasRequiredComma = (part: string): boolean => /,/.test(part);
export const TERMINAL_BANK: EsSentence[] = [
  // 0 traps — error part CORRECTED; no other part carries a comma at all.
  { id: 'tm0-splice', klass: 'rain-splice', parts: ['The rain fell all afternoon.', 'We stayed inside the hall', 'with our board games', 'until the bus came'], errorIndex: 0, wrong: 'The rain fell all afternoon,', intended: 0 },
  { id: 'tm0-frag', klass: 'sun-fragment', parts: ['Although the sun was warm,', 'we wore our coats', 'to the park', 'that morning'], errorIndex: 0, wrong: 'Although the sun was warm.', intended: 0 },
  { id: 'tm0-splice2', klass: 'film-splice', parts: ['The film ended quite late.', 'We walked home', 'along the quiet road', 'without our torches'], errorIndex: 0, wrong: 'The film ended quite late,', intended: 0 },
  { id: 'tm0-frag2', klass: 'shop-fragment', parts: ['Because the shop had closed,', 'we walked to the market', 'in the heavy rain', 'that afternoon'], errorIndex: 0, wrong: 'Because the shop had closed.', intended: 0 },
  // 1 trap — one non-error part carries a required comma (fronted clause, or list-internal).
  { id: 'tm1-splice', klass: 'storm-splice', parts: ['The storm lasted all night.', 'When the sun came out,', 'we ran outside', 'to the wet field'], errorIndex: 0, wrong: 'The storm lasted all night,', intended: 1 },
  { id: 'tm1-frag', klass: 'wind-fragment', parts: ['Although the sun was warm,', 'we wore thick coats.', 'When the wind rose,', 'we hurried inside'], errorIndex: 0, wrong: 'Although the sun was warm.', intended: 1 },
  { id: 'tm1-list', klass: 'bus-splice', parts: ['We packed apples, pears and plums.', 'The bus left at nine.', 'We arrived by noon', 'and set up camp'], errorIndex: 1, wrong: 'The bus left at nine,', intended: 1 },
  { id: 'tm1-frag2', klass: 'river-fragment', parts: ['Because the river had risen,', 'the bridge was shut.', 'When the water fell,', 'we walked across'], errorIndex: 0, wrong: 'Because the river had risen.', intended: 1 },
  // 2 traps — two non-error parts carry required commas.
  { id: 'tm2-splice', klass: 'bell-splice', parts: ['When the bell rang,', 'we packed books, pens and rulers.', 'The class lined up quietly.', 'Nobody spoke at all'], errorIndex: 2, wrong: 'The class lined up quietly,', intended: 2 },
  { id: 'tm2-frag', klass: 'rain-fragment', parts: ['Because the rain fell,', 'we played games, puzzles and cards.', 'When the sun returned,', 'we ran outside'], errorIndex: 0, wrong: 'Because the rain fell.', intended: 2 },
  { id: 'tm2-splice2', klass: 'fair-splice', parts: ['Although the day was cold,', 'we packed hats, gloves and scarves.', 'The fair opened at noon.', 'The stalls were busy'], errorIndex: 2, wrong: 'The fair opened at noon,', intended: 2 },
  { id: 'tm2-frag2', klass: 'path-fragment', parts: ['Although the path was steep,', 'we carried bags, ropes and maps.', 'When the mist cleared,', 'we saw the valley'], errorIndex: 0, wrong: 'Although the path was steep.', intended: 2 },
];
const TERMINAL_V2 = errorSpotFamily({
  id: 'spag-punct-terminal-boundary', name: 'Terminal and boundary', subtype: 'punctuation',
  franchise: 'en-terminal-punctuation-blind', stem: PUNCT_STEM_SPOT, nm: esNm, tiers: [1, 2, 3],
  bank: TERMINAL_BANK, nearMiss: partHasRequiredComma,
});

// ---------------------------------------------------------------------------------------
// SPEECH PUNCTUATION — spot-form, TWO error types (annie, 2026-08-08). MISSING-OPENING DROPPED:
// with the opening mark gone, the stray closing mark is the only evidence of direct speech, so the
// correction is undetermined — add an opening mark, or delete the closing one and read it as
// reported speech. Both give defensible English. Kept: MISSING CLOSING (the opening mark and the
// comma before it establish direct speech, so closing is the only correction) and MISSING CAPITAL.
// TRAP = a part holding a reporting verb with NO marks — no punctuation choice in it. A correctly
// closed quotation is NOT a trap: it carries terminal punctuation at a quote boundary, which
// British usage argues both ways, so it may appear only in the ERROR part.
// N items are reached through correct REPORTED speech (no marks, nothing to fix).
// Platform convention, settled: terminal punctuation sits INSIDE the closing mark.
// ---------------------------------------------------------------------------------------
export const partHasSpeechCue = (part: string): boolean => /\b(said|asked|shouted|replied|called|whispered)\b/i.test(part);
export const SPEECH_BANK: EsSentence[] = [
  // 0 traps — the reporting verb sits INSIDE the error part; no other part cues speech.
  { id: 'sp0-close', klass: 'sara-closing', parts: ['Sara said, "I am coming home now."', 'She picked up her bag', 'from the floor', 'and hurried out'], errorIndex: 0, wrong: 'Sara said, "I am coming home now.', intended: 0 },
  { id: 'sp0-capital', klass: 'priya-capital', parts: ['Priya asked, "Where is my coat?"', 'She looked under', 'the wooden bench', 'by the door'], errorIndex: 0, wrong: 'Priya asked, "where is my coat?"', intended: 0 },
  { id: 'sp0-close2', klass: 'noah-closing', parts: ['Noah replied, "I will help you."', 'He rolled up', 'his long sleeves', 'at once'], errorIndex: 0, wrong: 'Noah replied, "I will help you.', intended: 0 },
  { id: 'sp0-capital2', klass: 'zara-capital', parts: ['Zara asked, "Who left the door open?"', 'She looked round', 'the empty hall', 'for a moment'], errorIndex: 0, wrong: 'Zara asked, "who left the door open?"', intended: 0 },
  // 1 trap — one other part carries a reporting verb (no marks).
  { id: 'sp1-close', klass: 'leila-closing', parts: ['Leila said, "I have finished my work."', 'Omar called back', 'from the gate', 'and waved'], errorIndex: 0, wrong: 'Leila said, "I have finished my work.', intended: 1 },
  { id: 'sp1-capital', klass: 'rosa-capital', parts: ['Rosa asked, "Where does this path go?"', 'Amir replied slowly', 'and pointed', 'up the hill'], errorIndex: 0, wrong: 'Rosa asked, "where does this path go?"', intended: 1 },
  { id: 'sp1-close2', klass: 'tom-closing', parts: ['Tom whispered, "The play starts soon."', 'Sara asked again', 'about the time', 'of the show'], errorIndex: 0, wrong: 'Tom whispered, "The play starts soon.', intended: 1 },
  { id: 'sp1-close3', klass: 'ivy-closing', parts: ['Ivy said, "I will be there soon."', 'Ben asked twice', 'about the plan', 'for Saturday'], errorIndex: 0, wrong: 'Ivy said, "I will be there soon.', intended: 1 },
  // 2 traps.
  { id: 'sp2-close', klass: 'ava-closing', parts: ['Ava said, "I found your gloves."', 'Omar called back', 'and Priya replied', 'from the hall'], errorIndex: 0, wrong: 'Ava said, "I found your gloves.', intended: 2 },
  { id: 'sp2-capital', klass: 'ivy-capital', parts: ['Ivy asked, "When does the film start?"', 'Tom replied at once', 'and Ava called out', 'from upstairs'], errorIndex: 0, wrong: 'Ivy asked, "when does the film start?"', intended: 2 },
  { id: 'sp2-close2', klass: 'ben-closing', parts: ['Ben replied, "I will carry that box."', 'Sara whispered thanks', 'and Tom asked', 'about the time'], errorIndex: 0, wrong: 'Ben replied, "I will carry that box.', intended: 2 },
  { id: 'sp2-capital2', klass: 'kai-capital', parts: ['Kai asked, "Where did you find that?"', 'Rosa replied slowly', 'and Finn called out', 'from the door'], errorIndex: 0, wrong: 'Kai asked, "where did you find that?"', intended: 2 },
  // 3 traps.
  { id: 'sp3-close', klass: 'mira-closing', parts: ['Mira said, "We are nearly ready."', 'Omar called back', 'Priya replied softly', 'and Noah asked again'], errorIndex: 0, wrong: 'Mira said, "We are nearly ready.', intended: 3 },
  { id: 'sp3-capital', klass: 'finn-capital', parts: ['Finn asked, "Who has seen my book?"', 'Rosa replied at once', 'Mira whispered a reply', 'and Kai called out'], errorIndex: 0, wrong: 'Finn asked, "who has seen my book?"', intended: 3 },
  { id: 'sp3-close2', klass: 'kai-closing', parts: ['Kai said, "The bus is nearly here."', 'Leila asked why', 'Amir replied quietly', 'and Zara whispered back'], errorIndex: 0, wrong: 'Kai said, "The bus is nearly here.', intended: 3 },
  { id: 'sp3-capital2', klass: 'ava-capital', parts: ['Ava asked, "Who wants to go first?"', 'Ben replied at once', 'Ivy whispered a reply', 'and Kai called back'], errorIndex: 0, wrong: 'Ava asked, "who wants to go first?"', intended: 3 },
];
const SPEECH_V2 = errorSpotFamily({
  id: 'spag-punct-speech', name: 'Speech punctuation', subtype: 'punctuation',
  franchise: 'en-speech-punctuation-inside', stem: PUNCT_STEM_SPOT, nm: esNm, tiers: [1, 2, 3, 4],
  bank: SPEECH_BANK, nearMiss: partHasSpeechCue, nRate: 0,
});

// ---------------------------------------------------------------------------------------
// THE ELEVEN
// ---------------------------------------------------------------------------------------
export const SPAG_FAMILIES: SpagFamily[] = [
  // Spelling (4) — homophones REBUILT (annie 2026-08-08); the other three await the same pass.
  HOMOPHONES_V2,
  DOUBLE_CONSONANT_V2,
  UNSTRESSED_V2,
  SILENT_V2,
  // Punctuation (5) — apostrophe SPLIT into contraction (spot-form) + possessive (reframe), R14.
  CONTRACTION_V2,
  POSSESSIVE_V2,
  TERMINAL_V2,
  SPEECH_V2,
  COMMA_NEEDS_V2,
  // Cloze (3)
  WORD_CLASS_V2,
  TENSE_V2,
  CONNECTIVES_V2,
  TAGS_V2,
];
