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
 * OUTSIDE `/crew` DELIBERATELY. The crew layout gates on a child cookie, so a harness placed under
 * it cannot be opened without a child session — which is why the NVR gate-1 harness has been
 * unreachable as well as unbuildable. Scaffolding that needs a login to look at is scaffolding
 * nobody looks at. Gated on ENVIRONMENT instead: 404 in production, and it imports the crew
 * stylesheet directly so what renders here is what the child sees.
 */
import { notFound } from 'next/navigation';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '@cluecrew/db';
import { ComprehensionHarness } from './harness';
import '../../crew/crew.css';

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
  if (process.env.APP_ENV === 'production') notFound();

  // A cited-window item, a whole-passage item, and the R208 reference item: ENG-013-TI-05 is
  // TWO-SPAN (lines 18-26 and 43-49) plus a wrong-scope distractor, so it exercises the tap
  // navigation and the drawer together — the composition Annie reads at 375px before PR-06 returns.
  const items = await prisma.item.findMany({
    where: { id: { in: ['ENG-013-TI-05', 'ENG-001-WIW-12', 'ENG-001-WIW-22'] } },
    include: { options: { orderBy: { id: 'asc' } } },
  });

  const cases = items.map((item) => {
    const stem = (item.stem ?? {}) as Record<string, unknown>;
    const lineRefs = Array.isArray(item.lineRefs) ? (item.lineRefs as unknown[]).map(Number) : [];
    return {
      id: item.id,
      note: lineRefs.length
        // R174 moved the highlight onto the tap. This description said "Highlighted on load" for
        // three hours afterwards — a staff-facing sentence describing behaviour that had changed
        // underneath it, in the harness a reviewer would use to check that very behaviour.
        ? `Cited window: lines ${lineRefs.join(', ')}. "go to lines" scrolls to it AND marks it; nothing is marked on arrival.`
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
