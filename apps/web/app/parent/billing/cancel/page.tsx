import { redirect } from 'next/navigation';
import { formatPence } from '@cluecrew/core';
import { prisma } from '@cluecrew/db';
import { currentParent } from '@/lib/auth';
import { billingSummary } from '@/lib/billing';
import { PostButton } from '@/components/billing-buttons';

/**
 * Click 1 landed here; the confirm button below is click 2 (§2.4, gate #3).
 * The save-offer is a single optional block on this same screen — it never
 * adds a click and never guilt-trips.
 */
export default async function CancelPage() {
  const parent = (await currentParent())!;
  const subscription = await prisma.subscription.findUnique({ where: { parentId: parent.id } });
  if (!subscription || subscription.status === 'canceled') redirect('/parent/billing');

  const summary = billingSummary(subscription);

  return (
    <main className="cc-container">
      <h1>Cancel your plan</h1>

      {summary.status === 'trialing' ? (
        <p>
          You are on the free trial, so cancelling costs nothing — there is no card on file and
          nothing to charge.
        </p>
      ) : (
        <div className="cc-card">
          <h2 style={{ marginTop: 0 }}>Where you stand</h2>
          <ul>
            <li>Months used so far: {summary.monthsUsed}.</li>
            {summary.coolingOffEligible ? (
              <li>
                You are within the 14-day cooling-off window — take a{' '}
                <strong>full refund</strong> from the Billing page instead; it is the better deal.
              </li>
            ) : null}
            {summary.fairExitPence > 0 ? (
              <li>
                Fair exit: pay {formatPence(summary.fairExitPence)} (the difference between your
                rate and the shorter plan&apos;s rate for {summary.monthsUsed} months used), or pay
                out the remaining term ({formatPence(summary.remainingCommitmentPence)}). We apply
                whichever you choose at confirmation — the fair exit is almost always less.
              </li>
            ) : (
              <li>Nothing further is payable beyond months already billed.</li>
            )}
            <li>Your child&apos;s progress is kept for 30 days in case you return, then deleted.</li>
          </ul>
        </div>
      )}

      <div className="cc-card">
        <p style={{ marginTop: 0 }} className="cc-muted">
          One thought before you go (entirely optional): if the monthly cost is the issue, the Crew
          Bursary gives the identical product free to families receiving free school meals or pupil
          premium — <a href="/bursary">details here</a>. And if now is just not the right time,
          your progress export is always available from Account.
        </p>
      </div>

      <PostButton path="/api/payments/cancel" label="Confirm cancellation" />
      <p>
        <a href="/parent/billing">Keep my plan</a>
      </p>
    </main>
  );
}
