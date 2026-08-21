/**
 * The amendments she authored that never reached the store (R405).
 *
 * **Ruled decisions that never took effect. Every day one sits unapplied, a child meets a string a
 * reviewer replaced.** Each authored wording is READ FROM HER FILE and refused if absent (R25/R397),
 * each target is verified to exist, and each BEFORE-VALUE is reported.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const RETURNS = '/Users/davidb/Downloads';
const APPLY = process.argv.includes('--apply');

/** Target ids recovered from the CONTEXT of each authored line in her returns, never guessed. */
const AMENDMENTS: Array<{ id: string; authored: string; from: string }> = [
  { id: 'en-plausible-not-stated', from: 'seventeenth', authored: 'Sounding sensible is not enough. Find the line that proves it.' },
  { id: 'en-determiner-omitted', from: 'sixteenth', authored: 'A single thing needs a word in front of it. Say the line aloud and listen.' },
  { id: 'en-technique-device-confusion', from: 'sixteenth', authored: 'Does the line say like or as? A comparison using those words is a simile.' },
  { id: 'en-technique-intent-as-character', from: 'sixteenth', authored: 'Ask who is doing this. Is it the writer, or the character?' },
  { id: 'en-technique-structure-effect-blind', from: 'sixteenth', authored: 'Look at how long it is, not just what it says. What does that length do?' },
  { id: 'en-article-definiteness', from: 'eng003-second', authored: 'Has the text named it already? That changes which little word fits.' },
  { id: 'en-modal-conditional-form', from: 'eng003-second', authored: "An imagined if takes 'would'. A real if takes 'will'." },
];

/** The return file an amendment came from, and its digest — so the authority is CHECKABLE. */
function sourceOf(from: string): string {
  const f = readdirSync(RETURNS).find((n) => /^annie-.*return.*\.md$/.test(n) && n.includes(from));
  if (!f) throw new Error(`apply-unlanded ABORTED — no return file matches "${from}".`);
  return f;
}
function digestOf(from: string): string {
  return createHash('sha256').update(readFileSync(join(RETURNS, sourceOf(from)))).digest('hex');
}

async function main() {
  const her = readdirSync(RETURNS).filter((f) => /^annie-.*return.*\.md$/.test(f))
    .map((f) => readFileSync(join(RETURNS, f), 'utf8')).join('\n').replace(/\s*\n\s*/g, ' ');

  for (const a of AMENDMENTS) {
    if (!her.includes(a.authored)) {
      throw new Error(`apply-unlanded ABORTED — "${a.authored}" is in no return file. A wording not in her hand is not hers.`);
    }
    const gate = checkChildFacingText({ role: 'misconception-hint', label: a.id, text: a.authored }).filter(isBlocking);
    if (gate.length > 0) throw new Error(`apply-unlanded ABORTED — ${a.id} fails the gate: ${gate.map((f) => f.detail).join('; ')}`);
  }
  console.log(`${AMENDMENTS.length} authored wording(s) located in her returns and gated clean\n`);

  const carriers = await prisma.item.findMany({ include: { options: true } });
  const countFor = (id: string) => {
    let live = 0; let all = 0;
    for (const i of carriers) for (const o of i.options) {
      if ((o as { misconceptionId?: string | null }).misconceptionId !== id) continue;
      all++; if (i.status === 'LIVE') live++;
    }
    return { live, all };
  };

  for (const a of AMENDMENTS) {
    const row = await prisma.misconception.findUnique({ where: { id: a.id }, select: { id: true, childHint: true } });
    if (!row) { console.log(`  MISSING TARGET  ${a.id} — not in the library. Reported, not created.`); continue; }
    const c = countFor(a.id);
    console.log(`  ${a.id}  (${c.live} LIVE / ${c.all} carriers, her ${a.from} return)`);
    console.log(`      BEFORE: ${JSON.stringify(row.childHint)}`);
    console.log(`      AFTER : ${JSON.stringify(a.authored)}`);
    if (row.childHint === a.authored) { console.log('      already applied'); continue; }
    /**
      * **HER AUTHORITY TRAVELS ON THE WRITE** (R257). The trim guard refused the first run: her
      * wording is one word shorter than the stored text, and **a shortening is exactly what a
      * fit-to-cap rewrite looks like.** The guard cannot tell an approver's redraft from a machine
      * trim by the strings — only by who is writing — so the declaration goes in the same update or
      * the refusal is correct. It was correct: an undeclared write of a shorter approved hint is
      * the thing R213 exists to stop, and this one had no declaration on it.
      */
    if (APPLY) {
      await prisma.misconception.update({
        where: { id: a.id },
        data: {
          childHint: a.authored,
          textProvenance: {
            state: 'RECORDED',
            approvedByPerson: 'Annie',
            authority: `${sourceOf(a.from)}, read from the file, sha256 ${digestOf(a.from)}`,
            method: 'authored by the reviewer in her return; applied verbatim',
            appliedOn: '2026-08-21',
            note: 'Ruled when written; never reached the store until now (R403).',
          },
        },
      });
    }
  }
  console.log(APPLY ? '\napplied.' : '\nREPORT ONLY. Re-run with --apply.');
  await prisma.$disconnect();
}

void main();
