import { RANKS, RANK_LABELS, RANK_REQUIREMENTS, type Rank } from '@cluecrew/core';

/**
 * What the child's own case file says about where they are and what is next.
 *
 * Framing rules, not decoration:
 *  - the next step is always ONE concrete thing they can do, never a
 *    percentage and never a bar that could read as a debt;
 *  - progress is against yesterday's self only — nothing here compares a
 *    child to any other child (D3);
 *  - nothing can go down. Rank never decreases, stamps never un-stamp, and
 *    the lantern is lit or relit, never broken (D2/D3).
 */

export interface CaseFileInputs {
  rank: Rank;
  casesCracked: number;
  streakWeeks: number;
  taughtBackCount: number;
  bossCaseParticipated: boolean;
}

export interface NextStep {
  /** The rank they are working toward, or null at the top. */
  nextRankLabel: string | null;
  /** One concrete, doable thing — child-facing, reading age ≤9. */
  line: string;
}

export function nextStepFor(inputs: CaseFileInputs): NextStep {
  const nextRank = RANKS[RANKS.indexOf(inputs.rank) + 1];
  if (!nextRank) {
    return {
      nextRankLabel: null,
      line: "Chief Inspector. There's no higher badge — the cases are yours now.",
    };
  }

  const label = RANK_LABELS[nextRank];
  const requirement = RANK_REQUIREMENTS[nextRank as Exclude<Rank, 'TRAINEE'>];

  if (inputs.casesCracked < requirement.casesCracked) {
    const gap = requirement.casesCracked - inputs.casesCracked;
    return {
      nextRankLabel: label,
      line: `Crack ${gap === 1 ? 'one more case' : `${gap} more cases`} and you make ${label}.`,
    };
  }
  if ((requirement.streakWeeks ?? 0) > inputs.streakWeeks) {
    return { nextRankLabel: label, line: `Keep the lantern lit a while longer and ${label} is yours.` };
  }
  if ((requirement.taughtBackCount ?? 0) > inputs.taughtBackCount) {
    return { nextRankLabel: label, line: `Teach me one case and you make ${label}.` };
  }
  if (requirement.bossCaseParticipated && !inputs.bossCaseParticipated) {
    return { nextRankLabel: label, line: `Take one big question at the end of a shift for ${label}.` };
  }
  return { nextRankLabel: label, line: `${label} is next.` };
}

/** The ladder, with the one they hold marked — a map, never a scoreboard. */
export function rankLadder(current: Rank): Array<{ label: string; held: boolean; current: boolean }> {
  const heldTo = RANKS.indexOf(current);
  return RANKS.map((rank, index) => ({
    label: RANK_LABELS[rank],
    held: index <= heldTo,
    current: index === heldTo,
  }));
}
