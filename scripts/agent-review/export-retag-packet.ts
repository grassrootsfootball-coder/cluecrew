/** RETAG packet: every carrier the library review listed as misfiled, with its row, its options and the whole ACTIVE English+VR library to choose from. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';
const DIR = pjoin(__dirname, '..', '..', 'content', 'agent-review');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
async function main() {
  const mis = JSON.parse(readFileSync(pjoin(DIR, 'library', 'misfiled-carriers.json'), 'utf8')) as Record<string, string[]>;
  const notes = new Map<string, unknown[]>();
  for (const f of ['A', 'B', 'C', 'D', 'E']) { try { for (const e of (JSON.parse(readFileSync(pjoin(DIR, 'library', `verdicts-${f}.json`), 'utf8')) as { entries: Array<{ id: string; misfiledCarriers?: Array<Record<string, unknown>> }> }).entries) for (const m of e.misfiledCarriers ?? []) (notes.get(String(m.itemId)) ?? notes.set(String(m.itemId), []).get(String(m.itemId))!).push({ entry: e.id, ...m }); } catch { /* group absent */ } }
  const ids = Object.keys(mis);
  requirePopulation('retag-packet', { 'misfiled carriers': ids.length });
  const rows = await prisma.item.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' }, select: { id: true, status: true, questionTypeId: true, stem: true,
    options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const lib = await prisma.misconception.findMany({ where: { status: 'ACTIVE', district: { in: ['ENGLISH', 'VR'] } }, orderBy: { id: 'asc' }, select: { id: true, description: true, childHint: true, approvedBy: true } });
  const packet = { door: 'retag', questionType: 'mixed', entries: Object.fromEntries(lib.map((m) => [m.id, { description: m.description, childHint: m.childHint, approvedBy: m.approvedBy }])),
    rows: rows.map((r) => ({ itemId: r.id, status: r.status, questionType: r.questionTypeId, passageRef: (r.stem as { passageRef?: string }).passageRef ?? null, stem: r.stem,
      key: val(r.options.find((o) => o.isCorrect)?.content), misfiledUnder: mis[r.id], reviewerNotes: notes.get(r.id) ?? [],
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null })) })) };
  writeFileSync(pjoin(DIR, 'retag', 'packet.json'), JSON.stringify(packet, null, 1));
  console.log(`retag packet: ${rows.length} rows (${rows.filter((r) => r.status === 'LIVE').length} LIVE), ${lib.length} active entries`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
