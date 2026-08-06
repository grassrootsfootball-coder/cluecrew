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

// Annie's split retag map (2026-08-06): where batch-01 distractors move now that
// #71/#74/#89 are narrowed and #98-101 exist. Batches tag against this from the start.
const SPLIT_RETAG = {
  note: 'Splits of #71/#74/#89 into #98-101 (annie). Use these ids when a distractor matches the narrowed definition.',
  moves: {
    'CALC-01 D': '#98 digit-dropped-in-column-work',
    'CALC-02 D': '#99 rounded-without-compensating',
    'CALC-08 D': '#99 rounded-without-compensating',
    'GEOM-06 A': '#100 steps-out-of-order',
    'GEOM-06 D': '#100 steps-out-of-order',
    'FDP-01 D': '#101 unlike-denominators-cannot-be-compared',
  },
  unchangedUnderNarrowedDefinition: {
    'CALC-04 B, CALC-07 B': '#71 quantity left out',
    'GEOM-02 A, GEOM-02 C, GEOM-06 C': '#89 wrong angle total',
    'FDP-01 C': '#74 same numerator means equal',
  },
  libraryWideReRead: 'Each narrowed entry describes less than it did; anything ELSE in the library carrying #71/#89/#74 must be re-read against the new wording before tagging.',
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
