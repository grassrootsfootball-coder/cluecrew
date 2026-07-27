/**
 * Rank progression (manifesto §7; BUILD-PHASE-3 §7). Ranks advance on cases
 * cracked + review consistency, never on volume alone — grinding easy items
 * must not rank a child up. Rank never decreases (D-laws: no loss mechanics).
 * Competition is self-competition only (D3).
 */
export const RANKS = [
  'TRAINEE',
  'JUNIOR_DETECTIVE',
  'DETECTIVE',
  'SENIOR_DETECTIVE',
  'CHIEF_INSPECTOR',
] as const;

export type Rank = (typeof RANKS)[number];

export interface RankInputs {
  casesCracked: number;
  streakWeeks: number;
  taughtBackCount: number;
  bossCaseParticipated: boolean;
}

interface RankRequirement {
  casesCracked: number;
  streakWeeks?: number;
  taughtBackCount?: number;
  bossCaseParticipated?: boolean;
}

/** Config, not code — ratified thresholds (§7). */
export const RANK_REQUIREMENTS: Record<Exclude<Rank, 'TRAINEE'>, RankRequirement> = {
  JUNIOR_DETECTIVE: { casesCracked: 3 },
  DETECTIVE: { casesCracked: 7, streakWeeks: 2 },
  SENIOR_DETECTIVE: { casesCracked: 12, taughtBackCount: 1 },
  CHIEF_INSPECTOR: { casesCracked: 18, bossCaseParticipated: true },
};

function meets(inputs: RankInputs, requirement: RankRequirement): boolean {
  return (
    inputs.casesCracked >= requirement.casesCracked &&
    inputs.streakWeeks >= (requirement.streakWeeks ?? 0) &&
    inputs.taughtBackCount >= (requirement.taughtBackCount ?? 0) &&
    (!requirement.bossCaseParticipated || inputs.bossCaseParticipated)
  );
}

export function computeRank(inputs: RankInputs): Rank {
  let earned: Rank = 'TRAINEE';
  for (const rank of RANKS.slice(1) as Array<Exclude<Rank, 'TRAINEE'>>) {
    if (meets(inputs, RANK_REQUIREMENTS[rank])) earned = rank;
    else break; // requirements are cumulative — no skipping
  }
  return earned;
}

/** Rank never decreases: apply the higher of current and newly computed. */
export function applyRank(current: Rank, computed: Rank): Rank {
  return RANKS.indexOf(computed) > RANKS.indexOf(current) ? computed : current;
}

/** Child-facing rank labels (reading age ≤9, warm, never babyish). */
export const RANK_LABELS: Record<Rank, string> = {
  TRAINEE: 'Trainee',
  JUNIOR_DETECTIVE: 'Junior Detective',
  DETECTIVE: 'Detective',
  SENIOR_DETECTIVE: 'Senior Detective',
  CHIEF_INSPECTOR: 'Chief Inspector',
};
