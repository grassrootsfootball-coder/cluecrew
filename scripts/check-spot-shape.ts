/**
 * SPOT-FAMILY SHAPE AND WALK BUDGET — `pnpm check:spot-shape` (Annie's 142 rulings).
 *
 * Screens every `segmentsInOptions` item. **The N option is excluded from the comparison and the
 * item is never skipped** — skipping the item would leave a check with nothing to screen, which is
 * the silent pass this register spends a hundred entries on. **The walk budget is per PART.**
 */
import { WALK_SENTENCES_PER_PART_CAP, checkSegmentShape, comparableSegments, walkSentencesPerPart, walkWithinBudget } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

async function main(): Promise<void> {
  const all = await prisma.item.findMany({
    where: { questionTypeId: { in: ['en-spag-punct-spot', 'en-spag-spelling-spot'] } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  const items = all.filter((i) => ((i.stem ?? {}) as { segmentsInOptions?: unknown }).segmentsInOptions === true);
  requirePopulation('check:spot-shape', { 'segmented spot items': items.length });

  const faults: string[] = [];
  let excluded = 0;
  const walks: string[] = [];
  for (const item of items) {
    const verdict = checkSegmentShape(item.id, item.options);
    excluded += verdict.nOptionsExcluded;
    faults.push(...verdict.faults);

    const walk = ((item.explanation ?? {}) as { walkScript?: unknown }).walkScript;
    if (typeof walk !== 'string' || !walk.trim()) continue;
    const parts = comparableSegments(item.options).length;
    const m = walkSentencesPerPart(walk, parts);
    const ok = walkWithinBudget(m.sentences, m.parts);
    walks.push(`  ${item.id}: ${m.sentences} sentence(s) / ${m.parts} part(s) = ${m.perPart.toFixed(2)} per part`
      + `${ok ? '' : '  OVER'}`);
    if (!ok) {
      faults.push(`${item.id}: ${m.perPart.toFixed(2)} sentences per part, cap ${WALK_SENTENCES_PER_PART_CAP}`);
    }
  }

  console.log(`check:spot-shape: ${items.length} segmented item(s) screened.`);
  console.log(`  N options excluded FROM THE COMPARISON (never the item): ${excluded}`);
  console.log(`  segments actually compared: ${items.reduce((n, i) => n + comparableSegments(i.options).length, 0)}`);
  console.log(`\n  WALK, measured PER PART (an N-keyed walk must visit every part before concluding).`);
  console.log(`  Cap ${WALK_SENTENCES_PER_PART_CAP} per part is MINE and provisional — she ruled the MEASURE, not the number.`);
  for (const w of walks) console.log(w);
  console.log(`\n  ${faults.length} fault(s)`);
  for (const f of faults) console.log(`    x ${f}`);
  await prisma.$disconnect();
  process.exit(faults.length ? 1 : 0);
}

void main();
