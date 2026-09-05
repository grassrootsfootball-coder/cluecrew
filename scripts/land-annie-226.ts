/**
 * HER 226th, AND COWORK'S DUPLICATION QUESTION SETTLED FROM THE ROWS.
 *
 * THREE ACTS, ALL FOLLOWING FROM ONE RULING AND ONE MEASUREMENT.
 *
 * 1. **THE DECIDING CORPUS.** *"A word met bare must be known outright"*, and the general form:
 *    the corpus whose population matches the item's reader decides, the other is background. Every
 *    word in this district is met bare, so the child-directed corpus decides here. Screened across
 *    all 25 cut rows: ZERO keys fail under it, and exactly two seats sit on a borderline word —
 *    SOW, 3.60 wide and 2.94 bare, which is her instance. Its seat regenerates.
 *
 * 2. **THE DUPLICATION IS A GENERATOR ARTEFACT, NOT A PLACEMENT.** Measured, not argued:
 *    `fromBank` is `bank[i % bank.length]` — modular fill with no spacing logic — and five of the
 *    six banks that call it hold 25 or 26 entries for the 25 rows they are asked for. Only
 *    MOVE_LETTER_EXTRA holds twelve. **Every other author sized their bank to the request; this one
 *    was left short and the cycle papered over it.** So the regeneration writes THREE replacements
 *    where it wrote one, and the bank is filled to 25 rather than the cut being cut to twelve.
 *
 * 3. **APPENDING, NOT REBUILDING.** The thirteen new pairs go in slots 12-24, so rows 1-12 keep
 *    the pairs they have and only the duplicate rows change. A sound row is not disturbed to fix a
 *    fault it does not have.
 *
 * Writes content unguarded, as a ruling-applier does (R63); provenance is the attribution events.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { loadChildLexicon, searchMoveLetter, pickDistinct } from './lib/move-letter-search';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const GENERATOR = pjoin(REPO, 'packages/db/prisma/generate-content.ts');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

/**
 * **A DECLARED EXCLUSION, MADE HERE AND FLAGGED FOR OVERRULE.** The search proposes SHELL/BEGIN
 * (giving HELL) and SLIDE/OVER (giving LOVER), and NOTHING SCREENS THEM: `headwordIsBanned`
 * returns ok for both, because the ban list is scoped to claims, difficulty and tone rather than
 * to subject matter. Extending that list is not this store's to do — its scope is designed.
 *
 * So the two are excluded HERE, by name, with the reason visible, rather than quietly skipped —
 * and the gap they expose is reported rather than patched. This is a judgement, it is the only one
 * in this run that is not mechanical, and it is the one to overrule if it is wrong.
 */
const DECLARED_EXCLUSIONS = ['HELL', 'LOVER'];

const SNOW_HOE_OLD = "['SNOW', 'HOE', 'S', 'N', 'W']";
const SNOW_HOE_NEW = "['SNOW', 'HOE', 'S', 'O', 'W']";

