/**
 * WALK PANEL HARNESS — the surface Annie has never seen rendered.
 *
 * The panel opens from the miss path in the real loop, which needs a session, a miss and a child.
 * This renders the same component against an approved item so the SHAPE can be read at 375px
 * without playing a session to reach it. **No review furniture inside the panel frame** — the
 * heading and note sit outside it, as `check:no-review-furniture` requires.
 */
import '../../crew/crew.css'; // WITHOUT THIS the panel renders unstyled and the render LIES.
import { WALK_APPROVED_ITEM_IDS } from '@cluecrew/core';
import { WalkPanelHarness } from './harness';

export const dynamic = 'force-dynamic';

export default function WalkDebugPage() {
  const ids = [...WALK_APPROVED_ITEM_IDS];
  return (
    <main style={{ padding: '1rem', maxWidth: 640 }}>
      {/*
        **HARNESS FURNITURE, AND IT MUST NOT SHIP** (Annie, 2026-08-19, per the N badge — R310).
        The title and the approved-count line exist so a developer can find their way around this
        page. They are staff furniture, they are OUTSIDE the panel frame, and this route is under
        /debug — which `check:no-review-furniture` treats as staff and the child closure never
        reaches. **Nothing on this page is on any path a child can open**, and if that ever changes
        the check fails on the closure rather than on anyone remembering this comment.

        It is also why the harness alone is not the surface: in the real loop the panel opens BELOW
        the item card, which stays on screen with its stem, options and passage. A render of the
        panel by itself shows a child something no child ever sees.
      */}
      <h1>Walk panel — harness</h1>
      <p className="cc-muted">
        The worked solution, revealed a sentence at a time. Narrow to 375px. Tap for the next bit;
        the last tap shows the whole script exactly as written.
      </p>
      <p className="cc-muted">Approved to serve: {ids.length} script(s).</p>
      {ids.slice(0, 1).map((id) => (
        <section key={id} style={{ marginTop: '1.5rem' }}>
          <WalkPanelHarness itemId={id} />
        </section>
      ))}
    </main>
  );
}
