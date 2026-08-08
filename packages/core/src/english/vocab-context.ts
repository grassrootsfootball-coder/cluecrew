/**
 * VOCABULARY IN CONTEXT — route (a), the CARRIED items (annie, 2026-08-08).
 *
 * The vault's two-sense cards could not seed BARE discrimination items: the two-part screen forbids
 * a distractor correct in the other sense, which is exactly what a two-sense card offers. Carried,
 * the position reverses — the carrier FIXES the part of speech, and the other sense becomes the best
 * trap available (`en-vocab-secondary-sense`).
 *
 * THE SENSE FLIP (annie's ruling, 2026-08-08). An earlier build tested the LESS-familiar sense in 16
 * of 18 items, at every tier. That is not merely a flat difficulty axis: it means the family only
 * ever asked "do you know the second meaning?", when the skill it is named for is **letting the
 * sentence tell you which meaning is live**. A child who learned that these items are always about
 * the odd meaning scored 16/18 without reading a sentence — the vr-04 shortcut inside the family's
 * own mechanism. So:
 *   · **T1–T2 test the FAMILIAR sense**, with the rarer sense as the trap. `She heard the dog bark
 *     across the field.` — key is the sound, trap is the tree covering. The trick-learner gets it
 *     wrong, which is right: she is guessing rather than reading.
 *   · **T3–T4 test the LESS-FAMILIAR sense**, as before.
 * That gives TWO declared variables — headword rarity, and which sense is tested — and the flip is
 * CHECKABLE against the vault's `likelierKnown` rather than declared.
 *
 * TIER is a function of both, with the SENSE picking the half and the RARITY picking within it:
 * familiar → T1 (common headword) or T2 (rarer); rare → T3 (common) or T4 (rarer). So one card yields
 * TWO items at DIFFERENT tiers, the flip is mechanically checkable (tier <= 2 iff familiar), and the
 * ceiling RISES rather than falls — the only fix in this district that made a family bigger.
 *
 * NOTE the tension this resolves, flagged to the reviewer: her stated rule (T1–T2 familiar, T3–T4
 * rare) and her per-card asides (`bark` rare at T2, `warrant` familiar at T3) cannot both hold. The
 * stated rule is implemented, because it is the one that makes the flip checkable; the cost is that
 * `bark`-rare sits at T3 though tree-bark is well known, and `warrant`-familiar at T2 though the word
 * is not. Per-card judgement would place those better but cannot be verified.
 *
 * SERVING CONDITION (same shape as comma's mirrored pairs): the two items from one card share a
 * `pairId` and MUST NOT reach the same child. Meeting both teaches the trick rather than the skill.
 *
 * OPTION-FORM RULE: every option is phrased in the SAME form as the key (all "to …", all noun
 * phrases, all adjective phrases). A form mismatch lets a child answer — or eliminate the trap —
 * without knowing the word. Audited mechanically, in both directions.
 */
import { randPick, type Tier } from '../maths/generator';
import type { SpagFamily, SpagItemDraft, SpagOption } from './spag-generator';

const SECONDARY = 'en-vocab-secondary-sense';
const WRONG = 'en-vocab-not-this-word';

export interface VocabItem {
  id: string;
  /** The two items cut from one card. Never serve both to one child. */
  pairId: string;
  headword: string;
  /** Declared variable 1 — the headword's own vault tier. */
  headwordRarity: Tier;
  /** Declared variable 2 — which sense the carrier makes live. */
  testedSense: 'familiar' | 'rare';
  carrier: string;
  key: string;
  /** The OTHER sense, in the SAME form as the key — the keyed trap. */
  trap: string;
  wrong: [string, string];
}

/** Tier from BOTH declared variables, so the ladder is visible rather than inferred. */
export const vocabTier = (v: Pick<VocabItem, 'headwordRarity' | 'testedSense'>): Tier => {
  // The SENSE picks the half (annie's ruling: T1–T2 familiar, T3–T4 rare) and the RARITY picks
  // within it. Both variables visible, and the flip is checkable: tier <= 2 iff familiar.
  const lowRarity = v.headwordRarity <= 2;
  if (v.testedSense === 'familiar') return (lowRarity ? 1 : 2) as Tier;
  return (lowRarity ? 3 : 4) as Tier;
};

const card = (
  pairId: string, headword: string, headwordRarity: Tier,
  fam: { carrier: string; key: string; trap: string; wrong: [string, string] },
  rare: { carrier: string; key: string; trap: string; wrong: [string, string] },
): VocabItem[] => [
  { id: `${pairId}-fam`, pairId, headword, headwordRarity, testedSense: 'familiar', ...fam },
  { id: `${pairId}-rare`, pairId, headword, headwordRarity, testedSense: 'rare', ...rare },
];

