import { describe, expect, it } from 'vitest';
import { calibrateItem } from './calibration';

function attempts(correct: number, total: number) {
  return Array.from({ length: total }, (_, i) => ({ correct: i < correct }));
}

describe('calibrateItem (empirical, volume-blended)', () => {
  it('returns null below the minimum attempt volume', () => {
    expect(calibrateItem(3, attempts(2, 4)).calibratedDifficulty).toBeNull();
  });

  it('thin data cannot yank an item far from its authored tier', () => {
    const result = calibrateItem(3, attempts(6, 6));
    expect(result.calibratedDifficulty).toBeGreaterThan(2);
    expect(result.driftFlagged).toBe(false);
  });

  it('flags a mis-tiered item once volume is convincing (gate #8: the QC net)', () => {
    // Authored tier 5 but nearly everyone gets it right → far too easy.
    const result = calibrateItem(5, attempts(96, 100));
    expect(result.calibratedDifficulty).toBeLessThan(3.5);
    expect(result.driftFlagged).toBe(true);
  });

  it('agrees with an accurately tiered item', () => {
    // Mid difficulty: half correct → empirical ≈ 3 on authored 3.
    const result = calibrateItem(3, attempts(50, 100));
    expect(result.driftFlagged).toBe(false);
    expect(result.calibratedDifficulty).toBeGreaterThan(2.5);
    expect(result.calibratedDifficulty).toBeLessThan(3.5);
  });
});
