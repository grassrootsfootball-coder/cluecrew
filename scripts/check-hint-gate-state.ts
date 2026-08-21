/**
 * WHAT STATE IS THE HINT READ-GATE IN? (Annie, 2026-08-21 — R395.)
 *
 * **A gate that is correct and does nothing reads identically to a gate that is working.** R388's
 * wiring serves an item hint only where a named reviewer has read it. Today it serves none — not
 * because the rule refuses anything, but because **the read hints and the reachable items are
 * disjoint populations**: her seven sit on two spelling-spot and five cloze items, and neither type
 * has a door.
 *
 * So the gate is **ACTIVE-BUT-UNREACHED**, and that is a STATE with a reason, not a fact about
 * today. It changes to ACTIVE-AND-SERVING the moment a read hint lands on a reachable item — by
 * ruling one of the nine, or by opening a door for spelling-spot or cloze. **Reported either way, so
 * "no item hint served" can never be mistaken for "the gate declined to serve one".**
 */
import { chooseHint } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

async function main() {
  const items = await prisma.item.findMany({ select: { id: true, status: true, explanation: true } });
  const withHint = items.filter((i) => typeof (i.explanation as { hintCore?: unknown })?.hintCore === 'string');
  const read = withHint.filter((i) => chooseHint(i.explanation as never).serves === 'item');
  const readAndLive = read.filter((i) => i.status === 'LIVE');
  const liveWithHint = withHint.filter((i) => i.status === 'LIVE');

  requirePopulation('check:hint-gate-state', {
    'item(s) carrying a hintCore': withHint.length,
    'of those, read by a named reviewer': read.length,
  });

  const state = readAndLive.length > 0 ? 'ACTIVE-AND-SERVING' : 'ACTIVE-BUT-UNREACHED';
  console.log(`\nHINT READ-GATE: ${state}`);
  if (state === 'ACTIVE-AND-SERVING') {
    console.log(`  ${readAndLive.length} LIVE item(s) serve their own hint: ${readAndLive.map((i) => i.id).join(', ')}`);
    await prisma.$disconnect();
    return;
  }
  // The TYPE, not the id with a trailing number lopped off — `ENG-003-A-CZ-B3` has no trailing
  // number to strip, so the first version printed five ids as if they were five types.
  const familiesRead = [...new Set(read.map((i) => (i.id.match(/^(.*-[A-Z]{2})-?[A-Z]?\d*$/)?.[1] ?? i.id)))];
  console.log(
    `  ${read.length} hint(s) are read, and NONE is on a reachable item.\n` +
      `  ${liveWithHint.length} LIVE item(s) carry a hintCore and none of them is read.\n` +
      `  The read hints sit on: ${familiesRead.join(', ')} — types with no door.\n` +
      '\n  THE RULE REFUSES NOTHING HERE. The read set and the reachable set are disjoint, so the\n' +
      '  gate falls through to the library hint on every reachable item. It becomes ACTIVE-AND-SERVING\n' +
      '  when a read hint lands on a reachable item — by a ruling on a LIVE item, or by a door opening\n' +
      '  for the types the read hints are on. **Neither has happened; both are outstanding work.**',
  );
  await prisma.$disconnect();
}

void main();