export const VOCAB_BANK: VocabItem[] = [
  ...card('vc-bark', 'bark', 1,
    { carrier: 'She heard the dog bark across the field.', key: 'to make a short loud sound', trap: 'to strip the covering from a tree', wrong: ['to run in wide circles', 'to dig near the fence'] },
    { carrier: 'She pulled a strip of bark from the old oak tree.', key: 'the rough covering of a tree', trap: 'a short loud sound', wrong: ['a thin green leaf', 'a deep underground root'] }),
  ...card('vc-fair', 'fair', 1,
    { carrier: 'The referee was fair to both teams.', key: 'even-handed with everyone', trap: 'full of rides and stalls', wrong: ['quick to lose his temper', 'new to the whole game'] },
    { carrier: 'The fair comes to our town every summer.', key: 'an event with rides and stalls', trap: 'a way of treating people equally', wrong: ['a weekly food market', 'a school sports day'] }),
  ...card('vc-march', 'march', 2,
    { carrier: 'The soldiers march past the gate each morning.', key: 'to walk with firm even steps', trap: 'to join a protest walk', wrong: ['to ride along in a line', 'to stand in silence'] },
    { carrier: 'Thousands joined the march through the city.', key: 'an organised walk to show a belief', trap: 'firm even steps in time', wrong: ['a loud brass band', 'a long city street'] }),
  ...card('vc-spring', 'spring', 2,
    { carrier: 'In spring the garden fills with flowers.', key: 'the season after winter', trap: 'a sudden jump', wrong: ['a heavy rainstorm', 'a narrow garden path'] },
    { carrier: 'The cat will spring onto the high wall.', key: 'to jump suddenly', trap: 'to arrive after winter', wrong: ['to sleep in the sun', 'to wash carefully'] }),
  ...card('vc-lean', 'lean', 2,
    { carrier: 'He will lean the ladder against the wall.', key: 'to rest at an angle', trap: 'to make something thinner', wrong: ['to carry with both hands', 'to paint in stripes'] },
    { carrier: 'The greyhound looked lean beside the other dogs.', key: 'thin, with little fat', trap: 'tilted to one side', wrong: ['fast over short distances', 'gentle with children'] }),
  ...card('vc-bolt', 'bolt', 2,
    { carrier: 'She slid the bolt across the door.', key: 'a metal bar that holds a door shut', trap: 'a sudden run away', wrong: ['a small brass key', 'a smooth wooden handle'] },
    { carrier: 'The horse will bolt if the gate bangs shut.', key: 'to run off suddenly', trap: 'to slide a bar across a door', wrong: ['to stand very still', 'to walk in slow circles'] }),
  ...card('vc-spell', 'spell', 2,
    { carrier: 'Can you spell your surname for me?', key: 'to say the letters in order', trap: 'to last for a period of time', wrong: ['to write very neatly', 'to repeat out loud'] },
    { carrier: 'We had a long spell of wet weather.', key: 'a period of time', trap: 'the order of letters in a word', wrong: ['a heavy rain shower', 'a change in season'] }),
  ...card('vc-plot', 'plot', 3,
    { carrier: 'The plot of the film confused everyone.', key: 'the events of a story in order', trap: 'a secret plan against someone', wrong: ['a list of the actors', 'a piece of background music'] },
    { carrier: 'The rebels began to plot against the king.', key: 'to plan something secretly', trap: 'to tell the events of a story', wrong: ['to march in a line', 'to build a stone wall'] }),
  ...card('vc-subject', 'subject', 3,
    { carrier: 'History is her favourite subject.', key: 'an area you learn about at school', trap: 'something forced upon a person', wrong: ['a large school building', 'a friendly class teacher'] },
    { carrier: 'They should not subject anyone to that noise.', key: 'to make someone go through something', trap: 'to teach a school topic', wrong: ['to praise loudly', 'to invite politely'] }),
  ...card('vc-permit', 'permit', 3,
    { carrier: 'The rules do not permit dogs in here.', key: 'to allow something to happen', trap: 'to hand over an official paper', wrong: ['to charge a small fee', 'to open the doors early'] },
    { carrier: 'You need a permit to park on this street.', key: 'an official paper giving a right', trap: 'an act of allowing something', wrong: ['a small parking fee', 'a printed street map'] }),
  ...card('vc-grant', 'grant', 3,
    { carrier: 'The council will grant her request.', key: 'to let someone have what they asked for', trap: 'to pay out money for a set purpose', wrong: ['to delay a decision', 'to explain a rule'] },
    { carrier: 'The club won a grant for new equipment.', key: 'money given for a set purpose', trap: 'an act of allowing a request', wrong: ['a yearly club fee', 'a written thank-you note'] }),
  ...card('vc-counter', 'counter', 3,
    { carrier: 'He put the coins on the counter.', key: 'the flat top where you are served', trap: 'an argument answering another', wrong: ['a large shopping basket', 'a printed paper receipt'] },
    { carrier: 'She was quick to counter his argument.', key: 'to answer with a different argument', trap: 'to serve at a shop desk', wrong: ['to count very carefully', 'to agree warmly'] }),
  ...card('vc-entrance', 'entrance', 3,
    { carrier: 'We waited by the entrance to the hall.', key: 'the way into a place', trap: 'a hold on someone’s attention', wrong: ['a long patient queue', 'a narrow side window'] },
    { carrier: 'The dancers entrance the whole audience.', key: 'to hold attention completely', trap: 'to walk in through a door', wrong: ['to teach a new step', 'to clap in time'] }),
  ...card('vc-tramp', 'tramp', 3,
    { carrier: 'They tramp home through the deep mud.', key: 'to walk a long way with heavy steps', trap: 'to live without a settled home', wrong: ['to run in short bursts', 'to climb a steep hill'] },
    { carrier: 'An old tramp sat quietly on the bench.', key: 'a person with no settled home', trap: 'a long tiring walk', wrong: ['a park keeper', 'a market trader'] }),
  ...card('vc-recount', 'recount', 3,
    { carrier: 'He will recount what happened at the match.', key: 'to tell what happened step by step', trap: 'to count again to check a total', wrong: ['to argue about a result', 'to write a short note'] },
    { carrier: 'The close election ended with a recount.', key: 'a second count to check the result', trap: 'a step-by-step telling', wrong: ['a public speech', 'a written report'] }),
  ...card('vc-novel', 'novel', 4,
    { carrier: 'She read the novel in two days.', key: 'a long made-up story in a book', trap: 'a new and different idea', wrong: ['a short rhyming poem', 'a written school report'] },
    { carrier: 'The team tried a novel way of training.', key: 'new and different', trap: 'long and made-up', wrong: ['slow and careful', 'cheap and simple'] }),
  ...card('vc-warrant', 'warrant', 4,
    { carrier: 'The police arrived with a warrant.', key: 'an official paper allowing a search', trap: 'a good reason for a response', wrong: ['a written final warning', 'a printed parking ticket'] },
    { carrier: 'Those results warrant a much closer look.', key: 'to deserve a response', trap: 'to give police written permission', wrong: ['to delay a decision', 'to repeat a test'] }),
  ...card('vc-bait', 'bait', 4,
    { carrier: 'He put fresh bait on the hook.', key: 'food used to catch an animal', trap: 'a remark meant to annoy', wrong: ['a length of strong line', 'a small metal weight'] },
    { carrier: 'Do not bait him about his team.', key: 'to say things to make someone angry', trap: 'to put out food to catch an animal', wrong: ['to cheer someone up', 'to explain a rule'] }),
];

