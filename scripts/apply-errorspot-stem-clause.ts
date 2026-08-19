/**
 * WRITES AUTHORED ITEM CONTENT UNGUARDED — a one-shot ruling-applier (R63). The value comes from a
 * reviewer ruling, not a derivation function.
 *
 * **ANNIE'S FIFTH RETURN, SECTION 3, NEVER WRITTEN UNTIL NOW.** The final clause of all eighteen
 * error-spot stems becomes *"If every part is right, choose No mistake."* The child sees a button
 * reading **No mistake** and a stem telling them to choose **N** — the label and the instruction
 * name the same option two different ways, and only one of them is on the screen.
 *
 * **THE EIGHTEEN SAT BEHIND A QUEUE ENTRY NAMED FOR THE LAYOUT WHILE THE BLOCKER WAS ONE CLAUSE.**
 * The layout was built (R209), verified at 375px (R233), and was never the fault. A queue item
 * named for the wrong thing gets the wrong worker: this needed neither an engineer nor a second
 * render, and it waited on both.
 *
 * **`_previousText` IS NOT UPDATED, DELIBERATELY.** It is a Cowork shadow field carrying the
 * history of the 2026-08-19 stem repairs, disposition NOT_CARRIED: the repair history lives in
 * Cowork's store and this side holds the CURRENT text. Writing to it here would start maintaining
 * a second copy of a history we have ruled we do not hold.
 *
 * **THE RETURN LEG IS PART OF THE ACT, NOT A FOLLOW-UP.** Cowork is authoritative for authored item
 * content; a ruling-forced change here must travel back or the two stores drift on 18 stems.
 * `pnpm export:english-batches` is that path and is named in the output rather than left to memory.
 */
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const BEFORE = 'If every part is right, choose N.';
const AFTER = 'If every part is right, choose No mistake.';
const TYPES = ['en-spag-punct-spot', 'en-spag-spelling-spot'];

async function main() {
  const items = await prisma.item.findMany({
    where: { questionTypeId: { in: TYPES } },
    include: { options: true, questionType: { select: { mechanic: true } } },
    orderBy: { id: 'asc' },
  });
  if (items.length !== 18) throw new Error(`REFUSED: expected 18 error-spot items, found ${items.length}. A ruling whose target moved is reported, never adapted.`);

  // R87's discipline in a data edit: assert the anchor on EVERY row before writing ANY row.
  const misses = items.filter((i) => !String(((i.stem ?? {}) as { text?: string }).text ?? '').includes(BEFORE));
  if (misses.length > 0) {
    throw new Error(`REFUSED: ${misses.length} of 18 stems do not carry the clause being replaced (${misses.map((m) => m.id).join(', ')}). All-or-nothing.`);
  }

  // The N option must actually READ "No mistake", or the new clause names something not on screen.
  const badLabel = items.filter((i) => !i.options.some((o) => {
    const c = (o.content ?? {}) as { label?: string; value?: string };
    return c.label === 'N' && c.value === 'No mistake';
  }));
  if (badLabel.length > 0) {
    throw new Error(`REFUSED: ${badLabel.length} item(s) have no option reading exactly "No mistake" (${badLabel.map((b) => b.id).join(', ')}). The clause would point at a button that says something else.`);
  }

  let written = 0;
  for (const item of items) {
    const stem = { ...((item.stem ?? {}) as Record<string, unknown>) };
    stem.text = String(stem.text).replace(BEFORE, AFTER);
    // Gate the NEW text before it lands, through the one door every other writer uses.
    const faults = checkItemChildFacing({
      id: item.id, stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: item.options,
    }).filter(isBlocking);
    if (faults.length > 0) {
      throw new Error(`REFUSED at ${item.id}: ${faults.map((f) => f.detail ?? JSON.stringify(f)).join(' | ')}`);
    }
    await prisma.item.update({ where: { id: item.id }, data: { stem: stem as object } });
    written += 1;
  }

  const after = await prisma.item.findMany({
    where: { questionTypeId: { in: TYPES } },
    select: { id: true, status: true, stem: true },
    orderBy: { id: 'asc' },
  });
  const carrying = after.filter((i) => String(((i.stem ?? {}) as { text?: string }).text ?? '').includes(AFTER));
  console.log(`written: ${written} · read back from the store carrying the new clause: ${carrying.length} of 18`);
  if (carrying.length !== 18) throw new Error('read-back disagrees with the write count');

  // THE DELTAS, in the four-word vocabulary.
  const cases = await prisma.case.findMany({ select: { questionTypeId: true, freeTier: true } });
  const caseTypes = new Set(cases.map((c) => c.questionTypeId));
  const byStatus = after.reduce((a, i) => ({ ...a, [i.status]: (a[i.status] ?? 0) + 1 }), {} as Record<string, number>);
  console.log(`\nSTORED     18 (all ${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ')})`);
  console.log(`PUBLISHED  ${after.filter((i) => i.status === 'LIVE').length}  — status LIVE`);
  console.log(`SERVABLE   ${after.filter((i) => i.status === 'LIVE').length}  — LIVE and not held at the door`);
  const reachableTypes = TYPES.filter((t) => caseTypes.has(t));
  console.log(`REACHABLE  0  — ${reachableTypes.length} of ${TYPES.length} error-spot question type(s) are named by any Case row`);
  console.log(`\nDELTA FROM THIS WRITE: 0 on every serving sense. The clause was the CONTENT blocker;`);
  console.log(`  it is not the serving blocker. Two things still stand between these 18 and a child:`);
  console.log(`  (1) they are DRAFT — publication goes through the review pipeline, not this script;`);
  console.log(`  (2) NO CASE NAMES EITHER error-spot question type, so at LIVE they would be`);
  console.log(`      PUBLISHED and SERVABLE but still REACHABLE by nobody.`);
  console.log(`\nRETURN LEG: run 'pnpm export:english-batches' so Cowork absorbs these 18 stems.`);
  await prisma.$disconnect();
}

main();
