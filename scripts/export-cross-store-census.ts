/**
 * THE CROSS-STORE CENSUS — MY HALF. Same id, every store, texts side by side.
 *
 * **ANNIE'S RULING (2026-08-19).** Within-store divergence was the easier half, and the census ran
 * on one side only. This half runs INDEPENDENTLY of Cowork's, as before: I do not read its output
 * before producing mine, because two censuses that agree after one has seen the other agree about
 * nothing. **The difference is the finding.**
 *
 * WHAT THIS EMITS, PER SERVED VR HINT: the id, the text VERBATIM (R25 — send the value, never an
 * account of it), the carrier count, whether a free child can reach it, and the approval fields
 * under names that carry their own doubt (R203 — `approvedByRecordedAs`, never a bare
 * `approvedBy`, because a clean name where the fact is doubt asserts the thing the doubt denies).
 *
 * IT ALSO ANSWERS THE ONE-STORE-ONLY QUESTION AS FAR AS THIS SIDE CAN. A count of hints existing
 * in only one store cannot be computed from one store — so this emits the complete id list that
 * makes the count computable, states the denominator, and reports the LOWER BOUND already known
 * from Cowork's own report of what it could not find. A bound with its reason beats a number with
 * a hidden assumption.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'cross-store-census-vr-served-mine';

/**
 * ANNIE'S EIGHT VR REPLACEMENT IDS — the ones Cowork searched its library for and found none of.
 * Read from **the register, R220**, where this store wrote them down last turn.
 *
 * **I WROTE THIS LIST FROM MEMORY FIRST, AND SEVEN OF THE EIGHT WERE WRONG.** The census caught
 * it: seven of my recalled ids are tagged on no LIVE VR item at all, and one was not even a VR
 * entry. That is R178 — a name is looked up, never recalled — landing in a DATA FIELD rather than
 * in prose, which is the half the rule was not written for. **Then I compounded it**, declaring in
 * this very comment that the ids "were never written to an artefact in this store" and reducing
 * the list to one. They were written down, in the register, by me, in the previous turn. R86: a
 * file is not its content, it is every place that holds it — and I searched `content/evidence`
 * and the exports and called the absence proof.
 *
 * **THE FABRICATION WOULD HAVE READ AS A CONFIRMING RESULT** (R173) — "all eight served, exactly
 * as reported" — had the invented ids happened to exist. The disagreement is what saved it.
 */
const REPORTED_ABSENT_FROM_COWORK = [
  'vr-letter-series-off-by-one',
  'vr-series-off-by-one',
  'vr-series-step-carryover',
  'vr-series-sum-of-last-two',
  'vr01-first-word-only',
  'vr04-opposite-pull',
  'vr12-meaning-not-word',
  'vr15-first-mention',
];

async function main() {
  const live = await prisma.item.findMany({
    where: { status: 'LIVE', questionTypeId: { startsWith: 'vr-' } },
    select: {
      id: true,
      questionTypeId: true,
      options: { orderBy: { id: 'asc' }, select: { misconceptionId: true, tags: { orderBy: { id: 'asc' }, select: { misconceptionId: true } } } },
    },
  });
  requirePopulation('cross-store census', { 'LIVE VR items': live.length });

  // Carriers, counted from the OPTION ROWS rather than from the misconception side, because a
  // library entry that exists and is tagged nowhere is not served — and the difference between
  // "exists" and "is served" is the whole subject of this census.
  const carriers = new Map<string, Set<string>>();
  for (const item of live) {
    for (const option of item.options) {
      const ids = [option.misconceptionId, ...option.tags.map((t) => t.misconceptionId)];
      for (const id of ids) {
        if (!id) continue;
        if (!carriers.has(id)) carriers.set(id, new Set());
        carriers.get(id)!.add(item.id);
      }
    }
  }
  requirePopulation('cross-store census', { 'misconceptions tagged on LIVE VR items': carriers.size });

  const rows = await prisma.misconception.findMany({
    where: { id: { in: [...carriers.keys()] } },
    orderBy: { id: 'asc' },
  });

  const census = rows.map((row) => ({
    id: row.id,
    district: row.district,
    status: row.status,
    // The value, not an account of it (R25).
    childHint: row.childHint,
    description: row.description,
    approvalNote: row.approvalNote,
    carrierItemCount: carriers.get(row.id)!.size,
    carrierItemIds: [...carriers.get(row.id)!].sort(),
    // R203: the qualifier lives IN the field name, never one field over.
    approvedByRecordedAs: row.approvedBy,
    approvalMethodRecordedAs: row.approvalMethod,
    recordedByRecordedAs: row.recordedBy,
    textProvenanceState:
      row.textProvenance === null ? 'UNKNOWN — nothing recorded, which is not the same as unsourced (R98)' : row.textProvenance,
    reportedAbsentFromCowork: REPORTED_ABSENT_FROM_COWORK.includes(row.id),
  }));

  const nullApproval = census.filter((c) => c.approvedByRecordedAs === null);
  const absent = census.filter((c) => c.reportedAbsentFromCowork);

  const payload = {
    what: 'Served VR hints in this store, for the cross-store census. My half, produced without reading Cowork\'s.',
    ruledBy: "Annie's eighth return, 2026-08-19",
    denominators: {
      liveVrItems: live.length,
      hintsServedOnLiveVrItems: census.length,
      ofThoseWithNoRecordedApprover: nullApproval.length,
    },
    oneStoreOnly: {
      question: 'How many served VR hints exist in only one store?',
      answerableFromOneStore: false,
      reason:
        'The count needs both id sets. This file carries the complete id set for this side, which makes it computable on receipt.',
      lowerBoundKnownNow: absent.length,
      lowerBoundBasis:
        "Cowork's own reported result, recorded in this store's register at R220: it searched its library for these eight ids and found none of them. Not an inference about its store from this side.",
      whatWouldCompleteIt:
        'Cowork returns the id set of every hint its store serves on a VR item. The census below is this side\'s complete set, so the symmetric difference is computable on receipt.',
      largestCarrierAmongThem: absent
        .slice()
        .sort((a, b) => b.carrierItemCount - a.carrierItemCount)
        .slice(0, 1)
        .map((a) => ({ id: a.id, carrierItemCount: a.carrierItemCount })),
    },
    census,
  };

  // The stamp is computed from the SAME projection this file delivers (R88) — not from a
  // separate query that happens to describe it, which is how two materially different files
  // once shipped under one name.
  const stamp = artefactStamp(
    payload,
    new Date().toISOString(),
    'mixed',
    'every misconception hint served on a LIVE VR item, verbatim, with its carriers and its approval fields under names that carry their own doubt',
    ['census'],
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);

  console.log('Cross-store census — my half');
  console.log(`  LIVE VR items: ${live.length}`);
  console.log(`  hints served on them: ${census.length}`);
  console.log(`  of those, no recorded approver: ${nullApproval.length}`);
  console.log(`  reported absent from Cowork's library: ${absent.length} (the lower bound on one-store-only)`);
  for (const a of absent.sort((x, y) => y.carrierItemCount - x.carrierItemCount)) {
    console.log(`      ${a.id.padEnd(34)} ${String(a.carrierItemCount).padStart(3)} carrier item(s)`);
  }
  console.log(`\n  ${path}`);
  await prisma.$disconnect();
}

main();
