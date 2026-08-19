/**
 * THE DEFINITION HOUSE STYLE — a lower-case fragment with no terminal stop (David's ruling,
 * 2026-08-19, taking Annie's preference as house style — R311).
 *
 * **HER REASON IS THE RULE'S SHAPE.** The card reads as **a gloss under a headword**, not as a
 * sentence: the headword is already on the card, the definition completes it, and sentence-casing a
 * completion makes the card read as two separate statements instead of one.
 *
 * **THIS IS A REGISTER CHANGE, NOT A REWORDING.** Only the first character's case and a trailing
 * stop move. **No word is added, removed or replaced** — so a reviewer comparing before and after
 * is checking one property and not re-reading 157 definitions. That is the same discipline as the
 * `futile` fix (R307): change only what the ruling names, or the reviewer ends up reviewing me.
 *
 * **A LEADING PROPER NOUN OR "I" IS LEFT ALONE.** Lower-casing them would be a spelling error
 * dressed as a house style, and the rule is about register rather than about capitals.
 */
import { prisma } from '../packages/db/src/index';

/** Words that keep their capital at the start of a gloss. Extend rather than infer. */
const KEEP_CAPITAL = /^(I|I'm|I've|British|English|Britain|England|London|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)\b/;

export function houseStyle(text: string): string {
  let out = text.trim();
  if (!KEEP_CAPITAL.test(out)) out = out.charAt(0).toLowerCase() + out.slice(1);
  return out.replace(/[.!?]+$/, '');
}

async function main() {
  const words = await prisma.word.findMany({ select: { id: true, headword: true, status: true, definitionChild: true } });
  const plan = words
    .filter((w) => typeof w.definitionChild === 'string' && w.definitionChild.trim() !== '')
    .map((w) => ({ ...w, next: houseStyle(w.definitionChild!) }))
    .filter((w) => w.next !== w.definitionChild);

  console.log(`vault rows: ${words.length} · definitions changing register: ${plan.length}`);
  const byStatus = new Map<string, number>();
  for (const p of plan) byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
  for (const [s, n] of [...byStatus].sort()) console.log(`    ${s}: ${n}`);

  // Assert the change is REGISTER ONLY before writing: same words, same order, same letters
  // beyond the first character's case.
  for (const p of plan) {
    const before = p.definitionChild!.trim().replace(/[.!?]+$/, '').toLowerCase();
    const after = p.next.toLowerCase();
    if (before !== after) {
      throw new Error(`REFUSED at ${p.headword}: the change is not register-only.\n  before: ${p.definitionChild}\n  after : ${p.next}`);
    }
  }
  console.log('  assertion: every change is register-only (case of the first letter, terminal stop). PASSED.');

  if (!process.argv.includes('--write')) {
    console.log('\nDry run. Samples:');
    for (const p of plan.slice(0, 5)) console.log(`  ${p.headword}: "${p.definitionChild}" -> "${p.next}"`);
    console.log('\nRe-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  for (const p of plan) await prisma.word.update({ where: { id: p.id }, data: { definitionChild: p.next } });
  const back = await prisma.word.findMany({ select: { definitionChild: true } });
  const stillSentence = back.filter((w) => typeof w.definitionChild === 'string'
    && (/^[A-Z]/.test(w.definitionChild) && !KEEP_CAPITAL.test(w.definitionChild) || /[.!?]$/.test(w.definitionChild.trim())));
  console.log(`\nwritten: ${plan.length} · read back still sentence-shaped: ${stillSentence.length}`);
  if (stillSentence.length > 0) throw new Error('read-back disagrees');
  await prisma.$disconnect();
}

main();
