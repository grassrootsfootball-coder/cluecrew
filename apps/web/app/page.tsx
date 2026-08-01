import { COOLING_OFF_DAYS, PRICING, TRIAL_DAYS, formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { Plausible } from '@/components/plausible';
import { ProductPeek } from '@/components/marketing/product-peek';

/**
 * Marketing home (BUILD-PHASE-5 §6). Process claims only, never outcomes
 * (L1), and only the approved multiple-ways framing (L2). Every claim here is
 * covered by docs/marketing-claims-audit.md.
 */
export default async function HomePage() {
  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  const full = PRICING.FULL_12;

  return (
    <>
      <Plausible />

      <header className="mk-hero">
        <div className="mk-hero-inner">
          <div className="mk-hero-words">
            <img src="/cluecrew-logo.svg" alt="ClueCrew" width={280} height={71} />
            <h1 className="mk-hero-line">
              The 11+, made to make sense — for every child and every parent.
            </h1>
            <p className="mk-hero-sub">
              Fifteen calm minutes a day. Clear teaching, no scare tactics, and a price any family
              can reach.
            </p>
            <p className="mk-hero-cta">
              <a className="cc-button" href="/signup">
                Start your free {TRIAL_DAYS}-day trial
              </a>
              <span className="mk-hero-note">No card needed. Nothing to cancel.</span>
            </p>
          </div>
          <ProductPeek />
        </div>
      </header>

      <main className="cc-container">
        <section className="mk-section">
          <h2>How it works</h2>
          <ol className="mk-steps">
            <li className="mk-step">
              <span className="mk-step-num" aria-hidden>
                1
              </span>
              <h3>Fifteen minutes, then it stops</h3>
              <p>
                A warm-up on old ground, one detective Case, one exam-style question. Sessions end
                on time even when your child wants more — we never reward bingeing.
              </p>
            </li>
            <li className="mk-step">
              <span className="mk-step-num" aria-hidden>
                2
              </span>
              <h3>Every concept, multiple ways</h3>
              <p>
                Watch it, walk it, see it, hear it, try it — your child chooses how it clicks, and
                the engine notices when something needs another way in.
              </p>
            </li>
            <li className="mk-step">
              <span className="mk-step-num" aria-hidden>
                3
              </span>
              <h3>You always know what to do</h3>
              <p>
                A plain-English dashboard and one short Sunday email: the win, the one thing to try
                at home, and how much runway is left.
              </p>
            </li>
          </ol>
        </section>

        <section className="mk-section">
          <h2>What makes it different</h2>
          <div className="mk-grid">
            <div className="mk-feature">
              <h3>A wrong answer is a clue</h3>
              <p>
                Every practice question&apos;s distractors are mapped to a specific mix-up, so a
                miss shows the hint for that mistake. No red ink. The word &ldquo;wrong&rdquo; never
                appears.
              </p>
            </div>
            <div className="mk-feature">
              <h3>Calm is designed in</h3>
              <p>
                The session cap, the forgiving streaks and the absence of leaderboards are rules the
                software enforces — not promises we make. Anxiety is the thing we build against.
              </p>
            </div>
            <div className="mk-feature">
              <h3>The Parents&apos; Casebook</h3>
              <p>
                Ten short chapters explaining the 11+ for anyone who did not grow up with it —
                including what to do if the answer is a no.{' '}
                <a href="/casebook-sample">Read one free</a>.
              </p>
            </div>
            <div className="mk-feature">
              <h3>Built for every child</h3>
              <p>
                Dyslexia-friendly text, tap-to-hear on everything, full keyboard use and a
                reduced-motion mode — core features, not add-ons.{' '}
                <a href="/accessibility">Our accessibility statement</a>.
              </p>
            </div>
          </div>
        </section>

        <section className="mk-section mk-price">
          <h2>Honest pricing — and a real free tier</h2>
          <p className="mk-price-line">
            <strong>Crew is free, forever</strong> — the first cases of every question-type
            family, all five ways in, no card and no clock.
          </p>
          <p>
            Everything unlocks with Full Crew from{' '}
            <strong>{formatPence(PRICING.FULL_24.amountPence)} a month</strong> ({full.displayName}:{' '}
            {formatPence(full.amountPence)}/month, {formatPence(full.totalContractValuePence)} in
            total — printed before you pay and again above the pay button). Cancelling takes two
            clicks. Full refund within {COOLING_OFF_DAYS} days, no questions. We email before
            anything renews.
          </p>
          <p>
            <a className="cc-button-quiet" href="/pricing">
              Every plan, every number
            </a>
          </p>
        </section>

        <section className="mk-section mk-bursary">
          <h2>The Crew Bursary — free</h2>
          <p>
            For families receiving free school meals or pupil premium, ClueCrew costs nothing: the
            full two-year programme, the identical product, nothing cut down and nothing labelled.
            One place opens for every ten paid subscriptions.
          </p>
          <p>
            <a className="cc-button-quiet" href="/bursary">
              How the bursary works
            </a>
          </p>
        </section>

        <section className="mk-section">
          <h2>Preparing in your area?</h2>
          <p className="cc-muted">
            What each area tests, sourced and dated — and always check with the school for your
            entry year.
          </p>
          <ul className="mk-regions">
            {regions.map((region) => (
              <li key={region.id}>
                <a href={`/11-plus/${region.id}`}>{region.name}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mk-footer">
        <div className="cc-container">
          <p className="mk-footer-links">
            <a href="/pricing">Pricing</a>
            <a href="/bursary">Crew Bursary</a>
            <a href="/casebook-sample">Free chapter</a>
            <a href="/faq">FAQ</a>
            <a href="/safeguarding">Safety &amp; safeguarding</a>
            <a href="/privacy">Privacy</a>
            <a href="/accessibility">Accessibility</a>
            <a href="/login">Sign in</a>
          </p>
          <p className="cc-muted">
            ClueCrew is independent. We are not affiliated with GL Assessment, CEM, ISEB, any school
            or consortium, or the Department for Education.
          </p>
        </div>
      </footer>
    </>
  );
}
