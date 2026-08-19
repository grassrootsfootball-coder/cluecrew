/**
 * WHAT EACH VOCABULARY BANK IS FOR, DECLARED — before any frequency signal runs (Annie's ruling,
 * 2026-08-19 — R323).
 *
 * **THE SAME NUMBER MEANS OPPOSITE THINGS IN TWO BANKS.** `vr-04`'s construct is
 * **decode-the-hard-word**: the child meets a rare headword and finds the common word that matches
 * it, so **a key rarer than its stem is a fault** — the item has asked her to decode twice.
 * `vr-21`'s construct is **recognise-the-rarer-synonym**: the child meets a common word and finds
 * the less common one that means the same, so **the identical relation is the point.**
 *
 * **WITHOUT THIS DECLARATION A FREQUENCY SIGNAL READS AGAINST NO STATED EXPECTATION** and would
 * condemn one bank and endorse another for the same measurement. That is worse than no signal: a
 * number with no direction looks like evidence and is a coin toss.
 *
 * **THE DECLARATION IS A FACT ABOUT THE CONSTRUCT, so it lives with the construct** — beside
 * `WORDS_ROLE_BY_TYPE`, in core, read by every check rather than restated in each. An undeclared
 * bank **refuses** rather than defaulting: `expectedDirection` returns null and any check consuming
 * it must stop (R299).
 */

export type KeyDirection =
  /** The key should be COMMONER than the stem. Key-rarer is a fault. */
  | 'key-commoner-than-stem'
  /** The key should be RARER than the stem. Key-rarer is the point. */
  | 'key-rarer-than-stem'
  /** The relation carries no expectation — difficulty sits elsewhere in the construct. */
  | 'no-expectation';

export interface BankDirection {
  questionTypeId: string;
  construct: string;
  direction: KeyDirection;
  ruledBy: string;
  /** What a frequency difference in the WRONG direction means for this bank. */
  faultReads: string;
}

export const BANK_DIRECTIONS: readonly BankDirection[] = [
  {
    questionTypeId: 'vr-04-closest-meaning',
    construct: 'decode the hard word: a rare headword, and the common word that matches it',
    direction: 'key-commoner-than-stem',
    ruledBy: 'annie, 2026-08-19',
    faultReads: 'a key RARER than its stem asks the child to decode twice — the fault found on obedient -> dutiful and exhausted -> tired',
  },
  {
    questionTypeId: 'vr-21-same-meaning',
    construct: 'recognise the rarer synonym: a common word, and the less common word that means the same',
    direction: 'key-rarer-than-stem',
    ruledBy: 'annie, 2026-08-19',
    faultReads: 'a key COMMONER than its stem makes the item trivial — the relation vr-04 treats as a fault is this bank\'s whole point',
  },
  // vr-16-opposite-meaning is DELIBERATELY ABSENT. See `UNDECLARED_BANKS`.
];

/**
 * Banks carrying `stem.words[]` with no declared direction, and why. **Named rather than omitted**,
 * so an absence is a recorded state instead of a gap somebody has to notice.
 */
export const UNDECLARED_BANKS: readonly { questionTypeId: string; why: string }[] = [
  {
    questionTypeId: 'vr-16-opposite-meaning',
    why: 'NOT MEASURABLE AND NOT ASSUMED. Its construct is antonymy, where the difficulty may sit in the RELATION rather than in either word\'s rarity — so the direction is a genuine question, not an oversight. The vault cannot settle it: 24 of its 25 pairs have no card for the key, so the tier signal reports on one pair. The 25 pairs are staged for her ruling.',
  },
];

const BY_TYPE = new Map(BANK_DIRECTIONS.map((d) => [d.questionTypeId, d]));

/** Null when the bank has no declared direction. A caller must refuse, never assume. */
export function expectedDirection(questionTypeId: string): BankDirection | null {
  return BY_TYPE.get(questionTypeId) ?? null;
}

/**
 * Given a tier delta (key minus stem), does it run WITH or AGAINST this bank's construct?
 * Returns null when the bank is undeclared — the caller stops rather than guessing.
 */
export function readsAsFault(questionTypeId: string, tierDelta: number): boolean | null {
  const d = expectedDirection(questionTypeId);
  if (!d) return null;
  if (d.direction === 'no-expectation' || tierDelta === 0) return false;
  return d.direction === 'key-commoner-than-stem' ? tierDelta > 0 : tierDelta < 0;
}
