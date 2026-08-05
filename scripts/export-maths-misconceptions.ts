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

async function main(): Promise<void> {
  const entries = await buildMathsMisconceptionsSource(prisma);
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
        misconceptions: entries,
      },
      null,
      2,
    ),
  );
  console.log(`${entries.length} approved maths misconceptions (${derivable} derivable, ${entries.length - derivable} conceptual) → ${path}`);
  deliver(path, FAMILY);
  await prisma.$disconnect();
}

void main();
