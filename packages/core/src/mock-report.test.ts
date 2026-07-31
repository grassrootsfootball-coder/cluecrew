import { describe, expect, it } from 'vitest';
import { childMockResult, scoreSitting, trajectory } from './mock-report';

const TYPE_NAMES = {
  'vr-05-hidden-word': 'Hidden Words',
  'vr-14-letter-connections': 'Letter Jumps',
  'vr-19-word-number-codes': 'Mirror Codes',
};

function sitting() {
  return scoreSitting({
    servedSections: [{ itemIds: ['h1', 'h2', 'l1'] }, { itemIds: ['m1', 'm2'] }],
    sectionMinutes: [8, 6],
    responses: {
      h1: { optionId: 'o1', correct: true, answeredAt: '2026-08-01T10:00:10Z' },
      h2: { optionId: 'o2', correct: true, answeredAt: '2026-08-01T10:00:40Z' },
      l1: { optionId: 'o3', correct: true, answeredAt: '2026-08-01T10:01:00Z' },
      m1: { optionId: 'o4', correct: false, answeredAt: '2026-08-01T10:02:00Z' },
      // m2 left unanswered — unanswered is not the same as answered-and-missed
    },
    sectionTimings: [
      { startedAt: '2026-08-01T10:00:00Z', endedAt: '2026-08-01T10:07:30Z', secondsUsed: 450 },
      { startedAt: '2026-08-01T10:08:00Z', endedAt: '2026-08-01T10:13:00Z', secondsUsed: 300 },
    ],
    itemTypeById: {
      h1: 'vr-05-hidden-word',
      h2: 'vr-05-hidden-word',
      l1: 'vr-14-letter-connections',
      m1: 'vr-19-word-number-codes',
      m2: 'vr-19-word-number-codes',
    },
    typeNames: TYPE_NAMES,
  });
}

describe('scoreSitting — the Stage 1 numbers', () => {
  it('raw, total and percentage', () => {
    const report = sitting();
    expect(report.raw).toBe(3);
    expect(report.total).toBe(5);
    expect(report.percentage).toBe(60);
  });

  it('per-type breakdown uses display names, never slugs', () => {
    const report = sitting();
    const hidden = report.perType.find((line) => line.name === 'Hidden Words');
    expect(hidden).toMatchObject({ correct: 2, total: 2 });
    const codes = report.perType.find((line) => line.name === 'Mirror Codes');
    expect(codes).toMatchObject({ correct: 0, total: 2 });
  });

  it('time-per-section carries authored minutes beside seconds used', () => {
    const report = sitting();
    expect(report.sections[0]).toMatchObject({ minutes: 8, secondsUsed: 450, correct: 3 });
    expect(report.sections[1]).toMatchObject({ minutes: 6, answered: 1 });
  });
});

describe('trajectory', () => {
  it('orders sittings by date and computes each percentage', () => {
    const points = trajectory([
      { createdAt: '2026-08-15T10:00:00Z', raw: 40, total: 50 },
      { createdAt: '2026-08-01T10:00:00Z', raw: 30, total: 50 },
    ]);
    expect(points.map((point) => point.percentage)).toEqual([60, 80]);
  });
});

describe('childMockResult — names, never numbers', () => {
  it('two strengths and one focus, per the Addendum A pattern', () => {
    const result = childMockResult(sitting().perType);
    expect(result.strengths).toEqual(['Hidden Words', 'Letter Jumps']);
    expect(result.focus).toBe('Mirror Codes');
    // No numeric anything reaches the child.
    expect(JSON.stringify(result)).not.toMatch(/\d/);
  });

  it('a strength requires at least one correct answer', () => {
    const result = childMockResult([
      { questionTypeId: 'a', name: 'A', correct: 0, total: 3 },
      { questionTypeId: 'b', name: 'B', correct: 0, total: 3 },
    ]);
    expect(result.strengths).toEqual([]);
  });

  it('with a single type answered there is no focus to contrast', () => {
    const result = childMockResult([
      { questionTypeId: 'a', name: 'A', correct: 2, total: 3 },
    ]);
    expect(result.strengths).toEqual(['A']);
    expect(result.focus).toBeNull();
  });
});
