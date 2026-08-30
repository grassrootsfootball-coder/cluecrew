/**
 * IS ANY ROW SERVING ON BYTES FROM A SEND ITS AUTHOR WITHDREW? (R899.)
 *
 * Six rows were. Each carried, on its own row, an event reading *"The row is removed before
 * anything publishes"* — and nothing between that marker and publication ever read it. **A
 * withdrawal recorded as an event and never executed as a removal is indistinguishable, from every
 * downstream check, from no withdrawal at all.**
 *
 * The eight assertions the publication ran were all sound and not one asked which SEND a row came
 * from. This is the assertion that was missing, and it now runs on its own.
 *
 * A marked row may legitimately serve if a LATER AUTHORITY reaches it — a re-pin against the
 * replacement source, or a reviewer restoring it. Absence of that authority is the fault, so it is
 * what this looks for, per id, and it prints the authority for the rows that have one.
 */
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

async function main() {
  const marked = [...new Set((await prisma.attributionEvent.findMany({
    where: { method: { contains: 'send was WITHDRAWN' } }, select: { recordId: true },
  })).map((e) => e.recordId))];
  const later = await prisma.attributionEvent.findMany({
    where: { recordId: { in: marked }, OR: [{ method: { contains: 'RE-PINNED against the amended source' } }, { method: { contains: 'ABSENCE RECORDED EARLIER WAS FALSE' } }] },
    select: { recordId: true, method: true },
  });
  const authority = new Map(later.map((e) => [e.recordId, e.method ?? '']));
  const rows = await prisma.item.findMany({ where: { id: { in: marked } }, select: { id: true, status: true, pool: true } });

  requirePopulation('check:withdrawn-serving', {
    'id(s) marked by a withdrawal': marked.length,
    'still in the store': rows.length,
  });

  const serving = rows.filter((r) => r.status === 'LIVE' && r.pool === 'PRACTICE');
  const bad = serving.filter((r) => !authority.has(r.id));
  console.log(`\n  ${marked.length} id(s) marked by a withdrawal; ${rows.length} still in the store; ${serving.length} serving.`);
  for (const r of serving) {
    const a = authority.get(r.id);
    console.log(`   ${r.id.padEnd(15)} ${a ? 'OK — ' + a.slice(0, 80) : 'SERVING ON WITHDRAWN BYTES WITH NO LATER AUTHORITY'}`);
  }
  if (bad.length) {
    console.error(`\n  ${bad.length} row(s) are serving on bytes from a send their author withdrew: ${bad.map((r) => r.id).join(', ')}`);
    console.error('  A row published from a withdrawn send is the one class this district was built to make impossible.');
    process.exit(1);
  }
  console.log('\n  No row is serving on withdrawn bytes without a later authority reaching it.');
  await prisma.$disconnect();
}
main().catch(async (e) => { await prisma.$disconnect(); console.error(e); process.exit(1); });
