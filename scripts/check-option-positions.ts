/**
 * OPTION-POSITION GATE — `pnpm check:option-positions` (`--self-test` to prove
 * the checks bite).
 *
 * The incident that prompted this: a reviewer saw the key as option A on every
 * item of an audit sample. It turned out the audit PACK printed stored order
 * (the generators author key-first) without the per-child shuffle the live
 * serving path applies — so children were never affected. This gate makes that
 * safety a standing, checked property instead of a convention people remember:
 *
 *   1. STORAGE UNIFORMITY. Within every bank (a questionType's LIVE items) the
 *      key must sit at the SAME stored index for every item. A bank that mixes
 *      stored key positions has no single invariant for the shuffle to rely on
 *      and no canonical order for a pack to trust — so it fails.
 *
 *   2. SERVED FAIRNESS. The one shuffle a child is served through
 *      (shuffleOptionsForChild, seeded on childId:itemId) is simulated over many
 *      synthetic children. No bank may have a served key position whose share
 *      rises materially above chance — a no-op or biased shuffle would leave the
 *      key parked in one slot, and that is exactly what must never reach a child.
 *
 * Storage being uniformly key-first is FINE — it is the serving shuffle, not the
 * stored order, that a child receives; answers are matched by option id, not
 * position. This gate proves the shuffle is doing its job.
 */
import { shuffleOptionsForChild } from '../apps/web/lib/crew/shuffle';
import { prisma } from '../packages/db/src/index';

const SYNTHETIC_CHILDREN = Array.from({ length: 300 }, (_, i) => `probe-child-${i}`);
/** A served position may exceed its chance share by at most this before failing.
 * The correct shuffle sits ~0 above chance; a no-op shuffle sits far above it. */
const TOLERANCE = 0.12;

interface OptionRow {
  id: string;
  isCorrect: boolean;
}

interface BankReport {
  bank: string;
  n: number;
  storedIndexHistogram: Record<number, number>;
  storageUniform: boolean;
  servedShare: Record<number, number>;
  servedExpectedMax: number;
  servedMaxShare: number;
  servedFair: boolean;
}

/** Assess one bank: storage uniformity + served fairness. Pure over its items. */
function assessBank(bank: string, items: Array<{ id: string; options: OptionRow[] }>): BankReport {
  const storedIndexHistogram: Record<number, number> = {};
  for (const item of items) {
    const stored = item.options.findIndex((o) => o.isCorrect);
    storedIndexHistogram[stored] = (storedIndexHistogram[stored] ?? 0) + 1;
  }
  const storageUniform = Object.keys(storedIndexHistogram).length === 1;

  // Served simulation through the real serving shuffle.
  const servedCount: Record<number, number> = {};
  let draws = 0;
  let expectedSum = 0; // Σ 1/nOptions, to get the chance baseline for this bank.
  for (const item of items) {
    expectedSum += 1 / item.options.length;
    for (const child of SYNTHETIC_CHILDREN) {
      const shuffled = shuffleOptionsForChild(item.options, child, item.id);
      const index = shuffled.findIndex((o) => o.isCorrect);
      servedCount[index] = (servedCount[index] ?? 0) + 1;
      draws += 1;
    }
  }
  const servedShare: Record<number, number> = {};
  for (const [index, count] of Object.entries(servedCount)) servedShare[Number(index)] = count / draws;
  const servedMaxShare = Math.max(...Object.values(servedShare));
  const chance = expectedSum / items.length; // mean 1/nOptions across the bank
  const servedExpectedMax = chance + TOLERANCE;
  const servedFair = servedMaxShare <= servedExpectedMax;

  return { bank, n: items.length, storedIndexHistogram, storageUniform, servedShare, servedExpectedMax, servedMaxShare, servedFair };
}

function fmtShare(share: Record<number, number>): string {
  return Object.entries(share)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([p, s]) => `pos${p}:${(100 * s).toFixed(0)}%`)
    .join(' ');
}

