/**
 * The text primitives the English matcher is built from (BUILD-DISTRICT-
 * ENGLISH §3). Every function here is pure, deterministic and small enough
 * to explain to a reviewer in a sentence — that is a requirement, not a
 * style preference. A mark scheme a human cannot predict is not a mark
 * scheme, and there is no ML anywhere in this district's marking.
 *
 * Nothing in this file generates text. It only ever takes strings apart.
 */

/**
 * Contractions are expanded BEFORE punctuation is stripped, so "don't" and
 * "do not" are the same answer, and "can't" and "cannot" are too. The list is
 * closed and authored — an unlisted contraction simply loses its apostrophe,
 * which is the safe direction (it stays one token, it never becomes a
 * different word).
 */
const CONTRACTIONS: ReadonlyMap<string, string> = new Map([
  ["can't", 'cannot'],
  ["cannot", 'cannot'],
  ["won't", 'will not'],
  ["don't", 'do not'],
  ["doesn't", 'does not'],
  ["didn't", 'did not'],
  ["isn't", 'is not'],
  ["aren't", 'are not'],
  ["wasn't", 'was not'],
  ["weren't", 'were not'],
  ["hasn't", 'has not'],
  ["haven't", 'have not'],
  ["hadn't", 'had not'],
  ["couldn't", 'could not'],
  ["wouldn't", 'would not'],
  ["shouldn't", 'should not'],
  ["it's", 'it is'],
  ["he's", 'he is'],
  ["she's", 'she is'],
  ["that's", 'that is'],
  ["there's", 'there is'],
  ["what's", 'what is'],
  ["who's", 'who is'],
  ["they're", 'they are'],
  ["we're", 'we are'],
  ["you're", 'you are'],
  ["i'm", 'i am'],
  ["i've", 'i have'],
  ["we've", 'we have'],
  ["they've", 'they have'],
  ["you've", 'you have'],
  ["i'll", 'i will'],
  ["we'll", 'we will'],
  ["he'll", 'he will'],
  ["she'll", 'she will'],
  ["they'll", 'they will'],
  ["it'll", 'it will'],
  ["let's", 'let us'],
]);

/**
 * Stopwords carry no answer content. They are removed before similarity is
 * measured, so "because the room was dark" and "the room is dark" compare on
 * the words that mean something. Lifting detection deliberately does NOT use
 * this list — copying is about the exact run of words, stopwords included.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'about', 'above', 'after', 'again', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself',
]);

/**
 * Lowercases, straightens quotes, expands contractions, then reduces
 * everything that is not a letter or a digit to a single space. Case,
 * punctuation, whitespace and contractions therefore all stop mattering —
 * which is exactly the tolerance EXACT is meant to have.
 */
export function normalise(text: string): string {
  const straightened = text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"');
  const expanded = straightened.replace(/[a-z]+'[a-z]+/g, (word) => CONTRACTIONS.get(word) ?? word);
  return expanded
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** The normalised word list, stopwords and all. */
export function tokens(text: string): string[] {
  const normalised = normalise(text);
  return normalised === '' ? [] : normalised.split(' ');
}

/**
 * A deliberately blunt suffix stripper — enough to unify the inflections
 * children actually vary ("frightens/frightened/frightening"), and no more.
 * Rules, applied in order, to any word longer than three letters:
 *
 *   1. -ies → -y            (worries → worry)
 *   2. -ied → -y            (worried → worry)
 *   3. -ing, -ed, -es, -s, -ly are stripped when ≥3 letters remain
 *   4. a doubled final consonant collapses  (runn → run)
 *   5. a trailing -e is dropped              (hope/hoped/hoping → hop)
 *
 * Rule 5 is what makes rule 3 safe: without it "hoped" (→ hop) and "hope"
 * would not meet. Over-stemming is possible and accepted — the cost of a
 * false merge is a slightly generous match, and the authored
 * `barredNearMisses` are what stop generosity where it matters.
 */
export function stem(word: string): string {
  let result = word;
  if (result.length <= 3) return result;

  if (result.endsWith('ies') && result.length > 4) result = `${result.slice(0, -3)}y`;
  else if (result.endsWith('ied') && result.length > 4) result = `${result.slice(0, -3)}y`;
  else if (result.endsWith('ing') && result.length > 5) result = result.slice(0, -3);
  else if (result.endsWith('ed') && result.length > 4) result = result.slice(0, -2);
  else if (result.endsWith('es') && result.length > 4) result = result.slice(0, -2);
  else if (result.endsWith('ly') && result.length > 4) result = result.slice(0, -2);
  else if (result.endsWith('s') && !result.endsWith('ss') && result.length > 3) result = result.slice(0, -1);

  const last = result.at(-1);
  const penultimate = result.at(-2);
  if (last !== undefined && last === penultimate && !'lsfaeiou'.includes(last)) {
    result = result.slice(0, -1);
  }

  if (result.length > 3 && result.endsWith('e')) result = result.slice(0, -1);
  return result;
}

/** Stems of the words that carry meaning — the unit similarity is measured in. */
export function contentStems(text: string): string[] {
  return tokens(text)
    .filter((token) => !STOPWORDS.has(token))
    .map(stem);
}

/** Stems of every word, stopwords included — used for concept-term lookup. */
export function allStems(text: string): string[] {
  return tokens(text).map(stem);
}

export interface OverlapScore {
  /**
   * How much of the AUTHORED answer the child's answer covers. This is the
   * question a mark scheme actually asks: did they say the thing?
   */
  coverage: number;
  /**
   * Dice coefficient — symmetric, so it falls as the child's answer grows
   * around a small authored one. It is the guard against "copy the whole
   * paragraph and hope", nothing more.
   */
  dice: number;
  shared: string[];
}

/** Order-insensitive set overlap of two stem lists. */
export function overlap(authored: string[], child: string[]): OverlapScore {
  const authoredSet = new Set(authored);
  const childSet = new Set(child);
  if (authoredSet.size === 0) return { coverage: 0, dice: 0, shared: [] };
  const shared = [...authoredSet].filter((token) => childSet.has(token));
  return {
    coverage: shared.length / authoredSet.size,
    dice: (2 * shared.length) / (authoredSet.size + childSet.size),
    shared,
  };
}

/**
 * The longest run of consecutive words the two texts share. This is the
 * lifting and evidence primitive: a run is a verbatim copy, and how long a
 * run has to be before it means something is a policy decision the caller
 * makes, not this function.
 */
export function longestCommonRun(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  let best = 0;
  // Rolling single-row DP: previous[j] is the run length ending at a[i-1],b[j-1].
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    const current = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        current[j] = (previous[j - 1] ?? 0) + 1;
        if ((current[j] ?? 0) > best) best = current[j] ?? 0;
      }
    }
    previous = current;
  }
  return best;
}

/**
 * Whether every content word of a short authored phrase appears in the
 * child's answer — order-insensitive, so "the dark tunnel" is found in "a
 * tunnel that was dark". Used for barred near misses and concept terms,
 * both of which are SHORT authored phrases where this reading is the fair
 * one. A phrase of pure stopwords falls back to all its words.
 */
export function phrasePresent(phrase: string, childAllStems: ReadonlySet<string>): boolean {
  const content = contentStems(phrase);
  const needles = content.length > 0 ? content : allStems(phrase);
  if (needles.length === 0) return false;
  return needles.every((needle) => childAllStems.has(needle));
}
