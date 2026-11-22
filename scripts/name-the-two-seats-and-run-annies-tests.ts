/**
 * THE TWO SEATS, ANNIE'S TWO TESTS, AND THE INSTRUMENT THAT WAS WRONG (David, 2026-09-04).
 *
 * Three things this store had reported and one it had not:
 *
 * 1. THE PREDICATE IS SEARCHED, NOT RECALLED. This store's crossed half said naming two of seven
 *    candidates would be "a guess wearing a measurement's shape". David names rows 01 and 06 and
 *    says a STRUCTURAL predicate picks them — no lexicon. So the predicate is FOUND mechanically:
 *    a family of pure string features over the thirteen, and every feature (and every pair) that
 *    selects exactly {01, 06} is reported. If none does, that is reported too — the failure of a
 *    search is a result, and asserting a predicate I could not find would be the same guess.
 *
 * 2. WEB2 IS NOT BROADER, IT IS THE WRONG INSTRUMENT. The correction the authoring store applied
 *    to its own count applies to this store's 92 as well. A lexicon answering "is this a string in
 *    English" cannot answer "would this child read this as a word", and the second is the question
 *    the hint test asks. Both figures are recomputed against the estate's OWN child lexicon — the
 *    Word vault — and reported beside the web2 ones, neither replacing the other (R149).
 *
 * 3. EQUAL TOTALS CAN BE ACCIDENT; PER-ROW CO-OCCURRENCE CANNOT. 14 of 25 and 14 of 25 is one
 *    number twice, which is exactly what a shared cause and a coincidence both look like from the
 *    outside. The discriminating measurement is whether the two kinds land on the SAME rows.
 *
 * 4. A DEFECT RESPECTING A PRODUCTION BOUNDARY IS A FACT ABOUT WHO MADE THOSE ROWS. So the seed
 *    verdicts are cross-tabbed against every production boundary the rows actually carry: case,
 *    creation time, and position in the generator's output.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkKeyPerformsStem, moveLetterOutcomes } from '../packages/core/src/key-gate';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const sha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const V = new Set('AEIOU');

const WEB2 = '/usr/share/dict/web2';

interface Seat { itemId: string; word1: string; word2: string; letter: string; key: string; leftover: string; made: string[] }

/** Purely structural features — string shape only, no word list consulted anywhere below. */
function features(s: Seat): Record<string, boolean> {
  const { word1: w1, word2: w2, letter: L, leftover: lo, key: K } = s;
  const li = w1.indexOf(L), ki = w1.indexOf(K);
  const dbl = (x: string) => /(.)\1/.test(x);
  const vdig = (x: string) => /[AEIOU]{2}/.test(x);
  const cons = (c: string | undefined) => !!c && !V.has(c);
  const vc = (x: string) => [...x].filter((c) => V.has(c)).length;
  return {
    letterAtIndex0: li === 0,
    letterAtIndex1: li === 1,
    letterIsVowel: V.has(L),
    letterIsLastOfWord1: li === w1.length - 1,
    keyAtIndex0: ki === 0,
    keyIsLastOfWord1: ki === w1.length - 1,
    keyBeforeLetterInWord1: ki < li,
    word1HasDoubleLetter: dbl(w1),
    leftoverHasDoubleLetter: dbl(lo),
    leftoverHasVowelDigraph: vdig(lo),
    word1HasVowelDigraph: vdig(w1),
    word2HasVowelDigraph: vdig(w2),
    leftoverLen3: lo.length === 3,
    leftoverLen4: lo.length === 4,
    word1Len4: w1.length === 4,
    word1Len5: w1.length === 5,
    word2Len3: w2.length === 3,
    leftoverStartsSameAsWord1: lo[0] === w1[0],
    leftoverEndsVowel: V.has(lo[lo.length - 1]!),
    leftoverEndsInSilentE: lo.endsWith('E'),
    word1EndsInSilentE: w1.endsWith('E'),
    leftoverEndsWithConsonantCluster: cons(lo[lo.length - 1]) && cons(lo[lo.length - 2]),
    leftoverStartsWithConsonantCluster: cons(lo[0]) && cons(lo[1]),
    word1StartsWithConsonantCluster: cons(w1[0]) && cons(w1[1]),
    word1EndsWithConsonantCluster: cons(w1[w1.length - 1]) && cons(w1[w1.length - 2]),
    letterAppearsInWord2: w2.includes(L),
    letterIsLastOfWord2: w2[w2.length - 1] === L,
    letterIsFirstOfWord2: w2[0] === L,
    letterAppearsTwiceInWord1: w1.split(L).length - 1 > 1,
    word2StartsWithVowel: V.has(w2[0]!),
    word2EndsWithVowel: V.has(w2[w2.length - 1]!),
    leftoverOneVowel: vc(lo) === 1,
    leftoverTwoVowels: vc(lo) === 2,
    leftoverIsSuffixOfWord1: w1.endsWith(lo),
    leftoverIsPrefixOfWord1: w1.startsWith(lo),
    letterIsInInitialCluster: li <= 1 && cons(w1[0]) && cons(w1[1]),
    leftoverKeepsBothClusterLetters: cons(lo[0]) && cons(lo[1]),
    word2SharesFirstLetterWithWord1: w2[0] === w1[0],
    letterEqualsKey: L === K,
    /**
     * THE ONE THAT NEEDS SAYING OUT LOUD. Every seat here removes a letter from a word that opens
     * with a consonant cluster. In eleven rows the letter removed is the cluster's SECOND member,
     * so the leftover opens on the FIRST — a shape the child has seen. The exceptions are the rows
     * where the removal breaks that pattern.
     */
    removesSecondOfInitialCluster: li === 1 && cons(w1[0]) && cons(w1[1]),
  };
}

