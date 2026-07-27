import { describe, expect, it } from 'vitest';
import { ENGINE_CONFIG } from './config';
import {
  applyDecay,
  applyTeachbackBump,
  isMastered,
  masteryStatus,
  needsDifferentWayIn,
  updateMastery,
} from './mastery';

describe('updateMastery (EMA with relative-difficulty α)', () => {
  it('rises on correct attempts, falls on misses, stays within 0–1', () => {
    let mastery = 0;
    for (let i = 0; i < 40; i++) mastery = updateMastery(mastery, { correct: true, itemTier: 3, childTier: 3 });
    expect(mastery).toBeGreaterThan(ENGINE_CONFIG.mastery.cracked);
    expect(mastery).toBeLessThanOrEqual(1);
    for (let i = 0; i < 60; i++) mastery = updateMastery(mastery, { correct: false, itemTier: 3, childTier: 3 });
    expect(mastery).toBeGreaterThanOrEqual(0);
    expect(mastery).toBeLessThan(0.1);
  });

  it('harder-than-level correct answers move mastery up more', () => {
    const easier = updateMastery(0.5, { correct: true, itemTier: 2, childTier: 4 });
    const harder = updateMastery(0.5, { correct: true, itemTier: 5, childTier: 2 });
    expect(harder).toBeGreaterThan(easier);
  });

  it('a miss on an easy item is noise, not collapse (moves down less)', () => {
    const easyMiss = updateMastery(0.7, { correct: false, itemTier: 1, childTier: 5 });
    const levelMiss = updateMastery(0.7, { correct: false, itemTier: 3, childTier: 3 });
    expect(easyMiss).toBeGreaterThan(levelMiss);
  });

  it('exposure alone never grants mastery (P2)', () => {
    let mastery = 0;
    for (let i = 0; i < 4; i++) mastery = updateMastery(mastery, { correct: false, itemTier: 2, childTier: 2 });
    mastery = updateMastery(mastery, { correct: true, itemTier: 2, childTier: 2 });
    expect(isMastered(mastery)).toBe(false);
  });
});

describe('applyDecay (lazy, never punitive)', () => {
  it('decays toward 0.6× over 45 days and no further', () => {
    expect(applyDecay(0.6, 45, false).masteryLevel).toBeCloseTo(0.36, 5);
    expect(applyDecay(0.6, 400, false).masteryLevel).toBeCloseTo(0.36, 5);
    expect(applyDecay(0.6, 0, false).masteryLevel).toBe(0.6);
  });

  it('interpolates linearly inside the window', () => {
    const half = applyDecay(1, 22.5, false).masteryLevel;
    expect(half).toBeCloseTo(0.8, 5);
  });

  it('never drops a cracked case below the threshold — triggers review instead (gate: decay never un-cracks)', () => {
    const result = applyDecay(0.85, 45, true);
    expect(result.masteryLevel).toBe(ENGINE_CONFIG.mastery.cracked);
    expect(result.triggersReview).toBe(true);
    expect(isMastered(result.masteryLevel)).toBe(true);
  });

  it('cracked case above the floor decays normally without a review trigger', () => {
    const result = applyDecay(0.95, 5, true);
    expect(result.masteryLevel).toBeGreaterThan(ENGINE_CONFIG.mastery.cracked);
    expect(result.triggersReview).toBe(false);
  });
});

describe('thresholds (config, not code)', () => {
  it('maps mastery to status bands', () => {
    expect(masteryStatus(0.3)).toBe('not_yet');
    expect(masteryStatus(0.55)).toBe('progressing');
    expect(masteryStatus(0.8)).toBe('cracked');
  });

  it('flags "needs a different way in" only after real effort (P1)', () => {
    expect(needsDifferentWayIn(0.3, 9)).toBe(false); // not enough attempts yet
    expect(needsDifferentWayIn(0.3, 10)).toBe(true);
    expect(needsDifferentWayIn(0.5, 30)).toBe(false); // progressing enough
  });

  it('teach-back grants a small bump, capped at 1', () => {
    expect(applyTeachbackBump(0.8)).toBeCloseTo(0.83, 5);
    expect(applyTeachbackBump(0.99)).toBe(1);
  });
});
