/**
 * Phase 4 content generator (BUILD-PHASE-4 §9). Produces original items for
 * all 21 VR types (L4: question TYPES are fair game; no content is
 * reproduced from any paper) plus ≥2 authored misconceptions per type.
 *
 * PROVENANCE IS LAW: everything lands as status DRAFT with
 * authoredBy "ai-draft:claude-fable-5". P3 makes the CMS the only road to
 * LIVE — a human reviewer must check every item. This script can never
 * publish.
 *
 * Idempotent: deterministic ids (gen-<type>-NN), safe to re-run.
 */
import { prisma } from '../src/index';
import { deductionTier, isCommon, vocabTier, vocabTierOfSet } from './difficulty';
import { buildDerivedVrDistractors, checkVr04Row, flagNearSynonymHeadwords, selectVr04Distractors, type VrOperands, type Vr04Diagnosis, type Vr04Row } from '@cluecrew/core';

/**
 * Derived distractors (reviewer audit, 2026-08-05): each is the value its
 * misconception PRODUCES on the operands, tagged with that id — not a fixed-slot
 * near-miss. Wraps the shared core builder into GenItem option shape.
 */
function derivedOptions(
  keyValue: string | number,
  operands: VrOperands,
  ids: string[],
): Array<{ content: object; isCorrect: boolean; mid?: string }> {
  return [
    { content: { value: keyValue }, isCorrect: true },
    ...buildDerivedVrDistractors(keyValue, operands, ids).map((d) => ({
      content: { value: d.value },
      isCorrect: false,
      mid: d.misconceptionId,
    })),
  ];
}

const PROVENANCE = 'ai-draft:claude-fable-5';

interface GenItem {
  n: number;
  tier: number;
  stem: object;
  // m = misconception index into the bank list; OR `mid` = an explicit id
  // (preferred for the derived VR banks, so the tag is not a fixed slot).
  options: Array<{ content: object; isCorrect: boolean; m?: number; mid?: string }>;
}

// ---------- Misconception library: 2 per type (§9) ----------
// Child hints use "not yet" language only (D1); never a banned word.
export const M: Record<string, Array<{ id: string; description: string; childHint: string }>> = {
  // Redesigned 2026-08-02 with the constructor: each distractor is COMPUTED to
  // do exactly what its tag says, and none completes both words (so no offered
  // distractor is a second right answer). Three honest error shapes.
  'vr-01-insert-letter': [
    { id: 'vr01-first-word-only', description: 'Chose a letter that completes only the first word.', childHint: 'Test your letter in BOTH gaps — it has to work twice.' },
    { id: 'vr01-second-word-only', description: 'Chose a letter that completes only the second word.', childHint: 'Check the first word too — your letter must finish it as well.' },
    { id: 'vr01-completes-neither', description: 'Chose a letter that completes neither word.', childHint: 'Say both finished words out loud. Are they both real?' },
  ],
  'vr-02-two-odd-ones-out': [
    { id: 'vr02-partial-group', description: 'Found one odd word but paired it with a group member.', childHint: 'Name the group first. The two odd ones are BOTH outside it.' },
    { id: 'vr02-surface-link', description: 'Grouped by look or sound instead of meaning.', childHint: 'Think about what the words MEAN, not how they look.' },
  ],
  'vr-03-related-words': [
    { id: 'vr03-same-topic', description: 'Chose a word from the same topic without the same relationship.', childHint: 'Say the first pair as a sentence, then use the SAME sentence for the second.' },
    { id: 'vr03-reversed-relation', description: 'Applied the relationship backwards.', childHint: 'Check which way round the first pair goes. Keep your answer the same way round.' },
    { id: 'vr03-wrong-link', description: 'Found a genuine relationship between the pair and applied it consistently, but not the one the example shows.', childHint: 'Make the first pair into a sentence. Then try your answer in the same sentence.' },
    { id: 'vr03-part-for-kind', description: 'Gave a part of the second word where the example gave a kind, a whole, or a category.', childHint: 'A part is not the same as a whole. Check what the first pair gave you.' },
    { id: 'vr03-example-anchor', description: 'Chose a word related to the first pair rather than applying the relationship to the second.', childHint: 'The first pair only shows the rule. Now use that rule on the new word.' },
    // NEW (annie, 2026-08-06) — justified by volume, eight of the 72 T3-T5 pool
    // distractors, all at T4-T5. The hint opens by affirming the link the child DID
    // find (damp→soaked and damp→wet are the same insight at two scales).
    { id: 'vr03-wrong-degree', description: 'Applies the right relationship but at the wrong strength or scale (wet for damp→soaked — the right direction of change, not its size).', childHint: 'You found the right link. Now check how big the change is.' },
  ],
  // Re-authored to annie's five-diagnosis model (2026-08-06, verbatim). The old
  // associated-not-same / opposite-pull pair is retired: an antonym is never a
  // vr-04 distractor now, and "associated" split into keeps-the-same-company
  // (shares the setting, not the sense) and one-feature-only (names one sign).
  'vr-04-closest-meaning': [
    { id: 'vr04-wrong-strength', description: 'Picks a word from the right family at the wrong intensity, far stronger or far weaker than the headword (terrified for TIMID; annoyed for FURIOUS).', childHint: 'Check how strong the word is. A quiet word needs a quiet answer.' },
    { id: 'vr04-wrong-shade', description: 'Picks a word that shares the general area of meaning but tilts it in a different direction (gloomy for STOIC, hearing sadness where the word means not showing feeling).', childHint: 'Close is not the same. Ask exactly what the first word means.' },
    { id: 'vr04-one-feature-only', description: 'Picks a word naming one visible sign of the headword rather than what it means (silent for STOIC — one thing a stoic person might do, not what stoic means).', childHint: 'That is one thing it can look like. The word itself means something wider.' },
    { id: 'vr04-keeps-the-same-company', description: 'Picks a word that turns up in the same situations as the headword without sharing its meaning (loyal for BRAVE — another word of praise, not one that means unafraid).', childHint: 'These words often turn up together. That does not make them the same.' },
    { id: 'vr04-the-other-meaning', description: 'Picks a genuine meaning of the headword, but not the sense the carrier sentence fixes (poor for HUMBLE in "stayed HUMBLE after winning" — the humble-cottage sense). T4/T5 only.', childHint: 'This word has more than one meaning. Read the sentence and pick the one it shows.' },
  ],
  'vr-05-hidden-word': [
    { id: 'vr05-single-word-only', description: 'Searched inside single words instead of across the join.', childHint: 'The hidden word loves to hide across TWO words. Check where they meet.' },
    { id: 'vr05-almost-letters', description: 'Picked a word whose letters are nearly, not exactly, in the sentence.', childHint: 'Underline the exact letters in order. Every letter must be there, touching.' },
  ],
  'vr-06-missing-word': [
    { id: 'vr06-fits-gap-not-word', description: 'Chose three letters that fit the gap but do not form a word.', childHint: 'The missing three letters make a little word all by themselves.' },
    { id: 'vr06-ignores-sentence', description: 'Made a real word that does not fit the sentence.', childHint: 'Read the whole sentence with your word in it. Does it make sense?' },
  ],
  'vr-07-letters-for-numbers': [
    { id: 'vr07-value-slip', description: 'Substituted one letter with the neighbouring value.', childHint: 'Write each letter’s number above it before you add.' },
    { id: 'vr07-operation-slip', description: 'Added when the sum needed another operation.', childHint: 'Circle the signs first — plus, minus or times?' },
    { id: 'vr07-term-dropped', description: 'Stopped before using every letter, usually leaving off the last term.', childHint: 'Check you have used every letter. Tick each one as you go.' },
  ],
  'vr-08-move-letter': [
    { id: 'vr-move-letter-first-word-invalid', description: 'exists-from-seed', childHint: '' },
    { id: 'vr-move-letter-second-word-invalid', description: 'exists-from-seed', childHint: '' },
  ],
  'vr-09-letter-series': [
    { id: 'vr-letter-series-step-repeat', description: 'exists-from-seed', childHint: '' },
    { id: 'vr-letter-series-direction', description: 'exists-from-seed', childHint: '' },
  ],
  'vr-10-word-connections': [
    { id: 'vr10-topic-match', description: 'Matched topic instead of the connecting rule.', childHint: 'Find the rule in the first pair. Carry the rule across, not the topic.' },
    { id: 'vr10-reversed', description: 'Applied the connection the reverse way round.', childHint: 'Which way does the arrow point in the first pair? Keep it pointing the same way.' },
  ],
  'vr-11-number-series': [
    { id: 'vr-series-step-carryover', description: 'exists-from-seed', childHint: '' },
    { id: 'vr-series-off-by-one', description: 'exists-from-seed', childHint: '' },
  ],
  'vr-12-compound-words': [
    { id: 'vr12-meaning-not-word', description: 'Chose a pairing that makes sense but not a real compound word.', childHint: 'The two halves must snap into ONE real word you have seen written down.' },
    { id: 'vr12-wrong-order', description: 'Built the compound in reverse order.', childHint: 'Try the halves both ways round — only one order makes the word.' },
  ],
  'vr-13-make-a-word': [
    { id: 'vr13-wrong-pieces', description: 'Took letters from the middle instead of the shown positions.', childHint: 'Look at where the example word takes its letters from. Copy those exact positions.' },
    { id: 'vr13-not-a-word', description: 'Assembled letters that do not form a real word.', childHint: 'Say your finished word out loud — is it one you know?' },
  ],
  'vr-14-letter-connections': [
    { id: 'vr14-step-direction', description: 'Moved backwards through the alphabet instead of forwards.', childHint: 'Draw the arrow: which way did the first pair travel?' },
    { id: 'vr14-step-size', description: 'Counted the jump one letter short or long.', childHint: 'Use the Alphabet Rail — count each hop out loud.' },
  ],
  'vr-15-reading-information': [
    { id: 'vr15-first-mention', description: 'Chose whoever was mentioned first rather than following the clues.', childHint: 'Line the people up in order using EVERY clue before you answer.' },
    { id: 'vr15-clue-flip', description: 'Read a comparison the reverse way (taller vs shorter).', childHint: 'Careful with the direction words: taller, older, faster. Who beats whom?' },
  ],
  'vr-16-opposite-meaning': [
    { id: 'vr16-synonym-pull', description: 'Chose a word meaning the same instead of the opposite.', childHint: 'You found a twin — now find the reverse.' },
    { id: 'vr16-loose-opposite', description: 'Chose a loosely different word, not a true opposite.', childHint: 'A true opposite flips the meaning exactly, like hot and cold.' },
  ],
  'vr-17-complete-the-sum': [
    { id: 'vr17-one-side-only', description: 'Solved one side of the equation and stopped.', childHint: 'Work out BOTH sides — the answer makes them balance like scales.' },
    { id: 'vr17-arith-slip', description: 'Right method, arithmetic slip of one or two.', childHint: 'Your plan is right — recount the last step slowly.' },
  ],
  'vr-18-related-numbers': [
    { id: 'vr18-partial-rule', description: 'Used only one of the two outer numbers in the rule.', childHint: 'The middle number is made from BOTH outside numbers. How do they combine?' },
    { id: 'vr18-rule-swap', description: 'Applied a nearby rule (added instead of multiplied).', childHint: 'Test your rule on the FIRST group before using it on the second.' },
  ],
  'vr-19-word-number-codes': [
    { id: 'vr19-letter-order', description: 'Matched code digits to letters in the reverse order.', childHint: 'Line the code up under the word, letter by letter, left to right.' },
    { id: 'vr19-shared-letter-miss', description: 'Missed that repeated letters share one digit.', childHint: 'Twin letters wear twin numbers. Find the letters that repeat first.' },
  ],
  'vr-20-complete-the-word': [
    { id: 'vr20-sound-alike', description: 'Chose a letter that sounds right but spells a non-word.', childHint: 'Picture the whole word written down. Does it look right too?' },
    { id: 'vr20-common-letter', description: 'Defaulted to a common letter without testing the word.', childHint: 'Try your letter IN the gap and read the whole word.' },
  ],
  'vr-21-same-meaning': [
    { id: 'vr21-associated-not-same', description: 'Chose a goes-together word, not a means-the-same word.', childHint: 'Could you swap one word for the other in a sentence? Twins can swap.' },
    { id: 'vr21-too-strong', description: 'Chose a much stronger or weaker version of the meaning.', childHint: 'Nearly! Match the SIZE of the meaning too — huge is more than big.' },
  ],
};

