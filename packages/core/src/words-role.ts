/**
 * WHAT `stem.words[]` IS FOR, DECLARED — because it is doing three jobs and the tier requirement
 * only belongs to one of them (Annie's rule, David's split, 2026-08-19 — R294).
 *
 * **HER RULE SURVIVES THE SPLIT; ONLY ITS POPULATION MOVES.** *A headword served to a child must
 * carry a tier* is right. Enforced against `stem.words[]` as a whole it refuses 25
 * `vr-12-compound-words` items over "tooth", "rain" and "butter" — **words nobody would ever tier**
 * — and leaves the vr-04 headwords it was written for untouched.
 *
 * **THE THREE JOBS, MEASURED ACROSS 205 ITEMS:**
 *
 *   · `headword-under-test` — one word, and knowing THAT WORD is the whole task.
 *     vr-04 closest-meaning, vr-16 opposite-meaning, vr-21 same-meaning. **The tier requirement
 *     lands here**: a word a child is asked to know is a word whose difficulty we must have judged.
 *
 *   · `components` — raw material to combine, deliberately easy, and knowing them is NOT the test.
 *     vr-12 compound-words ("tooth" + "brush"), vr-13 make-a-word. **The requirement must not
 *     land here**, and it is not a weaker rule for them — it is a rule about a different property.
 *
 *   · `set-members` — several words to classify, where no single one is the headword.
 *     vr-02 two-odd-ones-out, five words per item. **Genuinely undecided**: individual difficulty
 *     matters to fairness, but "the headword" does not exist, so what a tier would mean here is a
 *     reviewer's question and is named rather than assumed.
 *
 * **DECLARED, NOT INFERRED FROM THE TYPE ID** (R57). A type list would have to be found and edited
 * by whoever adds the next word-bearing family, and would not be. An undeclared type FAILS rather
 * than defaulting — because the safe default does not exist here: guess `components` and the rule
 * silently stops covering a vocabulary family; guess `headword-under-test` and it blocks a
 * compound bank. **Where every default is wrong, the answer is to refuse.**
 */

export type WordsRole = 'headword-under-test' | 'components' | 'set-members';

/**
 * The declaration, per question type. It lives here rather than on each item because it is a fact
 * about the FAMILY — every vr-12 item uses `words[]` the same way — and per-item declaration would
 * let two items of one type disagree about what their own field means.
 */
export const WORDS_ROLE_BY_TYPE: Readonly<Record<string, WordsRole>> = {
  'vr-04-closest-meaning': 'headword-under-test',
  'vr-16-opposite-meaning': 'headword-under-test',
  'vr-21-same-meaning': 'headword-under-test',
  'vr-12-compound-words': 'components',
  'vr-13-make-a-word': 'components',
  'vr-02-two-odd-ones-out': 'set-members',
};

/** Null when the type is undeclared — the caller must refuse, never assume. */
export function wordsRoleFor(questionTypeId: string): WordsRole | null {
  return WORDS_ROLE_BY_TYPE[questionTypeId] ?? null;
}

/** Does the tier requirement apply to this type's `stem.words[]`? Undeclared is not "no". */
export function tierRequirementApplies(questionTypeId: string): boolean | null {
  const role = wordsRoleFor(questionTypeId);
  return role === null ? null : role === 'headword-under-test';
}
