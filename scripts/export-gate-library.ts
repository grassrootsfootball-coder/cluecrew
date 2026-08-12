/**
 * THE PLATFORM LIBRARY, IN THE SHAPE THE ENGLISH GATES READ — `pnpm export:gate-library`
 *
 * Cowork's cluster gates validate every distractor tag against a misconception library on disk.
 * Four snapshots were in play at once — the platform's, Cowork's, an 81-entry file on David's
 * disk, and a 44-entry English staging file — and the 81-entry one was silently consulted for a
 * whole verification round. Its verdicts were real and its scope was a library predating the
 * ruling under test.
 *
 * This is the one command that makes the disk copy a DERIVATIVE of the database rather than a
 * fourth opinion. It overwrites, deliberately: a second file beside the first is how the problem
 * started, so there is one destination and no stamped-name history.
 *
 * ENGLISH ONLY, because that is what the English gates check against and what a mismatch in
 * COUNT would otherwise disguise — a 270-row all-district export reads as "the library" while
 * telling a reviewer nothing about whether the 66 they ruled on are present.
 *
 * Statuses are carried through rather than filtered. The six entries approved on 2026-08-12 are
 * PROPOSED, and the clusters reference them: a filter to ACTIVE would drop exactly the entries
 * the current round exists to verify, and the gate would report them missing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { prisma } from '../packages/db/src/index';

const DEST = process.env.GATE_LIBRARY_PATH
  ?? '/Users/davidb/Downloads/11+/corpus/misconception-import.json';

async function main(): Promise<void> {
  const rows = await prisma.misconception.findMany({
    where: { district: 'ENGLISH' },
    orderBy: { id: 'asc' },
    select: { id: true, district: true, status: true, description: true, childHint: true, category: true },
  });
  const misconceptions = rows.map((r) => ({ ...r, category: r.category ?? null }));
  const body = { kind: 'misconception-import', source: 'cluecrew-platform-db', district: 'ENGLISH',
    exportedAt: new Date().toISOString(), count: misconceptions.length, misconceptions };
  const json = JSON.stringify(body, null, 2);

  mkdirSync(dirname(DEST), { recursive: true });
  writeFileSync(DEST, json);

  const byStatus = misconceptions.reduce<Record<string, number>>((m, e) => ({ ...m, [e.status]: (m[e.status] ?? 0) + 1 }), {});
  console.log(`wrote ${misconceptions.length} ENGLISH entries → ${DEST}`);
  console.log(`  by status: ${JSON.stringify(byStatus)}`);
  console.log(`  sha256: ${createHash('sha256').update(json).digest('hex').slice(0, 16)}`);
  await prisma.$disconnect();
}

void main();
