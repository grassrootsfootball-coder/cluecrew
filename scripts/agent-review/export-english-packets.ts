/**
 * ENGLISH PACKETS for the agent reviewer (R1021): one file per passage, holding the passage's numbered
 * lines VERBATIM and every practice DRAFT row on it — stem, key, every option with its tag, the tag's
 * childHint (R573) and the option's execution, and the row's walk script and hint. A row with no
 * passageRef is placed on its batch's passage by id prefix and MARKED, never silently (R98).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';
const REPO = pjoin(__dirname, '..', '..');
const OUT = pjoin(REPO, 'content', 'agent-review', 'english');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };
async function main() {
  mkdirSync(OUT, { recursive: true });
  const rows = await prisma.item.findMany({ where: { status: 'DRAFT', pool: 'PRACTICE', questionTypeId: { startsWith: 'en-' } }, orderBy: { id: 'asc' },
    select: { id: true, questionTypeId: true, stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
  requirePopulation('english-packets', { 'English practice drafts': rows.length });
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true, status: true } })).map((m) => [m.id, m]));
  const batchRef = new Map<string, string>();
  for (const r of rows) { const ref = (r.stem as { passageRef?: string }).passageRef; if (ref) batchRef.set(r.id.split('-').slice(0, 2).join('-'), ref); }
  const groups = new Map<string, unknown[]>();
  for (const r of rows) {
    const stem = r.stem as Record<string, unknown>;
    const declared = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    const ref = declared ?? batchRef.get(r.id.split('-').slice(0, 2).join('-')) ?? 'NO-PASSAGE';
    const signed = await prisma.attributionEvent.count({ where: { recordId: r.id, action: 'SIGNED' } });
    const ex = r.explanation as Record<string, unknown> | null;
    (groups.get(ref) ?? groups.set(ref, []).get(ref)!).push({ itemId: r.id, questionType: r.questionTypeId, passageRefMissing: declared === null, everSigned: signed > 0,
      stem: Object.fromEntries(Object.entries(stem).filter(([k]) => !k.startsWith('_'))),
      key: val(r.options.find((o) => o.isCorrect)?.content),
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId,
        tagStatus: o.misconceptionId ? lib.get(o.misconceptionId)?.status ?? 'MISSING' : null,
        tagChildHint: o.misconceptionId ? lib.get(o.misconceptionId)?.childHint ?? null : null, execution: o.misconceptionExecution?.trim() || null })),
      hintCore: ex?.hintCore ?? null, walkScript: ex?.walkScript ?? null });
  }
  const index: Array<Record<string, unknown>> = [];
  for (const [ref, items] of groups) {
    const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
    const p = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown> : null;
    const passage = p ? { id: p.id, work: p.work, sceneTitle: p.sceneTitle, preamble: p.preamble, numberedLines: p.numberedLines, readingSupport: p.readingSupport } : { missing: true };
    writeFileSync(pjoin(OUT, `${ref}.json`), JSON.stringify({ passageRef: ref, passage, rows: items }, null, 1));
    index.push({ ref, rows: items.length, passageFound: !!p });
  }
  writeFileSync(pjoin(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`english packets: ${rows.length} rows across ${groups.size} passages; passage file missing for ${index.filter((i) => !i.passageFound).length}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
