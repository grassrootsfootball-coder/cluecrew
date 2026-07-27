/**
 * Streaks (BUILD-PHASE-3 §4, D2/D3). A streak week is intact with ≥5 active
 * days of ≥5 minutes. Two forgiveness days per week are automatic and
 * INVISIBLE — the forgiveness ledger is never exposed, and no "broken" state
 * is representable anywhere in the type system (gate #6). The child only
 * ever sees the streak alive or gently rekindled.
 */
import { ENGINE_CONFIG } from './config';

const { streak: CONFIG, session: SESSION } = ENGINE_CONFIG;

export interface DayActivity {
  /** Calendar date (UTC midnight). */
  date: Date;
  minutesActive: number;
}

/** The ONLY states a streak can be in. 'broken' does not exist. */
export type StreakState = 'alive' | 'rekindled';

export interface StreakView {
  state: StreakState;
  /** Consecutive intact weeks in the current run. */
  weeks: number;
}

function isActiveDay(day: DayActivity): boolean {
  return day.minutesActive >= SESSION.activeDayMinutes;
}

/** A week (7 day slots, absent = inactive) is intact with ≥5 active days. */
export function isWeekIntact(days: DayActivity[]): boolean {
  return days.filter(isActiveDay).length >= CONFIG.activeDaysRequired;
}

/**
 * Compute the streak from daily activity. `weekStart` anchors week boundaries
 * (the child's local Monday, supplied by the caller).
 *
 * The current (incomplete) week never ends a streak — it can only extend it
 * once intact. If the most recent COMPLETE week lapsed, the run restarts and
 * the state reads 'rekindled' while the child rebuilds — warm, never broken.
 */
export function computeStreak(days: DayActivity[], weekStarts: Date[], now: Date): StreakView {
  const completedWeeks = weekStarts
    .filter((start) => start.getTime() + 7 * 86_400_000 <= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  const intactByWeek = completedWeeks.map((start) => {
    const end = start.getTime() + 7 * 86_400_000;
    const weekDays = days.filter(
      (day) => day.date.getTime() >= start.getTime() && day.date.getTime() < end,
    );
    return isWeekIntact(weekDays);
  });

  // Count consecutive intact weeks ending at the most recent completed week.
  let run = 0;
  for (let i = intactByWeek.length - 1; i >= 0; i--) {
    if (intactByWeek[i]) run += 1;
    else break;
  }

  if (run > 0) return { state: 'alive', weeks: run };

  // The last complete week lapsed. If the child has been active this week,
  // the streak is rekindling; either way the language is warm, never loss.
  return { state: 'rekindled', weeks: 0 };
}

/** Total intact weeks ever — the rank input (§7). */
export function countStreakWeeks(days: DayActivity[], weekStarts: Date[], now: Date): number {
  return weekStarts
    .filter((start) => start.getTime() + 7 * 86_400_000 <= now.getTime())
    .filter((start) => {
      const end = start.getTime() + 7 * 86_400_000;
      return isWeekIntact(
        days.filter((day) => day.date.getTime() >= start.getTime() && day.date.getTime() < end),
      );
    }).length;
}
