import { GoalBeacon } from '@/components/founding/analytics';

/** Founding-rate reserve landing (V3 §1 Step 2) — the founding_reserved goal fires here. */
export default function FoundingReservedPage() {
  return (
    <main className="cc-container">
      <GoalBeacon goal="founding_reserved" />
      <h1>Founding rate noted.</h1>
      <p style={{ maxWidth: '38rem' }}>
        One tap left: we&apos;ve sent a confirmation email — open it so we can reach you when Full
        Crew checkout opens. Nothing has been charged and nothing is owed; the rate is simply
        yours to take or leave when the doors open.
      </p>
      <p className="cc-muted">
        Meanwhile, Crew is free to start today. <a href="/signup">Start free</a> ·{' '}
        <a href="/founding">Back to the page</a>
      </p>
    </main>
  );
}
