/**
 * VOCABULARY IN CONTEXT — route (a), the CARRIED items (annie's ruling, 2026-08-08).
 *
 * The vault's two-sense cards could not seed BARE discrimination items: the two-part screen forbids
 * a distractor correct in the other sense, which is exactly what a two-sense card offers. Carried,
 * the position reverses — the carrier sentence FIXES the part of speech, and the other sense stops
 * being a forbidden distractor and becomes the best trap available (`en-vocab-secondary-sense`).
 * "A child who knows `bark` only as a tree covering and meets it as a verb is exactly the child the
 * item should catch."
 *
 * Route (a) is these 18 Mode A cards (the two senses sit in DIFFERENT word classes, so the carrier
 * does real work). Route (b) — the 13 Mode B cards, whose broad tested sense leaves no clean
 * distractor space — needs purpose-authored discrimination cards and is authoring, not generation.
 *
 * TWO AUTHORING RULES, both learned in the SPaG district:
 *  · Every option is phrased in the SAME form as the key (all "to …", or all noun phrases), so the
 *    trap carries no grammatical give-away. A word-class cue would let a child answer without
 *    knowing the word — the vr-04 problem.
 *  · The TRAP is the other sense expressed in the tested form, which is precisely the child's
 *    error: she knows one sense and coerces it into the shape the sentence needs.
 */
import { randPick, type Tier } from '../maths/generator';
import type { SpagFamily, SpagItemDraft, SpagOption } from './spag-generator';

const SECONDARY = 'en-vocab-secondary-sense';
const WRONG = 'en-vocab-not-this-word'; // a gloss belonging to neither sense

export interface VocabItem {
  id: string;
  headword: string;
  tier: Tier;
  /** The carrier. It must fix the part of speech on its own. */
  carrier: string;
  /** The tested sense, glossed. */
  key: string;
  /** The OTHER sense, in the SAME form as the key — the keyed trap. */
  trap: string;
  /** Two glosses true of neither sense, in the same form. */
  wrong: [string, string];
}

export const VOCAB_BANK: VocabItem[] = [
  // T1
  { id: 'vc-bark', headword: 'bark', tier: 1, carrier: 'She pulled a strip of bark from the old oak tree.', key: 'the rough covering of a tree', trap: 'a short loud sound', wrong: ['a thin green leaf', 'a deep underground root'] },
  { id: 'vc-fair', headword: 'fair', tier: 1, carrier: 'The fair comes to our town every summer.', key: 'an event with rides and stalls', trap: 'a way of treating people equally', wrong: ['a weekly food market', 'a school sports day'] },
  // T2
  { id: 'vc-march', headword: 'march', tier: 2, carrier: 'Thousands joined the march through the city.', key: 'an organised walk to show a belief', trap: 'firm even steps in time', wrong: ['a loud brass band', 'a long city street'] },
  { id: 'vc-spring', headword: 'spring', tier: 2, carrier: 'The cat will spring onto the high wall.', key: 'to jump suddenly', trap: 'to arrive after winter', wrong: ['to sleep in the sun', 'to wash carefully'] },
  { id: 'vc-lean', headword: 'lean', tier: 2, carrier: 'The greyhound looked lean beside the other dogs.', key: 'thin, with little fat', trap: 'tilted to one side', wrong: ['fast over short distances', 'gentle with children'] },
  { id: 'vc-bolt', headword: 'bolt', tier: 2, carrier: 'The horse will bolt if the gate bangs shut.', key: 'to run off suddenly', trap: 'to slide a bar across a door', wrong: ['to stand very still', 'to walk in slow circles'] },
  { id: 'vc-spell', headword: 'spell', tier: 2, carrier: 'We had a long spell of wet weather.', key: 'a period of time', trap: 'the order of letters in a word', wrong: ['a heavy rain shower', 'a change in season'] },
  // T3
  { id: 'vc-plot', headword: 'plot', tier: 3, carrier: 'The rebels began to plot against the king.', key: 'to plan something secretly', trap: 'to tell the events of a story', wrong: ['to march in a line', 'to build a stone wall'] },
  { id: 'vc-subject', headword: 'subject', tier: 3, carrier: 'They should not subject anyone to that noise.', key: 'to make someone go through something', trap: 'to teach a school topic', wrong: ['to praise loudly', 'to invite politely'] },
  { id: 'vc-permit', headword: 'permit', tier: 3, carrier: 'You need a permit to park on this street.', key: 'an official paper giving a right', trap: 'an act of allowing something', wrong: ['a small parking fee', 'a printed street map'] },
  { id: 'vc-grant', headword: 'grant', tier: 3, carrier: 'The club won a grant for new equipment.', key: 'money given for a set purpose', trap: 'an act of allowing a request', wrong: ['a yearly club fee', 'a written thank-you note'] },
  { id: 'vc-counter', headword: 'counter', tier: 3, carrier: 'She was quick to counter his argument.', key: 'to answer with a different argument', trap: 'to serve at a shop desk', wrong: ['to count very carefully', 'to agree warmly'] },
  { id: 'vc-entrance', headword: 'entrance', tier: 3, carrier: 'The dancers entrance the whole audience.', key: 'to hold attention completely', trap: 'to walk in through a door', wrong: ['to teach a new step', 'to clap in time'] },
  { id: 'vc-tramp', headword: 'tramp', tier: 3, carrier: 'An old tramp sat quietly on the bench.', key: 'a person with no settled home', trap: 'a long tiring walk', wrong: ['a park keeper', 'a market trader'] },
  { id: 'vc-recount', headword: 'recount', tier: 3, carrier: 'The close election ended with a recount.', key: 'a second count to check the result', trap: 'a step-by-step telling', wrong: ['a public speech', 'a written report'] },
  // T4
  { id: 'vc-novel', headword: 'novel', tier: 4, carrier: 'The team tried a novel way of training.', key: 'new and different', trap: 'long and made-up', wrong: ['slow and careful', 'cheap and simple'] },
  { id: 'vc-warrant', headword: 'warrant', tier: 4, carrier: 'Those results warrant a much closer look.', key: 'to deserve a response', trap: 'to give police written permission', wrong: ['to delay a decision', 'to repeat a test'] },
  { id: 'vc-bait', headword: 'bait', tier: 4, carrier: 'Do not bait him about his team.', key: 'to say things to make someone angry', trap: 'to put out food to catch an animal', wrong: ['to cheer someone up', 'to explain a rule'] },
];

