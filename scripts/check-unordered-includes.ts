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
 * WHICH NAMES ARE TO-MANY RELATIONS IS READ FROM THE SCHEMA, NEVER LISTED (R57, R1065). A field whose
 * type is `<Model>[]` is list-valued; reading it without `orderBy` returns physical row order. The
 * first version matched `include: { x: true }` only, with a hand-kept TO-ONE skip list and a regex
 * that could not see past one level of nesting — so it read 18 blocks in 864 files, and missed
 * `select: { options: { select: {...} } }`, the read that let check:verdict-option-last report 200
 * faults on a correctly served card (R1053).
 */
function toManyRelations(): Set<string> {
  const schema = readFileSync(join(REPO, 'packages/db/prisma/schema.prisma'), 'utf8');
  const models = new Set([...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]!));
  const out = new Set<string>();
  for (const m of schema.matchAll(/^\s+(\w+)\s+(\w+)\[\]/gm)) if (models.has(m[2]!)) out.add(m[1]!);
  return out;
}

/** Index of the brace closing the one at `open`, skipping strings and template literals. */
function closeOf(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i]!;
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}

/** The top-level `key: value` entries of the object literal spanning [open, close]. */
function entries(src: string, open: number, close: number): Array<{ key: string; at: number; value: string; valueAt: number }> {
  const out: Array<{ key: string; at: number; value: string; valueAt: number }> = [];
  let i = open + 1;
  while (i < close) {
    const m = /^[\s,]*(\w+)\s*:\s*/.exec(src.slice(i, close));
    if (!m) {
      // Not a `key:` entry (a spread, a shorthand) — skip to the next top-level comma.
      let d = 0; for (; i < close; i++) { const c = src[i]; if (c === '{' || c === '(' || c === '[') d++; else if (c === '}' || c === ')' || c === ']') d--; else if (c === ',' && d === 0) { i++; break; } }
      continue;
    }
    const key = m[1]!; const at = i + m[0].indexOf(key); const valueAt = i + m[0].length;
    let j = valueAt; let d = 0;
    for (; j < close; j++) {
      const c = src[j]!;
      if (c === '"' || c === "'" || c === '`') { for (j++; j < close && src[j] !== c; j++) if (src[j] === '\\') j++; continue; }
      if (c === '{' || c === '(' || c === '[') d++;
      else if (c === '}' || c === ')' || c === ']') d--;
      else if (c === ',' && d === 0) break;
    }
    out.push({ key, at, value: src.slice(valueAt, j).trim(), valueAt });
    i = j + 1;
  }
  return out;
}

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

  const TO_MANY = toManyRelations();
  if (!TO_MANY.has('options')) throw new Error('check:unordered-includes: the schema read found no `options` relation — the reader is broken, not the code (R173)');
  const hits: Hit[] = [];
  let includesSeen = 0;
  for (const file of files) {
    // Whitespace-preserving strip, so reported line numbers stay true to the file.
    const src = STRIP_COMMENTS(readFileSync(file, 'utf8'));
    const lineOf = (at: number) => src.slice(0, at).split('\n').length;
    /** Walk one include/select object: flag unordered to-many reads, and descend into nested ones. */
    const walk = (open: number): void => {
      const close = closeOf(src, open);
      if (close < 0) return;
      includesSeen += 1;
      for (const e of entries(src, open, close)) {
        if (!TO_MANY.has(e.key)) continue;
        if (e.value === 'true') {
          hits.push({ file: relative(REPO, file), line: lineOf(e.at), relation: e.key, text: `${e.key}: true` });
        } else if (e.value.startsWith('{')) {
          const inner = entries(src, e.valueAt, closeOf(src, e.valueAt));
          if (!inner.some((x) => x.key === 'orderBy')) {
            hits.push({ file: relative(REPO, file), line: lineOf(e.at), relation: e.key, text: `${e.key}: ${e.value.replace(/\s+/g, ' ').slice(0, 80)}` });
          }
          for (const x of inner) if ((x.key === 'select' || x.key === 'include') && x.value.startsWith('{')) walk(x.valueAt);
        }
      }
      // Nested to-ONE relations carry their own select/include, which may reach a to-many one.
      for (const e of entries(src, open, close)) {
        if (TO_MANY.has(e.key) || !e.value.startsWith('{')) continue;
        for (const x of entries(src, e.valueAt, closeOf(src, e.valueAt))) if ((x.key === 'select' || x.key === 'include') && x.value.startsWith('{')) walk(x.valueAt);
      }
    };
    // Only the OUTERMOST select/include of a query is a root; nested ones are reached by the walk.
    const roots = [...src.matchAll(/\b(include|select)\s*:\s*\{/g)].map((m) => m.index! + m[0].length - 1);
    const covered: Array<[number, number]> = [];
    for (const open of roots) {
      if (covered.some(([a, b]) => open > a && open < b)) continue;
      const close = closeOf(src, open);
      if (close < 0) continue;
      covered.push([open, close]);
      walk(open);
    }
  }

  console.log(`check:unordered-includes: ${files.length} source file(s) · ${includesSeen} include/select object(s) read; ${TO_MANY.size} to-many relation name(s) read from schema.prisma.\n`);
  console.log('  A to-many relation is read with `orderBy` or it is a hit, whether it sits in an `include` or a');
  console.log('  `select`, at any depth. `where: { x: { some } }` is a filter, not a read, and is not walked.\n');

  if (hits.length === 0) {
    /**
     * ZERO HITS IS A CLEAN PASS, NOT AN EMPTY POPULATION, and reaching for `declareMayBeEmpty` here
     * was my own misuse of R61 on the first run. The POPULATION is the source files, asserted above
     * by `requirePopulation`; the hits are the FINDINGS. Declaring findings "legitimately empty"
     * would announce that nothing was screened on precisely the run where everything was.
     */
    console.log('  Every list-valued relation include asks for an order. Nothing reads physical row');
    console.log(`  order, across ${files.length} files and ${includesSeen} include/select objects.`);
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
