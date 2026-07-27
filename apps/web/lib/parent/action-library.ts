/**
 * Authored support-action library (BUILD-PHASE-5 §4). One concrete thing a
 * parent can DO for each question type, in manifesto parent voice: plain
 * English, no eduspeak, assumes intelligence, never assumes UK-system
 * knowledge. Plain-English labels replace slugs everywhere parents look.
 */

export interface TypeSupport {
  /** Plain-English name — never the slug, never jargon. */
  label: string;
  /** ONE suggested action a busy parent can actually do. */
  action: string;
}

export const TYPE_SUPPORT: Record<string, TypeSupport> = {
  'vr-01-insert-letter': {
    label: 'Joining letters',
    action: 'On the school run, say a word pair like "crus_ / _ent" and ask which single letter finishes one word and starts the other.',
  },
  'vr-02-two-odd-ones-out': {
    label: 'Odd ones out',
    action: 'Name five things at dinner (three fruits, two chairs…) and ask which two do not belong — then swap roles and let them set one for you.',
  },
  'vr-03-related-words': {
    label: 'Word pairs',
    action: 'Play "kitten is to cat as puppy is to…?" in the car. Let them invent pairs for you too — inventing is the strongest practice.',
  },
  'vr-04-closest-meaning': {
    label: 'Closest meanings',
    action: 'When a big word comes up in a story, ask "what is another word that means nearly the same?" One word a day is plenty.',
  },
  'vr-05-hidden-word': {
    label: 'Hidden words',
    action: 'Write a short sentence and hunt together for a small word hiding across the join of two words ("the crab and…" hides BAND).',
  },
  'vr-06-missing-word': {
    label: 'Missing letters',
    action: 'Leave a three-letter gap in a word on the shopping list (CA__OT) and ask what little word fills it.',
  },
  'vr-07-letters-for-numbers': {
    label: 'Letter sums',
    action: 'Give letters pocket-money values (A=2p, B=5p…) and ask what a short word "costs". Two minutes, once or twice a week.',
  },
  'vr-08-move-letter': {
    label: 'Moving letters',
    action: 'Try "move one letter from PLANT to RAIN so both are real words" with fridge magnets or on paper — moving it physically is the trick.',
  },
  'vr-09-letter-series': {
    label: 'Letter patterns',
    action: 'Play the alphabet game in the car: pick a letter, jump 3 forward, then ask where the next jump lands.',
  },
  'vr-10-word-connections': {
    label: 'Word connections',
    action: 'Ask "how do these two go together?" about any pair you spot (captain/ship). Saying the rule out loud is the whole skill.',
  },
  'vr-11-number-series': {
    label: 'Number patterns',
    action: 'Count in jumps out loud together — 3, 6, 9… then jumps that grow: 2, 4, 7, 11. Ask what the jump is doing.',
  },
  'vr-12-compound-words': {
    label: 'Compound words',
    action: 'Pick a word like SUN and see how many real words you can build from it together (sunflower, sunshine…). Keep score casually.',
  },
  'vr-13-make-a-word': {
    label: 'Word building',
    action: 'Show how STAY and ARMY make STAR from their first two letters each, then let them build one for you to solve.',
  },
  'vr-14-letter-connections': {
    label: 'Letter jumps',
    action: 'Stick an A–Z strip on the fridge. Ask "B to E is a jump of 3 — where does the same jump from J land?"',
  },
  'vr-15-reading-information': {
    label: 'Clue puzzles',
    action: 'Tell a two-clue mystery at bedtime ("Amy is taller than Ben; Ben is taller than Cara — who is shortest?") and let them explain HOW they know.',
  },
  'vr-16-opposite-meaning': {
    label: 'Opposites',
    action: 'Call out a word while walking and ask for its true opposite — then ask "is that the exact reverse, or just different?"',
  },
  'vr-17-complete-the-sum': {
    label: 'Balancing sums',
    action: 'Say "both sides of the = sign must weigh the same, like scales" and try one missing-number sum on paper together.',
  },
  'vr-18-related-numbers': {
    label: 'Number rules',
    action: 'Give a triple like (3 [12] 9) and ask how the outside numbers make the middle one. One triple is enough per go.',
  },
  'vr-19-word-number-codes': {
    label: 'Word codes',
    action: 'Write a short word in a digit code (T=1, A=4, P=6 → TAP = 146) and ask them to decode another word using the same key.',
  },
  'vr-20-complete-the-word': {
    label: 'Finishing words',
    action: 'When reading together, cover one letter of a long word with a finger and ask what is hiding.',
  },
  'vr-21-same-meaning': {
    label: 'Word twins',
    action: 'Ask "could you swap these two words in a sentence?" — twins can swap, goes-together words cannot.',
  },
};

export function supportFor(questionTypeId: string): TypeSupport {
  return (
    TYPE_SUPPORT[questionTypeId] ?? {
      label: 'Detective work',
      action: 'Ask them to teach YOU how one puzzle type works — explaining it is the strongest practice there is.',
    }
  );
}

/** Root-family conversation prompts for the words widget (§4). */
export function wordConversationPrompt(headwords: string[], rootFamily: string | null): string {
  if (rootFamily) {
    const root = rootFamily.split('-')[1]?.toUpperCase() ?? '';
    return `Ask what ${headwords.slice(0, 2).join(' and ')} have in common — they share the ${root} root.`;
  }
  if (headwords.length >= 2) {
    return `Ask them to use ${headwords[0]} and ${headwords[1]} in one silly sentence at dinner.`;
  }
  return headwords.length === 1
    ? `Ask them to catch YOU using "${headwords[0]}" correctly this week.`
    : 'New words will appear here after the next warm-up.';
}
