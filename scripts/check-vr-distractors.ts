/**
 * THE DERIVABLE VR DISTRACTOR GATE — `pnpm check:vr-distractors`
 * (`--self-test` proves the checks bite).
 *
 * The reviewer audit found VR distractors tagged by fixed option slot: a numeric
 * near-miss (answer ± 1) wearing a named misconception it does not model. This
 * gate is the analogue of the maths distractor gate (§5): every wrong option
 * whose tag is EXECUTABLE must carry the value that misconception produces on the
 * item's operands. It is the check that would have caught all of this without a
 * teacher reading fifty items.
 *
 * Policy, identical to the maths gate:
 *   · a DEFECT on a SERVING (LIVE) item FAILS the build;
 *   · a DEFECT on a DRAFT item is reported as backlog (the publish door stops it);
 *   · a semantic tag (closest meaning, a topic associate) has no executor and is
 *     silently review-only;
 *   · an item with executable tags but no `stem.operands` is UNCOVERED — reported
 *     so it is visible, never failed (legacy / seed-authored items).
 */
import { checkVrDistractors, type VrGatableItem, type VrOperands } from '@cluecrew/core';
import { prisma } from '../packages/db/src/index';

function selfTest(): void {
  console.log('SELF-TEST — the gate must FLAG these:\n');
  const operands: VrOperands = { kind: 'letter-series', first: 0, step: 2, answer: 8 }; // A C E G → I
  // "L" tagged off-by-one is a lie: off-by-one produces J or H (I±1), never L.
  const bad: VrGatableItem = {
    id: 'fixture-bad',
    operands,
    options: [
      { value: 'I', isCorrect: true, misconceptionId: null },
      { value: 'L', isCorrect: false, misconceptionId: 'vr-letter-series-off-by-one' },
    ],
  };
  // A distractor whose tag cannot arise (operation-slip with no subtraction).
  const notDerivable: VrGatableItem = {
    id: 'fixture-notderivable',
    operands: { kind: 'code', values: { P: 2, Q: 3 }, expr: 'P + Q' },
    options: [
      { value: 5, isCorrect: true, misconceptionId: null },
      { value: 7, isCorrect: false, misconceptionId: 'vr07-operation-slip' },
    ],
  };
  const good: VrGatableItem = {
    id: 'fixture-good',
    operands,
    options: [
      { value: 'I', isCorrect: true, misconceptionId: null },
      { value: 'H', isCorrect: false, misconceptionId: 'vr-letter-series-off-by-one' }, // I−1 ✓
    ],
  };
  const badF = checkVrDistractors(bad).filter((f) => f.severity === 'defect');
  const ndF = checkVrDistractors(notDerivable).filter((f) => f.severity === 'defect');
  const goodF = checkVrDistractors(good).filter((f) => f.severity === 'defect');
  console.log(`  value-not-produced caught: ${badF.length ? 'YES ✓' : 'NO ✗'} — ${badF[0]?.detail ?? ''}`);
  console.log(`  not-derivable caught:      ${ndF.length ? 'YES ✓' : 'NO ✗'} — ${ndF[0]?.detail ?? ''}`);
  console.log(`  correct item passes:       ${goodF.length === 0 ? 'YES ✓' : 'NO ✗'}`);
  if (!badF.length || !ndF.length || goodF.length) {
    console.error('\nSELF-TEST FAILED — the gate would not catch a real regression.');
    process.exit(1);
  }
  console.log('\nSelf-test passed: the gate catches a mistagged value and a tag that cannot arise.');
}

async function main(): Promise<void> {
  if (process.argv.includes('--self-test')) {
    selfTest();
    return;
  }

  const items = await prisma.item.findMany({
    where: { questionType: { district: 'VR' } },
    include: { options: { orderBy: { id: 'asc' } }, questionType: true },
    orderBy: { id: 'asc' },
  });

  const servingDefects: string[] = [];
  const draftDefects: string[] = [];
  const uncovered: string[] = [];
  let verified = 0;

  for (const item of items) {
    const operands = (item.stem as { operands?: VrOperands } | null)?.operands;
    const gatable: VrGatableItem = {
      id: item.id,
      operands,
      options: item.options.map((o) => ({
        value: (o.content as { value?: unknown }).value,
        isCorrect: o.isCorrect,
        misconceptionId: o.misconceptionId,
      })),
    };
    const failures = checkVrDistractors(gatable);
    if (failures.length === 0) {
      if (operands) verified += 1;
      continue;
    }
    for (const f of failures) {
      if (f.rule === 'uncovered') uncovered.push(f.where);
      else if (item.status === 'LIVE') servingDefects.push(`  ✗ ${f.where}: ${f.detail}`);
      else draftDefects.push(`  · ${f.where}: ${f.detail}`);
    }
    if (!failures.some((f) => f.rule === 'uncovered') && operands) verified += 1;
  }

  console.log(`VR distractor gate: ${items.length} items screened · ${verified} derivation-verified · ${uncovered.length} uncovered (no operands).`);
  if (uncovered.length) {
    console.log(`\nUncovered (legacy/seed items, executable tags but no operands) — not failed:`);
    for (const u of uncovered.slice(0, 12)) console.log(`  · ${u}`);
    if (uncovered.length > 12) console.log(`  … and ${uncovered.length - 12} more`);
  }
  if (draftDefects.length) {
    console.log(`\nDRAFT backlog (not serving, not blocking): ${draftDefects.length}`);
    for (const d of draftDefects.slice(0, 12)) console.log(d);
    if (draftDefects.length > 12) console.log(`  … and ${draftDefects.length - 12} more`);
  }
  if (servingDefects.length) {
    console.error(`\nSERVING distractors FAILED derivation (${servingDefects.length}):`);
    for (const d of servingDefects) console.error(d);
    console.error('\nA LIVE distractor is not what its tag produces. Fix the generator or take it out of service.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('\nEvery serving VR distractor is what its misconception produces.');
  await prisma.$disconnect();
}

void main();
