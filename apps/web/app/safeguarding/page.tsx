import { Plausible } from '@/components/plausible';

/** Our child-safety laws as public commitments (§6) — a trust asset. */
export default function SafeguardingPage() {
  return (
    <main className="cc-container">
      <Plausible />
      <h1>Safety and safeguarding — our commitments</h1>
      <p className="cc-muted">
        These are not policies we might follow. They are rules our software enforces, written here
        so you can hold us to them.
      </p>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>No social anything</h2>
        <p>
          No chat, no comments, no public profiles, no child-to-child contact, no leaderboards
          comparing children. Competition in ClueCrew is only ever with yesterday&apos;s self and a
          friendly mascot.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Data minimisation, built into the database</h2>
        <p>
          There is no field in our system for a child&apos;s surname, date of birth, school, photo or
          location — the columns do not exist, so they cannot leak, be hacked, or be requested.
          Parents own accounts; children have profiles inside them.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>No trackers near children</h2>
        <p>
          Child-facing pages ship with a security policy that blocks every third-party script —
          enforced by our automated tests on every release. Our own analytics store IDs and counts,
          never anything a child wrote.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Nothing machine-generated talks to your child</h2>
        <p>
          Every word a child reads or hears is authored and human-reviewed. When the writing
          practice feature arrives, submissions will be screened, anything flagged will reach a
          named safeguarding lead the same day, and feedback will discuss the writing only — with
          full details published here before the feature switches on.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Calm by design</h2>
        <p>
          Sessions are capped at 15 minutes with a warm wind-down. Nothing punishes stopping;
          nothing rewards bingeing; streaks forgive missed days. A child is never shown the word
          &quot;fail&quot; — a miss is a clue, and the app treats it as one.
        </p>
      </section>

      <p className="cc-muted">
        Questions about any of this? Email us — a human answers. See also{' '}
        <a href="/privacy">privacy in plain English</a>.
      </p>
    </main>
  );
}
