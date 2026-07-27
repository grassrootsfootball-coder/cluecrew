/**
 * Billing domain IO (BUILD-PHASE-2 §2). The state machine lives in
 * @cluecrew/core (pure, unit-tested); this module persists its decisions.
 *
 * applyBillingEvent is the ONLY writer of Subscription.status. Everything —
 * real Stripe webhooks and dev-mode synthesized events — flows through it.
 */
import {
  COOLING_OFF_DAYS,
  PRICING,
  TRIAL_DAYS,
  addDays,
  fairExitChargePence,
  monthsUsed,
  reduceBillingEvent,
  remainingCommitmentPence,
  withinCoolingOff,
  type NormalizedBillingEvent,
  type PaidTier,
  type SubscriptionStatus,
} from '@cluecrew/core';
import { logEvent, prisma, type Subscription } from '@cluecrew/db';
import { sendEmail } from '@/lib/email';
import {
  cancellationConfirmedTemplate,
  coolingOffRefundTemplate,
  paymentIssueTemplate,
  receiptTemplate,
  welcomeTrialStartedTemplate,
} from '@/lib/email-templates';
import { getPaymentProvider } from '@/lib/payments/provider';

/** Staging time-travel (gate #5): CLUECREW_NOW overrides the clock. */
export function billingNow(): Date {
  const override = process.env.CLUECREW_NOW;
  if (override && process.env.APP_ENV !== 'production') return new Date(override);
  return new Date();
}

/** Trial: 7 days, all paid tiers, NO card required (§1). */
export async function startTrial(parentId: string, tier: PaidTier): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { parentId } });
  if (existing) return existing;

  const now = billingNow();
  const trialEndsAt = addDays(now, TRIAL_DAYS);
  const subscription = await prisma.subscription.create({
    data: {
      parentId,
      tier,
      status: 'trialing',
      trialEndsAt,
      // Trial-ending reminder at T-2 (§7).
      renewalReminderAt: addDays(trialEndsAt, -2),
    },
  });

  const parent = await prisma.parentAccount.findUniqueOrThrow({ where: { id: parentId } });
  await sendEmail({ to: parent.email, ...welcomeTrialStartedTemplate(parent.displayName, tier, trialEndsAt) });
  await logEvent({ name: 'trial_started', parentId, props: { tier } });
  return subscription;
}

interface ApplyResult {
  applied: boolean;
  reason?: string;
}

/**
 * Idempotent, ordered event application (gate #6):
 *  1. event-id dedup via the WebhookEvent table (replay-safe);
 *  2. the core reducer rejects out-of-order timestamps;
 *  3. side effects (emails, analytics) run only when a transition applies.
 */
export async function applyBillingEvent(
  event: NormalizedBillingEvent,
  locate: { parentId?: string; stripeCustomerId?: string; stripeSubId?: string },
): Promise<ApplyResult> {
  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return { applied: false, reason: 'duplicate_event' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        ...(locate.parentId ? [{ parentId: locate.parentId }] : []),
        ...(locate.stripeSubId ? [{ stripeSubId: locate.stripeSubId }] : []),
        ...(locate.stripeCustomerId ? [{ stripeCustomerId: locate.stripeCustomerId }] : []),
      ],
    },
    include: { parent: true },
  });
  if (!subscription) return { applied: false, reason: 'subscription_not_found' };

  const result = reduceBillingEvent(
    {
      tier: subscription.tier,
      status: subscription.status as SubscriptionStatus,
      lastStripeEventAt: subscription.lastStripeEventAt,
      firstPaidAt: subscription.firstPaidAt,
    },
    event,
  );
  if (!result.apply) return { applied: false, reason: result.reason };

  const previousStatus = subscription.status;
  await prisma.subscription.update({ where: { id: subscription.id }, data: result.changes });

  const parent = subscription.parent;
  const newStatus = result.changes.status;
  if (newStatus === 'active' && previousStatus !== 'active') {
    await logEvent({ name: 'subscription_activated', parentId: parent.id, props: { tier: subscription.tier } });
    if (event.type === 'checkout.session.completed') {
      await sendEmail({
        to: parent.email,
        ...receiptTemplate(parent.displayName, subscription.tier, PRICING[subscription.tier].amountPence),
      });
    }
  }
  if (newStatus === 'past_due' && previousStatus !== 'past_due') {
    await logEvent({ name: 'payment_failed', parentId: parent.id, props: { tier: subscription.tier } });
    await sendEmail({ to: parent.email, ...paymentIssueTemplate(parent.displayName) });
  }
  if (newStatus === 'canceled' && previousStatus !== 'canceled') {
    await logEvent({ name: 'subscription_canceled', parentId: parent.id, props: { tier: subscription.tier } });
    await sendEmail({
      to: parent.email,
      ...cancellationConfirmedTemplate(parent.displayName, subscription.commitmentEndsAt),
    });
  }

  return { applied: true };
}

