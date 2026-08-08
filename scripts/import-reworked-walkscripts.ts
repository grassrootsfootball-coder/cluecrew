/**
 * Import the two reworked walk scripts that cleared English's last DRAFT blockers.
 * `pnpm --filter @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/import-reworked-walkscripts.ts`
 *
 * ENG-001-WIW-10 — the 23-word sentence is gone; WS-REDRAFT-4 rebuilt the script as four sentences
 * and declared 'contemptuous' as a QUOTATION (R4) rather than rewording the passage's own word.
 * ENG-002-pp-21 — reworked to four sentences; quotes declared for the two passage spans.
 *
 * Quotes are written to `stem.quotes` because that is where the gate reads them
 * (`item-content-gate.ts:60`), while the authoring contract puts them on `explanation.quotes` —
 * a mismatch reported alongside this import rather than papered over.
 */
import { readFileSync } from 'node:fs';
import { prisma } from '../packages/db/src/index';

const SOURCES: Array<[string, string]> = [
  ['ENG-001-WIW-10', '/Users/davidb/Downloads/ENG001windinwillows (2).json'],
  ['ENG-002-pp-21', '/Users/davidb/Downloads/ENG002prideprejudice (1).json'],
];

async function main(): Promise<void> {
  for (const [itemId, path] of SOURCES) {
    const batch = JSON.parse(readFileSync(path, 'utf8')) as { items: Array<Record<string, any>> };
    const src = batch.items.find((i) => i.itemId === itemId);
    if (!src) { console.log(`MISSING ${itemId} in ${path}`); continue; }
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) { console.log(`MISSING ${itemId} in DB`); continue; }

    const ex = { ...((item.explanation ?? {}) as Record<string, unknown>) };
    ex.walkScript = src.explanation.walkScript;
    if (src.explanation.hintCore) ex.hintCore = src.explanation.hintCore;

    // Surface the declared spans where the gate looks for them.
    const stem = { ...((item.stem ?? {}) as Record<string, unknown>) };
    const declared = (src.explanation.quotes ?? []) as Array<{ text: string }>;
    if (declared.length) {
      const existing = Array.isArray(stem.quotes) ? (stem.quotes as Array<unknown>) : [];
      const texts = new Set(existing.map((q: any) => (typeof q === 'string' ? q : q?.text)));
      stem.quotes = [...existing, ...declared.filter((q) => !texts.has(q.text))];
    }

    await prisma.item.update({ where: { id: itemId }, data: { explanation: ex as never, stem: stem as never } });
    const sents = String(ex.walkScript).split(/(?<=[.!?])\s+/).filter(Boolean);
    console.log(`${itemId}: walkScript ${sents.length} sentences, longest ${Math.max(...sents.map((s) => s.trim().split(/\s+/).length))} words; ${declared.length} quote(s) declared`);
  }
  await prisma.$disconnect();
}

void main();
