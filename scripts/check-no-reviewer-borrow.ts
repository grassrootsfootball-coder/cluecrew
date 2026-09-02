/**
 * check:no-reviewer-borrow — NO TEST REPOINTS, BORROWS OR IMPERSONATES A REAL REVIEWER ROW
 * (Annie's 219th, David's ruling, 2026-09-02 — R978).
 *
 * The rule is permanent and it needs a mechanism, because a rule in a docstring is obeyed by
 * whoever read the docstring (R967). The e2e sign test repointed `rev-0001` — a real person's row
 * — at a throwaway account so a naming path would resolve, and wrote two SIGNED events under her
 * identity on a row she had never read.
 *
 * TWO REFUSALS, both derivable from the bytes and neither needing a database:
 *   1. A test file may not UPDATE a `Reviewer` row. A test mints its own and deletes it; updating
 *      one means reaching for a row somebody else owns.
 *   2. A test file may not name a `rev-`prefixed reviewer id that is not the minted test pattern.
 *
 * NOT A LENGTH RULE AND NOT A NAME RULE (R967's amendment, learned the hard way): this matches the
 * MUTATION and the ID SHAPE, and it is scoped to test files in this repository.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
const MINTED = /^zz-e2e-rev-/;

function testFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === 'node_modules' || e === '.next' || e === 'dist') continue;
    const full = pjoin(dir, e);
    if (statSync(full).isDirectory()) testFiles(full, out);
    else if (/\.(spec|test)\.tsx?$/.test(e)) out.push(full);
  }
  return out;
}

/** A line borrows a reviewer if it mutates one, or names a non-minted reviewer id. */
function borrows(line: string): boolean {
  const stripped = line.replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
  if (/prisma\.reviewer\.(update|updateMany|upsert)\s*\(/.test(stripped)) return true;
  const ids = stripped.match(/['"`](rev-[A-Za-z0-9_-]+)['"`]/g) ?? [];
  return ids.some((raw) => !MINTED.test(raw.slice(1, -1)));
}

function main() {
  console.log('check:no-reviewer-borrow — a test mints its own reviewer or it does not have one.');
  assertFixture('reviewer-borrow', [
    { name: 'repointing a real reviewer row', input: "await prisma.reviewer.update({ where: { id: 'rev-0001' }, data: { staffEmail: x } });", mustBeCaught: true },
    { name: 'naming a real reviewer id', input: "const previous = await prisma.reviewer.findUnique({ where: { id: 'rev-0001' } });", mustBeCaught: true },
    { name: 'upserting a reviewer row', input: 'await prisma.reviewer.upsert({ where: { id: someId }, create: {}, update: {} });', mustBeCaught: true },
    { name: 'minting its own and deleting it', input: "await prisma.reviewer.create({ data: { id: `zz-e2e-rev-${Date.now()}` } });", mustBeCaught: false },
    { name: 'deleting its own minted row', input: "await prisma.reviewer.delete({ where: { id: testReviewerId } });", mustBeCaught: false },
    { name: 'a comment explaining the old borrow', input: "   * This test used to repoint `rev-0001` — Annie's row — at a throwaway account", mustBeCaught: false },
  ], borrows);

  const files = [...testFiles(pjoin(REPO, 'apps')), ...testFiles(pjoin(REPO, 'packages'))];
  requirePopulation('check:no-reviewer-borrow', { 'test file(s) screened': files.length });

  const faults: Array<{ file: string; line: number; text: string }> = [];
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((text, i) => { if (borrows(text)) faults.push({ file: f.replace(`${REPO}/`, ''), line: i + 1, text: text.trim().slice(0, 110) }); });
  }

  if (faults.length === 0) {
    console.log(`  ${files.length} test file(s) screened, no reviewer borrowed. A test that needs a named reviewer mints one and deletes it with everything it wrote.`);
    return;
  }
  console.error(`\n  REFUSED — ${faults.length} line(s) borrow a reviewer row a test does not own:`);
  for (const x of faults) console.error(`    ${x.file}:${x.line}  ${x.text}`);
  console.error('\n  A test that repoints a real reviewer writes machine verdicts under a person\'s name (R94, R978).');
  console.error('  Mint one — `zz-e2e-rev-<timestamp>` — and delete it in teardown together with every event it wrote.');
  process.exit(1);
}

main();
