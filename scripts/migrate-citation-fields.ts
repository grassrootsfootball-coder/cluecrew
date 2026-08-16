/**
 * THE THREE RULED CITATION MIGRATIONS — `pnpm migrate:citations [--write]`
 *
 * All three are the same finding wearing different clothes: one fact held under two names, or at
 * two levels, with nothing deciding which wins. Each was ruled separately and they are applied
 * together because they touch the same rows and a half-migrated store is worse than either state.
 *
 *   1. `explanation.quotes[].atLines` → `explanation.quotes[].lineRefs`. A NAME collision; lineRefs
 *      wins. Same shape, same values, different key.
 *   2. `stem.testedTokens` → `Item.testedTokens`. A LEVEL collision with the item-level field of
 *      the same name; item level wins. This one had already reported the winner as present while
 *      it held nothing, because the manifest probe searched the stem as a fallback.
 *   3. `stem.lineRefs` → `Item.lineRefs`. A LEVEL difference against Cowork, which holds it at item
 *      level. Item level wins.
 *
 * IT REFUSES RATHER THAN MERGES. If both the source and the destination hold a value and they
 * disagree, that is two different claims about the same fact and no script should pick one. The
 * source is removed only after the destination is confirmed to hold the same value.
 *
 * ABSENCE STAYS ABSENT. An item with no lineRefs gets null, never `[]` — "declares no lines" and
 * "cites nothing" are different, which is why the destination columns are Json? rather than a
 * Prisma scalar list that cannot be null.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const DAVID = 'human:david@cluecrew.test';

const canonical = (v: unknown): string => {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === 'object') {
      return Object.fromEntries(Object.keys(x as object).sort().map((k) => [k, walk((x as Record<string, unknown>)[k])]));
    }
    return x;
  };
  return JSON.stringify(walk(v));
};

interface Plan {
  id: string;
  stem: Record<string, unknown>;
  explanation: Record<string, unknown>;
  itemLineRefs?: unknown;
  itemTestedTokens?: unknown;
  applied: string[];
}

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    select: { id: true, stem: true, explanation: true, lineRefs: true, testedTokens: true },
    orderBy: { id: 'asc' },
  });
  requirePopulation('migrate:citations', { 'ENG items': items.length });

  const plans: Plan[] = [];
  const conflicts: string[] = [];

  for (const it of items) {
    const stem = { ...((it.stem ?? {}) as Record<string, unknown>) };
    const explanation = { ...((it.explanation ?? {}) as Record<string, unknown>) };
    const plan: Plan = { id: it.id, stem, explanation, applied: [] };

    // 1. atLines -> lineRefs, inside each explanation quote.
    const quotes = explanation.quotes;
    if (Array.isArray(quotes)) {
      let touched = false;
      explanation.quotes = quotes.map((q) => {
        if (!q || typeof q !== 'object' || !('atLines' in q)) return q;
        const { atLines, ...rest } = q as Record<string, unknown>;
        if ('lineRefs' in rest && canonical(rest.lineRefs) !== canonical(atLines)) {
          conflicts.push(`${it.id}: explanation quote holds atLines ${canonical(atLines)} and lineRefs ${canonical(rest.lineRefs)}`);
          return q;
        }
        touched = true;
        return { ...rest, lineRefs: atLines };
      });
      if (touched) plan.applied.push('atLines->lineRefs');
    }

    // 2. stem.testedTokens -> Item.testedTokens
    if (stem.testedTokens !== undefined && stem.testedTokens !== null) {
      if (it.testedTokens !== null && canonical(it.testedTokens) !== canonical(stem.testedTokens)) {
        conflicts.push(`${it.id}: stem.testedTokens ${canonical(stem.testedTokens)} vs item ${canonical(it.testedTokens)}`);
      } else {
        plan.itemTestedTokens = stem.testedTokens;
        delete stem.testedTokens;
        plan.applied.push('testedTokens->item');
      }
    }

    // 3. stem.lineRefs -> Item.lineRefs
    if (stem.lineRefs !== undefined && stem.lineRefs !== null) {
      if (it.lineRefs !== null && canonical(it.lineRefs) !== canonical(stem.lineRefs)) {
        conflicts.push(`${it.id}: stem.lineRefs ${canonical(stem.lineRefs)} vs item ${canonical(it.lineRefs)}`);
      } else {
        plan.itemLineRefs = stem.lineRefs;
        delete stem.lineRefs;
        plan.applied.push('lineRefs->item');
      }
    }

    if (plan.applied.length) plans.push(plan);
  }

  const count = (k: string) => plans.filter((p) => p.applied.includes(k)).length;
  console.log(`${items.length} ENG items screened.`);
  console.log(`  atLines -> lineRefs (explanation quotes): ${count('atLines->lineRefs')}`);
  console.log(`  stem.testedTokens -> Item.testedTokens:   ${count('testedTokens->item')}`);
  console.log(`  stem.lineRefs -> Item.lineRefs:           ${count('lineRefs->item')}`);
  console.log(`  items to touch: ${plans.length}`);

  if (conflicts.length > 0) {
    console.error(`\nREFUSED — ${conflicts.length} row(s) hold BOTH names/levels with different values:`);
    for (const c of conflicts) console.error(`  x ${c}`);
    console.error('Two claims about one fact. A migration has no standing to choose. Nothing written.');
    await prisma.$disconnect();
    process.exit(1);
  }
  if (plans.length === 0) {
    console.log('\nNothing to migrate: no ENG item holds a source field. The three are already applied.');
    await prisma.$disconnect();
    return;
  }
  if (!write) {
    console.log('\nDry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(plans.map((p) => prisma.item.update({
    where: { id: p.id },
    data: {
      stem: p.stem as object,
      explanation: p.explanation as object,
      // Only set what this plan moved. `?? undefined` leaves the column untouched rather than
      // writing null over a value the migration did not source.
      ...(p.itemLineRefs !== undefined ? { lineRefs: p.itemLineRefs as object } : {}),
      ...(p.itemTestedTokens !== undefined ? { testedTokens: p.itemTestedTokens as object } : {}),
    },
  })));
  for (const p of plans) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: p.id, action: 'AMENDED',
        actor: DAVID, recordedBy: DAVID, field: p.applied.join(', '),
        method: 'Ruled citation migrations, 2026-08-16',
        note:
          `Moved ${p.applied.join(', ')}. One fact was held under two names or at two levels; the ` +
          'ruled winner now holds it and the loser is removed. No value changed and no ' +
          'child-facing text moved — only where the value lives.',
      },
    });
  }

  // VERIFY BY RE-READING THE ROWS ACTED ON. The destination holds the value AND the source is gone;
  // either alone would leave the duplication this exists to end.
  const after = await prisma.item.findMany({
    where: { id: { in: plans.map((p) => p.id) } },
    select: { id: true, stem: true, explanation: true, lineRefs: true, testedTokens: true },
  });
  const byId = new Map(plans.map((p) => [p.id, p]));
  let ok = 0;
  const failed: string[] = [];
  for (const r of after) {
    const p = byId.get(r.id)!;
    const stem = (r.stem ?? {}) as Record<string, unknown>;
    const exp = (r.explanation ?? {}) as Record<string, unknown>;
    const noAtLines = !Array.isArray(exp.quotes) || !exp.quotes.some((q) => q && typeof q === 'object' && 'atLines' in q);
    const lrOk = p.itemLineRefs === undefined
      || (stem.lineRefs === undefined && canonical(r.lineRefs) === canonical(p.itemLineRefs));
    const ttOk = p.itemTestedTokens === undefined
      || (stem.testedTokens === undefined && canonical(r.testedTokens) === canonical(p.itemTestedTokens));
    if (noAtLines && lrOk && ttOk) ok += 1;
    else failed.push(`${r.id}: atLines gone=${noAtLines} lineRefs=${lrOk} testedTokens=${ttOk}`);
  }
  console.log(`\nVERIFIED by re-reading all ${after.length} migrated rows:`);
  console.log(`  destination holds the value AND the source is gone: ${ok} of ${after.length}`);
  for (const f of failed) console.error(`  x ${f}`);
  await prisma.$disconnect();
}

void main();
