/**
 * RATIFIED PRICING — AMENDMENT-1 (Pricing V2), superseding BUILD-PHASE-2 §1.
 * This file is the single source of truth; prices are hardcoded nowhere
 * else. Changes require David's sign-off recorded in the manifesto changelog.
 *
 * The ladder (§1): Crew (free, forever, no card ever — the genuine front
 * door) · Full Crew on a commitment ladder under the £9.99 headline ·
 * Crew Plus (rolling, capacity-capped teacher review) · Crew Bursary
 * (Full Crew, identical product) · Summer Intensive (unchanged).
 *
 * D7 stands over all of it: nothing in this file may ever be rendered on a
 * child-facing surface.
 *
 * All amounts are integer pence, VAT-inclusive.
 */

export type PaidTier = 'FULL_24' | 'FULL_12' | 'FULL_ROLLING' | 'PLUS_ROLLING' | 'SUMMER';
export type PricedTier = PaidTier | 'CREW' | 'BURSARY';

export interface TierPricing {
  tier: PricedTier;
  /** Parent-facing tier name. */
  displayName: string;
  /** Pence per billing period (monthly for subscriptions, once for SUMMER). */
  amountPence: number;
  billing: 'monthly' | 'one_off' | 'free';
  /** Commitment length in months; 1 = rolling, cancel any month. */
  commitmentMonths: number;
  /** Total contract value in pence — displayed before purchase (DMCC, L5).
   *  Rolling tiers: one month, because that is the whole commitment. */
  totalContractValuePence: number;
  stripeProductKey: string | null;
}

export const PRICING: Record<PricedTier, TierPricing> = {
  CREW: {
    tier: 'CREW',
    displayName: 'Crew',
    amountPence: 0,
    billing: 'free',
    commitmentMonths: 0,
    totalContractValuePence: 0,
    stripeProductKey: null,
  },
  FULL_24: {
    tier: 'FULL_24',
    displayName: 'Full Crew — 24 months',
    amountPence: 849,
    billing: 'monthly',
    commitmentMonths: 24,
    totalContractValuePence: 20376,
    stripeProductKey: 'cluecrew_full_24',
  },
  FULL_12: {
    tier: 'FULL_12',
    displayName: 'Full Crew — 12 months',
    amountPence: 999,
    billing: 'monthly',
    commitmentMonths: 12,
    totalContractValuePence: 11988,
    stripeProductKey: 'cluecrew_full_12',
  },
  FULL_ROLLING: {
    tier: 'FULL_ROLLING',
    displayName: 'Full Crew — rolling monthly',
    amountPence: 1299,
    billing: 'monthly',
    commitmentMonths: 1,
    totalContractValuePence: 1299,
    stripeProductKey: 'cluecrew_full_rolling',
  },
  PLUS_ROLLING: {
    tier: 'PLUS_ROLLING',
    displayName: 'Crew Plus',
    amountPence: 2499,
    billing: 'monthly',
    commitmentMonths: 1,
    totalContractValuePence: 2499,
    stripeProductKey: 'cluecrew_plus_rolling',
  },
  SUMMER: {
    tier: 'SUMMER',
    displayName: 'Summer Intensive',
    amountPence: 6900,
    billing: 'one_off',
    commitmentMonths: 2,
    totalContractValuePence: 6900,
    stripeProductKey: 'cluecrew_summer',
  },
  BURSARY: {
    tier: 'BURSARY',
    displayName: 'Crew Bursary',
    amountPence: 0,
    billing: 'free',
    commitmentMonths: 24, // matches FULL_24's term
    totalContractValuePence: 0,
    stripeProductKey: null,
  },
};

/**
 * Crew IS the trial (§1) — this constant now names the optional Full Crew
 * PREVIEW: 7 days, no card, the existing pattern. Free never converts to
 * paid silently; there is no auto-upgrade path of any kind.
 */
export const TRIAL_DAYS = 7;

/** Cooling-off: 14-day full refund from first payment, self-serve. */
export const COOLING_OFF_DAYS = 14;

/** Renewal/conversion reminder offsets in days (DMCC, L5). */
export const REMINDER_OFFSETS_DAYS = [14, 3] as const;

/** One bursary place unlocked per this many paid subscriptions. */
export const BURSARY_UNLOCK_RATIO = 10;

export function bursaryCapacity(paidSubscriptionCount: number): number {
  return Math.floor(paidSubscriptionCount / BURSARY_UNLOCK_RATIO);
}

/** Additional children are free on the same subscription; hard cap. */
export const MAX_CHILD_PROFILES = 4;

/**
 * Crew Plus is capacity-capped to the teacher bench with a public waitlist
 * (§3). Launch bench: config, ratified with the bench contract. An
 * unfulfilled review month auto-credits this much of the Plus premium.
 */
export const PLUS_BENCH_CAPACITY = 20;
export const PLUS_MISSED_REVIEW_CREDIT_PENCE = 1500;

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Fair-exit formula (BUILD-PHASE-2 §2.4, unchanged in principle per the
 * amendment header; recomputed for the new prices): a parent cancelling
 * before `commitmentEndsAt` may, instead of paying out the remaining
 * commitment, pay the difference between their committed monthly rate and
 * the rate of the shorter tier that covers the months they have used.
 *
 *  - FULL_24 → the covering shorter tier is FULL_12 while ≤12 months are
 *    used (£9.99 − £8.49 = £1.50/month), FULL_ROLLING beyond that makes no
 *    sense inside 24 months of a 12-month alternative, so the 12-month rate
 *    caps the reference.
 *  - FULL_12 → the covering shorter tier is FULL_ROLLING:
 *    monthsUsed × (£12.99 − £9.99 = £3.00).
 *  - Rolling tiers, SUMMER, BURSARY, CREW → nothing further is ever payable.
 *
 * Displayed at checkout, not only at cancellation (DMCC).
 */
export function fairExitChargePence(tier: PricedTier, monthsUsed: number): number {
  if (monthsUsed < 0 || !Number.isFinite(monthsUsed)) throw new Error('monthsUsed must be ≥ 0');
  const whole = Math.ceil(monthsUsed);
  if (tier === 'FULL_24') {
    const delta = PRICING.FULL_12.amountPence - PRICING.FULL_24.amountPence;
    return Math.min(whole, PRICING.FULL_12.commitmentMonths) * delta;
  }
  if (tier === 'FULL_12') {
    const delta = PRICING.FULL_ROLLING.amountPence - PRICING.FULL_12.amountPence;
    return Math.min(whole, PRICING.FULL_12.commitmentMonths) * delta;
  }
  return 0;
}

/** Remaining commitment if the parent pays out instead of the fair exit. */
export function remainingCommitmentPence(tier: PricedTier, monthsUsed: number): number {
  const pricing = PRICING[tier];
  if (pricing.billing !== 'monthly' || pricing.commitmentMonths <= 1) return 0;
  const remaining = Math.max(0, pricing.commitmentMonths - Math.ceil(monthsUsed));
  return remaining * pricing.amountPence;
}

/**
 * Programme recommendation (Phase 2 §3.4 as amended). Advisory only — all
 * tiers are always shown, Crew included; never dark-patterned.
 */
export function recommendTier(yearGroup: number, now: Date): { tier: PaidTier; note?: string } {
  if (yearGroup <= 4) return { tier: 'FULL_24' };
  if (yearGroup === 5) {
    const postEaster = now.getMonth() >= 3; // April onwards
    return postEaster
      ? { tier: 'FULL_12', note: 'With the exam close, many families add the Summer Intensive.' }
      : { tier: 'FULL_12' };
  }
  return { tier: 'FULL_12' };
}
