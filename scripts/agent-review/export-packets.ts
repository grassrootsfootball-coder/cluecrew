/**
 * AGENT REVIEW — STEP 1: one packet per short door (David's ruling, 2026-11-18: an agent acts in
 * the reviewer role). Each packet is the whole truth an agent needs and nothing it should not use:
 * the row as a child meets it, the key, every option with its tag, the tag's library description
 * and child hint, any execution already written (the house form for that family), and whether the
 * row is signed. Agents read the packet; they never touch the database.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const OUT = pjoin(__dirname, '..', '..', 'content', 'agent-review');
/**
 * `--live` (2026-11-20): packet the door's LIVE rows instead of its drafts, into `patterns/<door>/`, for a
 * DOOR-LEVEL repair — a pattern no single row is at fault for (vr-08's key letter is word1's first letter on
 * 15 of 25 rows). The proposer picks which rows to rebuild; `land-proposals --from-live` takes only the rows
 * that land out of service, in the landing transaction.
 */
const LIVE = process.argv.includes('--live');
const DOORS = (process.argv.find((a) => a.startsWith('--doors='))?.slice(8) ?? 'vr-05,vr-08,vr-13,vr-16,vr-17,vr-18,vr-20,vr-21').split(',');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(',') : String(x); };

async function main() {
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, description: true, childHint: true } })).map((m) => [m.id, m]));
  for (const d of DOORS) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: `case-${d}` }, select: { id: true, title: true, questionTypeId: true } });
    const rows = await prisma.item.findMany({ where: { questionTypeId: c.questionTypeId, status: LIVE ? 'LIVE' : 'DRAFT', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
      select: { id: true, stem: true, solution: true, explanation: true,
        options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    requirePopulation(`packet:${d}`, { [LIVE ? 'live row(s)' : 'draft row(s)']: rows.length });
    const signed = new Set((await prisma.attributionEvent.findMany({ where: { recordId: { in: rows.map((r) => r.id) }, action: 'SIGNED', subjectHash: { not: null } }, select: { recordId: true } })).map((e) => e.recordId));
    const tags = [...new Set(rows.flatMap((r) => r.options.map((o) => o.misconceptionId).filter(Boolean)))] as string[];
    const exemplars: Record<string, Array<{ itemId: string; option: string; execution: string }>> = {};
    for (const r of rows) for (const o of r.options) {
      if (!o.misconceptionId || !(o.misconceptionExecution ?? '').trim()) continue;
      (exemplars[o.misconceptionId] ??= []).length < 3 && exemplars[o.misconceptionId]!.push({ itemId: r.id, option: val(o.content), execution: o.misconceptionExecution! });
    }
    const packet = {
      door: d, caseId: c.id, title: c.title, questionType: c.questionTypeId,
      entries: Object.fromEntries(tags.map((t) => [t, { description: lib.get(t)?.description ?? null, childHint: lib.get(t)?.childHint ?? null }])),
      houseFormExemplars: exemplars,
      rows: rows.map((r) => ({
        itemId: r.id, signed: signed.has(r.id), stem: r.stem, solution: r.solution ?? null,
        key: val(r.options.find((o) => o.isCorrect)?.content),
        options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId,
          execution: (o.misconceptionExecution ?? '').trim() || null })),
      })),
    };
    const dir = pjoin(OUT, LIVE ? pjoin('patterns', d) : d); mkdirSync(dir, { recursive: true });
    const body = JSON.stringify(packet, null, 1);
    writeFileSync(pjoin(dir, 'packet.json'), body);
    const gaps = packet.rows.flatMap((r) => r.options.filter((o) => o.tag && !o.execution)).length;
    console.log(`  ${d.padEnd(6)} rows ${rows.length}  unsigned ${rows.length - signed.size}  gaps ${String(gaps).padStart(3)}  sha ${createHash('sha256').update(body).digest('hex').slice(0, 12)}`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
