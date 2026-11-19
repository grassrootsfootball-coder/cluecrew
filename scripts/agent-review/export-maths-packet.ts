/** Packet for case-maths-01's DRAFT rows across its mapped question types, with the WHOLE active maths library (the rows carry untagged distractors, so the proposer must choose from every entry, not only those in use). */
import { writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(',') : String(x); };
async function main() {
  const c = await prisma.case.findUniqueOrThrow({ where: { id: 'case-maths-01' }, select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true } });
  const types = [c.questionTypeId, ...c.mappedQuestionTypeIds];
  const rows = await prisma.item.findMany({ where: { questionTypeId: { in: types }, status: 'DRAFT', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, solution: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('packet:maths-01', { 'draft row(s)': rows.length });
  const lib = await prisma.misconception.findMany({ where: { district: 'MATHS', status: 'ACTIVE' }, orderBy: { id: 'asc' }, select: { id: true, description: true, childHint: true, approvedBy: true } });
  const packet = { door: 'maths-01', caseId: c.id, title: c.title, questionType: c.questionTypeId, questionTypes: types,
    entries: Object.fromEntries(lib.map((m) => [m.id, { description: m.description, childHint: m.childHint, approvedBy: m.approvedBy }])),
    rows: rows.map((r) => ({ itemId: r.id, questionType: r.questionTypeId, signed: false, stem: r.stem, solution: r.solution, key: val(r.options.find((o) => o.isCorrect)?.content),
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, execution: o.misconceptionExecution?.trim() || null })) })) };
  writeFileSync(pjoin(__dirname, '..', '..', 'content', 'agent-review', 'maths-01', 'packet.json'), JSON.stringify(packet, null, 1));
  console.log(`maths-01 packet: ${rows.length} rows, ${lib.length} active maths entries`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
