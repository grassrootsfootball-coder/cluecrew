'use client';

/** In-world error beat (Addendum A §1.2): the world never breaks. */
import { beatLine } from '@/lib/voice';

export default function CrewError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="crew-stage crew-shimmer" role="status">
      <span className="glass" aria-hidden>
        🔍
      </span>
      <p style={{ fontSize: '1.2rem' }}>{beatLine('trouble')}</p>
      <button className="crew-tap primary" onClick={reset}>
        Pick the trail back up
      </button>
    </main>
  );
}
