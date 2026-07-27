import { describe, expect, it } from 'vitest';
import {
  INITIAL_REVIEW_STATE,
  scheduleNextReview,
  sortForWarmup,
} from './scheduling';

const NOW = new Date('2026-07-27T09:00:00Z');

describe('scheduleNextReview', () => {
  it('grows the interval on consecutive good reviews', () => {
    let state = scheduleNextReview(INITIAL_REVIEW_STATE, 'good', NOW);
    const first = state.intervalDays;
    state = scheduleNextReview(state, 'good', NOW);
    expect(state.intervalDays).toBeGreaterThan(first);
    expect(state.dueAt.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('shortens the interval and counts a lapse on "again" without resetting to zero', () => {
    let state = scheduleNextReview(INITIAL_REVIEW_STATE, 'good', NOW);
    state = scheduleNextReview(state, 'good', NOW);
    const before = state.intervalDays;
    state = scheduleNextReview(state, 'again', NOW);
    expect(state.lapses).toBe(1);
    expect(state.intervalDays).toBeLessThan(before);
    expect(state.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('keeps ease factor within bounds', () => {
    let state = { ...INITIAL_REVIEW_STATE };
    for (let i = 0; i < 20; i++) state = scheduleNextReview(state, 'again', NOW);
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    for (let i = 0; i < 40; i++) state = scheduleNextReview(state, 'easy', NOW);
    expect(state.easeFactor).toBeLessThanOrEqual(2.8);
  });

  it('caps intervals so nothing disappears for a whole term', () => {
    let state = { ...INITIAL_REVIEW_STATE };
    for (let i = 0; i < 30; i++) state = scheduleNextReview(state, 'easy', NOW);
    expect(state.intervalDays).toBeLessThanOrEqual(120);
  });
});

describe('sortForWarmup', () => {
  it('returns only due units, most overdue first (P2)', () => {
    const units = [
      { unitKind: 'word' as const, unitId: 'w-late', dueAt: new Date('2026-07-20T00:00:00Z') },
      { unitKind: 'word' as const, unitId: 'w-future', dueAt: new Date('2026-08-01T00:00:00Z') },
      { unitKind: 'question_type' as const, unitId: 'vr-08', dueAt: new Date('2026-07-26T00:00:00Z') },
    ];
    const sorted = sortForWarmup(units, NOW);
    expect(sorted.map((u) => u.unitId)).toEqual(['w-late', 'vr-08']);
  });
});
