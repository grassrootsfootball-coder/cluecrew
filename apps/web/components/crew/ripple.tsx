'use client';

/**
 * The 100ms rule (Addendum A §2.1): every tap gets a visible response within
 * 100ms. Mounted once in the crew layout, this listens at the document level
 * and drops a ripple at the finger for any tappable surface — so no component
 * has to remember to do it, and nothing can ever feel dead.
 *
 * Purely decorative and never blocking: the ripple is pointer-events:none and
 * removes itself. Reduced motion hides it (§2.5) — the press-down scale and
 * colour change still fire, so the tap still reads.
 */
import { useEffect } from 'react';

const TARGETS = '.crew-tap, .crew-tile, .crew-card, .crew-rail .letter';

export function TapRipple() {
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = (event.target as HTMLElement | null)?.closest?.(TARGETS) as HTMLElement | null;
      if (!target) return;

      const bounds = target.getBoundingClientRect();
      const size = Math.max(bounds.width, bounds.height);
      const ripple = document.createElement('span');
      ripple.className = 'crew-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - bounds.left - size / 2}px`;
      ripple.style.top = `${event.clientY - bounds.top - size / 2}px`;
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 460);
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return null;
}
