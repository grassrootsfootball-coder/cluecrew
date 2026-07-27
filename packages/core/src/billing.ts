import { PRICING, REMINDER_OFFSETS_DAYS, type PricedTier } from './pricing';

/**
 * Subscription state machine (BUILD-PHASE-2 §2).
 *
 * The webhook handler is the ONLY writer of Subscription.status. This module
 * is the pure reducer it uses: given the current subscription state and a
 * normalized Stripe event, it decides whether to apply the event (idempotency
 * and ordering) and what changes. All IO lives in apps/web.
 */

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface NormalizedBillingEvent {
  /** Stripe event id — deduplicated against WebhookEvent by the caller. */
  id: string;
  type:
    | 'checkout.session.completed'
    | 'invoice.paid'
    | 'invoice.payment_failed'
    | 'customer.subscription.updated'
    | 'customer.subscription.deleted';
  createdAt: Date;
  stripeCustomerId?: string;
  stripeSubId?: string;
  /** For customer.subscription.updated: Stripe's own status string. */
  stripeStatus?: string;
}

export interface SubscriptionState {
  tier: PricedTier;
  status: SubscriptionStatus;
  lastStripeEventAt: Date | null;
  firstPaidAt: Date | null;
}

export interface SubscriptionChanges {
  status?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubId?: string;
  firstPaidAt?: Date;
  canceledAt?: Date;
  commitmentEndsAt?: Date;
  renewalReminderAt?: Date | null;
  lastStripeEventAt: Date;
}

export type ReduceResult =
  | { apply: false; reason: 'out_of_order' | 'irrelevant' }
  | { apply: true; changes: SubscriptionChanges };

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const STRIPE_STATUS_MAP: Record<string, SubscriptionStatus | undefined> = {
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'past_due',
  incomplete: 'past_due',
  incomplete_expired: 'canceled',
};

export function reduceBillingEvent(state: SubscriptionState, event: NormalizedBillingEvent): ReduceResult {
  // Ordering guard: never let an older (possibly replayed out of order)
  // event overwrite the effect of a newer one.
  if (state.lastStripeEventAt && event.createdAt.getTime() <= state.lastStripeEventAt.getTime()) {
    return { apply: false, reason: 'out_of_order' };
  }

  const base = { lastStripeEventAt: event.createdAt };

  switch (event.type) {
    case 'checkout.session.completed': {
      const pricing = PRICING[state.tier];
      const firstPaidAt = state.firstPaidAt ?? event.createdAt;
      const commitmentEndsAt = addMonths(firstPaidAt, pricing.commitmentMonths);
      return {
        apply: true,
        changes: {
          ...base,
          status: 'active',
          stripeCustomerId: event.stripeCustomerId,
          stripeSubId: event.stripeSubId,
          firstPaidAt,
          commitmentEndsAt,
          // One-off tiers renew nothing; monthly tiers get T-14 then T-3 (L5).
          renewalReminderAt:
            pricing.billing === 'monthly'
              ? addDays(commitmentEndsAt, -REMINDER_OFFSETS_DAYS[0])
              : null,
        },
      };
    }
    case 'invoice.paid':
      return { apply: true, changes: { ...base, status: 'active' } };
    case 'invoice.payment_failed':
      // Access pauses; data is never deleted. The child app never sees this.
      return { apply: true, changes: { ...base, status: 'past_due' } };
    case 'customer.subscription.updated': {
      const mapped = event.stripeStatus ? STRIPE_STATUS_MAP[event.stripeStatus] : undefined;
      if (!mapped) return { apply: false, reason: 'irrelevant' };
      return { apply: true, changes: { ...base, status: mapped } };
    }
    case 'customer.subscription.deleted':
      return { apply: true, changes: { ...base, status: 'canceled', canceledAt: event.createdAt } };
  }
}

/** Whether a subscription currently grants access to the product. */
export function hasActiveAccess(
  status: SubscriptionStatus,
  trialEndsAt: Date | null,
  now: Date,
): boolean {
  if (status === 'active') return true;
  if (status === 'trialing') return trialEndsAt !== null && now.getTime() <= trialEndsAt.getTime();
  return false; // past_due pauses access (never deletes data); canceled ends it
}

/** Cooling-off eligibility: 14 days from first payment (§2.2). */
export function withinCoolingOff(firstPaidAt: Date | null, now: Date, coolingOffDays: number): boolean {
  if (!firstPaidAt) return false;
  return now.getTime() <= addDays(firstPaidAt, coolingOffDays).getTime();
}

/** Whole months between two dates, counting a started month as used. */
export function monthsUsed(since: Date, now: Date): number {
  const ms = now.getTime() - since.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (30.44 * 24 * 60 * 60 * 1000));
}
