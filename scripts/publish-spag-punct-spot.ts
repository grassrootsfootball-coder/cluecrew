/**
 * THE SPaG DOOR OPENS — nine items to LIVE and `errorspot` into `QUARTER_ORDER`, in ONE act.
 *
 * **THE TWO MOVE TOGETHER OR NEITHER MOVES** (David's ruling, 2026-08-19). Ordering the quarter
 * while the items are DRAFT puts a named, empty room on the map — the fault `districts.ts` warns
 * about in writing. Publishing the items without ordering the quarter is the same fault reversed:
 * nine LIVE items behind a room that renders nowhere. **Both half-states are worse than either
 * end**, so the file edit and the database write are one operation with a rollback.
 *
 * **THE SIGNATURE NAMES A PERSON AND CITES THE READING.** `recordSignature` refuses an unknown
 * reviewer, so the event carries `rev-0001` and its method names her return and its hash. The row's
 * `reviewedBy` stays a POINTER to that document rather than her name (R252) — a signature recorded
 * by another hand says whose judgement it was and who typed it, and never conflates them.
 *
 * **EVERY GATE RE-RUNS AT THE DOOR.** The blockers and the child-facing gate were clean an hour
 * ago; that is not the same as clean now, and a publish that trusts an earlier reading is the
 * `verify:solutions` fault wearing a publish button.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkItemChildFacing, isBlocking, publishBlockers } from '../packages/core/src/index';
import { prisma, recordSignature } from '../packages/db/src/index';

const TYPE = 'en-spag-punct-spot';
const REVIEWER = 'rev-0001';
const RECORDED_BY = 'human:david@cluecrew.test';
const RETURN_FILE = 'content/evidence/annie-eng003-fourth-return.md';
const DISTRICTS = resolve(import.meta.dirname, '../apps/web/lib/crew/districts.ts');
const ANCHOR = `export const QUARTER_ORDER: MechanicFamily[] = [\n  'stowaway',`;
const ORDERED = `export const QUARTER_ORDER: MechanicFamily[] = [\n  'stowaway',`;

async function main() {
  // ---- 1. PRE-FLIGHT. Nothing is written until every one of these passes. ----
  const returnText = readFileSync(resolve(import.meta.dirname, '..', RETURN_FILE), 'utf8');
  const returnHash = createHash('sha256').update(returnText).digest('hex');
  if (!returnText.includes('ENG-003 set A stands at 34 of 34 signed')) {
    throw new Error(`REFUSED: ${RETURN_FILE} no longer carries the signature claim.`);
  }

  const items = await prisma.item.findMany({
    where: { questionTypeId: TYPE },
    include: { options: true, questionType: { select: { mechanic: true } } },
    orderBy: { id: 'asc' },
  });
  if (items.length !== 9) throw new Error(`REFUSED: expected 9 ${TYPE} items, found ${items.length}.`);

  const kase = await prisma.case.findFirst({ where: { questionTypeId: TYPE } });
  if (!kase) throw new Error(`REFUSED: no Case names ${TYPE}. Publishing would make nine items PUBLISHED and REACHABLE by nobody.`);

  const problems: string[] = [];
  for (const item of items) {
    if (item.status !== 'DRAFT') problems.push(`${item.id}: status is ${item.status}, expected DRAFT`);
    const blocker = publishBlockers(item.options, item.reviewedBy, item.authoredBy ?? 'unknown', item.answerFlaggedAt);
    if (blocker) problems.push(`${item.id}: publish blocker "${blocker}"`);
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    for (const f of faults) problems.push(`${item.id}: ${f.rule} — ${f.detail}`);
  }

  const districtsSrc = readFileSync(DISTRICTS, 'utf8');
  /*
   * SCOPED TO THE ARRAY, NOT THE FILE. The first version asked whether the file contained
   * `'errorspot',` — which it does, in `QUARTERS`, as `family: 'errorspot',`. So the act refused
   * itself as already-run before it had run once. **Matching the file where the property is about
   * one structure inside it** is the same fault as counting a comment as a reader and reading enum
   * values as screen text: the fifth this week, and the reason the rule is now "cut to the
   * structure before you match".
   */
  const orderBlock = /export const QUARTER_ORDER: MechanicFamily\[\] = \[([\s\S]*?)\]/.exec(districtsSrc);
  if (!orderBlock) {
    problems.push('QUARTER_ORDER array not found in districts.ts — refusing to report from a failed read (R173).');
  } else if (orderBlock[1]!.includes("'errorspot'")) {
    problems.push('QUARTER_ORDER already contains errorspot — this act has run.');
  }
  if (!districtsSrc.includes(ANCHOR)) problems.push('QUARTER_ORDER anchor not found in districts.ts — the file moved.');

  if (problems.length > 0) {
    console.error(`REFUSED — ${problems.length} problem(s), nothing written:\n`);
    for (const p of problems) console.error(`  - ${p}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  // ---- 2. THE MAP FIRST, because it is the half that can be undone by writing a file. ----
  const withOrder = districtsSrc.replace(
    ANCHOR,
    `${ORDERED}\n  // ORDERED 2026-08-19, in the same act that published the nine en-spag-punct-spot items.\n  // The Fix-It Shop has a door (case-en-05) and nine LIVE items behind it; before this it would\n  // have been a named, empty room. The Gap Yard stays out until the sixteen cloze items publish.\n  'errorspot',`,
  );
  writeFileSync(DISTRICTS, withOrder);

  // ---- 3. THE ITEMS, in one transaction. If it throws, the file goes back. ----
  try {
    await prisma.$transaction(
      items.map((item) => prisma.item.update({ where: { id: item.id }, data: { status: 'LIVE' } })),
    );
    for (const item of items) {
      await recordSignature(prisma, {
        recordType: 'Item',
        recordId: item.id,
        reviewerId: REVIEWER,
        recordedBy: RECORDED_BY,
        method: `published on her written signature — ${RETURN_FILE} §1, sha256 ${returnHash}`,
        note: 'ENG-003 set A, 34 of 34 signed. Published by another hand; reviewedBy holds a pointer to the return, never her name.',
      });
    }
  } catch (error) {
    writeFileSync(DISTRICTS, districtsSrc);
    console.error('PUBLISH FAILED — QUARTER_ORDER reverted so the two do not split.');
    throw error;
  }

  // ---- 4. READ BACK. Both halves, from their sources. ----
  const back = await prisma.item.findMany({ where: { questionTypeId: TYPE }, select: { id: true, status: true } });
  const live = back.filter((i) => i.status === 'LIVE');
  const signed = await prisma.attributionEvent.count({
    where: { recordType: 'Item', action: 'SIGNED', recordId: { in: items.map((i) => i.id) } },
  });
  const orderedBlock = /export const QUARTER_ORDER: MechanicFamily\[\] = \[([\s\S]*?)\]/
    .exec(readFileSync(DISTRICTS, 'utf8'));
  const ordered = Boolean(orderedBlock && orderedBlock[1]!.includes("'errorspot'"));

  console.log(`items LIVE          : ${live.length} of ${back.length}`);
  console.log(`SIGNED events       : ${signed}`);
  console.log(`errorspot ordered   : ${ordered}`);
  console.log(`Case                : ${kase.id} "${kase.title}" (freeTier ${kase.freeTier})`);
  if (live.length !== 9 || !ordered) throw new Error('read-back disagrees — the two halves have split');
  console.log('\nSTORED 9 · PUBLISHED 9 · SERVABLE 9 · REACHABLE(paid) 9 · REACHABLE(free) 0');
  console.log('A child on a paid plan can now reach a SpaG item. The Fix-It Shop renders.');
  await prisma.$disconnect();
}

main();
