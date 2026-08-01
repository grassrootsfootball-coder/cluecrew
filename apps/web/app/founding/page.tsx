import { PricingViewedBeacon } from '@/components/founding/analytics';
import { RegionDecoder } from '@/components/founding/decoder';
import { DemoWidget } from '@/components/founding/demo';
import { FiveWays } from '@/components/founding/five-ways';
import { PricingTable } from '@/components/founding/pricing-table';
import { StickyBar } from '@/components/founding/sticky-bar';
import '@/app/crew/crew.css'; // the Alphabet Rail's own styles (V3.1 §A See-it tab)

/**
 * The live launch page, Step 1 (LIVE-LAUNCH-PACK-V3): no waitlist theatre —
 * the primary CTA delivers the free product, the pricing table carries a
 * founding-rate reserve until checkout opens, and the "What's live today"
 * section is the mis-selling firewall. Crew Plus and Summer Intensive are
 * ABSENT, not "coming soon" (§1). All v2 copy stands unless amended (§2).
 *
 * HUMAN GATES before DNS (§5A): reviewer sitting #1 (demo items + free-ten
 * item sets), David's 375px mobile pass, Step-1 legal/ops list, Ezra's
 * end-to-end smoke test. The founder note remains a DRAFT for David.
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
              <a className="cc-button" href="/signup">
                Start free — no card, no clock
              </a>
            </p>
            <p>
              <a className="fd-quiet-link" href="#demo">
                Try a question first — 20 seconds
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
          </div>
        </section>

        {/* One concept, five ways in (V3.1 §A) — the depth-proof. */}
        <section className="mk-section">
          <div className="cc-container">
            <h2>One concept, five ways in.</h2>
            <p className="cc-muted" style={{ maxWidth: '44rem' }}>
              <em>
                Most platforms explain something once and hope. ClueCrew teaches every question
                type five ways — and your child picks what clicks.
              </em>
            </p>
            <FiveWays />
            <p style={{ maxWidth: '44rem' }}>
              <em>
                &ldquo;When something isn&apos;t landing, the engine notices — and offers a
                different way in before frustration ever sets in.&rdquo;
              </em>
            </p>
          </div>
        </section>

        {/* Under the bonnet (V3.1 §B) — every entry verified against the
            shipped engine before it was written here. */}
        <section className="mk-section">
          <div className="cc-container" style={{ maxWidth: '44rem' }}>
            <h2>Built like it matters. Because it does.</h2>
            <p className="cc-muted">
              <em>
                For the parents who want to know exactly what they&apos;re signing their child up
                to — here&apos;s the engine, plainly.
              </em>
            </p>
            <p data-testid="bonnet-1">
              <strong>Review timed to the forgetting curve.</strong> Every session opens by
              revisiting what your child learned before — spaced at the intervals memory research
              says they&apos;d otherwise start to forget, tightening automatically as the exam
              approaches.
            </p>
            <p>
              <strong>Difficulty that keeps them in the zone.</strong> The engine holds your child
              where they succeed roughly three times out of four — hard enough to grow, never hard
              enough to break. Two misses in a row and it eases off and offers another way in.
              Three, and it changes the subject. No child grinds against a wall here.
            </p>
            <p>
              <strong>Every wrong answer is authored.</strong> Each distractor is built from a
              real, named misconception — so a miss produces the hint for that exact mix-up, not a
              generic &ldquo;try again&rdquo;. A teacher signs off every question before any child
              sees it.
            </p>
            <p>
              <strong>Mock exams that wait until they&apos;re ready.</strong> Papers unlock only
              when your child has been taught every question type on them and their exam-format
              accuracy says they&apos;re ready. A mock should measure readiness — never ambush.
            </p>
            <p>
              <strong>Intensity that follows the calendar.</strong> A Year 4 gets foundations at a
              gentle pace; the final four months before the exam introduce nothing new —
              consolidation only. The plan changes; the 15-minute cap never does.
            </p>
            <p>
              <strong>The exam format, made boring.</strong> Every session ends with real
              exam-format questions, no tools, no theming — so by September, test formatting is
              the most familiar thing in the room.
            </p>
            <p className="cc-muted">
              <em>
                Want the full picture? We publish how ClueCrew teaches — every rule above, and the
                evidence behind it. The answer is never &ldquo;trade secret&rdquo;.
              </em>{' '}
              <a href="/how-we-teach">How we teach</a>
            </p>
          </div>
        </section>

        {/* The honesty roadmap (V3 §2) — the mis-selling firewall. */}
        <section className="mk-section">
          <div className="cc-container" style={{ maxWidth: '44rem' }}>
            <h2>What&apos;s live today</h2>
            <p data-testid="live-now">
              <strong>Live now:</strong> Verbal Reasoning — all 21 GL-style question types, taught
              five ways, free to start.
            </p>
            <p>
              <strong>Opening next:</strong> Full programmes with the complete VR case library and
              paced plans to your exam year.
            </p>
            <p>
              <strong>Then:</strong> Maths (the Workshop), Non-Verbal Reasoning, English — in that
              order, included in Full Crew as they land, at the same price.
            </p>
            <p className="cc-muted">
              <em>
                We&apos;d rather tell you exactly what exists than sell you everything at once.
                Full Crew&apos;s price never changes as subjects are added — founding families lock
                the founding rate for their whole programme.
              </em>
            </p>
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
            <div className="mk-grid fd-three-up">
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
            {/* Founder note (V2 §1.4, carried by V3): DRAFT in David's first
                person — David must ratify or rewrite before public DNS. */}
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
              <h2>Pricing</h2>
              <PricingTable src={cleanSrc} />
              <p className="cc-muted">
                <em>Founding families get our best-ever rate, locked for their whole programme.</em>
              </p>
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
              <em>What do I get free?</em> Ten full cases across the five question families, every
              one taught all five ways, daily word collecting, and a weekly exam-style Boss Round.
              No card, no clock, no ads — ever.
            </p>
            <p>
              <em>When do the other subjects arrive?</em> Maths, Non-Verbal Reasoning and English
              land in that order — no hard dates promised, and each is included in Full Crew at
              the same price as it arrives. Founding families lock the founding rate for their
              whole programme.
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