// ---------- Curated language banks (all original, L4) ----------
const SYNONYMS: Array<[string, string, string, string, string]> = [
  ['begin', 'start', 'lend', 'shout', 'carry'], ['shut', 'close', 'open', 'paint', 'lift'],
  ['large', 'huge', 'tiny', 'flat', 'round'], ['quick', 'rapid', 'slow', 'heavy', 'green'],
  ['tidy', 'neat', 'messy', 'loud', 'sharp'], ['angry', 'cross', 'calm', 'sleepy', 'bright'],
  ['silent', 'quiet', 'noisy', 'sticky', 'warm'], ['simple', 'easy', 'tricky', 'salty', 'deep'],
  ['broad', 'wide', 'narrow', 'sweet', 'early'], ['moist', 'damp', 'dry', 'brave', 'tall'],
  ['foolish', 'silly', 'sensible', 'hungry', 'cold'], ['leap', 'jump', 'crawl', 'whisper', 'bake'],
  ['grab', 'seize', 'release', 'admire', 'doze'], ['finish', 'end', 'begin', 'borrow', 'shine'],
  ['build', 'construct', 'demolish', 'wander', 'tickle'], ['old', 'ancient', 'modern', 'gentle', 'busy'],
  ['rich', 'wealthy', 'generous', 'distant', 'polite'], ['brave', 'courageous', 'timid', 'tuneful', 'frosty'],
  ['tired', 'weary', 'lively', 'curly', 'smooth'], ['happy', 'glad', 'gloomy', 'prickly', 'brisk'],
  ['help', 'assist', 'hinder', 'gallop', 'melt'], ['choose', 'select', 'refuse', 'gather', 'sneeze'],
  ['odd', 'strange', 'ordinary', 'shiny', 'ripe'], ['gift', 'present', 'ticket', 'ladder', 'puddle'],
  ['speak', 'talk', 'listen', 'wriggle', 'freeze'],
];

const ANTONYMS: Array<[string, string, string, string, string]> = [
  ['hot', 'cold', 'warm', 'spicy', 'bright'], ['high', 'low', 'tall', 'steep', 'wide'],
  ['early', 'late', 'soon', 'quick', 'first'], ['empty', 'full', 'hollow', 'light', 'open'],
  ['light', 'heavy', 'bright', 'pale', 'soft'], ['buy', 'sell', 'spend', 'keep', 'wrap'],
  ['above', 'below', 'over', 'beside', 'inside'], ['push', 'pull', 'shove', 'carry', 'slide'],
  ['appear', 'vanish', 'arrive', 'grow', 'sparkle'], ['noisy', 'silent', 'loud', 'busy', 'merry'],
  ['smooth', 'rough', 'flat', 'soft', 'slippery'], ['brave', 'timid', 'bold', 'strong', 'daring'],
  ['wide', 'narrow', 'broad', 'long', 'open'], ['deep', 'shallow', 'low', 'dark', 'wet'],
  ['begin', 'finish', 'start', 'pause', 'plan'], ['remember', 'forget', 'recall', 'repeat', 'remind'],
  ['sharp', 'blunt', 'pointed', 'shiny', 'thin'], ['tame', 'wild', 'gentle', 'furry', 'quiet'],
  ['victory', 'defeat', 'triumph', 'contest', 'medal'], ['ancient', 'modern', 'old', 'dusty', 'famous'],
  ['arrive', 'depart', 'reach', 'visit', 'settle'], ['expand', 'shrink', 'stretch', 'swell', 'unfold'],
  ['rise', 'fall', 'climb', 'float', 'lift'], ['joy', 'sorrow', 'delight', 'wonder', 'cheer'],
  ['accept', 'refuse', 'receive', 'invite', 'agree'],
];

const CATEGORIES: Record<string, string[]> = {
  fruit: ['apple', 'pear', 'plum', 'peach', 'cherry', 'grape'],
  furniture: ['chair', 'table', 'wardrobe', 'stool', 'bench'],
  weather: ['drizzle', 'fog', 'hail', 'breeze', 'thunder'],
  vehicles: ['lorry', 'tram', 'scooter', 'barge', 'coach'],
  tools: ['hammer', 'chisel', 'spanner', 'pliers', 'saw'],
  birds: ['robin', 'heron', 'wren', 'magpie', 'owl'],
  vegetables: ['carrot', 'leek', 'turnip', 'spinach', 'pea'],
  instruments: ['violin', 'trumpet', 'cello', 'flute', 'drum'],
  insects: ['beetle', 'wasp', 'moth', 'ant', 'dragonfly'],
  clothing: ['scarf', 'jumper', 'mitten', 'anorak', 'sock'],
};

const ANALOGIES: Array<[string, string, string, string, string, string]> = [
  // [a, b, c, answer, distractor1, distractor2]
  ['kitten', 'cat', 'puppy', 'dog', 'bone', 'kennel'],
  ['hand', 'glove', 'foot', 'sock', 'leg', 'lace'],
  ['bird', 'nest', 'bee', 'hive', 'honey', 'sting'],
  ['day', 'sun', 'night', 'moon', 'owl', 'sleep'], // 'dark' replaced: it is a defensible answer at T1 (night IS dark), reviewer 2026-08-05
  ['eye', 'see', 'ear', 'hear', 'sound', 'head'],
  ['pen', 'write', 'knife', 'cut', 'fork', 'sharp'],
  ['fish', 'swim', 'bird', 'fly', 'wing', 'sky'],
  ['car', 'road', 'train', 'track', 'station', 'ticket'],
  ['teacher', 'school', 'doctor', 'hospital', 'medicine', 'nurse'],
  ['rain', 'wet', 'sun', 'dry', 'wet', 'yellow'],
  ['caterpillar', 'butterfly', 'tadpole', 'frog', 'pond', 'jump'],
  ['book', 'read', 'song', 'sing', 'music', 'note'],
  ['winter', 'cold', 'summer', 'warm', 'holiday', 'August'],
  ['minute', 'hour', 'hour', 'day', 'clock', 'week'],
  ['leaf', 'tree', 'petal', 'flower', 'garden', 'stem'],
  ['captain', 'ship', 'pilot', 'plane', 'airport', 'wing'],
  ['bee', 'honey', 'cow', 'milk', 'farm', 'grass'],
  ['sheep', 'lamb', 'horse', 'foal', 'stable', 'hay'],
  ['spider', 'web', 'bird', 'nest', 'egg', 'branch'],
  ['king', 'crown', 'knight', 'helmet', 'castle', 'sword'],
  ['baker', 'bread', 'potter', 'pot', 'oven', 'clay'],
  ['foot', 'shoe', 'head', 'hat', 'hair', 'neck'],
  ['puddle', 'small', 'lake', 'large', 'water', 'little'],
  ['whisper', 'quiet', 'shout', 'loud', 'voice', 'mouth'],
  ['seed', 'plant', 'egg', 'chick', 'shell', 'nestbox'],
];

const HIDDEN_WORDS: Array<[string, string, string, string]> = [
  // [sentence, hidden, distractor1, distractor2]
  ['Dad ate the last plum.', 'date', 'plum', 'sale'],
  ['She played her oboe in the band.', 'hero', 'band', 'robe'],
  ['It was the best option today.', 'stop', 'best', 'toad'],
  ['The crab and the gull raced.', 'band', 'crag', 'gulp'],
  ['A flamingo nests near water.', 'gone', 'lame', 'stem'],
  ['Whose pens on Gran’s desk?', 'song', 'pane', 'rand'],
  ['Do not sit empty-handed.', 'item', 'note', 'hand'],
  ['Zebra ideas win prizes.', 'raid', 'zeal', 'wisp'],
  ['The metal ambulance door shut.', 'lamb', 'meta', 'dool'],
  ['Both Emma and Jo came.', 'them', 'both', 'jams'],
  ['The bus and the car waited.', 'sand', 'busy', 'cart'],
  ['Which and how many?', 'hand', 'many', 'whim'],
  ['You can see so far, Max.', 'farm', 'seas', 'foam'],
  ['The hero sent a letter.', 'rose', 'sent', 'reel'],
  ['The kitten tumbled over.', 'tent', 'kite', 'over'],
  ['A deep armchair sat there.', 'pear', 'deed', 'arch'],
  ['The oak in Dan’s garden fell.', 'kind', 'dane', 'goad'],
  ['The demo thrilled everyone.', 'moth', 'demo', 'ever'],
  ['Put the star in gold paper.', 'ring', 'trap', 'gasp'],
  ['Watch industrious ants.', 'chin', 'wand', 'stir'],
  ['Dad drank a cider slowly.', 'acid', 'rank', 'slow'],
  ['The lamp landed with a bump.', 'plan', 'bump', 'dame'],
  ['Deliver yesterday’s post.', 'very', 'dell', 'past'],
  ['The piano seemed loud.', 'nose', 'loud', 'pane'],
  ['The vicar eats early.', 'care', 'vice', 'rate'],
];

