/**
 * COMPUTES-AS AS A WRITE GATE: NO TAG LANDS WITHOUT ITS CARRIER PERFORMING ITS ENTRY
 * (Annie's 203rd — R943). Estate-wide, at the join, at write time.
 *
 * **Arithmetic on the key and curation by column position failed identically, because neither ever
 * compared the value to the entry it would wear.** The fault lives in the JOIN, so the repair lives
 * there too: eighty-two bad carriers were manufactured by two unrelated methods, and a gate at the
 * join makes the class unmanufacturable by either, and by any future one.
 *
 * **THE GATE IS THREE-VALUED AND THAT IS DELIBERATE.** A predicate exists for some entries and not
 * others, and pretending otherwise is how a check comes to report a number for all patterns that
 * means something for a few (R890). So:
 *   - PERFORMS   — the carrier executes its entry's act. The write proceeds.
 *   - REFUSES    — it does not. **The write is refused**, with the execution that failed.
 *   - UNDECIDED  — no predicate for this entry. The write proceeds AND IS RECORDED as unverified,
 *                  because a gate that blocked here would block every semantic entry in the estate.
 *
 * **UNDECIDED IS NOT A PASS.** It is a named state, counted separately, and a caller that treats it
 * as a pass is choosing to — which is the difference between a limit and a leak.
 */

export type TagWriteVerdict = 'PERFORMS' | 'REFUSES' | 'UNDECIDED';

export interface TagWriteSubject {
  /** The item's stem, whatever shape its district uses. */
  stem: Record<string, unknown>;
  /** The value of the option the tag would land on. */
  optionValue: string;
  /** The key's value, for entries whose act is defined against it. */
  keyValue: string;
  /** The entry the tag names. */
  misconceptionId: string;
}

export interface TagWriteResult {
  verdict: TagWriteVerdict;
  /** The act that was executed, or null when no predicate exists. */
  act: string | null;
  /** Why — always populated, so a refusal never has to be reconstructed. */
  why: string;
}

/** A word test the caller supplies; the gate never hard-codes a lexicon (R903 — name your list). */
export type Lexicon = (word: string) => boolean;

type Predicate = (s: TagWriteSubject, isWord: Lexicon) => TagWriteResult;

const performs = (act: string, why: string): TagWriteResult => ({ verdict: 'PERFORMS', act, why });

/**
 * The group of three, the two odd ones, and how many of a seat's pair are odd. Returns null rather
 * than an empty shape when the stem cannot be read — an empty result and a broken read are
 * indistinguishable downstream (R173).
 */
function vr02Groups(s: TagWriteSubject) {
  const words = (s.stem.words as unknown[] | undefined)?.map((w) => String(w).trim().toLowerCase());
  const key = s.keyValue.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
  const pair = s.optionValue.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
  if (!words || words.length < 3 || key.length !== 2 || pair.length !== 2) return null;
  const group = words.filter((w) => !key.includes(w));
  return { group, key, pair, chosenInKey: pair.filter((w) => key.includes(w)).length };
}
const refuses = (act: string, why: string): TagWriteResult => ({ verdict: 'REFUSES', act, why });

/**
 * The closed set. Each entry names an act that can be EXECUTED on the item's own material; an entry
 * whose act is semantic is absent by design and lands UNDECIDED.
 */
