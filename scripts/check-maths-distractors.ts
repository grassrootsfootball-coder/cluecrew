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
import { declareMayBeEmpty } from './lib/population';

/** An option's value, or null when the field is ABSENT. Never coerces to a string. */
function optionValue(content: unknown): string | null {
  if (content && typeof content === 'object' && 'value' in content) {
    const v = (content as { value: unknown }).value;
    return v === null || v === undefined ? null : String(v);
  }
  return null;
}

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { questionType: { district: 'MATHS' } },
    include: { options: true },
  });

  const unreadable: string[] = [];
  const serving: MathsFailure[] = [];
  const draft: MathsFailure[] = [];
  const reports: MathsFailure[] = [];
  /**
   * The SERVING population, counted separately from `items.length`. The pass line
   * claims that everything serving passes, and `items.length` cannot stand in for
   * that: a status rename leaves it large while nothing is LIVE, and the gate would
   * report success having screened no live item at all.
   */
  let liveItems = 0;
  for (const item of items) {
    if (item.status === 'LIVE') liveItems += 1;
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const key = item.options.find((o) => o.isCorrect);

    // ABSENCE FAILS, IT DOES NOT READ AS EMPTY (David, 2026-08-13). Both reads below were
    // `.value ?? ''`. An option stored in the wrong envelope — a bare string, say — yields
    // undefined, became '', and the gate compared '' against the executed misconception and
    // found nothing to object to. That is how 340 mis-shaped options passed three gates.
    const keyValue = key ? optionValue(key.content) : null;
    const badValues = item.options.filter((o) => optionValue(o.content) === null).length;
    if (!key || keyValue === null || badValues > 0) {
      unreadable.push(
        `${item.id}: ${!key ? 'no key' : keyValue === null ? 'key has no readable value' : ''}` +
          `${badValues > 0 ? `${!key || keyValue === null ? '; ' : ''}${badValues} option(s) with no readable value` : ''}`,
      );
      continue;
    }
    const found = checkMathsItem({
      id: item.id,
      solution: item.solution,
      keyValue: keyValue!,
      operands: (stem.operands as Record<string, number | number[] | string>) ?? {},
      distractors: item.options
        .filter((o) => !o.isCorrect)
        .map((o) => ({ value: optionValue(o.content)!, misconceptionId: o.misconceptionId })),
    });
    for (const f of found) {
      if (f.severity === 'report') reports.push(f);
      else (item.status === 'LIVE' ? serving : draft).push(f);
    }
  }

  // R61: same fourth-register case as verify:solutions — correctly written, pointing at a
  // population no code path produces. Declared, with the reason printed on every empty run.
  declareMayBeEmpty(
    'Derivable maths distractor gate',
    `MATHS items (${liveItems} LIVE)`,
    items.length,
    'No code path creates a MATHS questionType, so no maths item has ever reached the database. ' +
      'This gate has never screened one. Remove this declaration the moment a maths item persists.',
  );

  if (unreadable.length > 0) {
    console.error(`\n${unreadable.length} item(s) could not be read — an option field is ABSENT:`);
    for (const u of unreadable) console.error(`  x ${u}`);
    console.error('Absence is not emptiness. These were skipped, not cleared.');
    process.exitCode = 1;
  }

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
  console.log(
    `\nAll ${liveItems} LIVE maths item(s) pass the derivable distractor gate.` +
      (liveItems === 0
        ? ' NO MATHS ITEM IS LIVE — this gate screened nothing, so it has asserted nothing.'
        : ''),
  );
  await prisma.$disconnect();
}

void main();
