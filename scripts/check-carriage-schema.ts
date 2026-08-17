/**
 * DOES EVERY DECLARED DESTINATION EXIST? — `pnpm check:carriage-schema`
 *
 * **THE JOIN NOBODY WAS CHECKING.** The carriage registry says where each of Cowork's fields lands;
 * the schema says which columns exist. Nothing connected them, so two entries were wrong for weeks
 * and both were invisible BY READING:
 *
 *   · `item.testedTokens` named `Item.testedTokens` — a column DROPPED under R159, found only when
 *     the type checker hit a write in the import door, one compile error at a time;
 *   · `lineRefs` named `stem.lineRefs` — R77 MOVED it to `Item.lineRefs` and the door has written
 *     there since, while the registry went on describing the old place.
 *
 * **A destination that does not exist and a destination that moved look exactly like a destination
 * that is fine, when all three are sentences.** Structured (`{kind, table, column, path}`), they
 * become one assertion, and this is it.
 *
 * WHAT IT CANNOT SEE, PRINTED EVERY RUN: that a destination is the RIGHT one. `Item.lineRefs` and
 * `Item.passageFlag` both exist; only a reader knows which a field belongs in. This asserts
 * resolution, never correctness.
 */
import { CARRIED_PATHS, destinationLabel, type Destination } from '../packages/core/src/index';
import { prisma } from '../packages/db/src/index';
import { requirePopulation } from './lib/population';

/**
 * PLATFORM-OWNED COLUMNS, DECLARED SO THEIR ABSENCE FROM THE REGISTRY READS AS A DECISION.
 *
 * The database is authoritative for status, pool, review provenance, similarity and calibration
 * (CLAUDE.md), and **a carriage registry has no business naming them** — they are not Cowork's to
 * send. Listing them here means "not named, deliberately" rather than leaving 17 unexplained gaps
 * for someone to read as coverage missing.
 */
const PLATFORM_OWNED = new Set([
  'Item.id', 'Item.status', 'Item.pool', 'Item.createdAt',
  'Item.reviewedBy', 'Item.reviewNotes', 'Item.reviewMethod', 'Item.reviewRecordedBy', 'Item.reviewRecordNote',
  'Item.similarityFlaggedAt', 'Item.similarityScore', 'Item.similarityClearedBy', 'Item.similarityClearNote',
  'Item.calibratedDifficulty', 'Item.calibrationFlaggedAt',
  'Item.answerFlaggedAt', 'Item.answerFlagNote', 'Item.solution',
  'Item.draftSelfAssessmentHash', 'Item.clusterPosition',
  'ItemOption.id', 'ItemOption.itemId',
]);

/** A JSON column's own existence is what can be asserted; the path inside it is data, not schema. */
const columnOf = (d: Destination): string | null =>
  d.kind === 'relation' ? null : `${d.table}.${d.column}`;

async function main(): Promise<void> {
  const rows: Array<{ table_name: string; column_name: string }> = await prisma.$queryRaw`
    select table_name, column_name from information_schema.columns
    where table_name in ('Item', 'ItemOption')`;
  const live = new Set(rows.map((r) => `${r.table_name}.${r.column_name}`));
  requirePopulation('check:carriage-schema', {
    'declared destinations': CARRIED_PATHS.length, 'live columns': live.size,
  });

  const unresolved = CARRIED_PATHS
    .map((p) => ({ ...p, column: columnOf(p.carriedAt) }))
    .filter((p) => p.column !== null && !live.has(p.column));

  const named = new Set(CARRIED_PATHS.map((p) => columnOf(p.carriedAt)).filter((c): c is string => c !== null));
  const unnamed = [...live].filter((c) => !named.has(c) && !PLATFORM_OWNED.has(c)).sort();
  const declaredAbsent = [...live].filter((c) => PLATFORM_OWNED.has(c)).length;

  console.log(`check:carriage-schema: ${CARRIED_PATHS.length} declared destination(s) · ${live.size} live column(s)\n`);
  console.log(`  ${CARRIED_PATHS.length - unresolved.length} resolve against the live schema`);
  console.log(`  ${declaredAbsent} live column(s) PLATFORM-OWNED and deliberately unnamed — the database is`);
  console.log('    authoritative for status, pool, review provenance, similarity and calibration, and a');
  console.log('    carriage registry has no business naming them. Absence here is a decision, not a gap.');

  if (unresolved.length) {
    console.log(`\n  ${unresolved.length} DESTINATION(S) THAT DO NOT EXIST:`);
    for (const u of unresolved) console.log(`    x ${u.path} -> ${destinationLabel(u.carriedAt)}`);
    console.log('    A column that was dropped, or one that MOVED and left the registry behind.');
  }
  if (unnamed.length) {
    console.log(`\n  ${unnamed.length} live column(s) neither declared as a destination nor platform-owned:`);
    for (const u of unnamed) console.log(`    ? ${u}`);
    console.log('    Either a field crosses into it and the registry does not say so, or it belongs');
    console.log('    in PLATFORM_OWNED. Both are decisions; neither is silence.');
  }

  console.log('\n  LIMIT: this asserts a destination RESOLVES, never that it is the RIGHT one.');
  console.log('  `Item.lineRefs` and `Item.passageFlag` both exist; only a reader knows which a');
  console.log('  field belongs in. The registry being wrong about WHICH column is still invisible.');

  await prisma.$disconnect();
  process.exit(unresolved.length === 0 && unnamed.length === 0 ? 0 : 1);
}

void main();
