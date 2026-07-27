/**
 * Synthetic learner profiles (BUILD-PHASE-3 §10). Each profile is a latent
 * ability on the 1–5 tier scale that grows with practice toward a ceiling,
 * plus an attendance pattern. Deterministic via a seeded PRNG so CI is stable.
 */

export interface LearnerProfile {
  name: string;
  startAbility: number;
  maxAbility: number;
  /** Ability moves this fraction of the remaining gap per practice attempt. */
  learnRate: number;
  /** Daily performance noise amplitude (erratic children have moods). */
  noise: number;
  /** Attendance: given the day index, does the child practise today? */
  attends(day: number, random: () => number): boolean;
}

export const PROFILES: LearnerProfile[] = [
  {
    name: 'fast',
    startAbility: 2.2,
    maxAbility: 4.6,
    learnRate: 0.02,
    noise: 0.02,
    attends: () => true,
  },
  {
    name: 'average',
    startAbility: 1.6,
    maxAbility: 3.6,
    learnRate: 0.012,
    noise: 0.03,
    attends: () => true,
  },
  {
    name: 'struggling',
    startAbility: 1.0,
    maxAbility: 2.4,
    learnRate: 0.008,
    noise: 0.03,
    attends: () => true,
  },
  {
    name: 'erratic',
    startAbility: 1.6,
    maxAbility: 3.6,
    learnRate: 0.012,
    noise: 0.15,
    attends: (_day, random) => random() < 0.55,
  },
  {
    name: 'absent-3-days',
    startAbility: 1.6,
    maxAbility: 3.6,
    learnRate: 0.012,
    noise: 0.03,
    // A recurring 3-day absence: days 0–6 attend, 7–9 away, repeat.
    attends: (day) => day % 10 < 7,
  },
  {
    name: 'absent-30-days',
    startAbility: 1.6,
    maxAbility: 3.6,
    learnRate: 0.012,
    noise: 0.03,
    // A whole month away in the middle of the programme.
    attends: (day) => day < 30 || day >= 60,
  },
];

/** Probability of answering an item at `tier` correctly. */
export function pCorrect(ability: number, tier: number, moodOffset: number): number {
  const p = 0.78 + 0.13 * (ability - tier) + moodOffset;
  return Math.min(0.97, Math.max(0.1, p));
}

/** mulberry32 — small deterministic PRNG for reproducible simulations. */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
