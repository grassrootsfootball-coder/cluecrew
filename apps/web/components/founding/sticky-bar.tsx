'use client';

/**
 * The follow-the-scroll bar (DEMAND-TEST-PACK-V2 §1, sticky bar): appears
 * once 60% of the hero has scrolled past, and is a plain link to the
 * waitlist box — not a popup, not an overlay, dismissable by ignoring it.
 * The Join link carries the 'sticky' capture source via the anchor query.
 */
import { useEffect, useState } from 'react';

export function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.mk-hero');
    if (!hero) return;
    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      setVisible(rect.bottom < rect.height * 0.4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fd-sticky" data-testid="sticky-bar">
      <img src="/cluecrew-logo.svg" alt="ClueCrew" width={120} height={30} />
      <span className="fd-sticky-label">Crew is free — no card, no clock</span>
      <a className="cc-button fd-sticky-join" href="/signup">
        Start free
      </a>
    </div>
  );
}
