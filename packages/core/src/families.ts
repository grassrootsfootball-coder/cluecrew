/**
 * The 21 question types → five mechanic families (BUILD-PHASE-4 §2).
 * We build five interaction engines, not twenty-one; each type is a
 * configuration of one family. The QuestionType registry is the source of
 * truth for slugs; this map is the rendering router.
 */
export const MECHANIC_FAMILIES = ['code', 'stowaway', 'wordweb', 'bridge', 'deduction'] as const;
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
};

export function familyForType(questionTypeId: string): MechanicFamily {
  return FAMILY_BY_TYPE[questionTypeId] ?? 'wordweb';
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
};
