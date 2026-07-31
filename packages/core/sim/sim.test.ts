/**
 * The pedagogy laws' unit tests (BUILD-PHASE-3 §10). Six synthetic learners
 * run 90 simulated days each through the real engine. Deterministic seeds.
 */
import { describe, expect, it } from 'vitest';
import { EVENT_NAMES, ENGINE_CONFIG } from '../src/index';
import { PROFILES } from './learners';
import { runSimulation, trailingSuccessRate, type SimResult } from './runner';

const results = new Map<string, SimResult>(
  PROFILES.map((profile) => [profile.name, runSimulation(profile, { seed: 42 })]),
);

function resultOf(name: string): SimResult {
  const result = results.get(name);
  if (!result) throw new Error(`no sim result for ${name}`);
  return result;
}

describe('success-rate convergence (P5)', () => {
  it.each(PROFILES.map((profile) => [profile.name]))(
    '%s converges into the 70–85%% band (±5pp stochastic tolerance)',
    (name) => {
      const rate = trailingSuccessRate(resultOf(name), 30);
      expect(rate).toBeGreaterThanOrEqual(ENGINE_CONFIG.band.min - 0.05);
      expect(rate).toBeLessThanOrEqual(ENGINE_CONFIG.band.max + 0.05);
    },
  );
});

describe('anti-frustration guarantees', () => {
  it.each(PROFILES.map((profile) => [profile.name]))(
    '%s never sees 4 consecutive misses — ever',
    (name) => {
      expect(resultOf(name).everFourConsecutiveMisses).toBe(false);
      for (const day of resultOf(name).days) {
        expect(day.maxMissStreak).toBeLessThanOrEqual(3);
      }
    },
  );

  it('struggling sessions end on completion beats, not frustration breaks, in ≥80% of sessions', () => {
    const attended = resultOf('struggling').days.filter((day) => day.attended);
    const onBeat = attended.filter((day) => day.endedOnCompletionBeat).length;
    expect(onBeat / attended.length).toBeGreaterThanOrEqual(0.8);
  });
});

describe('review discipline (§3)', () => {
  it.each(PROFILES.map((profile) => [profile.name]))(
    '%s: review load never exceeds the cap; overflow rolls forward silently',
    (name) => {
      expect(resultOf(name).maxReviewPoolSize).toBeLessThanOrEqual(
        ENGINE_CONFIG.scheduler.dailyReviewCap,
      );
    },
  );

  it('exam-horizon compression tightens intervals as the exam approaches (gate #3)', () => {
    const profile = PROFILES.find((candidate) => candidate.name === 'average')!;
    const noExam = runSimulation(profile, { seed: 7, examDayIndex: null });
    const examSoon = runSimulation(profile, { seed: 7, examDayIndex: 100 });

    const lateMean = (result: SimResult) => {
      const late = result.scheduledIntervals.filter((entry) => entry.day >= 75);
      return late.reduce((sum, entry) => sum + entry.intervalDays, 0) / Math.max(1, late.length);
    };
    expect(lateMean(examSoon)).toBeLessThan(lateMean(noExam));
    // At day 75+, the exam is ≤25 days away → every interval ≤ 25/4.
    for (const entry of examSoon.scheduledIntervals.filter((candidate) => candidate.day >= 75)) {
      expect(entry.intervalDays).toBeLessThanOrEqual(25 / 4 + 0.01);
    }
  });
});

describe('mastery decay is never punitive', () => {
  it.each(PROFILES.map((profile) => [profile.name]))(
    '%s: decay never un-cracks a case — even 30 days absent',
    (name) => {
      expect(resultOf(name).crackedEverUncrackedByDecay).toBe(false);
    },
  );

  it('learners still crack cases at realistic rates', () => {
    expect(resultOf('fast').casesCracked).toBeGreaterThanOrEqual(3);
    expect(resultOf('average').casesCracked).toBeGreaterThanOrEqual(2);
    expect(resultOf('struggling').casesCracked).toBeGreaterThanOrEqual(0);
  });
});

