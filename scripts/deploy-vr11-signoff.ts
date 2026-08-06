/**
 * DEPLOY + RECORD the vr-11 bank — `pnpm tsx scripts/deploy-vr11-signoff.ts --apply`.
 *
 * The reviewer independently recomputed both new distractors across all 39 items
 * (25 gen + 14 seed), confirmed no collisions and nothing negative/zero, and
 * signed. This writes the bank live and records her sign-off the written-review
 * way (reviewedBy reviewer, reviewRecordedBy David). Her two authored constant
 * diagnoses are upserted ACTIVE first so the option FKs resolve. Every item runs
 * the shared child-facing gate; a blocking fault refuses that item.
 */
import { checkItemChildFacing, isBlocking } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { GENERATORS } from '../packages/db/prisma/generate-content';
import { numberSeriesItems } from '../packages/db/prisma/seed';

const APPLY = process.argv.includes('--apply');
const REVIEWER = 'human:staff-reviewer@cluecrew.test';
const RECORDER = 'human:david@cluecrew.test';
const TODAY = '2026-08-06';
const METHOD = `written review — vr-11 sign-off, ${TODAY}`;
const NOTE = 'I confirm the vr-11 bank (39 items, direction retired, constant series to four options) is approved to go live to children.';
const TYPE = 'vr-11-number-series';

const NEW_MISCONCEPTIONS = [
  { id: 'vr-series-step-applied-twice', description: 'Added the step twice from the last term, usually after losing track of the gaps.', childHint: 'Take one jump from the last number, not two. Check the gaps first.' },
  { id: 'vr-series-sum-of-last-two', description: 'Read the series as each term being the sum of the two before it, and added the last pair.', childHint: 'Look at the gap between each pair. The gap is what tells you the next number.' },
];

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

  if (APPLY) {
    for (const m of NEW_MISCONCEPTIONS) {
      await prisma.misconception.upsert({ where: { id: m.id }, create: { id: m.id, district: 'VR', description: m.description, childHint: m.childHint, status: 'ACTIVE' }, update: { description: m.description, childHint: m.childHint, status: 'ACTIVE' } });
      await attr('misconception', m.id, 'AUTHORED', 'Reviewer-authored constant-series diagnosis (round two).');
    }
  }

  const mechanic = (await prisma.questionType.findUnique({ where: { id: TYPE }, select: { mechanic: true } }))?.mechanic ?? 'select-one';
  const gen = GENERATORS[TYPE]!().map((it) => ({ id: `gen-${TYPE}-${String(it.n).padStart(2, '0')}`, tier: it.tier, stem: it.stem, options: it.options as Array<{ content: unknown; isCorrect: boolean; mid?: string; misconceptionId?: string | null }> }));
  const seed = numberSeriesItems().map((s) => ({ id: s.id, tier: s.difficultyTier, stem: s.stem, options: s.options as Array<{ content: unknown; isCorrect: boolean; mid?: string; misconceptionId?: string | null }> }));
  const all = [...gen, ...seed];

  let published = 0;
  const refusals: string[] = [];
  for (const it of all) {
    const faults = checkItemChildFacing({ id: it.id, stem: it.stem, explanation: {}, mechanic, options: it.options.map((o) => ({ content: o.content })) }).filter(isBlocking);
    if (faults.length) { refusals.push(`  ✗ ${it.id}: ${faults[0]!.detail}`); continue; }
    if (APPLY) {
      await prisma.item.upsert({
        where: { id: it.id },
        create: { id: it.id, questionTypeId: TYPE, difficultyTier: it.tier, stem: it.stem, explanation: {}, status: 'LIVE', authoredBy: 'ai-draft:claude-fable-5', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
        update: { difficultyTier: it.tier, stem: it.stem, status: 'LIVE', reviewedBy: REVIEWER, reviewRecordedBy: RECORDER, reviewMethod: METHOD, reviewRecordNote: NOTE },
      });
      await prisma.itemOption.deleteMany({ where: { itemId: it.id } });
      await prisma.itemOption.createMany({ data: it.options.map((o, idx) => ({ id: `${it.id}-opt${idx + 1}`, itemId: it.id, content: o.content as object, isCorrect: o.isCorrect, misconceptionId: o.isCorrect ? null : (o.mid ?? o.misconceptionId ?? null) })) });
      await prisma.adminAuditLog.create({ data: { actorId: operator.id, action: 'item.publish_recorded', targetKind: 'Item', targetId: it.id, detail: { reviewedBy: REVIEWER, recordedBy: RECORDER, method: METHOD, note: NOTE } } });
      await attr('item', it.id, 'APPROVED');
    }
    published += 1;
  }

  console.log(`${APPLY ? 'DEPLOYED + RECORDED' : '--dry-run (no --apply)'}: ${published}/${all.length} vr-11 items (${gen.length} gen + ${seed.length} seed) ${APPLY ? 'LIVE, signed' : 'would publish'}`);
  if (refusals.length) { console.log(`REFUSED (${refusals.length}):`); refusals.forEach((r) => console.log(r)); }
  if (APPLY) console.log(`vr-11 LIVE now: ${await prisma.item.count({ where: { questionTypeId: TYPE, status: 'LIVE' } })}`);
  await prisma.$disconnect();
}

void main();
