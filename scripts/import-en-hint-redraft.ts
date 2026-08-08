/**
 * `en-narrator-voice-as-fact` — split only, no wording change (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-en-hint-redraft.ts`
 *
 * Transform, applied to the DB's OWN wording: split the 20-word question at its "or" into two
 * questions, repeating "is it" so the second limb stands alone. Drop no words. The DB's leading
 * sentence ("Ask yourself whose opinion this is.") is KEPT — it is part of the hint.
 *
 * Her suggested guard is implemented: refuse to write if "a room full of people" does not survive.
 */
import { prisma } from '../packages/db/src/index';

const ID = 'en-narrator-voice-as-fact';

async function main(): Promise<void> {
  const before = await prisma.misconception.findUnique({ where: { id: ID } });
  if (!before) { console.log(`MISSING ${ID}`); return; }
  const current = String(before.childHint).replace(/^"+|"+$/g, '').trim();

  // The split: ", or the writer" -> "? Or is it the writer"
  const next = current.replace(/,\s+or the writer telling you/, '? Or is it the writer telling you');
  if (next === current) throw new Error('Refusing to write: the "or" split did not apply to the DB text.');
  if (!next.includes('a room full of people')) throw new Error('Refusing to write: "a room full of people" did not survive the split.');

  const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  const before_n = current.split(/\s+/).filter(Boolean).length;
  const after_n = next.split(/\s+/).filter(Boolean).length;
  if (after_n < before_n) throw new Error(`Refusing to write: ${before_n - after_n} word(s) lost in a split-only transform.`);

  await prisma.misconception.update({ where: { id: ID }, data: { childHint: next } });
  const sentences = next.split(/(?<=[.!?])\s+/).filter(Boolean);
  console.log(`was: ${current}`);
  console.log(`now: ${next}`);
  console.log(`sentences: ${sentences.map(words).join(', ')} words (cap 16); words ${before_n} -> ${after_n}`);
  await prisma.$disconnect();
}

void main();