const MISSING_WORDS: Array<[string, string, string, string, string]> = [
  // [sentence with ___ word, missing 3-letter word, full word, d1, d2]
  ['The children began to SH___.', 'OUT', 'SHOUT', 'OWL', 'OAK'],
  ['The floor had a new ___PET.', 'CAR', 'CARPET', 'CUP', 'COT'],
  ['The car’s BON___ was warm.', 'NET', 'BONNET', 'NIT', 'TEN'],
  ['Rabbits love a crunchy ___ROT.', 'CAR', 'CARROT', 'RAT', 'PAR'],  // swap: RAT→RATROT (non-word, fits-gap-not-word), PAR→PARROT (real, ignores-sentence)
  ['The best P___ER lifted the cup.', 'LAY', 'PLAYER', 'LOW', 'LIP'],
  ['Please do not S___L my chips.', 'TEA', 'STEAL', 'TOE', 'TAP'],
  ['All the money was S___T.', 'PEN', 'SPENT', 'PIN', 'PAN'],
  ['The cat left a SC___CH on the door.', 'RAT', 'SCRATCH', 'ROT', 'RIM'],
  ['The F___ER fed the hens.', 'ARM', 'FARMER', 'AIM', 'ART'],
  ['Her H___T beat fast.', 'EAR', 'HEART', 'EAT', 'ERA'],
  ['The POL___ helped us cross.', 'ICE', 'POLICE', 'ACE', 'INN'],
  ['She turned the P___S slowly.', 'AGE', 'PAGES', 'APE', 'EGG'],
  ['The queen wore a golden C___N.', 'ROW', 'CROWN', 'RAW', 'RUG'],
  ['The wolf H___ED at the moon.', 'OWL', 'HOWLED', 'OIL', 'ELF'],
  ['Muddy boots must be W___ED.', 'ASH', 'WASHED', 'AXE', 'ANT'],  // swap: AXE→WAXEED (non-word), ANT→WANTED (real, ignores-sentence)
  ['We watered the PL___S.', 'ANT', 'PLANTS', 'ASH', 'APE'],
  ['He TH___S before he answers.', 'INK', 'THINKS', 'ICE', 'IVY'],
  ['We visited three PL___S today.', 'ACE', 'PLACES', 'AGE', 'ARC'],
  ['The G___EN gates opened wide.', 'OLD', 'GOLDEN', 'ODD', 'OWN'],
  ['She shared the sweets F___LY.', 'AIR', 'FAIRLY', 'ARM', 'AIL'],
  ['Artists CR___E wonderful things.', 'EAT', 'CREATE', 'EEL', 'EAR'],
  ['A B___CH fell from the oak.', 'RAN', 'BRANCH', 'RIB', 'RAY'],
  ['Wait a MO___T, please.', 'MEN', 'MOMENT', 'MAN', 'MAT'],
  ['We OF___ walk to school.', 'TEN', 'OFTEN', 'TIN', 'TAR'],
  ['The cat’s W___KER twitched.', 'HIS', 'WHISKER', 'HAS', 'HIT'],
];

const INSERT_LETTER: Array<[string, string, string, string, string]> = [
  // [word1 with gap, word2 with gap, letter, d1, d2]
  ['plan(?)', '(?)ail', 't', 's', 'r'], ['crus(?)', '(?)ent', 't', 'd', 'b'],
  ['stam(?)', '(?)ond', 'p', 't', 'f'], ['drin(?)', '(?)ite', 'k', 'g', 'b'],
  ['brea(?)', '(?)ing', 'd', 't', 's'], ['clam(?)', '(?)ost', 'p', 'b', 'm'],
  ['toas(?)', '(?)rack', 't', 'c', 'b'], ['crow(?)', '(?)est', 'n', 'd', 'r'],
  ['spoo(?)', '(?)oise', 'n', 'l', 'm'], ['chal(?)', '(?)ing', 'k', 'l', 'd'],
  ['stoo(?)', '(?)ift', 'l', 'd', 'p'], ['bloo(?)', '(?)oor', 'd', 'm', 'n'],
  ['clea(?)', '(?)ose', 'n', 'r', 't'], ['shar(?)', '(?)ond', 'p', 'k', 'e'],
  ['ligh(?)', '(?)rain', 't', 'b', 'g'], ['smar(?)', '(?)able', 't', 'c', 's'],
  ['gree(?)', '(?)oise', 'n', 'd', 't'], ['floa(?)', '(?)iger', 't', 'l', 'd'],
  ['spor(?)', '(?)rick', 't', 'b', 'p'], ['clou(?)', '(?)ance', 'd', 't', 'r'],
  ['pain(?)', '(?)ent', 't', 'd', 's'], ['forecas(?)', '(?)ower', 't', 'p', 'f'],
  ['swee(?)', '(?)ime', 't', 'p', 'l'], ['grou(?)', '(?)ip', 'p', 'nd', 'd'],
  ['frui(?)', '(?)ea', 't', 's', 'p'],
];

const MOVE_LETTER_EXTRA: Array<[string, string, string, string, string]> = [
  // [word1, word2, letter, d1, d2]
  ['CHAIR', 'MOP', 'C', 'H', 'R'], ['BLEND', 'RIDGE', 'B', 'L', 'D'],
  ['FLAME', 'RIGHT', 'F', 'L', 'M'], ['SHELF', 'TRAIN', 'S', 'H', 'F'],
  ['CHEAT', 'AIR', 'C', 'T', 'H'], ['SPACE', 'TAR', 'S', 'P', 'C'],
  ['TWIN', 'HERE', 'W', 'T', 'N'], ['SLED', 'PIT', 'S', 'L', 'D'],
  ['GRAIN', 'ATE', 'G', 'R', 'N'], ['CHARM', 'ORE', 'C', 'H', 'M'],
  ['PLUMP', 'AY', 'P', 'L', 'M'], ['SNOW', 'HOE', 'S', 'N', 'W'],
];

// Distractors corrected 2026-08-02 (case-vr-12-CORRECTED-BANK): nine that
// formed a real compound with the base — raindrop, toothpaste, starshine,
// lamplight, footwalk, gameplay, sunday, airplane, storybook — replaced with
// clean words, so regeneration cannot reintroduce the double-keys.
const COMPOUNDS: Array<[string, string, string, string]> = [
  ['sun', 'flower', 'cloud', 'grass'], ['rain', 'bow', 'umbrella', 'sky'],
  ['tooth', 'brush', 'dentist', 'mouth'], ['cup', 'board', 'plate', 'spoon'],
  ['butter', 'fly', 'bread', 'yellow'], ['grand', 'mother', 'house', 'old'],
  ['news', 'paper', 'story', 'radio'], ['skate', 'board', 'wheel', 'ice'],
  ['snow', 'man', 'cold', 'winter'], ['star', 'fish', 'night', 'planet'],
  ['pan', 'cake', 'pot', 'fry'], ['hand', 'bag', 'finger', 'glove'],
  ['light', 'house', 'shadow', 'bright'], ['foot', 'path', 'toe', 'ankle'],
  ['bed', 'room', 'sleep', 'pillow'], ['play', 'ground', 'toy', 'fun'],
  ['day', 'dream', 'night', 'hour'], ['moon', 'light', 'star', 'round'],
  ['sea', 'weed', 'sand', 'wave'], ['fire', 'work', 'flame', 'hot'],
  ['water', 'fall', 'river', 'wet'], ['air', 'port', 'breeze', 'wind'],
  ['farm', 'yard', 'field', 'barn'], ['book', 'case', 'page', 'chapter'],
  ['arm', 'chair', 'elbow', 'sit'],
];

const MAKE_A_WORD: Array<[string, string, string, string, string]> = [
  // [w1, w3, answer, d1, d2] — answer = first two of w1 + first two of w3
  ['STAY', 'ARMY', 'STAR', 'STAY', 'ARMS'], ['SHEEP', 'OPEN', 'SHOP', 'SHOE', 'OPAL'],
  ['GRASS', 'INK', 'GRIN', 'GRAN', 'RINK'], ['FLAG', 'ATLAS', 'FLAT', 'FLAP', 'ALAS'],
  ['CHEESE', 'INSECT', 'CHIN', 'CHIP', 'ICES'], ['DRESS', 'UMBRELLA', 'DRUM', 'DRUG', 'UMPS'],
  ['PLATE', 'UMPIRE', 'PLUM', 'PLAN', 'UMPS'], ['CLOUD', 'APPLE', 'CLAP', 'CLAY', 'APES'],
  ['TREE', 'IPAD', 'TRIP', 'TRAY', 'PADS'], ['SNAKE', 'APRON', 'SNAP', 'SNIP', 'APES'],
  ['SWAN', 'IMAGE', 'SWIM', 'SWAM', 'MAGE'], ['CRAB', 'ABLE', 'CRAB', 'CRIB', 'ABLE'],
  ['SPOON', 'INDEX', 'SPIN', 'SPAN', 'DENS'], ['GRAPE', 'ABBEY', 'GRAB', 'GRIP', 'ABBE'],
  ['SLEEP', 'IPOD', 'SLIP', 'SLAP', 'PODS'], ['PRAWN', 'AMBER', 'PRAM', 'PROM', 'AMBS'],
  ['BRICK', 'IMP', 'BRIM', 'BRAM', 'IMPS'], ['DRAGON', 'IPS', 'DRIP', 'DRAP', 'IPSY'],
  ['CHERRY', 'ATTIC', 'CHAT', 'CHIT', 'ATTA'], ['WHEEL', 'IMPS', 'WHIM', 'WHAM', 'IMPY'],
  ['SHED', 'UTTER', 'SHUT', 'SHOT', 'UTTS'], ['TRUCK', 'APPLE', 'TRAP', 'TRIP', 'APPS'],
  ['FLOWER', 'IPS', 'FLIP', 'FLAP', 'IPSO'], ['SLIDE', 'AMBER', 'SLAM', 'SLIM', 'AMBS'],
  ['SNOW', 'IPS', 'SNIP', 'SNAP', 'IPSA'],
];

const NAMES = ['Amy', 'Ben', 'Cara', 'Dev', 'Ella', 'Finn', 'Grace', 'Hari', 'Isla', 'Jack'];
const COMPARATIVES: Array<[string, string, string]> = [
  ['taller', 'tallest', 'shortest'],
  ['older', 'oldest', 'youngest'],
  ['faster', 'fastest', 'slowest'],
];

// ---------- Item builders ----------
function numberSeries(): GenItem[] {
  const items: GenItem[] = [];
  for (let i = 0; i < 25; i++) {
    const tier = 1 + (i % 4);
    const a = 2 + (i % 9) + (tier - 1) * 3; // magnitude climbs with tier
    const dBase = 2 + (i % 5);
    // Redesigned (reviewer audit): the old alternating/interleaved tiers could
    // not support a derivable step-carryover or direction tag. Every tier is now
    // a clean arithmetic series — constant step (T1–2) or a step that grows by a
    // fixed amount each term (T3–4) — so every distractor is what its tag
    // produces. Difficulty still climbs (magnitude, then a changing step).
    const changing = tier >= 3;
    const grow = tier === 4 ? 3 : 2; // how much the gap grows each term (T3/T4)
    const gapAt = (k: number): number => dBase + (changing ? k * grow : 0);
    const terms = [a];
    for (let k = 0; k < 3; k += 1) terms.push(terms[k]! + gapAt(k));
    const last = terms[3]!;
    const prevStep = gapAt(2); // the last gap the child actually saw
    const answer = last + gapAt(3);
    const operands: VrOperands = changing
      ? { kind: 'number-series', first: a, step: dBase, answer, last, prevStep }
      : { kind: 'number-series', first: a, step: dBase, answer };
    // direction RETIRED (reviewer, 2026-08-06). Changing series field
    // step-carryover + off-by-one. Constant series field the reviewer's authored
    // constant diagnoses: off-by-one, step-applied-twice, and (gated on a
    // no-collision check across all 13) sum-of-last-two — four options.
    const ids = changing
      ? ['vr-series-step-carryover', 'vr-series-off-by-one']
      : ['vr-series-off-by-one', 'vr-series-step-applied-twice', 'vr-series-sum-of-last-two'];
    items.push({
      n: i + 1,
      tier,
      stem: { prompt: 'What number comes next in the series?', series: terms, operands },
      options: derivedOptions(answer, operands, ids),
    });
  }
  return items;
}

