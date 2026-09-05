/**
 * ARCHIVE THE LANE — everything but the current month (David's call, 2026-09-05).
 *
 * A file was delivered three times and read at the desk none of them, and a directory listing
 * errored. **A listing that errors is a count problem**, so this moves files out of the listing;
 * the five files over 1 MB are a WEIGHT problem and a separate fix, deliberately not done here.
 *
 * **MOVING 841 FILES OUT OF A CHANNEL THE OTHER STORE READS IS NOT A `mv`.** Every file's sha256 is
 * taken BEFORE the move and re-taken AFTER, and the run refuses and stops on the first mismatch —
 * a byte that changes in transit would be indistinguishable from a file that was always different
 * once the original is gone. A manifest is written into the archive naming every file, its digest
 * and where it came from, so the move is reversible by anyone who reads the manifest and not only
 * by whoever ran it.
 *
 * The archive sits OUTSIDE the lane. Inside it, a recursive listing is the same length and the
 * fault this is fixing would survive the fix.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';

const LANE = pjoin(homedir(), 'Downloads', '11+', 'from-cluecrew');
const ARCHIVE_ROOT = pjoin(homedir(), 'Downloads', '11+', 'archive', 'from-cluecrew');
const APPLY = process.argv.includes('--apply');
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

function main() {
  console.log(`ARCHIVE THE LANE — ${APPLY ? 'APPLY' : 'DRY RUN'}\n  keeping ${CURRENT_MONTH}; archiving everything older.`);
  const names = readdirSync(LANE).filter((n) => statSync(pjoin(LANE, n)).isFile());
  requirePopulation('archive-the-lane', { 'file(s) in the lane': names.length });

  const dated = names.map((n) => ({ n, month: new Date(statSync(pjoin(LANE, n)).mtimeMs).toISOString().slice(0, 7), size: statSync(pjoin(LANE, n)).size }));
  const move = dated.filter((f) => f.month < CURRENT_MONTH);
  const keep = dated.filter((f) => f.month >= CURRENT_MONTH);

  /**
   * A FILE AND ITS SIDECAR TRAVEL TOGETHER. An artefact archived while its .sha256 stays behind
   * leaves a sidecar attesting bytes that are no longer there, which is worse than either alone.
   */
  const moving = new Set(move.map((f) => f.n));
  const split = move.filter((f) => f.n.endsWith('.json') && names.includes(`${f.n}.sha256`) && !moving.has(`${f.n}.sha256`))
    .concat(move.filter((f) => f.n.endsWith('.sha256') && names.includes(f.n.slice(0, -7)) && !moving.has(f.n.slice(0, -7))));
  if (split.length) {
    console.error(`  REFUSED — ${split.length} file(s) would be separated from their sidecar or their subject:`);
    for (const s of split.slice(0, 8)) console.error(`    ${s.n}`);
    process.exitCode = 1; return;
  }

  const byMonth = new Map<string, number>();
  for (const f of move) byMonth.set(f.month, (byMonth.get(f.month) ?? 0) + 1);
  console.log(`  ${move.length} file(s), ${(move.reduce((a, f) => a + f.size, 0) / 1e6).toFixed(1)} MB to archive; ${keep.length} file(s), ${(keep.reduce((a, f) => a + f.size, 0) / 1e6).toFixed(1)} MB stay.`);
  for (const [m, c] of [...byMonth].sort()) console.log(`    ${m}  ${c} file(s) -> ${pjoin(ARCHIVE_ROOT, m).replace(homedir(), '~')}`);
  if (!APPLY) { console.log('\n  DRY RUN — nothing moved. Re-run with --apply.'); return; }

  const before = new Map(move.map((f) => [f.n, sha(pjoin(LANE, f.n))]));
  const manifest: Array<{ file: string; sha256: string; month: string; size: number }> = [];
  let moved = 0;
  for (const f of move) {
    const dir = pjoin(ARCHIVE_ROOT, f.month);
    mkdirSync(dir, { recursive: true });
    const dest = pjoin(dir, f.n);
    if (existsSync(dest)) throw new Error(`${dest} already exists — refusing to overwrite an archived file`);
    renameSync(pjoin(LANE, f.n), dest);
    const after = sha(dest);
    if (after !== before.get(f.n)) throw new Error(`${f.n} changed in transit: ${before.get(f.n)} -> ${after}. STOPPING with ${moved} file(s) moved.`);
    manifest.push({ file: f.n, sha256: after, month: f.month, size: f.size });
    moved += 1;
  }

  const manifestPath = pjoin(ARCHIVE_ROOT, `MANIFEST-${CURRENT_MONTH}.json`);
  writeFileSync(manifestPath, JSON.stringify({
    what: 'files archived out of the delivery lane so a directory listing stops erroring. Every digest was taken before the move and re-verified after it.',
    why: 'the lane held 945 files and 39.5 MB; a file was delivered three times and read at the desk none of them, and a listing errored. A listing that errors is a count problem.',
    archivedOn: new Date().toISOString().slice(0, 10),
    archivedBy: 'David\'s call, 2026-09-05',
    from: LANE, to: ARCHIVE_ROOT,
    andHOWTOREVERSEIT: 'every entry names the file and its sha256. Moving a file back and re-taking its digest restores the lane exactly; nothing was rewritten, renamed or deleted.',
    andWHATWASNOTDONE: 'the five files over 1 MB are a WEIGHT problem, not a count problem, and are a separate decision. Those in this manifest were archived by DATE alone.',
    count: manifest.length, bytes: manifest.reduce((a, m) => a + m.size, 0),
    files: manifest,
  }, null, 1));

  const nowInLane = readdirSync(LANE).filter((n) => statSync(pjoin(LANE, n)).isFile());
  console.log(`\n  moved ${moved} file(s), all digests re-verified after the move.`);
  console.log(`  lane now: ${nowInLane.length} file(s), ${(nowInLane.reduce((a, n) => a + statSync(pjoin(LANE, n)).size, 0) / 1e6).toFixed(1)} MB`);
  console.log(`  manifest: ${manifestPath.replace(homedir(), '~')}`);
  if (nowInLane.length !== keep.length) console.error(`  WARNING — expected ${keep.length} to remain and ${nowInLane.length} do.`);
}

main();