// The headword is NAMED in the stem: an option-set item has no bold/markup channel, so "the word in
// bold" would point at nothing.
const VOCAB_STEM = (headword: string, carrier: string): string => `What does the word "${headword}" mean in this sentence?  —  ${carrier}`;

/**
 * Satisfies SpagFamily so it runs the same gates (child-facing, ranges, P3), but it is NOT one of the
 * thirteen SPaG families — it is the vocabulary-in-context piece.
 */
export const VOCAB_IN_CONTEXT: SpagFamily = {
  id: 'en-vocab-in-context',
  name: 'Vocabulary in context',
  subtype: 'cloze',
  franchise: SECONDARY,
  tierRule: (t) => {
    const sense = t <= 2 ? 'the FAMILIAR sense (the rarer one is the trap)' : 'the LESS-FAMILIAR sense';
    return ([1, 2, 3, 4] as Tier[]).includes(t) ? `Vocabulary in context — the sentence fixes which meaning is live. At tier ${t} the item tests ${sense}.` : '';
  },
  // Both declared variables, so the ladder is visible rather than inferred.
  structuralParams: (t) => ({ testedSense: t <= 2 ? 'familiar' : 'rare', headwordRarityBand: t <= 2 ? 'lower' : 'higher' }),
  numberRanges: () => ({ options: [4, 4] }),
  draft: (tier, r): SpagItemDraft => {
    const v = randPick(r, VOCAB_BANK.filter((x) => vocabTier(x) === tier));
    const opts: SpagOption[] = [
      { value: v.key, isKey: true },
      { value: v.trap, isKey: false, misconceptionId: SECONDARY },
      { value: v.wrong[0], isKey: false, misconceptionId: WRONG },
      { value: v.wrong[1], isKey: false, misconceptionId: WRONG },
    ];
    for (let i = opts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(r() * (i + 1));
      [opts[i], opts[j]] = [opts[j]!, opts[i]!];
    }
    return { stem: VOCAB_STEM(v.headword, v.carrier), options: opts, params: { options: 4 }, dedupKey: v.id, diversityKey: v.pairId };
  },
};
