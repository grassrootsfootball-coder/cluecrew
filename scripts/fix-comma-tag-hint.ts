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
