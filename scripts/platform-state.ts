/**
 * PLATFORM STATE — `pnpm state`
 *
 * Every figure measured, none recalled (R25, R36). What is built, what is signed, what is
 * outstanding, per district.
 */
import { prisma } from '../packages/db/src/index';

async function main(): Promise<void> {
  const qts = await prisma.questionType.findMany({ select: { id: true, district: true } });
  const districtOf = new Map(qts.map((q) => [q.id, q.district]));

  const items = await prisma.item.findMany({ select: { questionTypeId: true, status: true, pool: true } });
  const byDistrict = new Map<string, Record<string, number>>();
  for (const i of items) {
    const d = districtOf.get(i.questionTypeId) ?? 'UNKNOWN';
    const row = byDistrict.get(d) ?? {};
    row[i.status] = (row[i.status] ?? 0) + 1;
    byDistrict.set(d, row);
  }
  console.log('=== ITEMS by district and status ===');
  for (const [d, row] of [...byDistrict].sort()) {
    const total = Object.values(row).reduce((a, b) => a + b, 0);
    console.log(`  ${d.padEnd(9)} ${String(total).padStart(4)}  ${JSON.stringify(row)}`);
  }

  const mis = await prisma.misconception.groupBy({ by: ['district', 'status'], _count: true });
  console.log('\n=== MISCONCEPTIONS by district and status ===');
  const m = new Map<string, Record<string, number>>();
  for (const r of mis) { const row = m.get(r.district) ?? {}; row[r.status] = r._count; m.set(r.district, row); }
  for (const [d, row] of [...m].sort()) {
    const total = Object.values(row).reduce((a, b) => a + b, 0);
    console.log(`  ${d.padEnd(9)} ${String(total).padStart(4)}  ${JSON.stringify(row)}`);
  }

  const sigs = await prisma.attributionEvent.findMany({ where: { action: 'SIGNED' }, select: { recordType: true, recordId: true, subjectHash: true } });
  const byType = new Map<string, { n: number; pinned: number }>();
  for (const s of sigs) {
    const e = byType.get(s.recordType) ?? { n: 0, pinned: 0 };
    e.n += 1; if (s.subjectHash) e.pinned += 1;
    byType.set(s.recordType, e);
  }
  console.log('\n=== SIGNATURES ===');
  for (const [t, e] of [...byType].sort()) console.log(`  ${t.padEnd(26)} ${String(e.n).padStart(3)} signed · ${e.pinned} fingerprint-pinned`);

  const words = await prisma.word.groupBy({ by: ['status'], _count: true });
  console.log('\n=== WORD VAULT ===');
  console.log('  ' + words.map((w) => `${w.status} ${w._count}`).join(' · '));

  const att = await prisma.attempt.count();
  const live = items.filter((i) => i.status === 'LIVE').length;
  console.log(`\n=== SERVING ===\n  LIVE items ${live} · attempts recorded ${att}`);
  await prisma.$disconnect();
}
void main();
