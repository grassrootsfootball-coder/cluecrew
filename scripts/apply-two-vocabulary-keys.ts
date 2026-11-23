/**
 * THE TWO AUTHORED KEYS — the oldest live fault on the board, closed (Annie, 2026-08-19 — R336).
 *
 * `bank-vr-04-closest-meaning-23`: **obedient → well-behaved** (was `dutiful`, rarer than its
 * headword). `bank-vr-04-closest-meaning-30`: **exhausted → worn out** (was `tired`, weaker than
 * its stem).
 *
 * **THE `-30` PROVENANCE IS THE STRONGEST EVIDENCE THE NEVER-RAN FINDING HAS PRODUCED** (R269).
 * The typed constructor's own parallel item, `gen-vr-04-closest-meaning-28`, tags **`tired` as
 * `vr04-wrong-strength` for `exhausted`** — it had already ruled that word a DISTRACTOR on the
 * exact intensity ground she names. **The live bank served the constructor's distractor as its
 * key**, because the constructor never ran over the bank.
 *
 * **PROVISIONAL AGAINST DIRECTION, RECORDED ON THE ROW.** `vr-04` expects a key COMMONER than its
 * stem (R323) and **that cannot be checked**: neither `well-behaved` nor `worn out` has a vault
 * entry and no frequency source is installed. The row carries the claim as UNVERIFIED with a named
 * **return condition** — they come back to her the day the signal lands, and if either is still
 * rarer than its stem she chooses again. **A provisional value with a return condition is a
 * decision; one without is a guess that will be read as a decision.**
 *
 * **AND WHAT IS DELIBERATELY NOT DONE HERE.** `tired` is not added as a `vr04-wrong-strength`
 * distractor on `-30`, and `well-behaved` being the only hyphenated option among three single words
 * is not addressed. Both are hers, both are deferred, and both would **re-derive a LIVE reviewed
 * item to improve a sound option set rather than to repair the fault** — which is exactly the
 * coupling R62 exists to refuse.
 */
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const ANNIE = 'reviewer:rev-0001';
const EDITS = [
  { itemId: 'bank-vr-04-closest-meaning-23', stem: 'obedient', from: 'dutiful', to: 'well-behaved',
    fault: 'key rarer than its headword' },
  { itemId: 'bank-vr-04-closest-meaning-30', stem: 'exhausted', from: 'tired', to: 'worn out',
    fault: 'key weaker than its stem' },
];

async function main() {
  for (const edit of EDITS) {
    const item = await prisma.item.findUniqueOrThrow({
      where: { id: edit.itemId },
      include: { options: { orderBy: { id: 'asc' } }, questionType: { select: { mechanic: true } } },
    });
    const key = item.options.find((o) => o.isCorrect);
    if (!key) throw new Error(`REFUSED at ${edit.itemId}: no correct option.`);
    const content = { ...((key.content ?? {}) as Record<string, unknown>) };
    if (content.value === edit.to) { console.log(`${edit.itemId}: already written`); continue; }
    if (content.value !== edit.from) {
      throw new Error(`REFUSED at ${edit.itemId}: the key is "${content.value}", not "${edit.from}". Report, do not adapt.`);
    }
    content.value = edit.to;

    const nextOptions = item.options.map((o) => (o.id === key.id ? { ...o, content } : o));
    const faults = checkItemChildFacing({
      id: item.id, stem: item.stem, explanation: item.explanation,
      mechanic: item.questionType.mechanic, options: nextOptions,
    }).filter(isBlocking);
    if (faults.length > 0) throw new Error(`REFUSED at ${edit.itemId}: ${faults.map((f) => f.detail).join(' | ')}`);

    await prisma.itemOption.update({ where: { id: key.id }, data: { content: content as object } });
    await prisma.item.update({
      where: { id: item.id },
      data: {
        reviewedBy: ANNIE,
        tierRationale: `${item.tierRationale ?? ''}`.trim() || null,
        r4Note: [
          `KEY REPLACED 2026-08-19 by Annie: "${edit.from}" -> "${edit.to}" (${edit.fault}).`,
          'PROVISIONAL AGAINST DIRECTION: vr-04 expects a key commoner than its stem (R323) and that is UNVERIFIED —',
          `"${edit.to}" has no vault entry and no frequency source is installed.`,
          'RETURN CONDITION: this key returns to Annie the day the frequency signal lands. If it is still rarer than its stem, she chooses again.',
        ].join(' '),
      },
    });
    console.log(`${edit.itemId}: ${edit.stem} — "${edit.from}" -> "${edit.to}"`);
  }

  const back = await prisma.item.findMany({
    where: { id: { in: EDITS.map((e) => e.itemId) } },
    include: { options: { orderBy: { id: 'asc' } } },
  });
  console.log('\nread back:');
  for (const i of back) {
    const k = i.options.find((o) => o.isCorrect)!;
    console.log(`  ${i.id}: key="${(k.content as { value?: string }).value}" reviewedBy=${i.reviewedBy}`);
    console.log(`      ${(i.r4Note ?? '').slice(0, 95)}…`);
  }
  await prisma.$disconnect();
}

main();
