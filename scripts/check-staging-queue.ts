/**
 * WHAT IS STAGED FOR THE OTHER STORE AND HAS NEVER BEEN ACKNOWLEDGED — the queue nobody was
 * counting.
 *
 * **STAGED IS NOT ARRIVED** (R255). `deliver()` copies a file into the outbound folder and that is
 * all it can guarantee; the last hop is a human upload. For months the function printed
 * `delivered →` and I read my own success line as arrival. Cowork has received ONE artefact of ours
 * ever, against 31 uploads, and six NVR rows went unsigned because a file reported as delivered had
 * never crossed.
 *
 * **ONLY THE RECEIVING STORE CAN REPORT ARRIVAL**, so acknowledgement is read from INBOUND
 * artefacts — files the other store sent us — and never from anything on this side. A staged file
 * no inbound artefact names is unacknowledged, and the count of those is the queue length.
 *
 * **THIS REPORTS AND DOES NOT FAIL**, deliberately. A long queue is a fact about a human channel,
 * not a defect in a commit, and a red CI run on someone else's upload backlog would be switched
 * off within a week. What it must never do is stay invisible.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { stagingQueue } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const DOWNLOADS = '/Users/davidb/Downloads';
/** Where the other store's artefacts land. Derived by scanning, not hand-listed (R57). */
const INBOUND_DIRS = [
  DOWNLOADS,
  join(DOWNLOADS, '11+'),
  ...(() => {
    try {
      return readdirSync(join(DOWNLOADS, '11+'))
        .map((d) => join(DOWNLOADS, '11+', d))
        .filter((d) => { try { return statSync(d).isDirectory(); } catch { return false; } })
        .filter((d) => !d.endsWith('from-cluecrew'));
    } catch { return []; }
  })(),
];

function main() {
  const { staged, acknowledged, unacknowledged } = stagingQueue(INBOUND_DIRS);
  requirePopulation('staging queue', { 'files staged for the other store': staged.length });

  console.log('STAGED vs ARRIVED — the outbound queue');
  console.log(`  inbound directories read: ${INBOUND_DIRS.length}`);
  console.log(`  staged           : ${staged.length}`);
  console.log(`  acknowledged     : ${acknowledged.length}  (named in something the other store sent back)`);
  console.log(`  UNACKNOWLEDGED   : ${unacknowledged.length}`);

  // Grouped by family, so a backlog reads as subjects rather than as a wall of filenames.
  const byFamily = new Map<string, number>();
  for (const f of unacknowledged) {
    const family = f.replace(/-[0-9a-f]{16}.*$/, '').replace(/\.[a-z]+$/, '').replace(/-\d{4}-\d{2}-\d{2}.*$/, '');
    byFamily.set(family, (byFamily.get(family) ?? 0) + 1);
  }
  console.log(`\n  unacknowledged by family (${byFamily.size} families):`);
  for (const [family, n] of [...byFamily].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`    ${String(n).padStart(3)}  ${family}`);
  }

  if (acknowledged.length > 0) {
    console.log('\n  acknowledged:');
    for (const f of acknowledged) console.log(`    ${f}`);
  }
  console.log('\n  A staged file is a fact about this machine. Arrival is a fact about the other store.');
}

main();
