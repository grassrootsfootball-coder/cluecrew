import { describe, expect, it } from 'vitest';
import {
  BURSARY_UNLOCK_RATIO,
  COOLING_OFF_DAYS,
  PRICING,
  TRIAL_DAYS,
  bursaryCapacity,
  fairExitChargePence,
  formatPence,
  recommendTier,
  remainingCommitmentPence,
} from './pricing';

describe('ratified pricing table (BUILD-PHASE-2 §1)', () => {
  it('matches the ratified amounts and total contract values', () => {
    expect(PRICING.TWO_YEAR.amountPence).toBe(899);
    expect(PRICING.TWO_YEAR.totalContractValuePence).toBe(21576);
    expect(PRICING.ONE_YEAR.amountPence).toBe(1299);
    expect(PRICING.ONE_YEAR.totalContractValuePence).toBe(15588);
    expect(PRICING.SUMMER.amountPence).toBe(6900);
    expect(PRICING.SUMMER.totalContractValuePence).toBe(6900);
    expect(PRICING.BURSARY.amountPence).toBe(0);
  });

  it('TCV is internally consistent for monthly tiers', () => {
    for (const tier of ['TWO_YEAR', 'ONE_YEAR'] as const) {
      const pricing = PRICING[tier];
      expect(pricing.totalContractValuePence).toBe(pricing.amountPence * pricing.commitmentMonths);
    }
  });

  it('bursary matches the TWO_YEAR term', () => {
    expect(PRICING.BURSARY.commitmentMonths).toBe(PRICING.TWO_YEAR.commitmentMonths);
  });

  it('trial and cooling-off constants are the ratified ones', () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(COOLING_OFF_DAYS).toBe(14);
  });

  it('formats pence as pounds', () => {
    expect(formatPence(21576)).toBe('£215.76');
    expect(formatPence(899)).toBe('£8.99');
  });
});

describe('fair-exit formula (gate checklist #3)', () => {
  it('charges the tier-rate difference for months used on TWO_YEAR', () => {
    // £12.99 − £8.99 = £4.00/month used
    expect(fairExitChargePence('TWO_YEAR', 6)).toBe(6 * 400);
    expect(fairExitChargePence('TWO_YEAR', 1)).toBe(400);
  });

  it('never exceeds the ONE_YEAR commitment window', () => {
    expect(fairExitChargePence('TWO_YEAR', 18)).toBe(12 * 400);
  });

  it('is zero for tiers with no shorter monthly tier', () => {
    expect(fairExitChargePence('ONE_YEAR', 5)).toBe(0);
    expect(fairExitChargePence('SUMMER', 1)).toBe(0);
    expect(fairExitChargePence('BURSARY', 12)).toBe(0);
  });

  it('rounds partial months up (a started month counts)', () => {
    expect(fairExitChargePence('TWO_YEAR', 2.2)).toBe(3 * 400);
  });

  it('rejects negative input', () => {
    expect(() => fairExitChargePence('TWO_YEAR', -1)).toThrow();
  });

  it('fair exit is always cheaper than paying out the remaining commitment early on', () => {
    for (let month = 1; month <= 11; month++) {
      expect(fairExitChargePence('TWO_YEAR', month)).toBeLessThan(
        remainingCommitmentPence('TWO_YEAR', month),
      );
    }
  });
});

describe('bursary capacity', () => {
  it('unlocks one place per ten paid subscriptions', () => {
    expect(BURSARY_UNLOCK_RATIO).toBe(10);
    expect(bursaryCapacity(0)).toBe(0);
    expect(bursaryCapacity(9)).toBe(0);
    expect(bursaryCapacity(10)).toBe(1);
    expect(bursaryCapacity(35)).toBe(3);
  });
});

describe('programme recommendation (§3.4, advisory only)', () => {
  it('recommends 2-Year Crew for Year 4', () => {
    expect(recommendTier(4, new Date('2026-01-10')).tier).toBe('TWO_YEAR');
  });

  it('recommends 1-Year Crew for Year 5', () => {
    expect(recommendTier(5, new Date('2026-02-10')).tier).toBe('ONE_YEAR');
  });

  it('adds a Summer note for post-Easter Year 5', () => {
    const recommendation = recommendTier(5, new Date('2026-05-10'));
    expect(recommendation.tier).toBe('ONE_YEAR');
    expect(recommendation.note).toBeTruthy();
  });
});
