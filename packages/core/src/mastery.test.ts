import { describe, expect, it } from 'vitest';
import {
  MASTERY_THRESHOLD,
  isMastered,
  recommendDifficulty,
  updateMastery,
} from './mastery';

describe('updateMastery', () => {
  it('rises on correct attempts and stays within 0–1', () => {
    let mastery = 0;
    for (let i = 0; i < 50; i++) mastery = updateMastery(mastery, { correct: true, difficultyTier: 3 });
    expect(mastery).toBeGreaterThan(MASTERY_THRESHOLD);
    expect(mastery).toBeLessThanOrEqual(1);
  });

  it('falls on missed attempts and never goes below 0', () => {
    let mastery = 0.5;
    for (let i = 0; i < 50; i++) mastery = updateMastery(mastery, { correct: false, difficultyTier: 3 });
    expect(mastery).toBeGreaterThanOrEqual(0);
    expect(mastery).toBeLessThan(0.1);
  });

  it('weights harder items more strongly when correct', () => {
    const easy = updateMastery(0.5, { correct: true, difficultyTier: 1 });
    const hard = updateMastery(0.5, { correct: true, difficultyTier: 5 });
    expect(hard).toBeGreaterThan(easy);
  });

  it('does not grant mastery on exposure alone (P2)', () => {
    // A run of misses followed by a single correct answer stays far below threshold.
    let mastery = 0;
    for (let i = 0; i < 5; i++) mastery = updateMastery(mastery, { correct: false, difficultyTier: 2 });
    mastery = updateMastery(mastery, { correct: true, difficultyTier: 2 });
    expect(isMastered(mastery)).toBe(false);
  });
});

describe('recommendDifficulty (P5: 70–85% success band)', () => {
  it('holds on small samples', () => {
    expect(recommendDifficulty(0.2, 5)).toBe('hold');
    expect(recommendDifficulty(1, 7)).toBe('hold');
  });

  it('eases when sustained accuracy is below the band', () => {
    expect(recommendDifficulty(0.55, 12)).toBe('easier');
  });

  it('raises when sustained accuracy is above the band', () => {
    expect(recommendDifficulty(0.95, 12)).toBe('harder');
  });

  it('holds inside the band', () => {
    expect(recommendDifficulty(0.78, 12)).toBe('hold');
  });
});
