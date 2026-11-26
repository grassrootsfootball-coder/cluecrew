/**
 * SHIPPED CODE RUNS PARAMETERISED SQL ONLY — `pnpm check:raw-sql` (R1075)
 *
 * Prisma's tagged template (`prisma.$queryRaw\`… ${x}\``) sends `x` as a bound parameter. The
 * `*Unsafe` variants, `Prisma.raw()`, and `$queryRaw(`/`$executeRaw(` called as a FUNCTION take a
 * string the caller built, which is how user input becomes SQL. None of those appear in apps/ or
 * packages/ today (measured 2026-11-26: two raw queries, both tagged templates); this keeps it so.
 *
 * Out of scope, deliberately: `scripts/`. Those run locally by hand against fixed SQL text
 * (`check-db-invariants.ts`, `lib/cut-stamp.ts`, `emit-library-window-answer.ts`) and take no input
 * from a request. A script that ever becomes reachable from the app moves into scope by moving.
 *
 * CANARY: the patterns are run against planted positives before the scan. If a pattern stops
 * matching what it exists to find, the check aborts instead of reporting a clean repo it can no
 * longer see (R60 Q2).
 */
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';
import { stripComments, walkSource } from './lib/source-walk';

const ROOT = resolve(import.meta.dirname, '..');
const SCAN = ['apps', 'packages'];

const UNSAFE: Array<{ name: string; re: RegExp }> = [
  { name: '$queryRawUnsafe / $executeRawUnsafe', re: /\$(query|execute)RawUnsafe\s*[<(]/ },
  { name: 'Prisma.raw()', re: /\bPrisma\.raw\s*\(/ },
  { name: '$queryRaw / $executeRaw called as a function (not a tagged template)', re: /\$(query|execute)Raw\s*(<[^>`]*>)?\s*\(/ },
];

const PLANTED = [
  'await prisma.$queryRawUnsafe(`select * from "Item" where id = ${id}`)',
  'await db.$executeRawUnsafe<number>(sql)',
  'prisma.$queryRaw(Prisma.raw(sql))',
  'prisma.$queryRaw<Row[]>(sql)',
];
const SAFE = ['await prisma.$queryRaw`SELECT 1`', 'await prisma.$queryRaw<Array<{ id: string }>>`select id from "Item" where x = ${x}`'];

function main(): void {
  const blind = PLANTED.filter((s) => !UNSAFE.some((p) => p.re.test(s)));
  const overeager = SAFE.filter((s) => UNSAFE.some((p) => p.re.test(s)));
  if (blind.length || overeager.length) {
    console.error('check:raw-sql ABORTED — the patterns no longer separate unsafe from safe SQL.');
    for (const s of blind) console.error(`  MISSED planted unsafe call: ${s}`);
    for (const s of overeager) console.error(`  FLAGGED a parameterised call: ${s}`);
    process.exit(1);
  }

  const files = SCAN.flatMap((d) => walkSource(join(ROOT, d)));
  let rawCalls = 0;
  const faults: string[] = [];
  for (const f of files) {
    const lines = stripComments(readFileSync(f, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (/\$(query|execute)Raw/.test(line)) rawCalls++;
      for (const p of UNSAFE) if (p.re.test(line)) faults.push(`${relative(ROOT, f)}:${i + 1} — ${p.name}`);
    });
  }
  requirePopulation('check:raw-sql', { 'shipped source files (apps/, packages/)': files.length });
  console.log(`  ${rawCalls} raw-SQL call site(s) found in shipped code.`);
  if (faults.length) {
    console.error(`\nUNPARAMETERISED SQL in shipped code (${faults.length}):`);
    for (const x of faults) console.error(`  ✗ ${x}`);
    console.error('\nUse the tagged template — prisma.$queryRaw`… ${value}` — so values travel as bound parameters.');
    process.exit(1);
  }
  console.log('Raw SQL: every raw query in shipped code is a parameterised tagged template.');
}

main();