let devEventCounter = 0;
export function devEvent(
  type: NormalizedBillingEvent['type'],
  extra: Partial<NormalizedBillingEvent> = {},
): NormalizedBillingEvent {
  devEventCounter += 1;
  return {
    id: `evt_dev_${Date.now()}_${devEventCounter}`,
    type,
    createdAt: billingNow(),
    ...extra,
  };
}

/** Two-click cancel (§2.4): this is the single confirm action behind click 2. */
export async function cancelSubscription(parentId: string): Promise<ApplyResult> {
  const subscription = await prisma.subscription.findUnique({ where: { parentId } });
  if (!subscription) return { applied: false, reason: 'subscription_not_found' };
  if (subscription.status === 'canceled') return { applied: false, reason: 'already_canceled' };

  // Trials cancel instantly and locally — there is nothing at Stripe yet.
  const provider = getPaymentProvider();
  if (provider.kind === 'stripe' && subscription.stripeSubId) {
    await provider.cancelSubscription(subscription.stripeSubId);
    // Status flips when the customer.subscription.deleted webhook lands.
    return { applied: true, reason: 'awaiting_webhook' };
  }
  return applyBillingEvent(devEvent('customer.subscription.deleted'), { parentId });
}

/** Cooling-off (§2.2): 14-day full refund from first payment, self-serve. */
export async function coolingOffRefund(parentId: string): Promise<ApplyResult & { refundedPence?: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { parentId },
    include: { parent: true },
  });
  if (!subscription) return { applied: false, reason: 'subscription_not_found' };
  if (!withinCoolingOff(subscription.firstPaidAt, billingNow(), COOLING_OFF_DAYS)) {
    return { applied: false, reason: 'outside_cooling_off' };
  }

  const provider = getPaymentProvider();
  let refundedPence = PRICING[subscription.tier].amountPence;
  if (provider.kind === 'stripe' && subscription.stripeCustomerId) {
    refundedPence = await provider.refundAllCharges(subscription.stripeCustomerId);
    if (subscription.stripeSubId) await provider.cancelSubscription(subscription.stripeSubId);
  } else {
    await applyBillingEvent(devEvent('customer.subscription.deleted'), { parentId });
  }

  await logEvent({ name: 'refund_issued', parentId, props: { tier: subscription.tier, refundedPence } });
  await sendEmail({
    to: subscription.parent.email,
    ...coolingOffRefundTemplate(subscription.parent.displayName, refundedPence),
  });
  return { applied: true, refundedPence };
}

/** Everything the billing page needs, computed in one place. */
export function billingSummary(subscription: Subscription, now = billingNow()) {
  const pricing = PRICING[subscription.tier];
  const used = subscription.firstPaidAt ? monthsUsed(subscription.firstPaidAt, now) : 0;
  return {
    pricing,
    status: subscription.status as SubscriptionStatus,
    trialEndsAt: subscription.trialEndsAt,
    commitmentEndsAt: subscription.commitmentEndsAt,
    monthsUsed: used,
    fairExitPence: fairExitChargePence(subscription.tier, used),
    remainingCommitmentPence: remainingCommitmentPence(subscription.tier, used),
    coolingOffEligible: withinCoolingOff(subscription.firstPaidAt, now, COOLING_OFF_DAYS),
  };
}
