/**
 * PILOT-REVIEW EXCLUSION GUARD — `pnpm check:pilot-exclusion`
 *
 * `content/pilot-review` sits INSIDE `content/`, which both content scanners walk recursively.
 * Neither can describe what lives there:
 *
 *   - `validate:content` checks a `kind`-discriminated union of authored-content files. A pilot
 *     ITEM BATCH (`batchId` / `items[]`) carries no `kind` and never will.
 *   - `scan:vocab` reads a JSON file as one flat blob, so it cannot tell a child-facing `stem.text`
 *     from the reviewer-facing `misconceptionExecution` beside it — and flags ids like
 *     `en-wrong-scope-retrieval` as banned child-facing copy.
 *
 * Both therefore exclude the directory, and both are RIGHT to: these files have a narrower, better
 * gate — every write goes through `scripts/lib/pilot-review.ts`, which runs `checkItemChildFacing`
 * over exactly the child-facing fields. This guard exists because that exclusion was added after
 * CI had already been red for eight commits, and the failure it produced pointed at the WRONG FIX:
 * "invalid discriminator value" reads as "mangle the pilot file to fit the schema" or "delete it",
 * when the answer is "restore the exclusion".
 *
 * HOW IT CHECKS, and why not by reading the scanners' source. Grepping for the string
 * `'content/pilot-review'` in an `EXCLUDED_PATHS` array would be a re-derivation of the property
 * rather than the property itself — the exact fault the house rule names (a verifier states which
 * function defines what it checks; a second implementation is a different fact wearing the same
 * name). Both scanners execute at import, so their collectors cannot be imported without running
 * the whole scan. So this drives the REAL entry points, end to end, with a planted canary:
 *
 *   PHASE 1 — PROBE VALIDITY. Plant the canary in a NON-excluded content directory. Both scanners
 *   must FAIL. Without this, a canary that stopped biting (a ban-list edit, a schema change) would
 *   make phase 2 pass forever while checking nothing — assurance that is true by luck.
 *
 *   PHASE 2 — THE ASSERTION. Plant the same canary inside `content/pilot-review`. Both scanners
 *   must PASS, because the directory is excluded.
 *
 * The canary is created and removed within one run and is never committed.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PILOT_DIR = join(ROOT, 'content/pilot-review');
const PROBE_DIR = join(ROOT, 'content/__pilot-exclusion-probe');
const CANARY = '__pilot-exclusion-canary.json';

/**
 * Trips BOTH scanners at once:
 *   - `kind` is not in validate:content's discriminated union → invalid discriminator;
 *   - "wrong" is a D1 banned child-facing word → scan:vocab flags it.
 */
const CANARY_BODY = JSON.stringify(
  {
    kind: 'not-a-real-content-kind',
    note: 'Temporary canary for check:pilot-exclusion. If this file is committed, the check crashed — delete it.',
    probe: 'this sentence contains the wrong word on purpose',
  },
  null,
  2,
);

type ScannerResult = { name: string; passed: boolean };

function runScanner(script: string): ScannerResult {
  try {
    execFileSync('pnpm', [script], { cwd: ROOT, stdio: 'pipe' });
    return { name: script, passed: true };
  } catch {
    return { name: script, passed: false };
  }
}

function withCanaryIn(dir: string, fn: () => ScannerResult[]): ScannerResult[] {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, CANARY);
  writeFileSync(path, CANARY_BODY);
  try {
    return fn();
  } finally {
    rmSync(path, { force: true });
    if (dir === PROBE_DIR) rmSync(dir, { recursive: true, force: true });
  }
}

function main(): void {
  // A crashed earlier run could have left one behind; never scan against stale state.
  rmSync(join(PILOT_DIR, CANARY), { force: true });
  rmSync(PROBE_DIR, { recursive: true, force: true });

  const scanners = ['validate:content', 'scan:vocab'];

  // PHASE 1 — is the canary still a valid probe?
  const probe = withCanaryIn(PROBE_DIR, () => scanners.map(runScanner));
  const blind = probe.filter((r) => r.passed);
  if (blind.length > 0) {
    console.log('PROBE DEAD — this check cannot verify anything, so it fails rather than reassuring.');
    for (const r of blind) {
      console.log(`  ✗ ${r.name} PASSED on a canary planted in a NON-excluded directory.`);
    }
    console.log('\nThe canary no longer trips that scanner, so its silence in content/pilot-review');
    console.log('would prove nothing. Update CANARY_BODY in this script so it trips again.');
    process.exit(1);
  }
  console.log(`probe valid: both scanners reject the canary outside the exclusion (${probe.length}/${probe.length})`);

  // PHASE 2 — the assertion.
  const guarded = withCanaryIn(PILOT_DIR, () => scanners.map(runScanner));
  const leaking = guarded.filter((r) => !r.passed);
  if (leaking.length > 0) {
    console.log('\nFAILING: content/pilot-review is no longer excluded from a content scanner.');
    for (const r of leaking) console.log(`  ✗ ${r.name} scanned a file inside content/pilot-review`);
    console.log('\nThe fix is to RESTORE THE EXCLUSION, not to change the pilot content:');
    console.log('  validate:content → GENERATED_DIRS  in scripts/validate-content.ts');
    console.log('  scan:vocab       → EXCLUDED_PATHS  in scripts/scan-vocab.mjs');
    console.log('Pilot batches are gated by scripts/lib/pilot-review.ts (checkItemChildFacing on');
    console.log('every write), which is narrower and correct — not by these two scanners.');
    process.exit(1);
  }

  console.log(`exclusion intact: both scanners skip content/pilot-review (${guarded.length}/${guarded.length})`);
  console.log('CLEAN');
}

main();
