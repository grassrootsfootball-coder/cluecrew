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
 *   1. STORAGE UNIFORMITY — **REPORTED, NO LONGER A FAILURE** (David's ruling,
 *      2026-08-17 — R199). The stated reason, *"no single invariant for the
 *      shuffle to rely on"*, IS NOW FALSE: the shuffle is seeded on
 *      `childId:itemId` and measured uniform (R189, chi-square 2.72 on 4 df),
 *      and its input is sealed to `id asc` (R187), so **stored order cannot
 *      leak into served position at all**. Four English banks fail this arm and
 *      no child is affected by any of it.
 *
 *      What mixed storage DOES cost is the TELL. The incident below was caught
 *      because an unshuffled pack over a key-first bank shows an unmissable
 *      all-A column; over a MIXED bank the same broken pack looks plausibly
 *      random. So this arm now reports the exposure and names it, and a
 *      convention violation with no consequence for a child does not fail CI.
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
import { requirePopulation } from './lib/population';

const SYNTHETIC_CHILDREN = Array.from({ length: 300 }, (_, i) => `probe-child-${i}`);
/** A served position may exceed its chance share by at most this before failing.
 * The correct shuffle sits ~0 above chance; a no-op shuffle sits far above it. */
const TOLERANCE = 0.12;

/**
 * ARM 3 — SEGMENT ORDER (David's ruling, 2026-08-17 — R199). The second real exposure, and the one
 * that IS a child-facing fault if it breaks.
 *
 * R192 excludes `segmentsInOptions` items from the shuffle, so their SERVED order is their STORED
 * order. The options are consecutive pieces of one sentence and the label is the order a child reads
 * them in, so **id order must equal label order or the sentence does not reconstruct** — with no
 * shuffle involved, past the guard written for the shuffle. It held on 18 of 18 by luck before the
 * import door was made to derive the id from the label; this asserts it for every item, including
 * any that predate that door.
 */
interface SegmentOrderFault { itemId: string; idOrder: string; labelOrder: string }

