'use client';

import { WalkPanel } from '@/components/crew/modes/walk-panel';

/** Client wrapper: the panel fetches its own content through the gated door. */
export function WalkPanelHarness({ itemId }: { itemId: string }) {
  return <WalkPanel itemId={itemId} childId="debug-harness" onDone={() => undefined} />;
}
