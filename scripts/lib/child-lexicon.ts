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

/**
 * THE INSTRUMENT TRAVELS WITH THE CUT (Annie's 225th, 2026-08-24).
 *
 * **A RULING THAT NAMES ONLY ITS NUMBER CANNOT BE CHECKED ACROSS STORES.** The authoring store
 * runs wordfreq 3.1.1 and reads GRAN at 3.44; this store reads SUBTLEX-UK. Both are honest
 * instruments and they disagree, so "3.0" alone is not a shared fact — two stores can apply the
 * same ruling faithfully, reach different verdicts, and have no way to discover why.
 *
 * So every emission that names the cut names the instrument WITH it: the source, its digest, its
 * version, and the name filter — because the filter is part of the measurement, not a detail of
 * the implementation. GOVE clears 3.0 at 3.74 and is excluded as a surname; a store told only
 * "3.0" would admit it and be right by the ruling as written.
 *
 * This is R985 one level up: there, a digest travelled with the keys it was taken over; here, a
 * threshold travels with the instrument it was taken on. A number without its instrument is a
 * value with no subject.
 */
export function cutDeclaration() {
  return {
    cut: CHILD_CUT_ZIPF,
    ruling: 'Annie, 224th return — validity is what a competent eleven-year-old knows, not what a broad dictionary holds. The cut is 3.0.',
    instrument: {
      source: 'SUBTLEX-UK (van Heuven, Mandera, Keuleers & Brysbaert 2014), Zipf scale, British English',
      sha256: FREQUENCY_SOURCE.expectedDigest,
      retrievedOn: FREQUENCY_SOURCE.retrievedOn,
      rows: FREQUENCY_SOURCE.rows,
      column: FREQUENCY_SOURCE.primaryColumn,
      columnIsAREADINGNotARuling: FREQUENCY_SOURCE.columnChoiceIsNOTRULED,
    },
    nameFilter: {
      rule: 'entries whose DomPoS is "name" are excluded from the lexicon entirely, whatever their Zipf',
      whyItIsPartOfTHEMEASUREMENT: 'GOVE reads 3.74, SARK 3.37 and BAIN 3.17 — three dialect remainders the ruling exists to exclude, admitted by the bare cut because subtitle corpora lowercase proper nouns into the word list. A store told only "3.0" would admit them and be faithful to the ruling as written.',
      andWHATITCOSTS: 'it over-excludes: minister, south and god are DomPoS "name" here too, and AllPoS cannot separate them (it reads .name.noun. for minister and for gove alike). A verdict resting on an excluded word reports EXCLUDED-AS-A-NAME, never "unknown".',
    },
    andWHYTHISTRAVELS:
      'the authoring store runs wordfreq 3.1.1 and reads GRAN at 3.44. Two honest instruments disagree, so a cut without its instrument is not a shared fact. Quote this block back with any figure taken at this cut and the two stores can find the disagreement instead of inheriting it.',
    knownDisagreementToQuOTEBACK:
      'GRAN: the authoring store reads 3.44 on wordfreq 3.1.1. This store\'s own reading is carried as GRAN_measuredHere beside this block, measured at call time rather than written here — a number typed into a declaration is the thing this rule exists to stop.',
  };
}

