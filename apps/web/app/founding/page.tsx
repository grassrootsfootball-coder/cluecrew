import { prisma } from '@cluecrew/db';
import { PricingViewedBeacon } from '@/components/founding/analytics';
import { joinWaitlistAction } from '@/lib/actions/waitlist';

/**
 * The demand-test page (DEMAND-TEST-PACK §2). Copy is VERBATIM from the pack
 * — it is scanned content and every line is L1/L2-clean by construction; do
 * not edit copy here without editing the pack. No product screenshots, no
 * countdowns, no popups (§1). The form is a server action so it works from
 * first paint, and the UTM src (§4) rides a hidden field.
 */
export default async function FoundingPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  const regions = await prisma.region.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const waitlistBox = (
    <div className="cc-card" style={{ maxWidth: '34rem' }}>
      <form action={joinWaitlistAction} className="cc-form">
        <p style={{ margin: 0, fontWeight: 700 }}>Join the Founding Crew waitlist →</p>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Your region (optional)
          <select name="regionCode" defaultValue="">
            <option value="">Choose a region…</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
            <option value="not-sure">Not sure yet</option>
          </select>
        </label>
        <label>
          {/* Addendum D §1 wording, same as onboarding. */}
          Which year group are they in from this September? (optional)
          <select name="yearGroup" defaultValue="">
            <option value="">Choose a year…</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
            <option value="6">Year 6</option>
          </select>
        </label>
        {typeof src === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(src) ? (
          <input type="hidden" name="src" value={src} />
        ) : null}
        <button className="cc-button" type="submit">
          Join
        </button>
        <p className="cc-muted" style={{ margin: 0 }}>
          We&apos;ll email you about ClueCrew&apos;s launch and nothing else. Unsubscribe anytime.{' '}
          <a href="/founding/privacy">Privacy notice</a>.
        </p>
      </form>
      <p className="cc-muted" style={{ marginBottom: 0 }}>
        <em>Founding families get our best-ever rate, locked for their whole programme.</em>
      </p>
    </div>
  );

  return (
    <>
      <header className="mk-hero">
        <div className="mk-hero-inner">
          <div className="mk-hero-words">
            <img src="/cluecrew-logo.svg" alt="ClueCrew" width={280} height={71} />
            <h1 className="mk-hero-line">The 11+ finally makes sense.</h1>
            <p className="mk-hero-sub">
              Every question type, explained the way that clicks for <em>your</em> child — in 15
              calm minutes a day. Built for every family, priced like it means it.
            </p>
            {waitlistBox}
          </div>
        </div>
      </header>

      <main>
        <section className="mk-section">
          <div className="cc-container">
            <div className="mk-grid">
              <div className="mk-feature">
                <h3>Crack cases, don&apos;t do drills.</h3>
                <p>
                  Verbal reasoning becomes codebreaking. Maths problems become jobs in the Workshop.
                  Same exam skills, completely different feeling.
                </p>
              </div>
              <div className="mk-feature">
                <h3>Every concept, multiple ways.</h3>
                <p>
                  Watch it, walk through it, see it, hear it, or just try it — your child chooses
                  how it clicks. When one way doesn&apos;t land, another one will.
                </p>
              </div>
              <div className="mk-feature">
                <h3>Calm by design.</h3>
                <p>
                  Fifteen minutes a day, capped. No red pen, no leaderboards, no pressure
                  mechanics. Mocks unlock only when your child is genuinely ready for them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="cc-container">
            <p className="cc-muted" style={{ maxWidth: '44rem' }}>
              We won&apos;t promise you a pass. Nobody honestly can. We promise the clearest
              teaching we know how to build, real exam-format practice, and a straight answer about
              how it&apos;s going.
            </p>
          </div>
        </section>

        <PricingViewedBeacon>
          <section className="mk-section">
            <div className="cc-container">
              <div className="mk-grid">
                <div className="mk-price">
                  <h3>Crew — Free, forever.</h3>
                  <p>
                    A real taste: ten full cases, daily word collecting, weekly exam-style
                    questions. No card, no catch, no ads — ever.
                  </p>
                </div>
                <div className="mk-price">
                  <h3>Full Crew — from £8.49/month.</h3>
                  <p>
                    Everything: all subjects as they launch, the full programme paced to your
                    child&apos;s year, mock papers, the parent guide. (£8.49/mo on 24 months, total
                    £203.76 · £9.99/mo on 12 months, total £119.88 · £12.99 rolling, cancel in two
                    clicks.)
                  </p>
                </div>
                <div className="mk-price">
                  <h3>Crew Plus — £24.99/month.</h3>
                  <p>
                    Everything, plus a monthly video from a qualified teacher reviewing your
                    child&apos;s progress — what&apos;s working, what to focus on, what to try at
                    home.
                  </p>
                </div>
                <div className="mk-bursary">
                  <h3>Crew Bursary — Free.</h3>
                  <p>
                    Full Crew, free, for families on free school meals. One bursary place opens for
                    every ten paid ones. Same product, exactly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </PricingViewedBeacon>

        <section className="mk-section">
          <div className="cc-container">
            <p style={{ maxWidth: '44rem' }}>
              New to all this? So are half the families we&apos;re building for. ClueCrew explains
              the whole system in plain language — which test your region uses, how scoring works,
              how much practice is enough, and how to support without pressuring.
            </p>
          </div>
        </section>

        <section className="mk-section">
          <div className="cc-container" style={{ maxWidth: '44rem' }}>
            <h2>Questions parents ask</h2>
            <p>
              <em>Which exam boards?</em> GL-style formats first (most grammar regions), with more
              to follow. Always confirm your target school&apos;s format for your entry year —
              schools do change providers.
            </p>
            <p>
              <em>When does it launch?</em> Founding Crew families get access first, at the
              founding rate, before general release.
            </p>
            <p>
              <em>What ages?</em> Built for Years 3–6, paced to your child&apos;s year and exam
              date.
            </p>
            <p>
              <em>Is it just AI-generated questions?</em> Every question is reviewed and signed off
              by a qualified KS2 teacher before any child sees it, and every wrong answer is
              designed to catch a real misconception — that&apos;s where the teaching lives.
            </p>
            <p>
              <em>What about screen time?</em> Fifteen minutes daily, hard-capped. We think
              that&apos;s a feature.
            </p>
          </div>
        </section>
      </main>

      <footer className="mk-footer">
        <div className="cc-container">
          <p className="mk-footer-links">
            <a href="/founding/privacy">Privacy notice</a>
            <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@example.test'}`}>
              Contact
            </a>
          </p>
          <p className="cc-muted">
            © ClueCrew <em>(trademark application pending)</em>
          </p>
        </div>
      </footer>
    </>
  );
}
