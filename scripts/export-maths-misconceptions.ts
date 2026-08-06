/**
 * Approved maths misconception ids for authoring — `pnpm export:maths-misconceptions`.
 *
 * BUILD-DISTRICT-MATHS item authoring drafts against these: every maths
 * distractor must be the executed misconception on that item's own numbers (P3).
 * Only ACTIVE ids are exported — a PROPOSED id cannot be referenced by a live
 * item. Hash-named, stamped and delivered like every other export.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { buildMathsMisconceptionsSource } from './lib/maths-misconceptions-source';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-misconceptions-approved';

// Annie's retag map — current truth after the library sitting (2026-08-06). The
// batch-01 distractor moves now that the process axis, the splits, the #24/#76 merge
// and #98-108 exist. Batches 02+ tag against this from the start.
const SPLIT_RETAG = {
  note: 'Post-sitting map. PROC-01 is a PROCESS tag (pair it with a topic tag on the two-role model); #102-108 are new; #76 and #86 are retired.',
  toProcessTagPROC01: ['FDP-02 B', 'FDP-06 C', 'FDP-07 D', 'MEAS-05 C', 'STATS-03 A', 'GEOM-01 C', 'GEOM-03 A', 'GEOM-06 A'],
  moves: {
    'MEAS-03 A, MEAS-06 D': '#92 scaled-without-finding-one',
    'MEAS-03 B, MEAS-06 B': '#102 scaled-by-the-difference',
    'MEAS-03 C, MEAS-06 A': '#103 scaled-by-the-original-count',
    'STATS-03 B': '#96 divided-by-the-wrong-count',
    'STATS-03 C': '#104 gave-a-different-average',
    'MEAS-07 A': '#93 compared-packs-not-units',
    'MEAS-07 C': '#105 divided-by-the-other-quantity',
    'MEAS-07 B, NPV-05 C': '#72 wrong-operation (process)',
    'GEOM-01 D': '#88 missed-a-side',
    'NPV-04 C, NPV-04 D': '#65 rounded-to-the-wrong-place',
    'NPV-04 B': '#106 always-rounds-down',
    'NPV-02 B, NPV-02 C': '#63 misaligned-carry (kept whole, parametric on column)',
    'NPV-02 D': '#69 dropped-carry',
    'NPV-05 B': '#66 ignored-the-minus',
    'NPV-05 D': '#107 miscounted-across-zero',
    'FDP-02 C, FDP-08 C, FDP-08 D': '#75 used-one-number-of-the-fraction',
    'FDP-02 D': '#24 fraction-used-upside-down (absorbs #76)',
    'FDP-04 B, FDP-08 B': '#108 multiplied-instead-of-dividing-by-a-fraction',
    'MEAS-05 B, MEAS-05 D': '#71 quantity-left-out',
  },
  retired: { '#76': 'absorbed into #24', '#86': 'dissolved → #71 and PROC-01' },
  libraryWideReRead: 'Each narrowed entry describes less than it did; anything ELSE carrying #71/#72/#89/#92/#96/#93/#88 must be re-read against the new wording before tagging.',
};

/**
 * Build, stamp, write and DELIVER the current library (pruning the stale file).
 * Reusable so any script that changes the library can re-export as its final
 * step — the export follows the state change instead of lagging it. Takes a
 * PrismaClient and never disconnects it (the caller owns the connection).
 */
export async function exportMathsMisconceptions(client: typeof prisma): Promise<string> {
  const entries = await buildMathsMisconceptionsSource(client);
  const stamp = freshnessStamp(entries, new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  const derivable = (entries as Array<{ distractorClass: string }>).filter((e) => e.distractorClass === 'derivable').length;
  writeFileSync(
    path,
    JSON.stringify(
      {
        kind: 'maths-misconceptions-approved',
        note: 'Approved (ACTIVE) KS2 maths misconceptions for BUILD-DISTRICT-MATHS authoring. Every maths distractor is the executed misconception on the item\'s own numbers (P3).',
        ...stamp,
        count: entries.length,
        derivable,
        conceptual: entries.length - derivable,
        splitRetagMap: SPLIT_RETAG,
        misconceptions: entries,
      },
      null,
      2,
    ),
  );
  console.log(`${entries.length} approved maths misconceptions (${derivable} derivable, ${entries.length - derivable} conceptual) → ${stampedName(FAMILY, stamp.sourceHash, 'json')}`);
  deliver(path, FAMILY);
  return path;
}

async function main(): Promise<void> {
  await exportMathsMisconceptions(prisma);
  await prisma.$disconnect();
}

// Run only when invoked directly, so importing the function does not re-export.
if (process.argv[1]?.endsWith('export-maths-misconceptions.ts')) void main();
