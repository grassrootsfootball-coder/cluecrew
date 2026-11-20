/**
 * MATHS KEY RANK — the shortcut a child learns from where the right answer sits among the values
 * (2026-11-20, R1025). On maths-01 the key was the SECOND-SMALLEST of four on 69 of 161 comparable rows
 * and the largest on 13: "never the biggest, usually second-smallest" beats chance comfortably.
 * Option ORDER is shuffled per child, so position is no tell; VALUE rank is.
 *
 * Parses each option to a magnitude in one unit kind (money in pence, lengths in mm, mass in g, volume in
 * ml, angles, areas, durations and clock times in minutes, plain numbers and fractions). A row is RANKABLE
 * only if every option parses to the same kind; the rest are counted and named, never silently dropped.
 *
 *   tsx scripts/agent-review/measure-maths-key-rank.ts                       (the door as it stands)
 *   tsx scripts/agent-review/measure-maths-key-rank.ts --after=<proposals>   (as it will stand)
 *   --out=<file>  writes per-row rank, each distractor's side of the key, and per-tag counts
 *
 * WITHIN-TEMPLATE PATTERNS (R1025). A door-level spread can hide a shortcut inside one question shape:
 * the round-1 repair left the key the SMALLEST on 12 of 13 "how much change" rows while the door total
 * looked fair. So rank is also reported per TEMPLATE (the same slot across the five papers, MCnn-<slot>)
 * and per SHAPE (the stem's opening words with numbers and names masked), and any group of 3+ rows where
 * one rank holds at least three quarters of it is FLAGGED. The exit code is non-zero when any group is
 * flagged, so a repair cannot be signed against the door total alone.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

type Mag = { kind: string; v: number };
export function parseMag(raw: string): Mag | null {
  const s = raw.trim().replace(/,/g, '');
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^£(-?\d+(?:\.\d+)?)$/))) return { kind: 'money', v: Number(m[1]) * 100 };
  if ((m = s.match(/^(-?\d+)p$/))) return { kind: 'money', v: Number(m[1]) };
  if ((m = s.match(/^(\d+) h (\d+) min$/))) return { kind: 'dur', v: Number(m[1]) * 60 + Number(m[2]) };
  if ((m = s.match(/^(\d+):(\d+) ?(am|pm)$/))) return { kind: 'clock', v: ((Number(m[1]) % 12) + (m[3] === 'pm' ? 12 : 0)) * 60 + Number(m[2]) };
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) return { kind: 'num', v: Number(m[1]) / Number(m[2]) };
  const units: Record<string, [string, number]> = { 'cm²': ['area', 1], cm: ['len', 10], mm: ['len', 1], m: ['len', 1000], g: ['mass', 1], kg: ['mass', 1000], litres: ['vol', 1000], ml: ['vol', 1], '°': ['ang', 1], degrees: ['ang', 1] };
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)\s*(cm²|cm|mm|m|kg|g|litres|ml|°|degrees)?$/))) {
    if (!m[2]) return { kind: 'num', v: Number(m[1]) };
    const [kind, f] = units[m[2]]!;
    return { kind, v: Number(m[1]) * f };
  }
  return null;
}

type Opt = { optionId: string; value: string; isKey: boolean; tag: string | null };
export function keyRank(opts: Opt[]): { rank: number; sides: Record<string, 'below' | 'above' | 'equal'> } | null {
  const p = opts.map((o) => ({ o, m: parseMag(o.value) }));
  if (p.some((x) => !x.m) || new Set(p.map((x) => x.m!.kind)).size !== 1) return null;
  const key = p.find((x) => x.o.isKey);
  if (!key) return null;
  const sorted = [...p].sort((a, b) => a.m!.v - b.m!.v);
  const sides: Record<string, 'below' | 'above' | 'equal'> = {};
  for (const x of p) if (!x.o.isKey) sides[x.o.optionId] = x.m!.v < key.m!.v ? 'below' : x.m!.v > key.m!.v ? 'above' : 'equal';
  return { rank: sorted.indexOf(key), sides };
}

async function main() {
  const afterPath = process.argv.find((a) => a.startsWith('--after='))?.slice(8);
  const outPath = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
  const c = await prisma.case.findUniqueOrThrow({ where: { id: 'case-maths-01' }, select: { questionTypeId: true, mappedQuestionTypeIds: true } });
  const rows = await prisma.item.findMany({ where: { questionTypeId: { in: [c.questionTypeId, ...c.mappedQuestionTypeIds] }, status: 'LIVE', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('maths-key-rank', { 'LIVE maths-01 practice rows': rows.length });
  const val = (c: unknown) => String((c as { value?: unknown })?.value ?? '');
  const state = new Map(rows.map((r) => [r.id, { type: r.questionTypeId, opts: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId })) as Opt[] }]));
  if (afterPath) {
    const prop = JSON.parse(readFileSync(afterPath, 'utf8')) as { seats?: Array<{ optionId: string; itemId: string; newValue: string; tag: string }>; rebuilds?: Array<{ itemId: string; options: Opt[] }> };
    for (const s of prop.seats ?? []) { const o = state.get(s.itemId)?.opts.find((x) => x.optionId === s.optionId); if (!o) throw new Error(`seat ${s.optionId} not on ${s.itemId}`); o.value = s.newValue; o.tag = s.tag; }
    for (const b of prop.rebuilds ?? []) { const r = state.get(b.itemId); if (!r) throw new Error(`rebuild ${b.itemId} not LIVE on the door`); r.opts = b.options; }
  }
  const stems = new Map((await prisma.item.findMany({ where: { id: { in: [...state.keys()] } }, select: { id: true, stem: true } })).map((r) => [r.id, String((r.stem as { text?: unknown })?.text ?? '')]));
  const ranks: Record<number, number> = {}; const unrankable: string[] = []; const perRow: Array<Record<string, unknown>> = [];
  const tagCount: Record<string, number> = {};
  for (const [id, r] of state) {
    for (const o of r.opts) if (!o.isKey && o.tag) tagCount[o.tag] = (tagCount[o.tag] ?? 0) + 1;
    const k = keyRank(r.opts);
    if (!k) { unrankable.push(id); continue; }
    ranks[k.rank] = (ranks[k.rank] ?? 0) + 1;
    perRow.push({ itemId: id, type: r.type, rank: k.rank, options: r.opts.length, sides: k.sides });
  }
  const n = perRow.length;
  console.log(`maths-01 key rank (${afterPath ? 'AS IT WILL STAND' : 'as it stands'}): ${n} rankable of ${state.size}; ${unrankable.length} unrankable (${unrankable.join(', ')})`);
  for (const r of Object.keys(ranks).map(Number).sort()) console.log(`  rank ${r} (${r === 0 ? 'smallest' : r === 3 ? 'largest' : r === 1 ? 'second-smallest' : 'second-largest'}): ${ranks[r]} (${Math.round((100 * ranks[r]!) / n)}%)`);
  const shapeOf = (t: string) => t.replace(/£?\d[\d,.:]*\s?(p|cm²|cm|mm|m|kg|g|litres|ml|°)?/g, '#').replace(/\b[A-Z][a-z]+\b/g, (w, i) => (i === 0 ? w.toLowerCase() : 'X')).toLowerCase().split(/\s+/).slice(0, 5).join(' ');
  const groups = new Map<string, Array<{ id: string; rank: number }>>();
  for (const r of perRow) {
    const id = String(r.itemId); const rank = Number(r.rank);
    for (const g of [`template ${id.replace(/^MC\d+-/, '')}`, `shape "${shapeOf(stems.get(id) ?? '')}"`]) (groups.get(g) ?? groups.set(g, []).get(g)!).push({ id, rank });
  }
  const flagged: Array<Record<string, unknown>> = [];
  for (const [g, rs] of groups) {
    if (rs.length < 3) continue;
    const c: Record<number, number> = {}; for (const x of rs) c[x.rank] = (c[x.rank] ?? 0) + 1;
    const [top, cnt] = Object.entries(c).sort((a, b) => b[1] - a[1])[0]!;
    if (cnt >= Math.ceil(0.75 * rs.length)) flagged.push({ group: g, rows: rs.length, rank: Number(top), count: cnt, itemIds: rs.map((x) => x.id) });
  }
  console.log(`  within-template: ${groups.size} groups screened; ${flagged.length} FLAGGED (one rank on >= 3/4 of a group of 3+)`);
  for (const f of flagged) console.log(`    ✗ ${f.group}: rank ${f.rank} on ${f.count} of ${f.rows} — ${(f.itemIds as string[]).join(', ')}`);
  if (flagged.length) process.exitCode = 1;
  if (outPath) writeFileSync(outPath, JSON.stringify({ measuredAt: new Date().toISOString(), after: afterPath ?? null, rankable: n, unrankable, ranks, tagCount, flaggedGroups: flagged, rows: perRow }, null, 1));
}
if (process.argv[1]?.endsWith('measure-maths-key-rank.ts')) main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
