import { describe, expect, it } from 'vitest';
import { getCrewState, type CrewStateInputs } from './crew-state';

const WEEK0 = new Date('2026-07-06T00:00:00Z');
const DAY = 86_400_000;

const base: CrewStateInputs = {
  currentRank: 'TRAINEE',
  casesCracked: 3,
  taughtBackCount: 0,
  bossCaseParticipated: false,
  streakWeeksTotal: 0,
  dailyActivity: Array.from({ length: 5 }, (_, i) => ({
    date: new Date(WEEK0.getTime() + i * DAY),
    minutesActive: 12,
  })),
  weekStarts: [WEEK0],
  now: new Date(WEEK0.getTime() + 8 * DAY),
  dueReviewCount: 7,
  caseFiles: [
    { caseId: 'case-vr-11', title: 'The Counting Culprit', masteryLevel: 0.9, solvedAt: new Date(), taughtBack: true },
    { caseId: 'case-vr-08', title: 'The Wandering Letter', masteryLevel: 0.6, solvedAt: null, taughtBack: false },
    { caseId: 'case-vr-09', title: 'The Alphabet Trail', masteryLevel: 0.2, solvedAt: null, taughtBack: false },
  ],
};

describe('getCrewState', () => {
  it('computes rank (never decreasing) and warm streak view', () => {
    const state = getCrewState(base);
    expect(state.rank).toBe('JUNIOR_DETECTIVE');
    expect(state.rankLabel).toBe('Junior Detective');
    expect(state.streak).toEqual({ state: 'alive', weeks: 1 });
  });

  it('never exposes a review backlog number — only that reviews are waiting', () => {
    const state = getCrewState(base);
    expect(state.hasReviewsDue).toBe(true);
    expect(JSON.stringify(state)).not.toContain('7');
  });

  it('keeps a higher existing rank even when inputs compute lower', () => {
    expect(getCrewState({ ...base, currentRank: 'DETECTIVE', casesCracked: 0 }).rank).toBe('DETECTIVE');
  });

  it('summarises cases with child-safe statuses', () => {
    const statuses = getCrewState(base).caseSummaries.map((summary) => summary.status);
    expect(statuses).toEqual(['cracked', 'progressing', 'not_yet']);
  });
});
