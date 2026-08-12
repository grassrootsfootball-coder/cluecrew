/**
 * EVERY RULE CLAUDE.MD CITES HAS A REGISTER ENTRY — `pnpm check:register`
 *
 * Two files hold rulings and they serve DIFFERENT purposes, which is why the answer is a check
 * rather than making one a pointer at the other:
 *
 *   · `docs/authoring-calibration-log.md` is THE REGISTER — the numbered record, R1…Rn, one
 *     heading per ruling, with the reasoning and the evidence. It is the destination.
 *   · `CLAUDE.md` is what is LOADED AT SESSION START. It has to carry the operative text of the
 *     rules that recur, because a rule reduced to "see R57" is a rule nobody has in context at
 *     the moment they would break it. Pointing instead of stating would make the session-start
 *     file useless for its one job.
 *
 * So both carry content, and the failure mode is drift between them. It happened: R60, R61 and
 * R62 were written into CLAUDE.md and never reached the register — three consecutive rulings,
 * found only because R63 went to cite R62 and the heading was not there. Nothing would have
 * surfaced it otherwise, and the next three would have gone the same way.
 *
 * This asserts the one direction that matters: a rule CITED as governing must be RECORDED. The
 * reverse is deliberately not asserted — the register holds sixty-odd rulings and only the ones
 * that recur belong in a session-start file, so "in the register but not in CLAUDE.md" is the
 * normal case, not a fault.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const ROOT = resolve(import.meta.dirname, '..');
const REGISTER = 'docs/authoring-calibration-log.md';
const HOUSE_RULES = 'CLAUDE.md';

function main(): void {
  const register = readFileSync(resolve(ROOT, REGISTER), 'utf8');
  const houseRules = readFileSync(resolve(ROOT, HOUSE_RULES), 'utf8');

  const recorded = new Set(
    [...register.matchAll(/^## R(\d+)\b/gm)].map((m) => Number(m[1])),
  );
  const cited = new Set([...houseRules.matchAll(/\bR(\d+)\b/g)].map((m) => Number(m[1])));

  requirePopulation('check:register', {
    'register entries': recorded.size,
    'rule numbers cited in CLAUDE.md': cited.size,
  });

  // CANARY: the highest recorded number must be reachable, or a parser that silently stopped
  // matching headings would report an empty register and pass everything by vacuum.
  const highest = Math.max(...recorded);
  if (!new RegExp(`^## R${highest}\\b`, 'm').test(register)) {
    console.error('CHECK ABORTED: the register heading parser no longer matches its own output.');
    process.exit(1);
  }

  const uncited = [...cited].filter((n) => !recorded.has(n)).sort((a, b) => a - b);
  const gaps = Array.from({ length: highest }, (_, i) => i + 1).filter((n) => !recorded.has(n));

  console.log(
    `  register R1–R${highest}: ${recorded.size} entries, ${gaps.length} gap(s). ` +
      `CLAUDE.md cites ${cited.size} rule number(s).`,
  );

  const failures: string[] = [];
  for (const n of uncited) {
    failures.push(`R${n} is cited as a governing rule in ${HOUSE_RULES} but has no "## R${n}" entry in ${REGISTER}`);
  }
  if (gaps.length > 0) {
    // A gap is not automatically a fault — a number can be withdrawn — but it must be visible.
    console.log(`  numbering gaps (not failures, but check they were withdrawn deliberately): ${gaps.map((n) => `R${n}`).join(', ')}`);
  }

  if (failures.length > 0) {
    console.error(`\nREGISTER DRIFT (${failures.length}):`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(
      `\nThe register is the destination; ${HOUSE_RULES} is what a session loads. A rule that\n` +
        'governs but was never recorded is a rule with no reasoning and no evidence attached — and\n' +
        'nothing surfaces it, which is how R60, R61 and R62 all went missing at once. Write the\n' +
        'register entry; do not delete the citation.',
    );
    process.exit(1);
  }
  console.log('Register check passed: every rule CLAUDE.md cites as governing is recorded.');
}

main();
