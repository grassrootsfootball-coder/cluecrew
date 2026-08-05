/**
 * THE DERIVABLE MATHS DISTRACTOR GATE — `pnpm check:maths-distractors`
 *
 * Runs the §5 checks over every MATHS item: the key is recomputed from the
 * item's `solution`, and every distractor tagged with a derivable misconception
 * must equal the number that misconception produces on the item's operands.
 *
 * DEFECTS on a SERVING (LIVE) item fail the build. On a DRAFT item they are
 * reported as backlog — the publish door stops them reaching a child, and
 * failing CI on an authoring queue only trains people to skip the gate.
 * Coverage is reported too: how many of the approved derivable misconceptions
 * have an executor, so what the gate cannot yet verify is never silent.
 *
 * Authoring contract: a maths item carries `stem.operands` (its named numbers)
 * and a `solution` expression. Without operands the executors cannot run, and
 * the gate says so per item rather than passing it blind.
 */
import {
  CONCEPTUAL_ENTRIES,
  MISCONCEPTION_EXECUTORS,
  checkMathsItem,
  mathsEntryNumber,
  type MathsFailure,
} from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    include: { options: true },
  });

  const serving: MathsFailure[] = [];
  const draft: MathsFailure[] = [];
  const reports: MathsFailure[] = [];
  for (const item of items) {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const key = item.options.find((o) => o.isCorrect);
    const found = checkMathsItem({
      id: item.id,
      solution: item.solution,
      keyValue: String((key?.content as { value?: unknown })?.value ?? ''),
      operands: (stem.operands as Record<string, number | number[] | string>) ?? {},
      distractors: item.options
        .filter((o) => !o.isCorrect)
        .map((o) => ({ value: String((o.content as { value?: unknown }).value ?? ''), misconceptionId: o.misconceptionId })),
    });
    for (const f of found) {
      if (f.severity === 'report') reports.push(f);
      else (item.status === 'LIVE' ? serving : draft).push(f);
    }
  }

  console.log(`Derivable maths distractor gate: ${items.length} MATHS item(s) checked.`);

  // --- Executor coverage over the approved derivable misconceptions --------
  const active = await prisma.misconception.findMany({ where: { district: 'MATHS', status: 'ACTIVE' }, select: { id: true } });
  const derivable = active.map((m) => mathsEntryNumber(m.id)).filter((n): n is number => n !== null && !CONCEPTUAL_ENTRIES.has(n));
  const covered = derivable.filter((n) => MISCONCEPTION_EXECUTORS[n]);
  console.log(`Executors: ${covered.length} of ${derivable.length} derivable misconceptions have one; ${active.length - derivable.length} conceptual are review-only.`);
  const missing = derivable.filter((n) => !MISCONCEPTION_EXECUTORS[n]).sort((a, b) => a - b);
  if (missing.length) console.log(`  derivable without an executor yet: ${missing.join(', ')}`);

  if (draft.length) {
    console.log(`\nDRAFT backlog (not serving): ${draft.length} defect(s).`);
    for (const f of draft.slice(0, 10)) console.log(`  · ${f.itemId}: ${f.detail}`);
  }
  if (reports.length) {
    const byRule = reports.reduce<Record<string, number>>((a, f) => { a[f.rule] = (a[f.rule] ?? 0) + 1; return a; }, {});
    console.log(`\nReports (non-blocking): ${Object.entries(byRule).map(([r, n]) => `${r}: ${n}`).join(', ')}`);
  }
  if (serving.length) {
    console.error(`\nSERVING maths items FAILED the gate (${serving.length}):`);
    for (const f of serving) console.error(`  ✗ ${f.itemId}: ${f.detail}`);
    console.error('\nA distractor that is not the executed misconception can mislead a child now. Fix it or unpublish.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\nEverything serving passes the derivable maths distractor gate.');
  await prisma.$disconnect();
}

void main();
