/**
 * LIBRARY PACKETS for the agent reviewer (R1021): one file per library entry that a practice DRAFT
 * carries and that is not stamped `reviewer:rev-0001`. Each carries the entry's text VERBATIM (R25)
 * and EVERY carrier it lands on, DRAFT or LIVE, with the key, the carrying option, its siblings and
 * their tags (R573) and the carrying option's execution — the FIT reading of R572.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const OUT = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'library');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
async function main() {
  mkdirSync(OUT, { recursive: true });
  const ids = (await prisma.$queryRaw<Array<{ id: string }>>`select distinct m.id from "Misconception" m join "ItemOption" o on o."misconceptionId"=m.id join "Item" i on i.id=o."itemId" where i.status='DRAFT' and i.pool='PRACTICE' and coalesce(m."approvedBy",'')<>'reviewer:rev-0001'`).map((r) => r.id);
  requirePopulation('library-packets', { 'unattested entries carried by drafts': ids.length });
  const index: Array<Record<string, unknown>> = [];
  for (const id of ids) {
    const m = await prisma.misconception.findUniqueOrThrow({ where: { id } });
    const items = await prisma.item.findMany({ where: { status: { in: ['DRAFT', 'LIVE'] }, options: { some: { misconceptionId: id } } }, orderBy: { id: 'asc' },
      select: { id: true, status: true, questionTypeId: true, stem: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    const carriers = items.map((i) => ({ itemId: i.id, status: i.status, questionType: i.questionTypeId,
      stem: Object.fromEntries(Object.entries(i.stem as Record<string, unknown>).filter(([k]) => !k.startsWith('_') && k !== 'quotes')),
      key: val(i.options.find((o) => o.isCorrect)?.content),
      options: i.options.map((o) => ({ value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, carriesThisEntry: o.misconceptionId === id, execution: o.misconceptionId === id ? o.misconceptionExecution : undefined })) }));
    const packet = { entry: { id: m.id, status: m.status, district: m.district, category: m.category, description: m.description, childHint: m.childHint,
      approvedBy: m.approvedBy, approvalMethod: m.approvalMethod, approvalNote: m.approvalNote, textProvenance: m.textProvenance }, carrierCount: carriers.length, carriers };
    writeFileSync(pjoin(OUT, `${id}.json`), JSON.stringify(packet, null, 1));
    index.push({ id, status: m.status, approvedBy: m.approvedBy, carriers: carriers.length });
  }
  writeFileSync(pjoin(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`library packets: ${ids.length} entries written to content/agent-review/library/`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
