/**
 * DEPLOY + RECORD the rebuilt vr-03 bank — `pnpm tsx scripts/deploy-vr03-signoff.ts --apply`.
 *
 * The reviewer checked the rebalanced dry run and signed. This writes the typed
 * generate-to-diagnosis bank live and records her sign-off the written-review
 * way (reviewedBy reviewer, reviewRecordedBy David). Every item runs the shared
 * child-facing gate; a wrong option whose diagnosis is not ACTIVE, or any
 * blocking fault, REFUSES that item. king->crown is retired, so item 20 becomes
 * fish->fly — the ambiguity that was pulled to DRAFT is resolved by re-authoring.
 */
import { checkItemChildFacing, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { GENERATORS } from '../packages/db/prisma/generate-content';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = '2026-08-06';
const METHOD = `written review — vr-03 rebuild sign-off, ${TODAY}`;
const NOTE = 'I confirm the rebuilt vr-03 bank (typed generate-to-diagnosis, distribution rebalanced) is approved to go live to children.';
const TYPE = 'vr-03-related-words';

async function attr(recordType: string, recordId: string, action: string): Promise<void> {
  const id = `attr-${recordType}-${recordId}-${action}-current-reviewer`;
  await prisma.attributionEvent.upsert({
    where: { id },
    create: { id, recordType, recordId, action: action as never, actor: 'current-reviewer', recordedBy: RECORDER, method: METHOD },
    update: { action: action as never, actor: 'current-reviewer', method: METHOD },
  });
}

async function main(): Promise<void> {
  const operator = await prisma.parentAccount.findUnique({ where: { email: RECORDER.replace(/^human:/, '') }, select: { id: true } });
  const approver = await prisma.parentAccount.findUnique({ where: { email: REVIEWER.replace(/^human:/, '') }, select: { staffRole: true } });
  if (!operator) throw new Error(`${RECORDER} is not an account`);
  if (approver?.staffRole !== 'REVIEWER') throw new Error(`${REVIEWER} is not a REVIEWER account`);
  const active = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE' }, select: { id: true } })).map((m) => m.id));

  const items = GENERATORS[TYPE]!();
  const mechanic = (await prisma.questionType.findUnique({ where: { id: TYPE }, select: { mechanic: true } }))?.mechanic ?? 'select-one';
  let published = 0;
  const refusals: string[] = [];

  for (const it of items) {
    const id = `gen-${TYPE}-${String(it.n).padStart(2, '0')}`;
    const reasons: string[] = [];
    const faults = checkItemChildFacing({ id, stem: it.stem, explanation: {}, mechanic, options: it.options.map((o) => ({ content: o.content })) }).filter(isBlocking);
    if (faults.length) reasons.push(faults[0]!.detail);
    const tags = it.options.filter((o) => !o.isCorrect).map((o) => o.mid).filter((m): m is string => !!m);
    const notActive = tags.filter((m) => !active.has(m));
    if (notActive.length) reasons.push(`diagnosis not ACTIVE: ${notActive[0]}`);
    if (!it.options.some((o) => o.isCorrect)) reasons.push('no correct option');
    if (reasons.length) { refusals.push(`  ✗ ${id}: ${reasons.join(' | ')}`); continue; }
    if (APPLY) {
      await prisma.item.upsert({
        where: { id },
        create: { id, questionTypeId: TYPE, difficultyTier: it.tier, stem: it.stem, explanation: {}, status: 'LIVE', authoredBy: 'ai-draft:claude-fable-5', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
        update: { difficultyTier: it.tier, stem: it.stem, status: 'LIVE', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
      });
      await prisma.itemOption.deleteMany({ where: { itemId: id } });
      await prisma.itemOption.createMany({ data: it.options.map((o, idx) => ({ id: `${id}-opt${idx + 1}`, itemId: id, content: o.content as object, isCorrect: o.isCorrect, misconceptionId: o.isCorrect ? null : (o.mid ?? null) })) });
      await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'item.publish_recorded', targetKind: 'Item', targetId: id, detail: { reviewedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: NOTE } } });
      await attr('item', id, 'APPROVED');
    }
    published += 1;
  }

  console.log(`${APPLY ? 'DEPLOYED + RECORDED' : '--dry-run (no --apply)'}: ${published}/${items.length} vr-03 items ${APPLY ? 'LIVE, signed' : 'would publish'}`);
  if (refusals.length) { console.log(`REFUSED (${refusals.length}):`); refusals.forEach((r) => console.log(r)); }
  if (APPLY) console.log(`vr-03 LIVE now: ${await prisma.item.count({ where: { questionTypeId: TYPE, status: 'LIVE' } })}`);
  await prisma.$disconnect();
}

void main();
