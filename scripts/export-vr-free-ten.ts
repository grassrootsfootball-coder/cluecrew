/**
 * The free-ten VR item bank, for authoring — `pnpm export:vr-free-ten`.
 *
 * The CMS is the only copy and Cowork cannot reach it, so an item they are
 * asked to fix is an item they cannot see. Everything needed to work without
 * opening the database, and an empty `rewrittenStem` per item to send back.
 *
 * The source is built by the shared `buildFreeTenSource` (so the freshness
 * checker hashes the same thing), the content hash goes in the filename, and
 * delivery supersedes any older copy of this family.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { buildFreeTenSource } from './lib/vr-free-ten-source';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'vr-free-ten';

async function main(): Promise<void> {
  const out = await buildFreeTenSource(prisma);
  const total = out.reduce((sum, group) => sum + group.itemCount, 0);
  const failing = out.reduce((sum, group) => sum + group.failingCount, 0);
  const stamp = freshnessStamp(out, new Date().toISOString());

  mkdirSync(OUT_DIR, { recursive: true });
  const filename = stampedName(FAMILY, stamp.sourceHash, 'json');
  const path = join(OUT_DIR, filename);
  writeFileSync(
    path,
    JSON.stringify(
      {
        kind: 'vr-free-ten-item-bank',
        note: 'The ten free-tier VR Cases and their full item pools. Fill in rewrittenStem where gateFaults is non-empty; leave everything else as it is. Nothing here is LIVE.',
        // Freshness stamp: `pnpm check:export-freshness <file>` compares this
        // to the current source (David, 2026-08-02). The hash is in the
        // filename too, so copies self-identify.
        ...stamp,
        interimFloor: 15,
        phase4Gate: 25,
        caseCount: out.length,
        itemCount: total,
        failingCount: failing,
        cases: out,
      },
      null,
      2,
    ),
  );

  console.log(`${out.length} case(s) · ${total} item(s) · ${failing} failing a gate → ${filename}`);
  for (const group of out) {
    const floor = group.itemCount >= 15 ? 'meets 15' : 'BELOW 15';
    console.log(`  ${group.caseId.padEnd(11)} ${group.questionTypeId.padEnd(26)} ${String(group.itemCount).padStart(3)} items · ${String(group.failingCount).padStart(2)} failing · ${floor}`);
  }
  deliver(path, FAMILY);
  await prisma.$disconnect();
}

void main();
