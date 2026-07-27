/**
 * Rank progression (manifesto §7). Order is canonical; thresholds are the
 * Phase 1 placeholder config to be ratified with real pacing data.
 * Competition is self-competition only (D3) — ranks never compare children.
 */
export const RANKS = [
  'TRAINEE',
  'JUNIOR_DETECTIVE',
  'DETECTIVE',
  'SENIOR_DETECTIVE',
  'CHIEF_INSPECTOR',
] as const;

export type Rank = (typeof RANKS)[number];

/** Cases cracked required to reach each rank. */
export const RANK_THRESHOLDS: Record<Rank, number> = {
  TRAINEE: 0,
  JUNIOR_DETECTIVE: 3,
  DETECTIVE: 8,
  SENIOR_DETECTIVE: 15,
  CHIEF_INSPECTOR: 21,
};

export function rankForCasesCracked(casesCracked: number): Rank {
  let current: Rank = 'TRAINEE';
  for (const rank of RANKS) {
    if (casesCracked >= RANK_THRESHOLDS[rank]) current = rank;
  }
  return current;
}

/** Child-facing rank labels (reading age ≤9, warm, never babyish). */
export const RANK_LABELS: Record<Rank, string> = {
  TRAINEE: 'Trainee',
  JUNIOR_DETECTIVE: 'Junior Detective',
  DETECTIVE: 'Detective',
  SENIOR_DETECTIVE: 'Senior Detective',
  CHIEF_INSPECTOR: 'Chief Inspector',
};
