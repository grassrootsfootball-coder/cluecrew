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

const PROVENANCE = 'ai-draft:claude-fable-5';

interface GenItem {
  n: number;
  tier: number;
  stem: object;
  options: Array<{ content: object; isCorrect: boolean; m?: number }>; // m = misconception index (0/1)
}

// ---------- Misconception library: 2 per type (§9) ----------
// Child hints use "not yet" language only (D1); never a banned word.
const M: Record<string, Array<{ id: string; description: string; childHint: string }>> = {
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
    { id: 'vr03-reversed-relation', description: 'Applied the relationship backwards.', childHint: 'Check the direction — which one is the little one, which is the big one?' },
  ],
  'vr-04-closest-meaning': [
    { id: 'vr04-associated-not-same', description: 'Chose an associated word rather than a synonym.', childHint: 'Goes-together is not the same as means-the-same. Swap the words in a sentence to test.' },
    { id: 'vr04-opposite-pull', description: 'Chose the opposite by mistake.', childHint: 'So close — that one means the reverse. Read both again slowly.' },
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
  ['day', 'sun', 'night', 'moon', 'dark', 'sleep'],
  ['eye', 'see', 'ear', 'hear', 'sound', 'head'],
  ['pen', 'write', 'knife', 'cut', 'fork', 'sharp'],
  ['fish', 'swim', 'bird', 'fly', 'wing', 'sky'],
  ['car', 'road', 'train', 'track', 'station', 'ticket'],
  ['teacher', 'school', 'doctor', 'hospital', 'medicine', 'nurse'],
  ['rain', 'wet', 'sun', 'dry', 'wet', 'yellow'],
  ['caterpillar', 'butterfly', 'tadpole', 'frog', 'pond', 'jump'],
  ['book', 'read', 'song', 'sing', 'music', 'note'],
  ['winter', 'cold', 'summer', 'warm', 'holiday', 'august'],
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
    const a = 2 + (i % 9);
    const d = 2 + (i % 5);
    let terms: number[];
    let answer: number;
    if (tier === 1) {
      terms = [a, a + d, a + 2 * d, a + 3 * d];
      answer = a + 4 * d;
    } else if (tier === 2) {
      terms = [a, a + d, a + 2 * d + 1, a + 3 * d + 3];
      answer = a + 4 * d + 6;
    } else if (tier === 3) {
      terms = [a, a + d, a + 1, a + d + 1]; // alternating +d, -(d-1)
      answer = a + 2;
    } else {
      terms = [a, 30 + i, a + d, 30 + i - 2]; // two interleaved sequences
      answer = a + 2 * d;
    }
    items.push({
      n: i + 1,
      tier,
      stem: { prompt: 'What number comes next in the series?', series: terms },
      options: [
        { content: { value: answer }, isCorrect: true },
        { content: { value: answer - 1 }, isCorrect: false, m: 1 },
        { content: { value: answer + d }, isCorrect: false, m: 0 },
        { content: { value: answer + 1 }, isCorrect: false, m: 1 },
      ],
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
    return {
      n: i + 1,
      tier,
      stem: { prompt: 'Which letter comes next?', series: terms },
      options: [
        { content: { value: letterOf(answer) }, isCorrect: true },
        { content: { value: letterOf(answer + step) }, isCorrect: false, m: 0 },
        { content: { value: letterOf(answer - 2 * step) }, isCorrect: false, m: 1 },
        { content: { value: letterOf(answer + 1) }, isCorrect: false, m: 0 },
      ],
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
function lettersForNumbers(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    // Four genuine levels (2026-08-02): the tier drives BOTH the number of
    // operands and the operations, not just add-vs-subtract. T1 two-term add,
    // T2 three-term add, T3 a subtraction, T4 four terms with a subtraction.
    const tier = 1 + (i % 4);
    const v = { P: 2 + (i % 4), Q: 3 + (i % 5), R: 4 + (i % 3), S: 5 + (i % 4) };
    const expr = tier === 1 ? 'P + Q' : tier === 2 ? 'P + Q + R' : tier === 3 ? 'P + Q − R' : 'P + Q + R − S';
    const sum =
      tier === 1 ? v.P + v.Q : tier === 2 ? v.P + v.Q + v.R : tier === 3 ? v.P + v.Q - v.R : v.P + v.Q + v.R - v.S;
    // An operation-slip distractor: the same terms with the sign flipped where
    // there is one, else a plain miscount. Nudged to stay distinct from the key.
    const opSlip = tier >= 3 ? v.P + v.Q + v.R : sum + 2;
    const distinct = (candidate: number, taken: number[]): number => {
      let value = candidate;
      while (taken.includes(value)) value += 1;
      return value;
    };
    const d1 = distinct(sum + 1, [sum]);
    const d2 = distinct(opSlip, [sum, d1]);
    const d3 = distinct(sum - 1, [sum, d1, d2]);
    return {
      n: i + 1,
      tier,
      stem: {
        prompt: `If ${Object.entries(v).map(([letter, value]) => `${letter} = ${value}`).join(', ')}, what is ${expr}?`,
        code: Object.fromEntries(Object.entries(v).map(([letter, value]) => [letter, String(value)])),
        sum: expr,
      },
      options: [
        { content: { value: sum }, isCorrect: true },
        { content: { value: d1 }, isCorrect: false, m: 0 },
        { content: { value: d2 }, isCorrect: false, m: 1 },
        { content: { value: d3 }, isCorrect: false, m: 0 },
      ],
    };
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
      options: [
        { content: { value: entry[3] }, isCorrect: true },
        { content: { value: entry[4] }, isCorrect: false, m: 0 },
        { content: { value: entry[5] }, isCorrect: false, m: 1 },
      ],
    };
  });
}

function letterConnections(): GenItem[] {
  return Array.from({ length: 25 }, (_, i) => {
    const tier = 1 + (i % 4);
    const step = 1 + (i % 4);
    const a = i % 8;
    const c = 8 + (i % 10);
    const answer = c + step;
    return {
      n: i + 1,
      tier,
      stem: {
        prompt: 'The second pair follows the same rule as the first. Which letter completes it?',
        pairA: [letterOf(a), letterOf(a + step)],
        stemWord: letterOf(c),
      },
      options: [
        { content: { value: letterOf(answer) }, isCorrect: true },
        { content: { value: letterOf(c - step) }, isCorrect: false, m: 0 },
        { content: { value: letterOf(answer + 1) }, isCorrect: false, m: 1 },
        { content: { value: letterOf(answer - 1) }, isCorrect: false, m: 1 },
      ],
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

const GENERATORS: Record<string, () => GenItem[]> = {
  'vr-01-insert-letter': insertLetter,
  'vr-02-two-odd-ones-out': oddOnesOut,
  'vr-03-related-words': () => analogies(0, 'The first pair go together in a certain way. Complete the second pair the same way.'),
  'vr-04-closest-meaning': () => synonymItems('Which word is closest in meaning to the word on the card?', SYNONYMS),
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

  // Superseded by re-authored banks (David, 2026-08-02): these three types now
  // come from vr-banks/ via `pnpm import:vr-banks`, carrying their Word-Vault
  // tier explicitly. Skipped here so a re-seed cannot resurrect the old
  // procedurally-generated items alongside the imported bank.
  const SUPERSEDED_BY_BANK = new Set([
    'vr-02-two-odd-ones-out',
    'vr-04-closest-meaning',
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
          misconceptionId: option.isCorrect ? null : misconceptions[option.m ?? 0]!.id,
        })),
      });
      itemCount++;
    }
  }

  console.log(`Generated ${itemCount} DRAFT items (${PROVENANCE}) and ${misconceptionCount} misconceptions.`);
  console.log('Every item requires human review through the CMS before it can go LIVE (P3).');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
