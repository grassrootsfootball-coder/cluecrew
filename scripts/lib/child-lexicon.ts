/**
 * THE CHILD-SCOPED LEXICON (Annie's 224th: validity is what a competent eleven-year-old knows).
 *
 * **THIS REPLACES web2 AND IT IS NOT A THIRD IMPROVISATION.** web2 answered "is this attested in
 * English" and measured its own contents (R988); the 302-card vault answered "is this a taught
 * headword" and scored 0 of 13 while calling LEND and GATE non-child vocabulary (R989). This one
 * answers "is this word common enough that a competent eleven-year-old holds it", which is the
 * question the ruling asks, against a pinned corpus with a digest and a citation.
 *
 * **THE FILE IS VERIFIED BEFORE IT IS READ.** A frequency file whose digest does not match the
 * pinned one is refused, not used with a warning — the whole point of pinning is that a silently
 * different file would move every verdict and nothing downstream could tell (R80's fourth
 * question: is the thing I am measuring against keeping the same convention?).
 *
 * **AND ABSENCE IS LOUD.** No file means UNMEASURED, thrown, never an empty set — an empty lexicon
 * would report every word as unknown, which reads exactly like a real finding (R60, R61, R173).
 *
 * Cited on every use: van Heuven, W. J. B., Mandera, P., Keuleers, E., & Brysbaert, M. (2014).
 * SUBTLEX-UK: A new and improved word frequency database for British English. QJEP 67(6), 1176–1190.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join as pjoin } from 'node:path';
import { FREQUENCY_SOURCE, FREQUENCY_UNMEASURED } from '../../packages/core/src/frequency-signal';

const REPO = pjoin(__dirname, '..', '..');

/** Annie's cut, 224th return. A parameter, not a constant, so it is argued about rather than inherited. */
export const CHILD_CUT_ZIPF = 3.0;

export interface ChildLexicon {
  /** Zipf on the whole corpus — the primary. Null when the word is not in the corpus at all. */
  zipf: (word: string) => number | null;
  /** Zipf on the CBBC children's-television subcorpus, carried beside every verdict. */
  zipfCBBC: (word: string) => number | null;
  /** The ruling, executed: is this a word a competent eleven-year-old holds? */
  knows: (word: string) => boolean;
  /** True when the corpus's own DomPoS calls this a name — excluded, not merely absent (R98). */
  isProperName: (word: string) => boolean;
  size: number;
  namesExcluded: number;
  cut: number;
  provenance: Record<string, unknown>;
}

let cached: ChildLexicon | null = null;

