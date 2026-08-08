/**
 * EXPORT FRESHNESS CHECKER — `pnpm check:export-freshness [file]`
 *
 * A stamp is inert without a comparison — that is what let a stale export reach
 * Cowork while the delivered file was correct (corpus-decisions Entry 40). This
 * reads an export file, REBUILDS the current source with the same shared
 * builder the export used, and reports whether the file's `sourceHash` still
 * matches. A missing hash is a failure, not a pass — an unstamped file is
 * exactly the stale one we could not detect.
 *
 * With no argument it scans the outbound folder and checks every file of a
 * known kind. Exits non-zero if any file is stale or unstamped, so it can gate
 * a ship.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { OUTBOUND_DIR, freshnessStamp } from './lib/export-destination';
import { buildFreeTenSource } from './lib/vr-free-ten-source';
import { buildMathsMisconceptionsSource } from './lib/maths-misconceptions-source';
import { buildCalibration } from './lib/maths-calibration-source';
import { NVR_FAMILIES, buildNvrSignoffFamilySource } from './lib/nvr-signoff-source';
import { buildVrAuditSource, buildVrMisconceptionDefsSource, buildVrPatternSource } from './lib/vr-audit-source';
import { buildReviewerStatusSource } from './export-reviewer-status';
import { buildNvrHintsToRewordSource } from './export-nvr-hints-to-reword';
import { buildProposedQueueSource } from './export-proposed-misconceptions';
import { buildMisconceptionLibrarySource } from './export-misconception-library';
import { buildFamilyStatusSource } from './export-family-status';
import { buildExecutorCoverageSource } from './export-maths-executor-coverage';
import { buildReimportBundleSource } from './export-vr-reimport-bundle';
import { prisma } from '../packages/db/src/index';

/**
 * WHICH KINDS ARE STATUS SNAPSHOTS (annie, 2026-08-08).
 *
 * A content artefact that goes stale is a stale copy. A STATUS artefact that goes stale is a wrong
 * instruction about what to work on, and it looks identical to a right one. So a status kind with
 * no builder is not a gap in tidiness — it is an artefact that CANNOT be checked, and the scan used
 * to skip those silently as UNKNOWN-KIND. It now reports them.
 */
const STATUS_KINDS = new Set([
  'reviewer-status',
  'family-status',
  'misconceptions-proposed-queue',
  'misconception-library-current',
  'maths-gap-families',
  'maths-misconceptions-approved',
  'maths-executor-coverage',
  'maths-hints-to-reword',
  // NOTE: maths-hints-to-reword is built from an external seed .md passed on argv, not from repo
  // state, so it can never be rebuilt here. Its work is complete (all 20 hints are in the library
  // and clean), and it has been retired from the drop rather than left reading as a live work order.
  'nvr-hints-to-reword',
  'vr-reimport-bundle',
]);

/**
 * Kinds that are FORMS, not snapshots — a blank template the reviewer fills in and sends back.
 * A form describes nothing, so it can never be stale; it can only be SPENT. `review-decisions` sat
 * in the status set at first, which was wrong in a way worth naming: the test is not "does this
 * file go out of date" but "does it assert something about current state". A blank form asserts
 * nothing.
 */
const FORM_KINDS = new Set(['review-decisions']);

const VR_PATTERN_SPECS = [
  { questionTypeId: 'vr-04-closest-meaning', sampleSize: 20, seed: 'vr04-pattern-2026-08' },
  { questionTypeId: 'vr-07-letters-for-numbers', sampleSize: 20, seed: 'vr07-pattern-2026-08' },
];

