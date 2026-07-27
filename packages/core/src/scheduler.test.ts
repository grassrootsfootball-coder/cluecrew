import { describe, expect, it } from 'vitest';
import { ENGINE_CONFIG } from './config';
import {
  INITIAL_REVIEW_STATE,
  buildReviewPool,
  scheduleNextReview,
  type ReviewUnit,
} from './scheduler';

const NOW = new Date('2026-08-01T09:00:00Z');
const CTX = { now: NOW };

describe('scheduleNextReview', () => {
  it('follows the child-tuned opening ladder 1 → 3 → 7', () => {
    let state = scheduleNextReview(INITIAL_REVIEW_STATE, 'success', CTX);
    expect(state.intervalDays).toBe(3);
    state = scheduleNextReview(state, 'success', CTX);
    expect(state.intervalDays).toBe(7);
    state = scheduleNextReview(state, 'success', CTX);
    expect(state.intervalDays).toBeGreaterThan(7);
  });

  it('gains ease on success (cap 2.6) and loses on lapse (floor 1.3)', () => {
    let state = { intervalDays: 7, easeFactor: 2.58, lapses: 0 };
    state = scheduleNextReview(state, 'success', CTX);
    expect(state.easeFactor).toBe(2.6);
    let lapsed = { intervalDays: 7, easeFactor: 1.4, lapses: 0 };
    lapsed = scheduleNextReview(lapsed, 'lapse', CTX);
    expect(lapsed.easeFactor).toBe(1.3);
    lapsed = scheduleNextReview(lapsed, 'lapse', CTX);
    expect(lapsed.easeFactor).toBe(1.3);
  });

  it('lapse resets the interval to 1 day and counts the lapse', () => {
    const state = scheduleNextReview({ intervalDays: 14, easeFactor: 2.3, lapses: 1 }, 'lapse', CTX);
    expect(state.intervalDays).toBe(1);
    expect(state.lapses).toBe(2);
  });

  it('never exceeds the 21-day child max — a child sitting an exam cannot wait 6 months', () => {
    let state = { intervalDays: 20, easeFactor: 2.6, lapses: 0 };
    state = scheduleNextReview(state, 'success', CTX);
    expect(state.intervalDays).toBe(ENGINE_CONFIG.scheduler.maxIntervalDays);
  });

  it('compresses intervals near the exam horizon (gate #3: 30 days out vs 300)', () => {
    const farOut = scheduleNextReview(
      { intervalDays: 20, easeFactor: 2.6, lapses: 0 },
      'success',
      { now: NOW, examDate: new Date('2027-05-28T09:00:00Z') }, // ~300 days
    );
    const examSoon = scheduleNextReview(
      { intervalDays: 20, easeFactor: 2.6, lapses: 0 },
      'success',
      { now: NOW, examDate: new Date('2026-08-31T09:00:00Z') }, // 30 days
    );
    expect(farOut.intervalDays).toBe(21);
    expect(examSoon.intervalDays).toBeCloseTo(7.5, 1); // 30 / 4
    expect(examSoon.intervalDays).toBeLessThan(farOut.intervalDays);
  });

  it('keeps a 1-day floor even on exam day', () => {
    const state = scheduleNextReview(INITIAL_REVIEW_STATE, 'success', {
      now: NOW,
      examDate: new Date('2026-08-02T09:00:00Z'),
    });
    expect(state.intervalDays).toBeGreaterThanOrEqual(1);
  });
});

describe('buildReviewPool (§3 priority + silent cap)', () => {
  const unit = (id: string, kind: ReviewUnit['unitKind'], daysOverdue: number, lapses = 0): ReviewUnit => ({
    unitKind: kind,
    unitId: id,
    dueAt: new Date(NOW.getTime() - daysOverdue * 86_400_000),
    lapses,
  });

  it('serves only due units, overdue-longest first, then lapses, then words before types', () => {
    const pool = buildReviewPool(
      [
        unit('type-recent', 'question_type', 1),
        unit('word-oldest', 'word', 5),
        unit('future', 'word', -2),
        unit('type-lapsed', 'question_type', 2, 3),
        unit('word-tied', 'word', 2, 3),
      ],
      NOW,
    );
    expect(pool.map((u) => u.unitId)).toEqual(['word-oldest', 'word-tied', 'type-lapsed', 'type-recent']);
  });

  it('caps daily load; overflow rolls forward silently — no backlog number exists', () => {
    const many = Array.from({ length: 30 }, (_, i) => unit(`w${i}`, 'word', i + 1));
    const pool = buildReviewPool(many, NOW);
    expect(pool).toHaveLength(ENGINE_CONFIG.scheduler.dailyReviewCap);
  });
});
