/**
 * WRITES UNGUARDED TO REVIEWED CONTENT — read this before re-running it.
 *
 * This script transcribes a written ruling into content a reviewer owns, and it does NOT classify
 * before writing (`packages/db/prisma/reviewed-guard.ts`). That is deliberate: the values here were
 * authored by a human, not computed, so the guard would refuse the very change the script exists to
 * apply. What it means for YOU is that re-running this on a database carrying rulings will overwrite
 * whatever is there now with what is written below — including anything a reviewer has changed since.
 *
 * It was written to run ONCE and has already run. Before running it again, check that what it
 * writes is still the current ruling; if it is not, this will quietly undo the newer one.
 */
/**
 * LIVE BREACH — `en-comma-not-a-comma-site` is ACTIVE, so its hint is serving content, and it
 * carried "wrong" (D1). Annie's wording (2026-08-08). She rejected "off": a nine-year-old reads it
 * as slang, and it means less to her than it does to us.
 */
import { prisma } from '../packages/db/src/index';

const HINT = 'Try reading it with a comma there. If it sounds odd, look again.';

async function main(): Promise<void> {
  const before = await prisma.misconception.findUnique({ where: { id: 'en-comma-not-a-comma-site' } });
  await prisma.misconception.update({ where: { id: 'en-comma-not-a-comma-site' }, data: { childHint: HINT } });
  console.log(`before: "${before?.childHint}"`);
  console.log(`after : "${HINT}"`);
  await prisma.$disconnect();
}

void main();
