/**
 * VR FREE-TEN SIGN-OFF — `pnpm publish:vr-signoff` (`--apply` to write).
 *
 * The specialist reviewer signed off the VR free ten on written review. This
 * publishes those items to LIVE through the written-review path: reviewedBy the
 * reviewer, reviewRecordedBy David — never merged (DB CHECK enforces it) — with
 * her verbatim confirmation on the record.
 *
 * EVERY gate runs on the way through and an item that fails ANY of them is
 * REFUSED, not published:
 *   · the child-facing gates (reading age, banned vocabulary, no internal ids);
 *   · no answerability defect (answerFlaggedAt — the word-puzzle gate's net);
 *   · a correct option exists and every wrong option carries a misconception (P3);
 *   · every referenced misconception is ACTIVE (Addendum E);
 *   · the reviewer is not the author.
 * Publishing to a child is one-way; a refusal is the safe default.
 */
import { checkItemChildFacing, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = new Date().toISOString().slice(0, 10);
const METHOD = `written review — VR sign-off, ${TODAY}`;
const NOTE = 'I confirm I am content for the VR items I have passed to go live to children.';

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  const approver = await prisma.parentAccount.findUnique({ where: { email: REVIEWER.replace(/^human:/, '') }, select: { staffRole: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);
  if (approver?.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER} is not a REVIEWER account`);

  const active = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE' }, select: { id: true } })).map((m) => m.id));
  const cases = await prisma.case.findMany({ where: { freeTier: true }, orderBy: { orderInDistrict: 'asc' } });

  const perCase: Array<{ id: string; title: string; qt: string; total: number; published: number; refused: number; liveAfter: number }> = [];
  const refusals: string[] = [];
  let publishedTotal = 0;

  for (const kase of cases) {
    const items = await prisma.item.findMany({ where: { questionTypeId: kase.questionTypeId }, include: { options: true, questionType: true } });
    let published = 0; let refused = 0;
    for (const item of items) {
      if (item.status === 'LIVE') continue; // already live, leave it
      const reasons: string[] = [];
      // The SAME shared item gate the serving sweep runs — stem (every field),
      // options, and the walk script (copy + staleness). One implementation, so
      // the door can never read less than the sweep.
      const faults = checkItemChildFacing({ id: item.id, stem: item.stem, explanation: item.explanation, mechanic: item.questionType.mechanic, options: item.options }).filter(isBlocking);
      if (faults.length) reasons.push(faults[0]!.detail);
      if (item.answerFlaggedAt) reasons.push('answerability defect (answerFlaggedAt)');
      if (!item.options.some((o) => o.isCorrect)) reasons.push('no correct option');
      if (item.options.some((o) => !o.isCorrect && !o.misconceptionId)) reasons.push('a wrong option has no misconception (P3)');
      const propTags = item.options.map((o) => o.misconceptionId).filter((id): id is string => !!id).filter((id) => !active.has(id));
      if (propTags.length) reasons.push(`misconception not ACTIVE: ${propTags[0]}`);
      if (item.authoredBy === REVIEWER) reasons.push('reviewer is the author');

      if (reasons.length) { refused += 1; refusals.push(`  ✗ ${item.id}: ${reasons.join(' | ')}`); continue; }
      if (APPLY) {
        await prisma.item.update({ where: { id: item.id }, data: { status: 'LIVE', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE } });
        await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'item.publish_recorded', targetKind: 'Item', targetId: item.id, detail: { reviewedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: NOTE } } });
      }
      published += 1; publishedTotal += 1;
    }
    const liveAfter = await prisma.item.count({ where: { questionTypeId: kase.questionTypeId, status: 'LIVE' } });
    perCase.push({ id: kase.id, title: kase.title, qt: kase.questionTypeId, total: items.length, published, refused, liveAfter: APPLY ? liveAfter : liveAfter + published });
  }

  console.log(`${APPLY ? 'PUBLISHED' : '--dry-run (no --apply)'} — ${publishedTotal} item(s) ${APPLY ? 'now LIVE' : 'would publish'}\n`);
  console.log('per free-tier case (LIVE / floor 15):');
  let allMeet = true;
  for (const c of perCase) {
    const meets = c.liveAfter >= 15; if (!meets) allMeet = false;
    console.log(`  ${c.id.padEnd(11)} ${c.qt.padEnd(26)} LIVE ${String(c.liveAfter).padStart(3)}  (published ${c.published}, refused ${c.refused})  ${meets ? 'meets 15' : 'BELOW 15'}`);
  }
  console.log(`\nAll ten meet the 15-item floor: ${allMeet ? 'YES' : 'NO'}`);
  if (refusals.length) { console.log(`\nREFUSED (${refusals.length}) — not published:`); for (const r of refusals.slice(0, 20)) console.log(r); }
  await prisma.$disconnect();
}

void main();
