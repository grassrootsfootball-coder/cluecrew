/**
 * THE SECOND-READER SWEEP (David, 2026-11-22 — R1037).
 *
 * R1031's blind sample found a second machine reviewer would not sign 9 of 32 rows the first had signed,
 * and every objective claim it made was true. With Cowork and Annie gone (R1034), a second independent
 * reader is the only check left, so every LIVE row whose latest item signature is `rev-agent-01` and
 * that has NOT already had an independent second reading is put in front of a fresh reviewer.
 *
 * EXCLUDED, BY STATED RULE (R60: the denominator is what was actually read):
 *   - rows re-signed on or after SINCE (default 2026-11-22): they landed today through a fresh,
 *     independent review (calibration fixes, vr-06 GL rebuild, vr-05 joins);
 *   - rows in calibration sample 01: a second machine reviewer already read them blind.
 *
 * BATCHES: English by passage (a reviewer reads each passage once), VR by question type, maths by type,
 * packed to at most MAX rows. Each batch is `content/agent-review/sweep/<id>/batch.json` with full
 * cards: passage lines, stem as the child reads it, every option with its tag, the tag's child hint and
 * the staff execution, and the hint and walk script on EVERY district (not only English, as R1031's
 * blind design needed).
 *
 *   tsx scripts/agent-review/export-sweep-batches.ts [--since=2026-11-22] [--max=40]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const OUT = pjoin(REPO, 'content', 'agent-review', 'sweep');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const SINCE = new Date(`${arg('since') ?? '2026-11-22'}T00:00:00Z`);
const MAX = Number(arg('max') ?? 40);

const valOf = (c: unknown): string => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : typeof x === 'string' ? x : JSON.stringify(x ?? null); };
// Same rendering order as the child-facing PlainItem engine (and R1031's cards), plus `text`.
const META = new Set(['passageRef', 'orderAnchor', 'operands', 'quotes', 'lineRefs']);
const RENDERED = new Set(['text', 'prompt', 'word1', 'word2', 'sentence', 'wordWithGap', 'sum', 'words', 'pairA', 'stemWord', 'clues', 'question', 'code', 'series']);
function renderStem(s: Record<string, unknown>): { lines: string[]; other: Record<string, unknown> } {
  const lines: string[] = [];
  if (typeof s.text === 'string') lines.push(s.text);
  if (typeof s.prompt === 'string') lines.push(s.prompt);
  if (typeof s.word1 === 'string' && typeof s.word2 === 'string') lines.push(`${s.word1}   (${s.word2})`);
  if (typeof s.sentence === 'string') lines.push(s.sentence);
  if (typeof s.wordWithGap === 'string') lines.push(s.wordWithGap);
  if (typeof s.sum === 'string') lines.push(s.sum);
  if (Array.isArray(s.words)) lines.push((s.words as string[]).join(',  '));
  if (Array.isArray(s.pairA) && typeof s.stemWord === 'string') lines.push(`${(s.pairA as string[]).join(' is to ')} as ${s.stemWord} is to …`);
  if (Array.isArray(s.clues)) lines.push(...(s.clues as string[]));
  if (typeof s.question === 'string') lines.push(s.question);
  if (s.code && typeof s.code === 'object') lines.push(Object.entries(s.code as Record<string, string>).map(([a, b]) => `${a} = ${b}`).join(',  '));
  if (Array.isArray(s.series)) lines.push(`${(s.series as Array<string | number>).join(',  ')}, …`);
  const other: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) if (!RENDERED.has(k) && !META.has(k) && !k.startsWith('_')) other[k] = v;
  return { lines, other };
}
function passageLines(ref: string): Array<{ n: number | null; text: string }> {
  const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
  if (!existsSync(f)) throw new Error(`passage ${ref}: file missing`);
  const p = JSON.parse(readFileSync(f, 'utf8')) as { numberedLines?: Array<{ n: number | null; text: string }> };
  if (!Array.isArray(p.numberedLines) || !p.numberedLines.length) throw new Error(`passage ${ref}: no numberedLines (R173)`);
  return p.numberedLines.map((l) => ({ n: l.n, text: l.text }));
}

async function main() {
  const latest = await prisma.$queryRaw<Array<{ recordId: string; reviewerId: string | null; at: Date }>>`
    select distinct on ("recordId") "recordId", "reviewerId", at from "AttributionEvent"
    where "recordType" = 'item' and action = 'SIGNED' order by "recordId", at desc`;
  const machine = latest.filter((e) => e.reviewerId === 'rev-agent-01');
  const reSignedToday = new Set(machine.filter((e) => e.at >= SINCE).map((e) => e.recordId));
  const calKey = pjoin(REPO, 'content', 'agent-review', 'calibration', '01', 'key.json');
  const calibrated = new Set(existsSync(calKey) ? (JSON.parse(readFileSync(calKey, 'utf8')) as { key: Array<{ itemId: string }> }).key.map((k) => k.itemId) : []);
  const ids = machine.map((e) => e.recordId).filter((id) => !reSignedToday.has(id) && !calibrated.has(id));
  const rows = await prisma.item.findMany({ where: { id: { in: ids }, status: 'LIVE' }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, explanation: true, lineRefs: true, questionType: { select: { district: true } },
      options: { orderBy: { id: 'asc' }, select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true } } } });
  const liveMachine = machine.filter((_e) => true).length;
  requirePopulation('sweep', { 'LIVE rows latest-signed by rev-agent-01 and not yet second-read': rows.length });
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true, description: true } })).map((m) => [m.id, m]));

  // group: English by passage, else by question type
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const d = String(r.questionType.district);
    const ref = (r.stem as { passageRef?: string }).passageRef;
    const g = d === 'ENGLISH' && ref ? `en:${ref}` : `${d.toLowerCase()}:${r.questionTypeId}`;
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(r);
  }
  // pack groups into batches of at most MAX rows, keeping a group whole where it fits
  const batches: Array<{ id: string; district: string; groups: string[]; rows: typeof rows }> = [];
  for (const district of ['ENGLISH', 'MATHS', 'VR']) {
    const gs = [...groups].filter(([, rs]) => String(rs[0]!.questionType.district) === district).sort(([a], [b]) => a.localeCompare(b));
    let cur: (typeof batches)[number] | null = null;
    for (const [g, rs] of gs) {
      for (let i = 0; i < rs.length; i += MAX) {
        const chunk = rs.slice(i, i + MAX);
        if (!cur || cur.rows.length + chunk.length > MAX) { cur = { id: `${district.toLowerCase()}-${String(batches.filter((b) => b.district === district).length + 1).padStart(2, '0')}`, district, groups: [], rows: [] }; batches.push(cur); }
        cur.groups.push(g); cur.rows.push(...chunk);
      }
    }
  }
  mkdirSync(OUT, { recursive: true });
  for (const b of batches) {
    const passages: Record<string, unknown> = {};
    const cards = b.rows.map((r) => {
      const stem = r.stem as Record<string, unknown>; const ex = (r.explanation ?? {}) as Record<string, unknown>;
      const ref = stem.passageRef as string | undefined;
      if (ref && !passages[ref]) passages[ref] = passageLines(ref);
      const { lines, other } = renderStem(stem);
      if (!lines.length) throw new Error(`${r.id}: stem renders no line (keys: ${Object.keys(stem).join(', ')})`);
      const keys = r.options.filter((o) => o.isCorrect).length;
      if (keys !== 1) throw new Error(`${r.id}: ${keys} keys`);
      return { itemId: r.id, questionType: r.questionTypeId, passageRef: ref ?? null, lineRefs: Array.isArray(r.lineRefs) ? r.lineRefs : null,
        questionLines: lines, otherStemFields: other,
        options: r.options.map((o) => ({ optionId: o.id, value: valOf(o.content), isKey: o.isCorrect, tag: o.misconceptionId,
          tagDescription: o.misconceptionId ? lib.get(o.misconceptionId)?.description ?? null : null,
          tagChildHint: o.misconceptionId ? lib.get(o.misconceptionId)?.childHint ?? null : null, execution: o.isCorrect ? null : o.misconceptionExecution })),
        hint: typeof ex.hintCore === 'string' ? ex.hintCore : null, walkScript: typeof ex.walkScript === 'string' ? ex.walkScript : null };
    });
    const dir = pjoin(OUT, b.id); mkdirSync(dir, { recursive: true });
    writeFileSync(pjoin(dir, 'batch.json'), `${JSON.stringify({ batch: b.id, district: b.district, groups: b.groups, rowCount: cards.length, passages, cards }, null, 1)}\n`);
  }
  const index = { ruling: 'R1037', since: SINCE.toISOString(), max: MAX,
    population: { machineLatestSigned: liveMachine, excludedReSignedSince: reSignedToday.size, excludedCalibrationSample: [...calibrated].filter((id) => machine.some((m) => m.recordId === id)).length, swept: rows.length },
    batches: batches.map((b) => ({ id: b.id, district: b.district, rows: b.rows.length, groups: b.groups })) };
  writeFileSync(pjoin(OUT, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
  console.log(`sweep: ${rows.length} rows to read (machine-latest ${liveMachine}; excluded ${reSignedToday.size} re-signed since ${SINCE.toISOString().slice(0, 10)}, ${index.population.excludedCalibrationSample} in calibration 01)`);
  for (const b of batches) console.log(`  ${b.id}: ${b.rows.length} rows — ${b.groups.join(', ')}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
