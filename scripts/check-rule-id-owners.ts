/**
 * check:rule-id-owners — TWO INSTRUMENTS UNDER ONE RULE ID ARE INDISTINGUISHABLE TO EVERY
 * CONSUMER, INCLUDING THE AUDITOR (R1006).
 *
 * The appropriateness screen and the ban list both emitted `rule: 'banned-vocabulary'`. **Nothing
 * downstream could tell them apart** — not a dashboard, not a triage, and not the script written to
 * re-derive the screen's own figures, which counted five of the ban list's voice refusals as the
 * screen's while auditing the screen for exactly this kind of error.
 *
 * **THE GENERAL FORM IS NOT ABOUT RULE IDS.** It is: *an identifier shared by two producers is a
 * join key that silently merges them.* The same shape has already appeared here as
 * `human:staff-reviewer@cluecrew.test` resolving to no Reviewer row (R94), and as a machine verdict
 * wearing a person's name. **An id is a claim about identity, and a shared one is a false claim
 * that every consumer inherits.**
 *
 * A shared id is not always wrong — a rule genuinely enforced in two places is one rule. So this
 * REPORTS every id with more than one emitter and refuses the ones not declared, which is the
 * R985/R1004 shape: the list may only shrink and nothing new joins it silently.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
const EMITS_A_RULE = /\brule:\s*'([a-z0-9-]+)'/g;

function files(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) files(full, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

function main() {
  console.log('check:rule-id-owners — an identifier shared by two producers silently merges them.');
  assertFixture('rule-id-owners', [
    { name: 'one id emitted from two places', input: "A:rule: 'banned-vocabulary'\nB:rule: 'banned-vocabulary'", mustBeCaught: true },
    { name: 'two ids, one each', input: "A:rule: 'banned-vocabulary'\nB:rule: 'subject-matter'", mustBeCaught: false },
    { name: 'one id emitted twice in the SAME file', input: "A:rule: 'notation'\nA:rule: 'notation'", mustBeCaught: false },
  ], (src) => {
    const owners = new Map<string, Set<string>>();
    for (const line of src.split('\n')) {
      const [file, rest] = [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1)];
      for (const m of rest.matchAll(EMITS_A_RULE)) {
        const id = m[1]!;
        owners.set(id, (owners.get(id) ?? new Set()).add(file));
      }
    }
    return [...owners.values()].some((s) => s.size > 1);
  });

  const all = files(pjoin(REPO, 'packages', 'core', 'src')).concat(files(pjoin(REPO, 'scripts')));
  requirePopulation('check:rule-id-owners', { 'file(s) screened': all.length });

  const owners = new Map<string, Set<string>>();
  for (const f of all) {
    // The check's own fixture strings are not emitters. A screen that counts itself reports a
    // fault it created by existing.
    if (f.endsWith('check-rule-id-owners.ts')) continue;
    const src = readFileSync(f, 'utf8');
    for (const line of src.split('\n')) {
      if (/^\s*(\/\/|\*)/.test(line)) continue;
      for (const m of line.matchAll(EMITS_A_RULE)) {
        const id = m[1]!;
        owners.set(id, (owners.get(id) ?? new Set()).add(f.replace(`${REPO}/`, '')));
      }
    }
  }
  const shared = [...owners].filter(([, s]) => s.size > 1).map(([id, s]) => ({ id, emitters: [...s].sort() }));

  const DECL = pjoin(REPO, 'content', 'shared-rule-ids.json');
  const declared: Record<string, string> = existsSync(DECL) ? (JSON.parse(readFileSync(DECL, 'utf8')) as { shared: Record<string, string> }).shared : {};
  const fresh = shared.filter((s) => !(s.id in declared));
  const stale = Object.keys(declared).filter((id) => !shared.some((s) => s.id === id));

  if (process.argv.includes('--record')) {
    writeFileSync(DECL, JSON.stringify({
      what: 'rule ids emitted from more than one file, each with the reason the sharing is correct. An id NOT on this list may not be shared.',
      rule: 'R1006 — an identifier shared by two producers is a join key that silently merges them',
      recordedOn: '2026-09-05',
      shared: Object.fromEntries(shared.map((s) => [s.id, declared[s.id] ?? `DECLARE WHY: emitted from ${s.emitters.join(', ')}`])),
    }, null, 1));
    console.log(`  recorded ${shared.length} shared id(s) — every one needs its reason written in.`);
    return;
  }

  console.log(`  ${all.length} file(s) screened; ${owners.size} distinct rule id(s); ${shared.length} emitted from more than one file, ${Object.keys(declared).length} declared.`);
  for (const s of shared) console.log(`    ${s.id.padEnd(24)} ${s.emitters.length} emitters: ${s.emitters.join(', ')}`);
  if (stale.length) console.log(`  ${stale.length} declaration(s) STALE — no longer shared: ${stale.join(', ')}`);
  if (fresh.length === 0) { console.log('\n  No UNDECLARED rule id is emitted by two producers.'); return; }
  console.error(`\n  REFUSED — ${fresh.length} rule id(s) shared with no declared reason:`);
  for (const s of fresh) console.error(`    ${s.id}: ${s.emitters.join(', ')}`);
  console.error('\n  Two instruments under one id are indistinguishable to every consumer, including the');
  console.error('  auditor. Give the second its own id, or declare why one id is correct.');
  process.exitCode = 1;
}
main();
