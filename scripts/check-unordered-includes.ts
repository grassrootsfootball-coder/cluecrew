/**
 * NO RELATION IS READ WITHOUT AN ORDER — `pnpm check:unordered-includes`
 *
 * **PHYSICAL ROW ORDER IS NOT AN ORDER** (R186/R187). Prisma's `include: { options: true }` returns
 * related rows in whatever order Postgres hands back, which no query guarantees and which any write
 * disturbs — an UPDATE writes a new tuple version and moves the row. The serving path fed exactly
 * that array into a seeded Fisher–Yates shuffle, so **one write to one option re-permuted every
 * child's letters for that item**, silently, with the seed unchanged. Demonstrated on the fixture,
 * not argued.
 *
 * Sealing the ten reads fixed today. **This is what stops the eleventh re-opening it**, and it is
 * the same move as making the carriage registry RESOLVE against the schema rather than asking people
 * to remember: a discipline nobody can forget is the only kind that survives a month.
 *
 * **IT READS EVERY RELATION, NOT ONLY `options`.** The fault is Prisma's default, not a fact about
 * that one relation, and a check named for the instance would miss the next one. `Item.options` is
 * where it has bitten; `Case.caseFiles`, `Misconception.options` and every other list-valued include
 * carry the same defect one consumer away.
 *
 * WHAT IT CANNOT SEE, PRINTED EVERY RUN: a relation ordered by a column that does not TOTALLY order
 * it. `orderBy: { clusterPosition: 'asc' }` alone leaves ties in physical order, which is the same
 * fault with a tiebreak missing. This asserts that an order was ASKED FOR, never that it is total.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const REPO = resolve(import.meta.dirname, '..');
const ROOTS = ['apps/web', 'scripts', 'packages/db'];
const SKIP = new Set(['node_modules', '.next', 'dist', 'coverage', 'test-results', 'playwright-report', 'migrations']);

/**
 * `<relation>: true` inside an `include`. The bare `true` is the whole fault: it says "give me the
 * rows" and never "in this order". A relation read as `{ orderBy: ... }` or `{ select: ..., orderBy }`
 * has asked a question this check is satisfied by.
 */
const BARE_INCLUDE = /\binclude:\s*\{([^{}]|\{[^{}]*\})*\}/g;
const BARE_RELATION = /(\w+):\s*true\b/g;

/** Relations that are single-valued — `true` on a to-ONE relation cannot be misordered. */
const TO_ONE = new Set([
  'questionType', 'misconception', 'item', 'case', 'child', 'parent', 'word',
  'subscription', 'passage', 'template', 'reviewer', 'session', 'blueprint',
]);

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (SKIP.has(entry)) continue;
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
    }
  };
  for (const r of ROOTS) walk(join(REPO, r));
  return out;
}

/**
  * COMMENTS ARE STRIPPED BEFORE MATCHING, and the reason is that this file failed ITSELF on its
  * first run: its own docstring quotes `include: { options: true }` as the example of the fault.
  * A gate that flags prose about the fault is a gate someone switches off within a week — R181's
  * measured narrowing, arriving unbidden in the very next check.
  */
const STRIP_COMMENTS = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));

interface Hit { file: string; line: number; relation: string; text: string }

function main(): void {
  const files = sourceFiles();
  requirePopulation('check:unordered-includes', { 'source files scanned': files.length });

  const hits: Hit[] = [];
  let includesSeen = 0;
  for (const file of files) {
    // Whitespace-preserving strip, so reported line numbers stay true to the file.
    const src = STRIP_COMMENTS(readFileSync(file, 'utf8'));
    for (const block of src.matchAll(BARE_INCLUDE)) {
      includesSeen += 1;
      for (const rel of block[0].matchAll(BARE_RELATION)) {
        const name = rel[1]!;
        if (TO_ONE.has(name)) continue;
        hits.push({
          file: relative(REPO, file),
          line: src.slice(0, block.index).split('\n').length,
          relation: name,
          text: block[0].replace(/\s+/g, ' ').slice(0, 100),
        });
      }
    }
  }

  console.log(`check:unordered-includes: ${files.length} source file(s) · ${includesSeen} include block(s) read.\n`);
  console.log(`  ${TO_ONE.size} relation name(s) declared TO-ONE and skipped: a single row cannot be`);
  console.log('  misordered. That list is a declaration, so a to-many relation wrongly on it is a');
  console.log('  hole — and a to-one relation missing from it costs one false failure, not a silent pass.\n');

  if (hits.length === 0) {
    /**
     * ZERO HITS IS A CLEAN PASS, NOT AN EMPTY POPULATION, and reaching for `declareMayBeEmpty` here
     * was my own misuse of R61 on the first run. The POPULATION is the source files, asserted above
     * by `requirePopulation`; the hits are the FINDINGS. Declaring findings "legitimately empty"
     * would announce that nothing was screened on precisely the run where everything was.
     */
    console.log('  Every list-valued relation include asks for an order. Nothing reads physical row');
    console.log(`  order, across ${files.length} files and ${includesSeen} include blocks.`);
  } else {
    console.log(`  ${hits.length} RELATION(S) READ WITHOUT AN ORDER:`);
    for (const h of hits) console.log(`    x ${h.file}:${h.line}  ${h.relation}  —  ${h.text}`);
    console.log('\n    Physical row order is not an order. Add `orderBy` — `{ id: \'asc\' }` unless the');
    console.log('    relation has its own authored order. See R186/R187: one write moved every letter.');
  }

  console.log('\n  LIMIT: this asserts an order was ASKED FOR, never that it is TOTAL. `orderBy:');
  console.log('  { clusterPosition: \'asc\' }` with ties left over is the same fault with a tiebreak');
  console.log('  missing, and reads as clean here.');

  process.exit(hits.length === 0 ? 0 : 1);
}

main();
