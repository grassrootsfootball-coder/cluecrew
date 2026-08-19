/**
 * WRITES A DRAFT VAULT ROW — a one-shot fix (R63). The row is DRAFT and unsigned, so no approval is
 * being overwritten and no reviewed content is touched.
 *
 * **`futile`'s CHILD DEFINITION USED A BANNED WORD, ON A CARD BOUND FOR A REVIEW PACK.** *"certain
 * to fail, so not worth doing at all"* — and **fail is banned child-facing under D1**. The gate had
 * already caught it; sending it to Annie anyway would have spent her attention on something a
 * machine had found, which is the opposite of what a review pack is for.
 *
 * **THE SMALLEST CHANGE THAT CLEARS THE BAN.** Only the banned clause moves — *fail* becomes *come
 * to nothing* — so the definition she reads is the drafter's, minus the one word the gate refuses.
 * A wholesale redraft would have put my authoring in front of her under a machine's name.
 */
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const ID = 'futile';
const BEFORE = 'certain to fail, so not worth doing at all.';
const AFTER = 'certain to come to nothing, so not worth doing at all.';

async function main() {
  const row = await prisma.word.findUniqueOrThrow({ where: { id: ID } });
  if (row.definitionChild === AFTER) { console.log('already reworded'); await prisma.$disconnect(); return; }
  if (row.definitionChild !== BEFORE) {
    throw new Error(`REFUSED: the stored definition is not the one being replaced.\n  here: ${row.definitionChild}`);
  }
  if (row.status !== 'DRAFT') {
    throw new Error(`REFUSED: ${ID} is ${row.status}, not DRAFT. A published card changes by ruling, not by a gate fix.`);
  }
  const faults = checkChildFacingText({ role: 'word-card', label: ID, text: AFTER, headwordInOwnCard: ID }).filter(isBlocking);
  if (faults.length > 0) throw new Error(`REFUSED: the replacement fails the gate — ${faults.map((f) => f.detail).join(' | ')}`);

  await prisma.word.update({ where: { id: ID }, data: { definitionChild: AFTER } });
  const back = await prisma.word.findUniqueOrThrow({ where: { id: ID } });
  console.log(`read back : ${back.definitionChild}`);
  console.log(`matches   : ${back.definitionChild === AFTER}`);
  console.log(`gate now  : ${checkChildFacingText({ role: 'word-card', label: ID, text: back.definitionChild ?? '', headwordInOwnCard: ID }).filter(isBlocking).length === 0 ? 'PASSES' : 'BLOCKED'}`);
  await prisma.$disconnect();
}

main();
