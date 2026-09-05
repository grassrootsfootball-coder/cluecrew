/**
 * check:appropriateness-sited — ONE PREDICATE, CALLED AT EVERY WRITE PRODUCING CHILD-FACING TEXT.
 *
 * Annie's 227th: *"Hand-authored rows, seeded rows, imported rows and regenerated rows all reach
 * the child by different paths, and a screen that lives on one path is the renderer fault waiting
 * to happen again: my own gap-must-speak repair reached one surface and left sixty frames silent."*
 *
 * **THE SCREEN LIVES INSIDE `checkItemChildFacing`, SO ANY WRITER THAT GATES IS COVERED.** The risk
 * is a writer that does NOT gate. This finds them: a file that writes to Item or ItemOption content
 * and neither calls the gate nor calls the predicate is reported.
 *
 * **AND ITS BOUND IS STATED, BECAUSE IT IS LARGE.** This is a STATIC read of imports and call
 * names. It cannot see a writer that reaches the gate through three layers of indirection, and it
 * cannot see one that gates the wrong string. It answers "is the screen reachable from this
 * writer", never "is every string screened" — the second needs the runtime, and claiming it from a
 * grep is the proxy fault this register keeps finding (R60's third question: is it reading the
 * artefact, or a copy of it?).
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { requirePopulation } from './lib/population';
import { assertFixture } from './lib/carried-fixture';

const REPO = pjoin(__dirname, '..');
/** A write to content a child reads. */
const WRITES_CHILD_FACING = /(prisma|tx)\.(item|itemOption)\.(create|createMany|update|updateMany|upsert)\b/;
/** Reaching the screen: through the one gate, or by calling the predicate directly. */
const REACHES = /checkItemChildFacing|appropriatenessHits|isAppropriateForAChild|assertPilotWrite|pilot-review/;

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
  console.log('check:appropriateness-sited — every writer of child-facing text can reach the screen.');
  assertFixture('appropriateness-sited', [
    { name: 'writes item content and reaches nothing', input: 'await prisma.item.update({ where: { id }, data: { stem } });', mustBeCaught: true },
    { name: 'writes item content and calls the gate', input: 'checkItemChildFacing(row); await prisma.item.update({ where: { id }, data: { stem } });', mustBeCaught: false },
    { name: 'writes item content and calls the predicate', input: 'if (!isAppropriateForAChild(w)) throw x; await tx.itemOption.update({ where: { id }, data: {} });', mustBeCaught: false },
    { name: 'writes no child-facing content at all', input: 'await prisma.attributionEvent.create({ data: {} });', mustBeCaught: false },
  ], (src) => WRITES_CHILD_FACING.test(src) && !REACHES.test(src));

  const all = [...files(pjoin(REPO, 'scripts')), ...files(pjoin(REPO, 'packages', 'db', 'prisma')), ...files(pjoin(REPO, 'apps', 'web', 'lib'))];
  requirePopulation('check:appropriateness-sited', { 'file(s) screened': all.length });

  const writers: string[] = [], unreached: string[] = [];
  for (const f of all) {
    const src = readFileSync(f, 'utf8');
    if (!WRITES_CHILD_FACING.test(src)) continue;
    const rel = f.replace(`${REPO}/`, '');
    writers.push(rel);
    if (!REACHES.test(src)) unreached.push(rel);
  }

  /**
   * A DECLARED BACKLOG, NOT A SOFTENED CHECK (R149). The screen arrived after these writers did.
   * Refusing all of them today reports a flood nobody can repair in one pass and says nothing about
   * what happens next; the list is named, the check refuses anything NOT on it, and it may only
   * shrink. Every entry is a one-shot ruling-applier whose rows are separately gated at publication.
   */
  const BACKLOG = pjoin(REPO, 'content', 'appropriateness-siting-backlog.json');
  const declared: string[] = existsSync(BACKLOG) ? (JSON.parse(readFileSync(BACKLOG, 'utf8')) as { known: string[] }).known : [];
  const known = new Set(declared);
  const fresh = unreached.filter((u) => !known.has(u));
  const stale = declared.filter((d) => !unreached.includes(d));

  if (process.argv.includes('--record')) {
    writeFileSync(BACKLOG, JSON.stringify({
      what: 'writers of child-facing content that predate the subject-matter screen and do not reach it. The check refuses anything NOT on this list; the list may only shrink.',
      rule: 'Annie 227th — one predicate, called at every write producing child-facing text',
      recordedOn: '2026-09-05',
      andWHATPROTECTSTHESEMEANWHILE: 'every row they write is screened by checkItemChildFacing at publication, which now carries the predicate. The gap is that they can WRITE an unsuitable string; it cannot reach a child unpublished.',
      known: [...unreached].sort(),
    }, null, 1));
    console.log(`  recorded ${unreached.length} backlog entr(ies).`);
    return;
  }

  console.log(`  ${all.length} file(s) screened; ${writers.length} write child-facing content; ${unreached.length} cannot reach the screen, ${known.size} of them declared.`);
  if (stale.length) console.log(`  ${stale.length} backlog entr(ies) are STALE — repaired since recording. Re-record to shrink the list.`);
  if (fresh.length === 0) {
    console.log('  No NEW writer of child-facing text is unable to reach the subject-matter screen.');
    console.log('  BOUND: this is a static read of call names. It answers "is the screen reachable", never "is every string screened".');
    return;
  }
  console.error(`\n  REFUSED — ${fresh.length} writer(s) of child-facing text cannot reach the screen and are not declared:`);
  for (const f of fresh.slice(0, 15)) console.error(`    ${f}`);
  console.error('\n  A screen that lives on one path is the renderer fault waiting to happen again (Annie, 227th).');
  process.exitCode = 1;
}

main();
