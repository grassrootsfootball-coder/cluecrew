import { describe, expect, it } from 'vitest';
import { INTENSITY_MATRIX } from './intensity';
import {
  computeReadiness,
  earlyHalfAvailable,
  hardFloorSatisfied,
  reachableRung,
  type ReadinessInput,
} from './readiness';
import { PENDING_VERIFICATION, type Blueprint } from './blueprints';

const blueprint: Blueprint = {
  id: 'test',
  district: 'VR',
  variant: 'full',
  title: 'Test',
  sections: [
    {
      instructions: 'Read each question. Choose one answer. Mark it clearly.',
      questionCount: 6,
      typeMix: { 'vr-a': 2, 'vr-b': 2, 'vr-c': 2 },
      minutes: 10,
    },
  ],
  notes: 'test',
  verifiedBy: PENDING_VERIFICATION,
  verifiedAt: null,
  sourceRef: 'test',
};

function input(overrides: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    blueprint,
    caseFiles: [
      { questionTypeId: 'vr-a', masteryLevel: 0.85, cracked: true },
      { questionTypeId: 'vr-b', masteryLevel: 0.7, cracked: false },
      { questionTypeId: 'vr-c', masteryLevel: 0.6, cracked: false },
    ],
    districtCaseCount: 3,
    bossRoundOutcomes: [true, true, false, true],
    streakWeeksInWindow: 4,
    completedHalfPaper: false,
    ...overrides,
  };
}

describe('computeReadiness', () => {
  it('HALF needs full coverage at progressing, 40% cracked, 50% transfer', () => {
    const readiness = computeReadiness(
      input({
        caseFiles: [
          { questionTypeId: 'vr-a', masteryLevel: 0.85, cracked: true },
          { questionTypeId: 'vr-b', masteryLevel: 0.85, cracked: true },
          { questionTypeId: 'vr-c', masteryLevel: 0.6, cracked: false },
        ],
      }),
    );
    expect(readiness.coveragePct).toBe(100);
    expect(readiness.crackedPct).toBe(67);
    expect(readiness.transferPct).toBe(75);
    expect(readiness.rung).toBe('half'); // FULL needs a completed half paper
  });

  it('FULL requires the completed half paper', () => {
    const strong = input({
      caseFiles: [
        { questionTypeId: 'vr-a', masteryLevel: 0.9, cracked: true },
        { questionTypeId: 'vr-b', masteryLevel: 0.9, cracked: true },
        { questionTypeId: 'vr-c', masteryLevel: 0.9, cracked: true },
      ],
      bossRoundOutcomes: Array(20).fill(true),
    });
    expect(computeReadiness(strong).rung).toBe('half');
    expect(computeReadiness({ ...strong, completedHalfPaper: true }).rung).toBe('full');
  });

  it('one type below progressing keeps the ladder locked, and names it', () => {
    const readiness = computeReadiness(
      input({
        caseFiles: [
          { questionTypeId: 'vr-a', masteryLevel: 0.9, cracked: true },
          { questionTypeId: 'vr-b', masteryLevel: 0.9, cracked: true },
          { questionTypeId: 'vr-c', masteryLevel: 0.4, cracked: false },
        ],
      }),
    );
    expect(readiness.rung).toBe('locked');
    expect(readiness.typesStillBuilding).toEqual(['vr-c']);
  });

  it('no boss round history means zero transfer, not a free pass', () => {
    expect(computeReadiness(input({ bossRoundOutcomes: [] })).transferPct).toBe(0);
  });
});

describe('the hard floor — a fairness law, not a setting', () => {
  it('an untaught blueprint type fails the floor and is named', () => {
    const result = hardFloorSatisfied(blueprint, new Set(['vr-a', 'vr-b']));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.untaughtTypes).toEqual(['vr-c']);
  });

  it('every type taught passes', () => {
    expect(hardFloorSatisfied(blueprint, new Set(['vr-a', 'vr-b', 'vr-c'])).ok).toBe(true);
  });
});

describe('the intensity clamp and the early request', () => {
  const halfReady = computeReadiness(
    input({
      caseFiles: [
        { questionTypeId: 'vr-a', masteryLevel: 0.9, cracked: true },
        { questionTypeId: 'vr-b', masteryLevel: 0.9, cracked: true },
        { questionTypeId: 'vr-c', masteryLevel: 0.6, cracked: false },
      ],
    }),
  );

  it('foundations locks the ladder whatever readiness says', () => {
    expect(reachableRung(halfReady, INTENSITY_MATRIX.foundations)).toBe('locked');
  });

  it('the building column caps at half', () => {
    expect(reachableRung(halfReady, INTENSITY_MATRIX.building)).toBe('half');
  });

  it('early half request needs the floor met and the ladder unlocked', () => {
    const locked = computeReadiness(input({ bossRoundOutcomes: [false, false, false] }));
    expect(locked.rung).toBe('locked');
    expect(earlyHalfAvailable(locked, INTENSITY_MATRIX.building)).toBe(true);
    // …but never below the hard floor:
    const untaught = computeReadiness(
      input({ caseFiles: [{ questionTypeId: 'vr-a', masteryLevel: 0.9, cracked: true }] }),
    );
    expect(earlyHalfAvailable(untaught, INTENSITY_MATRIX.building)).toBe(false);
    // …and never in a locked column:
    expect(earlyHalfAvailable(locked, INTENSITY_MATRIX.foundations)).toBe(false);
  });
});
