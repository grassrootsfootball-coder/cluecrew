/**
 * A SIGNATURE IS WRITTEN THROUGH ONE DOOR, AND THAT DOOR NAMES A PERSON — `pnpm check:signing-doors`
 *
 * 46 signatures resolved to a role account rather than a human. annie raised it at 13, 33 and 46
 * signatures — the one item that gets worse purely by waiting, and the sixteen clusters will
 * produce more. R65 (2/3) fixed the history; this stops the next signature being written the same
 * way.
 *
 * Same shape as `check:derived-writes`: the property lives on the WRITE PATH, not in a policy
 * someone has to remember. Any file writing `action: 'SIGNED'` must go through `recordSignature`,
 * which refuses a signature whose `reviewerId` does not resolve to a Reviewer row. A new signing
 * door fails here on the commit that adds it.
 *
 * TWO CLASSES ARE DECLARED, not inferred:
 *   · HISTORICAL — a one-shot applier that has already run. Its signatures are in the backfill and
 *     re-running it would not create new ones. Listed with the sitting it applied.
 *   · READER — a file that only QUERIES for SIGNED events. It matches the same string and writes
 *     nothing, so requiring the door of it would be nonsense.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const ROOT = resolve(import.meta.dirname, '..');
const SCAN = ['scripts', 'packages/db', 'apps/web/lib'];

/** Writes a SIGNED event, already run, its signatures now in the R65 backfill. */
const HISTORICAL: Record<string, string> = {
  'scripts/apply-spag-signatures.ts': 'the SPaG signing sitting, 2026-08-08 (14 signatures)',
  'scripts/apply-maths-template-signatures.ts': 'the maths template sitting, 2026-08-07 (19 signatures)',
  'scripts/backfill-attribution.ts': 'the handover backfill, 2026-08-06 (276 provenance events)',
};

/**
 * DETECTION IS BY EXCLUSION, after two narrower attempts failed in opposite directions. Matching
 * the bare literal called a file that only QUERIES signatures a signing door (crying wolf);
 * requiring a `data:` payload found ZERO writers and reported success (a blind run, caught only
 * because five known doors should have appeared). The shapes vary — `data:`, `create:` inside an
 * upsert, and object literals pushed into an array for createMany. So the rule is inverted: a
 * SIGNED literal is a WRITE unless it sits in a `where:` clause. `action: 'SIGNED'` in a where
 * — backfill-reviewer-identity.ts reads all 46 signatures to verify its evidence and separately
 * creates REASSIGNED events, and a looser match called it a signing door. A check that cries wolf
 * gets switched off.
 */
/** True when at least one `action: 'SIGNED'` is NOT inside a `where:` clause. */
function writesSigned(source: string): boolean {
  for (const m of source.matchAll(/action:\s*'SIGNED'/g)) {
    // Look back a short way: a query reads `where: { ... action: 'SIGNED'`, a write does not.
    const before = source.slice(Math.max(0, m.index! - 120), m.index!);
    if (!/where:\s*\{[^{}]*$/s.test(before)) return true;
  }
  return false;
}
const IS_WRITE = /attributionEvent\.(create|createMany|upsert|updateMany)\s*\(/;
const USES_DOOR = /recordSignature\s*\(/;

function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'migrations', 'e2e', '.next'].includes(entry.name)) continue;
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) out.push(full);
  }
  return out;
}

function main(): void {
  const files = SCAN.flatMap((d) => walk(join(ROOT, d)));
  requirePopulation('check:signing-doors', { 'source files scanned': files.length });

  // CANARY: the door must exist under this name, or every writer would read as compliant.
  const guard = readFileSync(join(ROOT, 'packages/db/prisma/reviewed-guard.ts'), 'utf8');
  if (!/export async function recordSignature\b/.test(guard)) {
    console.error('CHECK ABORTED: recordSignature no longer exists — nothing would be enforced.');
    process.exit(1);
  }

  const writers: Array<{ file: string; guarded: boolean; historical: string | null }> = [];
  let readers = 0;
  for (const file of files) {
    const source = code(readFileSync(file, 'utf8'));
    const rel = relative(ROOT, file);
    if (rel === 'packages/db/prisma/reviewed-guard.ts') continue; // the door itself
    const mentionsSigned = /action:\s*'SIGNED'/.test(source);
    if (!mentionsSigned) continue;
    if (!writesSigned(source) || !IS_WRITE.test(source)) {
      readers += 1; // queries SIGNED events; writes none
      continue;
    }
    writers.push({ file: rel, guarded: USES_DOOR.test(source), historical: HISTORICAL[rel] ?? null });
  }

  console.log(`  ${writers.length} writer(s) of SIGNED events · ${readers} reader(s) that only query them`);
  for (const w of writers) {
    const state = w.guarded ? 'via door ' : w.historical ? 'HISTORICAL' : 'UNGUARDED';
    console.log(`    ${state} ${w.file}${w.historical ? ` — ${w.historical}` : ''}`);
  }

  // A HISTORICAL entry naming a file that is not a writer is a STALE EXEMPTION — it covers
  // nothing while looking like considered policy. Two of the original five named files that only
  // query signatures.
  const stale = Object.keys(HISTORICAL).filter((f) => !writers.some((w) => w.file === f));
  for (const f of stale) {
    console.error(`  ✗ HISTORICAL names ${f}, which writes no signature — a stale exemption`);
  }

  const unguarded = writers.filter((w) => !w.guarded && !w.historical);
  if (unguarded.length > 0 || stale.length > 0) {
    if (unguarded.length > 0) console.error(`\nSIGNING DOOR BYPASSED by ${unguarded.length} file(s):`);
    for (const w of unguarded) console.error(`  ✗ ${w.file} writes action: 'SIGNED' directly`);
    console.error(
      "\nA signature names a PERSON. Write it through recordSignature (packages/db/prisma/\n" +
        'reviewed-guard.ts), which refuses a reviewerId that does not resolve to a Reviewer row.\n' +
        'If this file already ran and its signatures are in the R65 backfill, declare it in\n' +
        'HISTORICAL with the sitting it applied — do not add a bare exemption.',
    );
    process.exit(1);
  }
  console.log('Signing doors: every writer of a signature goes through the door or is declared historical.');
}

main();
