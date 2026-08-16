/**
 * Comprehension surface harness (English district).
 *
 * Renders the engine against REAL passages and REAL items from the store, so the three rulings of
 * 2026-08-16 can be seen rather than asserted:
 *   1. the passage stays visible while she answers and never collapses;
 *   2. the cited window is highlighted from the start AND has a "go to lines" control;
 *   3. the window is highlighted, never isolated — the whole extract stays readable.
 *
 * Three cases are shown deliberately: a narrow citation, a whole-passage item (`lineRefs: []`, which
 * DECLARES the whole text as the window), and an item whose passage cannot be loaded, which must
 * refuse rather than render a question a child cannot answer.
 *
 * Dev and staging only: engineering scaffolding, not authored content, and no child route links here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '@cluecrew/db';
import { ComprehensionHarness } from './harness';

export const dynamic = 'force-dynamic';

function loadPassage(ref: string, lineRefs: number[]) {
  try {
    const raw = readFileSync(resolve(process.cwd(), '../../content/passages', `${ref}.json`), 'utf8');
    const p = JSON.parse(raw) as { sceneTitle?: string; numberedLines?: Array<{ n?: number | null; text?: string }> };
    return {
      id: ref,
      title: p.sceneTitle ?? null,
      lines: (p.numberedLines ?? []).map((l) => ({ n: l.n ?? null, text: l.text ?? '' })),
      citedLines: lineRefs,
    };
  } catch { return undefined; }
}

export default async function ComprehensionDebugPage() {
  // A cited-window item, and a whole-passage item, taken from the bank as they stand.
  const items = await prisma.item.findMany({
    where: { id: { in: ['ENG-001-WIW-12', 'ENG-001-WIW-22'] } },
    include: { options: { orderBy: { id: 'asc' } } },
  });

  const cases = items.map((item) => {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const lineRefs = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number) : [];
    return {
      id: item.id,
      note: lineRefs.length
        ? `Cited window: lines ${lineRefs.join(', ')}. Highlighted on load; "go to lines" scrolls to it.`
        : 'lineRefs [] — DECLARES the whole passage as the window. No line singled out.',
      stem,
      options: item.options.map((o) => ({ id: o.id, content: o.content })),
      passage: typeof stem.passageRef === 'string' ? loadPassage(stem.passageRef, lineRefs) : undefined,
    };
  });

  // The refusal case: a real item pointed at a passage that does not exist.
  const first = cases[0];
  if (first) {
    cases.push({
      id: `${first.id} (passage deliberately unavailable)`,
      note: 'Must REFUSE, not render a blank space. Three silent fallbacks are what this district found.',
      stem: { ...first.stem, passageRef: 'does-not-exist' },
      options: first.options,
      passage: undefined,
    });
  }

  return (
    <main style={{ padding: '1rem', maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.2rem' }}>Comprehension surface — harness</h1>
      <p className="cc-muted" style={{ fontSize: '0.92rem' }}>
        One scrolling column: passage in its own scroll region, question pinned beneath. Not
        side-by-side — at 375px there is no side, and a layout that only works on a desk is not the
        exam room. Narrow the window to check it.
      </p>
      <ComprehensionHarness cases={cases} />
    </main>
  );
}
