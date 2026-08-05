/**
 * IMPORT NVR PROPOSED MISCONCEPTIONS — `pnpm import:nvr-proposed`.
 *
 * Cowork's corpus confirm/refute against the tag-vocabulary gap returned three
 * ratified additions (docs/nvr-proposed-misconceptions.json). They land PROPOSED
 * with provenance and CANNOT SERVE until a named reviewer approves them in the
 * CMS — corpus findings are evidence, not instructions (Addendum E §2). Existing
 * ids are left alone; a re-run imports only what is new.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '../packages/db/src/index';

const FILE = resolve(import.meta.dirname, '../docs/nvr-proposed-misconceptions.json');
const PROVENANCE = 'corpus:nvr-tag-vocabulary-gap-2026-08-05';

interface Proposed { id: string; description: string; childHint: string; distractorClass?: string }

async function main(): Promise<void> {
  const doc = JSON.parse(readFileSync(FILE, 'utf8')) as { proposed?: Proposed[]; source?: string };
  if (!Array.isArray(doc.proposed)) throw new Error('no `proposed` array in the JSON');

  const imported: string[] = [];
  const skipped: string[] = [];
  for (const entry of doc.proposed) {
    const existing = await prisma.misconception.findUnique({ where: { id: entry.id }, select: { status: true } });
    if (existing) {
      skipped.push(`${entry.id} (already ${existing.status})`);
      continue;
    }
    await prisma.misconception.create({
      data: {
        id: entry.id,
        district: 'NVR',
        status: 'PROPOSED',
        description: entry.description,
        childHint: entry.childHint,
        proposedBy: PROVENANCE,
        sourcePattern: `corpus:nvr-proposed-misconceptions.json#${entry.id}`,
      },
    });
    imported.push(entry.id);
  }

  console.log(`NVR proposed import — ${imported.length} new, ${skipped.length} left alone.`);
  for (const id of imported) console.log(`  + PROPOSED ${id}`);
  for (const s of skipped) console.log(`  · ${s}`);
  console.log('\nThese cannot serve until a reviewer approves them in the CMS (Addendum E §2).');
  await prisma.$disconnect();
}

void main();