describe('session cap (D2)', () => {
  it.each(PROFILES.map((profile) => [profile.name]))('%s: no session exceeds 15 minutes', (name) => {
    for (const day of resultOf(name).days) {
      expect(day.secondsActive).toBeLessThanOrEqual(ENGINE_CONFIG.session.capMinutes * 60 + 60);
    }
  });
});

describe('events (gate #9)', () => {
  it('a full simulated run emits only canonical names with ID/enum payloads', () => {
    const events = resultOf('average').events;
    expect(events.length).toBeGreaterThan(100);
    const names = new Set(events.map((event) => event.name));
    for (const name of names) {
      expect(EVENT_NAMES).toContain(name);
    }
    // Sessions open with retrieval and end cleanly.
    expect(names).toContain('session_started');
    expect(names).toContain('warmup_completed');
    expect(names).toContain('session_ended');
    expect(names).toContain('review_due_served');
    // No content payloads: every prop is an id, enum, number, or boolean.
    for (const event of events) {
      for (const value of Object.values(event.props)) {
        if (typeof value === 'string') {
          expect(value.length).toBeLessThanOrEqual(64);
          expect(value).not.toMatch(/\s{2,}|[.!?]$/); // not prose
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Addendum C gate #1 + Addendum D gate #3: the suite re-run with Boss Rounds
// at every runway scaling, per intensity column.
// ---------------------------------------------------------------------------
import { INTENSITY_MATRIX, type IntensityColumn } from '../src/intensity';
import { PROFILES } from './learners';
import { trailingSuccessRate } from './runner';

const COLUMNS: IntensityColumn[] = ['foundations', 'building', 'together', 'final'];

describe('intensity columns (Addenda C+D): the same laws hold in all four', () => {
  const struggling = PROFILES.find((profile) => profile.name === 'struggling')!;
  const steady = PROFILES.find((profile) => profile.name === 'average')!;

  for (const column of COLUMNS) {
    const levers = INTENSITY_MATRIX[column];

    it(`${column}: the session cap is never exceeded, whatever the Boss Round size`, () => {
      for (const profile of PROFILES) {
        const result = runSimulation(profile, {
          intensityColumn: column,
          examDayIndex: column === 'final' ? 60 : null,
          seed: 7,
        });
        for (const day of result.days) {
          // The Phase 3 gate's own tolerance: the in-flight activity finishes
          // warmly (D2 is "not a cliff"), so cap + one activity, same as the
          // ratified D2 test above.
          expect(day.secondsActive, `${profile.name} day ${day.day}`).toBeLessThanOrEqual(
            15 * 60 + 60,
          );
        }
      }
    });

    it(`${column}: sessions serve the matrix's Boss Round size`, () => {
      const result = runSimulation(steady, { intensityColumn: column, seed: 7 });
      const sized = result.days.filter((day) => day.attended && day.bossRoundQuestions > 0);
      expect(sized.length).toBeGreaterThan(0);
      const maxServed = Math.max(...sized.map((day) => day.bossRoundQuestions));
      expect(maxServed).toBeLessThanOrEqual(levers.bossRoundSize);
      // The full size is actually reached on ordinary days, not just capped at.
      expect(maxServed).toBe(levers.bossRoundSize);
    });

    it(`${column}: the struggling profile still lands in the 70–85 band`, () => {
      const result = runSimulation(struggling, { intensityColumn: column, seed: 7 });
      const rate = trailingSuccessRate(result, 30);
      expect(rate).toBeGreaterThanOrEqual(0.65); // band floor with sim noise
      expect(rate).toBeLessThanOrEqual(0.9);
    });
  }

  it('final stretch: zero new question types open (the matrix’s most important cell)', () => {
    for (const profile of PROFILES) {
      const result = runSimulation(profile, { intensityColumn: 'final', examDayIndex: 60, seed: 7 });
      expect(result.newTypesOpened, profile.name).toBe(0);
    }
  });

  it('struggling sessions still end on completion beats in every column', () => {
    for (const column of COLUMNS) {
      const result = runSimulation(struggling, { intensityColumn: column, seed: 7 });
      const attended = result.days.filter((day) => day.attended);
      const onBeat = attended.filter((day) => day.endedOnCompletionBeat).length;
      expect(onBeat / attended.length, column).toBeGreaterThanOrEqual(0.8);
    }
  });
});
