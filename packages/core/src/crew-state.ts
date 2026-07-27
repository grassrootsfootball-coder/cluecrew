/**
 * getCrewState (BUILD-PHASE-3 §9): everything Crew HQ needs to render, as a
 * pure composition. The persistence layer gathers inputs; this decides.
 * Nothing here exposes forgiveness ledgers, backlog counts, or loss states.
 */
import { masteryStatus, type MasteryStatus } from './mastery';
import { applyRank, computeRank, RANK_LABELS, type Rank } from './ranks';
import { computeStreak, type DayActivity, type StreakView } from './streaks';

export interface CrewStateInputs {
  currentRank: Rank;
  casesCracked: number;
  taughtBackCount: number;
  bossCaseParticipated: boolean;
  streakWeeksTotal: number;
  dailyActivity: DayActivity[];
  weekStarts: Date[];
  now: Date;
  dueReviewCount: number;
  caseFiles: Array<{ caseId: string; title: string; masteryLevel: number; solvedAt: Date | null; taughtBack: boolean }>;
}

export interface CaseSummary {
  caseId: string;
  title: string;
  status: MasteryStatus;
  taughtBack: boolean;
}

export interface CrewState {
  rank: Rank;
  rankLabel: string;
  streak: StreakView;
  /** True when there is warm-up waiting — a number is deliberately absent (no debt anxiety). */
  hasReviewsDue: boolean;
  caseSummaries: CaseSummary[];
}

export function getCrewState(inputs: CrewStateInputs): CrewState {
  const computed = computeRank({
    casesCracked: inputs.casesCracked,
    streakWeeks: inputs.streakWeeksTotal,
    taughtBackCount: inputs.taughtBackCount,
    bossCaseParticipated: inputs.bossCaseParticipated,
  });
  const rank = applyRank(inputs.currentRank, computed);

  return {
    rank,
    rankLabel: RANK_LABELS[rank],
    streak: computeStreak(inputs.dailyActivity, inputs.weekStarts, inputs.now),
    hasReviewsDue: inputs.dueReviewCount > 0,
    caseSummaries: inputs.caseFiles.map((caseFile) => ({
      caseId: caseFile.caseId,
      title: caseFile.title,
      status: caseFile.solvedAt ? 'cracked' : masteryStatus(caseFile.masteryLevel),
      taughtBack: caseFile.taughtBack,
    })),
  };
}
