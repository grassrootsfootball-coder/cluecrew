/**
 * The 21 question types → five mechanic families (BUILD-PHASE-4 §2).
 * We build five interaction engines, not twenty-one; each type is a
 * configuration of one family. The QuestionType registry is the source of
 * truth for slugs; this map is the rendering router.
 */
export const MECHANIC_FAMILIES = ['code', 'stowaway', 'wordweb', 'bridge', 'deduction',
  // The English comprehension district. A sixth family because it is a genuinely different
  // interaction: a passage on screen with the question read against it, not a tile of options.
  'comprehension',
  // SPaG. `cloze` is a select-one and needs no new renderer; `errorspot` needs the only genuinely
  // new interaction in the district — the options ARE the sentence, in order.
  'cloze', 'errorspot'] as const;
export type MechanicFamily = (typeof MECHANIC_FAMILIES)[number];

export const FAMILY_BY_TYPE: Record<string, MechanicFamily> = {
  'vr-01-insert-letter': 'stowaway',
  'vr-02-two-odd-ones-out': 'wordweb',
  'vr-03-related-words': 'bridge',
  'vr-04-closest-meaning': 'wordweb',
  'vr-05-hidden-word': 'stowaway',
  'vr-06-missing-word': 'stowaway',
  'vr-07-letters-for-numbers': 'code',
  'vr-08-move-letter': 'stowaway',
  'vr-09-letter-series': 'code',
  'vr-10-word-connections': 'bridge',
  'vr-11-number-series': 'code',
  'vr-12-compound-words': 'wordweb',
  'vr-13-make-a-word': 'wordweb',
  'vr-14-letter-connections': 'bridge',
  'vr-15-reading-information': 'deduction',
  'vr-16-opposite-meaning': 'wordweb',
  'vr-17-complete-the-sum': 'code',
  'vr-18-related-numbers': 'code',
  'vr-19-word-number-codes': 'code',
  'vr-20-complete-the-word': 'stowaway',
  'vr-21-same-meaning': 'wordweb',
  // THE ENGLISH COMPREHENSION DISTRICT. Absent until 2026-08-16, so all four types fell through
  // `?? 'wordweb'` and 371 items would have rendered as synonym tiles — silently, because a default
  // that substitutes a different question type reports nothing.
  'en-comp-retrieval': 'comprehension',
  'en-comp-inference': 'comprehension',
  'en-comp-vocab': 'comprehension',
  'en-comp-technique': 'comprehension',
  // THE SPaG DISTRICT. Two families, not three: `punct-spot` and `spelling-spot` are the SAME
  // interaction — a sentence split across the options with an N verdict — differing only in which
  // mistake class the stem names. Cloze is a different interaction: the sentence is in the stem
  // with a gap, and the options are candidate fillers.
  'en-spag-cloze': 'cloze',
  'en-spag-punct-spot': 'errorspot',
  'en-spag-spelling-spot': 'errorspot',
};

/**
 * NO DEFAULT (David's ruling, 2026-08-16). This returned `?? 'wordweb'`, so an unmapped question type
 * did not fail — it became a DIFFERENT QUESTION TYPE, and the child got a synonym tile where a
 * comprehension question should have been. **A default that silently substitutes a different question
 * type is worse than a crash**: the crash is visible in the first minute, and the substitution is
 * visible only to the child sitting in front of it.
 *
 * Callers that must tolerate an unknown type ask `familyForTypeOrNull` and handle the null.
 */
export function familyForType(questionTypeId: string): MechanicFamily {
  const family = FAMILY_BY_TYPE[questionTypeId];
  if (!family) {
    throw new Error(`no mechanic family for question type '${questionTypeId}'. Add it to FAMILY_BY_TYPE `
      + '— it must not silently become another type.');
  }
  return family;
}

/** For callers that genuinely may see an unmapped type and must decide for themselves. */
export function familyForTypeOrNull(questionTypeId: string): MechanicFamily | null {
  return FAMILY_BY_TYPE[questionTypeId] ?? null;
}

/** The Alphabet Rail appears in these families' Case mode (§3), never Plain. */
export function railAvailable(family: MechanicFamily, questionTypeId: string): boolean {
  if (family === 'code') return true;
  return family === 'stowaway' && ['vr-08-move-letter', 'vr-01-insert-letter'].includes(questionTypeId);
}

/**
 * Authored feedback affirmations, per family — praise the method, never the
 * child's smartness (§4). Rotated by attempt count; all vocab-scanned.
 */
export const FAMILY_AFFIRMATIONS: Record<MechanicFamily, string[]> = {
  code: ['You tracked the pattern!', 'You cracked the code, step by step!', 'You counted the jumps like a pro!'],
  stowaway: ['You spotted exactly where the letter belongs!', 'You found the stowaway!', 'You read the word both ways — smart detective work!'],
  wordweb: ['You weighed up the meanings!', 'You sorted those words like an expert!', 'You matched the meaning, not just the look!'],
  bridge: ['You worked out how the pair connects!', 'You built the bridge before you crossed it!', 'You found the relationship — that is the whole trick!'],
  deduction: ['You followed the clues carefully!', 'You ruled things out one by one!', 'You used only what the clues really say!'],
  // Comprehension praises going BACK TO THE LINES, which is the method every one of its
  // misconceptions is a failure to use. Reading age <=9, vocab-scanned like the rest.
  comprehension: ['You went back to the lines!', 'You checked what the passage really says!', 'You read it again before you chose!'],
  cloze: ['You listened to how the whole sentence sounds!', 'You tried it in the gap before you chose!', 'You matched the tense!'],
  errorspot: ['You found the part that was wrong!', 'You checked every part before you chose!', 'You read it right to the end!'],
};
