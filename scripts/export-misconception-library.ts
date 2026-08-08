/**
 * THE READ PATH for library text (annie's ruling, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-misconception-library.ts`
 *
 * Three copy mismatches in two turns came from one cause: Cowork had no way to READ current library
 * text, so it worked from whatever it last downloaded — or from a fragment quoted in a report. The
 * DB holds library text; this is how Cowork sees it without keeping a copy to drift from.
 *
 * Every entry carries its CURRENT `childHint` verbatim and a gate verdict, so a proposal can be
 * written as a transform against quoted text and checked before it is sent. Hash-named and delivered
 * like every other export, so a re-read is a re-run rather than a remembered file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { checkChildFacingText, isBlocking } from '../packages/core/src/index';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { prisma as defaultPrisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'misconception-library-current';

/**
 * The library's source, shared with `check-export-freshness`.
 *
 * MIXED, in annie's sense: the childHint text is CONTENT (it ages visibly — a reader comparing it
 * against the live hint sees the difference), but `status` and the gate verdict are STATUS, and
 * they age invisibly. The status half is why this needs a builder: a ratification changes what the
 * file says about an entry without changing the entry's text at all.
 */
export async function buildMisconceptionLibrarySource(prisma: typeof defaultPrisma): Promise<unknown> {
  const rows = await prisma.misconception.findMany({ orderBy: [{ district: 'asc' }, { id: 'asc' }] });
  return rows.map((m) => ({ id: m.id, district: m.district, status: m.status, description: m.description, childHint: String(m.childHint ?? '') }));
}

async function main(): Promise<void> {
  const prisma = defaultPrisma;
  const rows = await prisma.misconception.findMany({ orderBy: [{ district: 'asc' }, { id: 'asc' }] });
  const entries = rows.map((m) => {
    const hint = String(m.childHint ?? '');
    const failures = hint
      ? checkChildFacingText({ role: 'hint', label: m.id, text: hint, testedTokens: m.testedTokens ?? [] }).filter(isBlocking)
      : [];
    return {
      id: m.id,
      district: m.district,
      status: m.status,
      description: m.description,
      childHint: hint,               // VERBATIM — quote this when proposing a transform
      gate: failures.length ? failures.map((f) => f.detail) : 'clean',
    };
  });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(
    await buildMisconceptionLibrarySource(prisma),
    generatedAt,
    'mixed',
    'every misconception, with its verbatim childHint (content) and its status and gate verdict (status)',
  );
  const out = {
    kind: 'misconception-library-current',
    ...stamp,
    staleness:
      'MIXED SNAPSHOT. The hint text ages visibly; the status and gate verdict do not. A ratification ' +
      'changes what this file says about an entry without changing the entry text. Check with ' +
      '`pnpm check:export-freshness` before working from it.',
    note: 'The DB holds library text. Propose changes as a TRANSFORM against the childHint quoted here, never as a rewritten copy — a rewrite is how "or sound right" was lost. Do not keep this file as a working copy; re-run the export instead.',
    exportedAt: generatedAt,
    counts: {
      total: entries.length,
      byStatus: entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e.status]: (m[e.status] ?? 0) + 1 }), {}),
      failingGate: entries.filter((e) => e.gate !== 'clean').length,
    },
    entries,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 2));
  deliver(path, FAMILY);
  console.log(`${entries.length} entries · ${out.counts.failingGate} failing the gate · ${JSON.stringify(out.counts.byStatus)}`);
  await prisma.$disconnect();
}

// Only when run directly: importing this for its source builder must not run the export
// (and must not `$disconnect()` the client the importer is still using).
if (process.argv[1]?.endsWith('export-misconception-library.ts')) void main();
