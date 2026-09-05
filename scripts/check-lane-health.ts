/**
 * check:lane-health — THE CHANNEL IS AN ARTEFACT AND NOTHING WAS SCREENING IT (R996).
 *
 * A file was delivered three times and read at the desk none of them; a directory listing errored.
 * **Every guard in this repo screens what is IN an artefact and none screened the place they are
 * put.** The lane is a shared directory with a size, a file count and a per-file integrity
 * contract, and all three were unmeasured — so a listing that errors looked like bad luck rather
 * than a channel at its limit.
 *
 * This reports rather than deletes. **Nothing here removes a file from a channel the other store
 * reads** — a prune is an outward-facing act on shared state and belongs to David, not to a check.
 */
import { readdirSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';

const LANE = pjoin(homedir(), 'Downloads', '11+', 'from-cluecrew');
/** Budgets, declared rather than discovered after a failure. Both are arguable and both are stated. */
const FILE_BUDGET = 400;
const BYTE_BUDGET = 20 * 1024 * 1024;

function main() {
  console.log('check:lane-health — the delivery channel, measured.');
  if (!existsSync(LANE)) throw new Error(`no lane at ${LANE} — a missing channel is not an empty one (R173)`);
  const names = readdirSync(LANE).filter((n) => statSync(pjoin(LANE, n)).isFile());
  requirePopulation('check:lane-health', { 'file(s) in the lane': names.length });

  const bytes = names.reduce((a, n) => a + statSync(pjoin(LANE, n)).size, 0);
  const byMonth = new Map<string, { files: number; bytes: number }>();
  for (const n of names) {
    const s = statSync(pjoin(LANE, n));
    const k = new Date(s.mtimeMs).toISOString().slice(0, 7);
    const e = byMonth.get(k) ?? { files: 0, bytes: 0 };
    e.files += 1; e.bytes += s.size; byMonth.set(k, e);
  }
  const heavy = names.map((n) => ({ n, size: statSync(pjoin(LANE, n)).size })).filter((f) => f.size > 1024 * 1024).sort((a, b) => b.size - a.size);
  const jsons = names.filter((n) => n.endsWith('.json'));
  const sidecars = new Set(names.filter((n) => n.endsWith('.sha256')).map((n) => n.slice(0, -7)));
  const orphans = jsons.filter((n) => !sidecars.has(n));

  console.log(`  ${names.length} file(s), ${(bytes / 1e6).toFixed(1)} MB. Budgets: ${FILE_BUDGET} files, ${(BYTE_BUDGET / 1e6).toFixed(0)} MB.`);
  for (const [m, v] of [...byMonth].sort()) console.log(`    ${m}  ${String(v.files).padStart(4)} file(s)  ${(v.bytes / 1e6).toFixed(1)} MB`);
  console.log(`  ${heavy.length} file(s) over 1 MB, ${(heavy.reduce((a, f) => a + f.size, 0) / 1e6).toFixed(1)} MB between them:`);
  for (const f of heavy.slice(0, 6)) console.log(`    ${(f.size / 1e6).toFixed(1)} MB  ${f.n}`);
  console.log(`  ${orphans.length} .json with NO .sha256 sidecar — a file whose bytes nothing attests.`);

  const over = names.length > FILE_BUDGET || bytes > BYTE_BUDGET;
  if (!over && orphans.length === 0) { console.log('\n  The channel is within budget and every delivered file carries its sidecar.'); return; }
  console.log('\n  OVER BUDGET. What a prune or a shard would recover, measured — NOT performed:');
  const old = [...byMonth].sort().slice(0, -1);
  const oldFiles = old.reduce((a, [, v]) => a + v.files, 0), oldBytes = old.reduce((a, [, v]) => a + v.bytes, 0);
  console.log(`    ARCHIVE EVERY MONTH BUT THE CURRENT ONE -> moves ${oldFiles} file(s) and ${(oldBytes / 1e6).toFixed(1)} MB,`);
  console.log(`      leaving ${names.length - oldFiles} file(s) and ${((bytes - oldBytes) / 1e6).toFixed(1)} MB in the live lane.`);
  console.log(`    MOVE THE ${heavy.length} FILE(S) OVER 1 MB -> recovers ${(heavy.reduce((a, f) => a + f.size, 0) / 1e6).toFixed(1)} MB and only ${heavy.length} listing entries.`);
  console.log('    The two are different fixes: the first shortens the LISTING, the second lightens the BYTES.');
  console.log('    A listing that errors is a count problem, so the first is the one that addresses it.');
  console.log('\n  Neither is done here. Moving files out of a channel the other store reads is an outward act,');
  console.log('  and a store that prunes a shared directory on its own judgement is the fault this repo keeps finding.');
}

main();
