/**
 * The PROPOSED queue, in full (annie, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-proposed-misconceptions.ts`
 *
 * Her rule: WHEN A VALUE CARRIES A SIGNATURE, SEND THE VALUE, NOT AN ACCOUNT OF IT. So every entry
 * here carries its `description` and `childHint` VERBATIM FROM THE FIELD — not a summary, not a
 * truncation, not a quoted fragment. A ratification decision is made against these strings.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'misconceptions-proposed-queue';

/**
 * The queue's source, shared with `check-export-freshness` so staleness is DETECTABLE.
 *
 * This is a STATUS snapshot: membership is decided by `status: 'PROPOSED'`, so a single
 * ratification invalidates the whole file while leaving it looking like a valid queue. That is
 * precisely what happened to the fourteen-entry export — one entry was ratified between export
 * and reading. Without a builder here the checker skipped the file as an unknown kind, so the
 * stamp it carried could never be compared against anything.
 */
export async function buildProposedQueueSource(prisma: typeof defaultPrisma): Promise<unknown> {
  const rows = await prisma.misconception.findMany({
    where: { status: 'PROPOSED' },
    orderBy: [{ district: 'asc' }, { id: 'asc' }],
  });
  return rows.map((m) => ({ id: m.id, district: m.district, description: m.description, childHint: String(m.childHint ?? '') }));
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const rows = await prisma.misconception.findMany({
    where: { status: 'PROPOSED' },
    orderBy: [{ district: 'asc' }, { id: 'asc' }],
  });
  const entries = rows.map((m) => {
    const hint = String(m.childHint ?? '');
    const fails = hint
      ? checkChildFacingText({ role: 'hint', label: m.id, text: hint, testedTokens: m.testedTokens ?? [] }).filter(isBlocking)
      : [];
    return {
      id: m.id,
      district: m.district,
      category: m.category,
      description: m.description,   // VERBATIM
      childHint: hint,              // VERBATIM
      testedTokens: m.testedTokens ?? [],
      proposedBy: m.proposedBy,
      gate: fails.length ? fails.map((f) => f.detail) : 'clean',
    };
  });
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(await buildProposedQueueSource(prisma), generatedAt, 'status', 'every misconception whose status is PROPOSED');
  const out = {
    kind: 'misconceptions-proposed-queue',
    ...stamp,
    staleness:
      'STATUS SNAPSHOT. Ratifying or rejecting any entry invalidates this file while leaving it looking valid. ' +
      'Check with `pnpm check:export-freshness` before working from it.',
    note: 'Every description and childHint is the field value verbatim. Ratify, reword as a transform against the quoted text, or reject.',
    exportedAt: generatedAt,
    count: entries.length,
    byDistrict: entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e.district]: (m[e.district] ?? 0) + 1 }), {}),
    entries,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 2));
  deliver(path, FAMILY);
  console.log(`${entries.length} PROPOSED · ${JSON.stringify(out.byDistrict)} · ${entries.filter((e) => e.gate !== 'clean').length} failing the gate`);
  await prisma.$disconnect();
}

// Only when run directly: importing this for its source builder must not run the export
// (and must not `$disconnect()` the client the importer is still using).
if (process.argv[1]?.endsWith('export-proposed-misconceptions.ts')) void main();
