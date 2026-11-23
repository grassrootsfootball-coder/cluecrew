/**
 * THE NULL-APPROVER TRANCHE, IN REACHABLE ORDER — owed to Cowork, and only this side can produce it.
 *
 * **REACHABILITY IS NOT VISIBLE FROM COWORK.** It ordered its tranche by a declared proxy and said
 * so, which is the right move when the real property is out of reach. This is the real property:
 * the doors are Case rows and the free/paid split is `Case.freeTier`, the same column
 * `apps/web/lib/entitlements.ts` reads when it decides what a free child may open.
 *
 * **THE SOURCE OF THE PROPERTY, STATED BEFORE IT RUNS** (the standing instruction alongside R41).
 * This does NOT re-derive reachability. It uses the definition `check:serving-path` reports and
 * carries that check's declared LIMIT with it: REACHABLE here means A CASE NAMES THE ITEM'S
 * QUESTION TYPE. It is not a claim that a given child met a given hint on a given day, and the
 * ordering below inherits exactly that much confidence and no more.
 *
 * WHY ORDER AT ALL: a hint with no recorded approver is a different size of problem depending on
 * whether a child can meet it tonight. 23 of these are in front of children now; the rest are not.
 * Reviewing them in that order is the only ordering that shortens the exposure first.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'null-approver-tranche-reachable-order';

/** The order of review. Lower index = a child can meet it sooner. */
const ORDER = ['REACHABLE(free)', 'REACHABLE(paid)', 'SERVABLE', 'NOT SERVED'] as const;
type Rank = (typeof ORDER)[number];

