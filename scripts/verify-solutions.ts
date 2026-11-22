/**
 * Solution-verification CI (BUILD-DISTRICT-MATHS §5, gate #3): every
 * MATHS-district item must carry a `solution` expression, and the computed
 * value must equal the keyed correct option. A wrong key fails the build —
 * an AI-drafted item cannot ship one.
 *
 * Run: pnpm verify:solutions  (CI runs it after seed, before e2e)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkSolution, optionNumericValue } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** Keys that are not a single number (a coordinate, a clock time, a named choice), declared with the
 *  reviewer's attestation by scripts/agent-review/land-solutions.ts (R1040). A missing file is no
 *  declarations, never a pass: every such item then fails as having no expression. */
function declaredNonNumeric(): Map<string, { key: string; reason: string }> {
  const f = join(__dirname, '..', 'content', 'maths-noncomputable-keys.json');
  if (!existsSync(f)) return new Map();
  const doc = JSON.parse(readFileSync(f, 'utf8')) as { declared?: Array<{ itemId: string; key: string; reason: string }> };
  if (!Array.isArray(doc.declared)) throw new Error(`${f}: expected {declared[]} (R173)`);
  return new Map(doc.declared.map((d) => [d.itemId, { key: d.key, reason: d.reason }]));
}

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' }, status: { not: 'RETIRED' } },
    include: { options: { orderBy: { id: 'asc' } } },
  });

  const declared = declaredNonNumeric();
  const failures: string[] = [];
  const exempt: string[] = [];
  for (const item of items) {
    const decl = declared.get(item.id);
    if (!item.solution && decl) {
      const key = item.options.find((o) => o.isCorrect)?.content;
      // A declaration describes a key; if the key has since become a number, the declaration is stale.
      if (optionNumericValue(key) !== null) failures.push(`${item.id}: declared non-numeric ("${decl.key}"), but its key now reads as a number — remove the declaration and add an expression`);
      else exempt.push(`${item.id} "${decl.key}" — ${decl.reason}`);
      continue;
    }
    if (!item.solution) {
      failures.push(`${item.id}: MATHS item without a solution expression`);
      continue;
    }
    const result = checkSolution(
      item.solution,
      item.options.map((option) => ({ content: option.content, isCorrect: option.isCorrect })),
    );
    if (!result.ok) {
      failures.push(
        `${item.id}: ${result.reason} (computed=${result.computed}, keyed=${result.keyed})`,
      );
    }
  }

  requirePopulation('verify:solutions', { 'MATHS items (not RETIRED)': items.length });
  const verified = items.length - failures.length - exempt.length;
  console.log(`verify:solutions: ${items.length} MATHS items · ${verified} keys recomputed from their expression · ${exempt.length} declared not a single number (no expression can check them):`);
  for (const e of exempt) console.log(`    ${e}`);
  if (failures.length > 0) {
    console.error(`Solution verification FAILED (${failures.length} of ${items.length} items):`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  // R61's declaration said "remove this the moment a maths item reaches the database". 187 did on
  // 2026-08-29 and the declaration stayed for three months, because CI could not see them. With the
  // content snapshot (R1039) the population exists, so an empty one is now a pipeline failure.
  await prisma.$disconnect();
}

void main();
