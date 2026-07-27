import { describe, expect, it } from 'vitest';
import { caseFileSchema, wordFileSchema } from './content-schema';

const validCase = {
  kind: 'case',
  case: {
    id: 'case-vr-08',
    questionTypeId: 'vr-08-move-letter',
    title: 'The Case of the Wandering Letter',
    narrativeIntro: { text: 'A letter slipped out of one word and into another.', skippable: true },
    modes: {
      watch: { kind: 'video', assetRef: 'placeholder/watch.mp4', maxSeconds: 90 },
      walk: { kind: 'faded-example', assetRef: 'placeholder/walk.json' },
      see: { kind: 'visual', assetRef: 'placeholder/see.json' },
      hear: { kind: 'audio', assetRef: 'placeholder/hear.mp3' },
      try: { kind: 'practice' },
    },
    orderInDistrict: 8,
  },
};

describe('case content schema', () => {
  it('accepts a complete five-mode case', () => {
    expect(caseFileSchema.safeParse(validCase).success).toBe(true);
  });

  it('rejects a case missing a mode (P1: no concept is done with fewer than five)', () => {
    const missingHear = structuredClone(validCase) as Record<string, unknown>;
    delete ((missingHear as typeof validCase).case.modes as Record<string, unknown>).hear;
    expect(caseFileSchema.safeParse(missingHear).success).toBe(false);
  });

  it('rejects watch mode over 90 seconds (P1)', () => {
    const longWatch = structuredClone(validCase);
    longWatch.case.modes.watch.maxSeconds = 120;
    expect(caseFileSchema.safeParse(longWatch).success).toBe(false);
  });

  it('rejects narrative intros beyond ~30s of reading (D5)', () => {
    const longIntro = structuredClone(validCase);
    longIntro.case.narrativeIntro.text = 'clue '.repeat(200);
    expect(caseFileSchema.safeParse(longIntro).success).toBe(false);
  });

  it('rejects non-skippable narrative (D5)', () => {
    const gated = structuredClone(validCase) as { case: { narrativeIntro: { skippable: boolean } } };
    gated.case.narrativeIntro.skippable = false;
    expect(caseFileSchema.safeParse(gated).success).toBe(false);
  });
});

describe('word content schema', () => {
  it('accepts a valid word file', () => {
    const parsed = wordFileSchema.safeParse({
      kind: 'words',
      words: [
        {
          id: 'reluctant',
          headword: 'reluctant',
          definitionChild: 'Not keen to do something.',
          sentence: 'Maya was reluctant to leave the funfair.',
          tier: 3,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects overlong child definitions', () => {
    const parsed = wordFileSchema.safeParse({
      kind: 'words',
      words: [
        {
          id: 'reluctant',
          headword: 'reluctant',
          definitionChild: 'x'.repeat(300),
          sentence: 'Maya was reluctant to leave.',
          tier: 3,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
