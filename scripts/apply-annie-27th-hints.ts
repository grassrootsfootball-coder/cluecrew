/**
 * Annie's twenty-seventh return: the eight rulings on the nine punctuation hints (R399).
 *
 * Every authored wording is READ FROM HER FILE and refused if not present verbatim (R25/R397 — the
 * citation is a second assertion and must be able to disagree).
 *
 * **PU-08 IS RECORDED AS RULED, NOT LEFT UNRULED.** A deliberate decision not to serve an item hint
 * is a ruling, and must not read as an omission — the state it produces is identical to a hint
 * nobody has looked at, which is the distinction her whole read exists to make.
 */
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const HER_FILE = '/Users/davidb/Downloads/annie-twentyseventh-return.md';
const APPLY = process.argv.includes('--apply');
const READER = 'Annie';
const AUTHORITY = 'annie-twentyseventh-return.md §1, read from the file';

type Ruling =
  | { item: string; verdict: 'APPROVED' }
  | { item: string; verdict: 'REPLACED'; authored: string }
  | { item: string; verdict: 'LIBRARY'; why: string }
  | { item: string; verdict: 'HELD'; why: string };

const RULINGS: Ruling[] = [
  { item: 'ENG-003-A-PU-01', verdict: 'REPLACED', authored: 'Does it belong to someone, or is it just more than one?' },
  { item: 'ENG-003-A-PU-02', verdict: 'APPROVED' },
  { item: 'ENG-003-A-PU-03', verdict: 'HELD', why: 'She will not rule a hint against an item she cannot see. Sent with its parts, key and tags.' },
  { item: 'ENG-003-A-PU-04', verdict: 'APPROVED' },
  { item: 'ENG-003-A-PU-05', verdict: 'REPLACED', authored: 'Find the owner word first. The apostrophe goes after it.' },
  { item: 'ENG-003-A-PU-06', verdict: 'REPLACED', authored: 'The mark belongs to the words that were spoken. Keep it inside.' },
  { item: 'ENG-003-A-PU-07', verdict: 'REPLACED', authored: 'Look at the very last word. What is it wearing at the end?' },
  { item: 'ENG-003-A-PU-08', verdict: 'LIBRARY', why: 'The library hint is better here. An item hint earns its place by saying something the library hint cannot; this one does not.' },
  { item: 'ENG-003-A-PU-09', verdict: 'APPROVED' },
];

async function main() {
  const her = readFileSync(HER_FILE, 'utf8').replace(/\s*\n\s*/g, ' ');
  for (const r of RULINGS) {
    if (r.verdict !== 'REPLACED') continue;
    if (!her.includes(r.authored)) {
      throw new Error(
        `apply-annie-27th ABORTED — ${r.item}'s authored wording is not in ${HER_FILE} verbatim.\n` +
          `  Expected: "${r.authored}"`,
      );
    }
    const gate = checkChildFacingText({ role: 'misconception-hint', label: r.item, text: r.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`apply-annie-27th ABORTED — ${r.item} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  }
  console.log('all authored wordings located in her file and gated clean\n');

  for (const r of RULINGS) {
    const item = await prisma.item.findUnique({ where: { id: r.item }, select: { explanation: true } });
    if (!item) { console.log(`  MISSING ${r.item}`); continue; }
    const e = { ...(item.explanation as Record<string, unknown>) };

    if (r.verdict === 'HELD') { console.log(`  HELD     ${r.item} — ${r.why}`); continue; }
    if (r.verdict === 'LIBRARY') {
      e.hintServes = 'library';
      e.hintRuling = r.why;
      e.hintRuledBy = READER;
      e.hintAuthority = AUTHORITY;
      console.log(`  LIBRARY  ${r.item} — RULED to the library hint, not left unruled`);
    } else {
      if (r.verdict === 'REPLACED') {
        e._previousHintCore = e.hintCore;
        e.hintCore = r.authored;
      }
      e.hintAuthoredBy = READER;
      e.hintAuthority = AUTHORITY;
      console.log(`  ${r.verdict.padEnd(8)} ${r.item}${r.verdict === 'REPLACED' ? `\n             now: "${r.authored}"` : ''}`);
    }
    if (APPLY) await prisma.item.update({ where: { id: r.item }, data: { explanation: e as object } });
  }
  console.log(APPLY ? '\napplied.' : '\nREPORT ONLY. Re-run with --apply.');
  await prisma.$disconnect();
}

void main();
