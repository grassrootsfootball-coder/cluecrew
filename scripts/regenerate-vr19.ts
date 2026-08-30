/**
 * REGENERATE vr-19-word-number-codes SO THE CASE CAN PRODUCE THE SLIP ITS ENTRY NAMES (her 201st).
 *
 * **The words conform to the entry, not the entry to the words.** The entry is signed; the coded
 * words were generated; and no generated word carried a repeated letter, so `vr19-shared-letter-miss`
 * named an act impossible on all 25 carriers.
 *
 * **THE GUARD IS R62's AND IT RUNS BEFORE ANY WRITE.** These rows are derived, so a change to the
 * derivation rewrites every one it owns. Each row is classified first: any row LIVE, RETIRED, or
 * carrying an attribution event fails the whole run rather than being quietly rewritten.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const WORDS = ['PIPS', 'SAPS', 'SPAS', 'ASPS', 'APPS', 'PAPA', 'PASTA', 'TAPAS', 'PAPAS', 'SPITS'];

function build(i: number) {
  const map: Record<string, number> = { T: 1 + (i % 3), A: 4, P: 6, I: 7, S: 9 };
  const word = WORDS[i % WORDS.length];
  const key = word.split('').map((l) => map[l]).join('');
  const reverse = key.split('').reverse().join('');
  const at = word.split('').findIndex((l, j) => word.indexOf(l) !== j);
  const miss = key.slice(0, at) + String((Number(key[at]) + 1) % 10) + key.slice(at + 1);
  return { word, map, key, reverse, miss, repeatAt: at };
}

async function run() {
  assertFixture('vr19-derivation', [
    { name: 'every generated word repeats a letter', input: 'repeat', mustBeCaught: true },
    { name: 'key, reverse and the slip are distinct on every row', input: 'distinct', mustBeCaught: true },
    { name: 'the slip differs from the key AT the repeated position', input: 'at-repeat', mustBeCaught: true },
    { name: 'the OLD word list would fail the repeat test', input: 'old-list', mustBeCaught: false },
  ], (k) => {
    if (k === 'old-list') return ['TAP', 'PAT', 'TIP', 'PIT', 'SIP'].every((w) => new Set(w).size < w.length);
    const rows = Array.from({ length: 25 }, (_, i) => build(i));
    if (k === 'repeat') return rows.every((r) => r.repeatAt >= 0);
    if (k === 'distinct') return rows.every((r) => new Set([r.key, r.reverse, r.miss]).size === 3);
    return rows.every((r) => r.key[r.repeatAt] !== r.miss[r.repeatAt]
      && r.key.slice(0, r.repeatAt) === r.miss.slice(0, r.repeatAt)
      && r.key.slice(r.repeatAt + 1) === r.miss.slice(r.repeatAt + 1));
  });

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-19-word-number-codes' },
    select: { id: true, status: true, reviewedBy: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true } } },
    orderBy: { id: 'asc' } });
  requirePopulation('regenerate:vr19', { 'row(s) owned by this derivation': rows.length });

  // R62: classify before writing. A reviewed row that would change fails the whole run.
  const events = await prisma.attributionEvent.groupBy({ by: ['recordId'], where: { recordId: { in: rows.map((r) => r.id) } }, _count: true });
  const reviewed = rows.filter((r) => r.status === 'LIVE' || r.status === 'RETIRED' || r.reviewedBy || events.some((e) => e.recordId === r.id));
  if (reviewed.length) throw new Error(`${reviewed.length} row(s) are reviewed and would be rewritten by a derivation change — refusing the whole run (R62): ${reviewed.map((r) => r.id).join(', ')}`);

  const plan = rows.map((r, i) => {
    const b = build(i);
    const opts = r.options;
    return { itemId: r.id, ...b,
      before: { word: String((r.stem as { prompt: string }).prompt).match(/code for ([A-Z]+)/)?.[1] ?? null,
        options: opts.map((o) => ({ value: String((o.content as { value: unknown }).value), isKey: o.isCorrect, tag: o.misconceptionId })) },
      writes: opts.map((o) => ({ optionId: o.id, isKey: o.isCorrect, tag: o.misconceptionId,
        value: o.isCorrect ? b.key : o.misconceptionId === 'vr19-letter-order' ? b.reverse : b.miss })) };
  });

  if (APPLY) {
    await prisma.$transaction(async (tx) => {
      for (const p of plan) {
        await tx.item.update({ where: { id: p.itemId }, data: { stem: {
          prompt: `Using the code, what is the code for ${p.word}?`,
          code: Object.fromEntries(Object.entries(p.map).map(([l, d]) => [l, String(d)])),
          _previousPrompt: `Using the code, what is the code for ${p.before.word}?`,
        } } });
        for (const w of p.writes) {
          const prior = p.before.options.find((o) => o.tag === w.tag && o.isKey === w.isKey)?.value;
          await tx.itemOption.update({ where: { id: w.optionId }, data: { content: { value: w.value, _previousValue: prior ?? null } } });
        }
        await tx.attributionEvent.create({ data: { recordType: 'item', recordId: p.itemId, action: 'AMENDED',
          reviewerId: 'rev-0001', actor: 'Annie', recordedBy: 'human:david', field: 'stem+options[].content.value',
          returnArtefact: '5fae5f365cca18c011c484b8b2bf915dfc32862a9df6731caff4409885968841',
          method: `her 201st: the coded word regenerates to ${p.word}, which repeats a letter, so the case can produce the slip vr19-shared-letter-miss names. The words conform to the attested entry.`,
          note: `the shared-letter carrier is now DERIVED FROM THE ACT — the repeated letter's second occurrence takes a different digit (${p.key} -> ${p.miss}) — where it was formerly the key with its last digit incremented, a value derived from the answer rather than from the error.` } });
      }
    });
  }

  const full = {
    kind: 'vr19-regeneration', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_RULING: 'her 201st — an entry whose act is impossible on every carrier is an item population that cannot host its own diagnosis. The entry is signed and the words are generated, so the words conform.',
    THE_GENERATORS_ACCOUNT_OF_WHAT_IT_DID: {
      formerWords: ['TAP', 'PAT', 'TIP', 'PIT', 'SIP', 'SAT', 'TAPS', 'PAST', 'PITS', 'SPIT'],
      noneRepeatedALetter: true,
      theFormerSharedLetterCarrier: 'answer.slice(0,-1) + ((last digit + 1) % 10) — the KEY with its last digit incremented, derived from the answer and not from the error',
      andWHATTHATMEANT: 'the tag asserted "missed that repeated letters share one digit" over a word with no repeated letter and a value that never modelled the miss. Both halves of the divorce in one line of code.',
    },
    THE_REPAIR: {
      words: WORDS,
      everyWordRepeatsALetter: true,
      theSharedLetterCarrierIsNowDerivedFromTheAct: 'the repeated letter\'s second occurrence takes a different digit — the child missing that twin letters wear twin numbers',
      andSTATSWASDROPPED: 'STATS codes to the palindrome 93439, so its letter-order distractor would equal the key. PAPAS replaces it.',
    },
    guard: `R62 classify-before-write: ${rows.length} rows, ${reviewed.length} reviewed. A reviewed row would have failed the whole run.`,
    rows: plan.map((p) => ({ itemId: p.itemId, wordBefore: p.before.word, wordAfter: p.word,
      key: p.key, letterOrderCarrier: p.reverse, sharedLetterCarrier: p.miss,
      before: p.before.options })),
  };
  const lines = plan.map((p) => `${p.itemId}\t${p.before.word}->${p.word}\t${p.key}\t${p.miss}`);
  const d = digestOverText('one line per row, "<itemId>\\t<wordBefore>-><wordAfter>\\t<key>\\t<slip>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['THE_REPAIR', 'rows', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'vr19-regeneration' : 'vr19-regeneration-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'} — ${plan.length} rows`);
  for (const p of plan.slice(0, 4)) console.log(`   ${p.itemId.slice(-2)}  ${p.before.word} -> ${p.word}  key ${p.key}  reverse ${p.reverse}  slip ${p.miss}`);
  console.log('   ...');
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