/** kind → how to rebuild the source this export hashed. Extend as exports adopt the stamp. */
const BUILDERS: Record<string, () => Promise<unknown>> = {
  'vr-free-ten-item-bank': () => buildFreeTenSource(prisma),
  'vr-review-pack': () => buildFreeTenSource(prisma),
  'maths-misconceptions-approved': () => buildMathsMisconceptionsSource(prisma),
  'maths-gap-families': async () => buildCalibration().families,
  'maths-calibration-pack': async () => buildCalibration().items,
  // One kind per NVR engine-family file (nvr-signoff-machine, -lineup, …).
  ...Object.fromEntries(NVR_FAMILIES.map((fam) => [fam.kind, () => buildNvrSignoffFamilySource(prisma, fam.key)])),
  'vr-audit-sample': () => buildVrAuditSource(prisma),
  'vr-pattern-sample': () => buildVrPatternSource(prisma, VR_PATTERN_SPECS),
  'vr-misconception-defs': () => buildVrMisconceptionDefsSource(prisma),
  'reviewer-status': () => buildReviewerStatusSource(prisma),
  'nvr-hints-to-reword': () => buildNvrHintsToRewordSource(prisma).then((h) => h.map((x) => ({ id: x.id, hint: x.childHint, faults: x.faults }))),
  'misconceptions-proposed-queue': () => buildProposedQueueSource(prisma),
  'misconception-library-current': () => buildMisconceptionLibrarySource(prisma),
  'family-status': () => buildFamilyStatusSource(prisma),
  'maths-executor-coverage': () => buildExecutorCoverageSource(prisma),
  'vr-reimport-bundle': () => buildReimportBundleSource(prisma),
};

type Verdict = 'CURRENT' | 'STALE' | 'UNSTAMPED' | 'UNKNOWN-KIND' | 'UNCHECKABLE-STATUS' | 'FORM' | 'UNREADABLE';

async function checkFile(path: string): Promise<{ verdict: Verdict; detail: string }> {
  let doc: { kind?: string; sourceHash?: string };
  try {
    doc = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { verdict: 'UNREADABLE', detail: 'not valid JSON' };
  }
  const kind = doc.kind ?? '(none)';
  const builder = doc.kind ? BUILDERS[doc.kind] : undefined;
  if (!builder) {
    if (FORM_KINDS.has(kind)) return { verdict: 'FORM', detail: `kind "${kind}" is a blank form, not a snapshot — it cannot go stale` };
    // A status artefact with no builder is the dangerous case, never a skip.
    return STATUS_KINDS.has(kind)
      ? { verdict: 'UNCHECKABLE-STATUS', detail: `kind "${kind}" is a STATUS snapshot with no source builder — staleness cannot be detected` }
      : { verdict: 'UNKNOWN-KIND', detail: `kind "${kind}" has no source builder` };
  }
  if (!doc.sourceHash) return { verdict: 'UNSTAMPED', detail: `kind "${kind}" carries no sourceHash` };
  const current = freshnessStamp(await builder(), 'n/a').sourceHash;
  return doc.sourceHash === current
    ? { verdict: 'CURRENT', detail: `sourceHash ${current}` }
    : { verdict: 'STALE', detail: `file ${doc.sourceHash} ≠ current ${current} — re-run the export` };
}

async function main(): Promise<void> {
  const arg = process.argv.slice(2).find((a) => a.endsWith('.json'));
  const files = arg
    ? [arg]
    : readdirSync(OUTBOUND_DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => join(OUTBOUND_DIR, f));

  let failed = 0;
  let checked = 0;
  for (const file of files) {
    const { verdict, detail } = await checkFile(file);
    if (verdict === 'UNKNOWN-KIND' && !arg) continue; // scanning: silently skip non-exports
    checked += 1;
    const bad = verdict === 'STALE' || verdict === 'UNSTAMPED' || verdict === 'UNREADABLE' || verdict === 'UNCHECKABLE-STATUS';
    if (bad) failed += 1;
    console.log(`  ${bad ? '✗' : verdict === 'CURRENT' ? '✓' : '·'} ${verdict.padEnd(19)} ${basename(file)} — ${detail}`);
  }

  console.log(`\n${checked} checkable file(s), ${failed} stale or unstamped.`);
  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

void main();
