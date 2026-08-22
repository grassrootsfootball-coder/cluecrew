/**
 * THE REFERENCE SET: THE EXACT STRING THE RESOLVER WOULD HAND A CHILD, PER ENGLISH LIBRARY ENTRY.
 *
 * **This is the text Annie's rulings attach to; every other surface diffs against it.** One row per
 * entry: the id, the served wording VERBATIM, and where it was read from — which for this store is
 * a TABLE AND ROW, not a file: library text lives in Postgres (`Misconception.childHint`), and the
 * serving path reads it at request time through `orchestrator.ts:951` → `hintToServe`
 * (`packages/core/src/item-hint.ts:57`). Naming a file here would invent a provenance the store
 * does not have; the row id IS the address.
 *
 * **ALL 72 ENGLISH ENTRIES, NOT ONLY THE ACTIVE ONES — because the resolver has no status filter.**
 * `orchestrator.ts:944` resolves `chosen.misconceptionId` by `findUnique` with no `status` clause,
 * so a RETIRED or REJECTED entry's wording still serves wherever an option still carries its tag.
 * The reference set is what CAN reach a child, which is a fact about the resolver, not about the
 * status column. Status travels on every row so a reader can see the two that would surprise them.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const FAMILY = 'served-wordings-english';

async function main() {
  const entries = await prisma.misconception.findMany({
    where: { id: { startsWith: 'en-' } },
    select: { id: true, status: true, childHint: true },
    orderBy: { id: 'asc' },
  });

  requirePopulation('deliver:served-wordings', { 'English library entr(ies)': entries.length });

  const rows = entries.map((m) => ({
    entryId: m.id,
    status: m.status,
    /** VERBATIM (R25). This is the string, not an account of it. */
    servedWording: String(m.childHint ?? ''),
    readFrom: `Misconception.childHint, row "${m.id}" (Postgres — the store has no file per entry), `
      + 'served via apps/web/lib/crew/orchestrator.ts:951 -> hintToServe (packages/core/src/item-hint.ts:57)',
  }));

  const payload = {
    what: 'The exact string the serving resolver would hand a child, per English library entry. The reference set: rulings attach to these wordings, and every other surface diffs against this artefact.',
    populationNote: '72 entries, not a curated subset. The resolver (orchestrator.ts:944) applies NO status filter, so RETIRED and REJECTED wordings still serve wherever an option carries their tag — 70 ACTIVE, 1 RETIRED, 1 REJECTED, status on every row.',
    freshness: 'Read at emit time from the live store. Do not keep this file as a working copy; re-run the export instead (the R-library-text rule).',
    denominators: {
      entries: rows.length,
      byStatus: rows.reduce<Record<string, number>>((a, r) => ({ ...a, [r.status]: (a[r.status] ?? 0) + 1 }), {}),
    },
    rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content',
    'the served wording of every English library entry, verbatim, with its row address and status',
    ['what', 'populationNote', 'freshness', 'denominators', 'rows']);
  const path = join(REPO, 'content/exports', stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(path, FAMILY);
  console.log(`\n${rows.length} served wording(s) emitted. For BOTH Annie and Cowork — one artefact, one digest, two readers.`);
  await prisma.$disconnect();
}

void main();
