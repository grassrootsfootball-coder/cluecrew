import { PricingViewedBeacon } from '@/components/founding/analytics';
import { RegionDecoder } from '@/components/founding/decoder';
import { DemoWidget } from '@/components/founding/demo';
import { StickyBar } from '@/components/founding/sticky-bar';
import { joinWaitlistAction } from '@/lib/actions/waitlist';

/**
 * The demand-test page, V2 (DEMAND-TEST-PACK-V2 §1): experience before
 * email — the order of the sections IS the argument. Copy is verbatim from
 * the pack where the pack gives it; do not edit copy here without editing
 * the pack. No screenshots, no stock photos, no countdowns, no popups, no
 * exit-intent, no fake scarcity (§6).
 *
 * HUMAN GATES before public DNS: the three demo items need reviewer
 * sign-off, and the founder note below is a DRAFT in David's voice that
 * only David can ratify.
 */
export default async function FoundingPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  const cleanSrc = typeof src === 'string' && /^[a-zA-Z0-9-]{1,40}$/.test(src) ? src : null;

  return (
    <>
      <StickyBar />

      <header className="mk-hero">
        <div className="mk-hero-inner">
          <div className="mk-hero-words">
            <img src="/cluecrew-logo.svg" alt="ClueCrew" width={280} height={71} />
            <h1 className="mk-hero-line">The 11+ finally makes sense.</h1>
            <p className="mk-hero-sub">
              Every question type, taught the way that clicks for <em>your</em> child — 15 calm
              minutes a day, at a price built for every family.
            </p>
            <p className="mk-hero-cta">
              <a className="cc-button" href="#demo">
                Try a question — takes 20 seconds
              </a>
            </p>
            <p>
              <a className="fd-quiet-link" href="#waitlist">
                Join the Founding Crew waitlist
              </a>
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="mk-section" id="demo">
          <div className="cc-container">
            <h2>Here&apos;s what it feels like.</h2>
            <DemoWidget />

            <div className="cc-card fd-waitlist" id="waitlist">
              <form action={joinWaitlistAction} className="cc-form">
                <p style={{ margin: 0, fontWeight: 700 }}>
                  Get your child early access — join the Founding Crew
                </p>
                <label>
                  Email
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <label>
                  Which year group are they in from this September? (optional)
                  <select name="yearGroup" defaultValue="">
                    <option value="">Choose a year…</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                    <option value="6">Year 6</option>
                  </select>
                </label>
                <input type="hidden" name="source" value="demo-end" />
                {cleanSrc ? <input type="hidden" name="src" value={cleanSrc} /> : null}
                <button className="cc-button" type="submit">
                  Join
                </button>
                <p className="cc-muted" style={{ margin: 0 }}>
                  We&apos;ll email you about ClueCrew&apos;s launch and nothing else. Unsubscribe
                  anytime. <a href="/founding/privacy">Privacy notice</a>.
                </p>
              </form>
              <p className="cc-muted" style={{ marginBottom: 0 }}>
                <em>Founding families get our best-ever rate, locked for their whole programme.</em>
              </p>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="cc-container">
            <h2>Every region runs the 11+ differently. Here&apos;s yours.</h2>
            <RegionDecoder src={cleanSrc} />
          </div>
        </section>

        <section className="mk-section">
          <div className="cc-container">
            <div className="mk-grid">
              <div className="mk-feature fd-accent-vr">
                <h3>Crack cases, don&apos;t do drills</h3>
                <p>
                  VR becomes codebreaking; maths problems become jobs in the Workshop. Same exam
                  skills, different feeling entirely.
                </p>
              </div>
              <div className="mk-feature fd-accent-nvr">
                <h3>Every concept, multiple ways</h3>
                <p>
                  Watch it, walk it, see it, hear it, or just try it. Your child picks how it
                  clicks.
                </p>
              </div>
              <div className="mk-feature fd-accent-maths">
                <h3>Calm by design</h3>
                <p>
                  15 minutes daily, capped. No red pen, no leaderboards. Mocks unlock only when
                  your child is ready for them — never before.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="cc-container" style={{ maxWidth: '44rem' }}>
            <p style={{ fontWeight: 700 }}>
              We won&apos;t promise you a pass. Nobody honestly can. We promise the clearest
              teaching we know how to build, real exam practice, and a straight answer about how
              it&apos;s going.
            </p>
            <p>
              Every question is written to a misconception map and signed off by a qualified KS2
              teacher before it goes live. Ask us anything about how it&apos;s built — the answer
              is never &ldquo;trade secret&rdquo;.
            </p>
            {/* Founder note (V2 §1.4): DRAFT in David's first person — David
                must ratify or rewrite before public DNS. */}
            <p className="fd-founder-note">
              I&apos;m building ClueCrew because 11+ prep is either £8 workbooks your child
              ignores or platforms that cost more than school dinners. The families the market
              ignores are the ones I&apos;m building for first. If we can&apos;t make this work
              for them, we haven&apos;t made it work. — David
            </p>
            <div className="cc-card">
              <p style={{ margin: 0 }}>
                <strong>Full access, free, for families on free school meals.</strong> One bursary
                place opens for every ten paid ones. Same product, exactly.
              </p>
            </div>
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
            <p>
              <em>Is this like Atom?</em> Different philosophy. We don&apos;t predict your
              child&apos;s chances or compare them to other applicants — we teach, calmly, and show
              you honestly how it&apos;s going. Also: a quarter of the price, and free if
              you&apos;re on free school meals.
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
