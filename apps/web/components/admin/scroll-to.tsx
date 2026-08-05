'use client';

/**
 * Returns the reader to where they were working after a server action.
 *
 * A `#hash` on a redirect does NOT survive a Next server action — the RSC
 * navigation drops it — so the queue anchor alone silently did nothing and
 * the reviewer still landed at the top of the page. The action signals its
 * outcome in the query string instead, and this scrolls to the anchor once
 * on arrival.
 *
 * `block: 'start'` with the browser's default instant behaviour: no smooth
 * scroll, so this is unaffected by reduced-motion preferences and cannot
 * animate under someone reading.
 */
import { useEffect } from 'react';

export function ScrollTo({ targetId, when }: { targetId: string; when: boolean }) {
  useEffect(() => {
    if (!when) return;
    document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
  }, [targetId, when]);
  return null;
}
