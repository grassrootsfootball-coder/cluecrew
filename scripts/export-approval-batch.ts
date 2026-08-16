/**
 * THE APPROVAL BATCH — `pnpm export:approval-batch`
 *
 * Nine PROPOSED entries carry 172 English items between them. Approving the nine stops 172 items
 * carrying a tag nobody has approved — which is the provenance claim, not a rendering detail.
 *
 * VERBATIM PER R25: when a value carries a signature, send the value and not an account of it. The
 * description and childHint here are the stored fields, character for character; a ratification is
 * made against those strings. Nothing is summarised or truncated.
 *
 * ITEM COUNT PER ENTRY, so the size of each decision is on the page rather than looked up.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'approval-batch-english';

async function main(): Promise<void> {
  const items = await prisma.item.findMany({
    where: { id: { startsWith: 'ENG-' } },
    select: { id: true, options: { select: { misconceptionId: true } } },
  });
  const proposed = await prisma.misconception.findMany({
    where: { status: 'PROPOSED', district: 'ENGLISH' },
    orderBy: { id: 'asc' },
  });

  const entries = proposed.map((m) => {
    const carrying = items.filter((i) => i.options.some((o) => o.misconceptionId === m.id));
    return {
      id: m.id,
      status: m.status,
      // VERBATIM. Approve or reject against these exact strings.
      description: m.description,
      childHint: m.childHint,
      proposedBy: m.proposedBy,
      category: m.category,
      sourcePattern: m.sourcePattern,
      // WHO WROTE THE HINT, separately from who would approve it (R98). UNKNOWN, never absent.
      textProvenance: m.textProvenance ?? { state: 'UNKNOWN', note: 'no provenance recorded on this row' },
      itemsCarryingThisTag: carrying.length,
      itemIds: carrying.map((i) => i.id).sort(),
    };
  }).filter((e) => e.itemsCarryingThisTag > 0)
    .sort((a, b) => b.itemsCarryingThisTag - a.itemsCarryingThisTag);

  requirePopulation('export:approval-batch', { 'PROPOSED English entries carrying items': entries.length });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(
    entries, generatedAt, 'content',
    'every PROPOSED English misconception carrying live items, with its description and childHint verbatim',
    ['entries'],
  );
  const body = {
    kind: FAMILY,
    note:
      'Nine entries, 172 items. Every item carrying one of these is tagged against a misconception '
      + 'nobody has approved. Description and childHint are the stored fields verbatim (R25) — a '
      + 'ratification is made against these strings, not against an account of them.',
    generatedAt,
    stamp,
    count: entries.length,
    itemsAffected: new Set(entries.flatMap((e) => e.itemIds)).size,
    entries,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(body, null, 2));
  deliver(path, FAMILY);

  console.log(`${entries.length} entries · ${body.itemsAffected} items affected`);
  for (const e of entries) console.log(`  ${String(e.itemsCarryingThisTag).padStart(3)}  ${e.id}`);
  await prisma.$disconnect();
}

void main();
