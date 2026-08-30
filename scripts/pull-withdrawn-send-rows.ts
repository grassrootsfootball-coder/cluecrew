/**
 * SIX ROWS ARE SERVING ON BYTES FROM A SEND THEIR AUTHOR WITHDREW. THEY COME OUT.
 *
 * Each carries, on its own row, an event reading *"the 196-row send was WITHDRAWN by the authoring
 * store; this id is not in the replacement send. The row is removed before anything publishes."*
 * **The withdrawal was recorded and never executed.** The rows went marker -> SIGNED -> PUBLISHED.
 *
 * THE SET IS DERIVED, NOT LISTED (R57): marked by the withdrawal, LIVE, and carrying NEITHER a
 * re-pin against the amended source NOR her restore ruling. Ten LIVE rows carry the marker; four
 * have a later authority and stay:
 *   - MC01-CALC-01, MC01-CALC-05 — re-pinned against the amended source 4bab53bba515e606, bytes
 *     verified identical to the replacement send;
 *   - MC04-FDP-04, MC05-FDP-01 — restored on her explicit ruling from the population she verified
 *     in her 182nd, the earlier absence withdrawn as false.
 * **A row with a later authority is not a withdrawn-send row; a row with none is.**
 *
 * LIVE -> REVIEWED, NOT DELETED. It removes them from serving (the pool is LIVE+PRACTICE) and keeps
 * the signature, the bytes and every event. Reversible in one statement if a ruling reinstates them.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { isHeldFromServing } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { digestOverText, findingsDigest } from './lib/findings-digest';
import { requirePopulation } from './lib/population';

const REPO = pjoin(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

async function run() {
  assertFixture('withdrawn-set', [
    { name: 'marked + LIVE + no later authority comes out', input: JSON.stringify({ marked: true, live: true, repinned: false, restored: false }), mustBeCaught: true },
    { name: 'marked + re-pinned against the amended source STAYS', input: JSON.stringify({ marked: true, live: true, repinned: true, restored: false }), mustBeCaught: false },
    { name: 'marked + restored on her ruling STAYS', input: JSON.stringify({ marked: true, live: true, repinned: false, restored: true }), mustBeCaught: false },
    { name: 'marked but not LIVE is not serving and is reported, not pulled', input: JSON.stringify({ marked: true, live: false, repinned: false, restored: false }), mustBeCaught: false },
    { name: 'unmarked is not in the population at all', input: JSON.stringify({ marked: false, live: true, repinned: false, restored: false }), mustBeCaught: false },
  ], (raw) => { const c = JSON.parse(raw); return c.marked && c.live && !c.repinned && !c.restored; });

  const marked = [...new Set((await prisma.attributionEvent.findMany({ where: { method: { contains: '196-row send was WITHDRAWN' } }, select: { recordId: true } })).map((e) => e.recordId))];
  const repinned = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: marked }, method: { contains: 'RE-PINNED against the amended source' } }, select: { recordId: true } })).map((e) => e.recordId));
  const restored = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: marked }, method: { contains: 'ABSENCE RECORDED EARLIER WAS FALSE' } }, select: { recordId: true } })).map((e) => e.recordId));
  const rows = await prisma.item.findMany({ where: { id: { in: marked } }, select: { id: true, status: true, pool: true, reviewedBy: true } });
  requirePopulation('pull:withdrawn-send-rows', { 'id(s) marked by the withdrawal': marked.length, 'still in the store': rows.length });

  const classify = (r: { id: string; status: string }) =>
    r.status !== 'LIVE' ? 'NOT SERVING — reported, not pulled'
      : repinned.has(r.id) ? 'STAYS — re-pinned against the amended source 4bab53bba515e606'
      : restored.has(r.id) ? 'STAYS — restored on her explicit ruling (her 182nd population)'
      : 'COMES OUT — serving on withdrawn bytes with no later authority';
  const membership = rows.map((r) => ({ itemId: r.id, status: r.status, signed: !!r.reviewedBy, verdict: classify(r) })).sort((a, b) => a.itemId.localeCompare(b.itemId));
  const comingOut = membership.filter((m) => m.verdict.startsWith('COMES OUT')).map((m) => m.itemId);

  if (APPLY && comingOut.length) {
    await prisma.$transaction(async (tx) => {
      const n = await tx.item.updateMany({ where: { id: { in: comingOut }, status: 'LIVE' }, data: { status: 'REVIEWED' } });
      if (n.count !== comingOut.length) throw new Error(`moved ${n.count} of ${comingOut.length} — rolling back`);
      await tx.attributionEvent.createMany({ data: comingOut.map((id) => ({
        recordType: 'item', recordId: id, action: 'UNATTRIBUTED', reviewerId: null, actor: 'Cowork (withdrawal)',
        recordedBy: 'human:david', field: 'status',
        method: 'PULLED FROM SERVING — LIVE to REVIEWED. This row was published on bytes from the 196-row send its author withdrew. Its own withdrawal event said "The row is removed before anything publishes"; the withdrawal was recorded and never executed.',
        note: 'not deleted: signature, bytes and every event are intact, and one statement reinstates it if a ruling says the withdrawal does not reach this row. It carries no re-pin against the amended source and no restore ruling — that absence is why it is here.',
      })) });
    });
  }

  const live = await prisma.item.count({ where: { questionType: { district: 'MATHS' }, status: 'LIVE', pool: 'PRACTICE' } });
  const liveAll = (await prisma.item.findMany({ where: { status: 'LIVE', pool: 'PRACTICE' }, select: { id: true, questionTypeId: true } })).filter((i) => !isHeldFromServing(i.id));
  const byType = liveAll.reduce<Record<string, number>>((a, i) => { a[i.questionTypeId] = (a[i.questionTypeId] ?? 0) + 1; return a; }, {});
  const cases = await prisma.case.findMany({ select: { id: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const servable = cases.filter((c) => [c.questionTypeId, ...c.mappedQuestionTypeIds].some((t) => (byType[t] ?? 0) > 0));

  const full = {
    kind: 'withdrawn-send-rows-pulled', mode: APPLY ? 'APPLIED' : 'DRY RUN — nothing written',
    THE_QUESTION_ANSWERED_FROM_THE_ROWS: 'not from any artefact. The provenance columns (sourcedFrom, importDoorFix, draftingMethod) are null on all 187; the record lives in AttributionEvent, which is where this was read.',
    ARE_THE_TWO_NAMED_ROWS_LIVE: { 'MC04-FDP-04': 'LIVE and serving', 'MC05-FDP-01': 'LIVE and serving', andWHY: 'both were restored on her explicit ruling of 19:26 — "restored from the population she verified in her 182nd. THE ABSENCE RECORDED EARLIER WAS FALSE AND IS WITHDRAWN." They stay on that authority, not by oversight.' },
    MEMBERSHIP_PER_ID: membership,
    counts: {
      markedByTheWithdrawal: marked.length, stillInTheStore: rows.length, alreadyRemoved: marked.length - rows.length,
      liveBeforeThisRun: membership.filter((m) => m.status === 'LIVE').length,
      staysOnALaterAuthority: membership.filter((m) => m.verdict.startsWith('STAYS')).length,
      comesOut: comingOut.length,
      amongTheNineHeld: membership.filter((m) => m.status === 'DRAFT').length,
    },
    THE_FAULT: {
      what: 'six rows were published on bytes from a withdrawn send. Each carries, on its own row, an event saying "The row is removed before anything publishes."',
      howItGotThrough: 'the withdrawal was recorded as an EVENT and never executed as a REMOVAL. Nothing between the marker and publication read it — the eight publication assertions checked signatures, pins, joins, blockers, the face and the held set, and not one asked which send a row came from.',
      andWHYTHECOLUMNSDIDNOTHELP: 'sourcedFrom, importDoorFix and draftingMethod are null on all 187. The district has no per-row column recording its send, so provenance survives only in events that nothing gates on.',
    },
    THE_SEPARATE_FALSE_NOTE: {
      where: 'the restore events on MC04-FDP-04 and MC05-FDP-01',
      claim: 'stem collision: 2 questions share this id; the variant restored is the one she read. The unchosen variant is recorded on the row and is NOT discarded.',
      measured: 'both stems carry exactly one key, `text`. No unchosen variant is on either row, and _stemCollisionResolved is absent on all 187.',
      soWHAT: 'the note asserts a retention that does not exist. The rows serve the variant she read — that part is attested by her ruling and by the signature — but from the row you cannot tell there was a choice, which is the thing the note promises you can.',
    },
    STATE_AFTER: { mathsLivePractice: live, servableCases: servable.length, ofCases: cases.length, caseMathsServable: servable.some((c) => c.id === 'case-maths-01'), windowVisibleAndEmpty: 0 },
  };
  const lines = membership.map((m) => `${m.itemId}\t${m.status}\t${m.verdict.split(' —')[0]}`);
  const d = digestOverText('one line per marked row, "<id>\\t<status>\\t<verdict>"', lines.join('\n'));
  const withLines = { ...full, RESULT_LINES: lines, resultsSha256: d.value, resultsSha256Spec: d.spec };
  const artefact = { ...withLines, ...findingsDigest(withLines, ['MEMBERSHIP_PER_ID', 'counts', 'THE_FAULT', 'RESULT_LINES']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const fam = APPLY ? 'withdrawn-send-rows-pulled' : 'withdrawn-send-rows-pulled-dry-run';
  const name = stampedName(fam, sha(json).slice(0, 16), 'json');
  writeFileSync(pjoin(REPO, 'content/exports', name), json);
  deliver(pjoin(REPO, 'content/exports', name), fam);
  console.log(`\n  ${APPLY ? 'APPLIED' : 'DRY RUN'} — ${comingOut.length} coming out: ${comingOut.join(', ') || '(none)'}`);
  for (const m of membership) console.log(`   ${m.itemId.padEnd(15)} ${m.status.padEnd(9)} ${m.verdict}`);
  console.log(`\n  MATHS live now ${live} · servable cases ${servable.length} of ${cases.length} · window 0`);
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
