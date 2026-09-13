/** Seed the lane manifest once, from the only order available, MARKED as the clock it is. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { appendToManifest, readManifest, verifyManifest } from './lib/lane-manifest';
import { requirePopulation } from './lib/population';

const LANE = pjoin(homedir(), 'Downloads', '11+', 'from-cluecrew');
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

function main() {
  console.log('freeze:lane-manifest — seeding the lane\'s ordinals once, and saying what they rest on.');
  if (readManifest().length > 0) { console.log(`  already frozen: ${readManifest().length} entr(ies). APPEND-ONLY — refusing to re-derive (that is the fault this closes).`); return; }
  const files = readdirSync(LANE).filter((n) => n.endsWith('.json') && statSync(pjoin(LANE, n)).isFile());
  requirePopulation('freeze:lane-manifest', { 'artefact(s) in the lane': files.length });
  const ordered = files.map((n) => ({ n, mtime: statSync(pjoin(LANE, n)).mtimeMs })).sort((a, b) => a.mtime - b.mtime);
  for (const f of ordered) {
    appendToManifest({ name: f.n, sha256: sha(pjoin(LANE, f.n)), basis: 'SEEDED-FROM-MTIME-NOT-VERIFIED',
      note: 'backfilled at the freeze. mtime is the clock this manifest exists to stop trusting, and it is the only order that existed for these. Their RELATIVE order is not evidence.' });
  }
  const v = verifyManifest();
  console.log(`  seeded ${v.entries} entr(ies); monotonic ${v.monotonic}; gaps ${v.gaps.length}; duplicate names ${v.duplicates.length}`);
  console.log(`  by basis: ${JSON.stringify(v.byBasis)}`);
  console.log('  from here every delivery is ASSIGNED-AT-EMISSION and appended, never re-derived.');
}
main();
