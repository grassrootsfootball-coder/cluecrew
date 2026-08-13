/**
 * THE EIGHT COMPREHENSION CLUSTERS — `pnpm import:clusters [--write]`
 *
 * CLASSIFY BEFORE WRITING, and in ONE transaction (David, 2026-08-13). The first attempt at this
 * was an item-by-item loop with no pre-flight: it wrote one item, hit a foreign-key violation on
 * the eleventh option it touched, and left a half-applied batch. That is precisely the state
 * `reviewed-guard` exists to prevent, and I had not applied my own pattern.
 *
 * THREE CLASSES, decided before a single row is written:
 *   WRITABLE   — passes the platform's child-facing gate AND every tag resolves.
 *   GATE-HELD  — fails `checkItemChildFacing`. A gate hit is REWORDED, never exempted, and the
 *                rewording is Cowork's (it authors). Reported for return, not imported.
 *   TAG-HELD   — carries a tag the library deliberately does not hold. See below.
 *
 * WHY TAG-HELD ITEMS ARE HELD WHOLE AND NOT IMPORTED WITH A NULL TAG (David's ruling, 2026-08-13):
 * the diagnosis is what Annie ruled on. The tag is RIGHT and the hint is unverified, which is why
 * the entry is held. Nulling it would make ten correctly-tagged items look untagged, and the
 * distinction between "no diagnosis" and "diagnosis awaiting a transcription check" is the whole
 * content of the ruling.
 */
import { readFileSync } from 'node:fs';
import { checkItemChildFacing, isBlocking } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';

const DIR = '/Users/davidb/Downloads/11+/from-cluecrew';
const CLUSTERS = ['005', '006', '007', '008', '009', '010', '011', '012'];

interface Draft { itemId: string; questionTypeId: string; difficultyTier: number;
  stem: unknown; explanation?: unknown;
  options: Array<{ content: unknown; isCorrect: boolean; misconceptionId?: string }>; }

async function main(): Promise<void> {
  const write = process.argv.includes('--write');
  const drafts: Draft[] = CLUSTERS.flatMap((c) =>
    (JSON.parse(readFileSync(`${DIR}/eng${c}-draft.json`, 'utf8')).items as Draft[]));

  const known = new Set((await prisma.misconception.findMany({ select: { id: true } })).map((m) => m.id));
  const types = new Map((await prisma.questionType.findMany({ select: { id: true, mechanic: true } }))
    .map((q) => [q.id, q.mechanic]));
  const present = new Set((await prisma.item.findMany({
    where: { id: { in: drafts.map((d) => d.itemId) } }, select: { id: true } })).map((i) => i.id));

  const writable: Draft[] = [];
  const gateHeld: Array<{ id: string; detail: string }> = [];
  const tagHeld: Array<{ id: string; tags: string[] }> = [];
  const already: string[] = [];

  for (const it of drafts) {
    if (present.has(it.itemId)) { already.push(it.itemId); continue; }
    const mechanic = types.get(it.questionTypeId);
    if (!mechanic) { gateHeld.push({ id: it.itemId, detail: `questionType ${it.questionTypeId} does not exist` }); continue; }
    const faults = checkItemChildFacing({ id: it.itemId, stem: it.stem, explanation: it.explanation ?? {},
      mechanic, options: it.options }).filter(isBlocking);
    const missingTags = [...new Set(it.options
      .filter((o) => !o.isCorrect && o.misconceptionId && !known.has(o.misconceptionId))
      .map((o) => o.misconceptionId!))];
    // Both classes are reported: an item can be in either or both, and collapsing them would
    // hide a gate hit behind a tag hold or the reverse.
    if (faults.length) gateHeld.push({ id: it.itemId, detail: faults.map((f) => `[${f.rule}] ${f.detail}`).join('; ') });
    if (missingTags.length) tagHeld.push({ id: it.itemId, tags: missingTags });
    if (!faults.length && !missingTags.length) writable.push(it);
  }

  console.log(`${drafts.length} drafted · ${writable.length} WRITABLE · ${gateHeld.length} gate-held · `
    + `${tagHeld.length} tag-held · ${already.length} already present`);
  const both = gateHeld.filter((g) => tagHeld.some((t) => t.id === g.id));
  console.log(`  (${both.length} item(s) in BOTH held classes)`);
  if (gateHeld.length) {
    console.log('\nGATE-HELD — reword and return through Cowork, never exempt:');
    for (const g of gateHeld) console.log(`  ✗ ${g.id}: ${g.detail}`);
  }
  if (tagHeld.length) {
    console.log('\nTAG-HELD — the library deliberately does not hold these tags (R66 transcription ruling):');
    for (const t of tagHeld) console.log(`  · ${t.id}: ${t.tags.join(', ')}`);
  }

  if (!write) { console.log('\nDry run. Re-run with --write to apply.'); await prisma.$disconnect(); return; }

  // ONE TRANSACTION. Either every writable item lands or none does.
  await prisma.$transaction(writable.map((it) => prisma.item.create({
    data: { id: it.itemId, questionTypeId: it.questionTypeId, difficultyTier: it.difficultyTier,
      stem: it.stem as object, explanation: (it.explanation ?? {}) as object,
      status: 'DRAFT', authoredBy: 'ai-draft:cowork-okafor-v1',
      options: { create: it.options.map((o) => ({ content: o.content as object, isCorrect: o.isCorrect,
        misconceptionId: o.isCorrect ? null : (o.misconceptionId ?? null) })) } },
  })));
  console.log(`\nLANDED ${writable.length} item(s) as DRAFT in one transaction.`);
  await prisma.$disconnect();
}

void main();
