/**
 * NORMALISE OPTION CONTENT TO {label, value} — `pnpm fix:option-content [--write]`
 *
 * 340 of 715 ENG-* options were stored as a BARE STRING because my cluster importer passed
 * Cowork's draft shape straight through. Every gate that reads `.value` got `undefined`, coerced
 * it to '', and found nothing to object to — check:db-content, check:option-positions and the
 * n-option precondition all reported clean over a field that was not there.
 *
 * THE INVARIANT IS THE OPTION TEXT, NOT THE LETTER (David, 2026-08-13). The label is derived from
 * stored position, so if stored order had ever diverged from draft order the letters would move
 * under the keys. So this proves, over ALL options in scope, that every key still selects the same
 * STRING it selected before. The letter is cosmetic; the text is the identity.
 */
import { prisma } from '../packages/db/src/index';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** The option's text under either shape, so before/after are read the same way. */
const textOf = (c: unknown): string =>
  typeof c === 'string'
    ? c
    : c && typeof c === 'object' && 'value' in c
      ? String((c as { value: unknown }).value)
      : '';

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  // BEFORE: the text each key selects, recorded per item.
  const before = new Map<string, string>();
  let optionCount = 0;
  for (const it of items) {
    optionCount += it.options.length;
    const key = it.options.find((o) => o.isCorrect);
    before.set(it.id, key ? textOf(key.content) : '(no key)');
  }

  let bare = 0;
  let already = 0;
  const updates: Array<{ id: string; content: { label: string; value: string } }> = [];
  for (const it of items) {
    it.options.forEach((o, i) => {
      if (typeof o.content === 'string') {
        bare += 1;
        updates.push({ id: o.id, content: { label: LETTERS[i] ?? String(i), value: textOf(o.content) } });
      } else {
        already += 1;
      }
    });
  }

  console.log(
    `${items.length} items - ${optionCount} options - ${bare} bare string - ${already} already {label,value}`,
  );
  if (!write) {
    console.log('Dry run. Re-run with --write to apply.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    updates.map((u) => prisma.itemOption.update({ where: { id: u.id }, data: { content: u.content } })),
  );

  // AFTER: re-read from the database and prove the key text is unchanged for every item.
  const after = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { id: 'asc' },
  });
  let same = 0;
  const moved: string[] = [];
  let afterOptions = 0;
  let stillBare = 0;
  for (const it of after) {
    afterOptions += it.options.length;
    stillBare += it.options.filter((o) => typeof o.content === 'string').length;
    const key = it.options.find((o) => o.isCorrect);
    const now = key ? textOf(key.content) : '(no key)';
    if (now === before.get(it.id)) same += 1;
    else moved.push(`${it.id}: "${before.get(it.id)}" -> "${now}"`);
  }

  console.log(`\nPROOF over ${afterOptions} options in ${after.length} items:`);
  console.log(`  keys selecting the SAME string as before: ${same} of ${after.length}`);
  console.log(`  keys whose selected string MOVED: ${moved.length}`);
  for (const m of moved) console.log(`    x ${m}`);
  console.log(`  options still stored as a bare string: ${stillBare}`);
  await prisma.$disconnect();
}

void main();
