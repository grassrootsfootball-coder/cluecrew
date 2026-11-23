/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63).
 *
 * **ANNIE APPROVED THE FOUR REPAIRS; WALK NOW SERVES TEN OF TEN ON case-en-01.** The four were
 * refused for one shape — three line citations and no conclusion, teaching retrieval by proximity,
 * which is an error these very items catch (R262). The repairs cut the citations to the ones that
 * bear and close with the answer, on the six approved as the model.
 *
 * The proposed strings are read from the artefact she approved, not retyped — a retyped string is
 * a new string with an old string's authority (R222).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const ARTEFACT = resolve(import.meta.dirname, '../content/exports/eng028-walk-repairs-69ce6f33d763dc44.json');

async function main() {
  const raw = readFileSync(ARTEFACT, 'utf8');
  const hash = createHash('sha256').update(raw).digest('hex');
  const parsed = JSON.parse(raw) as { repairs?: { itemId: string; proposed: string; current: string }[] };
  const repairs = parsed.repairs;
  if (!repairs || repairs.length !== 4) throw new Error(`REFUSED: expected 4 repairs, found ${repairs?.length ?? 0}.`);

  const items = await prisma.item.findMany({
    where: { id: { in: repairs.map((r) => r.itemId) } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
  });
  if (items.length !== 4) throw new Error(`REFUSED: expected 4 items, found ${items.length}.`);

  const plan: { id: string; explanation: Record<string, unknown>; to: string }[] = [];
  for (const item of items) {
    const r = repairs.find((x) => x.itemId === item.id)!;
    const explanation = { ...((item.explanation ?? {}) as Record<string, unknown>) };
    if (explanation.walkScript !== r.current) {
      throw new Error(`REFUSED at ${item.id}: the stored script is not the one she read.\n  stored : ${explanation.walkScript}\n  in file: ${r.current}`);
    }
    explanation.walkScript = r.proposed;
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    if (faults.length > 0) throw new Error(`REFUSED at ${item.id}: ${faults.map((f) => f.detail).join(' | ')}`);
    plan.push({ id: item.id, explanation, to: r.proposed });
  }

  for (const p of plan) {
    await prisma.item.update({ where: { id: p.id }, data: { explanation: p.explanation as object } });
  }
  const back = await prisma.item.findMany({ where: { id: { in: plan.map((p) => p.id) } }, select: { id: true, explanation: true } });
  const ok = back.filter((b) => String(((b.explanation ?? {}) as Record<string, unknown>).walkScript) === plan.find((p) => p.id === b.id)!.to);
  console.log(`written: ${plan.length} · read back matching: ${ok.length} of 4`);
  if (ok.length !== 4) throw new Error('read-back disagrees');
  console.log(`  source artefact sha256: ${hash}`);
  for (const p of plan) console.log(`  ${p.id}: ${p.to}`);
  await prisma.$disconnect();
}

main();