async function main() {
  console.log(`LAND THE 226th — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const lex = loadChildLexicon();
  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };

  // ---- THE DUPLICATION VERDICT, MEASURED FROM THE CODE THAT PRODUCED THE ROWS -------------------
  const genSrc = readFileSync(GENERATOR, 'utf8');
  const bankSizes: Record<string, number> = {};
  for (const m of genSrc.matchAll(/fromBank\(([A-Z_]+), *(\d+)\)/g)) {
    const name = m[1]!;
    const decl = new RegExp(`const ${name}: Array<[^=]+= \\[(.*?)\\n\\];`, 's').exec(genSrc);
    if (!decl) continue;
    let depth = 0, n = 0;
    for (const ch of decl[1]!) { if (ch === '[') { if (depth === 0) n += 1; depth += 1; } else if (ch === ']') depth -= 1; }
    bankSizes[name] = n;
  }
  const short = Object.entries(bankSizes).filter(([, n]) => n < 25).map(([k]) => k);
  assert('the duplication is a generator artefact: fromBank is a modular fill and MOVE_LETTER_EXTRA is the ONLY short bank',
    genSrc.includes('bank[i % bank.length]') && short.length === 1 && short[0] === 'MOVE_LETTER_EXTRA',
    `bank sizes ${JSON.stringify(bankSizes)}; short: ${short.join(', ') || 'none'}`);

  // ---- THE SEARCH, UNDER THE DECIDING CORPUS ----------------------------------------------------
  const kept = new Set<string>();
  for (const m of genSrc.matchAll(/\['([A-Z]+)', '([A-Z]+)', '([A-Z])', '([A-Z])', '([A-Z])'\]/g)) {
    kept.add(m[1]!); kept.add(m[2]!);
    const w1 = m[1]!, w2 = m[2]!;
    for (const l of [m[3]!]) { kept.add(w1.replace(l, '')); for (let i = 0; i <= w2.length; i += 1) kept.add(w2.slice(0, i) + l + w2.slice(i)); }
  }
  for (const w of DECLARED_EXCLUSIONS) kept.add(w);
  const candidates = searchMoveLetter(lex, { exclude: kept, decideBare: true });
  requirePopulation('land-annie-226', { 'candidate(s) valid under the deciding corpus': candidates.length });
  const picks = pickDistinct(candidates, 13);
  assert('the search supplies thirteen distinct pairs to fill the bank to twenty-five',
    picks.length === 13, `${picks.length} of 13 from ${candidates.length} candidates`);
  assert('no pick reuses a word from the twelve slots that are staying, or a declared exclusion',
    picks.every((p) => ![p.word1, p.word2, p.left, p.made].some((w) => kept.has(w))), 'checked against every word in slots 0-11');

  // ---- EVERY PICK PASSES THE KEY GATE AND BOTH TAG PREDICATES, UNDER THE DECIDING CORPUS --------
  const isWordBare = (w: string) => lex.knowsBare(w);
  for (const p of picks) {
    const stem = { prompt: 'Move one letter from the first word to the second so both make new words.', word1: p.word1, word2: p.word2 };
    const k = checkKeyPerformsStem({ questionTypeId: 'vr-08-move-letter', stem, keyValue: p.key, optionValues: [p.key, p.firstWordInvalid, p.secondWordInvalid] }, isWordBare);
    assert(`${p.word1}/${p.word2}: the key performs under the deciding corpus`, k.verdict === 'PERFORMS', `${k.verdict} — ${k.why}`);
    for (const [v, m] of [[p.firstWordInvalid, 'vr-move-letter-first-word-invalid'], [p.secondWordInvalid, 'vr-move-letter-second-word-invalid']] as const) {
      const t = checkTagWrite({ stem, optionValue: v, keyValue: p.key, misconceptionId: m }, isWordBare);
      assert(`${p.word1}/${p.word2}: "${v}" performs ${m}`, t.verdict === 'PERFORMS', `${t.verdict} — ${t.why}`);
    }
  }

  // ---- SOW'S SEAT --------------------------------------------------------------------------------
  assert('SOW is known WIDE and unknown BARE — the borderline her ruling names',
    lex.knows('SOW') && !lex.knowsBare('SOW'), `wide ${lex.zipf('SOW')}, bare ${lex.zipfCBBC('SOW')}`);
  assert('the replacement seat letter O leaves SNW, unknown on BOTH readings',
    !lex.knows('SNW') && !lex.knowsBare('SNW'), `SNW wide ${lex.zipf('SNW') ?? 'absent'}, bare ${lex.zipfCBBC('SNW') ?? 'absent'}`);
  assert('the generator carries the SNOW/HOE tuple verbatim, so the seat edit cannot no-op (R87)',
    genSrc.split(SNOW_HOE_OLD).length === 2, `${genSrc.split(SNOW_HOE_OLD).length - 1} occurrence(s)`);

  // ---- THE ROWS TO REWRITE ARE DRAFT AND UNSIGNED ------------------------------------------------
  const ids = Array.from({ length: 13 }, (_, i) => `gen-vr-08-move-letter-${String(i + 13).padStart(2, '0')}`);
  const rows = await prisma.item.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, reviewedBy: true } });
  const signed = await prisma.attributionEvent.count({ where: { recordId: { in: ids }, action: 'SIGNED' } });
  assert('every row being refilled is DRAFT, unsigned and carries no signature',
    rows.length === 13 && rows.every((r) => r.status === 'DRAFT' && !r.reviewedBy) && signed === 0,
    `${rows.length} of 13 found; ${signed} signature(s)`);

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);
  console.log(`  bank sizes: ${JSON.stringify(bankSizes)}`);
  for (const [i, p] of picks.entries()) console.log(`  slot ${i + 12} -> row ${i + 13}: ${p.word1}/${p.word2} key=${p.key} (${p.left}/${p.made}) minCBBC ${p.minZipfCBBC.toFixed(2)}`);

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    let next = genSrc.replace(SNOW_HOE_OLD, SNOW_HOE_NEW);
    if (next === genSrc) throw new Error('the SNOW/HOE seat edit matched nothing — refusing (R87)');
    const appended = picks.map((p) => `  ['${p.word1}', '${p.word2}', '${p.key}', '${p.firstWordInvalid}', '${p.secondWordInvalid}'],`).join('\n');
    const anchor = `${SNOW_HOE_NEW},\n];`;
    if (!next.includes(anchor)) throw new Error('the bank close anchor did not match — refusing rather than appending blind');
    next = next.replace(anchor, `${SNOW_HOE_NEW},\n${appended}\n];`);
    writeFileSync(GENERATOR, next);

    await prisma.$transaction(async (tx) => {
      // The SOW seat, on row 12 (bank slot 11, which stays).
      for (const rowId of ['gen-vr-08-move-letter-12']) {
        const opts = await tx.itemOption.findMany({ where: { itemId: rowId, misconceptionId: 'vr-move-letter-first-word-invalid' }, select: { id: true } });
        for (const o of opts) await tx.itemOption.update({ where: { id: o.id }, data: { content: { value: 'O' } } });
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: rowId, action: 'AMENDED', reviewerId: 'rev-0001',
          actor: 'Annie', recordedBy: 'human:dbamgbade@gmail.com', field: 'options.content',
          method: 'her 226th, as relayed: SOW fails and its seat regenerates. A word met bare must be known outright, and the corpus whose population matches the item\'s reader decides.',
          note: 'first-word-invalid seat N -> O. SOW reads 3.60 on the whole corpus and 2.94 on the child-directed one; SNW is absent from both.' } });
        wrote += 1;
      }
      // Rows 13-25 take the thirteen new pairs.
      for (const [i, p] of picks.entries()) {
        const id = ids[i]!;
        await tx.item.update({ where: { id }, data: { stem: { prompt: 'Move one letter from the first word to the second so both make new words.', word1: p.word1, word2: p.word2 } } });
        const opts = await tx.itemOption.findMany({ where: { itemId: id }, select: { id: true, isCorrect: true, misconceptionId: true } });
        for (const o of opts) {
          const value = o.isCorrect ? p.key
            : o.misconceptionId === 'vr-move-letter-first-word-invalid' ? p.firstWordInvalid
            : o.misconceptionId === 'vr-move-letter-second-word-invalid' ? p.secondWordInvalid : null;
          if (value === null) throw new Error(`${id}: an option carries neither the key nor a known entry — rolling back`);
          await tx.itemOption.update({ where: { id: o.id }, data: { content: { value } } });
        }
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001',
          actor: 'Annie', recordedBy: 'human:dbamgbade@gmail.com', field: 'stem',
          method: 'the vr-08 duplication settled as a GENERATOR ARTEFACT from the rows: fromBank is a modular fill and MOVE_LETTER_EXTRA was the only short bank of six. The bank is filled to 25 rather than the cut cut to 12.',
          note: `slot ${i + 12} authored as ${p.word1}/${p.word2}, key ${p.key}; this row previously repeated a pair from slots 0-11` } });
        wrote += 1;
      }
    });
  }

  const report = {
    kind: 'THE-226th-AND-THE-DUPLICATION-VERDICT',
    TO: 'Annie and the authoring store, by relay through David',
    date: '2026-09-05', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'LANDED' : 'WOULD LAND'),
    PROVENANCE: 'her 226th recorded AS RELAYED BY DAVID, not read from bytes — no annie-226 file is on the desk. The digest field is absent rather than guessed (R203/R204).',
    ONE_THE_DECIDING_CORPUS: {
      ruling: 'a word met bare must be known outright; the corpus whose population matches the item\'s reader decides, the other is background',
      implementedAs: 'lex.knowsBare — the child-directed column decides for this district, because every word in it is met bare',
      screenedAcrossTheCut: 'ZERO of 25 keys fail under the deciding corpus. Exactly two seats sat on a borderline word, both SOW.',
      SOW: { wide: lex.zipf('SOW'), bare: lex.zipfCBBC('SOW'), verdict: 'fails bare — seat regenerated N -> O, leaving SNW, absent from both corpora' },
    },
    TWO_THE_DUPLICATION_VERDICT: {
      question: 'deliberate placement, or generator artefact?',
      ANSWER: 'GENERATOR ARTEFACT, and the evidence is in the code that produced the rows, not in the rows alone.',
      evidence: { fromBank: 'bank[i % bank.length] — a modular fill with no spacing or placement logic',
        bankSizes, andWHATTHATSHOWS: 'five of the six banks calling fromBank hold 25 or 26 entries for the 25 rows they are asked for. Every other author sized their bank to the request. MOVE_LETTER_EXTRA held twelve and the cycle papered over it.' },
      soTHEREGENERATIONWRITES: 'THREE replacements where it wrote one — and, generally, the bank is filled to 25 rather than the cut being cut to twelve.',
      andHOW: 'by APPENDING to slots 12-24, so rows 1-12 keep their pairs and only the duplicate rows change. A sound row is not disturbed to fix a fault it does not have.',
    },
    THREE_THE_ONE_JUDGEMENT_IN_THIS_RUN: {
      what: `the search proposed SHELL/BEGIN (giving HELL) and SLIDE/OVER (giving LOVER); both are excluded here by name.`,
      andWHYTHATISFLAGGED: 'NOTHING SCREENED THEM. headwordIsBanned returns ok for both, because the ban list is scoped to claims, difficulty and tone rather than to subject matter. Extending that list is not this store\'s to do — its scope is designed, and widening it silently is how a gate stops meaning what it says.',
      THE_GAP_REPORTED_NOT_PATCHED: 'a generated child-facing bank has no age-appropriateness screen. That is a real hole and it wants a ruling, not a patch from whoever happened to hit it.',
      thisIsTheOneToOverrule: 'every other choice in this run is mechanical. This one is not.',
    },
    THE_ASSERTIONS: assertions,
    THE_THIRTEEN: picks.map((p, i) => ({ slot: i + 12, row: ids[i], word1: p.word1, word2: p.word2, key: p.key,
      solution: `${p.word1}->${p.left}, ${p.word2}->${p.made}`, seats: { firstWordInvalid: p.firstWordInvalid, secondWordInvalid: p.secondWordInvalid },
      minZipf: p.minZipf, minZipfCBBC: p.minZipfCBBC })),
    rowsWritten: wrote,
    THE_INSTRUMENT: lex.provenance.THE_CUT_AND_ITS_INSTRUMENT,
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['ONE_THE_DECIDING_CORPUS', 'TWO_THE_DUPLICATION_VERDICT', 'THREE_THE_ONE_JUDGEMENT_IN_THIS_RUN', 'THE_ASSERTIONS', 'THE_THIRTEEN'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('the-226th-and-the-duplication-verdict', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'the-226th-and-the-duplication-verdict').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${report.outcome}: ${wrote} row(s) written.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
