/**
 * REMOVE RULED-OUT LIBRARY ENTRIES — `pnpm remove:library-entries [--write]`
 *
 * Deliveries 37/38 ruled two English entries for removal, both reported as zero-carrier.
 *
 * THE CARRIER COUNT IS MEASURED AT THE MOMENT OF REMOVAL, never taken from the delivery's figure
 * (David, 2026-08-13). A count computed when the ruling was written is a count about a database
 * that has since taken 86 items. If anything carries the tag now, this refuses: removing a tag a
 * distractor points at would leave a dangling reference, which is R72's fault in reverse — the
 * gate treats the absence as declared while the schema treats it as broken.
 */
import { prisma } from '../packages/db/src/index';

const RULED_FOR_REMOVAL = [
  { id: 'en-multimark-single-answer', ruling: 'deliveries 37/38 — ruled for removal, zero carriers' },
  { id: 'en-surface-word-match-multiselect', ruling: 'deliveries 37/38 — ruled for removal, zero carriers' },
];

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const blocked: string[] = [];
  const removable: Array<{ id: string; carriers: number }> = [];

  for (const entry of RULED_FOR_REMOVAL) {
    const present = await prisma.misconception.findUnique({ where: { id: entry.id } });
    if (!present) {
      console.log(`  ABSENT    ${entry.id} — already gone, nothing to remove`);
      continue;
    }
    // MEASURED NOW. Options are the only carriers of a misconception id.
    const carriers = await prisma.itemOption.count({ where: { misconceptionId: entry.id } });
    console.log(`  carriers  ${entry.id}: ${carriers} option(s) at this moment`);
    if (carriers > 0) {
      blocked.push(`${entry.id}: ${carriers} option(s) still carry it — removal would dangle every one`);
    } else {
      removable.push({ id: entry.id, carriers });
    }
  }

  if (blocked.length > 0) {
    console.error(`\nREMOVAL REFUSED for ${blocked.length} entry(ies):`);
    for (const b of blocked) console.error(`  x ${b}`);
    console.error('\nThe delivery reported zero carriers; the database says otherwise NOW. The ruling\nstands but the removal does not — re-tag the carriers first.');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (!write) {
    console.log(`\n${removable.length} entry(ies) removable, 0 carriers each. Dry run.`);
    await prisma.$disconnect();
    return;
  }

  for (const r of removable) {
    await prisma.misconception.delete({ where: { id: r.id } });
    // Verify by re-reading THIS id, not by counting the library.
    const gone = (await prisma.misconception.findUnique({ where: { id: r.id } })) === null;
    console.log(`  ${gone ? 'REMOVED  ' : 'STILL PRESENT'} ${r.id} (carriers at removal: ${r.carriers})`);
  }
  await prisma.$disconnect();
}

void main();
