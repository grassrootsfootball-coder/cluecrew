import { describe, expect, it } from 'vitest';
import {
  hasActiveAccess,
  monthsUsed,
  reduceBillingEvent,
  withinCoolingOff,
  type NormalizedBillingEvent,
  type SubscriptionState,
} from './billing';

const T0 = new Date('2026-08-01T10:00:00Z');
const T1 = new Date('2026-08-01T10:05:00Z');
const T2 = new Date('2026-08-01T10:10:00Z');

const trialing: SubscriptionState = {
  tier: 'TWO_YEAR',
  status: 'trialing',
  lastStripeEventAt: null,
  firstPaidAt: null,
};

function event(overrides: Partial<NormalizedBillingEvent> & { type: NormalizedBillingEvent['type'] }): NormalizedBillingEvent {
  return { id: 'evt_1', createdAt: T1, ...overrides };
}

describe('reduceBillingEvent (gate checklist #6)', () => {
  it('activates on checkout completion with commitment end and T-14 reminder', () => {
    const result = reduceBillingEvent(
      trialing,
      event({ type: 'checkout.session.completed', stripeCustomerId: 'cus_1', stripeSubId: 'sub_1' }),
    );
    if (!result.apply) throw new Error('expected apply');
    expect(result.changes.status).toBe('active');
    expect(result.changes.firstPaidAt).toEqual(T1);
    expect(result.changes.commitmentEndsAt?.toISOString()).toBe('2028-08-01T10:05:00.000Z');
    // T-14 before commitment end
    expect(result.changes.renewalReminderAt?.toISOString()).toBe('2028-07-18T10:05:00.000Z');
  });

  it('one-off SUMMER tier schedules no renewal reminder', () => {
    const result = reduceBillingEvent(
      { ...trialing, tier: 'SUMMER' },
      event({ type: 'checkout.session.completed' }),
    );
    if (!result.apply) throw new Error('expected apply');
    expect(result.changes.renewalReminderAt).toBeNull();
  });

  it('rejects out-of-order events (older than the last applied)', () => {
    const state: SubscriptionState = { ...trialing, status: 'canceled', lastStripeEventAt: T2 };
    const result = reduceBillingEvent(state, event({ type: 'invoice.paid', createdAt: T1 }));
    expect(result).toEqual({ apply: false, reason: 'out_of_order' });
  });

  it('is idempotent under replay: the same event timestamp cannot re-apply', () => {
    const first = reduceBillingEvent(trialing, event({ type: 'invoice.payment_failed' }));
    if (!first.apply) throw new Error('expected apply');
    const after: SubscriptionState = {
      ...trialing,
      status: 'past_due',
      lastStripeEventAt: first.changes.lastStripeEventAt,
    };
    const replay = reduceBillingEvent(after, event({ type: 'invoice.payment_failed' }));
    expect(replay.apply).toBe(false);
  });

  it('payment failure pauses to past_due; later invoice.paid restores active', () => {
    const failed = reduceBillingEvent(trialing, event({ type: 'invoice.payment_failed', createdAt: T1 }));
    if (!failed.apply) throw new Error('expected apply');
    const state: SubscriptionState = { ...trialing, status: 'past_due', lastStripeEventAt: T1 };
    const paid = reduceBillingEvent(state, event({ id: 'evt_2', type: 'invoice.paid', createdAt: T2 }));
    if (!paid.apply) throw new Error('expected apply');
    expect(paid.changes.status).toBe('active');
  });

  it('maps subscription.updated stripe statuses and ignores unknown ones', () => {
    const updated = reduceBillingEvent(
      trialing,
      event({ type: 'customer.subscription.updated', stripeStatus: 'past_due' }),
    );
    if (!updated.apply) throw new Error('expected apply');
    expect(updated.changes.status).toBe('past_due');

    const unknown = reduceBillingEvent(
      trialing,
      event({ type: 'customer.subscription.updated', stripeStatus: 'paused' }),
    );
    expect(unknown.apply).toBe(false);
  });

  it('subscription.deleted cancels with a canceledAt stamp', () => {
    const result = reduceBillingEvent(trialing, event({ type: 'customer.subscription.deleted' }));
    if (!result.apply) throw new Error('expected apply');
    expect(result.changes.status).toBe('canceled');
    expect(result.changes.canceledAt).toEqual(T1);
  });
});

describe('access rules', () => {
  it('trialing grants access only until trialEndsAt', () => {
    const end = new Date('2026-08-08T10:00:00Z');
    expect(hasActiveAccess('trialing', end, T0)).toBe(true);
    expect(hasActiveAccess('trialing', end, new Date('2026-08-09T10:00:00Z'))).toBe(false);
  });

  it('past_due pauses access; active grants it', () => {
    expect(hasActiveAccess('past_due', null, T0)).toBe(false);
    expect(hasActiveAccess('active', null, T0)).toBe(true);
  });
});

describe('cooling-off and months used', () => {
  it('cooling-off covers 14 days from first payment', () => {
    const paid = new Date('2026-08-01T00:00:00Z');
    expect(withinCoolingOff(paid, new Date('2026-08-14T23:00:00Z'), 14)).toBe(true);
    expect(withinCoolingOff(paid, new Date('2026-08-16T00:00:00Z'), 14)).toBe(false);
    expect(withinCoolingOff(null, T0, 14)).toBe(false);
  });

  it('counts a started month as used', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    expect(monthsUsed(start, new Date('2026-01-02T00:00:00Z'))).toBe(1);
    expect(monthsUsed(start, new Date('2026-07-01T00:00:00Z'))).toBe(6);
    expect(monthsUsed(start, start)).toBe(0);
  });
});
