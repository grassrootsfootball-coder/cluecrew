import { describe, expect, it } from 'vitest';
import { applyRank, computeRank, type RankInputs } from './ranks';

const base: RankInputs = {
  casesCracked: 0,
  streakWeeks: 0,
  taughtBackCount: 0,
  bossCaseParticipated: false,
};

describe('computeRank (cases + consistency, never volume alone)', () => {
  it('advances Trainee → Junior at 3 cases', () => {
    expect(computeRank({ ...base, casesCracked: 2 })).toBe('TRAINEE');
    expect(computeRank({ ...base, casesCracked: 3 })).toBe('JUNIOR_DETECTIVE');
  });

  it('Detective needs 7 cases AND 2 streak-weeks — grinding cases alone is not enough', () => {
    expect(computeRank({ ...base, casesCracked: 10, streakWeeks: 1 })).toBe('JUNIOR_DETECTIVE');
    expect(computeRank({ ...base, casesCracked: 7, streakWeeks: 2 })).toBe('DETECTIVE');
  });

  it('Senior needs 12 cases + 1 taught-back; Chief needs 18 + boss-case participation', () => {
    expect(computeRank({ ...base, casesCracked: 12, streakWeeks: 2, taughtBackCount: 0 })).toBe('DETECTIVE');
    expect(computeRank({ ...base, casesCracked: 12, streakWeeks: 2, taughtBackCount: 1 })).toBe('SENIOR_DETECTIVE');
    expect(
      computeRank({ casesCracked: 18, streakWeeks: 2, taughtBackCount: 1, bossCaseParticipated: false }),
    ).toBe('SENIOR_DETECTIVE');
    expect(
      computeRank({ casesCracked: 18, streakWeeks: 2, taughtBackCount: 1, bossCaseParticipated: true }),
    ).toBe('CHIEF_INSPECTOR');
  });

  it('requirements are cumulative — no rank skipping', () => {
    // Meets Chief-style inputs but lacks the Detective streak requirement.
    expect(
      computeRank({ casesCracked: 20, streakWeeks: 0, taughtBackCount: 3, bossCaseParticipated: true }),
    ).toBe('JUNIOR_DETECTIVE');
  });
});

describe('applyRank — rank never decreases (no loss mechanics)', () => {
  it('keeps the higher of current and computed', () => {
    expect(applyRank('DETECTIVE', 'JUNIOR_DETECTIVE')).toBe('DETECTIVE');
    expect(applyRank('DETECTIVE', 'SENIOR_DETECTIVE')).toBe('SENIOR_DETECTIVE');
    expect(applyRank('CHIEF_INSPECTOR', 'TRAINEE')).toBe('CHIEF_INSPECTOR');
  });
});