const A_CODE = 65;
const letterOf = (position: number) => String.fromCharCode(A_CODE + ((position % 26) + 26) % 26);

function letterSeries(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    const tier = 1 + (i % 4);
    const start = i % 6;
    const step = 1 + (i % 3) + (tier >= 3 ? 1 : 0);
    const terms = [0, 1, 2, 3].map((n) => letterOf(start + n * step));
    const answer = start + 4 * step;
    // Derived (reviewer audit): overshoot a step (step-repeat), extend backwards
    // off the front (direction), land one letter out (off-by-one) — each the
    // value its tag produces, not a fixed slot.
    const operands: VrOperands = { kind: 'letter-series', first: start, step, answer };
    return {
      n: i + 1,
      tier,
      stem: { prompt: 'Which letter comes next?', series: terms, operands },
      options: derivedOptions(letterOf(answer), operands, [
        'vr-letter-series-step-repeat',
        'vr-letter-series-direction',
        'vr-letter-series-off-by-one',
      ]),
    };
  });
}

/**
 * SYMBOLS OUT OF THE LABEL RANGE (David's ruling, 2026-08-02).
 *
 * This generator used A–D as its code letters while the interface labels the
 * options A–E. The A in "If A = 3" and the A beside the first option are
 * different things wearing the same glyph, and the child has to know that
 * before they can start. P, Q, R, S sit clear of A–E and carry no arithmetic
 * connotation of their own.
 *
 * The rule generalises and is checked by `pnpm check:word-puzzles`: an item's
 * internal symbols never draw from the option-label range.
 */
// vr-07 helpers (rebuild 2026-08-06). evalCode in core is +/− only; this mirrors
// it so the generator can score a candidate set without exporting it.
const VR07_BAND: Record<number, [number, number]> = { 1: [2, 7], 2: [3, 11], 3: [4, 14], 4: [5, 18] };
const vr07Expr = (tier: number): string => (tier === 1 ? 'P + Q − R' : 'P + Q + R − S');
function vr07Eval(expr: string, v: Record<string, number>): number {
  let total = 0;
  let sign = 1;
  for (const tok of expr.replace(/[−–]/g, '-').match(/[A-Za-z]+|[+-]/g)!) {
    if (tok === '+') sign = 1;
    else if (tok === '-') sign = -1;
    else total += sign * v[tok]!;
  }
  return total;
}
// Deterministic (no RNG — idempotent re-seed) four distinct values in [lo,hi].
function vr07Values(seed: number, lo: number, hi: number): Record<string, number> | null {
  const span = hi - lo + 1;
  const vals: number[] = [];
  let x = (seed >>> 0) || 1;
  for (let k = 0; k < 32 && vals.length < 4; k += 1) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const val = lo + (x % span);
    if (!vals.includes(val)) vals.push(val);
  }
  if (vals.length < 4) return null;
  return { P: vals[0]!, Q: vals[1]!, R: vals[2]!, S: vals[3]! };
}

// Rebuilt 2026-08-06 (reviewer findings). The old generator rotated four values
// out of a pool by tier, which (a) collapsed 25 items to 8 distinct sets and
// (b) made every set all-even or all-odd, so a child could eliminate options by
// parity without arithmetic. It also tagged two distractors 'value-slip'.
// Now: value sets are searched PER ITEM (25 distinct), forced to mixed parity,
// and rejected unless all three tags land on DIFFERENT numbers (the no-collision
// check — else the derivability gate cannot say which tag owns a value). Folded
// into the vr-03 approach, each item serves THREE DISTINCT-tag distractors
// (value-slip, operation-slip and the reviewer's term-dropped), so vr-07 is a
// four-option item. SURFACED DEVIATION from BUILD-DISTRICT's T1-add-only ladder:
// every tier now carries a subtraction so operation-slip always applies;
// difficulty climbs by magnitude and term count instead. The current live bank is
// the fallback until the reviewer closes the pass (was: do-not-deploy).
function lettersForNumbers(): GenItem[] {
  const ids = ['vr07-value-slip', 'vr07-operation-slip', 'vr07-term-dropped'];
  const usedSets = new Set<string>(); // no two items share a value set + expr
  return Array.from({ length: 25 }, (_, i) => {
    const tier = 1 + (i % 4);
    const [lo, hi] = VR07_BAND[tier]!;
    const expr = vr07Expr(tier);
    const shown = [...new Set((expr.match(/[A-Za-z]+/g) ?? []))]; // letters the stem uses
    for (let attempt = 0; attempt < 6000; attempt += 1) {
      const v = vr07Values(i * 100003 + attempt * 7 + 1, lo, hi);
      if (!v) continue;
      const nums = shown.map((l) => v[l]!);
      if (new Set(nums).size !== shown.length) continue; // distinct values in play
      if (!(nums.some((n) => n % 2 === 0) && nums.some((n) => n % 2 === 1))) continue; // mixed parity
      const setKey = `${expr}|${shown.map((l) => v[l]).join(',')}`;
      if (usedSets.has(setKey)) continue; // per-item, not per-tier (was 8 distinct of 25)
      const key = vr07Eval(expr, v);
      if (key <= 0) continue; // no zero/negative answers
      const operands: VrOperands = { kind: 'code', values: Object.fromEntries(shown.map((l) => [l, v[l]!])), expr };
      // no-collision: ALL THREE tags must resolve to distinct numbers, else the
      // builder drops one and the item falls short of four options.
      if (buildDerivedVrDistractors(key, operands, ids).length !== 3) continue;
      usedSets.add(setKey);
      return {
        n: i + 1,
        tier,
        stem: {
          prompt: `If ${shown.map((l) => `${l} = ${v[l]}`).join(', ')}, what is ${expr}?`,
          code: Object.fromEntries(shown.map((l) => [l, String(v[l])])),
          sum: expr,
          operands,
        },
        options: derivedOptions(key, operands, ids),
      };
    }
    throw new Error(`vr-07 item ${i + 1}: no value set met distinct + mixed-parity + no-collision in 6000 tries`);
  });
}

function wordNumberCodes(): GenItem[] {
  const words = ['TAP', 'PAT', 'TIP', 'PIT', 'SIP', 'SAT', 'TAPS', 'PAST', 'PITS', 'SPIT'];
  return Array.from({ length: 25 }, (_, i) => {
    const map: Record<string, number> = { T: 1 + (i % 3), A: 4, P: 6, I: 7, S: 9 };
    const word = words[i % words.length]!;
    const tier = vocabTier(word);
    const codeOf = (candidate: string) => candidate.split('').map((letter) => map[letter]).join('');
    const answer = codeOf(word);
    const scrambled = answer.split('').reverse().join('');
    return {
      n: i + 1,
      tier,
      stem: {
        prompt: `Using the code, what is the code for ${word}?`,
        code: Object.fromEntries(Object.entries(map).map(([letter, digit]) => [letter, String(digit)])),
      },
      options: [
        { content: { value: answer }, isCorrect: true },
        { content: { value: scrambled === answer ? `${answer}0` : scrambled }, isCorrect: false, m: 0 },
        { content: { value: answer.slice(0, -1) + ((Number(answer.at(-1)) + 1) % 10) }, isCorrect: false, m: 1 },
      ],
    };
  });
}

function completeTheSum(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    // Four genuine levels (2026-08-02): find a missing addend (T1), the second
    // addend (T2), a subtrahend (T3), then the middle term of a two-operation
    // equation (T4). Numbers also grow with i, so magnitude scales too.
    const tier = 1 + (i % 4);
    const a = 6 + i;
    const b = 3 + (i % 6);
    const c = 2 + (i % 4);
    let display: string;
    let missing: number;
    if (tier === 1) {
      display = `? + ${b} = ${a + b}`;
      missing = a;
    } else if (tier === 2) {
      display = `${a} + ? = ${a + b}`;
      missing = b;
    } else if (tier === 3) {
      display = `${a} + ${b} − ? = ${a + b - c}`;
      missing = c;
    } else {
      display = `${a} + ? − ${c} = ${a + b - c}`;
      missing = b;
    }
    const distinct = (candidate: number, taken: number[]): number => {
      let value = Math.max(1, candidate);
      while (taken.includes(value)) value += 1;
      return value;
    };
    const d1 = distinct(missing + 1, [missing]);
    const d2 = distinct(missing + c, [missing, d1]);
    const d3 = distinct(missing - 2, [missing, d1, d2]);
    return {
      n: i + 1,
      tier,
      stem: { prompt: 'What number makes the sum correct?', sum: display },
      options: [
        { content: { value: missing }, isCorrect: true },
        { content: { value: d1 }, isCorrect: false, m: 1 },
        { content: { value: d2 }, isCorrect: false, m: 0 },
        { content: { value: d3 }, isCorrect: false, m: 1 },
      ],
    };
  });
}

function relatedNumbers(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    // Four genuine levels (2026-08-02): addition (T1), addition with larger
    // operands (T2), multiplication (T3), multiplication with larger operands
    // (T4). Operation AND magnitude both climb, so the four tiers are four
    // difficulties rather than two.
    const tier = 1 + (i % 4);
    const multiply = tier >= 3;
    const scale = tier % 2 === 0 ? 2 : 1; // the higher of each pair uses bigger numbers
    const rule = (a: number, c: number): number => (multiply ? a * c : a + c);
    const a1 = (2 + (i % 6)) * scale;
    const c1 = (3 + (i % 5)) * scale;
    const a2 = (4 + (i % 5)) * scale;
    const c2 = (2 + (i % 7)) * scale;
    const answer = rule(a2, c2);
    const otherRule = multiply ? a2 + c2 : a2 * c2; // the wrong-operation slip
    return {
      n: i + 1,
      tier,
      stem: {
        prompt: 'The middle number is made from the outer numbers in the same way each time. What replaces the question mark?',
        sum: `(${a1} [${rule(a1, c1)}] ${c1})    (${a2} [?] ${c2})`,
      },
      options: [
        { content: { value: answer }, isCorrect: true },
        { content: { value: otherRule === answer ? answer + 3 : otherRule }, isCorrect: false, m: 1 },
        { content: { value: rule(a2, c2) + 1 }, isCorrect: false, m: 0 },
      ],
    };
  });
}

function fromBank<T>(bank: T[], count: number): T[] {
  return Array.from({ length: count }, (_, i) => bank[i % bank.length]!);
}

