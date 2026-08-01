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

describe('the Board is score-blind (STORY BIBLE §6: rank gates on SITTING, never score)', () => {
  it('holds structurally: no score can even be expressed to computeRank', () => {
    // RankInputs carries participation as a boolean of sitting. A child who
    // scored 20% and one who scored 95% produce IDENTICAL inputs — the type
    // has nowhere to put a score, which is the strongest possible guarantee.
    const inputs: RankInputs = {
      casesCracked: 18,
      streakWeeks: 4,
      taughtBackCount: 2,
      bossCaseParticipated: true, // sat it — that is all the Board reports
    };
    expect(Object.keys(inputs).some((key) => /score|percent|mark|correct/i.test(key))).toBe(false);
    const twentyPercentChild = computeRank({ ...inputs });
    const ninetyFivePercentChild = computeRank({ ...inputs });
    expect(twentyPercentChild).toBe('CHIEF_INSPECTOR');
    expect(ninetyFivePercentChild).toBe(twentyPercentChild);
  });

  it('sitting and not-yet-sitting differ only by the participation boolean', () => {
    const base = { casesCracked: 18, streakWeeks: 4, taughtBackCount: 2 };
    expect(computeRank({ ...base, bossCaseParticipated: true })).toBe('CHIEF_INSPECTOR');
    expect(computeRank({ ...base, bossCaseParticipated: false })).toBe('SENIOR_DETECTIVE');
  });
});
