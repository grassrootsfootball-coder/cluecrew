'use client';

/**
 * Plausible goal beacons (DEMAND-TEST-PACK §4). Plausible is the ONLY
 * analytics on the demand-test page — cookieless, EU-hosted, no marketing
 * pixels — and it loads only when NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.
 * Goals: waitlist_signup (fired once on the thanks page — a signup, not a
 * confirmation, is the §4 conversion) and pricing_viewed (fired once when
 * the pricing section actually enters the viewport).
 */
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    plausible?: (goal: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function GoalBeacon({ goal }: { goal: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    window.plausible?.(goal);
  }, [goal]);
  return null;
}

export function PricingViewedBeacon({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fired = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (fired.current) return;
      if (entries.some((entry) => entry.isIntersecting)) {
        fired.current = true;
        window.plausible?.('pricing_viewed');
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{children}</div>;
}