function synonymItems(prompt: string, bank: typeof SYNONYMS): GenItem[] {
  return fromBank(bank, 25).map((entry, i) => ({
    n: i + 1,
    // Tier from the vocabulary the child must know — the prompt word and the
    // synonym it maps to — not the loop index (backbone, 2026-08-02).
    tier: vocabTierOfSet([entry[0], entry[1]]),
    stem: { prompt, words: [entry[0]] },
    options: [
      { content: { value: entry[1] }, isCorrect: true },
      { content: { value: entry[2] }, isCorrect: false, m: 1 },
      { content: { value: entry[3] }, isCorrect: false, m: 0 },
      { content: { value: entry[4] }, isCorrect: false, m: 0 },
    ],
  }));
}

function oddOnesOut(): GenItem[] {
  const categoryNames = Object.keys(CATEGORIES);
  return Array.from({ length: 25 }, (_, i) => {
    const groupCategory = categoryNames[i % categoryNames.length]!;
    const oddCategory = categoryNames[(i + 3) % categoryNames.length]!;
    const group = CATEGORIES[groupCategory]!.slice(0, 3);
    const odd = CATEGORIES[oddCategory]!.slice(i % 2, (i % 2) + 2);
    const words = [group[0]!, odd[0]!, group[1]!, odd[1]!, group[2]!];
    return {
      n: i + 1,
      // Backbone: tier from the vocabulary on show. True category-NEARNESS
      // banding (categoryTier) needs the bank to carry a nearness annotation,
      // which lands with the vr-02 rebuild; until then the words are the honest
      // signal, and it already beats the loop index.
      tier: vocabTierOfSet(words),
      stem: { prompt: 'Three of these words go together. Which TWO are the odd ones out?', words },
      options: [
        { content: { pair: [odd[0], odd[1]] }, isCorrect: true },
        { content: { pair: [odd[0], group[1]] }, isCorrect: false, m: 0 },
        { content: { pair: [group[0], group[2]] }, isCorrect: false, m: 1 },
        { content: { pair: [group[2], odd[1]] }, isCorrect: false, m: 0 },
      ],
    };
  });
}

function compounds(): GenItem[] {
  return fromBank(COMPOUNDS, 25).map((entry, i) => ({
    n: i + 1,
    tier: vocabTierOfSet([entry[0], entry[1]]),
    stem: { prompt: `Which word joins with ${entry[0].toUpperCase()} to make one new word?`, words: [entry[0]] },
    options: [
      { content: { value: entry[1] }, isCorrect: true },
      { content: { value: entry[2].replace('?', '') }, isCorrect: false, m: 0 },
      { content: { value: entry[3] }, isCorrect: false, m: 0 },
    ],
  }));
}

function makeAWord(): GenItem[] {
  return fromBank(MAKE_A_WORD, 25).map((entry, i) => ({
    n: i + 1,
    tier: vocabTierOfSet([entry[0], entry[1], entry[2]]),
    stem: {
      prompt: `The middle word is built from the first two letters of each outer word: SHEEP (SHOP) OPEN. Build the middle word for: ${entry[0]} ( ? ) ${entry[1]}`,
      words: [entry[0], entry[1]],
    },
    options: [
      { content: { value: entry[2] }, isCorrect: true },
      { content: { value: entry[3] }, isCorrect: false, m: 1 },
      { content: { value: entry[4] }, isCorrect: false, m: 0 },
    ],
  }));
}

function analogies(offset: number, prompt: string): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    const entry = ANALOGIES[(i + offset) % ANALOGIES.length]!;
    return {
      n: i + 1,
      // An analogy is as hard as its most demanding word (backbone).
      tier: vocabTierOfSet([entry[0], entry[1], entry[2], entry[3]]),
      stem: { prompt, pairA: [entry[0], entry[1]], stemWord: entry[2] },
      // Derived (reviewer audit): BOTH distractors in the data are topic
      // associates of the key — same kind of error — so both are tagged
      // same-topic. The old fixed-slot `reversed-relation` on column 5 was a lie:
      // none of the column-5 words apply the relationship backwards. A genuine
      // reversed-relation distractor would need new data; flagged, not faked.
      options: [
        { content: { value: entry[3] }, isCorrect: true },
        { content: { value: entry[4] }, isCorrect: false, mid: 'vr03-same-topic' },
        { content: { value: entry[5] }, isCorrect: false, mid: 'vr03-same-topic' },
      ],
    };
  });
}

// ---------- vr-03: typed analogy rows, generate-TO-diagnosis ----------
// Reviewer-authored (2026-08-05). Each row carries a POOL of diagnosis-tagged
// distractors, every one matching the answer's word class. The constructor
// EMITS BY DIAGNOSIS: it serves two distractors that carry DIFFERENT diagnoses
// (the pool holds up to three; the item takes two), so each wrong option is
// exactly what its tag names — the lineup-counting-v5 property, now for a
// semantic type (see VR03-GENERATOR-AND-DESCRIPTION-REPORTS §1).
//   - Two-distractor rows are COMPLETE, not thin: six verb/adjective rows (and
//     two noun rows) support only two diagnoses for structural reasons.
//   - NEVER-ADD is a hard block: those words produce a defensibly-correct
//     second answer, so the constructor refuses to emit them whatever a pool says.
//   - king->crown is RETIRED (ambiguity is in the pair, not the distractor);
//     a replacement row follows, so this bank is 25 rows, not 26.
type Vr03Dx = 'rR' | 'wL' | 'pFK' | 'sT' | 'eA' | 'wD';
const VR03_DX_ID: Record<Vr03Dx, string> = {
  rR: 'vr03-reversed-relation',
  wL: 'vr03-wrong-link',
  pFK: 'vr03-part-for-kind',
  sT: 'vr03-same-topic',
  eA: 'vr03-example-anchor',
  wD: 'vr03-wrong-degree',
};
// Defensible second answers, hard-blocked as distractors. The T1-T2 eight, then
// annie's T3-T5 additions (2026-08-06): a thermometer measures heat; pictures/art
// are paintings; water is what a drought lacks; an act divides a play; wine is a
// grape product; notes / rough copy are a draft. "fire" (the retired spark→blaze
// row) left with T5-06; "notes"/"rough copy" arrived with its draft→essay replacement.
const VR03_NEVER_ADD = new Set(['listen', 'slice', 'star', 'sunny', 'hot', 'roof', 'door', 'window', 'heat', 'pictures', 'art', 'water', 'act', 'wine', 'notes', 'rough copy']);
interface Vr03Row { a: string; b: string; stem: string; answer: string; pool: Array<[string, Vr03Dx]>; }
const VR03_ROWS: Vr03Row[] = [
  // Noun rows — three diagnoses each.
  { a: 'tree', b: 'leaf', stem: 'flower', answer: 'petal', pool: [['garden', 'rR'], ['bee', 'wL'], ['vase', 'sT']] },
  { a: 'hand', b: 'finger', stem: 'foot', answer: 'toe', pool: [['leg', 'rR'], ['boot', 'wL'], ['floor', 'sT']] },
  { a: 'book', b: 'page', stem: 'house', answer: 'room', pool: [['street', 'rR'], ['key', 'wL'], ['neighbour', 'sT']] },
  { a: 'minute', b: 'hour', stem: 'hour', answer: 'day', pool: [['minute', 'rR'], ['clock', 'wL'], ['second', 'eA']] },
  { a: 'kitten', b: 'cat', stem: 'puppy', answer: 'dog', pool: [['bone', 'wL'], ['paw', 'pFK'], ['whiskers', 'eA']] },
  { a: 'sheep', b: 'lamb', stem: 'horse', answer: 'foal', pool: [['saddle', 'wL'], ['hoof', 'pFK'], ['wool', 'eA']] },
  { a: 'caterpillar', b: 'butterfly', stem: 'tadpole', answer: 'frog', pool: [['pond', 'wL'], ['tail', 'pFK'], ['cocoon', 'eA']] },
  { a: 'leaf', b: 'tree', stem: 'petal', answer: 'flower', pool: [['garden', 'wL'], ['gardener', 'sT'], ['branch', 'eA']] },
  { a: 'seed', b: 'plant', stem: 'egg', answer: 'chick', pool: [['nest', 'wL'], ['shell', 'pFK'], ['root', 'eA']] },
  { a: 'baker', b: 'bread', stem: 'potter', answer: 'pot', pool: [['clay', 'wL'], ['handle', 'pFK'], ['oven', 'eA']] },
  { a: 'rabbit', b: 'burrow', stem: 'bee', answer: 'hive', pool: [['honey', 'wL'], ['sting', 'pFK'], ['straw', 'eA']] },
  { a: 'spider', b: 'web', stem: 'bird', answer: 'nest', pool: [['egg', 'wL'], ['feather', 'pFK'], ['silk', 'eA']] },
  { a: 'car', b: 'road', stem: 'train', answer: 'track', pool: [['station', 'wL'], ['carriage', 'pFK'], ['tyre', 'eA']] },
  { a: 'captain', b: 'ship', stem: 'pilot', answer: 'plane', pool: [['airport', 'wL'], ['wing', 'pFK'], ['anchor', 'eA']] },
  { a: 'bee', b: 'honey', stem: 'cow', answer: 'milk', pool: [['grass', 'wL'], ['horn', 'pFK'], ['wax', 'eA']] },
  { a: 'foot', b: 'shoe', stem: 'head', answer: 'hat', pool: [['pillow', 'wL'], ['hair', 'pFK'], ['sock', 'eA']] },
  { a: 'hand', b: 'glove', stem: 'foot', answer: 'sock', pool: [['floor', 'wL'], ['toe', 'pFK'], ['finger', 'eA']] },
  // Noun rows — relation supports only two diagnoses.
  { a: 'teacher', b: 'school', stem: 'doctor', answer: 'hospital', pool: [['medicine', 'wL'], ['pupil', 'eA']] },
  { a: 'day', b: 'sun', stem: 'night', answer: 'moon', pool: [['owl', 'wL'], ['morning', 'eA']] },
  // Verb rows — two diagnoses each.
  { a: 'fish', b: 'swim', stem: 'bird', answer: 'fly', pool: [['sing', 'wL'], ['float', 'eA']] },
  { a: 'eye', b: 'see', stem: 'ear', answer: 'hear', pool: [['whisper', 'wL'], ['look', 'eA']] },
  { a: 'pen', b: 'write', stem: 'knife', answer: 'cut', pool: [['spread', 'wL'], ['draw', 'eA']] },
  { a: 'book', b: 'read', stem: 'song', answer: 'sing', pool: [['record', 'wL'], ['write', 'eA']] },
  // Adjective rows — two diagnoses each.
  { a: 'winter', b: 'cold', stem: 'summer', answer: 'warm', pool: [['long', 'wL'], ['frosty', 'eA']] },
  { a: 'whisper', b: 'quiet', stem: 'shout', answer: 'loud', pool: [['angry', 'wL'], ['soft', 'eA']] },
];

const VR03_SCARCE = new Set<Vr03Dx>(['rR', 'sT']);

