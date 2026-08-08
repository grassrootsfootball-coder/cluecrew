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
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'misconceptions-proposed-queue';

async function main(): Promise<void> {
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
  const out = {
    kind: 'misconceptions-proposed-queue',
    note: 'Every description and childHint is the field value verbatim. Ratify, reword as a transform against the quoted text, or reject.',
    exportedAt: new Date().toISOString(),
    count: entries.length,
    byDistrict: entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e.district]: (m[e.district] ?? 0) + 1 }), {}),
    entries,
  };
  const stamp = freshnessStamp(entries, out.exportedAt);
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(path, JSON.stringify(out, null, 2));
  deliver(path, FAMILY);
  console.log(`${entries.length} PROPOSED · ${JSON.stringify(out.byDistrict)} · ${entries.filter((e) => e.gate !== 'clean').length} failing the gate`);
  await prisma.$disconnect();
}

void main();
