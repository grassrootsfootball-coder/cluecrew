/**
 * RETIRE ~/Downloads/reviewer-latest — `pnpm retire:reviewer-latest`
 *
 * David's ruling, 2026-08-12. Nothing has written to this tree since delivery moved to
 * `OUTBOUND_DIR`, and its own README still calls it "For review — latest round". Twenty-one
 * files from the fixed-filename era, every one of them reading as current. That is the stale-file
 * class that has cost this project repeatedly, and a second tree of it is worse than one file:
 * the reviewer has no way to know which of two folders is live.
 *
 * Removal goes through `retireDropTree` (lib/export-destination.ts), which will not delete a file
 * it cannot account for as a duplicate, a superseded version, or something a named command
 * rebuilds. Whatever it cannot account for is KEPT and reported, and this script archives the one
 * genuinely unique file into the repo first rather than destroying the only copy of it.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { retireDropTree } from './lib/export-destination';

const TREE = '/Users/davidb/Downloads/reviewer-latest';
// docs/, not content/exports/ — the latter is gitignored (.gitignore:33), so archiving there
// would have been the same unattributable change this is meant to avoid.
const ARCHIVE = resolve(import.meta.dirname, '../docs/retired-drops');

/**
 * Regenerable rather than duplicated: no outbound copy exists, but a command rebuilds it. The
 * status queue in particular MUST not be kept — it is a snapshot of what was PROPOSED on
 * 2026-08-05 and status ages invisibly, which is exactly what made the earlier queue delivery a
 * wrong instruction rather than a stale document.
 */
const REGENERABLE: Record<string, string> = {
  'reviewer-status-queue.md': 'pnpm export:reviewer-status',
};

/**
 * Unique, hand-written, and reproduced by nothing: a delivery note that itself documents the
 * "two documents went missing" incident. Archived into the repo (git-tracked, so it acquires a
 * commit and a diff) before the tree goes. Retiring a folder should not destroy the only record
 * of why it existed.
 */
const ARCHIVE_FIRST = ['README.md'];

function main(): void {
  if (!existsSync(TREE)) {
    console.log(`${TREE} does not exist — nothing to retire.`);
    return;
  }

  mkdirSync(ARCHIVE, { recursive: true });
  for (const name of ARCHIVE_FIRST) {
    const source = join(TREE, name);
    if (!existsSync(source)) continue;
    const target = join(ARCHIVE, `reviewer-latest-${name}`);
    copyFileSync(source, target);
    console.log(`  archived → ${target}`);
    rmSync(source);
  }

  const { removed, kept } = retireDropTree(TREE, REGENERABLE);

  console.log(`\nRetiring ${TREE}\n`);
  for (const r of removed) console.log(`  removed  ${r.name}\n           ${r.why}`);

  if (kept.length > 0) {
    console.log(`\n  ${kept.length} file(s) KEPT — not accounted for, so not deleted:`);
    for (const k of kept) console.log(`    ${k.name} — ${k.why}`);
    console.log('\n  The tree is NOT empty. Account for these before retiring it, or archive them.');
    console.log(`\n${removed.length} removed · ${kept.length} kept`);
    return;
  }

  const left = readdirSync(TREE);
  if (left.length === 0) {
    rmSync(TREE, { recursive: true });
    console.log(`\n  removed the empty tree itself: ${TREE}`);
  }
  console.log(`\n${removed.length} removed · 0 kept · every file accounted for before deletion.`);
}

main();
