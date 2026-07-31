import { describe, expect, it } from 'vitest';
import {
  academicYearOf,
  captureAcademicYear,
  effectiveYearGroup,
  examYearAdvisory,
  expectedExamYear,
  rolloverPending,
  runwayDays,
} from './year';
import { columnForRunway, intensityColumn, levers } from './intensity';

describe('academicYearOf', () => {
  it('September starts the academic year; August still belongs to the old one', () => {
    expect(academicYearOf(new Date('2026-09-01T00:00:00Z'))).toBe(2026);
    expect(academicYearOf(new Date('2026-08-31T23:59:59Z'))).toBe(2025);
    expect(academicYearOf(new Date('2027-01-15T12:00:00Z'))).toBe(2026);
  });
});

describe('captureAcademicYear — the "from this September" question', () => {
  it('July and October of the same calendar year capture the same academic year', () => {
    // The summer-ambiguity fix (§1): a parent answering in July names the
    // incoming year, in October the year just started — same capture pair.
    expect(captureAcademicYear(new Date('2026-07-15T10:00:00Z'))).toBe(2026);
    expect(captureAcademicYear(new Date('2026-10-15T10:00:00Z'))).toBe(2026);
  });

  it('the August edge: an August capture still names the coming September', () => {
    expect(captureAcademicYear(new Date('2026-08-31T10:00:00Z'))).toBe(2026);
  });
});

describe('effectiveYearGroup', () => {
  it('derives, never stores: Year 4 from September 2026 is Year 5 on 1 Sep 2027', () => {
    expect(effectiveYearGroup(4, 2026, new Date('2027-08-31T00:00:00Z'))).toBe(4);
    expect(effectiveYearGroup(4, 2026, new Date('2027-09-01T00:00:00Z'))).toBe(5);
    expect(effectiveYearGroup(4, 2026, new Date('2028-09-01T00:00:00Z'))).toBe(6);
  });
});

describe('rolloverPending', () => {
  const oct2027 = new Date('2027-10-01T00:00:00Z');

  it('fires after 1 September until confirmed', () => {
    expect(rolloverPending(2026, null, oct2027)).toBe(true);
  });

  it('a confirmation this academic year clears it', () => {
    expect(rolloverPending(2026, 2027, oct2027)).toBe(false);
  });

  it('an old confirmation does not clear a new rollover', () => {
    expect(rolloverPending(2026, 2027, new Date('2028-10-01T00:00:00Z'))).toBe(true);
  });

  it('never fires within the capture year', () => {
    expect(rolloverPending(2026, null, new Date('2027-03-01T00:00:00Z'))).toBe(false);
  });
});

describe('exam year advisory — advisory, never a block', () => {
  it('Year 4 captured 2026 → expected exam September 2028', () => {
    expect(expectedExamYear(4, 2026)).toBe(2028);
    expect(examYearAdvisory(4, 2026, 2028)).toBeNull();
    expect(examYearAdvisory(4, 2026, 2027)).toBe(2028);
  });
});

describe('intensity columns — runway leads, year guards', () => {
  const now = new Date('2026-03-01T00:00:00Z');

  it('maps runway to the four columns at the declared boundaries', () => {
    expect(columnForRunway(600)).toBe('foundations');
    expect(columnForRunway(400)).toBe('building');
    expect(columnForRunway(200)).toBe('together');
    expect(columnForRunway(60)).toBe('final');
  });

  it('a Year 4 child never runs hotter than building, whatever the exam date', () => {
    // Exam entered as this September — 184 days away, nominally "together".
    expect(intensityColumn(4, 2026, now)).toBe('building');
    // And a comfortable Y4 runway stays foundations.
    expect(intensityColumn(4, 2028, now)).toBe('foundations');
  });

  it('the final stretch introduces no new case types', () => {
    const final = levers(6, 2026, new Date('2026-06-01T00:00:00Z'));
    expect(final.column).toBe('final');
    expect(final.newCasesPerWeek).toBe(0);
    expect(final.bossRoundSize).toBe(5);
    expect(final.overdueFirst).toBe(true);
  });

  it('Year 3 gets the gentlest column with the fluency thread off', () => {
    const y3 = levers(3, null, now);
    expect(y3.column).toBe('foundations');
    expect(y3.fluency).toBe('off');
    expect(y3.bossRoundSize).toBe(1);
  });

  it('runway to a September exam counts to the 1st', () => {
    expect(runwayDays(2026, new Date('2026-08-31T00:00:00Z'))).toBe(1);
  });
});
