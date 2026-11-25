/**
 * WALK PACKETS (R1067): one file per VR case, every LIVE practice row with its stem, key, the
 * three-part option set (key, siblings, their tags and each tag's childHint — R573) and its current
 * walk script verbatim or null. House-form exemplars are the scripts Annie approved (vr-10, her 146th),
 * read from the rows that carry her approval marker — never a hand-kept list (R57).
 *
 *   tsx scripts/agent-review/export-walk-packets.ts --cases=case-vr-01,case-vr-03
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const OUT = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'walk');
const CASES = (process.argv.find((a) => a.startsWith('--cases='))?.slice(8) ?? '').split(',').filter(Boolean);
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };

async function main() {
  if (!CASES.length) throw new Error('pass --cases=case-vr-NN,...');
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } })).map((m) => [m.id, m.childHint]));
  const approved = await prisma.item.findMany({ where: { status: 'LIVE', explanation: { path: ['walkScriptApprovedBy'], equals: 'reviewer:rev-0001' } },
    orderBy: { id: 'asc' }, select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
  const exemplars = approved.slice(0, 6).map((r) => ({ itemId: r.id, stem: r.stem, key: val(r.options.find((o) => o.isCorrect)?.content),
    options: r.options.map((o) => val(o.content)), walkScript: (r.explanation as Record<string, unknown>).walkScript }));
  for (const caseId of CASES) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { id: true, title: true, questionTypeId: true, freeTier: true } });
    const rows = await prisma.item.findMany({ where: { questionTypeId: c.questionTypeId, status: 'LIVE', pool: 'PRACTICE' }, orderBy: { id: 'asc' },
      select: { id: true, stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
    requirePopulation(`walk-packet:${caseId}`, { 'LIVE practice rows': rows.length });
    const packet = { caseId: c.id, title: c.title, questionType: c.questionTypeId, free: c.freeTier, houseFormExemplars: exemplars,
      rows: rows.map((r) => { const ex = (r.explanation ?? {}) as Record<string, unknown>; return {
        itemId: r.id, stem: r.stem, key: val(r.options.find((o) => o.isCorrect)?.content),
        options: r.options.map((o) => ({ value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, tagChildHint: o.misconceptionId ? lib.get(o.misconceptionId) ?? null : null })),
        walkScript: typeof ex.walkScript === 'string' ? ex.walkScript : null,
        walkScriptApprovedBy: ex.walkScriptApprovedBy ?? null }; }) };
    mkdirSync(pjoin(OUT, caseId), { recursive: true });
    writeFileSync(pjoin(OUT, caseId, 'packet.json'), JSON.stringify(packet, null, 1));
    console.log(`${caseId}: ${rows.length} rows, ${packet.rows.filter((r) => r.walkScript).length} with a script, ${packet.rows.filter((r) => !r.walkScript).length} without`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
