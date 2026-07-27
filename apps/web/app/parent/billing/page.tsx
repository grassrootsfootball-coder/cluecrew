import { PRICING, formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { billingSummary } from '@/lib/billing';
import { CheckoutButton, PostButton } from '@/components/billing-buttons';

const STATUS_COPY: Record<string, string> = {
  trialing: 'Free trial — no card on file',
  active: 'Active',
  past_due: 'Payment issue — access paused, nothing deleted',
  canceled: 'Cancelled',
};

/**
 * Billing (BUILD-PHASE-2 §2, §4). The DMCC pre-contract summary — price,
 * commitment, TOTAL contract value, renewal behaviour, cancellation route and
 * the fair-exit formula — renders ABOVE the pay button.
 */
export default async function BillingPage() {
  const parent = (await currentParent())!;
  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });

  if (!subscription) {
    return (
      <main className="cc-container">
        <h1>Billing</h1>
        <p>
          No plan yet — <a href="/onboarding">finish onboarding</a> to start a free trial.
        </p>
      </main>
    );
  }

  const summary = billingSummary(subscription);
  const pricing = summary.pricing;

  return (
    <main className="cc-container">
      <h1>Billing</h1>

      <div className="cc-card">
        <h2 style={{ marginTop: 0 }}>{pricing.displayName}</h2>
        <p>
          Status: <strong>{STATUS_COPY[summary.status] ?? summary.status}</strong>
        </p>
        {summary.status === 'trialing' && summary.trialEndsAt ? (
          <p>
            Trial ends {summary.trialEndsAt.toLocaleDateString('en-GB')}. If you do nothing, the
            trial ends and nothing is charged.
          </p>
        ) : null}
        {summary.commitmentEndsAt ? (
          <p>Your {pricing.commitmentMonths}-month term runs until {summary.commitmentEndsAt.toLocaleDateString('en-GB')}.</p>
        ) : null}
      </div>

      {summary.status === 'trialing' ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Continue after your trial</h2>
          {/* DMCC pre-contract clarity, above the pay button: */}
          <ul>
            <li>
              Price:{' '}
              {pricing.billing === 'monthly'
                ? `${formatPence(pricing.amountPence)} per month`
                : `${formatPence(pricing.amountPence)} one-off`}
              , VAT included.
            </li>
            <li>
              Commitment: {pricing.commitmentMonths} months.{' '}
              <strong>Total contract value: {formatPence(pricing.totalContractValuePence)}.</strong>
            </li>
            <li>
              Renewal: we email you 14 days and again 3 days before the end of your term; nothing
              renews without those reminders.
            </li>
            <li>
              Cancelling: two clicks, right here in Billing. Within 14 days of first payment you
              get a full refund, no questions. After that, you can pay out the remaining term or
              take the fair exit: pay the difference between your rate and the shorter plan&apos;s
              rate for the months you used
              {pricing.tier === 'TWO_YEAR'
                ? ` (${formatPence(PRICING.ONE_YEAR.amountPence - PRICING.TWO_YEAR.amountPence)} per month used)`
                : ''}
              .
            </li>
          </ul>
          <CheckoutButton tier={subscription.tier} label="Add payment details" />
        </div>
      ) : null}

      {summary.status === 'active' ? (
        <>
          {summary.coolingOffEligible ? (
            <div className="cc-card">
              <h2 style={{ marginTop: 0 }}>Cooling-off</h2>
              <p>
                You are within 14 days of your first payment, so you can take a full refund — self
                serve, no questions asked.
              </p>
              <PostButton path="/api/payments/cooling-off" label="Refund me in full" quiet />
            </div>
          ) : null}
          <div className="cc-card">
            <h2 style={{ marginTop: 0 }}>Invoices</h2>
            <p className="cc-muted">
              A receipt is emailed on every charge, with the VAT invoice from our payment provider.
            </p>
          </div>
        </>
      ) : null}

      {summary.status !== 'canceled' ? (
        <p>
          <a href="/parent/billing/cancel">Cancel plan</a>
          <span className="cc-muted"> — two clicks, no phone calls, no forms.</span>
        </p>
      ) : (
        <p className="cc-muted">
          This plan is cancelled. Your family&apos;s data stays exportable for 30 days from account
          deletion; nothing is removed while the account stays open.
        </p>
      )}
    </main>
  );
}
