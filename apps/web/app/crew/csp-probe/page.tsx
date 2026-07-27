/**
 * Deliberately injects a third-party script tag so the e2e suite can prove the
 * /crew CSP blocks it (gate checklist #7). The script would set
 * window.__thirdPartyLoaded if it ever executed.
 */
export default function CspProbePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>CSP probe</h1>
      <p data-testid="probe-ready">This page tries to load a third-party script.</p>
      <script src="https://third-party.invalid/probe.js" async />
    </main>
  );
}
