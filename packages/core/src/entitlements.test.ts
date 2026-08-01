import { describe, expect, it } from 'vitest';
import { entitlementsFor, entitlementsForTier, type SubscriptionLike } from './entitlements';

const NOW = new Date('2026-08-01T10:00:00Z');

function sub(overrides: Partial<SubscriptionLike>): SubscriptionLike {
  return { tier: 'FULL_12', status: 'active', trialEndsAt: null, ...overrides };
}

describe('the tier × capability matrix (Amendment 1 gate #1)', () => {
  it('CREW: free-tier cases only, no mocks, no Writing Room, light dashboard, monthly email', () => {
    const crew = entitlementsFor(null, NOW);
    expect(crew).toMatchObject({
      tier: 'CREW',
      allCases: false,
      mockLadder: false,
      writingRoom: false,
      dashboardDepth: 'light',
      emailCadence: 'monthly',
      teacherReview: false,
      bossRoundsPerWeek: 1,
    });
  });

  it('FULL (all three terms): everything except the teacher review', () => {
    for (const tier of ['FULL_24', 'FULL_12', 'FULL_ROLLING'] as const) {
      const full = entitlementsFor(sub({ tier }), NOW);
      expect(full).toMatchObject({
        tier: 'FULL',
        allCases: true,
        mockLadder: true,
        writingRoom: true,
        dashboardDepth: 'full',
        emailCadence: 'weekly',
        teacherReview: false,
        bossRoundsPerWeek: null,
      });
    }
  });

  it('PLUS: Full Crew plus the teacher review', () => {
    const plus = entitlementsFor(sub({ tier: 'PLUS_ROLLING' }), NOW);
    expect(plus.teacherReview).toBe(true);
    expect(plus.allCases).toBe(true);
    expect(plus.mockLadder).toBe(true);
  });

  it('SUMMER: Full Crew access, no teacher review', () => {
    const summer = entitlementsFor(sub({ tier: 'SUMMER' }), NOW);
    expect(summer.allCases).toBe(true);
    expect(summer.teacherReview).toBe(false);
  });

  it('bursary: Full Crew by the same arithmetic — the flag is never read (§1)', () => {
    // A bursary subscription is tier FULL_24; entitlements cannot even SEE
    // isBursary, which is the isolation guarantee in type form.
    const bursary = entitlementsFor(sub({ tier: 'FULL_24' }), NOW);
    expect(bursary).toEqual(entitlementsForTier('FULL'));
  });
});

describe('lapse behaviour — free is a tier, never a punishment', () => {
  it('no subscription is CREW', () => {
    expect(entitlementsFor(null, NOW).tier).toBe('CREW');
  });

  it('a canceled subscription is CREW, not a lock-out', () => {
    expect(entitlementsFor(sub({ status: 'canceled' }), NOW).tier).toBe('CREW');
  });

  it('an expired trial is CREW — free never converts to paid silently', () => {
    expect(
      entitlementsFor(
        sub({ status: 'trialing', trialEndsAt: new Date('2026-07-01T00:00:00Z') }),
        NOW,
      ).tier,
    ).toBe('CREW');
  });

  it('a live trial previews FULL', () => {
    expect(
      entitlementsFor(
        sub({ status: 'trialing', trialEndsAt: new Date('2026-08-05T00:00:00Z') }),
        NOW,
      ).tier,
    ).toBe('FULL');
  });

  it('past_due keeps access while dunning runs — a failed card is not a cliff', () => {
    expect(entitlementsFor(sub({ status: 'past_due' }), NOW).tier).toBe('FULL');
  });
});

describe('what never differs by tier (D7 corollaries)', () => {
  it('word-card drip, and by omission: no streak/mascot/juice fields exist here at all', () => {
    const crew = entitlementsFor(null, NOW);
    const plus = entitlementsFor(sub({ tier: 'PLUS_ROLLING' }), NOW);
    expect(crew.wordCardsPerDay).toBe(plus.wordCardsPerDay);
    // Session caps, streaks, mascot and juice are deliberately NOT
    // capabilities: they cannot vary by tier because the matrix cannot
    // express them.
    expect(Object.keys(crew)).not.toContain('sessionCapMinutes');
    expect(Object.keys(crew)).not.toContain('streak');
  });
});
