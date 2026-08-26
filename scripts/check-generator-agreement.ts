/**
 * A GENERATED ARTEFACT DECLARES ITS GENERATOR, AND A CHECK ASSERTS THEY AGREE
 * (David's ruling on her 163rd §4, 2026-08-26 — R747).
 *
 * Six rows in the authoring store drifted from their generator with no record, and **nobody would
 * know but for an unrelated search**. Her consequence is the practical one: a generated bank that
 * no longer matches its generator has TWO SOURCES OF TRUTH AND NO WAY TO SAY WHICH IS
 * AUTHORITATIVE — an amendment landed only in the bank is erased by the next generation, and one
 * landed only in the generator never reaches the rows that serve.
 *
 * This asserts BOTH halves on the serving side:
 *   1. DECLARATION — every generated row names the generator that produced it.
 *   2. AGREEMENT — that generator, run now, reproduces the row's generated fields byte for byte.
 *
 * It calls `GENERATORS` — the generator's own exported registry — rather than re-deriving what it
 * would produce (R738). Drift is REPORTED as membership with the diff, never repaired: which side
 * is authoritative is a ruling, and an amendment may legitimately live in the row.
 */
import { BANK_OWNED_TYPES, GENERATORS } from '../packages/db/prisma/generate-content';
import { prisma } from '../packages/db/src/index';
import { assertFixture } from './lib/carried-fixture';

async function main() {
  assertFixture('check:generator-agreement', [
    { name: 'a changed prompt is detected', input: [{ prompt: 'a' }, { prompt: 'b' }] as const, mustBeCaught: true },
    { name: 'a changed nested word list is detected', input: [{ words: ['a', 'b'] }, { words: ['a', 'c'] }] as const, mustBeCaught: true },
    { name: 'key order alone is NOT drift', input: [{ a: 1, b: 2 }, { b: 2, a: 1 }] as const, mustBeCaught: false },
    { name: 'identical stems are not drift', input: [{ prompt: 'x' }, { prompt: 'x' }] as const, mustBeCaught: false },
  ], ([a, b]) => canonical(a) !== canonical(b));

  const rows = await prisma.item.findMany({
    where: { id: { startsWith: 'gen-' } },
    select: { id: true, questionTypeId: true, stem: true, sourcedFrom: true, status: true },
    orderBy: { id: 'asc' },
  });
  const undeclared = rows.filter((r) => !r.sourcedFrom || !r.sourcedFrom.includes('generate-content'));

  const drift: Array<Record<string, unknown>> = [];
  let compared = 0;
  const skipped: string[] = [];
  for (const [typeId, generate] of Object.entries(GENERATORS)) {
    // The generator's OWN skip set, imported (R748 follow-on): the write loop and this checker
    // read one authority. Inferring ownership from an id prefix would be a second definition.
    if (BANK_OWNED_TYPES.has(typeId)) { skipped.push(typeId); continue; }
    const stored = rows.filter((r) => r.questionTypeId === typeId);
    if (stored.length === 0) continue;
    let produced: Array<{ n: number; stem: unknown }>;
    try { produced = generate().map((g) => ({ n: g.n, stem: g.stem })); }
    catch (e) { drift.push({ questionType: typeId, kind: 'GENERATOR THREW', detail: String(e).slice(0, 120) }); continue; }
    const byN = new Map(produced.map((p) => [p.n, p.stem]));
    for (const s of stored) {
      const n = Number(/-(\d+)$/.exec(s.id)?.[1] ?? NaN);
      const expected = byN.get(n);
      if (expected === undefined) continue;
      compared++;
      if (canonical(expected) !== canonical(s.stem)) {
        drift.push({ id: s.id, status: s.status, questionType: typeId, generatorProduces: expected, rowHolds: s.stem });
      }
    }
  }

  console.log(`\ncheck:generator-agreement — ${rows.length} generated rows · ${compared} compared against their generator`);
  console.log(`  DECLARATION: ${rows.length - undeclared.length} of ${rows.length} declare a generator`);
  if (undeclared.length) {
    console.log(`  ${undeclared.length} row(s) carry NO generator declaration — a generated row that cannot name its generator has no second source to be checked against.`);
    console.log(`    first: ${undeclared.slice(0, 5).map((u) => u.id).join(', ')}`);
  }
  console.log(`  BANK-OWNED, generator skipped (its own set): ${skipped.join(', ') || 'none'}`);
  console.log(`  AGREEMENT: ${drift.length} row(s) differ from what their generator produces now`);
  for (const d of drift.slice(0, 8)) console.log(`    ✗ ${d.id ?? d.questionType} — ${d.kind ?? 'stem differs from the generator output'}`);
  console.log('\n  Reported, never repaired: which side is authoritative is a ruling, and an amendment may legitimately live in the row (R747).');
  await prisma.$disconnect();
}

function canonical(o: unknown): string {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
  return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
}

main().catch((e) => { console.error(e); process.exit(1); });
