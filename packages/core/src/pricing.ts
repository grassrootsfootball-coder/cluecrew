/**
 * RATIFIED PRICING — BUILD-PHASE-2 §1. This file is the single source of
 * truth; prices are hardcoded nowhere else. Changes require David's sign-off
 * recorded in the BUILD-PHASE-2 changelog.
 *
 * All amounts are integer pence, VAT-inclusive.
 */

export type PaidTier = 'TWO_YEAR' | 'ONE_YEAR' | 'SUMMER';
export type PricedTier = PaidTier | 'BURSARY';

export interface TierPricing {
  tier: PricedTier;
  /** Parent-facing tier name. */
  displayName: string;
  /** Pence per billing period (monthly for subscriptions, once for SUMMER). */
  amountPence: number;
  billing: 'monthly' | 'one_off' | 'free';
  /** Commitment length in months (SUMMER: the 8-week programme ≈ 2 months). */
  commitmentMonths: number;
  /** Total contract value in pence — displayed before purchase (DMCC, L5). */
  totalContractValuePence: number;
  stripeProductKey: string | null;
}

export const PRICING: Record<PricedTier, TierPricing> = {
  TWO_YEAR: {
    tier: 'TWO_YEAR',
    displayName: '2-Year Crew',
    amountPence: 899,
    billing: 'monthly',
    commitmentMonths: 24,
    totalContractValuePence: 21576,
    stripeProductKey: 'cluecrew_2yr',
  },
  ONE_YEAR: {
    tier: 'ONE_YEAR',
    displayName: '1-Year Crew',
    amountPence: 1299,
    billing: 'monthly',
    commitmentMonths: 12,
    totalContractValuePence: 15588,
    stripeProductKey: 'cluecrew_1yr',
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
    commitmentMonths: 24, // matches TWO_YEAR term
    totalContractValuePence: 0,
    stripeProductKey: null,
  },
};

/** Trial: 7 days, all paid tiers, NO card required (deliberate positioning). */
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

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Fair-exit formula (BUILD-PHASE-2 §2.4): a parent cancelling before
 * `commitmentEndsAt` may, instead of paying out the remaining commitment,
 * pay the difference between their tier's monthly rate and the shorter
 * tier's rate for the months they have used.
 *
 * Interpretation ratified with the pricing table:
 *  - TWO_YEAR → shorter monthly tier is ONE_YEAR: charge is
 *    monthsUsed × (£12.99 − £8.99).
 *  - ONE_YEAR → no shorter monthly tier exists, so the fair-exit charge is
 *    zero: the parent simply stops after the months already paid.
 *  - SUMMER and BURSARY → one-off/free: nothing further is payable.
 *
 * The formula is displayed at checkout, not only at cancellation.
 */
export function fairExitChargePence(tier: PricedTier, monthsUsed: number): number {
  if (monthsUsed < 0 || !Number.isFinite(monthsUsed)) throw new Error('monthsUsed must be ≥ 0');
  const whole = Math.ceil(monthsUsed);
  if (tier === 'TWO_YEAR') {
    const delta = PRICING.ONE_YEAR.amountPence - PRICING.TWO_YEAR.amountPence;
    return Math.min(whole, PRICING.ONE_YEAR.commitmentMonths) * delta;
  }
  return 0;
}

/** Remaining commitment if the parent pays out instead of the fair exit. */
export function remainingCommitmentPence(tier: PricedTier, monthsUsed: number): number {
  const pricing = PRICING[tier];
  if (pricing.billing !== 'monthly') return 0;
  const remaining = Math.max(0, pricing.commitmentMonths - Math.ceil(monthsUsed));
  return remaining * pricing.amountPence;
}

/**
 * Programme recommendation (BUILD-PHASE-2 §3.4). Advisory only — all tiers
 * are always shown; never dark-patterned.
 */
export function recommendTier(yearGroup: number, now: Date): { tier: PaidTier; note?: string } {
  if (yearGroup <= 4) return { tier: 'TWO_YEAR' };
  if (yearGroup === 5) {
    const postEaster = now.getMonth() >= 3; // April onwards
    return postEaster
      ? { tier: 'ONE_YEAR', note: 'With the exam close, many families add the Summer Intensive.' }
      : { tier: 'ONE_YEAR' };
  }
  return { tier: 'ONE_YEAR' };
}
