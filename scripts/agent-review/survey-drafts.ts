/** What blocks each remaining practice DRAFT, by question type. Read-only. */
import { prisma } from '../../packages/db/src/index';
import { publishBlockers, checkItemChildFacing, isBlocking, isHeldFromServing } from '../../packages/core/src/index';
import { itemWholeness } from '../lib/item-wholeness';
import { loadClearances } from '../lib/clearances';
import { pinHashes, canonicalOrderHash } from '../lib/pin-projection';
const permute = <T,>(a: T[]): T[][] => a.length <= 1 ? [a] : a.flatMap((x, i) => permute([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
async function main() {
  const attested = new Set((await prisma.misconception.findMany({ where: { status: 'ACTIVE', approvedBy: 'reviewer:rev-0001' }, select: { id: true } })).map((m) => m.id));
  const clear = loadClearances();
  const rows = await prisma.item.findMany({ where: { status: 'DRAFT', pool: 'PRACTICE', questionTypeId: { notIn: [] } }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, explanation: true, authoredBy: true, answerFlaggedAt: true,
      options: { select: { content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  const t: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const k = r.questionTypeId; t[k] ??= { rows: 0 };
    const bump = (f: string) => { t[k][f] = (t[k][f] ?? 0) + 1; };
    bump('rows');
    const sigs = await prisma.attributionEvent.findMany({ where: { recordId: r.id, action: 'SIGNED', reviewerId: { in: ['rev-0001', 'rev-agent-01'] }, subjectHash: { not: null } }, select: { subjectHash: true } });
    const hs = new Set(sigs.map((s) => s.subjectHash!));
    let signed = hs.has(canonicalOrderHash(r));
    if (!signed && hs.size && r.options.length <= 6) signed = permute(r.options).some((p) => { const h = pinHashes({ stem: r.stem, explanation: r.explanation, options: p }); return hs.has(h.retentionIncluded) || hs.has(h.retentionExcluded); });
    if (!signed) bump(sigs.length ? 'signedButMoved' : 'neverSigned');
    const w = itemWholeness(r, attested, false);
    if (!w.tagsAttested) bump('tagsNotAttested');
    if (!w.executionsExist) bump('executionsMissing');
    const b = publishBlockers(r.options, 'reviewer:rev-agent-01', r.authoredBy, r.answerFlaggedAt); if (b) bump(`blocked:${b}`);
    if (checkItemChildFacing({ id: r.id, stem: r.stem, explanation: r.explanation, options: r.options, clearedAppropriatenessTokens: clear.get(r.id) } as never).some(isBlocking)) bump('childFacingFault');
    if (isHeldFromServing(r.id)) bump('heldFromServing');
    t[k].seatsNoExec = (t[k].seatsNoExec ?? 0) + r.options.filter((o) => o.misconceptionId && !(o.misconceptionExecution ?? '').trim()).length;
  }
  for (const [k, v] of Object.entries(t)) console.log(k.padEnd(28), JSON.stringify(v));
}
main().finally(() => prisma.$disconnect());
