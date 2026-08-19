/**
 * WRITES REVIEWED CONTENT UNGUARDED — a one-shot ruling-applier (R63).
 *
 * **A PUNCTUATION ERROR ON A CHILD'S SCREEN, FROM A PRODUCT THAT SELLS PUNCTUATION** (Annie,
 * 2026-08-19). `ENG-001-WIW-09`'s walk script closes a quotation with an exclamation mark and then
 * puts a full stop OUTSIDE it — `road!'.` — which is precisely the fault `en-spag-punct-spot` items
 * are built to make a child spot.
 *
 * **HUNTED BEFORE IT WAS FIXED, AND THE DENOMINATOR IS THE POINT.** 704 walk scripts screened for a
 * doubled terminal mark across a closing quote. **One instance, this one.** A single fault is worth
 * fixing; a single fault ACROSS A SCREENED POPULATION is worth knowing, because it says the class
 * is not systemic and no sweep is owed.
 */
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const ID = 'ENG-001-WIW-09';
const BEFORE = "road!'.";
/** The mark belongs to the quotation. Nothing outside it. */
const AFTER = "road!'";

async function main() {
  const item = await prisma.item.findUniqueOrThrow({
    where: { id: ID },
    include: { options: true, questionType: { select: { mechanic: true } } },
  });
  const explanation = { ...((item.explanation ?? {}) as Record<string, unknown>) };
  const script = explanation.walkScript;
  if (typeof script !== 'string') throw new Error(`REFUSED: ${ID} carries no walkScript string.`);
  const occurrences = script.split(BEFORE).length - 1;
  if (occurrences !== 1) {
    throw new Error(`REFUSED: expected exactly 1 occurrence of ${JSON.stringify(BEFORE)}, found ${occurrences}. Report, do not adapt.`);
  }
  explanation.walkScript = script.replace(BEFORE, AFTER);

  const faults = checkItemChildFacing({
    id: item.id, stem: item.stem, explanation,
    mechanic: item.questionType.mechanic, options: item.options,
  }).filter(isBlocking);
  if (faults.length > 0) throw new Error(`REFUSED: ${faults.map((f) => f.detail).join(' | ')}`);

  await prisma.item.update({ where: { id: ID }, data: { explanation: explanation as object } });

  const back = await prisma.item.findUniqueOrThrow({ where: { id: ID }, select: { explanation: true } });
  const now = String(((back.explanation ?? {}) as Record<string, unknown>).walkScript);
  console.log(`read back: contains the fault? ${now.includes(BEFORE)}`);
  if (now.includes(BEFORE)) throw new Error('read-back still carries the fault');
  const window = now.match(/.{0,50}road!'.{0,30}/)?.[0];
  console.log(`  …${window}…`);
  await prisma.$disconnect();
}

main();
