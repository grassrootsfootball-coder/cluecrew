/**
 * VAULT CORRECTION — likelierKnown on four two-sense cards (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/fix-vault-likelier-known.ts`
 *
 * THE RULE: a word's likelier-known sense is the one a child can USE, not the one she has most
 * often SEEN. `animated film` and `the passive voice` are LABELS she recognises; they do not give
 * her the word. Whoever populated the field was ranking exposure, and the flip needs meaning.
 *
 * The field feeds the vocabulary-in-context flip, which carries a signature — a wrong value there
 * produces an item labelled RARE that tests the FAMILIAR sense, the exact shortcut the flip closes.
 * Fixed in the DATA rather than worked around in the bank, so the next reader is not misled too.
 *
 * Pass over all 67 two-sense cards: 8 carry lk=B; these 4 are wrong; capital / mature / passage are
 * right (a child can use each); condemn is borderline and left alone. `noble` (lk=A) is raised as a
 * candidate for the reverse error and left for the reviewer.
 */
import { prisma } from '../packages/db/src/index';

const FIX: Array<[string, string]> = [
  ['passive', 'Grammar-label sense is recognised, not usable; "accepting whatever happens" is the sense she has.'],
  ['genuine', '"Real, not fake" is the child sense (genuine leather); honest-about-feelings is the later extension.'],
  ['valid', '"Based on good reasons" is met in school ("a valid point"); official-and-unexpired is rare for her.'],
  ['animated', '"Full of life" is the meaning; the cartoon sense is a technical label she recognises.'],
];

async function main(): Promise<void> {
  for (const [headword, why] of FIX) {
    const w = await prisma.word.findFirst({ where: { headword } });
    if (!w) { console.log(`MISSING ${headword}`); continue; }
    await prisma.word.update({ where: { id: w.id }, data: { likelierKnown: 'A', likelierKnownNote: `Corrected B→A (annie, 2026-08-08): ${why}` } });
    console.log(`${headword}: ${w.likelierKnown} → A`);
  }
  await prisma.$disconnect();
}

void main();
