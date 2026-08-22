/**
 * `en-contraction-apostrophe`: AN ENTRY APPROVED WEEKS AGO AND NEVER WRITTEN (R613).
 *
 * **WRITES CONTENT UNGUARDED (R63) — every value is supplied by a human ruling.** The eng003-third
 * return, §6: *"Definition, scope note, and child hint all pass the read… ApprovedBy Annie. CZ-B7 D
 * retags on its write; the row becomes servable when the entry lands."* **The entry never landed.**
 * The draft sat in `LIBDRAFTencontractionapostrophe.json`, her approval sat in the return, CZ-B7's
 * `Youre` sat under `en-apostrophe-possession` — whose hint's third sentence says *"Try swapping in
 * 'it is'"*, which does nothing for *you're* — and `check:reissue-completion`'s class (a described
 * act that never completed) had another member nobody had counted.
 *
 * **RETAGGING WITHOUT AMENDING IS THE POINT.** The possession hint fits its possessive carriers; the
 * contraction option is in the wrong ENTRY. Amending the hint to cover it would fix the symptom and
 * keep the fault (her ruling, seventy-third relay) — and would also break the hint for the twelve it
 * fits, which is R607's assertion fault manufactured on purpose.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const DRAFT = '/Users/davidb/Downloads/LIBDRAFTencontractionapostrophe.json';
const APPROVAL = '/Users/davidb/Downloads/annie-eng003-third-return.md';
const APPLY = process.argv.includes('--apply');

async function main() {
  const draft = JSON.parse(readFileSync(DRAFT, 'utf8')) as Record<string, string>;
  const approvalText = readFileSync(APPROVAL, 'utf8');
  if (!/en-contraction-apostrophe: approved as written/.test(approvalText)) {
    throw new Error('ABORTED — the approval sentence is not in the eng003-third return. Nothing written.');
  }
  const gate = checkChildFacingText({ role: 'hint', label: draft.id as string, text: draft.childHint as string })
    .filter(isBlocking);
  if (gate.length) throw new Error(`ABORTED — the approved hint fails the gate: ${gate.map((f) => f.detail).join('; ')}`);

  const opt = await prisma.itemOption.findFirst({
    where: { itemId: 'ENG-003-A-CZ-B7', misconceptionId: 'en-apostrophe-possession' },
  });
  if (!opt || (opt.content as { value?: string }).value !== 'Youre') {
    throw new Error('ABORTED — CZ-B7 does not carry "Youre" under en-apostrophe-possession. The premise has moved.');
  }

  console.log(`ENTRY  ${draft.id}\n  hint: ${draft.childHint}\n  desc: ${draft.description}`);
  console.log(`RETAG  ENG-003-A-CZ-B7 "Youre": en-apostrophe-possession -> ${draft.id}`);
  if (!APPLY) { console.log('\nREPORT ONLY. Re-run with --apply.'); await prisma.$disconnect(); return; }

  const digest = createHash('sha256').update(readFileSync(APPROVAL)).digest('hex');
  await prisma.misconception.upsert({
    where: { id: draft.id as string },
    create: {
      id: draft.id as string, district: 'ENGLISH', status: 'ACTIVE',
      description: draft.description as string, childHint: draft.childHint as string,
      proposedBy: draft.proposedBy as string,
      textProvenance: {
        state: 'RECORDED', approvedByPerson: 'Annie',
        authority: `annie-eng003-third-return.md §6 ("approved as written"), sha256 ${digest}`,
        method: 'drafted by Cowork, approved by her verbatim; written weeks late — the write, not the approval, is what had not happened',
        appliedOn: new Date().toISOString().slice(0, 10),
      },
    },
    update: {},
  });
  await prisma.itemOption.update({ where: { id: opt.id }, data: { misconceptionId: draft.id as string } });

  const check = await prisma.itemOption.findUnique({ where: { id: opt.id }, select: { misconceptionId: true } });
  console.log(`\n  READ BACK: CZ-B7 "Youre" now carries ${check?.misconceptionId}.`);
  if (check?.misconceptionId !== draft.id) process.exitCode = 1;
  await prisma.$disconnect();
}

void main();
