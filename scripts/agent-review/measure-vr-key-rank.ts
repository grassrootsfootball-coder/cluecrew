/**
 * VR KEY RANK — the maths-01 shortcut (R1025) asked of the VR doors whose options can be ordered
 * (2026-11-20, R1030). Numbers order by value; single letters by alphabet position, which is the order
 * a child counting along the alphabet uses. Option ORDER is shuffled per child, so only VALUE rank can
 * teach anything.
 *
 * For each door: the key's rank among its options (0 = smallest), against a uniform spread. A rank on
 * more than 1.5x its uniform share, or below 0.5x, on a door of 20+ rankable rows is FLAGGED.
 *
 *   tsx scripts/agent-review/measure-vr-key-rank.ts [--doors=vr-07,vr-09,...] [--out=<file>]
 */
import { writeFileSync } from 'node:fs';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const DOORS = (process.argv.find((a) => a.startsWith('--doors='))?.slice(8) ?? 'vr-07,vr-09,vr-11,vr-14,vr-17,vr-18,vr-19').split(',');
const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(',') : String(x); };
/** A number, or a single letter as its alphabet position. Anything else is unrankable. */
const mag = (s: string): number | null => { const t = s.trim(); if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t); if (/^[A-Za-z]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 64; return null; };

async function main() {
  const report: Record<string, unknown> = {};
  let flaggedAny = false;
  for (const door of DOORS) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: `case-${door}` }, select: { questionTypeId: true } });
    const rows = await prisma.item.findMany({ where: { questionTypeId: c.questionTypeId, status: 'LIVE', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
      select: { id: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
    requirePopulation(`vr-key-rank:${door}`, { 'LIVE practice rows': rows.length });
    let middleOfRun = 0; let inAdjacentPair = 0;
    const byK: Record<number, Record<number, number>> = {}; const perRow: Array<{ itemId: string; k: number; rank: number }> = []; const unrankable: string[] = [];
    for (const r of rows) {
      const m = r.options.map((o) => ({ v: mag(val(o.content)), key: o.isCorrect }));
      if (m.some((x) => x.v === null) || new Set(m.map((x) => x.v)).size !== m.length) { unrankable.push(r.id); continue; }
      const sorted = [...m].sort((a, b) => a.v! - b.v!); const rank = sorted.findIndex((x) => x.key);
      // R1030: rank alone missed the real vr-14 shortcut. When key - 1 and key + 1 are both offered, the key is
      // the MIDDLE of a run of three; when exactly one adjacent pair exists and holds the key, it narrows to two.
      const kv = m.find((x) => x.key)!.v!; const vs = new Set(m.map((x) => x.v!));
      if (vs.has(kv - 1) && vs.has(kv + 1)) middleOfRun++;
      const pairs = sorted.slice(1).map((x, i) => [sorted[i]!, x] as const).filter(([a, b]) => b.v! - a.v! === 1);
      if (pairs.length === 1 && (pairs[0]![0].key || pairs[0]![1].key)) inAdjacentPair++;
      ((byK[m.length] ??= {})[rank] = (byK[m.length]![rank] ?? 0) + 1); perRow.push({ itemId: r.id, k: m.length, rank });
    }
    const flags: string[] = [];
    for (const [k, ranks] of Object.entries(byK)) {
      const n = Object.values(ranks).reduce((a, b) => a + b, 0); const share = n / Number(k);
      for (let r = 0; r < Number(k); r++) { const c2 = ranks[r] ?? 0; if (n >= 20 && (c2 > 1.5 * share || c2 < 0.5 * share)) flags.push(`k=${k} rank ${r}: ${c2} of ${n} (uniform ${share.toFixed(1)})`); }
      console.log(`${door.padEnd(6)} k=${k}: ${n} rankable — ${Array.from({ length: Number(k) }, (_, r) => `${r}:${ranks[r] ?? 0}`).join('  ')}${unrankable.length ? `  (${unrankable.length} unrankable)` : ''}`);
    }
    console.log(`    key is the middle of a run of three: ${middleOfRun} of ${perRow.length}; key in the only adjacent pair: ${inAdjacentPair} of ${perRow.length}`);
    for (const f of flags) console.log(`    ✗ ${f}`);
    if (flags.length) flaggedAny = true;
    report[door] = { byK, unrankable, flags, perRow };
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(report, null, 1));
  if (flaggedAny) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
