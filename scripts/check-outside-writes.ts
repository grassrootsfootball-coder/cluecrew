/**
 * WRITES WITH NO RULING BEHIND THEM — `pnpm check:outside-writes`
 *
 * `ContentWriteLog` is what the DATABASE saw; `AttributionEvent` is what somebody DECIDED. This
 * compares them. A write in the first with nothing in the second is a change to reviewable content
 * that no ruling accounts for.
 *
 * THE CASE THAT BUILT IT. Two of 715 stored options were found carrying no label. The letter is
 * derived at render time from position, so both items read perfectly and no gate objected; neither
 * carried an attribution event, no script in this repo writes a single option's content except the
 * normalisation pass, and no commit referenced either id. The write was not suspicious — it was
 * UNACCOUNTABLE, which is worse, because nothing could even say when it happened.
 *
 * THE DENOMINATOR IS THE BOUNDARY'S AGE, AND IT IS STATED ON EVERY RUN (R62). The triggers were
 * installed on 2026-08-16. Every write before that is invisible here and always will be — this
 * check cannot say anything about the two unlabelled options that prompted it. Reporting "0
 * unattributed writes" without that sentence would be the most misleading true statement available.
 *
 * MATCHING IS BY ITEM AND TIME. An attribution event names an item; a write names a row. An option
 * write is resolved to its item, and a write is attributed if a ruling touched that item within the
 * window. Deliberately generous: this is looking for writes with NOTHING behind them, not auditing
 * whether each ruling covers each column.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/** How close in time a ruling must be to account for a write. */
const WINDOW_MINUTES = 15;
/** When the triggers went in. Everything before this is outside what the boundary can see. */
const BOUNDARY_INSTALLED = new Date('2026-08-16T11:30:00Z');

const RECORD_TYPE: Record<string, string> = {
  Item: 'item', ItemOption: 'item', Misconception: 'misconception', Word: 'word',
};

async function main(): Promise<void> {
  const writes = await prisma.contentWriteLog.findMany({ orderBy: { id: 'asc' } });

  // Not a population that may legitimately be empty: the triggers fire on every content write, so
  // an empty log after any content work means they are not installed on this database.
  requirePopulation('check:outside-writes', { 'logged content writes': writes.length });

  // An option write is a write to its item. A deleted option cannot be resolved after the fact —
  // reported as its own class rather than counted either way.
  const optionIds = [...new Set(writes.filter((w) => w.tableName === 'ItemOption').map((w) => w.recordId))];
  const options = await prisma.itemOption.findMany({
    where: { id: { in: optionIds } }, select: { id: true, itemId: true },
  });
  const optionToItem = new Map(options.map((o) => [o.id, o.itemId]));

  const events = await prisma.attributionEvent.findMany({
    where: { at: { gte: new Date(BOUNDARY_INSTALLED.getTime() - WINDOW_MINUTES * 60_000) } },
    select: { recordType: true, recordId: true, at: true, action: true, reviewerId: true },
  });

  const attributed: typeof writes = [];
  const unattributed: Array<{ w: (typeof writes)[number]; target: string }> = [];
  const unresolvable: Array<{ w: (typeof writes)[number]; why: string }> = [];

  for (const w of writes) {
    const type = RECORD_TYPE[w.tableName];
    if (!type) { unresolvable.push({ w, why: `no record type mapped for table ${w.tableName}` }); continue; }
    let target = w.recordId;
    if (w.tableName === 'ItemOption') {
      const item = optionToItem.get(w.recordId);
      if (!item) {
        // A PERMANENT limitation, not a transient one: the log names the option, and once the
        // option is gone there is nothing left to resolve it to an item. Naming it as its own
        // class beats counting it as either attributed or not.
        unresolvable.push({ w, why: 'the option no longer exists, so its item cannot be looked up' });
        continue;
      }
      target = item;
    }
    const covered = events.some((e) =>
      e.recordType === type && e.recordId === target
      && Math.abs(e.at.getTime() - w.at.getTime()) <= WINDOW_MINUTES * 60_000);
    if (covered) attributed.push(w);
    else unattributed.push({ w, target });
  }

  console.log(`check:outside-writes: ${writes.length} logged write(s) since the boundary was installed.`);
  console.log(`  THE BOUNDARY WAS INSTALLED ${BOUNDARY_INSTALLED.toISOString()}. Every write before that is`);
  console.log('  invisible here and always will be — including the two unlabelled options that prompted it.');
  console.log(`  attributed to a ruling within ${WINDOW_MINUTES} min: ${attributed.length}`);
  console.log(`  unattributed: ${unattributed.length} · unresolvable: ${unresolvable.length}`);

  if (unresolvable.length > 0) {
    console.log(`\n${unresolvable.length} write(s) could not be resolved to a content record:`);
    for (const { w, why } of unresolvable.slice(0, 10)) {
      console.log(`  ? ${w.op} ${w.tableName} ${w.recordId} at ${w.at.toISOString()} — ${why}`);
    }
  }

  if (unattributed.length === 0) {
    // NEVER a bare clean line while some writes were not screened at all. "Every write is
    // accounted for" and "every write I could resolve is accounted for" are different claims.
    console.log(
      unresolvable.length === 0
        ? '\nEvery logged write has a ruling behind it.'
        : `\nEvery RESOLVABLE write has a ruling behind it. ${unresolvable.length} were not screened —`
          + ' see above. This is not a clean pass over the whole log.',
    );
    await prisma.$disconnect();
    return;
  }

  // WHICH ROWS ARE REVIEWED decides whether this fails or reports. An unattributed write to a
  // DRAFT row is authoring noise; to a reviewed one it is a change to something somebody signed.
  const items = await prisma.item.findMany({
    where: { id: { in: unattributed.map((u) => u.target) } },
    select: { id: true, status: true },
  });
  const reviewedIds = new Set(items.filter((i) => i.status === 'LIVE' || i.status === 'RETIRED').map((i) => i.id));
  const serious = unattributed.filter((u) => reviewedIds.has(u.target));

  console.log(`\n${unattributed.length} unattributed write(s):`);
  for (const { w, target } of unattributed.slice(0, 25)) {
    const cols = w.changedColumns.length ? w.changedColumns.join(', ') : '(no column changed)';
    console.log(`  · ${w.at.toISOString()} ${w.op} ${w.tableName} ${w.recordId}`
      + (target !== w.recordId ? ` (item ${target})` : '') + ` [${cols}] user=${w.dbUser} app="${w.applicationName || '(unset)'}"`);
  }
  if (unattributed.length > 25) console.log(`  … and ${unattributed.length - 25} more`);

  if (serious.length > 0) {
    console.error(`\n${serious.length} of them touched REVIEWED content:`);
    for (const { w, target } of serious) console.error(`  x ${w.op} ${w.tableName} ${w.recordId} on ${target}`);
    console.error('\nSomething changed content a reviewer signed, and no ruling accounts for it.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log('\nNone touched reviewed content, so this is reported rather than blocking. It is still');
  console.log('a change nobody decided: every one should resolve to a door that records what it did.');
  await prisma.$disconnect();
}

void main();
