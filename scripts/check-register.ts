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
 *
 * FOUR ROUTES, because the first version watched ONE and its green tick stood for more than it
 * covered. R64 and R65 were committed and left unregistered hours after R64 closed exactly this
 * failure, and this check passed throughout: they were cited in COMMIT MESSAGES, and it only read
 * CLAUDE.md. Measured, the routes and what each carries:
 *
 *   1. CLAUDE.md            — 13 rule numbers
 *   2. source comments      — 36
 *   3. commit messages      — 56, the widest by far, and the one that was invisible
 *   4. docs outside the register — 3
 *
 * ROUTE 3 NEEDS GIT HISTORY, and `actions/checkout` clones shallow by default — one commit. CI now
 * sets `fetch-depth: 0` so the route is genuinely covered. When history is unavailable anyway the
 * check SAYS the route was not read rather than skipping it quietly, because a route silently
 * dropped is how this blind spot happened in the first place (R60).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { requirePopulation } from './lib/population';

const ROOT = resolve(import.meta.dirname, '..');
const REGISTER = 'docs/authoring-calibration-log.md';
const HOUSE_RULES = 'CLAUDE.md';

/**
 * NUMBERS THAT LOOK LIKE CITATIONS AND ARE NOT — declared with the reason, never a bare exemption.
 *
 * Commit history is immutable, so a number written INTO it as an example is permanent. R99 was
 * used as a deliberately-nonexistent rule while fault-injecting this very check (commit 350c8d9,
 * "planting an unregistered R99"); the description of the test then read as a citation of the
 * rule. The check was right and the convention was missing.
 *
 * CONVENTION, so this list does not grow: a fault-injection probe must use a token that this
 * check cannot match at all — write the number in words, or break the prefix from the digits.
 * Do NOT reach for the next round number up, and do not write a four-digit example here either:
 * the first draft of this comment suggested one, and the check immediately flagged the comment.
 * A convention that demonstrates itself by failing is the right kind of evidence, once.
 */
const NON_CITATIONS: Record<number, string> = {
  99: 'fault-injection example in commit 350c8d9, describing a test of this check. Never a rule.',
};

function main(): void {
  const register = readFileSync(resolve(ROOT, REGISTER), 'utf8');
  const houseRules = readFileSync(resolve(ROOT, HOUSE_RULES), 'utf8');

  const recorded = new Set(
    [...register.matchAll(/^## R(\d+)\b/gm)].map((m) => Number(m[1])),
  );

  /** Two-digit-plus only outside CLAUDE.md: bare `R1`-style matches catch far too much prose. */
  const cite = (text: string, minDigits: number): number[] =>
    [...text.matchAll(new RegExp(`\\bR(\\d{${minDigits},})\\b`, 'g'))].map((m) => Number(m[1]));

  const routes: Array<{ name: string; numbers: number[]; read: boolean; why?: string }> = [];
  routes.push({ name: 'CLAUDE.md', numbers: cite(houseRules, 1), read: true });

  // Source comments.
  const sourceFiles: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (['node_modules', '.next', 'migrations', '.git'].includes(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) sourceFiles.push(join(dir, entry.name));
    }
  };
  for (const d of ['scripts', 'packages', 'apps']) walk(resolve(ROOT, d));
  routes.push({
    name: 'source comments',
    numbers: sourceFiles.flatMap((f) => cite(readFileSync(f, 'utf8'), 2)),
    read: true,
  });

  // Docs other than the register itself.
  const docs = readdirSync(resolve(ROOT, 'docs')).filter((f) => f.endsWith('.md') && !REGISTER.endsWith(f));
  routes.push({
    name: 'docs (excl. register)',
    numbers: docs.flatMap((f) => cite(readFileSync(resolve(ROOT, 'docs', f), 'utf8'), 2)),
    read: true,
  });

  // Commit messages — the route that was invisible, and the widest.
  let log = '';
  let logRead = true;
  let why: string | undefined;
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT }).toString().trim();
    if (shallow === 'true') {
      logRead = false;
      why = 'the clone is SHALLOW — set fetch-depth: 0 on actions/checkout to cover this route';
    } else {
      log = execFileSync('git', ['log', '--format=%B'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();
    }
  } catch {
    logRead = false;
    why = 'git is unavailable here';
  }
  routes.push({ name: 'commit messages', numbers: cite(log, 2), read: logRead, why });

  const cited = new Set(routes.filter((r) => r.read).flatMap((r) => r.numbers));

  requirePopulation('check:register', {
    'register entries': recorded.size,
    'rule numbers cited across readable routes': cited.size,
  });

  for (const r of routes) {
    console.log(
      `    ${r.read ? 'read     ' : 'NOT READ '} ${r.name.padEnd(24)} ` +
        (r.read ? `${new Set(r.numbers).size} rule number(s)` : `— ${r.why}`),
    );
  }
  const unread = routes.filter((r) => !r.read);
  if (unread.length > 0) {
    console.log(
      `  ⚠ ${unread.length} route(s) NOT READ: ${unread.map((r) => r.name).join(', ')}. This pass does\n` +
        '    not cover them, so a rule cited only there would not be seen. Not a pass over them.',
    );
  }

  // CANARY: the highest recorded number must be reachable, or a parser that silently stopped
  // matching headings would report an empty register and pass everything by vacuum.
  const highest = Math.max(...recorded);
  if (!new RegExp(`^## R${highest}\\b`, 'm').test(register)) {
    console.error('CHECK ABORTED: the register heading parser no longer matches its own output.');
    process.exit(1);
  }

  const uncited = [...cited]
    .filter((n) => !recorded.has(n) && !(n in NON_CITATIONS))
    .sort((a, b) => a - b);
  const suppressed = [...cited].filter((n) => n in NON_CITATIONS);
  const routeOf = (n: number): string =>
    routes.filter((r) => r.read && r.numbers.includes(n)).map((r) => r.name).join(', ');
  const gaps = Array.from({ length: highest }, (_, i) => i + 1).filter((n) => !recorded.has(n));

  console.log(`  register R1–R${highest}: ${recorded.size} entries, ${gaps.length} gap(s).`);
  for (const n of suppressed) console.log(`  R${n} ignored — ${NON_CITATIONS[n]}`);

  const failures: string[] = [];
  for (const n of uncited) {
    failures.push(`R${n} is cited (${routeOf(n)}) but has no "## R${n}" entry in ${REGISTER}`);
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
