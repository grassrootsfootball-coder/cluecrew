import { describe, expect, it } from 'vitest';
import { seededShuffle, shuffleOptionsForChild } from './shuffle';

interface TestOption {
  id: string;
  isCorrect: boolean;
  misconceptionId: string | null;
}

const OPTIONS: TestOption[] = [
  { id: 'opt-correct', isCorrect: true, misconceptionId: null },
  { id: 'opt-b', isCorrect: false, misconceptionId: 'm-off-by-one' },
  { id: 'opt-c', isCorrect: false, misconceptionId: 'm-direction' },
  { id: 'opt-d', isCorrect: false, misconceptionId: 'm-carryover' },
];

describe('shuffleOptionsForChild', () => {
  it('is stable for the same child across revisits', () => {
    const first = shuffleOptionsForChild(OPTIONS, 'child-a', 'item-1').map((option) => option.id);
    for (let run = 0; run < 20; run++) {
      expect(shuffleOptionsForChild(OPTIONS, 'child-a', 'item-1').map((option) => option.id)).toEqual(first);
    }
  });

  it('differs between children (and between items for the same child)', () => {
    const orders = new Set(
      Array.from({ length: 40 }, (_, index) =>
        shuffleOptionsForChild(OPTIONS, `child-${index}`, 'item-1')
          .map((option) => option.id)
          .join(','),
      ),
    );
    // 4 options have 24 permutations; 40 children must not all agree.
    expect(orders.size).toBeGreaterThanOrEqual(5);

    const acrossItems = new Set(
      Array.from({ length: 40 }, (_, index) =>
        shuffleOptionsForChild(OPTIONS, 'child-a', `item-${index}`)
          .map((option) => option.id)
          .join(','),
      ),
    );
    expect(acrossItems.size).toBeGreaterThanOrEqual(5);
  });

  it('does not leave the correct option in authored-first position for every child', () => {
    const firstPositions = Array.from({ length: 60 }, (_, index) =>
      shuffleOptionsForChild(OPTIONS, `child-${index}`, 'item-42')[0]!.id,
    );
    const correctFirstCount = firstPositions.filter((id) => id === 'opt-correct').length;
    expect(correctFirstCount).toBeLessThan(30); // ≈15 expected of 60
    expect(correctFirstCount).toBeGreaterThan(0); // and it is a shuffle, not an exclusion
  });

  it('never mutates the input and preserves every option exactly once', () => {
    const input = [...OPTIONS];
    const shuffled = seededShuffle(input, 'any-seed');
    expect(input).toEqual(OPTIONS);
    expect([...shuffled].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...OPTIONS].sort((a, b) => a.id.localeCompare(b.id)),
    );
  });

  it('tracks the correct option through attempt recording: grading by id survives any order', () => {
    // Mirrors submitAnswer: pending.options is the SHUFFLED list; the chosen
    // option is looked up by id — order carries no meaning.
    const pendingOptions = shuffleOptionsForChild(OPTIONS, 'child-x', 'item-9');
    const gradeAnswer = (optionId: string) => {
      const chosen = pendingOptions.find((option) => option.id === optionId);
      return { correct: chosen?.isCorrect === true, misconceptionId: chosen?.misconceptionId ?? null };
    };

    expect(gradeAnswer('opt-correct')).toEqual({ correct: true, misconceptionId: null });
    expect(gradeAnswer('opt-c')).toEqual({ correct: false, misconceptionId: 'm-direction' });

    // Whatever position the correct option landed in, grading agrees.
    const positionOfCorrect = pendingOptions.findIndex((option) => option.isCorrect);
    expect(gradeAnswer(pendingOptions[positionOfCorrect]!.id).correct).toBe(true);

    // Payload order (what the child sees) and pending order (what grading
    // uses) are the same list — per-id fields are intact after the shuffle.
    for (const option of pendingOptions) {
      const original = OPTIONS.find((candidate) => candidate.id === option.id)!;
      expect(option.isCorrect).toBe(original.isCorrect);
      expect(option.misconceptionId).toBe(original.misconceptionId);
    }
  });
});
