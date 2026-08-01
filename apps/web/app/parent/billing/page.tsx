import { PRICING, formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { billingSummary } from '@/lib/billing';
import { CheckoutButton, PostButton } from '@/components/billing-buttons';
import { changePlanAction } from '@/lib/actions/parent';

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
    // Amendment 1: no subscription IS a plan — Crew, free, forever. This page
    // simply shows what Full Crew adds; staying is fine.
    return (
      <main className="cc-container">
        <h1>Billing</h1>
        <p>
          You&apos;re on <strong>Crew — free, forever</strong>. Everything your child has now stays
          free. Full Crew adds every case, the practice-paper ladder, the full dashboard and the
          weekly email.
        </p>
        {(['FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING'] as const).map((tier) => {
          const pricing = PRICING[tier];
          return (
            <div className="cc-card" key={tier}>
              <strong>{pricing.displayName}</strong> — {formatPence(pricing.amountPence)}/month
              {pricing.commitmentMonths > 1
                ? ` for ${pricing.commitmentMonths} months (total contract value ${formatPence(pricing.totalContractValuePence)})`
                : ' rolling — cancel any month'}
              . <CheckoutButton tier={tier} label={`Choose ${pricing.displayName}`} />
            </div>
          );
        })}
        <p className="cc-muted">
          Full pricing detail, exits included: <a href="/pricing">the pricing page</a>.
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
              {pricing.tier === 'FULL_24'
                ? ` (${formatPence(PRICING.FULL_12.amountPence - PRICING.FULL_24.amountPence)} per month used)`
                : pricing.tier === 'FULL_12'
                ? ` (${formatPence(PRICING.FULL_ROLLING.amountPence - PRICING.FULL_12.amountPence)} per month used)`
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

      {subscription.tier === 'PLUS_ROLLING' ? (
        <div className="cc-card" data-testid="plus-reviews">
          <h2 style={{ marginTop: 0 }}>Your monthly teacher reviews</h2>
          {(
            await prisma.reviewRecording.findMany({
              where: { child: { parentId: parent.id }, status: 'RELEASED' },
              include: { child: { select: { crewName: true } } },
              orderBy: { releasedAt: 'desc' },
              take: 12,
            })
          ).map((review) => (
            <p key={review.id}>
              {review.child.crewName} · {review.month} —{' '}
              <a href={`/parent/reviews/${review.id}`}>watch the review</a>
            </p>
          ))}
          <p className="cc-muted">
            A short recorded review lands here each month — what&apos;s going well, one focus, one
            thing to try at home. If a month is ever missed, £15 is credited automatically.
          </p>
        </div>
      ) : null}

      {summary.status !== 'canceled' ? (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Change plan</h2>
          <p className="cc-muted">
            Two clicks, like cancelling: pick, then confirm. Moving from Crew Plus to Full Crew is
            seamless — released reviews stay yours.
          </p>
          <form action={changePlanAction} className="cc-form">
            {(['FULL_24', 'FULL_12', 'FULL_ROLLING', 'PLUS_ROLLING'] as const)
              .filter((tier) => tier !== subscription.tier)
              .map((tier) => (
                <label key={tier} className="cc-checkbox">
                  <input type="radio" name="tier" value={tier} required />{' '}
                  {PRICING[tier].displayName} — {formatPence(PRICING[tier].amountPence)}/month
                  {PRICING[tier].commitmentMonths > 1
                    ? ` (TCV ${formatPence(PRICING[tier].totalContractValuePence)})`
                    : ' rolling'}
                </label>
              ))}
            <button className="cc-button-quiet" type="submit">
              Confirm plan change
            </button>
          </form>
        </div>
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
