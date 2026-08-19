/**
 * THE MODE DISPATCHER — the first thing in the product that renders a mode's content.
 *
 * **NOTHING DISPATCHED ON A MODE KIND BEFORE THIS** (R232). The bookkeeping was complete for
 * months — `MODES`, `isMode`, a session route recording open/complete/decline — while the way-in
 * button called `open`, then `complete`, then reloaded. **The mode was opened and completed with
 * nothing shown**, which is exactly how it came to look built. Five kinds, twenty-five Cases, one
 * hundred `assetRef`s pointing at files that do not exist.
 *
 * **THE LOUD BRANCH IS THE POINT OF THIS FILE.** Annie called it the most important small thing in
 * the costing, and she is right: the fault was never that four kinds are unbuilt, it was that an
 * unbuilt kind was INDISTINGUISHABLE FROM A BUILT ONE at every layer — in the data, in the API, and
 * on the screen. `UnbuiltMode` renders a visible, named, testable statement that this kind has no
 * renderer. A child never meets it (the offer is not made for unbuilt kinds); a developer and a
 * reviewer meet it immediately.
 *
 * Walk is the only kind with a renderer. `watch`, `see` and `hear` stay DECLARED with their state
 * recorded — `watch` and `see` have no authored content anywhere, `hear` has a substitute route
 * through on-device speech — and `try` needs no renderer because practice IS the Daily Loop.
 */
'use client';

import { WalkPanel } from './walk-panel';

/** The kinds a Case may declare, from `content-schema.ts`. Kept as a literal union so a new kind
 *  in the schema fails the build here rather than falling through to a silent default. */
export type ModeKind = 'video' | 'faded-example' | 'visual' | 'audio' | 'practice';

export interface ModePanelProps {
  kind: ModeKind;
  /** The item the mode is opening on. Walk content lives on items, not on the Case. */
  itemId: string;
  childId: string;
  onDone: () => void;
}

/**
 * A kind with no renderer, said out loud rather than rendered as nothing. Never shown to a child:
 * the mode offer is suppressed for unbuilt kinds upstream. This is what a developer, a test, or a
 * reviewer sees if that suppression ever fails — which is the only way it becomes visible.
 */
function UnbuiltMode({ kind }: { kind: ModeKind }) {
  return (
    <div data-testid="mode-unbuilt" data-mode-kind={kind} role="status" className="crew-replay">
      <p style={{ margin: 0 }}>
        <strong>No renderer for mode kind &quot;{kind}&quot;.</strong> This kind is declared in the
        Case files and has nothing behind it. It must not be offered to a child.
      </p>
    </div>
  );
}

export function ModePanel({ kind, itemId, childId, onDone }: ModePanelProps) {
  switch (kind) {
    case 'faded-example':
      return <WalkPanel itemId={itemId} childId={childId} onDone={onDone} />;
    case 'video':
    case 'visual':
    case 'audio':
    case 'practice':
      return <UnbuiltMode kind={kind} />;
    default: {
      // Exhaustiveness: a kind added to the schema and not to this switch fails to compile.
      const never: never = kind;
      return <UnbuiltMode kind={never} />;
    }
  }
}
