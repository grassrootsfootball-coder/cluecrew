import { GoalBeacon } from '@/components/founding/analytics';

/**
 * Post-signup landing (DEMAND-TEST-PACK §3/§4). The waitlist_signup goal
 * fires here — a signup is the §4 conversion; the double opt-in that follows
 * proves consent, not demand.
 */
export default function WaitlistThanksPage() {
  return (
    <main className="cc-container">
      <GoalBeacon goal="waitlist_signup" />
      <h1>One more tap.</h1>
      <p style={{ maxWidth: '38rem' }}>
        We&apos;ve sent you a confirmation email. Open it and tap the link to take your place on
        the Founding Crew waitlist — until then, we won&apos;t email you again.
      </p>
      <p className="cc-muted">
        Nothing arrived? Check spam, or sign up again for a fresh link.{' '}
        <a href="/founding">Back to the page</a>.
      </p>
    </main>
  );
}
