/**
 * HAS A SIGNED FAMILY'S BANK CONTENT MOVED? — `pnpm verify:bank-content`
 *
 * The third leg. `verify:fingerprints` guards the DECLARED SURFACE; `verify:param-sweeps` guards
 * EMITTED BEHAVIOUR; neither sees the sentences themselves. Verified 2026-08-12: extending a
 * family's bank moves neither a fingerprint nor a sweep verdict, and the bank IS what a child reads.
 *
 * SOURCE, STATED BEFORE IT RUNS (R41). Nothing here re-derives a hash. It calls
 * `bankFingerprint` / `bankEntryHashes` / `compareBank` (packages/core/src/english/
 * bank-fingerprint.ts) over the banks named in `FAMILY_BANKS`, against the per-entry hashes in
 * `FamilyBankSignature` — the same functions `pin:bank-signatures` used to write them.
 *
 * THREE CLASSES, REPORTED SEPARATELY:
 *   UNCHANGED — the entry is exactly as signed.
 *   EDITED / REMOVED — VOIDS the signature. The reviewer signed those sentences; changing one is
 *     a change to what she approved, and re-pinning is her ruling (R34), never this script's.
 *   ADDED — does NOT void. A bank legitimately grows. But `familyDepth` generates to exhaustion,
 *     so depth is a function of bank size and the signature notes carry depth figures: an
 *     addition forces a DEPTH RE-CHECK, and this gate says so rather than passing in silence.
 */
import {
  bankEntryHashes,
  compareBank,
  type BankComparison,
} from '../packages/core/src/english/bank-fingerprint';
import {
  FAMILY_BANKS,
  orphanedRegistryEntries,
  unregisteredFamilies,
} from '../packages/core/src/english/bank-registry';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/**
 * CANARY (R60 Q2). If the entry hash stopped responding to an entry's content, every bank would
 * read UNCHANGED forever and this would be the most reassuring gate in the repo while checking
 * nothing. Perturb one entry and require its hash to move, before any real row is trusted.
 */
function entryHashResponds(): boolean {
  const sample = FAMILY_BANKS[0]?.bank[0];
  if (!sample) return false;
  const before = bankEntryHashes([sample])[sample.id]!;
  const after = bankEntryHashes([{ ...sample, __probe: 'moved' }])[sample.id]!;
  return before !== after;
}

function report(c: BankComparison): string {
  const state = c.voided ? 'VOIDED' : c.added.length > 0 ? 'GREW' : 'unchanged';
  return (
    `  ${state.padEnd(10)} ${c.familyId.padEnd(37)} ${c.bankName.padEnd(17)} ` +
    `${String(c.currentEntries).padStart(3)} entries ` +
    `(${c.unchanged.length} unchanged, ${c.edited.length} edited, ${c.removed.length} removed, ${c.added.length} added)`
  );
}

async function main(): Promise<void> {
  if (!entryHashResponds()) {
    console.error('BANK CONTENT VERIFY ABORTED: the entry hash no longer moves when an entry changes.');
    console.error('Every bank would report UNCHANGED. Fix bankEntryHash before trusting any row.');
    process.exit(1);
  }

  // A family missing from the registry is a family whose sentences nothing guards — the same
  // fail-open shape as the allowlist R57 removed.
  const missing = unregisteredFamilies();
  const orphans = orphanedRegistryEntries();
  if (missing.length > 0 || orphans.length > 0) {
    console.error('BANK CONTENT VERIFY ABORTED — the registry and the families disagree:');
    for (const id of missing) console.error(`  ${id}: draws from a bank but is NOT in FAMILY_BANKS — unguarded`);
    for (const id of orphans) console.error(`  ${id}: in FAMILY_BANKS but no such family exists`);
    process.exit(1);
  }

  const signed = new Map((await prisma.familyBankSignature.findMany()).map((r) => [r.familyId, r]));
  requirePopulation('verify:bank-content', {
    'registered banks': FAMILY_BANKS.length,
    'recorded bank signatures': signed.size,
  });

  const unpinned: string[] = [];
  const results: BankComparison[] = [];
  for (const reg of FAMILY_BANKS) {
    const row = signed.get(reg.familyId);
    if (!row) {
      unpinned.push(`${reg.familyId} (${reg.bankName})`);
      continue;
    }
    results.push(
      compareBank(reg.familyId, reg.bankName, reg.bank, row.entryHashes as Record<string, string>),
    );
  }

  console.log('\nSigned-family bank content — per entry, against what was recorded at signing\n');
  for (const c of results) console.log(report(c));

  const voided = results.filter((c) => c.voided);
  const grew = results.filter((c) => !c.voided && c.added.length > 0);
  const totalEntries = results.reduce((s, c) => s + c.currentEntries, 0);

  console.log(
    `\n${results.length} banks · ${totalEntries} entries · ${voided.length} VOIDED · ` +
      `${grew.length} grew · ${unpinned.length} unpinned`,
  );
  console.log(
    'Scope: GENERATOR BANKS only. English comprehension items are authored in the database under\n' +
      'a different mechanism entirely (Cowork authors, the DB holds) and are NOT covered here — a\n' +
      'clean run says nothing about them. Read alongside `verify:fingerprints` (declared surface)\n' +
      'and `verify:param-sweeps` (emitted behaviour); no one of the three covers another.',
  );

  if (grew.length > 0) {
    console.log('\nBANKS THAT GREW — signature intact, but DEPTH HAS MOVED:');
    for (const c of grew) {
      console.log(`  ${c.familyId}: +${c.added.length} entries (${c.added.join(', ')})`);
    }
    console.log(
      '  An addition does not void a signature — a bank legitimately grows. But familyDepth is\n' +
        '  measured by generating to exhaustion, so these families are now deeper than the figures\n' +
        '  in their signature notes. Re-check depth (`pnpm export:family-status`) and re-pin the\n' +
        '  bank with `pnpm pin:bank-signatures --pin` once the new sentences have been reviewed.',
    );
  }

  if (unpinned.length > 0) {
    console.error(`\n${unpinned.length} registered bank(s) have NO recorded signature:`);
    for (const u of unpinned) console.error(`  ${u}`);
    console.error('Nothing to compare against, so nothing is guarded. Run `pnpm pin:bank-signatures --pin`.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (voided.length > 0) {
    console.error(`\n${voided.length} SIGNATURE(S) VOIDED — signed sentences were edited or removed:`);
    for (const c of voided) {
      if (c.edited.length > 0) console.error(`  ${c.familyId}: EDITED ${c.edited.join(', ')}`);
      if (c.removed.length > 0) console.error(`  ${c.familyId}: REMOVED ${c.removed.join(', ')}`);
    }
    console.error(
      '\nThe reviewer signed those sentences. Whether the change was substantive is her ruling\n' +
        '(R34) — do not re-pin to make this pass. Take it to review, then pin the outcome.',
    );
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.$disconnect();
}

void main();