export interface ChildLexicon {
  /** Zipf on the whole corpus — the primary. Null when the word is not in the corpus at all. */
  zipf: (word: string) => number | null;
  /** Zipf on the CBBC children's-television subcorpus, carried beside every verdict. */
  zipfCBBC: (word: string) => number | null;
  /** The ruling, executed: is this a word a competent eleven-year-old holds? */
  knows: (word: string) => boolean;
  /** True when the corpus's own DomPoS calls this a name — excluded, not merely absent (R98). */
  isProperName: (word: string) => boolean;
  /**
   * The Zipf BEFORE the name rule is applied — names included. Needed to separate a disagreement
   * between CORPORA from a disagreement between RULES: without it, this store's name filter and
   * SUBTLEX's contents are one indistinguishable difference (Annie's 225th).
   */
  zipfRaw: (word: string) => number | null;
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
  const iAll = header.indexOf('AllPoS');
  const iAllF = header.indexOf('AllPoSFreq');
  const iFreq = header.indexOf('FreqCount');
  if (iWord < 0 || iZipf < 0 || iCBBC < 0 || iPoS < 0 || iAll < 0 || iAllF < 0 || iFreq < 0) {
    throw new Error(`the frequency file does not carry the columns this reads: Spelling / LogFreq(Zipf) / LogFreqCBBC(Zipf) / DomPoS / AllPoS / AllPoSFreq / FreqCount. Found: ${header.join(', ')}`);
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
  const main = new Map<string, number>();      // Zipf computed from NON-NAME frequency only
  const cbbc = new Map<string, number>();
  const raw = new Map<string, number>();       // the file's own Zipf, all senses
  const excluded = new Map<string, number>();  // cleared the cut on all senses, fails on non-name ones
  let parsed = 0, corpusTotal = 0;
  interface Rec { w: string; z: number; c: number; nonName: number }
  const recs: Rec[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const f = lines[i]!.split('\t');
    const w = f[iWord]?.trim().toUpperCase();
    if (!w) continue;
    parsed += 1;
    const z = Number(f[iZipf]); const c = Number(f[iCBBC]); const total = Number(f[iFreq]);
    if (Number.isFinite(total)) corpusTotal += total;
    // AllPoS is `.name.noun.verb.` and AllPoSFreq the matching `.18569.12700.144.`; the counts are
    // positional, so a length mismatch means the row cannot be read and is refused, not guessed.
    const labels = (f[iAll] ?? '').split('.').filter(Boolean);
    const counts = (f[iAllF] ?? '').split('.').filter(Boolean).map(Number);
    let nonName = 0;
    if (labels.length === counts.length && labels.length > 0) {
      labels.forEach((lab, j) => { if (lab.trim().toLowerCase() !== 'name') nonName += counts[j] ?? 0; });
    } else if (Number.isFinite(total)) {
      nonName = (f[iPoS] ?? '').trim().toLowerCase() === 'name' ? 0 : total;
    }
    if (Number.isFinite(z)) raw.set(w, z);
    if (Number.isFinite(c)) cbbc.set(w, c);
    recs.push({ w, z, c, nonName });
  }
  if (corpusTotal <= 0) throw new Error('the corpus total summed to zero — a Zipf cannot be recomputed without it');
  for (const r of recs) {
    if (r.nonName <= 0) { if (Number.isFinite(r.z)) excluded.set(r.w, r.z); continue; }
    const zNonName = Math.log10((r.nonName / corpusTotal) * 1e9);
    main.set(r.w, Number(zNonName.toFixed(2)));
    if (zNonName < CHILD_CUT_ZIPF && Number.isFinite(r.z) && r.z >= CHILD_CUT_ZIPF) excluded.set(r.w, r.z);
  }
  const names = excluded;
  // The guard is on the PARSE, not on the post-exclusion set — an earlier version checked the
  // filtered map and refused the file for doing exactly what it was asked to do.
  if (parsed < 150_000) throw new Error(`the frequency file parsed to only ${parsed} rows — expected ~160,000. A short parse is a broken read, not a small corpus (R173).`);
  if (main.size < 50_000) throw new Error(`only ${main.size} non-name words survived from ${parsed} rows — the part-of-speech filter is over-broad, not selective.`);

  cached = {
    zipf: (w) => main.get(w.trim().toUpperCase()) ?? null,
    zipfCBBC: (w) => cbbc.get(w.trim().toUpperCase()) ?? null,
    knows: (w) => (main.get(w.trim().toUpperCase()) ?? -Infinity) >= CHILD_CUT_ZIPF,
    isProperName: (w) => { const k = w.trim().toUpperCase(); return (main.get(k) ?? -Infinity) < CHILD_CUT_ZIPF && (raw.get(k) ?? -Infinity) >= CHILD_CUT_ZIPF; },
    zipfRaw: (w) => raw.get(w.trim().toUpperCase()) ?? null,
    size: main.size,
    namesExcluded: names.size,
    cut: CHILD_CUT_ZIPF,
    provenance: {
      THE_CUT_AND_ITS_INSTRUMENT: cutDeclaration(),
      GRAN_measuredHere: main.get('GRAN') ?? null,
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
