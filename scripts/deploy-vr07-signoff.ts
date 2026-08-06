/**
 * DEPLOY + RECORD the rebuilt vr-07 bank — `pnpm tsx scripts/deploy-vr07-signoff.ts --apply`.
 *
 * The reviewer APPROVED and signed the rebuilt 25 vr-07 items (round two). This
 * writes the rebuilt content over the live bank and records her sign-off the
 * written-review way: reviewedBy the reviewer, reviewRecordedBy David (never
 * merged). Her authored diagnosis vr07-term-dropped is upserted ACTIVE first so
 * the option FKs resolve. EVERY item runs the shared child-facing gate on the way
 * through; any blocking fault REFUSES that item rather than publishing it.
 * Attribution events name the individual (current-reviewer) per the handover log.
 */
import { checkItemChildFacing, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { GENERATORS, M } from '../packages/db/prisma/generate-content';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = '2026-08-06';
const METHOD = `written review — vr-07 rebuild sign-off, ${TODAY}`;
const NOTE = 'I confirm the rebuilt vr-07 bank (25 items, term-dropped added) is approved to go live to children.';
const TYPE = 'vr-07-letters-for-numbers';

async function attr(recordType: string, recordId: string, action: string, note?: string): Promise<void> {
  const id = `attr-${recordType}-${recordId}-${action}-current-reviewer`;
  await prisma.attributionEvent.upsert({
    where: { id },
    create: { id, recordType, recordId, action: action as never, actor: 'current-reviewer', recordedBy: RECORDER, note: note ?? null, method: METHOD },
    update: { action: action as never, actor: 'current-reviewer', note: note ?? null, method: METHOD },
  });
}

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  const approver = await prisma.parentAccount.findUnique({ where: { email: REVIEWER.replace(/^human:/, '') }, select: { staffRole: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);
  if (approver?.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER} is not a REVIEWER account`);

  // 1) her authored diagnosis, ACTIVE, so the item FKs resolve.
  const td = M[TYPE]!.find((m) => m.id === 'vr07-term-dropped')!;
  if (APPLY) {
    await prisma.misconception.upsert({
      where: { id: td.id },
      create: { id: td.id, district: 'VR', description: td.description, childHint: td.childHint, status: 'ACTIVE' },
      update: { description: td.description, childHint: td.childHint, status: 'ACTIVE' },
    });
    await attr('misconception', td.id, 'AUTHORED', 'Reviewer-authored third vr-07 diagnosis (round two).');
  }

  const items = GENERATORS[TYPE]!();
  const mechanic = (await prisma.questionType.findUnique({ where: { id: TYPE }, select: { mechanic: true } }))?.mechanic ?? 'select-one';
  let published = 0;
  const refusals: string[] = [];

  for (const it of items) {
    const id = `gen-${TYPE}-${String(it.n).padStart(2, '0')}`;
    const gateOpts = it.options.map((o) => ({ content: o.content }));
    const faults = checkItemChildFacing({ id, stem: it.stem, explanation: {}, mechanic, options: gateOpts }).filter(isBlocking);
    if (faults.length) { refusals.push(`  ✗ ${id}: ${faults[0]!.detail}`); continue; }
    if (APPLY) {
      await prisma.item.upsert({
        where: { id },
        create: { id, questionTypeId: TYPE, difficultyTier: it.tier, stem: it.stem, explanation: {}, status: 'LIVE', authoredBy: 'ai-draft:claude-fable-5', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
        update: { difficultyTier: it.tier, stem: it.stem, status: 'LIVE', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
      });
      await prisma.itemOption.deleteMany({ where: { itemId: id } });
      await prisma.itemOption.createMany({ data: it.options.map((o, idx) => ({ id: `${id}-opt${idx + 1}`, itemId: id, content: o.content, isCorrect: o.isCorrect, misconceptionId: o.isCorrect ? null : (o.mid ?? null) })) });
      await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'item.publish_recorded', targetKind: 'Item', targetId: id, detail: { reviewedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: NOTE } } });
      await attr('item', id, 'APPROVED');
    }
    published += 1;
  }

  console.log(`${APPLY ? 'DEPLOYED + RECORDED' : '--dry-run (no --apply)'}: ${published}/${items.length} vr-07 items ${APPLY ? 'LIVE, written-review signed' : 'would publish'}`);
  if (refusals.length) { console.log(`REFUSED (${refusals.length}):`); refusals.forEach((r) => console.log(r)); }
  if (APPLY) {
    const live = await prisma.item.count({ where: { questionTypeId: TYPE, status: 'LIVE' } });
    console.log(`vr-07 LIVE now: ${live}`);
  }
  await prisma.$disconnect();
}

void main();
