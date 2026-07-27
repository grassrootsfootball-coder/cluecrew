import { describe, expect, it } from 'vitest';
import { computeStreak, countStreakWeeks, isWeekIntact, type DayActivity } from './streaks';

const DAY = 86_400_000;
const WEEK0 = new Date('2026-07-06T00:00:00Z'); // a Monday

function week(start: Date, activeDays: number, minutes = 10): DayActivity[] {
  return Array.from({ length: activeDays }, (_, i) => ({
    date: new Date(start.getTime() + i * DAY),
    minutesActive: minutes,
  }));
}

function weekStarts(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => new Date(WEEK0.getTime() + i * 7 * DAY));
}

describe('week intactness (≥5 active days of ≥5 minutes)', () => {
  it('5 active days keep the week intact — the 2 forgiveness days are automatic and invisible', () => {
    expect(isWeekIntact(week(WEEK0, 5))).toBe(true);
    expect(isWeekIntact(week(WEEK0, 4))).toBe(false);
    expect(isWeekIntact(week(WEEK0, 7))).toBe(true);
  });

  it('days under 5 minutes do not count as active', () => {
    expect(isWeekIntact(week(WEEK0, 5, 4))).toBe(false);
  });
});

describe('computeStreak — only alive or rekindled are representable (gate #6)', () => {
  const now = new Date(WEEK0.getTime() + 3 * 7 * DAY + 2 * DAY);

  it('consecutive intact weeks read as alive', () => {
    const days = [...week(weekStarts(3)[0]!, 6), ...week(weekStarts(3)[1]!, 5), ...week(weekStarts(3)[2]!, 5)];
    const streak = computeStreak(days, weekStarts(3), now);
    expect(streak).toEqual({ state: 'alive', weeks: 3 });
  });

  it('a lapsed week reads as rekindled — never "broken", and the type cannot express it', () => {
    const days = [...week(weekStarts(3)[0]!, 6), ...week(weekStarts(3)[2]!, 2)];
    const streak = computeStreak(days, weekStarts(3), now);
    expect(streak.state).toBe('rekindled');
    // Compile-time guarantee: StreakState = 'alive' | 'rekindled'. Runtime spot check:
    expect(['alive', 'rekindled']).toContain(streak.state);
  });

  it('the current incomplete week never ends a streak', () => {
    const days = [...week(weekStarts(3)[0]!, 5), ...week(weekStarts(3)[1]!, 5), ...week(weekStarts(3)[2]!, 5)];
    // now = mid-week-4, no activity yet this week
    const midWeek4 = new Date(WEEK0.getTime() + 3 * 7 * DAY + 3 * DAY);
    expect(computeStreak(days, weekStarts(4), midWeek4).state).toBe('alive');
  });

  it('no forgiveness ledger appears in any API response shape', () => {
    const streak = computeStreak(week(WEEK0, 5), weekStarts(1), now);
    expect(Object.keys(streak).sort()).toEqual(['state', 'weeks']);
  });
});

describe('countStreakWeeks (rank input)', () => {
  it('counts all intact weeks ever, gaps included', () => {
    const days = [...week(weekStarts(3)[0]!, 5), ...week(weekStarts(3)[2]!, 6)];
    const now = new Date(WEEK0.getTime() + 3 * 7 * DAY);
    expect(countStreakWeeks(days, weekStarts(3), now)).toBe(2);
  });
});
