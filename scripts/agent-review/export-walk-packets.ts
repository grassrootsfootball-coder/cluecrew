/**
 * WALK PACKETS (R1067): one file per VR case, every LIVE practice row with its stem, key, the
 * three-part option set (key, siblings, their tags and each tag's childHint — R573) and its current
 * walk script verbatim or null. House-form exemplars are the scripts Annie approved (vr-10, her 146th),
 * read from the rows that carry her approval marker — never a hand-kept list (R57).
 *
 *   tsx scripts/agent-review/export-walk-packets.ts --cases=case-vr-01,case-vr-03
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const OUT = pjoin(__dirname, '..', '..', 'content', 'agent-review', 'walk');
const CASES = (process.argv.find((a) => a.startsWith('--cases='))?.slice(8) ?? '').split(',').filter(Boolean);
/** --split=N writes N part-folders (<case>-p1..pN) so several reviewers can read one large case. */
const SPLIT = Number(process.argv.find((a) => a.startsWith('--split='))?.slice(8) ?? '1');
const PASSAGES = pjoin(__dirname, '..', '..', 'content', 'passages');
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };

async function main() {
  if (!CASES.length) throw new Error('pass --cases=case-vr-NN,...');
  const lib = new Map((await prisma.misconception.findMany({ select: { id: true, childHint: true } })).map((m) => [m.id, m.childHint]));
  const approved = await prisma.item.findMany({ where: { status: 'LIVE', explanation: { path: ['walkScriptApprovedBy'], equals: 'reviewer:rev-0001' } },
    orderBy: { id: 'asc' }, select: { id: true, stem: true, explanation: true, options: { select: { content: true, isCorrect: true }, orderBy: { id: 'asc' } } } });
  const exemplars = approved.slice(0, 6).map((r) => ({ itemId: r.id, stem: r.stem, key: val(r.options.find((o) => o.isCorrect)?.content),
    options: r.options.map((o) => val(o.content)), walkScript: (r.explanation as Record<string, unknown>).walkScript }));
  for (const caseId of CASES) {
    const c = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { id: true, title: true, questionTypeId: true, mappedQuestionTypeIds: true, freeTier: true } });
    const rows = await prisma.item.findMany({ where: { questionTypeId: { in: [c.questionTypeId, ...c.mappedQuestionTypeIds] }, status: 'LIVE', pool: 'PRACTICE', NOT: { id: { startsWith: 'zz-' } } }, orderBy: { id: 'asc' },
      select: { id: true, stem: true, explanation: true, options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true }, orderBy: { id: 'asc' } } } });
    requirePopulation(`walk-packet:${caseId}`, { 'LIVE practice rows': rows.length });
    const all = rows.map((r) => { const ex = (r.explanation ?? {}) as Record<string, unknown>; return {
        itemId: r.id, stem: r.stem, key: val(r.options.find((o) => o.isCorrect)?.content),
        options: r.options.map((o) => ({ value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId, tagChildHint: o.misconceptionId ? lib.get(o.misconceptionId) ?? null : null })),
        walkScript: typeof ex.walkScript === 'string' ? ex.walkScript : null,
        walkScriptApprovedBy: ex.walkScriptApprovedBy ?? null }; });
    const size = Math.ceil(all.length / SPLIT);
    for (let p = 0; p < SPLIT; p++) {
      const part = all.slice(p * size, (p + 1) * size);
      if (!part.length) continue;
      // English rows cite a passage by line; the passage travels with the rows that cite it, VERBATIM (R25).
      const refs = [...new Set(part.map((r) => (r.stem as { passageRef?: string }).passageRef).filter((x): x is string => typeof x === 'string'))];
      const passages = Object.fromEntries(refs.map((ref) => { const f = pjoin(PASSAGES, `${ref}.json`); if (!existsSync(f)) throw new Error(`${ref}: passage file missing`);
        const j = JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>; return [ref, { sceneTitle: j.sceneTitle, numberedLines: j.numberedLines,
        // The child is sent the title and the numbered lines only (orchestrator.ts, the passage the Crew screen
        // gets). The preamble travels for context and says so in its NAME, never one field over (R203/R204):
        // a drafter told it was on screen quoted it, and nothing a child can see held those words.
        preambleNotShownToChild: j.preamble }]; }));
      const name = SPLIT > 1 ? `${caseId}-p${p + 1}` : caseId;
      const packet = { caseId: c.id, part: name, title: c.title, questionType: c.questionTypeId, free: c.freeTier, houseFormExemplars: exemplars, passages, rows: part };
      mkdirSync(pjoin(OUT, name), { recursive: true });
      writeFileSync(pjoin(OUT, name, 'packet.json'), JSON.stringify(packet, null, 1));
      console.log(`${name}: ${part.length} rows, ${part.filter((r) => r.walkScript).length} with a script, ${part.filter((r) => !r.walkScript).length} without, ${refs.length} passage(s)`);
    }
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
