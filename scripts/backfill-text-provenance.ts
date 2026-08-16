/**
 * PROVENANCE ON THE LIBRARY ROW — `pnpm backfill:text-provenance [--write]`
 *
 * A hint Anne WROTE and a hint a drafting agent wrote that Anne APPROVED UNCHANGED are both
 * approved by her, and only one is in her words. `approvedBy: Anne` reads identically for both, and
 * nothing on the row could tell them apart.
 *
 * NULL MEANS UNKNOWN, NEVER ABSENT. Cowork corrected a TRUE record of Annie's approval to false
 * because it looked on its own disk, found nothing, and treated absence as evidence. Every row this
 * script cannot source is left UNRECORDED and counted, rather than given a confident default —
 * the same distinction as `CARRIED?` on the return leg.
 *
 * THE SOURCE IS COWORK'S OWN DECLARATION, quoted and hashed. `PLATFORM-IMPORT-BATCH-1` and
 * `-BATCH-2` name the split entry by entry in their `_meta.hintProvenance`, and the seven-entry
 * file states the totals. Nothing here is inferred from the text itself.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { Prisma, prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const DAVID = 'human:david@cluecrew.test';

/**
 * WHO WROTE THE HINT, from Cowork's declarations. `PERSON` means the reviewer's own words;
 * `MACHINE` means a drafting agent wrote them and the reviewer approved them unchanged — still her
 * approval, never her authorship.
 */
const DECLARED: Readonly<Record<string, { author: 'PERSON' | 'MACHINE'; source: string }>> = {
  'en-within-span-wrong-element': { author: 'PERSON', source: "Anne's own text quoted verbatim from her proposals (BATCH-1 _meta.hintProvenance)" },
  'en-negation-dropped': { author: 'PERSON', source: "Anne's own text quoted verbatim from her proposals (BATCH-1 _meta.hintProvenance)" },
  'en-vocab-neighbouring-sense': { author: 'MACHINE', source: 'drafted by the authoring agent, approved unchanged by Anne (BATCH-1 _meta.hintProvenance)' },
  'en-vocab-form-lookalike': { author: 'MACHINE', source: 'drafted by the authoring agent, approved unchanged by Anne (BATCH-1 _meta.hintProvenance)' },
  'en-coordination-wrong-conjunct': { author: 'MACHINE', source: 'drafted by the authoring agent, approved unchanged by Anne (BATCH-2 _meta.hintProvenance)' },
  'en-whole-text-absence-asserted': { author: 'MACHINE', source: 'drafted by the authoring agent, approved unchanged by Anne (BATCH-2 _meta.hintProvenance)' },
};

async function main(): Promise<void> {
  const write = process.argv.includes('--write');

  // The declarations, quoted and hashed, so this record names what it read.
  const sources: Array<{ file: string; sha: string; quote: string }> = [];
  for (const f of ['PLATFORM-IMPORT-BATCH-1.json', 'PLATFORM-IMPORT-BATCH-2.json', 'PLATFORM-IMPORT-english-misconceptions.json']) {
    const path = `${DIR}/${f}`;
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    const quote = String((JSON.parse(raw) as { _meta?: { hintProvenance?: unknown } })._meta?.hintProvenance ?? '');
    sources.push({ file: f, sha: createHash('sha256').update(raw).digest('hex').slice(0, 16), quote });
  }
  requirePopulation('backfill:text-provenance', { 'Cowork declarations read': sources.length });
  for (const s of sources) console.log(`  ${s.sha}  ${s.file}\n     "${s.quote.slice(0, 120)}…"`);

  const rows = await prisma.misconception.findMany({
    where: { id: { in: Object.keys(DECLARED) } },
    select: { id: true, status: true, approvedBy: true, textProvenance: true },
  });
  const absent = Object.keys(DECLARED).filter((id) => !rows.some((r) => r.id === id));

  const updates = rows.filter((r) => r.textProvenance === null).map((r) => {
    const d = DECLARED[r.id]!;
    return {
      id: r.id,
      provenance: {
        state: 'RECORDED',
        hintAuthoredBy: d.author === 'PERSON' ? 'Annie' : 'ai-draft:cowork-okafor-v1',
        hintAuthorKind: d.author,
        hintSource: d.source,
        // The APPROVAL as this store holds it — which is not what the transfer file claims.
        approvedBy: r.approvedBy,
        approvalKind: r.approvedBy === null ? 'NONE RECORDED HERE' : 'PERSON',
        approvalNote:
          r.approvedBy === null
            ? 'This store records NO approval for this entry: status PROPOSED, approvedBy null, and '
              + 'no attribution event. Cowork\'s transfer file carries approvedBy: Anne; that claim '
              + 'never crossed and is not asserted here.'
            : null,
        declaredBy: 'Cowork _meta.hintProvenance',
        declarationSources: sources.map((s) => ({ file: s.file, sha256: s.sha })),
        recordedOn: '2026-08-16',
      },
    };
  });

  const authorSplit = Object.values(DECLARED).reduce<Record<string, number>>((a, d) => { a[d.author] = (a[d.author] ?? 0) + 1; return a; }, {});
  console.log(`\n  ${rows.length} of ${Object.keys(DECLARED).length} declared entries present · ${updates.length} to record`);
  console.log(`  declared hint authorship: ${JSON.stringify(authorSplit)}`);
  if (absent.length) console.log(`  absent from this store: ${absent.join(', ')}`);
  console.log(`  rows carrying an approval here: ${rows.filter((r) => r.approvedBy !== null).length} of ${rows.length}`);

  if (updates.length === 0) { console.log('\n  Nothing to record.'); await prisma.$disconnect(); return; }
  if (!write) { console.log('\n  Dry run. Re-run with --write to apply.'); await prisma.$disconnect(); return; }

  await prisma.$transaction(updates.map((u) => prisma.misconception.update({
    where: { id: u.id }, data: { textProvenance: u.provenance as object },
  })));
  for (const u of updates) {
    await prisma.attributionEvent.create({
      data: {
        recordType: 'misconception', recordId: u.id, action: 'AMENDED',
        actor: DAVID, recordedBy: DAVID, field: 'textProvenance',
        method: 'Cowork _meta.hintProvenance, quoted and hashed, 2026-08-16',
        note:
          `Recorded who AUTHORED the hint text (${u.provenance.hintAuthorKind}) separately from who `
          + 'approved it. Both readings of "approvedBy: Anne" were indistinguishable before this. '
          + 'No approval is asserted here that this store does not hold.',
      },
    });
  }

  const after = await prisma.misconception.findMany({
    where: { id: { in: updates.map((u) => u.id) } }, select: { id: true, textProvenance: true },
  });
  const recorded = after.filter((r) => (r.textProvenance as { state?: string } | null)?.state === 'RECORDED');
  console.log(`\n  VERIFIED by re-reading all ${after.length} rows: ${recorded.length} carry state RECORDED.`);
  const unknown = await prisma.misconception.count({ where: { textProvenance: { equals: Prisma.DbNull } } });
  console.log(`  library rows still UNKNOWN (no provenance recorded): ${unknown} of ${await prisma.misconception.count()}`);
  await prisma.$disconnect();
}

void main();