// T3-T5, authored by annie (2026-08-06) with three T5 self-corrections (2026-08-07,
// applied here): the case previously topped out at T2. T3 = functional/abstract
// relations; T4 = degree/scale and raw-to-made; T5 = abstract with a near-reading
// distractor. wrong-degree lives at T4 (the pair sets a clear step and the child
// matches it) plus one residual at T5-07 (doubt→believe / accept). The recorded tier
// principle: wrong-degree belongs at T4; at T5 it becomes relative-magnitude ranking,
// a different and worse-tested skill — so it is not seeded below T4 or spread across T5.
const VR03_T3T5_ROWS: Vr03Row[] = [
  // T3 — functional and abstract relations.
  { a: 'clock', b: 'time', stem: 'thermometer', answer: 'temperature', pool: [['weather', 'wL'], ['mercury', 'pFK'], ['hour', 'eA']] },
  { a: 'author', b: 'novel', stem: 'composer', answer: 'symphony', pool: [['orchestra', 'wL'], ['note', 'pFK'], ['chapter', 'eA']] },
  { a: 'shepherd', b: 'sheep', stem: 'beekeeper', answer: 'bees', pool: [['honey', 'wL'], ['sting', 'pFK'], ['wool', 'eA']] },
  { a: 'library', b: 'books', stem: 'gallery', answer: 'paintings', pool: [['artist', 'wL'], ['frame', 'pFK'], ['shelf', 'eA']] },
  { a: 'drought', b: 'rain', stem: 'famine', answer: 'food', pool: [['hunger', 'wL'], ['crop', 'sT'], ['desert', 'eA']] },
  { a: 'captain', b: 'crew', stem: 'conductor', answer: 'orchestra', pool: [['music', 'wL'], ['violin', 'pFK'], ['ship', 'eA']] },
  { a: 'recipe', b: 'meal', stem: 'blueprint', answer: 'building', pool: [['architect', 'wL'], ['brick', 'pFK'], ['chef', 'eA']] },
  { a: 'chapter', b: 'novel', stem: 'scene', answer: 'play', pool: [['line', 'rR'], ['actor', 'wL'], ['page', 'eA']] },
  // T4 — degree, scale, and raw-to-made.
  { a: 'warm', b: 'hot', stem: 'damp', answer: 'soaked', pool: [['wet', 'wD'], ['mouldy', 'wL'], ['boiling', 'eA']] },
  { a: 'breeze', b: 'gale', stem: 'shower', answer: 'downpour', pool: [['drizzle', 'wD'], ['puddle', 'wL'], ['storm', 'eA']] },
  { a: 'whisper', b: 'shout', stem: 'glance', answer: 'stare', pool: [['peek', 'wD'], ['blink', 'wL'], ['yell', 'eA']] },
  { a: 'chuckle', b: 'roar', stem: 'sniffle', answer: 'wail', pool: [['cry', 'wD'], ['sneeze', 'wL'], ['giggle', 'eA']] },
  { a: 'annoyed', b: 'furious', stem: 'pleased', answer: 'delighted', pool: [['content', 'wD'], ['calm', 'wL'], ['angry', 'eA']] },
  { a: 'wheat', b: 'flour', stem: 'grape', answer: 'juice', pool: [['vine', 'rR'], ['skin', 'pFK'], ['bread', 'eA']] },
  { a: 'sculptor', b: 'marble', stem: 'potter', answer: 'clay', pool: [['pot', 'wL'], ['handle', 'pFK'], ['statue', 'eA']] },
  { a: 'herd', b: 'cattle', stem: 'flock', answer: 'sheep', pool: [['shepherd', 'wL'], ['wool', 'pFK'], ['cow', 'eA']] },
  // T5 — abstract, with a near-reading distractor.
  { a: 'novel', b: 'chapter', stem: 'symphony', answer: 'movement', pool: [['note', 'pFK'], ['orchestra', 'wL'], ['paragraph', 'eA']] },
  { a: 'dictionary', b: 'word', stem: 'atlas', answer: 'map', pool: [['country', 'pFK'], ['geography', 'sT'], ['meaning', 'eA']] },
  // T5-03 corrected 2026-08-07: mercy is a shade of kindness (wrong-link), not a lesser degree; violence → same-topic.
  { a: 'cowardice', b: 'bravery', stem: 'cruelty', answer: 'kindness', pool: [['mercy', 'wL'], ['violence', 'sT'], ['fear', 'eA']] },
  { a: 'witness', b: 'trial', stem: 'referee', answer: 'match', pool: [['player', 'wL'], ['whistle', 'pFK'], ['judge', 'eA']] },
  { a: 'drop', b: 'ocean', stem: 'grain', answer: 'desert', pool: [['dune', 'pFK'], ['camel', 'sT'], ['wave', 'eA']] },
  // T5-06 replaced 2026-08-07: spark→blaze/seed→forest relations did not parallel; sketch→painting/draft→essay is rough-to-finished, and "outline" is close-but-wrong without being a size judgement.
  { a: 'sketch', b: 'painting', stem: 'draft', answer: 'essay', pool: [['outline', 'wL'], ['pen', 'sT'], ['canvas', 'eA']] },
  // T5-07 rebuilt 2026-08-07: "question" was a near-synonym of the stem, not a weak version of the key.
  { a: 'hesitate', b: 'act', stem: 'doubt', answer: 'believe', pool: [['accept', 'wD'], ['suspect', 'wL'], ['pause', 'eA']] },
  { a: 'apprentice', b: 'master', stem: 'sapling', answer: 'oak', pool: [['acorn', 'rR'], ['branch', 'pFK'], ['teacher', 'eA']] },
];

// Generate-to-diagnosis makes each distractor type PREDICTABLE by design, so a
// shortcut appears the moment one type is both predictable and over-represented
// (CLAUDE.md house rule: generated-distractor distribution). Distribution is
// therefore held down deliberately, on the reviewer's rules (2026-08-06):
//   1. Never drop a scarce diagnosis (reversed-relation, same-topic): that slot is
//      FIXED; the free slot is chosen from the rest. wrong-degree is fixed the same
//      way where present — it is the diagnosis that makes a degree relation testable.
//   2. Cap example-anchor at ~half the items and stop it being the default filler —
//      where a row offers three, prefer part-for-kind (then wrong-link) over eA.
// Each SEGMENT (T1-T2, then T3-T5) runs its own eA budget so the extension cannot
// shift the already-LIVE T1-T2 items — same rows, same cap, byte-identical output.
function emitVr03Segment(rows: Vr03Row[], offset: number): GenItem[] {
  const EA_CAP = Math.ceil(rows.length / 2); // ~half the items in this segment
  const forcedEa = rows.filter((r) => r.pool.length === 2 && r.pool.some(([, d]) => d === 'eA')).length;
  let eaBudget = EA_CAP - forcedEa; // example-anchor slots the free rows may add
  let freeIdx = 0; // counts no-fixed rows, to spread the eA budget across them
  return rows.map((row, i) => {
    const rowNo = offset + i + 1;
    if (row.pool.length > 3) throw new Error(`vr-03 row ${rowNo}: pool holds more than three diagnoses`);
    let served: Array<[string, Vr03Dx]>;
    if (row.pool.length === 2) {
      served = row.pool; // two-diagnosis rows are complete — serve both
    } else {
      const scarce = row.pool.filter(([, d]) => VR03_SCARCE.has(d));
      const rest = row.pool.filter(([, d]) => !VR03_SCARCE.has(d));
      if (scarce.length === 2) {
        served = scarce; // both scarce present — fix both, drop the abundant one
      } else if (scarce.length === 1) {
        // Fix the scarce slot; fill the other with a non-eA (part-for-kind,
        // then wrong-link) so example-anchor is never the default filler.
        const filler = rest.find(([, d]) => d === 'pFK') ?? rest.find(([, d]) => d === 'wL') ?? rest.find(([, d]) => d === 'eA')!;
        served = [scarce[0]!, filler];
      } else {
        const wd = row.pool.find(([, d]) => d === 'wD');
        if (wd) {
          // wrong-degree row (T4-T5 only): fix the degree slot, fill with part-for-kind,
          // then wrong-link (eA stays capped). Keeps wrong-degree served every time.
          const filler = rest.find(([, d]) => d === 'pFK' || d === 'wL') ?? rest.find(([, d]) => d === 'eA')!;
          served = [wd, filler];
        } else {
          // No fixed diagnosis. Always keep part-for-kind; add example-anchor only
          // while budget allows and on a spread of rows, else wrong-link.
          const pfk = rest.find(([, d]) => d === 'pFK')!;
          const ea = rest.find(([, d]) => d === 'eA');
          const wl = rest.find(([, d]) => d === 'wL')!;
          const takeEa = !!ea && eaBudget > 0 && freeIdx % 2 === 0;
          served = takeEa ? [pfk, ea!] : [pfk, wl];
          if (takeEa) eaBudget--;
          freeIdx++;
        }
      }
    }
    if (served.length !== 2) throw new Error(`vr-03 row ${rowNo}: needs two served distractors, got ${served.length}`);
    if (served[0]![1] === served[1]![1]) throw new Error(`vr-03 row ${rowNo}: both distractors carry diagnosis ${served[0]![1]}`);
    for (const [word] of served) {
      if (VR03_NEVER_ADD.has(word)) throw new Error(`vr-03 row ${rowNo}: "${word}" is on the never-add list — refused`);
    }
    // Alternate which distractor is stored first so no diagnosis holds a fixed
    // column (serving reshuffles per child regardless — this is for the review).
    const ordered = i % 2 === 1 ? [served[1]!, served[0]!] : served;
    return {
      n: rowNo,
      tier: vocabTierOfSet([row.a, row.b, row.stem, row.answer]),
      stem: { prompt: 'The first pair go together in a certain way. Complete the second pair the same way.', pairA: [row.a, row.b], stemWord: row.stem },
      options: [
        { content: { value: row.answer }, isCorrect: true },
        ...ordered.map(([word, dx]) => ({ content: { value: word }, isCorrect: false, mid: VR03_DX_ID[dx] })),
      ],
    };
  });
}

// T1-T2 first (n 1-25, unchanged), then the T3-T5 ladder (n 26-49). Separate
// segments keep each eA budget local so the extension cannot disturb LIVE items.
function relatedWordsTyped(): GenItem[] {
  return [...emitVr03Segment(VR03_ROWS, 0), ...emitVr03Segment(VR03_T3T5_ROWS, VR03_ROWS.length)];
}

