/**
 * ITEMS A GATE REFUSED AT IMPORT AND NOBODY EVER RETURNED — the reader the receipts never had.
 *
 * **NOTHING SKIPPED THEM SILENTLY, AND THAT IS THE POINT.** Six English items sat in Cowork's store
 * and not in this one for weeks, and the divergence read as a mystery for a whole exchange. The
 * cause was not a lost file or a silent drop: **`checkItemChildFacing` REFUSED all six at import**
 * — four US spellings (`favoring`, `traveling`, `fibers`, `realized`) and two banned words — and
 * `import-english-clusters` reported each one and wrote it into a receipt.
 *
 * **THE GATE WORKED. THE RECEIPT WORKED. NOBODY READ IT.** A refusal recorded in a file that no
 * check opens is the retirement-with-no-reader fault (R269) in its original form: **the record
 * exists, the decision was right, and the state it describes is invisible from that moment on.**
 *
 * So this reads the receipts back and asks the only question that matters afterwards: **is the item
 * still absent?** A refusal that has since been fixed and re-imported is closed; one still missing
 * is an outstanding return, and it names the door and the reason so the return can be made rather
 * than rediscovered.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const EXPORTS = resolve(import.meta.dirname, '../content/exports');

interface Refusal { itemId: string; door: string; reason: string }

async function main() {
  const files = readdirSync(EXPORTS).filter((n) => /^import-receipt-.*\.json$/.test(n));
  const byItem = new Map<string, Refusal & { receipt: string }>();
  for (const name of files) {
    const parsed = JSON.parse(readFileSync(join(EXPORTS, name), 'utf8')) as { refusals?: Refusal[] };
    for (const r of parsed.refusals ?? []) {
      // Last receipt wins: a later run's verdict supersedes an earlier one for the same item.
      if (r.itemId) byItem.set(r.itemId, { ...r, receipt: name });
    }
  }
  requirePopulation('outstanding import refusals', {
    'import receipts read': files.length,
    'distinct items ever refused': byItem.size,
  });

  const ids = [...byItem.keys()];
  const present = new Set((await prisma.item.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((i) => i.id));
  const outstanding = ids.filter((id) => !present.has(id)).sort();
  const closed = ids.length - outstanding.length;

  console.log('outstanding import refusals — refused at the door, never returned');
  console.log(`  receipts read              : ${files.length}`);
  console.log(`  items ever refused         : ${ids.length}`);
  console.log(`  since fixed and imported   : ${closed}`);
  console.log(`  STILL ABSENT               : ${outstanding.length}`);
  const byDoor = new Map<string, number>();
  for (const id of outstanding) {
    const r = byItem.get(id)!;
    byDoor.set(r.door, (byDoor.get(r.door) ?? 0) + 1);
  }
  for (const [door, n] of [...byDoor].sort((a, b) => b[1] - a[1])) console.log(`      ${door}: ${n}`);
  console.log('');
  for (const id of outstanding) {
    const r = byItem.get(id)!;
    console.log(`    ${id}`);
    console.log(`        ${r.reason.slice(0, 120)}`);
  }
  console.log('\n  Each is a RETURN owed to the authoring store, not a fault here: the gate refused');
  console.log('  correctly and the item has never come back reworded. Reporting, never failing —');
  console.log('  a red build over another store\'s backlog would be switched off within a week.');
  await prisma.$disconnect();
}

main();
