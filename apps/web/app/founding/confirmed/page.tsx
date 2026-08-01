/** Double opt-in complete (DEMAND-TEST-PACK §3). */
export default function WaitlistConfirmedPage() {
  return (
    <main className="cc-container">
      <h1>You&apos;re on the list.</h1>
      <p style={{ maxWidth: '38rem' }}>
        That&apos;s it — your place on the Founding Crew waitlist is confirmed. We&apos;ll email
        you about ClueCrew&apos;s launch and nothing else, and every email has an unsubscribe link.
      </p>
      <p className="cc-muted">
        <a href="/founding">Back to the page</a> · <a href="/founding/privacy">Privacy notice</a>
      </p>
    </main>
  );
}
