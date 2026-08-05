/**
 * THE DICTIONARY GATE and THE LABEL-COLLISION CHECK (David's rulings, 2026-08-02).
 *
 * A verbal-reasoning word puzzle states a RULE and asks for the answer the
 * rule produces. The item is only sound if the rule produces exactly one
 * answer, and nothing in the generator ever checked that — the answer was
 * asserted by the template, never derived and counted.
 *
 * The case that names the problem: move a letter from SPARE to TILE so that
 * both make new words. Move the S and you get PARE and STILE — or PARE and
 * TILES, because the S fits at either end. One rule, two answers, one key,
 * and a child who found the other one is marked wrong for being right.
 *
 * (The first draft of this file described that as moving the S versus moving
 * the E. It is not: E cannot go into TILE and make a word. The ambiguity is
 * two POSITIONS for one letter, which is why the solver returns outcomes and
 * lets the caller count letters separately.)
 *
 * So the gate enumerates every candidate the item's own rule permits, checks
 * each against a wordlist, and fails the item if more than one survives. This
 * is the same discipline as the Maths district's computed key (§5, gate #3):
 * the answer is DERIVED and counted, never asserted.
 *
 * THE WORDLIST IS THE WEAK PART and the report says so rather than hiding it.
 * `content/wordlists/en-lower.txt` is the system dictionary reduced to
 * lower-case alphabetic entries — no proper nouns, no abbreviations. It is
 * US-derived and it is missing most inflections, so regular forms are
 * recognised by rule at lookup rather than stored. Both choices push the same
 * way: MORE candidates count as words, so the gate over-reports ambiguity
 * rather than under-reporting it. For a single-answer gate that is the safe
 * direction — a false ambiguity costs a reviewer a minute, a missed one costs
 * a child a mark.
 */

export interface WordPuzzleFailure {
  where: string;
  rule:
    | 'ambiguous-answer'
    | 'ambiguous-outcome'
    | 'needs-review'
    | 'key-not-derivable'
    | 'not-a-word'
    | 'label-collision';
  detail: string;
}

/** A lookup that recognises regular inflections the base list omits. */
export function makeLexicon(words: Iterable<string>): (candidate: string) => boolean {
  const base = new Set<string>();
  for (const word of words) base.add(word.toLowerCase());
  return (candidate: string): boolean => {
    const word = candidate.toLowerCase();
    if (word.length < 2) return false;
    if (base.has(word)) return true;
    // "tiles" is not in the base list; "tile" is. Without this the gate would
    // miss the very case that prompted it.
    if (word.endsWith('s') && base.has(word.slice(0, -1))) return true;
    if (word.endsWith('es') && base.has(word.slice(0, -2))) return true;
    if (word.endsWith('ies') && base.has(`${word.slice(0, -3)}y`)) return true;
    if (word.endsWith('ed') && (base.has(word.slice(0, -2)) || base.has(word.slice(0, -1)))) return true;
    if (word.endsWith('ing') && (base.has(word.slice(0, -3)) || base.has(`${word.slice(0, -3)}e`))) return true;
    return false;
  };
}

/* ------------------------------------------------------------------ */
/* Move a letter from word1 to word2 so that both make new words.      */
/* ------------------------------------------------------------------ */

export interface MoveLetterSolution {
  letter: string;
  from: string;
  to: string;
}

/**
 * EVERY valid outcome, not one per letter — and the distinction is the whole
 * of David's example.
 *
 * SPARE/TILE has one movable letter, S, and TWO outcomes: PARE + STILE, and
 * PARE + TILES. Our `vr-08` items offer LETTERS as options, so both outcomes
 * are the same tick and the item is answerable. But the stem says "so that
 * both make new words", and a child who wrote TILES has obeyed it exactly as
 * well as one who wrote STILE. Collapsing to one row per letter would have
 * discarded the case the gate was built for.
 *
 * So this returns every (letter, from, to) triple and the caller decides:
 * more than one LETTER is an ambiguous answer under any option shape; one
 * letter with several OUTCOMES is a weaker finding that matters as soon as an
 * item asks for the word rather than the letter.
 */
