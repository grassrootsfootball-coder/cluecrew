import { COOLING_OFF_DAYS, PRICING, TRIAL_DAYS, formatPence } from '@cluecrew/core';
import { Plausible } from '@/components/plausible';

/**
 * Pricing V2 (AMENDMENT-1 §1) with total contract value front and centre
 * (L5). Crew leads because it is the genuine front door, not a teaser; the
 * ladder never dark-patterns — every term, every exit, printed here.
 */
export default function PricingPage() {
  return (
    <main className="cc-container">
      <Plausible />
      <h1>Pricing, with nothing hidden</h1>
      <p className="cc-muted">
        All prices include VAT. For paid plans, the total you would pay over the whole term is
        printed here and again above the pay button. Nothing renews silently, and free never
        becomes paid without you choosing it.
      </p>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Crew — free, forever</h2>
        <p>
          The real product, free: the first cases of every question-type family with all five ways
          in, the Word Vault daily drip, a weekly Boss Round, the region wizard and the first
          Casebook chapter. No card, ever, and no time limit. This is where every family starts —
          and staying is fine.
        </p>
        <p>
          <strong>Total contract value: £0.</strong>
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Full Crew — pick your term</h2>
        <p>
          Everything: every case in every district as it ships, the full readiness ladder and
          practice papers, the live dashboard and weekly email, the whole Casebook.
        </p>
        <ul>
          {(['FULL_24', 'FULL_12', 'FULL_ROLLING'] as const).map((tier) => {
            const pricing = PRICING[tier];
            return (
              <li key={tier}>
                <strong>{formatPence(pricing.amountPence)}/month</strong>{' '}
                {pricing.commitmentMonths > 1
                  ? `for ${pricing.commitmentMonths} months — total contract value ${formatPence(pricing.totalContractValuePence)}.`
                  : 'rolling — cancel any month; your commitment is only ever the current month.'}
              </li>
            );
          })}
        </ul>
        <p className="cc-muted">
          Optional {TRIAL_DAYS}-day Full Crew preview at signup — no card; if you do nothing, you
          simply stay on Crew.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>
          Crew Plus — {formatPence(PRICING.PLUS_ROLLING.amountPence)}/month, rolling
        </h2>
        <p>
          Full Crew plus a monthly recorded review of your child&apos;s progress by a qualified
          teacher — a short video for you, grounded in the same dashboard you see, with one focus
          for the month and one thing to try at home. Never predictions, never comparisons to
          other children.
        </p>
        <p className="cc-muted">
          Places are capped to our teacher bench so every review actually happens. If a
          month&apos;s review is ever missed, we credit £15 back without being asked. When places
          are full, a public waitlist holds your spot.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>
          Summer Intensive — {formatPence(PRICING.SUMMER.amountPence)} once
        </h2>
        <p>
          The 8-week final-stretch programme: consolidation and the paper ladder, no new topics.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>The Crew Bursary — £0</h2>
        <p>
          For families receiving free school meals or pupil premium: Full Crew, the identical
          product, free. While a family is on the bursary waitlist they hold Crew automatically —
          nobody waits with nothing. <a href="/bursary">How it works</a>.
        </p>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Leaving is as easy as joining</h2>
        <ul>
          <li>Cancelling is two clicks in Parent HQ — no phone calls, no forms.</li>
          <li>
            Full refund within {COOLING_OFF_DAYS} days of first payment, self-serve, no questions.
          </li>
          <li>
            Leaving a committed term early? Pay the fair exit — the difference between your rate
            and the next-shorter term&apos;s rate for the months you used (
            {formatPence(PRICING.FULL_12.amountPence - PRICING.FULL_24.amountPence)}/month on the
            24-month term,{' '}
            {formatPence(PRICING.FULL_ROLLING.amountPence - PRICING.FULL_12.amountPence)}/month on
            the 12-month) — or pay out the remaining term. Your choice, both shown at checkout.
          </li>
          <li>We email you 14 days and 3 days before anything renews. Nothing renews silently.</li>
        </ul>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Schools</h2>
        <p>
          A schools programme is planned for next year. <a href="/schools">Register interest</a>{' '}
          and we&apos;ll tell you when it exists — that page does nothing else.
        </p>
      </section>

      <p>
        <a className="cc-button" href="/signup">
          Start free on Crew
        </a>
      </p>
    </main>
  );
}
