import { COOLING_OFF_DAYS, PRICING, TRIAL_DAYS, formatPence } from '@cluecrew/core';
import { Plausible } from '@/components/plausible';

/** Pricing with total contract value front and centre (L5, §6). */
export default function PricingPage() {
  return (
    <main className="cc-container">
      <Plausible />
      <h1>Pricing, with nothing hidden</h1>
      <p className="cc-muted">
        Every plan starts with a {TRIAL_DAYS}-day free trial — no card. All prices include VAT. The
        total you would pay over the whole plan is printed here and again above the pay button.
      </p>

      {(['TWO_YEAR', 'ONE_YEAR', 'SUMMER'] as const).map((tier) => {
        const pricing = PRICING[tier];
        return (
          <section className="cc-card" key={tier}>
            <h2 style={{ marginTop: 0 }}>{pricing.displayName}</h2>
            <p>
              {pricing.billing === 'monthly'
                ? `${formatPence(pricing.amountPence)} per month for ${pricing.commitmentMonths} months.`
                : `${formatPence(pricing.amountPence)} once, for the 8-week programme.`}
            </p>
            <p>
              <strong>Total contract value: {formatPence(pricing.totalContractValuePence)}.</strong>
            </p>
          </section>
        );
      })}

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>Leaving is as easy as joining</h2>
        <ul>
          <li>Cancelling is two clicks in Parent HQ — no phone calls, no forms.</li>
          <li>Full refund within {COOLING_OFF_DAYS} days of first payment, self-serve, no questions.</li>
          <li>
            Leaving a 2-Year plan early? Pay the fair exit — the difference between your rate and
            the 1-Year rate for the months you used ({formatPence(PRICING.ONE_YEAR.amountPence - PRICING.TWO_YEAR.amountPence)}
            /month used) — or pay out the remaining term. Your choice, both shown at checkout.
          </li>
          <li>We email you 14 days and 3 days before anything renews. Nothing renews silently.</li>
        </ul>
      </section>

      <section className="cc-card">
        <h2 style={{ marginTop: 0 }}>The Crew Bursary — £0</h2>
        <p>
          For families receiving free school meals or pupil premium: the identical product, the
          full two-year programme, free. <a href="/bursary">How it works</a>.
        </p>
      </section>

      <p>
        <a className="cc-button" href="/signup">
          Start the free trial
        </a>
      </p>
    </main>
  );
}
