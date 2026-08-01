/**
 * The prelaunch holding page: deliberately plain. No claims, no capture,
 * no countdown — the public face until 5A flips DNS-day scope on.
 */
export default function HoldingPage() {
  return (
    <main className="cc-container" style={{ maxWidth: '34rem', paddingTop: '4rem' }}>
      <img src="/cluecrew-logo.svg" alt="ClueCrew" width={220} height={56} />
      <p style={{ fontSize: '1.1rem' }}>
        We&apos;re building something for families facing the 11+. It isn&apos;t ready to show
        yet — when it is, it will be here.
      </p>
      <p className="cc-muted">© ClueCrew (trademark application pending)</p>
    </main>
  );
}
