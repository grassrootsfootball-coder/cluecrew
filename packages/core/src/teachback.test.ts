import { describe, expect, it } from 'vitest';
import {
  evaluateTeachback,
  shouldTriggerTeachback,
  teachbackContentSchema,
  type TeachbackContent,
} from './teachback';

const content: TeachbackContent = {
  working: ['I looked at the jumps: 3, then 4.', 'So the next jump is 4 again.', 'That makes the answer 14.'],
  wrongStepIndex: 1,
  corrections: [
    { text: 'The jumps grow by one each time, so the next jump is 5.', correct: true },
    { text: 'The jumps get smaller, so the next jump is 3.', correct: false },
  ],
};

describe('teach-back content schema (S3: authored only, deterministic)', () => {
  it('accepts valid authored content', () => {
    expect(teachbackContentSchema.safeParse(content).success).toBe(true);
  });

  it('rejects out-of-range wrong step and multiple correct corrections', () => {
    expect(teachbackContentSchema.safeParse({ ...content, wrongStepIndex: 9 }).success).toBe(false);
    expect(
      teachbackContentSchema.safeParse({
        ...content,
        corrections: content.corrections.map((correction) => ({ ...correction, correct: true })),
      }).success,
    ).toBe(false);
  });
});

describe('trigger rules (§6)', () => {
  const base = { justCracked: false, reviewSuccessAfterLapse: false, alreadyTaughtBack: false, contentAvailable: true };

  it('fires on crack or on review success after a lapse', () => {
    expect(shouldTriggerTeachback({ ...base, justCracked: true })).toBe(true);
    expect(shouldTriggerTeachback({ ...base, reviewSuccessAfterLapse: true })).toBe(true);
    expect(shouldTriggerTeachback(base)).toBe(false);
  });

  it('never fires twice for the same case or without authored content', () => {
    expect(shouldTriggerTeachback({ ...base, justCracked: true, alreadyTaughtBack: true })).toBe(false);
    expect(shouldTriggerTeachback({ ...base, justCracked: true, contentAvailable: false })).toBe(false);
  });
});

describe('deterministic evaluation', () => {
  it('success requires both the right step and the right correction', () => {
    expect(evaluateTeachback(content, { chosenStepIndex: 1, chosenCorrectionIndex: 0 })).toEqual({
      stepCorrect: true,
      correctionCorrect: true,
      success: true,
    });
    expect(evaluateTeachback(content, { chosenStepIndex: 0, chosenCorrectionIndex: 0 }).success).toBe(false);
    expect(evaluateTeachback(content, { chosenStepIndex: 1, chosenCorrectionIndex: 1 }).success).toBe(false);
    expect(evaluateTeachback(content, { chosenStepIndex: 1, chosenCorrectionIndex: 9 }).success).toBe(false);
  });
});
