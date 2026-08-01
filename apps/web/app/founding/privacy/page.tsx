/**
 * The one-page plain-English privacy notice the waitlist links to
 * (DEMAND-TEST-PACK §3): what we store, why, retention, hosting, trackers.
 * Plain English is the register — a parent should read this in one minute
 * and know exactly where they stand.
 */
export default function WaitlistPrivacyPage() {
  return (
    <main className="cc-container" style={{ maxWidth: '44rem' }}>
      <h1>Privacy notice — the Founding Crew waitlist</h1>

      <h2>What we store</h2>
      <p>
        Your email address; your region and your child&apos;s school year only if you chose to tell
        us; and a short tag saying which link brought you here (for example, a Kent parents&apos;
        group rather than a Bucks one). That is the whole list — no names, no addresses, nothing
        about your child beyond a school year you volunteered.
      </p>

      <h2>Why we store it</h2>
      <p>
        To email you about ClueCrew&apos;s launch, and for nothing else. No marketing lists are
        bought, sold, shared or joined. We also count signups per region and year group in
        aggregate to understand where to build first.
      </p>

      <h2>Consent, twice</h2>
      <p>
        Signing up sends one confirmation email. If you don&apos;t tap the link in it, you are not
        on the list and we won&apos;t email you again. Every email we ever send has an unsubscribe
        link that works on the first click.
      </p>

      <h2>How long we keep it</h2>
      <p>
        If you join and never become a ClueCrew family, we delete your details 12 months after
        launch. Want them gone sooner? Use the unsubscribe link or email us and we&apos;ll delete
        them within 30 days.
      </p>

      <h2>Where it lives</h2>
      <p>
        On servers in the UK and EU, with our email provider. No data leaves that footprint.
      </p>

      <h2>No trackers</h2>
      <p>
        This page uses Plausible, a cookieless, EU-hosted counter that tells us how many people
        visited — never who. There are no advertising pixels, no fingerprinting, and nothing to
        consent to, which is why there is no cookie banner.
      </p>

      <p className="cc-muted">
        <a href="/founding">Back to the page</a>
      </p>
    </main>
  );
}