// ---------- vr-04: closest-meaning, 40 typed rows, generate-TO-diagnosis ----------
// Reviewer-authored (annie, 2026-08-06; RAPID tightened 2026-08-07). Replaces the
// procedurally-generated synonym bank. Every row carries THREE distractors, each a
// named diagnosis on annie's five-way model (see M['vr-04-closest-meaning']). The
// machinery lives in @cluecrew/core/vr04 so the import door and this constructor
// share one implementation: checkVr04Row enforces the two-part screen (a distractor
// correct in the headword's OTHER sense is a second right answer — blocked), the
// never-add list, and the-other-meaning-needs-a-carrier gate; selectVr04Distractors
// protects the scarce OM tag. T1-T3 are bare cards; T4-T5 fix the sense with a
// carrier sentence (routed to the word-card via stem.sentence).
const VR04_DX_ID: Record<Vr04Diagnosis, string> = {
  WS: 'vr04-wrong-strength',
  SH: 'vr04-wrong-shade',
  OF: 'vr04-one-feature-only',
  SC: 'vr04-keeps-the-same-company',
  OM: 'vr04-the-other-meaning',
};
// Shorthand: [key, [word, dx]×3, carrier?]. Rows 01-24 are the live re-authoring
// (row 06 FAIR→GLAD; three live senses, no key survives a bare card); 25-40 carry
// the carrier that licenses the-other-meaning. RAPID's set is annie's 2026-08-07
// tightening (was frantic/busy/eager) so the SWIFT/RAPID pair tests discrimination.
const VR04_ROWS: Vr04Row[] = ([
  // T1
  ['brave', 'fearless', [['reckless', 'WS'], ['loud', 'OF'], ['loyal', 'SC']]],
  ['swift', 'speedy', [['frantic', 'WS'], ['sudden', 'SH'], ['early', 'SC']]],
  ['damp', 'moist', [['soaked', 'WS'], ['mouldy', 'OF'], ['cold', 'SC']]],
  ['chilly', 'cool', [['freezing', 'WS'], ['shivery', 'OF'], ['grey', 'SC']]],
  ['shiny', 'gleaming', [['dazzling', 'WS'], ['smooth', 'OF'], ['new', 'SC']]],
  ['glad', 'pleased', [['overjoyed', 'WS'], ['relieved', 'SH'], ['lucky', 'SC']]],
  ['hollow', 'empty', [['bottomless', 'WS'], ['light', 'OF'], ['wooden', 'SC']]],
  ['huge', 'enormous', [['big', 'WS'], ['tall', 'OF'], ['heavy', 'SH']]],
  // T2
  ['rapid', 'quick', [['speedy', 'WS'], ['hurried', 'SH'], ['brisk', 'OF']]],
  ['generous', 'giving', [['extravagant', 'WS'], ['friendly', 'SH'], ['wealthy', 'SC']]],
  ['gloomy', 'miserable', [['despairing', 'WS'], ['grumpy', 'SH'], ['silent', 'OF']]],
  ['timid', 'shy', [['terrified', 'WS'], ['quiet', 'OF'], ['polite', 'SC']]],
  ['rare', 'uncommon', [['unique', 'WS'], ['strange', 'SH'], ['precious', 'SC']]],
  ['sturdy', 'strong', [['massive', 'WS'], ['heavy', 'SH'], ['wooden', 'SC']]],
  ['bold', 'daring', [['reckless', 'WS'], ['rude', 'SH'], ['loud', 'OF']]],
  ['ancient', 'old', [['prehistoric', 'WS'], ['ruined', 'OF'], ['valuable', 'SC']]],
  // T3
  ['hostile', 'unfriendly', [['murderous', 'WS'], ['rude', 'SH'], ['cold', 'OF']]],
  ['humble', 'modest', [['meek', 'SH'], ['quiet', 'OF'], ['grateful', 'SC']]],
  ['vague', 'unclear', [['meaningless', 'WS'], ['careless', 'SH'], ['brief', 'OF']]],
  ['feeble', 'weak', [['helpless', 'WS'], ['pale', 'OF'], ['elderly', 'SC']]],
  ['genuine', 'real', [['perfect', 'WS'], ['signed', 'OF'], ['costly', 'SC']]],
  ['reluctant', 'unwilling', [['opposed', 'WS'], ['doubtful', 'SH'], ['slow', 'OF']]],
  ['obedient', 'well-behaved', [['submissive', 'WS'], ['polite', 'SH'], ['quiet', 'OF']]],
  ['trivial', 'unimportant', [['worthless', 'WS'], ['simple', 'SH'], ['small', 'OF']]],
  // T4 — carrier sentence
  ['jubilant', 'overjoyed', [['pleased', 'WS'], ['noisy', 'OF'], ['relieved', 'SH']], 'The crowd was JUBILANT when the final whistle blew.'],
  ['recede', 'retreat', [['vanish', 'WS'], ['settle', 'SH'], ['fade', 'OM']], 'They waited for the floodwater to RECEDE.'],
  ['conceal', 'hide', [['bury', 'WS'], ['ignore', 'SH'], ['pretend', 'SC']], 'She tried to CONCEAL her disappointment from her friends.'],
  ['exhausted', 'drained', [['tired', 'WS'], ['sleepy', 'SC'], ['empty', 'OM']], 'After the long walk home they were EXHAUSTED.'],
  ['amend', 'change', [['rewrite', 'WS'], ['improve', 'SH'], ['check', 'SC']], 'The teacher asked her to AMEND the last paragraph.'],
  ['futile', 'pointless', [['impossible', 'WS'], ['foolish', 'SH'], ['slow', 'SC']], 'Their efforts to save the old tree proved FUTILE.'],
  ['amiable', 'friendly', [['devoted', 'WS'], ['cheerful', 'SH'], ['chatty', 'OF']], 'The new neighbour seemed AMIABLE from the first day.'],
  ['abundant', 'plentiful', [['endless', 'WS'], ['large', 'SH'], ['valuable', 'SC']], 'Fish were ABUNDANT in the river that summer.'],
  // T5 — carrier sentence
  ['notorious', 'infamous', [['legendary', 'WS'], ['famous', 'SH'], ['dangerous', 'SC']], 'That road is NOTORIOUS for its sharp bends.'],
  ['exquisite', 'beautiful', [['pretty', 'WS'], ['delicate', 'OF'], ['sharp', 'OM']], 'The lace on the dress was EXQUISITE.'],
  ['benevolent', 'kind', [['saintly', 'WS'], ['polite', 'SH'], ['wealthy', 'SC']], 'The school was founded by a BENEVOLENT businessman.'],
  ['stoic', 'unemotional', [['patient', 'SH'], ['silent', 'OF'], ['brave', 'SC']], 'She remained STOIC throughout the long wait.'],
  ['jovial', 'cheerful', [['ecstatic', 'WS'], ['friendly', 'SH'], ['loud', 'OF']], 'The innkeeper greeted them in a JOVIAL manner.'],
  ['transparent', 'clear', [['thin', 'SH'], ['shiny', 'OF'], ['obvious', 'OM']], 'The lid was TRANSPARENT, so she could see the cake inside.'],
  ['luminous', 'glowing', [['blazing', 'WS'], ['pale', 'SH'], ['visible', 'OF']], 'The dial on the watch was LUMINOUS in the dark.'],
  ['melancholy', 'sad', [['heartbroken', 'WS'], ['gentle', 'SH'], ['slow', 'OF']], 'A MELANCHOLY tune drifted from the piano.'],
] as Array<[string, string, Array<[string, Vr04Diagnosis]>, string?]>).map(([headword, key, ds, carrier], i) => ({
  n: i + 1,
  tier: i < 8 ? 1 : i < 16 ? 2 : i < 24 ? 3 : i < 32 ? 4 : 5,
  headword,
  key,
  carrier: carrier ?? null,
  distractors: ds.map(([word, diagnosis]) => ({ word, diagnosis })),
}));

function closestMeaningTyped(): GenItem[] {
  return VR04_ROWS.map((row) => {
    const errs = checkVr04Row(row);
    if (errs.length) throw new Error(`vr-04 row ${row.n} (${row.headword}): ${errs.join('; ')}`);
    // Every authored row holds exactly three; the selector is a no-op here but keeps
    // the scarce OM tag protected the moment a pool is ever widened past three.
    const served = selectVr04Distractors(row.distractors, 3);
    return {
      n: row.n,
      // Tier from the vocabulary the child must know — headword + its key — not the
      // authored tier band, so a mis-banded row is caught (backbone, 2026-08-02).
      tier: vocabTierOfSet([row.headword, row.key]),
      stem: {
        prompt: row.carrier
          ? 'Read the sentence. Which word is closest in meaning to the word in capitals?'
          : 'Which word is closest in meaning to the word on the card?',
        words: [row.headword],
        ...(row.carrier ? { sentence: row.carrier } : {}),
      },
      options: [
        { content: { value: row.key }, isCorrect: true },
        ...served.map((d) => ({ content: { value: d.word }, isCorrect: false, mid: VR04_DX_ID[d.diagnosis] })),
      ],
    };
  });
}

/** Cross-tier near-synonym pairs in the vr-04 bank, surfaced with both option sets
 *  for a human call (annie, 2026-08-07). A flag, never a block — exposed for the
 *  review export, not the seed loop. */
export function vr04NearSynonymFlags(): ReturnType<typeof flagNearSynonymHeadwords> {
  return flagNearSynonymHeadwords(VR04_ROWS);
}

function letterConnections(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    const tier = 1 + (i % 4);
    const step = 1 + (i % 4);
    const a = i % 8;
    const c = 8 + (i % 10);
    const answer = c + step;
    // Derived (reviewer audit): step applied backwards (step-direction), and the
    // jump one short/long either way (two honest step-size distractors) — each
    // the value its tag produces, not a fixed slot.
    const operands: VrOperands = { kind: 'letter-analogy', first: c, step, answer };
    return {
      n: i + 1,
      tier,
      stem: {
        prompt: 'The second pair follows the same rule as the first. Which letter completes it?',
        pairA: [letterOf(a), letterOf(a + step)],
        stemWord: letterOf(c),
        operands,
      },
      options: derivedOptions(letterOf(answer), operands, ['vr14-step-direction', 'vr14-step-size', 'vr14-step-size']),
    };
  });
}

function readingInformation(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    const tier = 1 + (i % 4);
    const comparative = COMPARATIVES[i % COMPARATIVES.length]!;
    const people = [NAMES[i % 10]!, NAMES[(i + 3) % 10]!, NAMES[(i + 6) % 10]!];
    // Order: people[0] > people[1] > people[2]
    const clues =
      tier >= 3
        ? [
            `${people[1]} is ${comparative[0]} than ${people[2]}.`,
            `${people[0]} is ${comparative[0]} than ${people[1]}.`,
          ]
        : [
            `${people[0]} is ${comparative[0]} than ${people[1]}.`,
            `${people[1]} is ${comparative[0]} than ${people[2]}.`,
          ];
    const askTop = i % 2 === 0;
    return {
      n: i + 1,
      // Backbone: tier from the REASONING load. tier>=3 gives the clues out of
      // order (a transitive step the child must chain), which is exactly what
      // `transitive` captures — so difficulty now names why it is hard.
      tier: deductionTier({ clueCount: clues.length, transitive: tier >= 3, peopleCount: people.length }),
      stem: {
        prompt: 'Read the clues, then answer.',
        clues,
        question: `Who is the ${askTop ? comparative[1] : comparative[2]}?`,
      },
      // DERIVE the first-mention tag from the clue text, not a fixed slot
      // (reviewer, 2026-08-02, same fix as vr-01's computed distractors). The
      // tier>=3 clues are given out of order, so who is named first changes;
      // tagging a fixed person put vr15-first-mention on the wrong one in 12 of
      // 25. The distractor whose name opens the clues is the first-mention trap;
      // the other reads a comparison the wrong way (clue-flip). If the person
      // named first IS the answer, neither distractor is a first-mention trap.
      options: (() => {
        const key = askTop ? people[0] : people[2];
        const firstMentioned = clues[0]!.split(/\s+/)[0]!.replace(/[^A-Za-z]/g, '');
        const distractors = [people[1]!, askTop ? people[2]! : people[0]!];
        return [
          { content: { value: key }, isCorrect: true },
          ...distractors.map((person) => ({
            content: { value: person },
            isCorrect: false,
            m: person === firstMentioned ? 0 : 1, // 0 = first-mention, 1 = clue-flip
          })),
        ];
      })(),
    };
  });
}

