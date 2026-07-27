/**
 * Engine configuration (BUILD-PHASE-3). Thresholds live in config, not code —
 * every number here is a tunable ratified at a phase gate, not a magic
 * constant buried in logic.
 */
export const ENGINE_CONFIG = {
  mastery: {
    /** m ≥ this ⇒ "progressing" */
    progressing: 0.55,
    /** m ≥ this ⇒ case cracked (sets solvedAt, enters long-term review) */
    cracked: 0.8,
    /** m < this after ≥ minAttempts ⇒ "needs a different way in" (P1) */
    differentWayBelow: 0.4,
    differentWayMinAttempts: 10,
    /** Mastery decays toward this fraction of itself… */
    decayFloorFactor: 0.6,
    /** …over this many days without practice, applied lazily at read time. */
    decayDays: 45,
    baseAlpha: 0.15,
    teachbackBump: 0.03,
  },
  band: {
    /** P5: target success band, rolling. */
    min: 0.7,
    max: 0.85,
    windowSize: 10,
  },
  scheduler: {
    /** Child-tuned opening ladder. */
    firstIntervals: [1, 3, 7] as const,
    /** A child sitting an exam cannot be told "see you in 6 months". */
    maxIntervalDays: 21,
    /** Exam-horizon compression: intervals also capped at daysUntilExam / this. */
    examHorizonDivisor: 4,
    easeGain: 0.05,
    easeMax: 2.6,
    easeLoss: 0.2,
    easeMin: 1.3,
    /** Daily review load cap; overflow rolls forward silently. */
    dailyReviewCap: 12,
  },
  session: {
    /** D2: hard cap. A parent setting may SHORTEN this (min below), never lengthen. */
    capMinutes: 15,
    parentMinimumMinutes: 10,
    /** New items stop this many minutes before the cap; closer + wind-down follow. */
    softStopBeforeCapMinutes: 2,
    /** Warm-up composition (P2): due review units + word cards. */
    warmupReviewUnitsMin: 4,
    warmupReviewUnitsMax: 6,
    warmupWordCards: 3,
    /** A day is "active" for streaks at ≥ this many minutes. */
    activeDayMinutes: 5,
  },
  frustration: {
    /** After this many consecutive misses: next item one tier easier + offer a Mode revisit. */
    easeAndOfferAt: 2,
    /** After this many: end the activity on the encouraging transition. Never a 4th. */
    breakAt: 3,
  },
  streak: {
    /** A streak week is intact with ≥ this many active days… */
    activeDaysRequired: 5,
    /** …which leaves exactly this many automatic, invisible forgiveness days. */
    forgivenessDays: 2,
  },
} as const;
