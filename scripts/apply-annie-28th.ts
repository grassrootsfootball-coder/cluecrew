/**
 * Annie's twenty-eighth return: four authored replacements (R410).
 *
 * **ASSERTED AFTER WRITING, BY READING THE ROW BACK — not by the instrument that produced the
 * failure.** `check:amendments-landed` is what missed these; confirming them with it would be the
 * instrument grading its own blind spot.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const FILE = '/Users/davidb/Downloads/annie-twentyeighth-return.md';
const APPLY = process.argv.includes('--apply');
const DIGEST = createHash('sha256').update(readFileSync(FILE)).digest('hex');
const AUTHORITY = `annie-twentyeighth-return.md, read from the file, sha256 ${DIGEST}`;

const WRITES: Array<{ kind: 'library' | 'item'; id: string; authored: string }> = [
  { kind: 'item', id: 'ENG-003-A-SP-07', authored: 'If all four parts check out, No mistake is a real answer.' },
  { kind: 'library', id: 'en-terminal-punctuation-blind', authored: 'Read it aloud. Where your voice stops or asks, the punctuation must match.' },
  { kind: 'library', id: 'en-n-option-avoidance', authored: 'Check every part in turn. No mistake is a real answer, not a way out.' },
  { kind: 'library', id: 'en-apostrophe-possession', authored: "Ask whose it is. An owner needs an apostrophe. Try swapping in 'it is'." },
];

async function main() {
  const her = readFileSync(FILE, 'utf8').replace(/\s*\n\s*/g, ' ');
  for (const w of WRITES) {
    if (!her.includes(w.authored)) throw new Error(`ABORTED — "${w.authored}" is not in ${FILE} verbatim.`);
    const gate = checkChildFacingText({ role: 'misconception-hint', label: w.id, text: w.authored }).filter(isBlocking);
    if (gate.length) throw new Error(`ABORTED — ${w.id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  }
  console.log(`4 wordings located in her file and gated clean\n  authority digest ${DIGEST.slice(0, 16)}…\n`);

  for (const w of WRITES) {
    if (w.kind === 'library') {
      const before = await prisma.misconception.findUnique({ where: { id: w.id }, select: { childHint: true } });
      console.log(`  ${w.id}\n      BEFORE: ${JSON.stringify(before?.childHint)}\n      AFTER : ${JSON.stringify(w.authored)}`);
      if (APPLY) {
        await prisma.misconception.update({
          where: { id: w.id },
          data: {
            childHint: w.authored,
            textProvenance: { state: 'RECORDED', approvedByPerson: 'Annie', authority: AUTHORITY, appliedOn: '2026-08-21' },
          },
        });
      }
    } else {
      const item = await prisma.item.findUnique({ where: { id: w.id }, select: { explanation: true } });
      const e = { ...(item?.explanation as Record<string, unknown>) };
      console.log(`  ${w.id}\n      BEFORE: ${JSON.stringify(e.hintCore)}\n      AFTER : ${JSON.stringify(w.authored)}`);
      if (APPLY) {
        e._previousHintCore = e.hintCore; e.hintCore = w.authored;
        e.hintAuthoredBy = 'Annie'; e.hintAuthority = AUTHORITY;
        await prisma.item.update({ where: { id: w.id }, data: { explanation: e as object } });
      }
    }
  }

  if (!APPLY) { console.log('\nREPORT ONLY.'); await prisma.$disconnect(); return; }

  // POST-WRITE ASSERTION, reading the row back directly.
  console.log('\n  asserting each against the store, by reading the row:');
  let bad = 0;
  for (const w of WRITES) {
    const got = w.kind === 'library'
      ? (await prisma.misconception.findUnique({ where: { id: w.id }, select: { childHint: true } }))?.childHint
      : String(((await prisma.item.findUnique({ where: { id: w.id }, select: { explanation: true } }))?.explanation as { hintCore?: unknown })?.hintCore ?? '');
    const ok = got === w.authored;
    if (!ok) bad++;
    console.log(`    ${ok ? 'CONFIRMED' : 'NOT WRITTEN'}  ${w.id}${ok ? '' : `\n        store holds: ${JSON.stringify(got)}`}`);
  }
  if (bad > 0) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
