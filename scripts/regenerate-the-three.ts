/**
 * REGENERATE THE THREE UNPERFORMABLE vr-08 PAIRS (Annie's 224th; David's firewall ruling).
 *
 * CHAIR/MOP, CHEAT/AIR and SHELF/TRAIN cannot be performed by any letter at the 3.0 cut. Only
 * web2's breadth ever made two of them look sound — `AIRE`, `AIRA`, `CHET`, `THRAIN` (R989).
 *
 * **THE SEARCH PROPOSES FROM THE GENERATOR'S OWN MATERIAL AND THE LIST ONLY GATES.** That is the
 * ruled boundary and it is enforced in `move-letter-search.ts`, not asserted here.
 *
 * **THE BANK AND THE ROWS MOVE TOGETHER.** `MOVE_LETTER_EXTRA` is cycled by `fromBank(bank, 25)`,
 * so bank index i produces rows i+1, i+13 and i+25. Fixing the rows without fixing the bank would
 * put the broken pairs back on the next regeneration; fixing the bank without the rows would leave
 * the DB disagreeing with the code that claims to have produced it. Both, in one run, or neither.
 *
 * This script writes content UNGUARDED, as a ruling-applier does (R63) — a human supplied the
 * decision, and the provenance is the AttributionEvent each row receives.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { checkKeyPerformsStem } from '../packages/core/src/key-gate';
import { checkTagWrite } from '../packages/core/src/tag-write-gate';
import { loadChildLexicon, searchMoveLetter, pickDistinct, performingLetters } from './lib/move-letter-search';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const GENERATOR = pjoin(REPO, 'packages/db/prisma/generate-content.ts');
const APPLY = process.argv.includes('--apply');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

/** The broken pairs, their bank tuples, and the rows each produced. */
const BROKEN = [
  { pair: 'CHAIR/MOP', tuple: "['CHAIR', 'MOP', 'C', 'H', 'R']", rows: ['01', '13', '25'] },
  { pair: 'SHELF/TRAIN', tuple: "['SHELF', 'TRAIN', 'S', 'H', 'F']", rows: ['04', '16'] },
  { pair: 'CHEAT/AIR', tuple: "['CHEAT', 'AIR', 'C', 'T', 'H']", rows: ['05', '17'] },
];
const SURVIVING = ['BLEND', 'RIDGE', 'FLAME', 'RIGHT', 'SPACE', 'TAR', 'TWIN', 'HERE', 'SLED', 'PIT',
  'GRAIN', 'ATE', 'CHARM', 'ORE', 'PLUMP', 'AY', 'SNOW', 'HOE', 'BEND', 'FAME', 'PACE', 'STAR',
  'WIN', 'THERE', 'LED', 'SPIT', 'RAIN', 'GATE', 'HARM', 'CORE', 'LUMP', 'PAY', 'NOW', 'SHOE'];

