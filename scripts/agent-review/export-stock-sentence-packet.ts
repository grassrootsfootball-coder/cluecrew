/**
 * THE STOCK EXECUTION SENTENCE on LIVE English rows (R1023 finding 5). "In the window, line N answers the
 * stem: '…'" was appended by machine across the English passages and was false wherever reviewers looked.
 * Executions are staff-facing and outside the signed projection, so a LIVE row may take an execution-only
 * REDRAFT without leaving service. This packets every LIVE English option still carrying it, with its row
 * and passage, for a proposer to correct or remove the sentence (value and tag unchanged).
 *   tsx scripts/agent-review/export-stock-sentence-packet.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';
const REPO = pjoin(__dirname, '..', '..');
const OUT = pjoin(REPO, 'content', 'agent-review', 'english-rewrite', 'stock');
const STOCK = 'answers the stem';
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
async function main() {
  const rows = await prisma.item.findMany({ where: { id: { startsWith: 'ENG-' }, status: 'LIVE', options: { some: { misconceptionExecution: { contains: STOCK } } } }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, lineRefs: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('stock-sentence', { 'LIVE English rows carrying the stock sentence': rows.length });
  const entries = await prisma.misconception.findMany({ where: { id: { startsWith: 'en-' }, status: 'ACTIVE', approvedBy: { in: ['reviewer:rev-0001', 'reviewer:rev-agent-01'] } }, select: { id: true, description: true, childHint: true } });
  const refs = new Set(rows.map((r) => (r.stem as { passageRef?: string }).passageRef).filter(Boolean) as string[]);
  const passages = Object.fromEntries([...refs].map((ref) => { const p = JSON.parse(readFileSync(pjoin(REPO, 'content', 'passages', `${ref}.json`), 'utf8')); return [ref, { work: p.work, numberedLines: p.numberedLines }]; }));
  const out = { door: 'english-rewrite/stock', questionType: 'english', note: 'Execution-only REDRAFTS on LIVE rows: value and tag stay; only the execution changes.',
    entries: Object.fromEntries(entries.map((e) => [e.id, { description: e.description, childHint: e.childHint }])), passages,
    rows: rows.map((r) => ({ itemId: r.id, questionType: r.questionTypeId, passageRef: (r.stem as { passageRef?: string }).passageRef ?? null, stem: r.stem, lineRefs: r.lineRefs,
      key: val(r.options.find((o) => o.isCorrect)?.content),
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null, carriesStock: !!o.misconceptionExecution?.includes(STOCK) })) })) };
  writeFileSync(pjoin(OUT, 'packet.json'), JSON.stringify(out, null, 1));
  console.log(`stock sentence: ${rows.length} LIVE rows, ${out.rows.reduce((n, r) => n + r.options.filter((o) => o.carriesStock).length, 0)} options carrying it`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
