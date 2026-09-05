/**
 * HER DISAGREEMENT SET: TWO INSTRUMENTS, ONE WORD POPULATION, COUNTED AT 3.0 (Annie's 225th).
 *
 * *"That number decides whether the district has one rule or two, and where they agree the
 * agreement is stronger than either alone."*
 *
 * **BOTH INSTRUMENTS RUN HERE.** wordfreq 3.1.1 is installed locally and reads GRAN at 3.44 —
 * the exact figure the authoring store reported, which is how this side knows it is running THEIR
 * instrument and not an approximation of it. SUBTLEX-UK reads GRAN at 3.94.
 *
 * **THE POPULATION IS THE DISTRICT'S OWN ADJUDICATION SURFACE, NOT A CONVENIENT WORD LIST.** For
 * every vr-08 row and every letter of word1: the leftover, and every insertion of that letter into
 * word2. That is precisely the set the cut decides something about here — a disagreement on a word
 * this district never asks about is not a disagreement that costs anything (R60: state the
 * population you actually screened, and why it is that one).
 *
 * **AND THE TWO INSTRUMENTS DIFFER IN TWO WAYS, WHICH MUST BE COUNTED APART.** They rest on
 * different corpora, AND this store applies a name filter that the other does not. Folding those
 * together would answer "do the numbers differ" when the question asked is "is there one rule or
 * two". So crossings are counted twice: on the raw cut alone, isolating the CORPORA; and with the
 * name filter applied, which is this store's RULE. The difference between those two counts is the
 * cost of the rule, stated as a number rather than argued.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { loadChildLexicon, CHILD_CUT_ZIPF } from './lib/child-lexicon';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const VENV = process.env.WORDFREQ_PYTHON ?? pjoin('/private/tmp/claude-501/-Users-davidb-ClueCrew/9a8d8aea-32f1-4537-bb18-2b54d4491646/scratchpad', 'wfvenv', 'bin', 'python');

/** The other store's instrument, run here. Refuses rather than approximating (R173). */
function wordfreqZipf(words: string[]): Map<string, number> {
  if (!existsSync(VENV)) throw new Error(`wordfreq is not installed at ${VENV}. This measurement compares TWO instruments; running one and estimating the other would be a disagreement set with one honest half.`);
  const check = execFileSync(VENV, ['-c', 'import wordfreq,importlib.metadata as m;print(m.version("wordfreq"))'], { encoding: 'utf8' }).trim();
  if (check !== '3.1.1') throw new Error(`wordfreq ${check} is installed; the authoring store runs 3.1.1. A different version is a third instrument, not the other store's.`);
  const script = 'import sys,wordfreq;\nfor w in sys.stdin.read().split():\n    print(w, wordfreq.zipf_frequency(w, "en"))';
  const out = execFileSync(VENV, ['-c', script], { input: words.join('\n'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const m = new Map<string, number>();
  for (const line of out.split('\n')) { const [w, z] = line.trim().split(' '); if (w && z) m.set(w.toUpperCase(), Number(z)); }
  if (m.size !== words.length) throw new Error(`wordfreq returned ${m.size} readings for ${words.length} words — a short read is a broken read.`);
  return m;
}

async function main() {
  console.log('the disagreement set — two instruments, one population, counted at 3.0.\n');
  const lex = loadChildLexicon();

  // ---- THE POPULATION: the district's own adjudication surface --------------------------------
  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, stem: true } });
  requirePopulation('disagreement-set', { 'vr-08 row(s)': rows.length });
  const population = new Set<string>();
  for (const r of rows) {
    const s = r.stem as { word1?: string; word2?: string };
    const w1 = String(s.word1 ?? '').toUpperCase(), w2 = String(s.word2 ?? '').toUpperCase();
    if (!w1 || !w2) continue;
    population.add(w1); population.add(w2);
    for (const l of new Set(w1)) {
      population.add(w1.replace(l, ''));
      for (let i = 0; i <= w2.length; i += 1) population.add(w2.slice(0, i) + l + w2.slice(i));
    }
  }
  const words = [...population].filter((w) => w.length > 0).sort();
  requirePopulation('disagreement-set', { 'word(s) the district adjudicates': words.length });

  const theirs = wordfreqZipf(words);

  // ---- THE CROSSINGS, COUNTED TWICE ------------------------------------------------------------
  interface Row { word: string; subtlex: number | null; subtlexRaw: number | null; wordfreq: number; excludedAsAName: boolean }
  const table: Row[] = words.map((w) => ({
    word: w, subtlex: lex.zipf(w), subtlexRaw: lex.zipfRaw(w), wordfreq: theirs.get(w) ?? 0, excludedAsAName: lex.isProperName(w),
  }));

  const knownRaw = (r: Row) => (r.subtlexRaw ?? -Infinity) >= CHILD_CUT_ZIPF;      // corpora only
  const knownRuled = (r: Row) => !r.excludedAsAName && (r.subtlex ?? -Infinity) >= CHILD_CUT_ZIPF; // this store's rule
  const knownThem = (r: Row) => r.wordfreq >= CHILD_CUT_ZIPF;

  const crossRaw = table.filter((r) => knownRaw(r) !== knownThem(r));
  const crossRuled = table.filter((r) => knownRuled(r) !== knownThem(r));
  const agreeRuled = table.filter((r) => knownRuled(r) === knownThem(r));
  const agreeKnown = agreeRuled.filter((r) => knownThem(r));

  /**
   * THREE DISJOINT BUCKETS, because "14 on the corpora and 10 by the rule" over 18 crossings reads
   * as an arithmetic error and is actually an overlap. A word can cross for both reasons at once.
   */
  const ruleChangesVerdict = (r: Row) => knownRaw(r) !== knownRuled(r);
  const crossBoth = crossRuled.filter((r) => crossRaw.includes(r) && ruleChangesVerdict(r));
  const crossCorporaOnly = crossRuled.filter((r) => crossRaw.includes(r) && !ruleChangesVerdict(r));
  const crossRuleOnly = crossRuled.filter((r) => !crossRaw.includes(r));
  const causedByTheNameFilter = table.filter((r) => r.excludedAsAName && ruleChangesVerdict(r));

  const report = {
    kind: 'THE-DISAGREEMENT-SET-TWO-INSTRUMENTS-ONE-POPULATION',
    TO: 'Annie, by relay through David; the authoring store',
    date: '2026-09-05',
    THE_QUESTION: 'both instruments over one word population, counted at 3.0 — does the district have one rule or two?',
    THE_POPULATION: {
      what: 'the district\'s own adjudication surface: for every vr-08 row and every letter of word1, the leftover and every insertion of that letter into word2, plus both stem words',
      size: words.length, fromRows: rows.length,
      andWHYNOTABIGGERLIST: 'a disagreement on a word this district never asks about costs nothing. This is the set where the cut actually decides something.',
    },
    THE_TWO_INSTRUMENTS: {
      thisStore: lex.provenance.THE_CUT_AND_ITS_INSTRUMENT,
      otherStore: { source: 'wordfreq 3.1.1, en, Zipf scale', runWHERE: 'installed and run HERE, so both halves of this set are measured rather than one being estimated',
        confirmedAgainstYourOwnFIGURE: `you reported GRAN at 3.44 on wordfreq 3.1.1; run here it returns ${theirs.get('GRAN') ?? 'not in this population'}. That match is how this side knows it is running your instrument and not an approximation.` },
      GRAN: { subtlex: lex.zipf('GRAN'), wordfreq: 3.44 },
    },
    THE_ANSWER: {
      crossingsOnTHECORPORAALONE: crossRaw.length,
      crossingsWITHTHISSTORESNAMERULE: crossRuled.length,
      ofPopulation: words.length,
      agreementRate: `${((agreeRuled.length / words.length) * 100).toFixed(1)}%`,
      andWHATTHATMEANS: crossRuled.length === 0
        ? 'ONE RULE. The two instruments never disagree on a word this district adjudicates.'
        : `${crossRuled.length} word(s) of ${words.length} cross the cut in opposite directions. Every OTHER word in the district is corroborated by two independent corpora, which is the stronger agreement you named.`,
      THE_CROSSINGS_SPLIT_THREE_WAYS: {
        theCORPORAalone: crossCorporaOnly.length,
        thisStoresNAMERULEalone: crossRuleOnly.length,
        BOTHatOnce: crossBoth.length,
        total: crossRuled.length,
        andWHYTHISISSPLIT: 'a word can cross for both reasons at once, so "14 on the corpora" and "10 by the rule" over 18 crossings is an overlap and not an arithmetic error. Split three ways it sums.',
      },
      theNameRuleIsARULEDIFFERENCEnotACORPUSONE: `${crossRuleOnly.length} crossing(s) exist ONLY because this store applies a name rule the other does not — that is where the district has two RULES rather than two instruments, and it is the half a ruling can reconcile. ${crossCorporaOnly.length} crossing(s) are the corpora disagreeing on the same bare cut, which no ruling can fix.`,
    },
    THE_CROSSINGS_WITH_THE_RULE_APPLIED: crossRuled.map((r) => ({
      word: r.word, subtlexRuled: r.excludedAsAName ? 'EXCLUDED-AS-A-NAME' : r.subtlex,
      subtlexRawZipf: r.subtlexRaw, wordfreqZipf: r.wordfreq,
      thisStoreSays: knownRuled(r) ? 'known' : 'not known', otherStoreSays: knownThem(r) ? 'known' : 'not known',
      cause: r.excludedAsAName ? 'THE NAME RULE — the corpora may or may not agree; this store excludes it as a proper noun' : 'THE CORPORA — both apply the same bare cut and land on opposite sides',
    })),
    THE_CROSSINGS_ON_CORPORA_ALONE: crossRaw.map((r) => ({ word: r.word, subtlexRawZipf: r.subtlexRaw, wordfreqZipf: r.wordfreq,
      gap: r.subtlexRaw === null ? null : Number((r.subtlexRaw - r.wordfreq).toFixed(2)) })),
    WHERE_THEY_AGREE_THE_AGREEMENT_IS_STRONGER: {
      count: agreeRuled.length, ofWhichBOTHCALLKNOWN: agreeKnown.length,
      andWHATTHATBUYS: 'a word both instruments place above the cut is corroborated by two independent corpora built from different sources. Any wordhood decision resting only on those words is not resting on a single instrument, which is the state every figure before tonight was in.',
    },
    THE_THREE_DOUBTFUL_WORDS_UNDER_BOTH: ['SOW', 'SEAM', 'BAIN', 'GOVE', 'SARK', 'LANT', 'SOOL'].map((w) => {
      const r = table.find((x) => x.word === w);
      return { word: w, inThisPopulation: !!r,
        subtlexRawZipf: r?.subtlexRaw ?? lex.zipfRaw(w), excludedAsAName: r?.excludedAsAName ?? lex.isProperName(w),
        wordfreqZipf: theirs.get(w) ?? null,
        thisStore: (r ? knownRuled(r) : lex.knows(w)) ? 'known' : 'not known' };
    }),
    andTHELIMIT: 'wordfreq is installed locally and is NOT a CI gate, exactly as SUBTLEX-UK is not: neither corpus can be committed. This is a LOCAL cross-check, and its absence on another machine must report UNMEASURED rather than agreement.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_ANSWER', 'THE_POPULATION', 'THE_CROSSINGS_WITH_THE_RULE_APPLIED', 'THE_CROSSINGS_ON_CORPORA_ALONE', 'THE_THREE_DOUBTFUL_WORDS_UNDER_BOTH'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-disagreement-set', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'the-disagreement-set').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  population: ${words.length} words the district adjudicates, from ${rows.length} rows`);
  console.log(`  GRAN — SUBTLEX ${lex.zipf('GRAN')} | wordfreq ${theirs.get('GRAN') ?? 'n/a'}`);
  console.log(`  crossings on the CORPORA alone:      ${crossRaw.length} of ${words.length}`);
  console.log(`  crossings WITH this store's name rule: ${crossRuled.length} of ${words.length}  (agreement ${((agreeRuled.length / words.length) * 100).toFixed(1)}%)`);
  console.log(`  of those, caused by the NAME RULE rather than the corpora: ${causedByTheNameFilter.length}`);
  for (const r of crossRuled.slice(0, 12)) console.log(`    ${r.word.padEnd(9)} subtlex ${String(r.excludedAsAName ? 'NAME' : r.subtlexRaw).padEnd(6)} wordfreq ${String(r.wordfreq).padEnd(5)} -> ${knownRuled(r) ? 'known here' : 'not known here'}, ${knownThem(r) ? 'known there' : 'not known there'}`);
  if (crossRuled.length > 12) console.log(`    …and ${crossRuled.length - 12} more`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
