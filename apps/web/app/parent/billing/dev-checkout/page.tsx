import { redirect } from 'next/navigation';
import { PRICING, formatPence, type PaidTier } from '@cluecrew/core';
import { PostButton } from '@/components/billing-buttons';

/** Dev/staging stand-in for the Stripe checkout page. Not built in production. */
export default async function DevCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  if (process.env.APP_ENV === 'production' || process.env.STRIPE_SECRET_KEY) redirect('/parent/billing');
  const { tier } = await searchParams;
  if (!tier || !(tier in PRICING) || tier === 'BURSARY') redirect('/parent/billing');
  const pricing = PRICING[tier as PaidTier];

  return (
    <main className="cc-container">
      <h1>Test checkout (dev environment)</h1>
      <div className="cc-card">
        <p>
          {pricing.displayName}:{' '}
          {pricing.billing === 'monthly'
            ? `${formatPence(pricing.amountPence)}/month, total ${formatPence(pricing.totalContractValuePence)} over ${pricing.commitmentMonths} months`
            : `${formatPence(pricing.amountPence)} one-off`}
          .
        </p>
        <p className="cc-muted">
          In staging/production this page is Stripe Checkout. Confirming here synthesizes the same
          webhook events Stripe would send.
        </p>
        <PostButton path="/api/payments/dev/complete" label="Confirm test payment" />
      </div>
      <p>
        <a href="/parent/billing">Back to billing</a>
      </p>
    </main>
  );
}
