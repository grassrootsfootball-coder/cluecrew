/**
 * TWO FIVES, RECONCILED ON IDS (David, 2026-09-05: "check on ids, not counts").
 *
 * **THE ROWS ARE THE SAME FIVE AND THE SEATS ARE NOT.** Four of five name the same option; on row
 * 17 the two stores name DIFFERENT options of the same row, and the two are complementary rather
 * than duplicate — so the combined work is SIX seats, not five. **Two counts that agree are the
 * cheapest possible way to look reconciled**, and nothing but the ids would have shown it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';
import { findingsDigest, digestsBlock } from './lib/findings-digest';
import { deliver, stampedName } from './lib/export-destination';

const REPO = pjoin(__dirname, '..');
const DL = pjoin(homedir(), 'Downloads');
const LANE = pjoin(DL, '11+', 'from-cluecrew');
const THEIRS = pjoin(DL, 'THE-vr02-DOOR-DOES-NOT-OPEN-AND-FIVE-OF-THE-TEN-WITHDRAW-NOT-THREE-c8c28c8796b4.json');
const sha = (s: string | Buffer) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');

async function main() {
  const bytes = readFileSync(THEIRS);
  if (!sha(bytes).startsWith('c8c28c8796b4')) throw new Error(`their artefact does not verify: ${sha(bytes).slice(0, 16)}`);
  const theirs = JSON.parse(bytes.toString('utf8')) as any;
  const withdrawn: Array<{ itemId: string; optionValue: unknown; entryId: string }> =
    theirs.TWO_THE_DOUBLING_ARITHMETIC_AND_THREE_FIGURES_ARE_WRONG_INCLUDING_TWO_OF_THIS_STORES.MEASURED_INDEPENDENTLY_ON_bb6be0d3.theWithdrawn;

  const rows = await prisma.item.findMany({ where: { questionTypeId: 'vr-02-two-odd-ones-out' }, orderBy: { id: 'asc' },
    select: { id: true, stem: true, options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('vr-02 reconciliation', { 'row(s)': rows.length, 'withdrawal(s) they name': withdrawn.length });

  const val = (o: { content: unknown }) => { const v = (o.content as { value?: unknown })?.value; return Array.isArray(v) ? v.join(',') : String(v); };
  const norm = (v: unknown) => (Array.isArray(v) ? v.join(',') : String(v));

  const mine = rows.flatMap((r) => r.options.filter((o) => o.misconceptionId && !(o.misconceptionExecution ?? '').trim())
    .map((o) => ({ itemId: r.id, seat: val(o), tag: o.misconceptionId! })));
  const theirSeats = withdrawn.map((w) => ({ itemId: w.itemId, seat: norm(w.optionValue), tag: w.entryId }));

  const key = (x: { itemId: string; seat: string }) => `${x.itemId}|${x.seat}`;
  const mineK = new Set(mine.map(key)), theirsK = new Set(theirSeats.map(key));
  const shared = mine.filter((m) => theirsK.has(key(m)));
  const onlyMine = mine.filter((m) => !theirsK.has(key(m)));
  const onlyTheirs = theirSeats.filter((t) => !mineK.has(key(t)));

  const sameRows = [...new Set(mine.map((m) => m.itemId))].sort().join() === [...new Set(theirSeats.map((t) => t.itemId))].sort().join();
  const doubling = rows.map((r) => ({ itemId: r.id, partialGroupOptions: r.options.filter((o) => o.misconceptionId === 'vr02-partial-group').length }));
  const stillPresent = onlyTheirs.map((t) => ({ ...t, stillOnTheRow: rows.find((r) => r.id === t.itemId)?.options.some((o) => val(o) === t.seat) ?? false }));

  const report = {
    kind: 'VR-02-TWO-FIVES-RECONCILED-ON-IDS',
    TO: 'the authoring store; Annie and David by relay',
    date: '2026-09-05',
    THEIR_ARTEFACT: { file: THEIRS.split('/').pop(), sha256: sha(bytes), verifiedHere: true },

    THE_ANSWER: 'the ROWS are the same five. The SEATS are not — four of five match, and on row 17 the two stores name DIFFERENT options of the same row. **The combined work is SIX seats, not five.**',
    ROWS_IDENTICAL: sameRows,
    theFiveRows: [...new Set(mine.map((m) => m.itemId))].sort(),

    SEATS_SHARED: shared.map((s) => ({ itemId: s.itemId, seat: s.seat, tag: s.tag })),
    SEAT_ONLY_THIS_STORE_NAMES: onlyMine.map((s) => ({ itemId: s.itemId, seat: s.seat, tag: s.tag,
      why: 'this store screens for a TAGGED OPTION WITH NO EXECUTION — a wholeness gap. It carries no execution to withdraw.' })),
    SEAT_ONLY_YOUR_STORE_NAMES: stillPresent.map((s) => ({ itemId: s.itemId, seat: s.seat, tag: s.tag, stillOnTheRow: s.stillOnTheRow,
      why: 'your store screens for an EXECUTION BOUND TO SUPERSEDED BYTES — a withdrawal. This seat HAS an execution, so it is invisible to a wholeness screen and visible to yours.' })),
    andWHYTHATISNOTADISAGREEMENT: 'the two screens are looking for different faults on the same row. Row 17 carries two partial-group options: circle,square HAS an execution (yours, withdrawn because it is bound to bb6be0d3) and oval,triangle has NONE (this store\'s, a wholeness gap). **Complementary, not duplicate** — and a count of five on each side is the cheapest possible way for that to look reconciled.',

    YOUR_UNCHECKED_QUESTION_ANSWERED_FROM_THE_ROWS: {
      yourNote: '"whether the five rows still carry two partial-group options after the move — the doubling state itself is bound to bb6be0d3 and may not survive the move."',
      measured: 'ALL TWENTY-FIVE rows carry exactly two partial-group options, the five included. **The doubling survived the move and it is not confined to five rows — it is universal across the case.**',
      perRow: doubling,
      andWHATTHATMEANSFORTHEARITHMETIC: 'your five withdrawals are a subset of twenty-five doubled rows, selected by which executions are bound, not by which rows are doubled. Nothing in the doubling recomputes the five.',
      andYOURSEATSSURVIVED: `every seat you name is still on its row: ${stillPresent.every((s) => s.stillOnTheRow)}. Your withdrawals stay actionable; only their digests are superseded.`,
    },

    TOTAL_WORK: { sharedSeats: shared.length, onlyThisStore: onlyMine.length, onlyYourStore: onlyTheirs.length, combined: shared.length + onlyMine.length + onlyTheirs.length },
    andWHATTHISSTOREISSTILLNOTDOING: 'writing any of the six. They are child-facing authored content and go through the review pipeline.',
  };

  const clean = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;
  const keys = ['SEATS_SHARED', 'SEAT_ONLY_THIS_STORE_NAMES', 'SEAT_ONLY_YOUR_STORE_NAMES', 'YOUR_UNCHECKED_QUESTION_ANSWERED_FROM_THE_ROWS', 'TOTAL_WORK'];
  Object.assign(clean, findingsDigest(clean, keys));
  clean.DIGESTS = digestsBlock(String(clean.findingsSha256), keys);
  const p = pjoin(REPO, 'content/exports', stampedName('vr02-two-fives-reconciled', String(clean.findingsSha256), 'json'));
  writeFileSync(p, JSON.stringify(clean, null, 1));
  const name = deliver(p, 'vr02-two-fives-reconciled').split('/').pop()!;
  const fin = sha(readFileSync(pjoin(LANE, name)));
  writeFileSync(pjoin(LANE, `${name}.sha256`), `${fin}  ${name}\n`);
  writeFileSync(pjoin(DL, name), readFileSync(pjoin(LANE, name)));

  console.log(`  rows identical: ${sameRows}; seats shared ${shared.length}, only here ${onlyMine.length}, only theirs ${onlyTheirs.length} — combined ${report.TOTAL_WORK.combined}`);
  for (const s of onlyMine) console.log(`    ONLY HERE   ${s.itemId} ${s.seat}`);
  for (const s of stillPresent) console.log(`    ONLY THEIRS ${s.itemId} ${s.seat} (still on the row: ${s.stillOnTheRow})`);
  console.log(`\n  crossed: ${name}  (FILE ${fin.slice(0, 16)})`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
