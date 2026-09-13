/**
 * check:lane-manifest — THE LANE'S ORDER IS A RECORD, NOT A READING (R1017).
 *
 * Asserts the manifest is monotonic, gapless, free of a name under two ordinals, and that every
 * artefact on disk is IN it — a delivery that skipped the manifest has no place in the order and
 * would be silently re-derived into one by the next reader.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { readManifest, verifyManifest } from './lib/lane-manifest';
import { requirePopulation } from './lib/population';

const LANE = pjoin(homedir(), 'Downloads', '11+', 'from-cluecrew');
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

function main() {
  console.log('check:lane-manifest — the lane places by ordinal, and the ordinal states what it rests on.');
  const m = readManifest();
  const v = verifyManifest();
  requirePopulation('check:lane-manifest', { 'manifest entr(ies)': m.length });

  const onDisk = existsSync(LANE) ? readdirSync(LANE).filter((n) => n.endsWith('.json') && statSync(pjoin(LANE, n)).isFile()) : [];
  const recorded = new Set(m.map((e) => e.name));
  const unrecorded = onDisk.filter((n) => !recorded.has(n));
  const gone = m.filter((e) => !onDisk.includes(e.name)).map((e) => e.name);
  const moved = m.filter((e) => onDisk.includes(e.name) && sha(pjoin(LANE, e.name)) !== e.sha256).map((e) => e.name);

  console.log(`  ${v.entries} entr(ies); monotonic ${v.monotonic}; gaps ${v.gaps.length}; a name under two ordinals: ${v.duplicates.length}`);
  console.log(`  by basis: ${Object.entries(v.byBasis).map(([k, n]) => `${n} ${k}`).join(', ')}`);
  console.log(`  on disk ${onDisk.length}; unrecorded ${unrecorded.length}; recorded-but-absent ${gone.length}; bytes moved under a recorded name ${moved.length}`);

  const faults: string[] = [];
  if (!v.monotonic) faults.push('ordinals are not monotonic');
  if (v.gaps.length) faults.push(`${v.gaps.length} ordinal gap(s)`);
  if (v.duplicates.length) faults.push(`${v.duplicates.length} name(s) under two ordinals`);
  if (unrecorded.length) faults.push(`${unrecorded.length} artefact(s) on disk with no ordinal: ${unrecorded.slice(0, 4).join(', ')}`);
  if (moved.length) faults.push(`${moved.length} artefact(s) whose bytes changed under a recorded name: ${moved.slice(0, 4).join(', ')}`);
  // Absence is reported, never a fault: an artefact can be pruned or archived, and the ordinal stays.
  if (gone.length) console.log(`  ${gone.length} recorded artefact(s) are no longer in the lane — pruned or archived. The ORDINAL stays; an order that forgets is not an order.`);

  if (faults.length === 0) {
    console.log('\n  The lane places by ordinal. Every ordinal is assigned once and appended, never re-derived.');
    console.log('  THE BASIS IS STATED PER ENTRY, and the backfill does not claim to be verified-monotonic.');
    return;
  }
  console.error(`\n  REFUSED — ${faults.length} fault(s) in the lane's order:`);
  for (const f of faults) console.error(`    ${f}`);
  process.exitCode = 1;
}
main();