export function loadChildLexicon(): ChildLexicon {
  if (cached) return cached;
  const path = pjoin(REPO, FREQUENCY_SOURCE.localPath);
  if (!existsSync(path)) throw new Error(`${FREQUENCY_UNMEASURED}\n  expected at ${path}`);

  const bytes = readFileSync(path);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== FREQUENCY_SOURCE.expectedDigest) {
    throw new Error(`the frequency file does not match its pinned digest.\n  pinned   ${FREQUENCY_SOURCE.expectedDigest}\n  on disk  ${digest}\nRefused rather than used: a different file moves every verdict and nothing downstream could tell.`);
  }

  // The archive holds one tab-separated member; unzip -p streams it without unpacking to disk.
  const text = execFileSync('unzip', ['-p', path], { maxBuffer: 512 * 1024 * 1024, encoding: 'latin1' });
  const lines = text.split('\n');
  const header = lines[0]!.split('\t');
  const iWord = header.indexOf('Spelling');
  const iZipf = header.indexOf('LogFreq(Zipf)');
  const iCBBC = header.indexOf('LogFreqCBBC(Zipf)');
  const iPoS = header.indexOf('DomPoS');
  if (iWord < 0 || iZipf < 0 || iCBBC < 0 || iPoS < 0) {
    throw new Error(`the frequency file does not carry the columns this reads: Spelling / LogFreq(Zipf) / LogFreqCBBC(Zipf) / DomPoS. Found: ${header.join(', ')}`);
  }

  /**
   * **A PROPER NOUN IS NOT A WORD THE CHILD KNOWS, AND THE CUT ALONE CANNOT TELL.** Subtitle
   * corpora are full of names, lowercased into the word list: GOVE clears 3.0 at Zipf 3.74, SARK
   * at 3.37, BAIN at 3.17 — and those are three of the exact dialect remainders the ruling was
   * written to exclude. **A frequency cut with no part-of-speech filter would have readmitted them
   * under a new instrument**, which is web2's fault wearing a better costume: a number that is
   * correct about its corpus and wrong about the question (R988).
   *
   * The corpus makes the judgement itself, so this does not have to: `DomPoS` is `name` for all
   * four, and they are 74–100% capitalised where every genuine common word here is under 35%.
   * Names are excluded from the lexicon and kept in a separate map, so a verdict can say
   * EXCLUDED-AS-A-NAME rather than silently reporting the word as unknown (R98: unknown is not
   * absent, on a row as much as in a count).
   *
   * **THE FILTER OVER-EXCLUDES, AND THE DIRECTION OF THAT ERROR IS STATED PER QUESTION (R989).**
   * `minister`, `south`, `god` and `mark` are all DomPoS `name` here, because their dominant
   * corpus usage sits inside a name. `AllPoS` cannot rescue them: it reads `.name.noun.` for
   * `minister` and for `gove` alike, so the finer signal is noise. DomPoS is the best available
   * and it errs one way:
   *   · asking "does this leftover read as a word" — over-exclusion makes a leftover look LESS
   *     like a word, so the flatter count is UNDERSTATED. Conservative.
   *   · asking "can this stem be performed" — over-exclusion makes a stem look LESS performable,
   *     so refusals are OVERSTATED. Strict, and capable of refusing a sound stem.
   * Any verdict resting on an excluded word is therefore reported as EXCLUDED-AS-A-NAME rather
   * than as unknown, so the second case is visible to a reviewer instead of silent.
   */
  const main = new Map<string, number>();
  const cbbc = new Map<string, number>();
  const names = new Map<string, number>();
  let parsed = 0;
  for (let i = 1; i < lines.length; i += 1) {
    const f = lines[i]!.split('\t');
    const w = f[iWord]?.trim().toUpperCase();
    if (!w) continue;
    const z = Number(f[iZipf]); const c = Number(f[iCBBC]);
    parsed += 1;
    const isName = (f[iPoS] ?? '').trim().toLowerCase() === 'name';
    if (isName) { if (Number.isFinite(z)) names.set(w, z); continue; }
    if (Number.isFinite(z)) main.set(w, z);
    if (Number.isFinite(c)) cbbc.set(w, c);
  }
  // The guard is on the PARSE, not on the post-exclusion set — an earlier version checked the
  // filtered map and refused the file for doing exactly what it was asked to do.
  if (parsed < 150_000) throw new Error(`the frequency file parsed to only ${parsed} rows — expected ~160,000. A short parse is a broken read, not a small corpus (R173).`);
  if (main.size < 50_000) throw new Error(`only ${main.size} non-name words survived from ${parsed} rows — the part-of-speech filter is over-broad, not selective.`);

  cached = {
    zipf: (w) => main.get(w.trim().toUpperCase()) ?? null,
    zipfCBBC: (w) => cbbc.get(w.trim().toUpperCase()) ?? null,
    knows: (w) => (main.get(w.trim().toUpperCase()) ?? -Infinity) >= CHILD_CUT_ZIPF,
    isProperName: (w) => names.has(w.trim().toUpperCase()),
    size: main.size,
    namesExcluded: names.size,
    cut: CHILD_CUT_ZIPF,
    provenance: {
      source: 'SUBTLEX-UK (van Heuven et al. 2014), Zipf scale, British English',
      digest, retrievedOn: FREQUENCY_SOURCE.retrievedOn,
      column: FREQUENCY_SOURCE.primaryColumn,
      cut: CHILD_CUT_ZIPF,
      ruling: 'Annie, 224th return — validity is what a competent eleven-year-old knows, not what a broad dictionary holds. The cut is 3.0; the COLUMN is a reading and not a ruling.',
      measurementStatus: FREQUENCY_SOURCE.measurementStatus,
    },
  };
  return cached;
}
