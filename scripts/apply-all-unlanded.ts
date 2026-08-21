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

const RETURNS = '/Users/davidb/Downloads';
const APPLY = process.argv.includes('--apply');
/** Inline shape: the backticked entry id, the replaced text, and the authored text. */
const INLINE = /[-*]\s*`([a-z0-9-]+)`\s*,?\s*(?:[^:]*?)replacing\s+\*(.+?)\*\s*:\s*\*\*(.+?)\*\*/gms;

async function main() {
  const files = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f)).sort();
  const seen = new Set<string>();
  const found: Array<{ id: string; authored: string; file: string }> = [];
  for (const f of files) {
    const body = readFileSync(join(RETURNS, f), 'utf8');
    INLINE.lastIndex = 0;
    for (const m of body.matchAll(INLINE)) {
      const id = m[1];
      const authored = m[3].replace(/\s*\n\s*/g, ' ').trim();
      if (seen.has(`${id}|${authored}`)) continue;
      seen.add(`${id}|${authored}`);
      found.push({ id, authored, file: f });
    }
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

  const todo = found
    .filter((a) => held.has(a.id) && held.get(a.id) !== a.authored)
    .map((a) => ({ ...a, ...carriers(a.id) }))
    .sort((x, y) => y.all - x.all || y.live - x.live);
  const noTarget = found.filter((a) => !held.has(a.id));

  console.log(`${found.length} inline amendment(s) with a named target · ${todo.length} still absent\n`);
  if (noTarget.length) {
    console.log(`  NO SUCH LIBRARY ENTRY (${noTarget.length}): ${[...new Set(noTarget.map((a) => a.id))].join(', ')}`);
    console.log('  Reported, never created — an amendment to an entry that does not exist is a finding.\n');
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
          appliedOn: '2026-08-21', note: 'Ruled when written; absent from the store until now (R403/R410).',
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
