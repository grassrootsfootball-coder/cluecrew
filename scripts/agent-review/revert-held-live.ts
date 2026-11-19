/**
 * REVERT: rows a reviewer HELD that a later, narrower signature carried to LIVE (2026-11-19). The retag
 * reviewer signed rows for a TAG change; the publisher read that signature as clearing a HOLD the
 * English reviewer had placed on other fields. A HOLD stands until its own field is changed and re-read.
 * LIVE → DRAFT, one transaction, an attribution event each, under the machine reviewer (R94).
 */
import { readFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
const held = (JSON.parse(readFileSync(pjoin(__dirname, '..', '..', 'content', 'agent-review', 'english', 'held-for-authoring-store.json'), 'utf8')) as { held: Array<{ itemId: string; faultField: string; reason: string }> }).held;
async function main() {
  const live = await prisma.item.findMany({ where: { id: { in: held.map((h) => h.itemId) }, status: 'LIVE' }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    const n = await tx.item.updateMany({ where: { id: { in: live.map((l) => l.id) }, status: 'LIVE' }, data: { status: 'DRAFT' } });
    if (n.count !== live.length) throw new Error(`moved ${n.count}, expected ${live.length}`);
    await tx.attributionEvent.createMany({ data: live.map((l) => { const h = held.find((x) => x.itemId === l.id)!; return { recordType: 'item', recordId: l.id, action: 'AMENDED' as const,
      reviewerId: 'rev-agent-01', actor: 'agent-reviewer', recordedBy: 'human:dbamgbade@gmail.com', field: 'status',
      method: 'REVERTED LIVE to DRAFT: published in error on a retag signature while an English-review HOLD on another field stood.', note: `hold (${h.faultField}): ${h.reason}`.slice(0, 900) }; }) });
  });
  console.log(`reverted ${live.length} row(s) LIVE -> DRAFT`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
