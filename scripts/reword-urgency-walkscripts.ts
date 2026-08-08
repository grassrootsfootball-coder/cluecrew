/**
 * R22 follow-through — reword the three walk scripts the role-scoped urgency rule catches.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/reword-urgency-walkscripts.ts`
 *
 * All three were FALSE POSITIVES by annie's own `mistake` test — each describes the TEXT, not the
 * child's pace. Rewording rather than exempting leaves the rule firing ZERO, so it guards against
 * real stance drift without carrying permanent exceptions (David's ruling, 2026-08-08).
 */
import { prisma } from '../packages/db/src/index';

const REWORDS: Array<[string, string, string]> = [
  ['ENG-001-WIW-10', 'in far too much of a hurry to be polite', 'in far too much of a rush to be polite'],
  ['ENG-001-WIW-19', "'Smartly' tells you he went quickly.", "'Smartly' tells you he went at speed."],
  ['ENG-002-pp-13', "the room's quick view sounds like a fact", "the room's hasty view sounds like a fact"],
];

async function main(): Promise<void> {
  for (const [id, from, to] of REWORDS) {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) { console.log(`MISSING ${id}`); continue; }
    const ex = (item.explanation ?? {}) as Record<string, unknown>;
    const script = String(ex.walkScript ?? '');
    if (!script.includes(from)) { console.log(`NO MATCH ${id} — "${from}"`); continue; }
    ex.walkScript = script.replace(from, to);
    await prisma.item.update({ where: { id }, data: { explanation: ex as never } });
    console.log(`${id}: "${from}" → "${to}"`);
  }
  await prisma.$disconnect();
}

void main();
