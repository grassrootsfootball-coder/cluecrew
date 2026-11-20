/**
 * ENGLISH REWRITE PACKETS (R1023, David 2026-11-20: "Yes, agents rewrite"). One packet per review group
 * (`content/agent-review/english/groups.json`), holding ONLY the rows standing in the hold file, each
 * with its hold reason and field verbatim, the row as the database holds it NOW (stem, item-level
 * lineRefs, the whole explanation, every option with tag and execution), the passages those rows sit on
 * (numberedLines verbatim) and the English library entries a rewritten option may carry.
 *
 * Only ATTESTED entries are offered (approved by rev-0001 or rev-agent-01, ACTIVE): `land-proposals`
 * refuses any other tag, so offering one would invite a proposal that cannot land.
 *
 * A row with no `stem.passageRef` is placed on its batch's passage by id prefix (every ENG batch sits on
 * exactly one passage) and MARKED `passageRefMissing: true` — the inference is stated, never silent (R98).
 *
 * ROUND 2+ (`--round=N`): the packet goes to `english-rewrite/rN/<G>/` and each row also carries
 * `previousRound` — the last round's proposal for it and the reviewer's verdicts on it — so a held row
 * is repaired from where the review left it, not redrafted blind. `holds` stays the ORIGINAL hold: the
 * reviewer must still re-read that field (R1022), and the new findings ride beside it.
 *
 *   tsx scripts/agent-review/export-english-rewrite-packets.ts [--round=2]
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join as pjoin } from 'node:path';
import { prisma } from '../../packages/db/src/index';
import { requirePopulation } from '../lib/population';

const REPO = pjoin(__dirname, '..', '..');
const SRC = pjoin(REPO, 'content', 'agent-review', 'english');
const BASE = pjoin(REPO, 'content', 'agent-review', 'english-rewrite');
const ROUND = Number(process.argv.find((a) => a.startsWith('--round='))?.slice(8) ?? '1');
const OUT = ROUND > 1 ? pjoin(BASE, `r${ROUND}`) : BASE;
const prevDir = (g: string) => (ROUND > 2 ? pjoin(BASE, `r${ROUND - 1}`, g) : pjoin(BASE, g));
const readJson = (f: string) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const val = (c: unknown) => { const x = (c as { value?: unknown })?.value; return Array.isArray(x) ? x.join(', ') : String(x); };

async function main() {
  const holdFile = JSON.parse(readFileSync(pjoin(SRC, 'held-for-authoring-store.json'), 'utf8')) as { held: Array<{ itemId: string; reason: string; faultField: string; group: string }> };
  requirePopulation('english-rewrite-packets', { 'rows standing in the hold file': holdFile.held.length });
  const groups = JSON.parse(readFileSync(pjoin(SRC, 'groups.json'), 'utf8')) as Record<string, string[]>;

  const entries = await prisma.misconception.findMany({ where: { id: { startsWith: 'en-' }, status: 'ACTIVE', approvedBy: { in: ['reviewer:rev-0001', 'reviewer:rev-agent-01'] } },
    select: { id: true, description: true, childHint: true, approvalNote: true }, orderBy: { id: 'asc' } });
  requirePopulation('english-rewrite-packets', { 'attested English library entries': entries.length });
  const entryMap = Object.fromEntries(entries.map((e) => [e.id, { description: e.description, childHint: e.childHint, approvalNote: e.approvalNote }]));

  // The batch -> passage map, read from rows that DO declare one.
  const declared = await prisma.item.findMany({ where: { id: { startsWith: 'ENG-' } }, select: { id: true, stem: true } });
  const batchRefs = new Map<string, Set<string>>();
  for (const r of declared) { const ref = (r.stem as { passageRef?: string }).passageRef; if (ref) { const b = r.id.split('-').slice(0, 2).join('-'); (batchRefs.get(b) ?? batchRefs.set(b, new Set()).get(b)!).add(ref); } }

  const byGroup = new Map<string, unknown[]>(); const passagesByGroup = new Map<string, Set<string>>();
  let placed = 0;
  for (const h of holdFile.held) {
    const r = await prisma.item.findUniqueOrThrow({ where: { id: h.itemId }, select: { id: true, status: true, questionTypeId: true, difficultyTier: true, stem: true, lineRefs: true, explanation: true,
      options: { select: { id: true, content: true, isCorrect: true, misconceptionId: true, misconceptionExecution: true }, orderBy: { id: 'asc' } } } });
    if (r.status !== 'DRAFT') throw new Error(`${r.id} is ${r.status}, not DRAFT — the hold file and the store disagree; refusing to build a packet over it`);
    const stem = r.stem as Record<string, unknown>;
    let ref = typeof stem.passageRef === 'string' ? stem.passageRef : null;
    const missing = ref === null;
    if (missing) {
      const cands = batchRefs.get(r.id.split('-').slice(0, 2).join('-'));
      if (!cands || cands.size !== 1) throw new Error(`${r.id}: no passageRef and its batch does not sit on exactly one passage (${[...(cands ?? [])].join(', ') || 'none'})`);
      ref = [...cands][0]!; placed++;
    }
    const g = Object.entries(groups).find(([, refs]) => refs.includes(ref!))?.[0] ?? h.group.match(/G\d+/)?.[0];
    if (!g) throw new Error(`${r.id}: passage ${ref} is in no group`);
    (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push({
      itemId: r.id, questionType: r.questionTypeId, difficultyTier: r.difficultyTier, passageRef: ref, passageRefMissing: missing,
      hold: { reason: h.reason, faultField: h.faultField },
      ...(ROUND > 1 ? { previousRound: (() => {
        const pr = readJson(pjoin(prevDir(g), 'proposals.json')) as { rebuilds?: Array<{ itemId: string }>; cannotFix?: Array<{ itemId: string }> } | null;
        const rv = readJson(pjoin(prevDir(g), 'proposal-review.json')) as { changes?: Array<{ ref: string }>; rows?: Array<{ itemId: string }> } | null;
        return { proposal: pr?.rebuilds?.find((x) => x.itemId === r.id) ?? null, cannotFix: pr?.cannotFix?.find((x) => x.itemId === r.id) ?? null,
          reviewOfChange: rv?.changes?.find((x) => x.ref === `rebuild:${r.id}`) ?? null, reviewOfRow: rv?.rows?.find((x) => x.itemId === r.id) ?? null };
      })() } : {}),
      stem: Object.fromEntries(Object.entries(stem).filter(([k]) => !k.startsWith('_'))), lineRefs: r.lineRefs, explanation: r.explanation,
      key: val(r.options.find((o) => o.isCorrect)?.content),
      options: r.options.map((o) => ({ optionId: o.id, value: val(o.content), isKey: o.isCorrect, tag: o.misconceptionId,
        tagAttested: o.misconceptionId ? o.misconceptionId in entryMap : null, execution: o.misconceptionExecution?.trim() || null })),
    });
    (passagesByGroup.get(g) ?? passagesByGroup.set(g, new Set()).get(g)!).add(ref!);
  }

  for (const [g, rows] of byGroup) {
    const dir = pjoin(OUT, g); mkdirSync(dir, { recursive: true });
    const passages: Record<string, unknown> = {};
    for (const ref of passagesByGroup.get(g)!) {
      const f = pjoin(REPO, 'content', 'passages', `${ref}.json`);
      if (!existsSync(f)) throw new Error(`${g}: passage file ${ref} is missing — a row cannot be rewritten against a passage nobody can read`);
      const p = JSON.parse(readFileSync(f, 'utf8')) as Record<string, unknown>;
      passages[ref] = { id: p.id, work: p.work, sceneTitle: p.sceneTitle, preamble: p.preamble, numberedLines: p.numberedLines, readingSupport: p.readingSupport };
    }
    const holds = Object.fromEntries((rows as Array<{ itemId: string; hold: unknown }>).map((r) => [r.itemId, r.hold]));
    writeFileSync(pjoin(dir, 'packet.json'), JSON.stringify({ door: ROUND > 1 ? `english-rewrite/r${ROUND}/${g}` : `english-rewrite/${g}`, round: ROUND, questionType: 'english', ruling: 'R1023', holds, entries: entryMap, passages, rows }, null, 1));
    console.log(`  ${g}: ${rows.length} held rows on ${passagesByGroup.get(g)!.size} passage(s)`);
  }
  console.log(`english rewrite packets: ${holdFile.held.length} held rows in ${byGroup.size} groups; ${entries.length} attested entries offered; ${placed} rows placed on their batch's passage by prefix (marked)`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
