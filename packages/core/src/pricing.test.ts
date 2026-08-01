import { describe, expect, it } from 'vitest';
import {
  BURSARY_UNLOCK_RATIO,
  COOLING_OFF_DAYS,
  PLUS_MISSED_REVIEW_CREDIT_PENCE,
  PRICING,
  TRIAL_DAYS,
  bursaryCapacity,
  fairExitChargePence,
  formatPence,
  recommendTier,
  remainingCommitmentPence,
} from './pricing';

describe('ratified pricing ladder (Amendment 1 §1)', () => {
  it('matches the ratified amounts and total contract values', () => {
    expect(PRICING.CREW.amountPence).toBe(0);
    expect(PRICING.CREW.billing).toBe('free');
    expect(PRICING.FULL_24.amountPence).toBe(849);
    expect(PRICING.FULL_24.totalContractValuePence).toBe(20376);
    expect(PRICING.FULL_12.amountPence).toBe(999);
    expect(PRICING.FULL_12.totalContractValuePence).toBe(11988);
    expect(PRICING.FULL_ROLLING.amountPence).toBe(1299);
    expect(PRICING.FULL_ROLLING.totalContractValuePence).toBe(1299);
    expect(PRICING.PLUS_ROLLING.amountPence).toBe(2499);
    expect(PRICING.SUMMER.amountPence).toBe(6900);
    expect(PRICING.BURSARY.amountPence).toBe(0);
  });

  it('TCV is internally consistent for committed monthly tiers (DMCC)', () => {
    for (const tier of ['FULL_24', 'FULL_12'] as const) {
      const pricing = PRICING[tier];
      expect(pricing.totalContractValuePence).toBe(pricing.amountPence * pricing.commitmentMonths);
    }
    // Rolling tiers: TCV is one month, because that is the whole commitment.
    expect(PRICING.FULL_ROLLING.totalContractValuePence).toBe(PRICING.FULL_ROLLING.amountPence);
    expect(PRICING.PLUS_ROLLING.totalContractValuePence).toBe(PRICING.PLUS_ROLLING.amountPence);
  });

  it('bursary is Full Crew: term matches FULL_24, price is zero', () => {
    expect(PRICING.BURSARY.commitmentMonths).toBe(PRICING.FULL_24.commitmentMonths);
  });

  it('the preview and cooling-off constants are the ratified ones', () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(COOLING_OFF_DAYS).toBe(14);
    expect(PLUS_MISSED_REVIEW_CREDIT_PENCE).toBe(1500);
  });

  it('formats pence as pounds', () => {
    expect(formatPence(849)).toBe('£8.49');
    expect(formatPence(20376)).toBe('£203.76');
  });
});

describe('fair-exit formula (recomputed for the new prices, gate #3)', () => {
  it('FULL_24 exits at the 12-month rate difference for months used', () => {
    // £9.99 − £8.49 = £1.50 per month used.
    expect(fairExitChargePence('FULL_24', 6)).toBe(6 * 150);
    expect(fairExitChargePence('FULL_24', 1)).toBe(150);
  });

  it('never exceeds the 12-month reference window', () => {
    expect(fairExitChargePence('FULL_24', 18)).toBe(12 * 150);
  });

  it('FULL_12 exits at the rolling rate difference', () => {
    // £12.99 − £9.99 = £3.00 per month used.
    expect(fairExitChargePence('FULL_12', 5)).toBe(5 * 300);
  });

  it('rolling, Plus, Summer, Bursary and Crew owe nothing further', () => {
    for (const tier of ['FULL_ROLLING', 'PLUS_ROLLING', 'SUMMER', 'BURSARY', 'CREW'] as const) {
      expect(fairExitChargePence(tier, 6)).toBe(0);
    }
  });

  it('rounds partial months up (a started month counts)', () => {
    expect(fairExitChargePence('FULL_24', 2.2)).toBe(3 * 150);
  });

  it('rejects negative input', () => {
    expect(() => fairExitChargePence('FULL_24', -1)).toThrow();
  });

  it('fair exit is cheaper than paying out the remaining commitment through the early window', () => {
    // FULL_24 holds for the whole first year; FULL_12 crosses around month 9
    // (£3.00 × used vs £9.99 × remaining) — both are shown, the parent picks,
    // and the formula is a right, not a trap.
    for (let month = 1; month <= 11; month++) {
      expect(fairExitChargePence('FULL_24', month)).toBeLessThan(
        remainingCommitmentPence('FULL_24', month),
      );
    }
    for (let month = 1; month <= 9; month++) {
      expect(fairExitChargePence('FULL_12', month)).toBeLessThan(
        remainingCommitmentPence('FULL_12', month),
      );
    }
  });

  it('rolling tiers have no remaining commitment — two clicks and done', () => {
    expect(remainingCommitmentPence('FULL_ROLLING', 3)).toBe(0);
    expect(remainingCommitmentPence('PLUS_ROLLING', 3)).toBe(0);
    expect(remainingCommitmentPence('FULL_24', 20)).toBe(4 * 849);
  });
});

describe('bursary capacity and recommendation', () => {
  it('unlocks one place per ten paid subscriptions', () => {
    expect(BURSARY_UNLOCK_RATIO).toBe(10);
    expect(bursaryCapacity(0)).toBe(0);
    expect(bursaryCapacity(9)).toBe(0);
    expect(bursaryCapacity(10)).toBe(1);
    expect(bursaryCapacity(35)).toBe(3);
  });

  it('recommends the 24-month term young, the 12-month from Year 5', () => {
    expect(recommendTier(4, new Date('2026-01-10')).tier).toBe('FULL_24');
    expect(recommendTier(5, new Date('2026-02-10')).tier).toBe('FULL_12');
    expect(recommendTier(5, new Date('2026-05-10')).note).toContain('Summer');
    expect(recommendTier(6, new Date('2026-01-10')).tier).toBe('FULL_12');
  });
});
