/**
 * DOES EVERY GENERATED VR ITEM STILL COME OUT OF THE GENERATOR THAT MADE IT? — `pnpm check:vr-rederive`
 *
 * VR generators take NO SEED. `GENERATORS[typeId]()` enumerates, `item.n` is the ordinal, and the id
 * is `gen-${typeId}-${n}` — so the complete derivation input is `(typeId, n)` and **both are already
 * in the primary key**. There is nothing to record and nothing to back-fill; the record is the id.
 * (R142 corrects R133, which carried NVR's seeded model across a district boundary where it does not
 * hold.)
 *
 * WHAT IT CATCHES: a generator changing AT ALL. Because the enumeration is stable rather than seeded,
 * this is stronger than a check built on a recorded seed — it does not need a baseline to have been
 * captured first, so it works retroactively over every row already in the store.
 *
 * WHAT IT CANNOT SEE, AND THE POPULATION THAT CONDITION COVERS — printed on every run, because a
 * limit stated once in a docstring is a limit nobody has at the moment they read the number:
 *
 *   A row REVIEWED and protected by `classifyDerivedWrites` keeps its stored values legitimately
 *   while the generator moves on. For those rows a divergence is EXPECTED and correct — the guard
 *   did its job — and this check cannot tell that apart from a generator that changed under an
 *   unprotected row. It reports the two separately and never merges them.
 *
 * THE COMPARISON IS CANONICAL, AND THAT IS LOAD-BEARING. The first version of this comparison used
 * `JSON.stringify` and reported 464 of 514 diverging — a fabricated 90% rate, produced entirely by
 * JSONB not preserving key order (R142). Sorting keys before comparing is the difference between
 * this check and a machine for manufacturing consent to a schema change.
 */
import { prisma } from '../packages/db/src/index';
import { GENERATORS } from '../packages/db/prisma/generate-content';
import { requirePopulation } from './lib/population';

/** Sort every object key, depth-first. JSONB does not preserve order; a raw compare is false drift. */
const canon = (o: unknown): unknown =>
  Array.isArray(o) ? o.map(canon)
    : o && typeof o === 'object'
      ? Object.fromEntries(Object.keys(o as object).sort().map((k) => [k, canon((o as Record<string, unknown>)[k])]))
      : o;
const same = (a: unknown, b: unknown): boolean => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

async function main(): Promise<void> {
  const stored = await prisma.item.findMany({
    where: { id: { startsWith: 'gen-vr-' } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  requirePopulation('check:vr-rederive', { 'generated VR items': stored.length });

  // THE PROTECTED POPULATION, measured rather than assumed. `classifyDerivedWrites` treats a row as
  // reviewed if it is LIVE, RETIRED, or carries any attribution event — the same three conditions,
  // read here so the limit below is a number and not a caveat.
  const attributed = new Set((await prisma.attributionEvent.findMany({
    where: { recordType: 'item', recordId: { in: stored.map((i) => i.id) } },
    select: { recordId: true },
  })).map((e) => e.recordId));
  const isProtected = (i: { id: string; status: string }): boolean =>
    i.status === 'LIVE' || i.status === 'RETIRED' || attributed.has(i.id);

  const diverged: Array<{ id: string; status: string; what: string; guarded: boolean }> = [];
  let matched = 0;
  let noGenerator = 0;

  const byType = new Map<string, typeof stored>();
  for (const item of stored) {
    const list = byType.get(item.questionTypeId) ?? [];
    list.push(item);
    byType.set(item.questionTypeId, list);
  }

  for (const [typeId, rows] of byType) {
    const generate = (GENERATORS as Record<string, undefined | (() => Array<{ n: number; stem: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }>)>)[typeId];
    if (!generate) { noGenerator += rows.length; continue; }
    const produced = new Map<string, { stem: unknown; options: Array<{ content: unknown; isCorrect: boolean }> }>();
    for (const it of generate()) produced.set(`gen-${typeId}-${String(it.n).padStart(2, '0')}`, it);

    for (const row of rows) {
      const p = produced.get(row.id);
      // AN ID THE GENERATOR NO LONGER PRODUCES IS ITSELF A CHANGE — the enumeration shortened.
      if (!p) {
        diverged.push({ id: row.id, status: row.status, what: 'generator no longer produces this id', guarded: isProtected(row) });
        continue;
      }
      const storedOpts = row.options.map((o) => ({ v: (o.content as { value?: unknown })?.value, c: o.isCorrect }));
      const madeOpts = (p.options ?? []).map((o) => ({ v: (o.content as { value?: unknown })?.value ?? o.content, c: o.isCorrect }));
      const stemOk = same(p.stem, row.stem);
      const optsOk = same(madeOpts, storedOpts);
      if (stemOk && optsOk) { matched += 1; continue; }
      diverged.push({
        id: row.id, status: row.status, guarded: isProtected(row),
        what: !stemOk && !optsOk ? 'stem and options' : !stemOk ? 'stem' : 'options',
      });
    }
  }

  const guarded = diverged.filter((d) => d.guarded);
  const unguarded = diverged.filter((d) => !d.guarded);
  const protectedCount = stored.filter(isProtected).length;

  console.log(`check:vr-rederive: ${stored.length} generated VR item(s) re-derived from today's generators.\n`);
  console.log(`  ${matched} reproduce IDENTICALLY (canonical compare — key order is not drift)`);
  console.log(`  ${unguarded.length} diverge on an UNPROTECTED row — the generator changed`);
  console.log(`  ${guarded.length} diverge on a REVIEWED row — expected, the guard held the old values`);
  if (noGenerator) console.log(`  ${noGenerator} have no generator for their question type`);

  for (const d of unguarded) console.log(`    x ${d.id} [${d.status}] — ${d.what}`);
  for (const d of guarded) console.log(`    · ${d.id} [${d.status}] — ${d.what} (reviewed; divergence is correct)`);

  console.log(`\n  WHAT THIS CANNOT SEE: a generator change that PREDATES a reviewed row.`);
  console.log(`  ${protectedCount} of ${stored.length} rows are protected by classifyDerivedWrites`);
  console.log('  (LIVE, RETIRED, or carrying an attribution event). Those keep their stored values');
  console.log('  legitimately, so a divergence on them is the guard working and NOT a finding — and');
  console.log('  a change that happened before they were protected is indistinguishable from one that');
  console.log('  happened after. The two classes are counted apart above and never merged.');

  console.log('\n  There is no seed to record: VR generators enumerate, and (typeId, n) is the id.');
  await prisma.$disconnect();
  process.exit(unguarded.length === 0 ? 0 : 1);
}

void main();
