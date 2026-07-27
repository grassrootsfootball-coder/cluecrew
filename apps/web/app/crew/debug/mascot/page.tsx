'use client';

/** Gate #6: a debug panel exercising the full mascot state machine. Dev only. */
import { Mascot } from '@/components/crew/mascot';
import { MASCOT_STATES, debugSetMascotState } from '@/components/crew/mascot-controller';

export default function MascotDebugPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <main className="crew-stage">
        <p>Nothing here.</p>
      </main>
    );
  }
  return (
    <main className="crew-stage">
      <h1>Mascot state machine (debug)</h1>
      <Mascot size={160} />
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {MASCOT_STATES.map((state) => (
          <button key={state} className="crew-tap" onClick={() => debugSetMascotState(state)}>
            {state}
          </button>
        ))}
      </div>
    </main>
  );
}