// The headword is NAMED in the stem: there is no bold/markup channel in an option-set item, so
// "the word in bold" would point at nothing.
const VOCAB_STEM = (headword: string, carrier: string): string => `What does the word "${headword}" mean in this sentence?  —  ${carrier}`;

/**
 * Satisfies SpagFamily so it runs on the same gates (child-facing, ranges, P3), but it is NOT one of
 * the thirteen SPaG families — it is the vocabulary-in-context piece.
 *
 * TIER = the headword's own vault tier. Flagged for the reviewer: for a vocabulary family the WORD
 * is the construct, so tiering by word difficulty is not "magnitude wearing a structural name" the
 * way a spelling word-length band was — but it is declared here rather than assumed.
 */
export const VOCAB_IN_CONTEXT: SpagFamily = {
  id: 'en-vocab-in-context',
  name: 'Vocabulary in context',
  subtype: 'cloze',
  franchise: SECONDARY,
  tierRule: (t) => (([1, 2, 3, 4] as Tier[]).includes(t) ? `Vocabulary in context — the sentence fixes the sense; the other sense of the same word is the trap. Headwords at tier ${t}.` : ''),
  structuralParams: (t) => ({ headwordTier: t }),
  numberRanges: () => ({ options: [4, 4] }),
  draft: (tier, r): SpagItemDraft => {
    const v = randPick(r, VOCAB_BANK.filter((x) => x.tier === tier));
    const opts: SpagOption[] = [
      { value: v.key, isKey: true },
      { value: v.trap, isKey: false, misconceptionId: SECONDARY },
      { value: v.wrong[0], isKey: false, misconceptionId: WRONG },
      { value: v.wrong[1], isKey: false, misconceptionId: WRONG },
    ];
    // Fisher–Yates on the seeded rng, so the key does not sit at A every time.
    for (let i = opts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(r() * (i + 1));
      [opts[i], opts[j]] = [opts[j]!, opts[i]!];
    }
    return { stem: VOCAB_STEM(v.headword, v.carrier), options: opts, params: { options: 4 }, dedupKey: v.id, diversityKey: v.headword };
  },
};
