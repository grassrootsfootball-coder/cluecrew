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
  // FLOOR IS T2 (annie, 2026-08-08). Familiar-sense items all sit at T2; rare-sense items at T3
  // (common headword) or T4 (rarer). The flip stays checkable — tier <= 2 iff familiar — and the
  // GUARD is the second checkable condition: a familiar item exists only where the headword itself
  // is within reach, i.e. vault tier <= 2. See VOCAB_GUARD_OK.
  if (v.testedSense === 'familiar') return 2;
  return (v.headwordRarity <= 2 ? 3 : 4) as Tier;
};

/** The guard: a card may carry a FAMILIAR-sense item only if the headword is within reach at T2. */
export const VOCAB_GUARD_OK = (headwordRarity: Tier): boolean => headwordRarity <= 2;

/** A card whose headword fails the guard: it contributes its RARE-sense item only. */
const rareOnly = (
  pairId: string, headword: string, headwordRarity: Tier,
  rare: { carrier: string; key: string; trap: string; wrong: [string, string] },
): VocabItem[] => [{ id: `${pairId}-rare`, pairId, headword, headwordRarity, testedSense: 'rare', ...rare }];

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
    { carrier: 'She heard the dog bark across the field.', key: 'to make a short loud sound', trap: 'to strip the covering from a tree', wrong: ['to whine unhappily', 'to growl low and long'] },
    { carrier: 'She pulled a strip of bark from the old oak tree.', key: 'the rough covering of a tree', trap: 'a short loud sound', wrong: ['a thin green leaf', 'a piece of dry moss'] }),
  ...card('vc-fair', 'fair', 1,
    { carrier: 'The referee was fair to both teams.', key: 'even-handed with everyone', trap: 'full of rides and stalls', wrong: ['quick to lose his temper', 'new to the whole game'] },
    { carrier: 'The fair comes to our town every summer.', key: 'an event with rides and stalls', trap: 'a way of treating people equally', wrong: ['a weekly food market', 'a school sports day'] }),
  ...card('vc-march', 'march', 2,
    { carrier: 'The soldiers march past the gate each morning.', key: 'to walk with firm even steps', trap: 'to join a protest walk', wrong: ['to ride along in a line', 'to stand in silence'] },
    { carrier: 'Thousands joined the march through the city.', key: 'an organised walk to show a belief', trap: 'firm even steps in time', wrong: ['a loud brass band', 'a public celebration'] }),
  ...card('vc-spring', 'spring', 2,
    { carrier: 'In spring the garden fills with flowers.', key: 'the season after winter', trap: 'a sudden jump', wrong: ['the early morning', 'a sunny week'] },
    { carrier: 'The cat will spring onto the high wall.', key: 'to jump suddenly', trap: 'to arrive after winter', wrong: ['to climb up slowly', 'to settle down quietly'] }),
  ...card('vc-lean', 'lean', 2,
    { carrier: 'He will lean the ladder against the wall.', key: 'to rest at an angle', trap: 'to make something thinner', wrong: ['to chain up securely', 'to fold away neatly'] },
    { carrier: 'The greyhound looked lean beside the other dogs.', key: 'thin, with little fat', trap: 'tilted to one side', wrong: ['fast over short distances', 'gentle with children'] }),
  ...card('vc-bolt', 'bolt', 2,
    { carrier: 'She slid the bolt across the door.', key: 'a metal bar that holds a door shut', trap: 'a sudden run away', wrong: ['a small brass key', 'a smooth wooden handle'] },
    { carrier: 'The horse will bolt if the gate bangs shut.', key: 'to run off suddenly', trap: 'to slide a bar across a door', wrong: ['to stand very still', 'to walk in slow circles'] }),
  ...card('vc-spell', 'spell', 2,
    { carrier: 'Can you spell your surname for me?', key: 'to say the letters in order', trap: 'to last for a period of time', wrong: ['to write very neatly', 'to repeat out loud'] },
    { carrier: 'We had a long spell of wet weather.', key: 'a period of time', trap: 'the order of letters in a word', wrong: ['a heavy rain shower', 'a change in season'] }),
  ...rareOnly('vc-plot', 'plot', 3,
    { carrier: 'The rebels began to plot against the king.', key: 'to plan something secretly', trap: 'to tell the events of a story', wrong: ['to march in a line', 'to speak out openly'] }),
  ...rareOnly('vc-subject', 'subject', 3,
    { carrier: 'They should not subject anyone to that noise.', key: 'to make someone go through something', trap: 'to teach a school topic', wrong: ['to invite someone politely', 'to wake someone suddenly'] }),
  ...rareOnly('vc-permit', 'permit', 3,
    { carrier: 'You need a permit to park on this street.', key: 'an official paper giving a right', trap: 'an act of allowing something', wrong: ['a small parking fee', 'a printed street map'] }),
  ...rareOnly('vc-grant', 'grant', 3,
    { carrier: 'The club won a grant for new equipment.', key: 'money given for a set purpose', trap: 'an act of allowing a request', wrong: ['a place in the final', 'a set of donated shirts'] }),
  ...rareOnly('vc-counter', 'counter', 3,
    { carrier: 'She was quick to counter his argument.', key: 'to answer with a different argument', trap: 'to serve at a shop desk', wrong: ['to repeat word for word', 'to agree warmly'] }),
  ...rareOnly('vc-entrance', 'entrance', 3,
    { carrier: 'The dancers entrance the whole audience.', key: 'to hold attention completely', trap: 'to walk in through a door', wrong: ['to tire out completely', 'to surprise completely'] }),
  ...rareOnly('vc-tramp', 'tramp', 3,
    { carrier: 'An old tramp sat quietly on the bench.', key: 'a person with no settled home', trap: 'a long tiring walk', wrong: ['a park keeper', 'a market trader'] }),
  ...rareOnly('vc-recount', 'recount', 3,
    { carrier: 'The close election ended with a recount.', key: 'a second count to check the result', trap: 'a step-by-step telling', wrong: ['a public speech', 'a written report'] }),
  ...rareOnly('vc-novel', 'novel', 4,
    { carrier: 'The team tried a novel way of training.', key: 'new and different', trap: 'long and made-up', wrong: ['slow and careful', 'cheap and simple'] }),
  ...rareOnly('vc-warrant', 'warrant', 4,
    { carrier: 'Those results warrant a much closer look.', key: 'to deserve a response', trap: 'to give police written permission', wrong: ['to allow at last', 'to delay until later'] }),
  ...rareOnly('vc-bait', 'bait', 4,
    { carrier: 'Do not bait him about his team.', key: 'to say things to make someone angry', trap: 'to put out food to catch an animal', wrong: ['to cheer someone up', 'to ask questions about'] }),
  // The five remaining Mode A cards. `hollow` and `charge` clear the guard and so carry a familiar
  // item too — worth building on their own, since the familiar half is where the shortage is.
  ...card('vc-hollow', 'hollow', 1,
    { carrier: 'The old tree was completely hollow inside.', key: 'empty inside', trap: 'shaped like a dip in the ground', wrong: ['rotten right through', 'damp and very dark'] },
    { carrier: 'Sheep sheltered in a hollow on the hillside.', key: 'a dip in the ground', trap: 'an empty space inside something', wrong: ['a low stone wall', 'a narrow winding path'] }),
  ...card('vc-charge', 'charge', 2,
    { carrier: 'There is a small charge for parking here.', key: 'an amount you must pay', trap: 'a sudden rush forward', wrong: ['a printed paper receipt', 'a marked parking space'] },
    { carrier: 'The bull will charge at anything red.', key: 'to run straight at full speed', trap: 'to ask someone for payment', wrong: ['to stare angrily', 'to paw the ground'] }),
  ...rareOnly('vc-contest', 'contest', 3,
    { carrier: "They will contest the referee's decision.", key: 'to argue that something is wrong', trap: 'to take part in a competition', wrong: ['to explain a rule clearly', 'to accept a result calmly'] }),
  ...rareOnly('vc-desert', 'desert', 3,
    { carrier: 'He would never desert his friends.', key: 'to leave someone you should have helped', trap: 'to travel across dry empty land', wrong: ['to argue with a friend', 'to visit someone often'] }),
  ...rareOnly('vc-dispute', 'dispute', 3,
    { carrier: 'She will dispute the final score.', key: 'to say openly that something is wrong', trap: 'to quarrel with someone', wrong: ['to record a result', 'to agree very quickly'] }),
  // ROUTE (b) PROBE — three Mode B cards (annie, 2026-08-08). Mode B was rejected for BARE cards
  // because the FAMILIAR sense is broad and has no clean distractor space. The RARE sense is narrow
  // and does, so these carry a rare-sense item only — the same shape as a guard-failing Mode A card.
  ...rareOnly('vc-dear', 'dear', 3,
    { carrier: 'The trainers were far too dear for his savings.', key: 'far too expensive', trap: 'loved very much', wrong: ['hard to find in his size', 'sold out until spring'] }),
  ...rareOnly('vc-mature', 'mature', 3,
    { carrier: 'The apples are mature and ready to pick.', key: 'fully grown and ready', trap: 'sensible and thoughtful', wrong: ['sweet to taste', 'heavy on the branch'] }),
  ...rareOnly('vc-superior', 'superior', 3,
    { carrier: 'She gave a superior smile and turned away.', key: 'proud and looking down on others', trap: 'better than another of the same kind', wrong: ['quick and nervous', 'faint and tired'] }),
  // ROUTE (b), the remaining Mode B cards — rare-sense ONLY (their familiar sense is the broad one
  // with no clean distractor space, which is why they were rejected for bare cards). Fillers honour
  // vr-04's forbidden-distractor list for each headword. FOUR of the ten are HELD: genuine, passive,
  // valid and animated have a `likelierKnown` that looks inverted (passive claims the GRAMMAR sense
  // is the likelier — implausible for Year 5), and building them would test the FAMILIAR sense while
  // labelling it rare, which is the exact thing the flip prevents.
  ...rareOnly('vc-bold', 'bold', 2,
    { carrier: 'Put the heading in bold so it stands out.', key: 'printed in thick dark letters', trap: 'brave enough to dare', wrong: ['written in capital letters', 'underlined twice for effect'] }),
  ...rareOnly('vc-flexible', 'flexible', 2,
    { carrier: 'Our coach is flexible about training times.', key: 'willing to change plans', trap: 'able to bend without breaking', wrong: ['strict about being punctual', 'new to the whole club'] }),
  ...rareOnly('vc-ambitious', 'ambitious', 3,
    { carrier: 'Repainting the whole school in one weekend was ambitious.', key: 'big and hard to finish', trap: 'eager to do well', wrong: ['badly planned from the start', 'cheaper than everyone expected'] }),
  ...rareOnly('vc-humble', 'humble', 3,
    { carrier: 'The restaurant began as a humble van on the seafront.', key: 'small and not grand', trap: 'not boasting about yourself', wrong: ['busy from the first day', 'run by two brothers'] }),
  ...rareOnly('vc-noble', 'noble', 3,
    // Carrier changed to a PERSON: an *act* cannot be aristocratic, so the trap was eliminable on
    // sense as well as form. A man can be either kind of noble, so both senses stay live.
    { carrier: 'He was a noble man who gave up his place.', key: 'brave and good', trap: 'born into a titled family', wrong: ['quiet and very modest', 'well known in the town'] }),
  ...rareOnly('vc-outrageous', 'outrageous', 3,
    { carrier: 'She wore an outrageous hat to the wedding.', key: 'very unusual, so people stare', trap: 'so unfair it makes people angry', wrong: ['borrowed just for the day', 'far too small for her'] }),
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
