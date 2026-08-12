/**
 * PIN EACH SIGNED FAMILY'S BANK CONTENT — `pnpm pin:bank-signatures [--pin]`
 *
 * Records, per family, the hash of the bank it draws from plus a hash PER ENTRY. The per-entry
 * record is what lets `verify:bank-content` tell an EDIT or REMOVAL (voids the signature) from an
 * ADDITION (ordinary authoring, but it moves `familyDepth`, so it forces a depth re-check).
 *
 * PINNED AT A VERIFIED-CLEAN STATE, 2026-08-12. Every one of the fourteen banks was checked
 * byte-for-byte against its content at commit 20317e7 — the point at which all thirteen SPaG
 * signatures existed and were pinned — and all fourteen were identical. So this records a
 * known-good state rather than freezing a discrepancy nobody had noticed.
 *
 * DRY RUN BY DEFAULT. `--pin` writes. Re-pinning a bank that has MOVED is a reviewer's ruling on
 * whether the move was substantive (R34), never a script's, so an existing record is never
 * overwritten here — the verifier reports it and a human decides.
 */
import { bankEntryHashes, bankFingerprint } from '../packages/core/src/english/bank-fingerprint';
import { FAMILY_BANKS, orphanedRegistryEntries, unregisteredFamilies } from '../packages/core/src/english/bank-registry';
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';
const NOTE =
  'Bank content pinned 2026-08-12, after verifying all fourteen banks byte-identical to their ' +
  'state at 20317e7 (all thirteen SPaG signatures pinned). Records a known-good state. Additions ' +
  'do not void this signature but do move familyDepth; edits and removals void it (R34 ruling).';

async function main(): Promise<void> {
  const doPin = process.argv.includes('--pin');

  const missing = unregisteredFamilies();
  const orphans = orphanedRegistryEntries();
  if (missing.length > 0 || orphans.length > 0) {
    console.error('BANK PINNING ABORTED — the registry and the families disagree:');
    for (const id of missing) console.error(`  ${id}: draws from a bank but is NOT in FAMILY_BANKS`);
    for (const id of orphans) console.error(`  ${id}: in FAMILY_BANKS but no such family exists`);
    console.error('Pinning a partial registry would leave a family silently unguarded.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const existing = new Map(
    (await prisma.familyBankSignature.findMany()).map((row) => [row.familyId, row]),
  );

  let pinned = 0;
  let already = 0;
  let moved = 0;
  for (const reg of FAMILY_BANKS) {
    const hash = bankFingerprint(reg.bank);
    const row = existing.get(reg.familyId);
    if (row && row.bankHash === hash) {
      already += 1;
      continue;
    }
    if (row) {
      console.log(
        `  MOVED      ${reg.familyId} (${reg.bankName}) — recorded ${row.bankHash}, now ${hash};\n` +
          '             needs a ruling via verify:bank-content, not a re-pin',
      );
      moved += 1;
      continue;
    }
    if (doPin) {
      await prisma.familyBankSignature.create({
        data: {
          familyId: reg.familyId,
          bankName: reg.bankName,
          bankHash: hash,
          entryHashes: bankEntryHashes(reg.bank),
          recordedBy: DAVID,
          notes: NOTE,
        },
      });
      console.log(`  PINNED     ${reg.familyId.padEnd(37)} ${reg.bankName.padEnd(17)} ${reg.bank.length} entries → ${hash}`);
    } else {
      console.log(`  TO PIN     ${reg.familyId.padEnd(37)} ${reg.bankName.padEnd(17)} ${reg.bank.length} entries → ${hash}`);
    }
    pinned += 1;
  }

  console.log(
    `\n${FAMILY_BANKS.length} banks · ${pinned} ${doPin ? 'pinned' : 'to pin'} · ` +
      `${already} already pinned and unchanged · ${moved} moved (held for a ruling)`,
  );
  if (!doPin) console.log('Re-run with --pin to write them.');
  console.log(`recordedBy ${DAVID}`);
  await prisma.$disconnect();
}

void main();
