import { currentParent } from '@/lib/auth';
import { submitBursaryApplication } from '@/lib/actions/bursary';

/**
 * Crew Bursary (BUILD-PHASE-2 §6): mission-framed, access-framed, never
 * charity-framed. The product a bursary family receives is IDENTICAL — no
 * UI anywhere reads the bursary flag (CI greps for this).
 */
export default async function BursaryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const parent = await currentParent();
  const { state } = await searchParams;

  return (
    <main className="cc-container">
      <h1>The Crew Bursary</h1>
      <p>
        Our mission is an 11+ where preparation matters more than bank balance. So for families
        receiving free school meals or pupil premium, ClueCrew is free — the full two-year
        programme, the identical product, nothing cut down and nothing labelled.
      </p>
      <p className="cc-muted">
        Places grow with our community: every ten paid subscriptions unlock a new bursary place.
        When places are full, applications join a waitlist and we email the moment one opens —
        and while you wait, your family holds Crew, the free tier, automatically: real cases,
        the Word Vault and the weekly Boss Round from day one. Nobody waits with nothing.
      </p>

      {state === 'received' ? (
        <div className="cc-card" role="status">
          <p style={{ margin: 0 }}>
            Thank you — your application is in. We will email you the decision, usually within a
            week. Your document is stored encrypted and deleted within 30 days of the decision.
          </p>
        </div>
      ) : state === 'already-applied' ? (
        <div className="cc-card" role="status">
          <p style={{ margin: 0 }}>You already have an application with us — we will be in touch.</p>
        </div>
      ) : !parent ? (
        <div className="cc-card">
          <p style={{ marginTop: 0 }}>
            To apply, first <a href="/signup">create a free account</a> (two minutes, no card) —
            then come back to this page.
          </p>
        </div>
      ) : (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Apply</h2>
          {state === 'evidence-required' || state === 'evidence-invalid' ? (
            <p role="alert">
              Please attach one document as a PDF or photo (up to 5&nbsp;MB) — a short school letter
              or a benefit award screenshot both work.
            </p>
          ) : null}
          <form className="cc-form" action={submitBursaryApplication}>
            <label>
              Which applies to your family?
              <select name="confirmation" required defaultValue="">
                <option value="" disabled>
                  Choose one…
                </option>
                <option value="fsm">My child receives free school meals</option>
                <option value="pupil_premium">My child attracts pupil premium</option>
              </select>
            </label>
            <label>
              One supporting document (school letter or benefit screenshot, PDF/JPG/PNG, max 5 MB)
              <input name="evidence" type="file" required accept=".pdf,.jpg,.jpeg,.png,.heic" />
            </label>
            <p className="cc-muted">
              Your document is encrypted, seen only by the small review team, and deleted within 30
              days of the decision.
            </p>
            <button className="cc-button" type="submit">
              Send application
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
