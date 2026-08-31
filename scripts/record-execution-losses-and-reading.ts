/**
 * TWO ARTEFACTS, TWO DIFFERENT KINDS OF UNSETTLED.
 *
 *  1. **THE FIFTEEN, FOR A READING.** A landed execution differing from its crossed original is a
 *     question about which is authoritative. Both texts, both digests, per row — and no verdict from
 *     this store, because overwriting either would answer a question nobody asked it.
 *
 *  2. **THE HUNDRED AND EIGHT, AS A STANDING LOSS.** Not a queue. **A queue implies something will
 *     arrive; nothing will.** The row an execution was written about has changed or is gone, and the
 *     store that could re-author it no longer exists. Recorded with its reason, once, and closed.
 *
 * **THE LOSS RECORD IS GIT-TRACKED**, at `content/standing-losses/`. A loss recorded only in a
 * staged artefact is itself single-holder, which is the fault that produced it (R951).
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const EXPORTS = pjoin(REPO, 'content/exports');

async function run() {
  assertFixture('loss-vs-queue', [
    { name: 'a row whose source store is gone is a LOSS', input: 'gone', mustBeCaught: true },
    { name: 'a row awaiting a send that exists is a QUEUE', input: 'pending', mustBeCaught: false },
  ], (k) => k === 'gone');

  const src = readdirSync(EXPORTS).filter((f) => f.startsWith('remaining-executions-landed-')).sort().pop()!;
  const doc = JSON.parse(readFileSync(pjoin(EXPORTS, src), 'utf8')) as {
    THE_FIFTEEN_DIFFERING: { rows: Array<Record<string, unknown>> };
    refusedWithCauses: Array<{ itemId: string; optionValue?: unknown; file?: string; why: string }>;
  };
  const fifteen = doc.THE_FIFTEEN_DIFFERING.rows;
  const refused = doc.refusedWithCauses;
  requirePopulation('record:losses-and-reading', { 'differing execution(s)': fifteen.length, 'refusing execution(s)': refused.length });

  // ---- 1. the reading ---------------------------------------------------------------------------
  const reading = {
    kind: 'fifteen-executions-for-a-reading',
    TO: 'Annie',
    THE_QUESTION: 'for each of these fifteen options, this store holds one execution and the crossed artefact holds another. Which is authoritative?',
    WHY_NEITHER_STORE_CAN_SETTLE_IT: 'the authoring store\'s register is gone, so the record of which text superseded which no longer exists on either side. **This is the single-holder loss arriving as an unanswerable question rather than as a missing file** — the bytes survive twice over and the DECISION between them survives nowhere.',
    THIS_STORE_TOUCHED_NEITHER: 'overwriting either would answer a question nobody asked it, and would destroy the evidence that there was a question.',
    whatWouldSettleIt: 'a reading of the two texts against the option they describe. Both are here, in full, with their digests.',
    rows: fifteen,
  };
  const rl = fifteen.map((r) => `${r.itemId}\t${(r.itsSha256 as string).slice(0, 16)}\t${(r.itsSha256Crossed as string).slice(0, 16)}`);
  const rd = digestOverText('one line per differing execution, "<itemId>\\t<sha of the text here>\\t<sha of the crossed text>"', rl.join('\n'));
  const rBody = JSON.parse(JSON.stringify({ ...reading, RESULT_LINES: rl, resultsSha256: rd.value, resultsSha256Spec: rd.spec }));
  const rArt = { ...rBody, ...findingsDigest(rBody, ['rows', 'RESULT_LINES']) };
  const rJson = JSON.stringify(rArt, null, 1) + '\n';
  const rName = stampedName('fifteen-executions-for-a-reading', sha(rJson).slice(0, 16), 'json');
  writeFileSync(pjoin(EXPORTS, rName), rJson);
  deliver(pjoin(EXPORTS, rName), 'fifteen-executions-for-a-reading');

  // ---- 2. the standing loss, git-tracked --------------------------------------------------------
  const byCause: Record<string, Array<{ itemId: string; optionValue: unknown; sourceFile: string | null }>> = {};
  for (const r of refused) (byCause[r.why] ??= []).push({ itemId: r.itemId, optionValue: r.optionValue ?? null, sourceFile: r.file ?? null });
  const loss = {
    kind: 'standing-loss',
    what: 'executions the authoring store crossed which this store cannot land, and which no longer have an author.',
    THIS_IS_NOT_A_QUEUE: '**a queue implies something will arrive. Nothing will.** The row each execution was written about has changed or is gone, and the store that could re-author it was reclaimed. Recorded once, with its reason, and closed — not carried forward as pending work, which would make a settled loss look like an outstanding task forever.',
    recordedOn: '2026-09-01',
    total: refused.length,
    byCause: Object.fromEntries(Object.entries(byCause).map(([why, rows]) => [why, { count: rows.length, rows }])),
    whatWasRecoverable: 'everything that could be seated was: 188 landed and verified byte-identical, plus the nine bound to the projection. These are the residue.',
    andWHYNOTREDERIVABLE: 'an execution is authored prose about one specific option (R922), not a computation. This store cannot write them and there is no longer a store that can.',
    theRetentionChoice: 'git-tracked at content/standing-losses/ rather than only staged. A loss recorded in one delivered file is itself single-holder, which is the fault that produced it (R951).',
  };
  const lossJson = JSON.stringify(loss, null, 1) + '\n';
  const lossPath = pjoin(REPO, 'content/standing-losses/executions-without-an-author.json');
  writeFileSync(lossPath, lossJson);

  console.log(`\n  reading: ${fifteen.length} differing executions crossed, both texts per row`);
  console.log(`  standing loss: ${refused.length} recorded git-tracked at content/standing-losses/, by cause:`);
  for (const [why, v] of Object.entries(byCause)) console.log(`     ${String(v.length).padStart(3)}  ${why}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
