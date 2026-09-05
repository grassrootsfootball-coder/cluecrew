/**
 * check:execution-not-child-facing — THE ANSWER TO HER QUERY, KEPT ANSWERED (R1009).
 *
 * Her 231st: *"whether a field is child-facing is answered by naming its surfaces, not by its
 * position on a row."* The query was run and the answer was NONE — so the five blanks became this
 * store's to write. **A fact that is true when it is established is the one that rots silently**
 * (R180), and this one licenses a store to write child-adjacent content, so it gets an assertion
 * rather than a sentence in a register entry.
 *
 * **THE FIELD IS LOADED ON THE CHILD PATH AND PROJECTED AWAY.** The orchestrator and the clue-tap
 * route both `include` every option column and then map to a narrow shape. That is correct today
 * and it is one careless edit from being wrong — `options.map((o) => ({ ...o }))` would serve it —
 * so the check reads the PROJECTIONS, not the includes.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
const FIELD = 'misconceptionExecution';
/** Surfaces a child can reach. Everything under admin/ or api/admin is staff by construction. */
const isStaff = (p: string) => /\/admin\/|\/api\/admin\/|\/e2e\/|\.test\.tsx?$/.test(p);
/** A projection that spreads an option carries every column, this field included. */
const SPREADS_AN_OPTION = /options\s*[.:][\s\S]{0,80}?\.map\(\s*\(?\s*(\w+)\s*\)?\s*=>\s*\(?\s*\{\s*\.\.\.\1/;

function files(dir: string, out: string[] = []): string[] {
  if (!statSync(dir).isDirectory()) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.tsx?$/.test(e)) out.push(full);
  }
  return out;
}

function main() {
  console.log('check:execution-not-child-facing — no child surface renders an execution (her 231st, answered by query).');
  assertFixture('execution-audience', [
    { name: 'a child page renders the field', input: 'apps/web/app/crew/x.tsx::<td>{o.misconceptionExecution}</td>', mustBeCaught: true },
    { name: 'a child route spreads an option wholesale', input: 'apps/web/app/api/story/r.ts::options: opts.map((o) => ({ ...o, label: l }))', mustBeCaught: true },
    { name: 'an admin page renders the field', input: 'apps/web/components/admin/review.tsx::<td>{o.misconceptionExecution}</td>', mustBeCaught: false },
    { name: 'a child route projects narrowly', input: 'apps/web/app/api/story/r.ts::options: opts.map((o) => ({ id: o.id, label: l }))', mustBeCaught: false },
  ], (raw) => {
    const [path, src] = raw.split('::') as [string, string];
    if (isStaff(path)) return false;
    return src.includes(FIELD) || SPREADS_AN_OPTION.test(src);
  });

  const all = files(pjoin(REPO, 'apps', 'web'));
  requirePopulation('check:execution-not-child-facing', { 'web file(s) screened': all.length });

  const renders: string[] = []; const spreads: string[] = []; const staff: string[] = [];
  for (const f of all) {
    const rel = f.replace(`${REPO}/`, '');
    const src = readFileSync(f, 'utf8');
    if (src.includes(FIELD)) { (isStaff(rel) ? staff : renders).push(rel); }
    if (!isStaff(rel) && SPREADS_AN_OPTION.test(src)) spreads.push(rel);
  }

  console.log(`  ${all.length} file(s) screened. ${staff.length} STAFF surface(s) name the field — that is where it belongs:`);
  for (const s of staff) console.log(`    ${s}`);
  if (renders.length === 0 && spreads.length === 0) {
    console.log('\n  NO child-facing surface names it, and no child projection spreads an option wholesale.');
    console.log('  The query her 231st asked stays answered: an execution is staff text, so the store writes it.');
    return;
  }
  console.error(`\n  REFUSED — the answer to her 231st has changed:`);
  for (const r of renders) console.error(`    RENDERS the field on a child surface: ${r}`);
  for (const s of spreads) console.error(`    SPREADS an option wholesale on a child path: ${s}`);
  console.error('\n  If a child-facing surface renders an execution, the field is child-facing and the five');
  console.error('  blanks — and every execution since — hold for the reviewer. Do not repair this quietly.');
  process.exitCode = 1;
}
main();