export const TAG_PREDICATES: Record<string, Predicate> = {
  'vr13-not-a-word': (s, isWord) => isWord(s.optionValue)
    ? refuses('the letters do not form a real word', `"${s.optionValue}" is in the lexicon`)
    : performs('the letters do not form a real word', `"${s.optionValue}" is not in the lexicon`),

  'vr19-shared-letter-miss': (s) => {
    const word = String(s.stem.prompt ?? '').match(/code for ([A-Z]+)/)?.[1];
    if (!word) return { verdict: 'UNDECIDED', act: null, why: 'the coded word could not be read from the prompt' };
    const repeats = [...word].some((c, i) => word.indexOf(c) !== i);
    return repeats
      ? performs('missed that repeated letters share one digit', `${word} repeats a letter, so there is a shared digit to miss`)
      : refuses('missed that repeated letters share one digit', `${word} has no repeated letter — the act is impossible on this item`);
  },

  'vr19-letter-order': (s) => {
    const rev = [...s.keyValue].reverse().join('');
    return s.optionValue === rev
      ? performs('matched the digits in reverse order', `"${s.optionValue}" is the key reversed`)
      : refuses('matched the digits in reverse order', `reversing the key gives "${rev}", not "${s.optionValue}"`);
  },

  'vr17-arith-slip': (s) => {
    const d = Math.abs(Number(s.optionValue) - Number(s.keyValue));
    return d === 1 || d === 2
      ? performs('a slip of one or two', `off by ${d}`)
      : refuses('a slip of one or two', `off by ${Number.isNaN(d) ? 'a non-numeric amount' : d} from the key ${s.keyValue}`);
  },

  /**
   * THE vr-02 TRIO (Annie's 224th, 2026-08-24). Her ruling on rows 01 and 06 is not a judgement
   * about two rows — it is a PREDICATE, and one that needs no lexicon: **the act a seat records is
   * choosing two words that both lie inside the group of three.** The stem carries five words and
   * the key names the two odd ones, so the group is the remainder and the test is set membership.
   *
   * **A TAG NAMES THE ACT; THE ATTRACTION EXPLAINS WHICH PERFORMANCE OF IT SHE CHOSE.** Both
   * disputed seats — pear/plum and bird/bee — alliterate, and the alliteration is real. It explains
   * why THOSE two group members caught her eye; it does not change what she did, which was to
   * answer the opposite question. So `vr02-surface-link` REFUSES on a pair lying wholly inside the
   * group, and stays UNDECIDED elsewhere, where whether a link rests on look or sound is a
   * judgement no predicate should pretend to make.
   */
  'vr02-answered-the-opposite': (s) => {
    const g = vr02Groups(s);
    if (!g) return { verdict: 'UNDECIDED', act: null, why: 'the stem carries no readable word list, or the option is not a pair' };
    return g.chosenInKey === 0
      ? performs('chose two words that both belong to the group', `${g.pair.join(' and ')} both sit inside the group (${g.group.join(', ')}); the odd ones are ${g.key.join(' and ')}`)
      : refuses('chose two words that both belong to the group', `${g.pair.join(' and ')} includes ${g.chosenInKey} of the two odd ones, so the act performed was not answering the opposite question`);
  },

  'vr02-partial-group': (s) => {
    const g = vr02Groups(s);
    if (!g) return { verdict: 'UNDECIDED', act: null, why: 'the stem carries no readable word list, or the option is not a pair' };
    return g.chosenInKey === 1
      ? performs('found one odd word and paired it with a group member', `${g.pair.join(' and ')} takes one odd word and one group member`)
      : refuses('found one odd word and paired it with a group member', g.chosenInKey === 0
        ? `${g.pair.join(' and ')} are both group members — no odd word was found at all`
        : `${g.pair.join(' and ')} is the key itself`);
  },

  'vr02-surface-link': (s) => {
    const g = vr02Groups(s);
    if (!g) return { verdict: 'UNDECIDED', act: null, why: 'the stem carries no readable word list, or the option is not a pair' };
    return g.chosenInKey === 0
      ? refuses('grouped by look or sound instead of meaning', `${g.pair.join(' and ')} both sit inside the group, so the act recorded is answering the opposite question. A shared look or sound is why these two were picked, not what was done with them (Annie, 224th).`)
      : { verdict: 'UNDECIDED', act: null, why: 'whether the link rests on look or sound rather than meaning is a judgement, not an execution' };
  },

  'vr-move-letter-first-word-invalid': (s, isWord) => {
    const w1 = String(s.stem.word1 ?? '');
    if (!w1 || s.optionValue.length !== 1) return { verdict: 'UNDECIDED', act: null, why: 'no word1, or the option is not a single letter' };
    const left = w1.replace(s.optionValue, '');
    return isWord(left)
      ? refuses('removing the letter leaves no real first word', `removing "${s.optionValue}" from ${w1} leaves "${left}", which IS a word`)
      : performs('removing the letter leaves no real first word', `${w1} without "${s.optionValue}" is "${left}", not a word`);
  },

  'vr-move-letter-second-word-invalid': (s, isWord) => {
    const w2 = String(s.stem.word2 ?? '');
    if (!w2 || s.optionValue.length !== 1) return { verdict: 'UNDECIDED', act: null, why: 'no word2, or the option is not a single letter' };
    const makes = [...Array(w2.length + 1).keys()].map((i) => w2.slice(0, i) + s.optionValue + w2.slice(i)).filter(isWord);
    return makes.length
      ? refuses('adding the letter makes no real second word', `adding "${s.optionValue}" to ${w2} makes ${makes.join('/')}`)
      : performs('adding the letter makes no real second word', `no insertion of "${s.optionValue}" into ${w2} makes a word`);
  },
};

/**
 * Run the gate. **A caller that ignores a REFUSES verdict is writing a tag whose carrier does not
 * perform it**, which is the class this exists to end.
 */
export function checkTagWrite(subject: TagWriteSubject, isWord: Lexicon): TagWriteResult {
  const p = TAG_PREDICATES[subject.misconceptionId];
  if (!p) {
    return { verdict: 'UNDECIDED', act: null,
      why: `no predicate for ${subject.misconceptionId} — its act is semantic, and a gate that refused here would refuse every semantic entry in the estate. UNDECIDED is a named state, not a pass.` };
  }
  return p(subject, isWord);
}

/** Throws on REFUSES. The shape a write path calls when it means it. */
export function assertTagWrite(subject: TagWriteSubject, isWord: Lexicon): TagWriteResult {
  const r = checkTagWrite(subject, isWord);
  if (r.verdict === 'REFUSES') {
    throw new Error(`TAG WRITE REFUSED — ${subject.misconceptionId} on "${subject.optionValue}": ${r.why}. The carrier does not perform its entry (R943).`);
  }
  return r;
}