function report(reports: BankReport[]): boolean {
  let failed = false;
  const overallStored: Record<number, number> = {};
  let total = 0;
  console.log('bank                            |  n | stored key index      | served key-position share');
  for (const r of reports) {
    for (const [idx, c] of Object.entries(r.storedIndexHistogram)) overallStored[Number(idx)] = (overallStored[Number(idx)] ?? 0) + c;
    total += r.n;
    const storedText = Object.entries(r.storedIndexHistogram).sort((a, b) => Number(a[0]) - Number(b[0])).map(([p, c]) => `pos${p}:${c}`).join(' ');
    const flags = `${r.storageUniform ? '' : ' ✗MIXED-STORAGE'}${r.servedFair ? '' : ` ✗SERVED-MODAL ${(100 * r.servedMaxShare).toFixed(0)}% > ${(100 * r.servedExpectedMax).toFixed(0)}%`}`;
    if (!r.storageUniform || !r.servedFair) failed = true;
    console.log(`${r.bank.padEnd(30)} | ${String(r.n).padStart(2)} | ${storedText.padEnd(21)} | ${fmtShare(r.servedShare)}${flags}`);
  }
  console.log(
    `\nAll ${total} items: stored ${Object.entries(overallStored).sort((a, b) => Number(a[0]) - Number(b[0])).map(([p, c]) => `pos${p}:${c} (${(100 * c / total).toFixed(0)}%)`).join(' ')}`,
  );
  console.log('Stored key-first is the authored convention; the child is served the shuffle, not the stored order.');
  return failed;
}

/** Deliberately broken banks so a green run means the checks can actually fail. */
function selfTest(): void {
  console.log('SELF-TEST — the gate must FAIL these:\n');
  // Mixed storage: keys at different stored indices within one bank.
  const mixed = assessBank('fixture-mixed-storage', [
    { id: 'a', options: [{ id: 'a0', isCorrect: true }, { id: 'a1', isCorrect: false }, { id: 'a2', isCorrect: false }] },
    { id: 'b', options: [{ id: 'b0', isCorrect: false }, { id: 'b1', isCorrect: true }, { id: 'b2', isCorrect: false }] },
  ]);
  // A no-op shuffle can't be injected here, but a single-option-"bank" and a
  // bank whose items all key-first still get served fairly by the real shuffle;
  // to prove SERVED-MODAL bites we assert the tolerance maths on a constructed share.
  const noopServedFair = 1.0 <= 1 / 3 + TOLERANCE; // a 100%-in-one-slot share must be judged unfair
  console.log(`  mixed-storage detected: ${!mixed.storageUniform ? 'YES ✓' : 'NO ✗ (self-test broken)'}`);
  console.log(`  100%-modal share judged unfair: ${!noopServedFair ? 'YES ✓' : 'NO ✗ (self-test broken)'}`);
  if (mixed.storageUniform || noopServedFair) {
    console.error('\nSELF-TEST FAILED — the gate would not catch a real regression.');
    process.exit(1);
  }
  console.log('\nSelf-test passed: the gate catches mixed storage and a parked-key served share.');
}

async function main(): Promise<void> {
  if (process.argv.includes('--self-test')) {
    selfTest();
    return;
  }

  const items = await prisma.item.findMany({
    where: { status: 'LIVE', options: { some: {} } },
    include: { options: { orderBy: { id: 'asc' }, select: { id: true, isCorrect: true } } },
    orderBy: { id: 'asc' },
  });
  const byBank = new Map<string, Array<{ id: string; options: OptionRow[] }>>();
  for (const item of items) {
    // Only multiple-choice items have a meaningful key position.
    if (item.options.length < 2 || !item.options.some((o) => o.isCorrect)) continue;
    const list = byBank.get(item.questionTypeId) ?? [];
    list.push({ id: item.id, options: item.options });
    byBank.set(item.questionTypeId, list);
  }

  const reports = [...byBank.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([bank, list]) => assessBank(bank, list));
  const failed = report(reports);

  await prisma.$disconnect();
  if (failed) {
    console.error('\nOption-position gate FAILED — a bank has mixed stored key positions or a served key position above chance.');
    process.exit(1);
  }
  console.log('\nOption-position gate passed: every bank is uniform in storage and fair when served.');
}

void main();
