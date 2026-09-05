/**
 * check:derived-lists — A LIST BUILT BY FILTERING ANOTHER NAMES ITS PARENT (R1004).
 *
 * Mirrors `check:digest-carries-subject` (R985), which is the proven shape: screen the EMITTERS,
 * declare the backlog that predates the rule, and let the list only shrink.
 *
 * WHAT COUNTS AS NAMING ITS PARENT: `deriveList(` or `declareDerivation(` in the same file, or a
 * sibling `derivedFrom` field. A comment does not count — prose is what this replaces.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
/** A line that PUBLISHES a filtered array into an artefact: `someKey: xs.filter(...)`. */
const PUBLISHES_A_FILTER = /[A-Za-z_][\w]*\s*:\s*[\w.[\]()]+\s*\.filter\(/;
const NAMES_ITS_PARENT = /deriveList\(|declareDerivation\(|derivedFrom/;

function scripts(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) scripts(full, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function main() {
  console.log('check:derived-lists — a list built by filtering another names its parent and the narrowing rule.');
  assertFixture('derived-lists', [
    { name: 'publishes a filtered array with no parent named', input: 'const r = { KEPT: words.filter((w) => lex.knows(w)) };', mustBeCaught: true },
    { name: 'publishes a filtered array and names its parent', input: 'const d = deriveList(spec, words, p); const r = { KEPT: d.items, derivedFrom: d.derivedFrom };', mustBeCaught: false },
    { name: 'declares the derivation for a list built elsewhere', input: 'const r = { KEPT: xs.filter(p), how: declareDerivation(spec) };', mustBeCaught: false },
    { name: 'filters into a local, publishing nothing', input: 'const live = rows.filter((r) => r.status === "LIVE");', mustBeCaught: false },
  ], (src) => src.split('\n').some((l) => PUBLISHES_A_FILTER.test(l)) && !NAMES_ITS_PARENT.test(src));

  const files = scripts(pjoin(REPO, 'scripts')).concat(scripts(pjoin(REPO, 'packages', 'core', 'src')));
  requirePopulation('check:derived-lists', { 'file(s) screened': files.length });

  const faults: Array<{ file: string; line: number }> = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    if (NAMES_ITS_PARENT.test(src)) continue;
    src.split('\n').forEach((l, i) => { if (PUBLISHES_A_FILTER.test(l)) faults.push({ file: f.replace(`${REPO}/`, ''), line: i + 1 }); });
  }

  const BACKLOG = pjoin(REPO, 'content', 'derived-list-backlog.json');
  const declared: string[] = existsSync(BACKLOG) ? (JSON.parse(readFileSync(BACKLOG, 'utf8')) as { known: string[] }).known : [];
  const key = (x: { file: string; line: number }) => x.file;
  const known = new Set(declared);
  const fresh = faults.filter((x) => !known.has(key(x)));
  const stale = declared.filter((d) => !faults.some((x) => key(x) === d));

  if (process.argv.includes('--record')) {
    writeFileSync(BACKLOG, JSON.stringify({
      what: 'emitters that published a filtered array before R1004 named the rule. The check refuses anything NOT on this list; the list may only shrink.',
      rule: 'R1004 — a list built by filtering another names its parent, the parent\'s size, and the narrowing rule',
      recordedOn: '2026-09-05', known: [...new Set(faults.map(key))].sort(),
    }, null, 1));
    console.log(`  recorded ${new Set(faults.map(key)).size} known backlog file(s).`);
    return;
  }

  console.log(`  ${files.length} file(s) screened; ${faults.length} published filter(s) name no parent, in ${new Set(faults.map(key)).size} file(s); ${known.size} declared as backlog.`);
  if (stale.length) console.log(`  ${stale.length} backlog entr(ies) are STALE — repaired since recording. Re-record to shrink the list.`);
  if (fresh.length === 0) { console.log('  No NEW emitter publishes a filtered list without naming what it filtered.'); return; }
  console.error(`\n  REFUSED — ${new Set(fresh.map(key)).size} file(s) publish a filtered list with no parent named:`);
  for (const x of [...new Set(fresh.map(key))].slice(0, 15)) console.error(`    ${x}`);
  console.error('\n  A subset of a real population is indistinguishable from that population when a reader');
  console.error('  cannot see what was excluded (R595). Name it: deriveList(spec, parent, predicate).');
  process.exitCode = 1;
}
main();
