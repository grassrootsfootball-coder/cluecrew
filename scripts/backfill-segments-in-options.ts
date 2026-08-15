/**
 * DECLARE segmentsInOptions ON THE ERROR-SPOT STEMS — `pnpm backfill:segments [--write]`
 *
 * The 18 ENG-003 error-spot items are ALREADY in the refactored form: the stem ends "…choose N."
 * and the sentence lives in the options, all 18 carrying sentence-length option text. The data
 * matches Cowork. What is missing on both sides is the DECLARATION that this is what the item is.
 *
 * WHY THIS BLOCKS THE EMITTER (David's ruling, 2026-08-13). Two stores agreeing on content and
 * disagreeing on what the content IS would pass a hash comparison unchanged — the hashes are over
 * the same strings. `segmentsInOptions` was found by accident, and a manifest that omits it would
 * be a comparison that cannot see the difference it exists to catch.
 *
 * SCOPE IS THE MECHANIC, not an id list: every `error-spot` item, none of the 16 cloze. Measured
 * before writing — the database holds exactly 18 error-spot items, all ENG-003, 0 already
 * declaring the field. Cloze stays inline by design and is out of scope.
 *
 * This write PREDATES the write-boundary record it is being done to enable. It leaves an
 * AttributionEvent, which is the closest thing to that boundary that exists today, and the
 * boundary's first job is to make a note like this unnecessary.
 */
import { prisma } from '../packages/db/src/index';

const DAVID = 'human:david@cluecrew.test';

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  const items = await prisma.item.findMany({
    where: { questionType: { mechanic: 'error-spot' } },
    include: { options: true, questionType: true },
    orderBy: { id: 'asc' },
  });

  // Every one must actually BE segmented, or the declaration would be a claim rather than a record.
  const notSegmented = items.filter(
    (it) => !it.options.some((o) => String((o.content as { value?: unknown })?.value ?? '').length > 25),
  );
  const already = items.filter((it) => 'segmentsInOptions' in ((it.stem ?? {}) as object));

  console.log(`error-spot items: ${items.length} · already declared: ${already.length} · NOT segmented: ${notSegmented.length}`);
  if (notSegmented.length > 0) {
    console.error('REFUSED — these carry no sentence-length option text, so the declaration would be false:');
    for (const it of notSegmented) console.error(`  x ${it.id}`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const todo = items.filter((it) => !('segmentsInOptions' in ((it.stem ?? {}) as object)));
  if (!write) {
    console.log(`${todo.length} would be declared. Dry run; re-run with --write.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    todo.map((it) =>
      prisma.item.update({
        where: { id: it.id },
        data: { stem: { ...((it.stem ?? {}) as object), segmentsInOptions: true } },
      }),
    ),
  );
  for (const it of todo) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'item', recordId: it.id, action: 'AMENDED',
        // No reviewerId: this is David's own operational backfill, not a reviewer ruling, and
        // there is no Reviewer row for him. Inventing 'rev-0000-david' would have failed the
        // foreign key — and the .catch() that used to sit on this create would have swallowed it,
        // leaving the write applied and unrecorded. Audit writes never swallow.
        actor: 'human:david@cluecrew.test', recordedBy: DAVID, field: 'stem.segmentsInOptions',
        method: 'R73 declaration backfill, 2026-08-13',
        note:
          'Declared segmentsInOptions: true. The item was ALREADY in the refactored form — stem ends ' +
          '"choose N.", sentence carried in the options — so this records what the item is and changes ' +
          'no child-facing text. Scoped by mechanic (error-spot), never an id list.',
      },
    });
  }

  // VERIFY BY RE-READING THE THING ACTED ON, never by counting what is left.
  const after = await prisma.item.findMany({
    where: { questionType: { mechanic: 'error-spot' } },
    include: { options: true }, orderBy: { id: 'asc' },
  });
  let declared = 0, textUnchanged = 0;
  const before = new Map(items.map((it) => [it.id, String(((it.stem ?? {}) as { prompt?: unknown }).prompt ?? '')]));
  for (const it of after) {
    const s = (it.stem ?? {}) as { segmentsInOptions?: unknown; prompt?: unknown };
    if (s.segmentsInOptions === true) declared += 1;
    if (String(s.prompt ?? '') === before.get(it.id)) textUnchanged += 1;
  }
  console.log(`\nVERIFIED by re-reading all ${after.length} error-spot rows:`);
  console.log(`  declaring segmentsInOptions: ${declared} of ${after.length}`);
  console.log(`  stem prompt text unchanged:  ${textUnchanged} of ${after.length}`);
  await prisma.$disconnect();
}

void main();