function hiddenWords(): GenItem[] {
  return fromBank(HIDDEN_WORDS, 25).map((entry, i) => ({
    n: i + 1,
    tier: vocabTierOfSet(String(entry[0]).split(/\s+/)),
    stem: { prompt: 'A four-letter word is hiding at the join between two words. Find it.', sentence: entry[0] },
    options: [
      { content: { value: entry[1] }, isCorrect: true },
      { content: { value: entry[2] }, isCorrect: false, m: 1 },
      { content: { value: entry[3] }, isCorrect: false, m: 0 },
    ],
  }));
}

function missingWords(): GenItem[] {
  return fromBank(MISSING_WORDS, 25).map((entry, i) => ({
    n: i + 1,
    // Backbone: tier from the whole word the child must recover (entry[2]),
    // not the loop index.
    tier: vocabTier(entry[2]),
    stem: { prompt: 'Three letters that make a word are missing. Which three?', sentence: entry[0] },
    options: [
      { content: { value: entry[1] }, isCorrect: true },
      { content: { value: entry[3] }, isCorrect: false, m: 0 },
      { content: { value: entry[4] }, isCorrect: false, m: 1 },
    ],
  }));
}

function insertLetter(): GenItem[] {
  const complete = (fragment: string, letter: string): string =>
    fragment.replace(/\(\?\)/g, letter).replace(/[^A-Za-z]/g, '');
  return fromBank(INSERT_LETTER, 25).map((entry, i) => {
    const [word1, word2, key] = entry;
    // COMPUTE the distractors instead of trusting bank columns (reviewer,
    // 2026-08-02). Walk the alphabet and sort every non-key letter by what it
    // actually does. A letter that completes BOTH is never offered — that was
    // the double-key defect on items 01/12/13/21. Each offered distractor is
    // tagged by its real behaviour: first-word-only (m0), second-word-only
    // (m1), completes-neither (m2).
    const onlyFirst: string[] = [];
    const onlySecond: string[] = [];
    const neither: string[] = [];
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      if (letter === key) continue;
      // The common-usage floor (reviewer, 2026-08-02): a letter "completes" a
      // fragment only if the result is a word a child KNOWS. Completing an
      // obscure word (cruse, boor) or a lexicon-accepted non-word (clamb,
      // drinn) is invisible to the child, so it counts as completing neither —
      // and the first/second-word tag would be a lie. Judged against the same
      // common list the gate uses.
      const finishesFirst = isCommon(complete(word1, letter));
      const startsSecond = isCommon(complete(word2, letter));
      if (finishesFirst && startsSecond) continue; // a second right answer — never offer
      if (finishesFirst) onlyFirst.push(letter);
      else if (startsSecond) onlySecond.push(letter);
      else neither.push(letter);
    }
    // Prefer one of each shape; fall back through the remaining pools so an
    // item always has two distinct, honestly-tagged distractors.
    const chosen: Array<{ letter: string; m: number }> = [];
    if (onlyFirst[0]) chosen.push({ letter: onlyFirst[0], m: 0 });
    if (onlySecond[0]) chosen.push({ letter: onlySecond[0], m: 1 });
    for (const letter of [...neither, ...onlyFirst.slice(1), ...onlySecond.slice(1)]) {
      if (chosen.length >= 2) break;
      if (chosen.some((c) => c.letter === letter)) continue;
      const m = neither.includes(letter) ? 2 : onlyFirst.includes(letter) ? 0 : 1;
      chosen.push({ letter, m });
    }
    return {
      n: i + 1,
      tier: vocabTierOfSet([complete(word1, ''), complete(word2, '')]),
      stem: {
        prompt: 'One letter finishes the first word and starts the second. Which letter?',
        word1,
        word2,
      },
      options: [
        { content: { value: key }, isCorrect: true },
        ...chosen.map((c) => ({ content: { value: c.letter }, isCorrect: false, m: c.m })),
      ],
    };
  });
}

function moveLetter(): GenItem[] {
  return fromBank(MOVE_LETTER_EXTRA, 25).map((entry, i) => ({
    n: i + 1,
    tier: vocabTierOfSet([entry[0], entry[1]]),
    stem: {
      prompt: 'Move one letter from the first word to the second so both make new words.',
      word1: entry[0],
      word2: entry[1],
    },
    options: [
      { content: { value: entry[2] }, isCorrect: true },
      { content: { value: entry[3] }, isCorrect: false, m: 0 },
      { content: { value: entry[4] }, isCorrect: false, m: 1 },
    ],
  }));
}

function completeTheWord(): GenItem[] {
  const words = ['TIGER', 'CANDLE', 'WINDOW', 'GARDEN', 'PURPLE', 'SILVER', 'MARKET', 'PENCIL', 'ROCKET', 'JUNGLE',
    'CASTLE', 'BUTTON', 'MIRROR', 'POCKET', 'SUNDAY', 'BOTTLE', 'DRAGON', 'CIRCUS', 'HELMET', 'CARPET',
    'LANTERN', 'BASKET', 'TUNNEL', 'VELVET', 'MAGNET'];
  return words.map((word, i) => {
    const gapIndex = 1 + (i % (word.length - 2));
    const letter = word[gapIndex]!;
    const display = word.slice(0, gapIndex) + '_' + word.slice(gapIndex + 1);
    const wrong1 = letterOf((letter.charCodeAt(0) - A_CODE + 1) % 26);
    const wrong2 = letterOf((letter.charCodeAt(0) - A_CODE + 5) % 26);
    return {
      n: i + 1,
      tier: vocabTier(word),
      stem: { prompt: 'Which letter completes the word?', wordWithGap: display },
      options: [
        { content: { value: letter }, isCorrect: true },
        { content: { value: wrong1 }, isCorrect: false, m: 1 },
        { content: { value: wrong2 === letter ? 'Z' : wrong2 }, isCorrect: false, m: 0 },
      ],
    };
  });
}

export const GENERATORS: Record<string, () => GenItem[]> = {
  'vr-01-insert-letter': insertLetter,
  'vr-02-two-odd-ones-out': oddOnesOut,
  'vr-03-related-words': () => relatedWordsTyped(),
  'vr-04-closest-meaning': () => closestMeaningTyped(),
  'vr-05-hidden-word': hiddenWords,
  'vr-06-missing-word': missingWords,
  'vr-07-letters-for-numbers': lettersForNumbers,
  'vr-08-move-letter': moveLetter,
  'vr-09-letter-series': letterSeries,
  'vr-10-word-connections': () => analogies(12, 'Find the connection in the first pair, then complete the second.'),
  'vr-11-number-series': numberSeries,
  'vr-12-compound-words': compounds,
  'vr-13-make-a-word': makeAWord,
  'vr-14-letter-connections': letterConnections,
  'vr-15-reading-information': readingInformation,
  'vr-16-opposite-meaning': () => synonymItems('Which word means the OPPOSITE of the word on the card?', ANTONYMS),
  'vr-17-complete-the-sum': completeTheSum,
  'vr-18-related-numbers': relatedNumbers,
  'vr-19-word-number-codes': wordNumberCodes,
  'vr-20-complete-the-word': completeTheWord,
  'vr-21-same-meaning': () => synonymItems('Which word means the SAME as the word on the card?', SYNONYMS.slice(8).concat(SYNONYMS.slice(0, 8))),
};

async function main(): Promise<void> {
  if (process.env.APP_ENV === 'production') {
    throw new Error('Content generation runs in dev/staging; production content arrives via reviewed CMS import.');
  }

  // Misconceptions first (skip the seed-owned ones marked exists-from-seed).
  let misconceptionCount = 0;
  for (const [, entries] of Object.entries(M)) {
    for (const entry of entries) {
      if (entry.description === 'exists-from-seed') continue;
      await prisma.misconception.upsert({
        where: { id: entry.id },
        create: { id: entry.id, district: 'VR', description: entry.description, childHint: entry.childHint },
        update: { description: entry.description, childHint: entry.childHint },
      });
      misconceptionCount++;
    }
  }

  // Superseded by re-authored banks (David, 2026-08-02): these types now come from
  // vr-banks/ via `pnpm import:vr-banks`, carrying their Word-Vault tier explicitly.
  // Skipped here so a re-seed cannot resurrect the old procedurally-generated items
  // alongside the imported bank. vr-04 LEFT this set (annie, 2026-08-06): it is now
  // a typed constructor (closestMeaningTyped, generate-to-diagnosis), not a bank.
  const SUPERSEDED_BY_BANK = new Set([
    'vr-02-two-odd-ones-out',
    'vr-06-missing-word',
  ]);

  let itemCount = 0;
  for (const [typeId, generate] of Object.entries(GENERATORS)) {
    if (SUPERSEDED_BY_BANK.has(typeId)) continue;
    const misconceptions = M[typeId]!;
    for (const item of generate()) {
      const id = `gen-${typeId}-${String(item.n).padStart(2, '0')}`;
      await prisma.item.upsert({
        where: { id },
        create: {
          id,
          questionTypeId: typeId,
          difficultyTier: item.tier,
          stem: item.stem,
          explanation: {},
          status: 'DRAFT',
          authoredBy: PROVENANCE,
        },
        update: { stem: item.stem, difficultyTier: item.tier },
      });
      await prisma.itemOption.deleteMany({ where: { itemId: id } });
      await prisma.itemOption.createMany({
        data: item.options.map((option, index) => ({
          id: `${id}-opt${index + 1}`,
          itemId: id,
          content: option.content,
          isCorrect: option.isCorrect,
          misconceptionId: option.isCorrect ? null : (option.mid ?? misconceptions[option.m ?? 0]!.id),
        })),
      });
      itemCount++;
    }
  }

  console.log(`Generated ${itemCount} DRAFT items (${PROVENANCE}) and ${misconceptionCount} misconceptions.`);
  console.log('Every item requires human review through the CMS before it can go LIVE (P3).');
}

// Only write when run directly (`pnpm content:generate`), not when a report or
// gate imports GENERATORS/M to inspect the output without touching the database.
if (process.argv[1]?.endsWith('generate-content.ts')) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
