/**
 * DOES THE KEY PERFORM THE STEM? (David, 2026-08-30 — R945.)
 *
 * **Forty-seven gates in this estate and not one asks whether the marked-correct option is the
 * correct answer to the question the stem asks.** Every instrument verifies reference, identity,
 * notation, reading age, attribution, tagging — and all of them pass an item whose key is wrong,
 * because none of them ever executes the stem's own task.
 *
 * **THIS IS THE CARRIER TEST ONE SEAT OVER.** R930 found that nothing checked whether a DISTRACTOR
 * performs its entry. The same blind spot sits on the key, and it is worse there: a mistagged
 * distractor fires the wrong hint, **a broken key marks a right answer wrong.**
 *
 * Three-valued for the same reason as the tag gate (R943): PERFORMS, REFUSES, UNDECIDED. An item
 * type whose task is semantic — *which word means the opposite* — gets no predicate and is reported
 * UNDECIDED, never passed.
 */

export type KeyVerdict = 'PERFORMS' | 'REFUSES' | 'UNDECIDED';
export interface KeySubject {
  questionTypeId: string;
  stem: Record<string, unknown>;
  keyValue: string;
  /** Every option value, for tasks whose answer must be unique among them. */
  optionValues: readonly string[];
}
export interface KeyResult { verdict: KeyVerdict; task: string | null; why: string }
export type Lexicon = (word: string) => boolean;

const ok = (task: string, why: string): KeyResult => ({ verdict: 'PERFORMS', task, why });
const no = (task: string, why: string): KeyResult => ({ verdict: 'REFUSES', task, why });
const und = (why: string): KeyResult => ({ verdict: 'UNDECIDED', task: null, why });

/** Every way one letter moves from w1 into w2, preserving the order of what remains. */
export function moveLetterOutcomes(w1: string, w2: string, letter: string) {
  const i = w1.indexOf(letter);
  if (i < 0) return null;
  const left = w1.slice(0, i) + w1.slice(i + 1);
  const made = [...Array(w2.length + 1).keys()].map((j) => w2.slice(0, j) + letter + w2.slice(j));
  return { left, made };
}