export function solveMoveLetter(
  word1: string,
  word2: string,
  isWord: (w: string) => boolean,
): MoveLetterSolution[] {
  const found: MoveLetterSolution[] = [];
  const seen = new Set<string>();
  const from = word1.toUpperCase();
  const to = word2.toUpperCase();
  for (let i = 0; i < from.length; i += 1) {
    const letter = from[i]!;
    const shortened = from.slice(0, i) + from.slice(i + 1);
    if (shortened === from || !isWord(shortened)) continue;
    for (let j = 0; j <= to.length; j += 1) {
      const lengthened = to.slice(0, j) + letter + to.slice(j);
      if (lengthened === to || !isWord(lengthened)) continue;
      const key = `${letter}|${shortened}|${lengthened}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ letter, from: shortened, to: lengthened });
    }
  }
  return found;
}

/** The distinct LETTERS among a set of outcomes — the answer, as offered. */
export function movableLetters(solutions: readonly MoveLetterSolution[]): string[] {
  return [...new Set(solutions.map((s) => s.letter))];
}

/* ------------------------------------------------------------------ */
/* The middle word is the first two letters of each outer word.        */
/* ------------------------------------------------------------------ */

export function solveMakeAWord(words: readonly string[]): string | null {
  if (words.length !== 2) return null;
  const [first, second] = words as [string, string];
  if (first.length < 2 || second.length < 2) return null;
  return (first.slice(0, 2) + second.slice(0, 2)).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* One letter finishes the first word and starts the second.           */
/* ------------------------------------------------------------------ */

/**
 * The offered letters that complete BOTH fragments (David's ruling,
 * 2026-08-02, after the reviewer found double-keyed insert-letter items).
 *
 * Only the OFFERED options are tested, not all 26 letters: a child can only
 * choose what they are shown, so a letter that would work but is not on the
 * card cannot make the item ambiguous. An item where more than one offered
 * option completes both fragments is a DEFECT — two answers a child could tick
 * and be right — not a matter of taste.
 *
 * Each fragment carries a `(?)` where the letter goes: "plan(?)" and "(?)ail".
 */
export function solveInsertLetter(
  word1: string,
  word2: string,
  offered: readonly string[],
  isWord: (w: string) => boolean,
): string[] {
  const complete = (fragment: string, letter: string): string => fragment.replace(/\(\?\)/g, letter);
  const found: string[] = [];
  for (const raw of offered) {
    const letter = raw.trim().toLowerCase();
    if (letter.length !== 1) continue;
    const w1 = complete(word1, letter);
    const w2 = complete(word2, letter);
    if (w1 !== word1 && w2 !== word2 && isWord(w1) && isWord(w2)) found.push(letter);
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* A word hiding at the join between two words.                        */
/* ------------------------------------------------------------------ */

/**
 * Every real word of the given length that spans a join. "Spans" is the whole
 * rule: a word sitting wholly inside one word of the sentence is not hidden AT
 * A JOIN and is not an answer, so it must not count toward ambiguity either.
 *
 * PUNCTUATION DOES NOT BLOCK A JOIN (David's ruling, 2026-08-02). A child
 * scans the line as text, not as a parsed sentence; a full stop, a comma, an
 * apostrophe or a hyphen between two letter runs is something their eye passes
 * over. So the units here are maximal runs of LETTERS — "empty-handed" is two
 * units, "Dan's" is two — and a span crossing any boundary between them
 * counts. Treating a hyphen as a wall would have missed exactly the joins a
 * child finds first, because a hyphen is the most visible place to look.
 */
export function solveHiddenWord(
  sentence: string,
  length: number,
  isWord: (w: string) => boolean,
): string[] {
  const letters: string[] = [];
  const unitIndex: number[] = [];
  let index = 0;
  for (const run of sentence.split(/[^A-Za-z]+/).filter(Boolean)) {
    for (const character of run) {
      letters.push(character.toLowerCase());
      unitIndex.push(index);
    }
    index += 1;
  }
  const found = new Set<string>();
  for (let start = 0; start + length <= letters.length; start += 1) {
    const end = start + length - 1;
    if (unitIndex[start] === unitIndex[end]) continue; // wholly inside one unit
    const candidate = letters.slice(start, start + length).join('');
    if (isWord(candidate)) found.add(candidate);
  }
  return [...found];
}

/* ------------------------------------------------------------------ */
/* Series — derive the rule, confirm the key, find rival readings.      */
/* ------------------------------------------------------------------ */

export interface SeriesRule {
  name: string;
  next: number;
  /** common = a Year-5 child reads it readily (step, ratio, alternating);
   *  exotic = cleverer (second differences, Fibonacci) and a weaker rival. */
  tier: 'common' | 'exotic';
}

/**
 * DERIVE, don't assert (David's ruling, 2026-08-02). A finite sequence has
 * infinitely many continuations in principle, so this does not claim to find
 * THE rule — it fits a bounded family of the rules 11+ papers actually use and
 * returns every one that reproduces the given terms, each with the term it
 * predicts next. The caller confirms the key is among them and looks for a
 * distractor that a DIFFERENT fitting rule predicts.
 *
 * The family, and why interleaving is handled last: two points always define a
 * step, so an interleaved reading fits ANY four-term sequence. That makes it
 * useless as a rival — it would manufacture ambiguity everywhere — so it is
 * offered only when no determinate rule (which needs three points and cannot
 * be forced) explains the sequence. For 4,8,5,9 nothing determinate fits and
 * interleaving is the intended reading; for 2,4,6,8 arithmetic fits and
 * interleaving is not counted against it.
 */
export function deriveSeries(terms: readonly number[]): SeriesRule[] {
  if (terms.length < 3) return [];
  const last = terms[terms.length - 1]!;
  const diffs = terms.slice(1).map((t, i) => t - terms[i]!);
  const rules: SeriesRule[] = [];

  // Arithmetic: constant first difference.
  if (diffs.every((d) => d === diffs[0])) {
    rules.push({ name: `arithmetic (+${diffs[0]})`, next: last + diffs[0]!, tier: 'common' });
  }

  // Geometric: constant integer ratio > 1.
  if (terms.every((t) => t !== 0) && terms.slice(1).every((t, i) => t / terms[i]! === terms[1]! / terms[0]!)) {
    const ratio = terms[1]! / terms[0]!;
    if (Number.isInteger(ratio) && Math.abs(ratio) > 1) {
      rules.push({ name: `geometric (×${ratio})`, next: last * ratio, tier: 'common' });
    }
  }

  // Second-difference constant (triangular etc.): first differences are
  // themselves arithmetic. Skipped when plain arithmetic already fits, so it
  // is only reported when the sequence genuinely needs it.
  // secondDiffs.length >= 2 is the honesty condition: a single second
  // difference is unconstrained — three points always define a quadratic, just
  // as two points always define a step. Only from four terms does "second
  // difference constant" actually claim anything.
  const secondDiffs = diffs.slice(1).map((d, i) => d - diffs[i]!);
  const isArithmetic = diffs.every((d) => d === diffs[0]);
  if (!isArithmetic && secondDiffs.length >= 2 && secondDiffs.every((d) => d === secondDiffs[0])) {
    const nextDiff = diffs[diffs.length - 1]! + secondDiffs[0]!;
    rules.push({ name: `second-difference (+${secondDiffs[0]})`, next: last + nextDiff, tier: 'exotic' });
  }

  // Fibonacci-like: each term is the sum of the two before it.
  if (terms.length >= 3 && terms.slice(2).every((t, i) => t === terms[i]! + terms[i + 1]!)) {
    rules.push({ name: 'sum-of-previous-two', next: terms[terms.length - 2]! + last, tier: 'exotic' });
  }

  // Interleaving — only when nothing determinate explains the sequence.
  if (rules.length === 0 && terms.length >= 4) {
    const odd = terms.filter((_, i) => i % 2 === 0);
    const even = terms.filter((_, i) => i % 2 === 1);
    const subStep = (sub: number[]): number | null =>
      sub.length >= 2 && sub.slice(1).every((t, i) => t - sub[i]! === sub[1]! - sub[0]!) ? sub[1]! - sub[0]! : null;
    const oddStep = subStep(odd);
    const evenStep = subStep(even);
    // The next index continues whichever subsequence it falls in.
    const nextInOdd = terms.length % 2 === 0;
    const step = nextInOdd ? oddStep : evenStep;
    const base = nextInOdd ? odd[odd.length - 1]! : even[even.length - 1]!;
    if (step !== null) {
      rules.push({ name: `interleaved (two steps ${oddStep}/${evenStep})`, next: base + step, tier: 'common' });
    }
  }

  return rules;
}

/* ------------------------------------------------------------------ */
/* Reading information — the answer is DEDUCED, and must be unique.      */
/* ------------------------------------------------------------------ */

/**
 * A ranking puzzle: clues like "Ada is taller than Ben" impose an order, and
 * the question asks for the top or the bottom of it. The answer is not
 * asserted — it is deduced from the transitive closure of the clues, and the
 * item is only sound if the clues force EXACTLY ONE answer (David's ruling,
 * 2026-08-02, extending the derive-don't-assert rule to vr-15).
 *
 * `edges` are winner→loser (the winner is "more" of the comparative). Returns
 * the unique person at the requested end, or null when the clues do not
 * determine one — too few clues, a cycle, or a tie leaves the end ambiguous,
 * which is exactly the defect worth catching.
 */
export function solveOrdering(
  people: readonly string[],
  edges: ReadonlyArray<readonly [string, string]>,
  want: 'top' | 'bottom',
): string | null {
  // Transitive closure: beats[x] = everyone x outranks, directly or via a chain.
  const beats = new Map<string, Set<string>>();
  for (const p of people) beats.set(p, new Set());
  for (const [w, l] of edges) beats.get(w)?.add(l);
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of people) {
      const reach = beats.get(p)!;
      for (const mid of [...reach]) {
        for (const far of beats.get(mid) ?? []) {
          if (!reach.has(far)) { reach.add(far); changed = true; }
        }
      }
    }
  }
  // A cycle (someone beats themselves) makes the order incoherent.
  for (const p of people) if (beats.get(p)!.has(p)) return null;

  const n = people.length;
  // Top beats everyone else; bottom is beaten by everyone else.
  const isTop = (p: string) => beats.get(p)!.size === n - 1;
  const isBottom = (p: string) => people.every((q) => q === p || beats.get(q)!.has(p));
  const matches = people.filter((p) => (want === 'top' ? isTop(p) : isBottom(p)));
  return matches.length === 1 ? matches[0]! : null;
}

/* ------------------------------------------------------------------ */
/* A walk script must not name an option that is not on the card.       */
/* ------------------------------------------------------------------ */

/**
 * The letter-options a walk script names that are NOT on its item (David's
 * ruling, 2026-08-02). A script that says "an r leaves plan_ broken" when the
 * card offers t/e/b is describing a card that no longer exists — the exact
 * staleness that let 22 vr-01 scripts survive a distractor redesign, and 50
 * more survive a bank swap, caught only by eye. This catches it.
 *
 * Scoped to LETTER-OPTION items (every option is a single letter): there a
 * lone letter in the script is unambiguously a candidate being weighed, so
 * checking membership is reliable. Word-option staleness needs a different,
 * less certain heuristic and is left for later; this covers insert-letter,
 * move-letter, complete-the-word and the letter series/connections, which is
 * where the staleness has actually bitten.
 *
 * "a" and "i" are English words, never option references, so they are ignored.
 */
export function lettersNamedNotOnCard(
  script: string,
  optionValues: readonly string[],
  stemText = '',
): string[] {
  const letterOptions = optionValues
    .filter((v) => /^[a-z]$/i.test(v.trim()))
    .map((v) => v.trim().toLowerCase());
  if (letterOptions.length === 0) return []; // not a letter-option item
  // A script legitimately names STIMULUS letters too — the series terms
  // A,B,C,D, the letters inside the fragment words. Only a letter that is
  // neither an option nor anywhere in the stem is stale. "a" and "i" are
  // English words, always allowed.
  const allowed = new Set<string>([...letterOptions, 'a', 'i']);
  for (const ch of stemText.toLowerCase().match(/[a-z]/g) ?? []) allowed.add(ch);
  const named = [...new Set((script.match(/\b[a-z]\b/gi) ?? []).map((x) => x.toLowerCase()))];
  return named.filter((letter) => !allowed.has(letter));
}

/* ------------------------------------------------------------------ */
/* Label collision.                                                    */
/* ------------------------------------------------------------------ */

/**
 * AN ITEM'S OWN SYMBOLS MUST NOT LOOK LIKE ITS OPTION LABELS.
 *
 * `vr-07` asks "If A = 3, B = 4, C = 5, D = 6, what is A + B + C?" over five
 * options that the interface labels A to E. The A in the question and the A
 * beside the first option are different things wearing the same letter, and
 * the child has to know that before they can start. It is not a typo; it is
 * two namespaces sharing a glyph, and no amount of careful reading fixes it.
 *
 * Checked against the labels the item WILL be given, not the ones stored:
 * generated items carry no label at all and the interface supplies A–E, so a
 * check that read the stored value would find nothing to collide with.
 */
export const DEFAULT_OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

export function checkLabelCollision(input: {
  label: string;
  /** Symbols the item defines for itself — code letters, series markers. */
  symbols: readonly string[];
  /** How many options the child sees. */
  optionCount: number;
  /** Labels the options actually carry, if the item sets its own. */
  optionLabels?: readonly (string | null | undefined)[];
}): WordPuzzleFailure[] {
  const labels = (input.optionLabels ?? []).filter((entry): entry is string => Boolean(entry));
  const effective =
    labels.length === input.optionCount ? labels : DEFAULT_OPTION_LABELS.slice(0, input.optionCount);
  const collisions = input.symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => symbol.length === 1 && effective.includes(symbol));
  if (collisions.length === 0) return [];
  return [
    {
      where: input.label,
      rule: 'label-collision',
      detail:
        `the item defines ${collisions.map((c) => `"${c}"`).join(', ')} as its own symbol${collisions.length === 1 ? '' : 's'}, ` +
        `and the option${input.optionCount === 1 ? '' : 's'} are labelled ${effective.join(', ')} — the same letter means two things at once`,
    },
  ];
}