async function main() {
  console.log(`REGENERATE THE THREE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);
  const lex = loadChildLexicon();
  console.log(`  lexicon: ${lex.size} words at Zipf >= ${lex.cut}, ${lex.namesExcluded} names excluded.`);

  const refusals: string[] = [];
  const assertions: Array<{ assertion: string; result: string; passed: boolean }> = [];
  const assert = (n: string, ok: boolean, r: string) => { assertions.push({ assertion: n, result: r, passed: ok }); if (!ok) refusals.push(`${n} — ${r}`); };

  // 1. THE RULING'S PREMISE, PROVED FROM THE ROWS RATHER THAN CARRIED FROM THE MESSAGE.
  const premise = BROKEN.map((b) => {
    const [w1, w2] = b.pair.split('/') as [string, string];
    return { pair: b.pair, performingLettersAtTheCut: performingLetters(w1, w2, lex) };
  });
  assert('all three pairs are unperformable at the 3.0 cut — no letter of word1 does the task',
    premise.every((p) => p.performingLettersAtTheCut.length === 0),
    premise.map((p) => `${p.pair}: ${p.performingLettersAtTheCut.length ? p.performingLettersAtTheCut.join('/') : 'no letter works'}`).join('; '));

  // 2. THE SEARCH, PROPOSING FROM THE GENERATOR AND GATED BY THE LIST.
  const candidates = searchMoveLetter(lex, { exclude: new Set(SURVIVING) });
  requirePopulation('regenerate-the-three', { 'candidate stem(s) valid at the cut': candidates.length });
  const picks = pickDistinct(candidates, BROKEN.length);
  assert('the search returns three replacements, valid by construction and sharing no word with each other or with the nine that survive',
    picks.length === 3, `${picks.length} pick(s) from ${candidates.length} candidates`);

  // 3. EVERY REPLACEMENT PASSES THE KEY GATE AND BOTH TAG PREDICATES, UNDER THE CHILD LEXICON.
  const isWord = (w: string) => lex.knows(w);
  for (const p of picks) {
    const stem = { prompt: 'Move one letter from the first word to the second so both make new words.', word1: p.word1, word2: p.word2 };
    const optionValues = [p.key, p.firstWordInvalid, p.secondWordInvalid];
    const k = checkKeyPerformsStem({ questionTypeId: 'vr-08-move-letter', stem, keyValue: p.key, optionValues }, isWord);
    assert(`${p.word1}/${p.word2}: the key performs the stem`, k.verdict === 'PERFORMS', `${k.verdict} — ${k.why}`);
    for (const [v, m] of [[p.firstWordInvalid, 'vr-move-letter-first-word-invalid'], [p.secondWordInvalid, 'vr-move-letter-second-word-invalid']] as const) {
      const t = checkTagWrite({ stem, optionValue: v, keyValue: p.key, misconceptionId: m }, isWord);
      assert(`${p.word1}/${p.word2}: "${v}" performs ${m}`, t.verdict === 'PERFORMS', `${t.verdict} — ${t.why}`);
    }
  }

  // 4. THE ROWS ARE SAFE TO REWRITE — DRAFT, UNSIGNED, NO ATTRIBUTION.
  const ids = BROKEN.flatMap((b) => b.rows.map((n) => `gen-vr-08-move-letter-${n}`));
  const rows = await prisma.item.findMany({ where: { id: { in: ids } }, select: { id: true, status: true, reviewedBy: true, stem: true } });
  const events = await prisma.attributionEvent.count({ where: { recordId: { in: ids } } });
  assert('every row to be rewritten is DRAFT, unsigned and carries no attribution — nothing reviewed is being overwritten (R62)',
    rows.length === ids.length && rows.every((r) => r.status === 'DRAFT' && !r.reviewedBy) && events === 0,
    `${rows.length} of ${ids.length} found; ${rows.filter((r) => r.status !== 'DRAFT' || r.reviewedBy).length} not DRAFT/unsigned; ${events} attribution event(s)`);

  // 5. THE GENERATOR STILL CARRIES THE THREE BROKEN TUPLES VERBATIM.
  const genSrc = readFileSync(GENERATOR, 'utf8');
  assert('the generator carries all three broken tuples verbatim, so replacing them cannot silently no-op (R87)',
    BROKEN.every((b) => genSrc.split(b.tuple).length === 2),
    BROKEN.map((b) => `${b.pair} x${genSrc.split(b.tuple).length - 1}`).join(', '));

  console.log(`  assertions: ${assertions.filter((a) => a.passed).length} of ${assertions.length} pass`);
  for (const a of assertions.filter((x) => !x.passed)) console.log(`   REFUSED — ${a.assertion}: ${a.result}`);
  for (const [i, p] of picks.entries()) {
    console.log(`  ${BROKEN[i]!.pair.padEnd(12)} -> ${`${p.word1}/${p.word2}`.padEnd(12)} key=${p.key} (${p.word1}->${p.left}, ${p.word2}->${p.made})  seats ${p.firstWordInvalid}/${p.secondWordInvalid}  minZipf ${p.minZipf.toFixed(2)} minCBBC ${p.minZipfCBBC.toFixed(2)}`);
  }

  let wrote = 0;
  if (refusals.length === 0 && APPLY) {
    // THE GENERATOR FIRST — if the bank edit fails the rows are untouched.
    let next = genSrc;
    for (const [i, b] of BROKEN.entries()) {
      const p = picks[i]!;
      const replacement = `['${p.word1}', '${p.word2}', '${p.key}', '${p.firstWordInvalid}', '${p.secondWordInvalid}']`;
      const before = next;
      next = next.replace(b.tuple, replacement);
      if (next === before) throw new Error(`the bank edit for ${b.pair} matched nothing — refusing rather than reporting a no-op as success (R87)`);
    }
    writeFileSync(GENERATOR, next);

    await prisma.$transaction(async (tx) => {
      for (const [i, b] of BROKEN.entries()) {
        const p = picks[i]!;
        for (const n of b.rows) {
          const id = `gen-vr-08-move-letter-${n}`;
          await tx.item.update({ where: { id }, data: { stem: { prompt: 'Move one letter from the first word to the second so both make new words.', word1: p.word1, word2: p.word2 } } });
          const opts = await tx.itemOption.findMany({ where: { itemId: id }, select: { id: true, isCorrect: true, misconceptionId: true } });
          for (const o of opts) {
            const value = o.isCorrect ? p.key
              : o.misconceptionId === 'vr-move-letter-first-word-invalid' ? p.firstWordInvalid
              : o.misconceptionId === 'vr-move-letter-second-word-invalid' ? p.secondWordInvalid : null;
            if (value === null) throw new Error(`${id}: an option carries neither the key nor a known entry — rolling back`);
            await tx.itemOption.update({ where: { id: o.id }, data: { content: { value } } });
          }
          await tx.attributionEvent.create({ data: {
            recordType: 'item', recordId: id, action: 'AMENDED', reviewerId: 'rev-0001', actor: 'Annie',
            recordedBy: 'human:dbamgbade@gmail.com', field: 'stem',
            method: 'her 224th: the wordhood cut is 3.0 and CHEAT/AIR regenerates with CHAIR/MOP and SHELF/TRAIN, searched against the constraint set. Search proposes from the generator\'s own material; the frequency list gates only (David, 2026-09-05).',
            note: `${b.pair} -> ${p.word1}/${p.word2}; key ${p.key}; unperformable at 3.0 by any letter before this`,
          } });
          wrote += 1;
        }
      }
    });
  }

  const report = {
    kind: 'vr-08-regeneration-of-the-three', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    outcome: refusals.length ? 'REFUSED' : (APPLY ? 'REGENERATED' : 'WOULD REGENERATE'), date: '2026-09-05',
    REFUSALS: refusals,
    THE_RULING: 'Annie 224th (a43289dd): the cut is 3.0 and validity is what a competent eleven-year-old knows. David 2026-09-05: a search may propose from the generator\'s own material and be measured at 3.0; it may not enumerate candidates from the frequency list. The list gates, it does not source.',
    THE_INSTRUMENT: lex.provenance,
    THE_PREMISE_PROVED_FROM_THE_ROWS: premise,
    THE_ASSERTIONS: assertions,
    THE_SEARCH: { candidatesValidAtTheCut: candidates.length, source: 'words already written into generate-content.ts',
      andWHATTHELEXICONDID: 'accepted or rejected what that material proposed. Nothing here iterates the corpus — that is the ruled boundary.' },
    THE_REPLACEMENTS: picks.map((p, i) => ({ replaced: BROKEN[i]!.pair, rows: BROKEN[i]!.rows.map((n) => `gen-vr-08-move-letter-${n}`),
      word1: p.word1, word2: p.word2, key: p.key, solution: `${p.word1}->${p.left}, ${p.word2}->${p.made}`,
      firstWordInvalidSeat: p.firstWordInvalid, secondWordInvalidSeat: p.secondWordInvalid,
      minZipf: p.minZipf, minZipfCBBC: p.minZipfCBBC })),
    THE_BANK_AND_THE_ROWS_MOVED_TOGETHER: 'MOVE_LETTER_EXTRA is cycled by fromBank(bank, 25), so bank index i produces rows i+1, i+13 and i+25. Fixing rows alone would let the next regeneration reinstate the broken pairs; fixing the bank alone would leave the DB disagreeing with the code that claims to have produced it.',
    rowsRewritten: wrote,
    STILL_OPEN: 'the cut of 25 rows is 12 distinct word pairs cycled by fromBank — CHAIR/MOP three times (R990). That duplication is untouched here: it is a defect in how the bank is expanded, not in any pair, and it wants its own ruling.',
  };
  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['THE_PREMISE_PROVED_FROM_THE_ROWS', 'THE_ASSERTIONS', 'THE_SEARCH', 'THE_REPLACEMENTS'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr08-regeneration-of-the-three', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  if (APPLY) {
    const name = deliver(p, 'vr08-regeneration-of-the-three').split('/').pop()!;
    const fin = sha(readFileSync(pjoin(LANE, name)));
    writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
    writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));
    console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
  }
  console.log(`\n  ${report.outcome}: ${wrote} row(s) rewritten.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