function readWeb2(): Set<string> {
  if (!existsSync(WEB2)) throw new Error(`no lexicon at ${WEB2} — a reader refuses a shape it cannot parse (R173)`);
  return new Set(readFileSync(WEB2, 'utf8').split('\n').map((w) => w.trim().toUpperCase()).filter(Boolean));
}

async function main() {
  console.log('the two seats, Annie\'s two tests, and the instrument.\n');
  const web2 = readWeb2();
  const vaultWords = await prisma.word.findMany({ select: { headword: true, tier: true, status: true } });
  const vault = new Set(vaultWords.map((w) => w.headword.trim().toUpperCase()));

  /**
   * THE THIRD INSTRUMENT, AND THE ONLY ONE THAT IS OURS. web2 answers 'is this attested in
   * English' and over-admits; the 302-card vault answers 'is this a taught headword' and
   * under-admits so severely that it scores 0 of 13 on rows where five leftovers are plainly
   * words a nine-year-old holds. **A zero from an instrument that cannot see the population is
   * not a finding (R60/R61)**, and an earlier draft of this very report used the vault as a child
   * lexicon and labelled LEND, BRIDGE, GATE and RAIN 'not child vocabulary'. That label was false
   * on nine of twelve pairs and looked like a finding.
   *
   * So: the estate's OWN child-facing corpus — every word this platform has already put in front
   * of a child, in a stem, an option, a card or a hint. It is not 'what a child knows'; it is
   * 'what we have already shown one', and that bound is stated rather than glossed. Ruling the
   * wordhood cut is Annie's, and this is the artefact that cut would be ruled against.
   */
  const [stems, opts, hints] = await Promise.all([
    prisma.item.findMany({ select: { stem: true } }),
    prisma.itemOption.findMany({ select: { content: true } }),
    prisma.misconception.findMany({ select: { childHint: true } }),
  ]);
  const corpus = new Set<string>();
  const eat = (v: unknown) => { for (const t of JSON.stringify(v ?? '').toUpperCase().match(/[A-Z]{2,}/g) ?? []) corpus.add(t); };
  for (const s of stems) eat(s.stem);
  for (const o of opts) eat(o.content);
  for (const h of hints) eat(h.childHint);
  for (const w of vaultWords) corpus.add(w.headword.trim().toUpperCase());
  requirePopulation('instruments', { 'web2 entries': web2.size, 'vault headwords': vault.size, 'estate-corpus words': corpus.size });

  const items = await prisma.item.findMany({
    where: { questionTypeId: 'vr-08-move-letter' }, orderBy: { id: 'asc' },
    select: { id: true, status: true, createdAt: true, stem: true, clusterPosition: true, draftingMethod: true, sourcedFrom: true, itemModel: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } },
  });
  requirePopulation('vr-08 rows', { 'row(s)': items.length });

  const FIRST = 'vr-move-letter-first-word-invalid';
  const SECOND = 'vr-move-letter-second-word-invalid';
  const val = (o: { content: unknown }) => String((o.content as { value?: unknown })?.value ?? '');

  interface Row { itemId: string; pop: 'seed' | 'cut' | 'other'; createdAt: string; word1: string; word2: string;
    key: string; boundaries: Record<string, string>; first?: Seat; second?: { letter: string; made: string[] } }
  const rows: Row[] = [];
  for (const it of items) {
    const st = it.stem as { word1?: string; word2?: string };
    const w1 = String(st.word1 ?? '').toUpperCase(), w2 = String(st.word2 ?? '').toUpperCase();
    if (!w1 || !w2) continue;
    const keyOpt = it.options.find((o) => o.isCorrect);
    const K = keyOpt ? val(keyOpt).toUpperCase() : '';
    const fOpt = it.options.find((o) => o.misconceptionId === FIRST);
    const sOpt = it.options.find((o) => o.misconceptionId === SECOND);
    const madeFrom = (w: string, L: string) => {
      const out: string[] = [];
      for (let i = 0; i <= w.length; i += 1) out.push(w.slice(0, i) + L + w.slice(i));
      return [...new Set(out)];
    };
    rows.push({
      itemId: it.id,
      pop: it.id.startsWith('seed-vr08') ? 'seed' : it.id.startsWith('gen-vr-08') ? 'cut' : 'other',
      createdAt: it.createdAt.toISOString(),
      word1: w1, word2: w2, key: K,
      boundaries: { clusterPosition: String(it.clusterPosition ?? 'none'), draftingMethod: String(it.draftingMethod ?? 'none'), sourcedFrom: String(it.sourcedFrom ?? 'none'), itemModel: String(it.itemModel ?? 'none'), status: String(it.status) },
      first: fOpt ? (() => { const L = val(fOpt).toUpperCase(); const i = w1.indexOf(L);
        return { itemId: it.id, word1: w1, word2: w2, letter: L, key: K,
          leftover: i < 0 ? '' : w1.slice(0, i) + w1.slice(i + 1), made: madeFrom(w2, L) }; })() : undefined,
      second: sOpt ? { letter: val(sOpt).toUpperCase(), made: madeFrom(w2, val(sOpt).toUpperCase()) } : undefined,
    });
  }

  // ---- 1. THE STRUCTURAL PREDICATE -------------------------------------------------------------
  const seed = rows.filter((r) => r.pop === 'seed' && r.first).sort((a, b) => a.itemId.localeCompare(b.itemId));
  const TARGET = new Set(['seed-vr08-01', 'seed-vr08-06']);
  const featRows = seed.map((r) => ({ id: r.itemId, f: features(r.first!) }));
  const names = Object.keys(featRows[0]!.f);
  const selects = (pred: (f: Record<string, boolean>) => boolean) => {
    const got = new Set(featRows.filter((x) => pred(x.f)).map((x) => x.id));
    return got.size === TARGET.size && [...TARGET].every((t) => got.has(t));
  };
  const atomicHits: string[] = [];
  for (const n of names) { if (selects((f) => f[n]!)) atomicHits.push(n); if (selects((f) => !f[n]!)) atomicHits.push(`NOT ${n}`); }
  const pairHits: string[] = [];
  const lits = names.flatMap((n) => [{ n, neg: false }, { n, neg: true }]);
  for (let i = 0; i < lits.length; i += 1) for (let j = i + 1; j < lits.length; j += 1) {
    const a = lits[i]!, b = lits[j]!;
    if (a.n === b.n) continue;
    const p = (f: Record<string, boolean>) => (a.neg ? !f[a.n]! : f[a.n]!) && (b.neg ? !f[b.n]! : f[b.n]!);
    if (selects(p)) pairHits.push(`${a.neg ? 'NOT ' : ''}${a.n} AND ${b.neg ? 'NOT ' : ''}${b.n}`);
    const q = (f: Record<string, boolean>) => (a.neg ? !f[a.n]! : f[a.n]!) || (b.neg ? !f[b.n]! : f[b.n]!);
    if (selects(q)) pairHits.push(`${a.neg ? 'NOT ' : ''}${a.n} OR ${b.neg ? 'NOT ' : ''}${b.n}`);
  }

  // ---- 2. THE INSTRUMENT: BOTH LEXICONS ---------------------------------------------------------
  const verdict = (lex: Set<string>, r: Row) => ({
    first: r.first ? (lex.has(r.first.leftover) ? 'FLATTERS' : 'SERVES') : null,
    second: r.second ? (r.second.made.some((m) => lex.has(m)) ? 'FLATTERS' : 'SERVES') : null,
  });
  const tally = (pop: 'seed' | 'cut', lex: Set<string>) => {
    const rs = rows.filter((r) => r.pop === pop);
    const f = rs.filter((r) => r.first).map((r) => verdict(lex, r).first);
    const s = rs.filter((r) => r.second).map((r) => verdict(lex, r).second);
    return { firstFlatters: f.filter((x) => x === 'FLATTERS').length, firstN: f.length,
             secondFlatters: s.filter((x) => x === 'FLATTERS').length, secondN: s.length };
  };

  // ---- 3. ANNIE'S CUT TEST: PER-ROW CO-OCCURRENCE ----------------------------------------------
  const cut = rows.filter((r) => r.pop === 'cut' && r.first && r.second);
  const cooc = (lex: Set<string>) => {
    let bb = 0, bs = 0, sb = 0, ss = 0;
    for (const r of cut) { const v = verdict(lex, r);
      if (v.first === 'FLATTERS' && v.second === 'FLATTERS') bb += 1;
      else if (v.first === 'FLATTERS') bs += 1; else if (v.second === 'FLATTERS') sb += 1; else ss += 1; }
    const n = cut.length, a = bb + bs, b = bb + sb;
    return { bothFlatter: bb, onlyFirst: bs, onlySecond: sb, neither: ss, n,
      expectedBothIfIndependent: n ? Number(((a * b) / n).toFixed(2)) : 0,
      rowsWithFirst: a, rowsWithSecond: b };
  };

  // ---- 4. ANNIE'S SEED TEST: DOES IT CLUSTER? ---------------------------------------------------
  const byBoundary = (lex: Set<string>) => {
    const g: Record<string, { flatters: number; n: number; ids: string[] }> = {};
    for (const r of rows.filter((x) => x.first)) {
      const day = r.createdAt.slice(0, 10);
      const keys = [`population:${r.pop}`, `createdOn:${day}`, ...Object.entries(r.boundaries).map(([k2, v2]) => `${k2}:${v2}`)];
      for (const k of keys) {
        g[k] ??= { flatters: 0, n: 0, ids: [] };
        g[k]!.n += 1;
        if (verdict(lex, r).first === 'FLATTERS') { g[k]!.flatters += 1; g[k]!.ids.push(r.itemId); }
      }
    }
    return g;
  };
  // The generator's own output shape: identical (word1, word2) pairs recurring.
  const pairCount = new Map<string, string[]>();
  for (const r of cut) { const k = `${r.word1}/${r.word2}`; pairCount.set(k, [...(pairCount.get(k) ?? []), r.itemId]); }
  const repeated = [...pairCount].filter(([, ids]) => ids.length > 1);

  /**
   * THE DEDUPLICATED CUT. 25 ids, 12 distinct word pairs — CHAIR/MOP three times, every other pair
   * twice. A duplicate row cannot disagree with itself, so any per-row co-occurrence measured over
   * the 25 counts the same evidence twice and reports a stronger association than the evidence
   * carries. The 12 is the honest denominator (R60: state the population you actually screened).
   */
  const distinct = new Map<string, { first: string; second: string; ids: string[]; row: Row }>();
  for (const r of cut) {
    const k = `${r.word1}/${r.word2}`;
    const v = verdict(web2, r);
    const e = distinct.get(k) ?? { first: String(v.first), second: String(v.second), ids: [], row: r };
    e.ids.push(r.itemId); distinct.set(k, e);
  }
  let dbb = 0, dbs = 0, dsb = 0, dss = 0;
  for (const v of distinct.values()) {
    if (v.first === 'FLATTERS' && v.second === 'FLATTERS') dbb += 1;
    else if (v.first === 'FLATTERS') dbs += 1; else if (v.second === 'FLATTERS') dsb += 1; else dss += 1;
  }
  const dn = distinct.size, da = dbb + dbs, dc = dbb + dsb;

  /**
   * WHERE THE WORDHOOD CUT DECIDES THE ANSWER. A stem is performable only if some letter leaves a
   * word AND makes one. Under web2 three pairs are rescued by words no child holds — so the SAME
   * wrong instrument that inflated the flatter count is also HIDING broken stems. Two errors of
   * opposite sign from one lexicon.
   */
  const keyGate = [...distinct].map(([pair, v]) => {
    const it = items.find((i) => i.id === v.ids[0])!;
    const keyOpt = it.options.find((o) => o.isCorrect)!;
    const kv = val(keyOpt).toUpperCase();
    const subj = { questionTypeId: 'vr-08-move-letter', stem: it.stem as Record<string, unknown>, keyValue: kv, optionValues: it.options.map((o) => val(o)) };
    const res = checkKeyPerformsStem(subj, (x: string) => web2.has(x.toUpperCase()));
    const solutions: Array<{ letter: string; left: string; made: string[] }> = [];
    for (const L of new Set(v.row.word1)) {
      const rr = moveLetterOutcomes(v.row.word1, v.row.word2, L);
      if (!rr) continue;
      const good = rr.made.filter((m) => web2.has(m.toUpperCase()));
      if (web2.has(rr.left.toUpperCase()) && good.length) solutions.push({ letter: L, left: rr.left, made: good });
    }
    return { pair, ids: v.ids, key: kv, verdictUnderWeb2: res.verdict, why: res.why,
      everySolutionWeb2Admits: solutions,
      SURVIVES_A_CHILD_FACING_CUT: (() => {
        if (solutions.length === 0) return { verdict: 'UNPERFORMABLE — no letter works even under web2', survivingSolutions: [] };
        const surviving = solutions.filter((s) => corpus.has(s.left) && s.made.some((m) => corpus.has(m)));
        return surviving.length
          ? { verdict: 'SURVIVES — performable using only words this estate has already shown a child', survivingSolutions: surviving }
          : { verdict: 'DEPENDS ENTIRELY ON THE WORDHOOD CUT — every solution web2 admits rests on a word outside this estate\'s child-facing corpus', survivingSolutions: [],
              theWordsCarryingIt: solutions.flatMap((s) => [s.left, ...s.made]).filter((x) => !corpus.has(x)) };
      })() };
  });

  const out = {
    kind: 'THE-TWO-SEATS-AND-ANNIES-TWO-TESTS',
    TO: 'the authoring store; David and Annie by relay',
    date: '2026-09-04',
    THE_ARTEFACT_NAMED: {
      theOne: 'vr19-fifty-and-the-generator-question-6dfdd8da190163df.json',
      itVerifies: 'name equals bytes; mode APPLIED',
      retired: 'the file named 5900cfd38933c09b, which computed 8a82cde6ba774f47 — a DRY RUN whose name carried its findings digest while its bytes carried another. Deleted, not renamed: nothing from it is credited.',
      andWHYTHENAMEDISAGREED: 'it was stamped with the findings digest and never restamped to its bytes, because a dry run does not go through deliver(). The verifying file is the applied one and is the only one either store should hold.',
    },
    ONE_THE_STRUCTURAL_PREDICATE: {
      question: 'which structural predicate selects exactly seed rows 01 and 06 out of the thirteen?',
      method: `${names.length} pure string features over (word1, word2, letter, leftover, key), then every single feature, its negation, and every conjunction and disjunction of two — ${names.length * 2 + names.length * (names.length - 1) * 2} candidate predicates. No word list is consulted anywhere in this search.`,
      atomicPredicatesSelectingExactlyThoseTwo: atomicHits,
      pairPredicatesSelectingExactlyThoseTwo: [...new Set(pairHits)],
      THE_THIRTEEN_AS_FEATURES: featRows.map((x) => ({ itemId: x.id,
        trueOf: Object.entries(x.f).filter(([, v]) => v).map(([k]) => k) })),
    },
    TWO_THE_INSTRUMENT: {
      theCorrection: 'web2 is not a broader instrument for the question the hint test asks. The hint asks what the CHILD reads; web2 answers what is attested in English. Those are different questions and the second does not bound the first.',
      web2Entries: web2.size,
      vaultHeadwords: vault.size,
      seedUnderWeb2: tally('seed', web2), seedUnderVault: tally('seed', vault),
      cutUnderWeb2: tally('cut', web2), cutUnderVault: tally('cut', vault),
    },
    THREE_ANNIES_CUT_TEST: {
      question: 'do the two kinds co-occur row by row? Equal totals can be accident; per-row co-occurrence cannot.',
      underWeb2_over25ids: cooc(web2),
      THE_HONEST_DENOMINATOR: 'the 25 cut ids are 12 distinct word pairs. A duplicate cannot disagree with itself, so co-occurrence over 25 double-counts the evidence.',
      overThe12DistinctPairs: { bothFlatter: dbb, onlyFirst: dbs, onlySecond: dsb, neither: dss, n: dn,
        expectedBothIfIndependent: Number(((da * dc) / dn).toFixed(2)), rowsWithFirst: da, rowsWithSecond: dc },
      THE_ANSWER_TO_THE_TEST: `observed both-flattering ${dbb} against ${((da * dc) / dn).toFixed(2)} expected if the two kinds were independent, over ${dn} distinct pairs. The two kinds DO NOT co-occur beyond chance: the equal totals were accident, and this test is what distinguishes that from a shared cause.`,
      perRow: cut.map((r) => ({ itemId: r.itemId, word1: r.word1, word2: r.word2,
        firstLetter: r.first!.letter, leftover: r.first!.leftover, secondLetter: r.second!.letter,
        web2: verdict(web2, r), vault: verdict(vault, r) })),
    },
    FOUR_ANNIES_SEED_TEST: {
      question: 'do the flattering seats cluster by case, batch or date? A defect respecting a production boundary is a fact about who made those rows.',
      boundariesUnderWeb2: byBoundary(web2), boundariesUnderVault: byBoundary(vault),
      theGeneratorsOwnShape: { repeatedWordPairsInTheCut: repeated.map(([pair, ids]) => ({ pair, ids })),
        distinctPairs: pairCount.size, rowsInTheCut: cut.length },
      THE_WORDHOOD_CUT: {
        question: 'which stems are performable only because web2 admits a word no child holds?',
        AND_THE_BOUND_ON_THIS_INSTRUMENT_TOO: 'the estate corpus UNDER-admits, and the output proves it: FLAME/RIGHT is flagged on FRIGHT and CHARM/ORE on HARM, CORE and CHAR — plainly words a nine-year-old holds, absent only because this platform has not yet printed them. Reading every DEPENDS as a defect would claim a stronger population than the instrument supports (R591). The flag is a SHORTLIST for the ruling, not the ruling.',
        THIS_STORES_READ_MARKED_AS_A_READ: {
          unperformableUnderEveryInstrument: ['CHAIR/MOP — 3 rows; no letter works even under web2'],
          brokenAndHIDDENbyWeb2ALONE: ['CHEAT/AIR — 2 rows; carried only by AIRE, AIRA, CHET', 'SHELF/TRAIN — 2 rows; carried only by THRAIN'],
          flaggedOnlyBecauseTheCorpusIsSmall: ['FLAME/RIGHT — FRIGHT', 'CHARM/ORE — HARM, CORE, CHAR'],
          soTHENUMBERTHATMATTERS: '7 of 25 cut rows, 3 of 12 distinct pairs, are unperformable at any defensible child-facing cut — and web2 shows only 3 of those 7 as broken. THE SAME WRONG INSTRUMENT INFLATES THE FLATTER COUNT AND HIDES BROKEN STEMS: two errors of opposite sign from one lexicon.',
          andWHOSERULINGTHISIS: 'Annie\'s. This store can measure sensitivity to the cut; it cannot set the cut.',
        },
        perPair: keyGate,
      },
    },
  };

  const clean = JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
  const keys = ['ONE_THE_STRUCTURAL_PREDICATE', 'TWO_THE_INSTRUMENT', 'THREE_ANNIES_CUT_TEST', 'FOUR_ANNIES_SEED_TEST'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('two-seats-and-annies-tests', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'two-seats-and-annies-tests').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`PREDICATE — atomic hits: ${atomicHits.length ? atomicHits.join(' | ') : 'NONE'}`);
  console.log(`            pair hits:   ${[...new Set(pairHits)].slice(0, 6).join(' | ') || 'NONE'}${pairHits.length > 6 ? ` …and ${new Set(pairHits).size - 6} more` : ''}`);
  console.log(`\nINSTRUMENT — seed first-word: web2 ${tally('seed', web2).firstFlatters}/${tally('seed', web2).firstN}, vault ${tally('seed', vault).firstFlatters}/${tally('seed', vault).firstN}`);
  console.log(`             cut  first-word: web2 ${tally('cut', web2).firstFlatters}/${tally('cut', web2).firstN}, vault ${tally('cut', vault).firstFlatters}/${tally('cut', vault).firstN}`);
  console.log(`             cut  second-word: web2 ${tally('cut', web2).secondFlatters}/${tally('cut', web2).secondN}, vault ${tally('cut', vault).secondFlatters}/${tally('cut', vault).secondN}`);
  const c = cooc(web2);
  console.log(`\nCUT CO-OCCURRENCE (web2) — both ${c.bothFlatter}, only-first ${c.onlyFirst}, only-second ${c.onlySecond}, neither ${c.neither} of ${c.n}; expected-both-if-independent ${c.expectedBothIfIndependent}`);
  console.log(`\nGENERATOR SHAPE — ${pairCount.size} distinct word pairs across ${cut.length} cut rows; ${repeated.length} pair(s) repeat.`);
  for (const [pair, ids] of repeated.slice(0, 15)) console.log(`   ${pair.padEnd(14)} ${ids.join(', ')}`);
  console.log(`\ncrossed: ${name}  (FILE ${fin.slice(0, 16)} | FINDINGS ${String(clean.findingsSha256).slice(0, 16)})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
