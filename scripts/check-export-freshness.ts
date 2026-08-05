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
import { buildVrAuditSource } from './lib/vr-audit-source';
import { prisma } from '../packages/db/src/index';

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
};

type Verdict = 'CURRENT' | 'STALE' | 'UNSTAMPED' | 'UNKNOWN-KIND' | 'UNREADABLE';

async function checkFile(path: string): Promise<{ verdict: Verdict; detail: string }> {
  let doc: { kind?: string; sourceHash?: string };
  try {
    doc = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { verdict: 'UNREADABLE', detail: 'not valid JSON' };
  }
  const kind = doc.kind ?? '(none)';
  const builder = doc.kind ? BUILDERS[doc.kind] : undefined;
  if (!builder) return { verdict: 'UNKNOWN-KIND', detail: `kind "${kind}" has no source builder` };
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
    const bad = verdict === 'STALE' || verdict === 'UNSTAMPED' || verdict === 'UNREADABLE';
    if (bad) failed += 1;
    console.log(`  ${bad ? '✗' : verdict === 'CURRENT' ? '✓' : '·'} ${verdict.padEnd(13)} ${basename(file)} — ${detail}`);
  }

  console.log(`\n${checked} checkable file(s), ${failed} stale or unstamped.`);
  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

void main();
