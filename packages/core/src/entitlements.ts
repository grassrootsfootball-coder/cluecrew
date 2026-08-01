/**
 * The entitlements layer (AMENDMENT-1 §5.1) — the single map from tier to
 * capability. Every feature checks HERE, at the API layer; no tier logic may
 * live scattered in UI, and no child-facing surface may ever reflect any of
 * it as money (D7: the child never sees a paywall, price, upsell, lock-out
 * moment, or any signal that money exists).
 *
 * CREW is the absence of a subscription: the genuine free front door.
 * Pedagogy is never crippled — a free-tier Case carries all five Modes, the
 * same mascot, voice and juice; Crew and Full Crew children inhabit the same
 * world with different amounts of it open.
 */

export type EntitlementTier = 'CREW' | 'FULL' | 'PLUS' | 'SUMMER';

export interface Entitlements {
  tier: EntitlementTier;
  /** false = only Cases flagged freeTier open; locked ones render exactly
   *  like unbuilt district doors (D7). */
  allCases: boolean;
  /** The readiness ladder and every paper on it (Addenda B/C). */
  mockLadder: boolean;
  /** Phase 6 feature; the flag exists so the door is ready. */
  writingRoom: boolean;
  dashboardDepth: 'light' | 'full';
  emailCadence: 'monthly' | 'weekly';
  /** Crew Plus only (§3). */
  teacherReview: boolean;
  /** Boss Rounds per week; null = every session (D2 untouched either way). */
  bossRoundsPerWeek: number | null;
  /** Word Vault collect-cards per day — the Crew daily drip (§1). */
  wordCardsPerDay: number;
}

const CREW: Entitlements = {
  tier: 'CREW',
  allCases: false,
  mockLadder: false,
  writingRoom: false,
  dashboardDepth: 'light',
  emailCadence: 'monthly',
  teacherReview: false,
  bossRoundsPerWeek: 1,
  wordCardsPerDay: 3,
};

const FULL: Entitlements = {
  tier: 'FULL',
  allCases: true,
  mockLadder: true,
  writingRoom: true,
  dashboardDepth: 'full',
  emailCadence: 'weekly',
  teacherReview: false,
  bossRoundsPerWeek: null,
  wordCardsPerDay: 3,
};

const MATRIX: Record<EntitlementTier, Entitlements> = {
  CREW,
  FULL,
  PLUS: { ...FULL, tier: 'PLUS', teacherReview: true },
  // The Summer Intensive is the final-stretch preset (Addendum D §4) with
  // Full Crew access for its 8 weeks.
  SUMMER: { ...FULL, tier: 'SUMMER' },
};

export interface SubscriptionLike {
  tier: 'FULL_24' | 'FULL_12' | 'FULL_ROLLING' | 'PLUS_ROLLING' | 'SUMMER';
  status: string; // trialing | active | past_due | canceled
  trialEndsAt: Date | null;
}

/**
 * The one mapping. No subscription — or one that has lapsed — is CREW, never
 * a lock-out: free is a real tier, not a punishment state. Bursary places
 * need no branch AT ALL: they hold tier FULL_24, so they are Full Crew by the
 * same arithmetic as everyone else — the isBursary flag is never read here,
 * which is exactly what "identical product" means (§1, and the isolation
 * guard enforces it). `past_due` keeps access while dunning runs (L5).
 */
export function entitlementsFor(
  subscription: SubscriptionLike | null,
  now: Date = new Date(),
): Entitlements {
  if (!subscription) return MATRIX.CREW;
  const live =
    subscription.status === 'active' ||
    subscription.status === 'past_due' ||
    (subscription.status === 'trialing' &&
      subscription.trialEndsAt !== null &&
      subscription.trialEndsAt.getTime() > now.getTime());
  if (!live) return MATRIX.CREW;
  switch (subscription.tier) {
    case 'PLUS_ROLLING':
      return MATRIX.PLUS;
    case 'SUMMER':
      return MATRIX.SUMMER;
    default:
      return MATRIX.FULL;
  }
}

export function entitlementsForTier(tier: EntitlementTier): Entitlements {
  return MATRIX[tier];
}
