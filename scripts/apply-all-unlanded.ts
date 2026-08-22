/**
 * Every authored wording still absent from the store, largest carrier count first (R414).
 *
 * The INLINE shape carries its own target: `` - `entry-id`, replacing *old*: **new** ``. That is why
 * missing the shape lost the targets as well as the wordings — R415.
 *
 * **ASSERTED BY READING THE ROW BACK.** `check:amendments-landed` produced a false landing; it
 * cannot confirm the writes that correct it.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { readAmendments } from './lib/return-amendments';

const RETURNS = '/Users/davidb/Downloads';
const APPLY = process.argv.includes('--apply');
const TODAY = new Date().toISOString().slice(0, 10);

async function main() {
  /**
   * **THE SHARED READER, AND THIS SCRIPT NOT CALLING IT WAS THE WHOLE OF R429 RECURRING.** That
   * ruling created `scripts/lib/return-amendments.ts` because two parsers over one format disagree
   * eventually — and then this file kept its own `INLINE` regex, so the second parser survived the
   * ruling that named it. It read ONE of her four shapes. Every amendment in the indented
   * `AMENDMENTS` block, every wording that wrapped a line, and every target carried in a heading was
   * invisible to the thing whose entire job is applying them.
   */
  const { amendments, files } = readAmendments(RETURNS);
  const seen = new Set<string>();
  const found: Array<{ id: string; authored: string; file: string; when: Date }> = [];
  const otherField: Array<{ id: string; authored: string; file: string; fieldNote: string }> = [];
  for (const a of amendments) {
    if (a.kind !== 'STORE' || !a.targetId) continue;
    /**
     * **WHEN SHE NAMES A FIELD THAT IS NOT THE HINT, THIS WRITER STOPS.** `(description, not hint)`
     * is an instruction about WHICH COLUMN, and this script owns exactly one. Skipping it here is
     * not a gap — it is the writer declining a row it does not own, which is the same discipline as
     * the word cards below.
     */
    /**
     * **HER FORM IS `<field>, not <other field>`, AND A SUBSTRING TEST READS IT BACKWARDS.**
     * `/hint/i.test('description, not hint')` is TRUE — it matches the field she is EXCLUDING, so
     * the guard passed the one row it existed to stop. The field she names is the part before the
     * comma or the `not`; everything after it is the field she is ruling OUT.
     */
    const namedField = a.fieldNote ? a.fieldNote.split(/,|\bnot\b/)[0].trim() : null;
    if (namedField && !/^hint\b/i.test(namedField)) {
      otherField.push({ id: a.targetId, authored: a.authored, file: a.file, fieldNote: a.fieldNote as string });
      continue;
    }
    if (seen.has(`${a.targetId}|${a.authored}`)) continue;
    seen.add(`${a.targetId}|${a.authored}`);
    found.push({ id: a.targetId, authored: a.authored, file: a.file, when: a.when });
  }

  const lib = await prisma.misconception.findMany({ select: { id: true, childHint: true } });
  const held = new Map(lib.map((m) => [m.id, m.childHint]));
  const items = await prisma.item.findMany({ include: { options: true } });
  const carriers = (id: string) => {
    let live = 0; let all = 0;
    for (const i of items) for (const o of i.options) {
      if ((o as { misconceptionId?: string | null }).misconceptionId !== id) continue;
      all++; if (i.status === 'LIVE') live++;
    }
    return { live, all };
  };

  /**
   * **SUPERSEDED IS NOT ABSENT.** She amended `hostile` three times; the store holds her latest and
   * the two earlier wordings are correctly not in it. Writing them would replace her current ruling
   * with one she has already withdrawn — **the return leg running backwards.**
   */
  /** Compare normalised; WRITE verbatim. The two are different operations and must stay so. */
  const same = (a: string | null | undefined, b: string) => (a ?? '').trim() === b.trim();
  const landedWhen = new Map<string, Date>();
  for (const a of found) {
    if (!same(held.get(a.id), a.authored)) continue;
    const prev = landedWhen.get(a.id);
    if (!prev || a.when > prev) landedWhen.set(a.id, a.when);
  }
  const superseded = found.filter((a) => {
    const t = landedWhen.get(a.id);
    return !same(held.get(a.id), a.authored) && t !== undefined && t > a.when;
  });
  const supersededKeys = new Set(superseded.map((a) => `${a.id}|${a.authored}`));

  const todo = found
    .filter((a) => held.has(a.id) && !same(held.get(a.id), a.authored))
    .filter((a) => !supersededKeys.has(`${a.id}|${a.authored}`))
    .map((a) => ({ ...a, ...carriers(a.id) }))
    .sort((x, y) => y.all - x.all || y.live - x.live);
  const noTarget = found.filter((a) => !held.has(a.id));
  console.log(
    `  SUPERSEDED, deliberately NOT written: ${superseded.length}`
    + superseded.map((s) => `\n      ${s.id} — "${s.authored}" (${s.file})`).join('') + '\n',
  );

  console.log(
    `${files.length} return(s) read · ${found.length} amendment(s) with a named target · ${todo.length} to write\n`,
  );
  if (otherField.length) {
    console.log(`  SHE NAMED A DIFFERENT FIELD (${otherField.length}) — not written by this script:`);
    for (const a of otherField) console.log(`      ${a.id} (${a.fieldNote}) — ${a.file}`);
    console.log('');
  }
  if (noTarget.length) {
    /**
     * **THIS CLASS IS NOT ONE THING, AND CALLING IT "NO SUCH ENTRY" ASSERTS THE WRONG HALF.** A
     * `word-card:stoic` target names a real row in a table this script does not write. An
     * `en-something` target with no row is a genuine finding. Both printed here; the difference is
     * the whole reason a reader would act.
     */
    console.log(`  NOT A MISCONCEPTION ROW (${noTarget.length}) — this script writes childHint only:`);
    for (const a of [...new Map(noTarget.map((a) => [`${a.id}|${a.authored}`, a])).values()]) {
      console.log(`      ${a.id}: "${a.authored}"  (${a.file})`);
    }
    console.log('  Reported, never created. An amendment to a row this writer does not own is not\n'
      + '  a missing entry — and reporting it as one sends somebody to create a row that exists.\n');
  }

  for (const a of todo) {
    const gate = checkChildFacingText({ role: 'misconception-hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length) throw new Error(`ABORTED — ${a.id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  }

  for (const a of todo) {
    console.log(`  ${a.id}  (${a.live} LIVE / ${a.all} carriers, ${a.file})`);
    console.log(`      BEFORE: ${JSON.stringify(held.get(a.id))}`);
    console.log(`      AFTER : ${JSON.stringify(a.authored)}`);
    if (!APPLY) continue;
    const digest = createHash('sha256').update(readFileSync(join(RETURNS, a.file))).digest('hex');
    await prisma.misconception.update({
      where: { id: a.id },
      data: {
        childHint: a.authored,
        textProvenance: {
          state: 'RECORDED', approvedByPerson: 'Annie',
          authority: `${a.file}, read from the file, sha256 ${digest}`,
          appliedOn: TODAY, note: 'Ruled when written; absent from the store until now (R403/R410).',
        },
      },
    });
  }

  if (!APPLY) { console.log('\nREPORT ONLY.'); await prisma.$disconnect(); return; }

  console.log('\n  asserting each by reading the row back:');
  let bad = 0;
  for (const a of todo) {
    const got = (await prisma.misconception.findUnique({ where: { id: a.id }, select: { childHint: true } }))?.childHint;
    const ok = got === a.authored;
    if (!ok) { bad++; console.log(`    NOT WRITTEN  ${a.id}\n        holds: ${JSON.stringify(got)}`); }
    else console.log(`    CONFIRMED    ${a.id}`);
  }
  console.log(`\n${todo.length - bad} of ${todo.length} confirmed by direct read.`);
  if (bad) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
