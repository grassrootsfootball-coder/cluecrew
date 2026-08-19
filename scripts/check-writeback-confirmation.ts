/**
 * ANNIE'S CONFIRMATION REQUEST, AS A WRITE-BACK CHECK — values READ BACK FROM THE STORE, never
 * reported from what a script believed it wrote.
 *
 * **A REPORT OF A WRITE IS NOT A WRITE** — the same distinction as R25 (send the value, not an
 * account of it) applied to the acknowledgement rather than the delivery. Every figure below is
 * read from the row after the fact, so a write that silently did not happen (R87) shows up here as
 * a missing value rather than as a confident summary of an intention.
 *
 * **AND IT REPORTS WHAT IT DOES NOT HOLD, BY NAME.** Three groups were named for confirmation. This
 * store can confirm what is written on its own rows; it CANNOT confirm a text it never received.
 * Where the expected value never crossed, the row says NOT HELD rather than passing quietly on the
 * fields that did — R98, and R222 the week before it: an absence I cannot see is not an absence.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** The eight VR replacements, read from the register at R220 — never recalled (R222). */
const VR_EIGHT = [
  'vr-letter-series-off-by-one', 'vr-series-off-by-one', 'vr-series-step-carryover',
  'vr-series-sum-of-last-two', 'vr01-first-word-only', 'vr04-opposite-pull',
  'vr12-meaning-not-word', 'vr15-first-mention',
];

/** The seven third-text rows settled on her eighth return (R225), plus the two dedupes (R231). */
const RESOLVED = [
  'nvr-wrong-mirror-axis', 'nvr-code-row-swap', 'nvr-count-by-glance', 'nvr-mirror-for-rotation',
  'nvr-multi-part-tracking', 'nvr-series-phase-slip', 'nvr-transform-not-applied',
  'en-subject-verb-agreement-by-proximity', 'en-comparative-superlative-form',
];

const ANNIE = 'reviewer:rev-0001';

async function main() {
  const ids = [...new Set([...VR_EIGHT, ...RESOLVED])];
  const rows = await prisma.misconception.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } });
  requirePopulation('write-back confirmation', { 'ids asked about': ids.length, 'rows read back': rows.length });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const line = (id: string) => {
    const r = byId.get(id);
    if (!r) return `${id.padEnd(40)} NOT IN THIS STORE`;
    const prov = r.textProvenance === null ? 'none' : 'recorded';
    return `${id.padEnd(40)} ${r.status.padEnd(7)} approvedBy=${(r.approvedBy ?? 'null').padEnd(18)} provenance=${prov}`;
  };

  console.log('WRITE-BACK CONFIRMATION — every value below read back from the row, after the write\n');

  console.log(`GROUP 1 — the eight VR replacements (${VR_EIGHT.length}):`);
  for (const id of VR_EIGHT) console.log('  ' + line(id));
  const vrWritten = VR_EIGHT.filter((id) => byId.get(id)?.approvedBy !== null && byId.get(id) !== undefined);
  console.log(`  CONFIRMED WRITTEN: ${vrWritten.length} of ${VR_EIGHT.length}`);
  if (vrWritten.length < VR_EIGHT.length) {
    console.log('  NOT WRITTEN, AND WHY: these eight are the ids Annie named as REPLACEMENTS. This store');
    console.log('  holds the rows and can confirm they exist, are ACTIVE, and carry live options — but it');
    console.log('  HAS NEVER RECEIVED THE REPLACEMENT TEXT. No artefact here carries it. Writing an');
    console.log('  approval onto a row whose replacement text never arrived would record a decision that');
    console.log('  was never made about a value nobody sent.');
  }

  console.log(`\nGROUP 2 — the resolved rows (${RESOLVED.length}):`);
  for (const id of RESOLVED) console.log('  ' + line(id));
  const resolvedOk = RESOLVED.filter((id) => byId.get(id)?.approvedBy === ANNIE && byId.get(id)?.textProvenance !== null);
  console.log(`  CONFIRMED: ${resolvedOk.length} of ${RESOLVED.length} carry ${ANNIE} AND a recorded provenance`);

  console.log('\nGROUP 3 — the eleven amended NVR hints:');
  console.log('  NOT HELD. Her eighth return recorded that eleven of the twenty-two were APPROVED WITH');
  console.log('  AMENDMENTS; the amended TEXT did not cross to this store, and no artefact here carries');
  console.log('  it. The seven approved AS WRITTEN are confirmed above — those needed no text, which is');
  console.log('  exactly why they could be completed and these cannot.');
  const nvr = await prisma.misconception.findMany({ where: { district: 'NVR' }, select: { id: true, approvedBy: true } });
  console.log(`  NVR rows in this store: ${nvr.length} · carrying ${ANNIE}: ${nvr.filter((n) => n.approvedBy === ANNIE).length}`);
  console.log(`  ELEVEN AMENDED TEXTS OUTSTANDING — send the values and they are one write.`);

  const blocking = RESOLVED.length - resolvedOk.length;
  if (blocking > 0) {
    console.error(`\nFAULT: ${blocking} resolved row(s) do not read back as written.`);
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\nEvery row this store was able to complete reads back as written.');
  await prisma.$disconnect();
}

main();