const PREDICATES: Record<string, (s: KeySubject, isWord: Lexicon) => KeyResult> = {
  'vr-05-hidden-word': (s) => {
    const sentence = String(s.stem.sentence ?? '');
    if (!sentence) return und('no sentence on the stem');
    const words = sentence.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, '')).filter(Boolean);
    const k = s.keyValue.toLowerCase();
    /**
     * A hidden word spans AT LEAST ONE word boundary — and may span more than one. The first
     * version of this predicate checked ADJACENT PAIRS only, and refused three sound items whose
     * key spans three words: *song* across `pens|on|grans`, *kind* across `oak|in|dans`, *ring*
     * across `star|in|gold`. **A join is not a pair** (R946).
     */
    const flat = words.join('');
    const bounds: number[] = [];
    words.reduce((acc, w) => { bounds.push(acc + w.length); return acc + w.length; }, 0);
    const idx = flat.indexOf(k);
    const crossed = idx < 0 ? 0 : bounds.filter((b) => b > idx && b < idx + k.length).length;
    /**
     * THE STEM PROMISES A JOIN BETWEEN TWO WORDS — exactly one boundary. The first version
     * passed any boundary count ("crosses a boundary"), a CORRELATE of the fault, and certified
     * three keys that span THREE words: song across pens-on-Gran, kind across oak-in-Dan, ring
     * across star-in-gold (her 208th; measured independently by the authoring store). A child
     * following the instruction as written cannot find a three-word straddle, so a key that
     * needs one refuses. Repaired 2026-09-02 under an R149 baseline: exactly those three flip.
     */
    const atAJoin = idx >= 0 && crossed === 1;
    const anywhere = idx >= 0;
    if (atAJoin) return ok('a word hiding at the join between two words', `"${s.keyValue}" sits at exactly one join`);
    return no('a word hiding at the join between two words',
      crossed >= 2 ? `"${s.keyValue}" spans ${crossed + 1} words — the stem promises a join between TWO, and a child following the instruction cannot find it`
        : anywhere ? `"${s.keyValue}" appears in the sentence but NOT across a join` : `"${s.keyValue}" DOES NOT APPEAR IN THE SENTENCE AT ALL — the item has no correct answer`);
  },

  'vr-08-move-letter': (s, isWord) => {
    const w1 = String(s.stem.word1 ?? ''); const w2 = String(s.stem.word2 ?? '');
    if (!w1 || !w2 || s.keyValue.length !== 1) return und('no word1/word2, or the key is not a single letter');
    const r = moveLetterOutcomes(w1, w2, s.keyValue);
    if (!r) return no('move one letter so both make new words', `"${s.keyValue}" is not in ${w1}`);
    const leftOk = isWord(r.left); const madeOk = r.made.filter(isWord);
    if (leftOk && madeOk.length) return ok('move one letter so both make new words', `${w1}->${r.left} and ${w2}->${madeOk[0]}`);
    // does ANY letter work? if not, the stem itself cannot be done.
    const anyWorks = [...new Set(w1)].some((L) => {
      const rr = moveLetterOutcomes(w1, w2, L);
      return rr && isWord(rr.left) && rr.made.some(isWord);
    });
    return no('move one letter so both make new words',
      anyWorks
        ? `the key "${s.keyValue}" fails: ${w1}->${r.left} is ${leftOk ? 'a word' : 'NOT a word'}, and ${w2}+${s.keyValue} makes ${madeOk.length ? madeOk.join('/') : 'no word'}`
        : `NO LETTER OF ${w1} CAN DO THIS TASK WITH ${w2} — the stem cannot be performed at any cut, by any key`);
  },

  'vr-13-make-a-word': (s) => {
    const [w1, w2] = (s.stem.words as string[]) ?? [];
    if (!w1 || !w2) return und('no outer words on the stem');
    const built = w1.slice(0, 2) + w2.slice(0, 2);
    return built.toUpperCase() === s.keyValue.toUpperCase()
      ? ok('first two letters of each outer word', `${w1}+${w2} builds ${built}`)
      : no('first two letters of each outer word', `${w1}+${w2} builds "${built}", not "${s.keyValue}"`);
  },

  'vr-19-word-number-codes': (s) => {
    const code = s.stem.code as Record<string, string> | undefined;
    const word = String(s.stem.prompt ?? '').match(/code for ([A-Z]+)/)?.[1];
    if (!code || !word) return und('no code map or coded word on the stem');
    const built = word.split('').map((l) => code[l]).join('');
    return built === s.keyValue
      ? ok('encode the word with the given map', `${word} encodes to ${built}`)
      : no('encode the word with the given map', `${word} encodes to "${built}", not "${s.keyValue}"`);
  },

  'vr-20-complete-the-word': (s, isWord) => {
    const gap = String(s.stem.wordWithGap ?? '');
    if (!gap || s.keyValue.length !== 1) return und('no wordWithGap, or the key is not a single letter');
    const made = gap.replace('_', s.keyValue);
    return isWord(made) ? ok('fill the gap to make a real word', `${made} is a word`)
      : no('fill the gap to make a real word', `${made} is not in the lexicon`);
  },

  'vr-17-complete-the-sum': (s) => {
    const sum = String(s.stem.sum ?? '');
    if (!sum) return und('no sum on the stem');
    const filled = sum.replace('?', s.keyValue);
    const m = filled.match(/^\s*(-?\d+)\s*([+\-])\s*(-?\d+)\s*=\s*(-?\d+)\s*$/);
    if (!m) return und(`the sum shape "${sum}" is not a simple two-term equation`);
    const [, a, op, b, c] = m;
    const lhs = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
    return lhs === Number(c) ? ok('make the equation true', `${filled} holds`)
      : no('make the equation true', `${filled} does not hold — the left side is ${lhs}`);
  },

  'vr-18-related-numbers': (s) => {
    const m = String(s.stem.sum ?? '').match(/\((\d+) \[(\d+)\] (\d+)\)\s+\((\d+) \[\?\] (\d+)\)/);
    if (!m) return und('the related-numbers shape did not parse');
    const [, a1, mid1, c1, a2, c2] = m.map(Number) as unknown as number[];
    const add = Number(a1) + Number(c1) === Number(mid1);
    const mul = Number(a1) * Number(c1) === Number(mid1);
    if (!add && !mul) return und('the first pair fits neither addition nor multiplication');
    const expect = add ? Number(a2) + Number(c2) : Number(a2) * Number(c2);
    return Number(s.keyValue) === expect
      ? ok('apply the first pair\'s rule to the second', `${add ? 'sum' : 'product'} is ${expect}`)
      : no('apply the first pair\'s rule to the second', `the rule gives ${expect}, not ${s.keyValue}`);
  },
};

export function checkKeyPerformsStem(s: KeySubject, isWord: Lexicon): KeyResult {
  const p = PREDICATES[s.questionTypeId];
  if (!p) return und(`no predicate for ${s.questionTypeId} — its task is semantic. UNDECIDED is a named state, not a pass.`);
  return p(s, isWord);
}
