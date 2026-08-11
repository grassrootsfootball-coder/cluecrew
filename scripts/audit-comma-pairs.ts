/**
 * COMMA MIRRORED-PAIR CARDINALITY AUDIT — `pnpm audit:comma-pairs`
 *
 * R51's independently-buildable half. `pairId` marks the district's one sanctioned repeated
 * sentence — a clause fronted (rung 0, keyed) and the same clause trailing (rung 1, keyed N) — and
 * the whole point of the constraint is that BOTH halves exist and ONLY both halves share a value.
 * An orphan (one member) means a sentence declares a repetition that was never written; a triple+
 * means two clauses are being treated as interchangeable when the pairing is supposed to be exact.
 * Either is a bank error, not a serving one — R51 named this explicitly as NOT the same mechanism
 * as R50's technique-key exclusion, because the technique registry is deliberately open-ended while
 * a mirrored pair is deliberately bounded to exactly two.
 *
 * Runs directly against `COMMA_BANK`, the same shape as `export-param-sweep.ts` running against
 * generator functions rather than the database: no persistence path exists for comma-family output
 * (R51 confirmed zero comma items in `Item`), so this needs none either. It protects the BANK — the
 * authored source — regardless of whether generated content ever reaches a child.
 */
import { COMMA_BANK } from '../packages/core/src/english/spag-families';

function main(): void {
  const byPair = new Map<string, string[]>();
  for (const sentence of COMMA_BANK) {
    if (!sentence.pairId) continue;
    (byPair.get(sentence.pairId) ?? byPair.set(sentence.pairId, []).get(sentence.pairId)!).push(sentence.id);
  }

  const orphans = [...byPair].filter(([, ids]) => ids.length === 1);
  const overfull = [...byPair].filter(([, ids]) => ids.length > 2);
  const clean = [...byPair].filter(([, ids]) => ids.length === 2);

  console.log(`${COMMA_BANK.length} sentences · ${byPair.size} declared pairId(s)`);
  console.log(`${clean.length} clean (exactly 2 members)`);
  for (const [pairId, ids] of clean) console.log(`  ${pairId}: ${ids.join(', ')}`);

  if (orphans.length) {
    console.log(`\n${orphans.length} ORPHAN pairId(s) — declares a repetition with no other half:`);
    for (const [pairId, ids] of orphans) console.log(`  ✗ ${pairId}: ${ids.join(', ')} (1 member)`);
  }
  if (overfull.length) {
    console.log(`\n${overfull.length} OVERFULL pairId(s) — more than two clauses sharing one value:`);
    for (const [pairId, ids] of overfull) console.log(`  ✗ ${pairId}: ${ids.join(', ')} (${ids.length} members)`);
  }

  // Both halves of a pair must straddle rungs (fronted rung 0 / trailing rung 1) — the design
  // reason the repetition is permitted at all (R13): the pair teaches the fronted-vs-trailing
  // contrast, which only holds if the two halves are actually at different rungs, not the same one.
  const commaRung = (s: (typeof COMMA_BANK)[number]) => s.parts.filter((p) => p[1] === 'O').length;
  const wrongRungs: string[] = [];
  for (const [pairId, ids] of clean) {
    const rungs = ids.map((id) => commaRung(COMMA_BANK.find((s) => s.id === id)!));
    if (new Set(rungs).size !== 2) wrongRungs.push(`${pairId}: both halves at rung ${rungs[0]} (${ids.join(', ')})`);
  }
  if (wrongRungs.length) {
    console.log(`\n${wrongRungs.length} pair(s) that do NOT straddle rungs — the fronted/trailing contrast fails:`);
    for (const row of wrongRungs) console.log(`  ✗ ${row}`);
  }

  const failing = orphans.length + overfull.length + wrongRungs.length;
  console.log(`\n${failing === 0 ? 'CLEAN' : 'FAILING'}: ${failing} malformed pair(s) of ${byPair.size} declared.`);
  if (failing > 0) process.exit(1);
}

main();
