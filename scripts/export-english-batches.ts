/**
 * EXPORT the CONVERGED state for the two English comprehension batches (David, 2026-08-08).
 *
 * CORRECTED 2026-08-08: an earlier run of this script exported the DB state WHOLESALE. That was
 * wrong and would have destroyed work. The drift is not one-directional — Cowork holds ELEVEN
 * fields of newer authoring plus R23 quotation declarations on five items that the DB never had
 * (`unfastened a rope`, `exciting stories`, `pop!`, `ten thousand a year`, …). Only TWO fields are
 * gate-forced from this side. So the export is a MERGE, built the way the ownership rule says:
 * start from COWORK's canonical file, which is authoritative for authored item content, and apply
 * only the changes a GATE forced here.
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

    // The ONLY fields a gate forced on this side. Everything else stays as Cowork authored it.
    const GATE_FORCED: Record<string, string[]> = {
      'ENG-001-WIW-19': ['walkScript'], // R22 urgency: "quickly" -> "at speed"
      'ENG-002-pp-13': ['walkScript'],  // R22 urgency: "quick view" -> "hasty view"
      'ENG-002-pp-21': ['hintCore'],    // R23: both long words were ours, so reworded
    };
    const byId = new Map(rows.map((r) => [r.id, r]));
    const applied: string[] = [];
    const items = (envelope.items as Array<Record<string, any>>).map((src) => {
      const fields = GATE_FORCED[src.itemId];
      if (!fields) return src;
      const db = byId.get(src.itemId);
      if (!db) return src;
      const dbEx = (db.explanation ?? {}) as Record<string, unknown>;
      const ex = { ...(src.explanation ?? {}) };
      for (const f of fields) {
        if (typeof dbEx[f] === 'string' && dbEx[f] !== ex[f]) { ex[f] = dbEx[f]; applied.push(`${src.itemId}.${f}`); }
      }
      return { ...src, explanation: ex };
    });

    const out = {
      ...envelope,
      exportedFrom: "Cowork's canonical file, plus ONLY the gate-forced changes from the ClueCrew DB",
      exportedAt: new Date().toISOString(),
      basedOn: canonPath,
      gateForcedChangesApplied: applied,
      preserved: "all of Cowork's newer authoring, including every R23 quotation declaration",
      note: 'Supersedes the wholesale DB export of the same date, which would have destroyed Cowork R23 work.',
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
