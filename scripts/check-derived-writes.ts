/**
 * A WRITER THAT COMPUTES ITS VALUES MUST CLASSIFY BEFORE IT WRITES — `pnpm check:derived-writes`
 *
 * "Guarded" is a property of the WRITE PATH, not an entry on a list of files someone keeps current
 * (annie, 2026-08-12). This reads the source: any file that both writes to a content table AND
 * computes what it writes through a derivation function must call `classifyDerivedWrites`. A new
 * script that derives and writes fails here on the commit that adds it, rather than the day it
 * rewrites something a reviewer approved.
 *
 * WHY *COMPUTED* AND NOT "REVIEWABLE", which is where this started. Measured across the 53 content
 * writers, 42 write reviewable fields — the number went UP, not down, and that is the finding.
 * Most of those scripts exist precisely to change reviewed content: they transcribe a written
 * ruling into `childHint`, `description` or a walk script. They ARE the re-review that the guard
 * tells you to go and do. Guarding all 42 would leave thirty-odd doors permanently running with
 * the override on, which makes the override the norm and the guard decorative.
 *
 * The line that survives is WHO AUTHORED THE VALUE:
 *   · a DERIVATION FUNCTION computed it — the value can change because code changed, with no
 *     human deciding anything. This is the class that must classify first. Two doors: `seed.ts`
 *     and `generate-content.ts`.
 *   · a HUMAN RULING supplied it — the value changes because a reviewer said so. That is the
 *     review path working, and it needs no guard; it needs provenance, which it already has.
 *
 * Flag columns, status and scaffolding are out of scope entirely: 11 of the 53 writers touch
 * nothing a child reads.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const ROOT = resolve(import.meta.dirname, '..');
const SCAN = ['scripts', 'packages/db/prisma', 'packages/db/src', 'apps/web/lib'];

/**
 * Functions that COMPUTE a child-facing value. A caller of one of these is deriving, not
 * transcribing. Read from the source rather than restated: each must exist as an export.
 */
const DERIVATION_FUNCTIONS = [
  'buildDerivedVrDistractors',
  'selectVr04Distractors',
  'seedDerived',
  'assembleItem',
  'assembleSpagItem',
];

const CONTENT_WRITE = /prisma\.(item|itemOption|word|misconception|case)\.(create|createMany|update|updateMany|upsert)\s*\(/;
const GUARD_CALL = /classifyDerivedWrites\s*\(/;

/** Strip comments and strings, so a function NAMED in prose is not read as a call. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'migrations' || entry.name === 'e2e') continue;
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) out.push(full);
  }
  return out;
}

function main(): void {
  const files = SCAN.flatMap((d) => walk(join(ROOT, d)));
  requirePopulation('check:derived-writes', { 'source files scanned': files.length });

  // CANARY: the derivation functions must still exist under those names, or every file would
  // read as "not deriving" and this check would pass over a repo it had stopped understanding.
  // Searched across core AND the scanned trees: `seedDerived` is a local helper in seed.ts, not a
  // core export, and a canary that only looked at core would have declared it missing (it did).
  const declared = [...walk(join(ROOT, 'packages/core/src')), ...files]
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const missing = DERIVATION_FUNCTIONS.filter(
    (fn) => !new RegExp(`(export )?(function|const)\\s+${fn}\\b`).test(declared),
  );
  if (missing.length > 0) {
    console.error('CHECK ABORTED: these derivation functions no longer exist under these names:');
    for (const fn of missing) console.error(`  ${fn}`);
    console.error('Every writer would read as non-deriving and this check would assert nothing.');
    process.exit(1);
  }

  const derivingWriters: Array<{ file: string; fns: string[]; guarded: boolean }> = [];
  for (const file of files) {
    const source = code(readFileSync(file, 'utf8'));
    if (!CONTENT_WRITE.test(source)) continue;
    const fns = DERIVATION_FUNCTIONS.filter((fn) => new RegExp(`\\b${fn}\\s*\\(`).test(source));
    if (fns.length === 0) continue;
    derivingWriters.push({ file: relative(ROOT, file), fns, guarded: GUARD_CALL.test(source) });
  }

  const unguarded = derivingWriters.filter((w) => !w.guarded);
  console.log(`  ${derivingWriters.length} writer(s) compute what they write:`);
  for (const w of derivingWriters) {
    console.log(`    ${w.guarded ? 'guarded  ' : 'UNGUARDED'} ${w.file} — calls ${w.fns.join(', ')}`);
  }

  if (unguarded.length > 0) {
    console.error(`\nDERIVED-WRITE GUARD MISSING on ${unguarded.length} file(s):`);
    for (const w of unguarded) console.error(`  ✗ ${w.file} calls ${w.fns.join(', ')} and writes content`);
    console.error(
      '\nA writer that COMPUTES a child-facing value can change that value because CODE changed,\n' +
        'with no human deciding anything — so it must call classifyDerivedWrites() and refuse to\n' +
        'alter a reviewed row (packages/db/prisma/reviewed-guard.ts). Transcribing a human ruling\n' +
        'is different and needs no guard. If this file only NAMES a derivation function in prose,\n' +
        'the comment stripper should have caught it — fix the stripper, not the rule.',
    );
    process.exit(1);
  }
  console.log('Derived-write guard: every writer that computes its values classifies before writing.');
}

main();