async function main() {
  // The doors, read from the live table rather than the seed's literal — the seed WRITES this
  // column and reading its source list back would be reading a copy of the thing being measured.
  const cases = await prisma.case.findMany({ select: { questionTypeId: true, freeTier: true } });
  requirePopulation('null-approver tranche', { 'Case rows (the doors)': cases.length });
  const freeTypes = new Set(cases.filter((c) => c.freeTier).map((c) => c.questionTypeId));
  const anyCaseTypes = new Set(cases.map((c) => c.questionTypeId));

  // Carriers at EVERY status, so an unserved entry can still be ranked by how much content
  // depends on it. A LIVE-only count is all zeroes down there and orders nothing.
  const allItems = await prisma.item.findMany({
    select: { id: true, options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, tags: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } } } },
  });
  const anyStatusCarriers = new Map<string, number>();
  for (const item of allItems) {
    for (const option of item.options) {
      for (const id of [option.misconceptionId, ...option.tags.map((t) => t.misconceptionId)]) {
        if (id) anyStatusCarriers.set(id, (anyStatusCarriers.get(id) ?? 0) + 1);
      }
    }
  }

  const liveItems = await prisma.item.findMany({
    where: { status: 'LIVE' },
    select: {
      id: true,
      questionTypeId: true,
      options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, tags: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } } },
    },
  });
  requirePopulation('null-approver tranche', { 'LIVE items': liveItems.length });

  const carriers = new Map<string, { itemId: string; questionTypeId: string }[]>();
  for (const item of liveItems) {
    for (const option of item.options) {
      for (const id of [option.misconceptionId, ...option.tags.map((t) => t.misconceptionId)]) {
        if (!id) continue;
        if (!carriers.has(id)) carriers.set(id, []);
        carriers.get(id)!.push({ itemId: item.id, questionTypeId: item.questionTypeId });
      }
    }
  }

  const nulls = await prisma.misconception.findMany({ where: { approvedBy: null }, orderBy: { id: 'asc' } });
  requirePopulation('null-approver tranche', { 'misconceptions with no recorded approver': nulls.length });

  const rows = nulls.map((row) => {
    const carried = carriers.get(row.id) ?? [];
    const types = [...new Set(carried.map((c) => c.questionTypeId))].sort();
    const rank: Rank =
      types.some((t) => freeTypes.has(t)) ? 'REACHABLE(free)'
      : types.some((t) => anyCaseTypes.has(t)) ? 'REACHABLE(paid)'
      : carried.length > 0 ? 'SERVABLE'
      : 'NOT SERVED';
    return {
      reviewOrderRank: rank,
      id: row.id,
      district: row.district,
      status: row.status,
      childHint: row.childHint,
      description: row.description,
      carrierLiveItemCount: carried.length,
      carrierItemCountAllStatuses: anyStatusCarriers.get(row.id) ?? 0,
      carrierQuestionTypes: types,
      freeDoorTypes: types.filter((t) => freeTypes.has(t)),
      approvalNote: row.approvalNote,
      textProvenanceState: row.textProvenance === null ? 'UNKNOWN — nothing recorded (R98)' : row.textProvenance,
    };
  });

  /*
   * WITHIN EVERY RANK, WIDEST EXPOSURE FIRST — INCLUDING THE UNSERVED (Annie, 2026-08-19).
   *
   * The first version sorted the 60 NOT SERVED rows alphabetically, because their LIVE carrier
   * count is zero for all of them and the tiebreak fell through to the id. **That made a
   * meaningless order look like a considered one.** An unserved entry tagged on forty items is a
   * different risk from one tagged on two: neither reaches a child today, and one is forty items
   * away from doing so. So unserved rows are ranked by their TOTAL carrier count across every
   * status, which is the number that says how much content is waiting on them.
   */
  rows.sort((a, b) => {
    const byRank = ORDER.indexOf(a.reviewOrderRank) - ORDER.indexOf(b.reviewOrderRank);
    if (byRank !== 0) return byRank;
    if (b.carrierLiveItemCount !== a.carrierLiveItemCount) return b.carrierLiveItemCount - a.carrierLiveItemCount;
    if (b.carrierItemCountAllStatuses !== a.carrierItemCountAllStatuses) {
      return b.carrierItemCountAllStatuses - a.carrierItemCountAllStatuses;
    }
    return a.id.localeCompare(b.id);
  });

  const counts = Object.fromEntries(ORDER.map((r) => [r, rows.filter((x) => x.reviewOrderRank === r).length]));

  const payload = {
    what: 'Every misconception with no recorded approver, ordered by how soon a child can meet it.',
    owedTo: 'Cowork, which cannot compute this ordering from its side',
    reachabilityDefinedBy:
      "check:serving-path — REACHABLE means a Case row names the item's question type; free/paid splits on Case.freeTier, the column entitlements.ts reads.",
    limitCarriedForward:
      'A CASE NAMES THE TYPE. Not a claim that any child met any of these hints on any day. The ordering is exactly as confident as that.',
    denominators: {
      caseRows: cases.length,
      liveItems: liveItems.length,
      misconceptionsWithNoRecordedApprover: nulls.length,
    },
    counts,
    rows,
  };

  const stamp = artefactStamp(
    payload,
    new Date().toISOString(),
    'mixed',
    'every misconception with no recorded approver, verbatim, ranked by reachability from a child',
    ['rows'],
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log('Null-approver tranche, reachable order');
  for (const rank of ORDER) console.log(`  ${rank.padEnd(18)} ${String(counts[rank]).padStart(3)}`);
  console.log(`  ${'total'.padEnd(18)} ${String(nulls.length).padStart(3)}`);
  console.log('\n  The front of the UNSERVED 60, by how much content waits on them:');
  for (const r of rows.filter((x) => x.reviewOrderRank === 'NOT SERVED').slice(0, 8)) {
    console.log(`      ${r.id.padEnd(34)} ${String(r.carrierItemCountAllStatuses).padStart(3)} item(s) at any status`);
  }
  console.log('\n  The front of the queue (REACHABLE(free), widest exposure first):');
  for (const r of rows.filter((x) => x.reviewOrderRank === 'REACHABLE(free)').slice(0, 8)) {
    console.log(`      ${r.id.padEnd(34)} ${String(r.carrierLiveItemCount).padStart(3)} item(s)`);
  }
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