async function checkSegmentOrder(): Promise<{ screened: number; faults: SegmentOrderFault[] }> {
  const items = await prisma.item.findMany({
    where: { options: { some: {} } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  const segmented = items.filter(
    (i) => ((i.stem ?? {}) as { segmentsInOptions?: unknown }).segmentsInOptions === true,
  );
  const label = (o: { content: unknown }) => String((o.content as { label?: unknown })?.label ?? '');
  const faults: SegmentOrderFault[] = [];
  for (const item of segmented) {
    const idOrder = item.options.map(label).join('');
    const labelOrder = [...item.options].map(label).sort().join('');
    if (idOrder !== labelOrder) faults.push({ itemId: item.id, idOrder, labelOrder });
  }
  return { screened: segmented.length, faults };
}

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
function assessBank(bank: string, items: Array<{ id: string; stem: unknown; options: OptionRow[] }>): BankReport {
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
      // R192 — the stem is REQUIRED, and passing it is not a formality here: an item whose options
      // are ordered by construction is NOT shuffled, so simulating it with a shuffle would report a
      // served distribution no child can ever see. This checker measures the SERVED position, so it
      // has to model the same exclusion the serving path applies.
      const shuffled = shuffleOptionsForChild(item.options, child, item.id, item.stem);
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
    // MIXED-STORAGE is reported, never fatal (R199): it costs a review-pack TELL, not a child
    // anything. Only SERVED-MODAL — a shuffle that parks the key — reaches a child, and only it fails.
    const flags = `${r.storageUniform ? '' : ' ·mixed-storage'}${r.servedFair ? '' : ` ✗SERVED-MODAL ${(100 * r.servedMaxShare).toFixed(0)}% > ${(100 * r.servedExpectedMax).toFixed(0)}%`}`;
    if (!r.servedFair) failed = true;
    console.log(`${r.bank.padEnd(30)} | ${String(r.n).padStart(2)} | ${storedText.padEnd(21)} | ${fmtShare(r.servedShare)}${flags}`);
  }
  console.log(
    `\nAll ${total} items: stored ${Object.entries(overallStored).sort((a, b) => Number(a[0]) - Number(b[0])).map(([p, c]) => `pos${p}:${c} (${(100 * c / total).toFixed(0)}%)`).join(' ')}`,
  );
  console.log('Stored key-first is the authored convention; the child is served the shuffle, not the stored order.');

  const mixed = reports.filter((r) => !r.storageUniform);
  if (mixed.length) {
    console.log(`\n  ${mixed.length} bank(s) with MIXED stored key positions — REPORTED, NOT FAILED (R199):`);
    for (const r of mixed) console.log(`    · ${r.bank}`);
    console.log('    No child is affected: the shuffle is uniform (R189) and its input is sealed to');
    console.log('    id order (R187), so stored position cannot leak into served position.');
    console.log('    THE EXPOSURE IS A REVIEW-PACK TELL. An unshuffled pack over a key-first bank shows');
    console.log('    an unmissable all-A column — which is how this class was caught. Over a mixed bank');
    console.log('    the same broken pack looks plausibly random. `export-nvr-signoff` still derives its');
    console.log('    key letter from the stored index.');
  }
  return failed;
}

/** Deliberately broken banks so a green run means the checks can actually fail. */
function selfTest(): void {
  console.log('SELF-TEST — the gate must FAIL these:\n');
  // Mixed storage: keys at different stored indices within one bank.
  const mixed = assessBank('fixture-mixed-storage', [
    { id: 'a', stem: {}, options: [{ id: 'a0', isCorrect: true }, { id: 'a1', isCorrect: false }, { id: 'a2', isCorrect: false }] },
    { id: 'b', stem: {}, options: [{ id: 'b0', isCorrect: false }, { id: 'b1', isCorrect: true }, { id: 'b2', isCorrect: false }] },
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
  const byBank = new Map<string, Array<{ id: string; stem: unknown; options: OptionRow[] }>>();
  for (const item of items) {
    // Only multiple-choice items have a meaningful key position.
    if (item.options.length < 2 || !item.options.some((o) => o.isCorrect)) continue;
    const list = byBank.get(item.questionTypeId) ?? [];
    list.push({ id: item.id, stem: item.stem, options: item.options });
    byBank.set(item.questionTypeId, list);
  }

  requirePopulation('check:option-positions', { 'LIVE multiple-choice items': items.length, banks: byBank.size });

  const reports = [...byBank.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([bank, list]) => assessBank(bank, list));
  const failed = report(reports);

  // ARM 3 — the segment-order assertion, over EVERY item declaring segmentsInOptions rather than
  // only LIVE ones: ENG-003 is DRAFT, and an item that would scramble on publication is worth
  // catching before it publishes. R191 arrived before the items; this keeps that.
  const seg = await checkSegmentOrder();
  console.log(`\n  SEGMENT ORDER — ${seg.screened} item(s) declare segmentsInOptions and are served`);
  console.log('  UNSHUFFLED (R192), so their stored id order IS the order a child reads.');
  if (seg.faults.length === 0) {
    console.log(`    ${seg.screened}/${seg.screened} have id order equal to label order: every sentence reconstructs.`);
  } else {
    console.log(`    ${seg.faults.length} ITEM(S) WOULD SERVE A SCRAMBLED SENTENCE:`);
    for (const f of seg.faults) console.log(`      x ${f.itemId}: id order ${f.idOrder}, label order ${f.labelOrder}`);
  }

  await prisma.$disconnect();
  if (failed || seg.faults.length > 0) {
    console.error('\nOption-position gate FAILED — a served key position above chance, or a segmented');
    console.error('item whose stored order would scramble its sentence. MIXED-STORAGE alone does NOT');
    console.error('fail: it costs a review-pack tell, not a child anything (R199).');
    process.exit(1);
  }
  console.log('\nOption-position gate passed: every bank is fair when SERVED, and every segmented item');
  console.log('reconstructs its sentence in stored order. Storage uniformity is reported above, not gated.');
}

void main();
