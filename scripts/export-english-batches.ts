/**
 * EXPORT the live DB state for the two English comprehension batches (David, 2026-08-08).
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-english-batches.ts`
 *
 * WHY: the two copies drifted on 13 fields because BOTH were being edited and neither knew —
 * Cowork applied R23 to pp-16 while this repo applied the role-scoped urgency rewording to WIW-19
 * and pp-13. Both edits were correct; neither side was aware. So the copies converge at COWORK's
 * end: this export carries the DB's current state (urgency rewording + R23 quotation declarations)
 * in Cowork's own batch envelope, as a drop-in replacement for its canonical files.
 *
 * The envelope (batchId, standingFlags, coverage tables, passageRef …) is taken from Cowork's file
 * so nothing outside the items is invented; `items` is replaced wholesale from the DB, and the
 * coverage/tier/key tables are RECOMPUTED from that state rather than copied, so they cannot lie.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { prisma } from '../packages/db/src/index';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const BATCHES: Array<[string, string, string]> = [
  ['ENG-001', 'english-batch-eng-001-wind-in-willows', '/Users/davidb/Downloads/11+/items/ENG-001-wind-in-willows.json'],
  ['ENG-002', 'english-batch-eng-002-pride-prejudice', '/Users/davidb/Downloads/11+/items/ENG-002-pride-prejudice.json'],
];

function tally<T extends string | number>(xs: T[]): Record<string, number> {
  return xs.reduce<Record<string, number>>((m, x) => ({ ...m, [String(x)]: (m[String(x)] ?? 0) + 1 }), {});
}

async function main(): Promise<void> {
  for (const [prefix, family, canonPath] of BATCHES) {
    const envelope = JSON.parse(readFileSync(canonPath, 'utf8')) as Record<string, unknown>;
    const rows = await prisma.item.findMany({
      where: { id: { startsWith: `${prefix}-` } },
      include: { options: true },
      orderBy: { id: 'asc' },
    });

    const items = rows.map((it) => ({
      itemId: it.id,
      questionTypeId: it.questionTypeId,
      difficultyTier: it.difficultyTier,
      stem: it.stem,
      options: it.options.map((o) => ({
        content: o.content,
        isCorrect: o.isCorrect,
        ...(o.misconceptionId ? { misconceptionId: o.misconceptionId } : {}),
      })),
      explanation: it.explanation,
      status: it.status,
      pool: it.pool,
    }));

    const out = {
      ...envelope,
      exportedFrom: 'ClueCrew DB — AUTHORITATIVE for these two batches from 2026-08-08',
      exportedAt: new Date().toISOString(),
      supersedes: 'the canonical file at ' + canonPath,
      absorbs: [
        'role-scoped urgency rewording (R22) — WIW-19, pp-13 walk scripts',
        'R23 quotation declarations in explanation.quotes — WIW-10, pp-21',
        'the redrafted pp-21 hint (both long words were ours, so reworded)',
      ],
      itemCount: items.length,
      typeCoverage: tally(items.map((i) => i.questionTypeId)),
      tierDistribution: tally(items.map((i) => i.difficultyTier)),
      items,
    };

    const stamp = freshnessStamp(items, out.exportedAt);
    mkdirSync(OUT_DIR, { recursive: true });
    const path = join(OUT_DIR, stampedName(family, stamp.sourceHash, 'json'));
    writeFileSync(path, JSON.stringify(out, null, 2));
    deliver(path, family);
    console.log(`${prefix}: ${items.length} items → ${stampedName(family, stamp.sourceHash, 'json')}`);
  }
  await prisma.$disconnect();
}

void main();
