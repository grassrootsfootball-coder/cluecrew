/**
 * TYPECHECK THE ROOT SCRIPTS — `pnpm typecheck:scripts`
 *
 * ROOT SCRIPTS WERE NEVER TYPECHECKED. `pnpm typecheck` runs `pnpm -r`, which visits workspace
 * PACKAGES; scripts/ is in none of them, so ~90 files that write to the database sat outside every
 * type check in the repo. Three calls to `requirePopulation` passed three arguments to a
 * two-argument function and shipped clean — one of them inside `check:outside-writes`, an
 * instrument built to catch exactly this class of silent wrongness. It also caught a real defect in
 * the cluster importer that had not run yet: JS `null` written to a nullable Json column, which is
 * the JSON VALUE null rather than no value at all.
 *
 * A RATCHET, NOT A CLEAN SWEEP. The files below carry pre-existing errors. Fixing them all in the
 * same pass as the work that found them would bury both. Every OTHER script — and every NEW script
 * — is checked from now on, and this list can only shrink: a file that stops erroring must come
 * off it, which the run below enforces by failing on a stale entry.
 *
 * tsconfig `exclude` cannot do this: tsc still checks an excluded file when an included one
 * imports it. So the errors are filtered by file after the fact, which is also more honest — the
 * count of what is not yet clean is printed on every run rather than hidden by a config.
 */
import { execFileSync } from 'node:child_process';

/** Files with pre-existing errors, as of 2026-08-16. This list may only get shorter. */
const KNOWN_UNTYPED = new Set([
  'scripts/apply-nvr-review.ts',
  'scripts/audit-technique-keys.ts',
  'scripts/check-line-refs.ts',
  'scripts/export-english-batches.ts',
  'scripts/export-nvr-hints-to-reword.ts',
  'scripts/export-review-pack.ts',
  'scripts/export-reviewer-status.ts',
  'scripts/export-spag-sample-sheets.ts',
  'scripts/fix-explanation-quotes.ts',
  'scripts/fix-vr07-symbols.ts',
  'scripts/import-english-items.ts',
  'scripts/import-merged-english-batches.ts',
  'scripts/import-nvr-reworded-hints.ts',
  'scripts/import-pp21-hint.ts',
  'scripts/import-reworked-walkscripts.ts',
  'scripts/import-vr-banks.ts',
  'scripts/lib/maths-misconceptions-source.ts',
  'scripts/lib/nvr-signoff-source.ts',
  'scripts/lib/pilot-review.ts',
  'scripts/lib/review-pack-format.ts',
  'scripts/lib/vr-audit-source.ts',
  'scripts/lib/vr-free-ten-source.ts',
  'scripts/validate-content.ts',
  'scripts/verify-bank-content.ts',
]);

let out = '';
try {
  execFileSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.scripts.json'], { encoding: 'utf8' });
} catch (e) {
  out = String(e.stdout ?? '') + String(e.stderr ?? '');
}

const errors = out.split('\n').filter((l) => / error TS\d+/.test(l));
const fileOf = (line) => line.split('(')[0];
const fresh = errors.filter((l) => !KNOWN_UNTYPED.has(fileOf(l)));
const stillBad = new Set(errors.map(fileOf));

console.log(
  `typecheck:scripts: ${errors.length} error(s) in ${stillBad.size} file(s); ` +
  `${KNOWN_UNTYPED.size} file(s) are on the known-untyped list.`,
);

// A file that no longer errors must come OFF the list, or the list quietly grows into an
// exemption nobody revisits -- the same fault as a stale door in check:review-queries.
const stale = [...KNOWN_UNTYPED].filter((f) => !stillBad.has(f));
if (stale.length > 0) {
  console.error(`\n${stale.length} file(s) on the known-untyped list now typecheck cleanly:`);
  for (const f of stale) console.error(`  x ${f}`);
  console.error('Remove them from KNOWN_UNTYPED in tools/typecheck-scripts.mjs. The ratchet only turns one way.');
  process.exit(1);
}

if (fresh.length > 0) {
  console.error(`\n${fresh.length} error(s) in file(s) NOT on the known list:`);
  for (const l of fresh) console.error(`  x ${l}`);
  process.exit(1);
}
console.log('No new type errors. The known list is the backlog, and it is not growing.');
