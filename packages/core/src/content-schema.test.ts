import { describe, expect, it } from 'vitest';
import {
  caseFileSchema,
  chapterFileSchema,
  checkStoryWrapperCopy,
  storyWrapperSchema,
  wordFileSchema,
} from './content-schema';

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

/**
 * THE STORY SKIN, TIGHTENED BEFORE THE FIRST ONE IS AUTHORED (David, 2026-08-12).
 *
 * Every test here would have PASSED against the old shape — that is what made the old shape
 * loose. Zero wrappers exist, so each constraint costs nothing today and a content migration
 * later.
 */
const validWrapper = {
  open: 'Three more letters overnight, and Ozzie is stuck on the postmarks.',
  close: 'The postmarks line up. Marlowe pins your working to the board.',
  clueSkinLabels: { envelope: 'the postmark', 'clue-board': 'the corkboard' },
  season: 's1',
  threadTags: ['grey-umbrella'],
};

describe('story wrapper schema', () => {
  it('accepts a wrapper on the case whose family it declares', () => {
    const wrapped = structuredClone(validCase) as typeof validCase & {
      case: { storyWrapper: Record<string, unknown> };
    };
    // vr-08-move-letter is in the stowaway family (BUILD-PHASE-4 §2).
    wrapped.case.storyWrapper = { ...validWrapper, family: 'stowaway' };
    expect(caseFileSchema.safeParse(wrapped).success).toBe(true);
  });

  it('refuses a family the case is not in — the binding has to be true, not merely declared', () => {
    const wrapped = structuredClone(validCase) as typeof validCase & {
      case: { storyWrapper: Record<string, unknown> };
    };
    wrapped.case.storyWrapper = { ...validWrapper, family: 'bridge' };
    const parsed = caseFileSchema.safeParse(wrapped);
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain('stowaway');
  });

  it('shares its season vocabulary with the chapter, so the join is comparable', () => {
    // The same value is legal on both sides…
    expect(storyWrapperSchema.safeParse({ ...validWrapper, season: 's4' }).success).toBe(true);
    // …and the same near-miss is illegal on both, which is the whole point of one type.
    expect(storyWrapperSchema.safeParse({ ...validWrapper, season: 'season-1' }).success).toBe(false);
    const chapter = {
      kind: 'chapter',
      chapter: {
        id: 's1-ch01',
        title: 'A Chapter',
        season: 'season-1',
        trigger: { kind: 'rank', rank: 'TRAINEE' },
        body: 'x'.repeat(250),
        seededWordIds: [],
        audioRef: null,
        spotImage: null,
      },
    };
    expect(chapterFileSchema.safeParse(chapter).success).toBe(false);
    expect(
      chapterFileSchema.safeParse({ ...chapter, chapter: { ...chapter.chapter, season: 's1' } })
        .success,
    ).toBe(true);
  });

  it('refuses a content id as a clue-skin key — the one place one could be smuggled in', () => {
    for (const key of ['case-vr-08', 'vr-04-closest-meaning', 'en-plausible-not-stated']) {
      const parsed = storyWrapperSchema.safeParse({
        ...validWrapper,
        clueSkinLabels: { [key]: 'the postmark' },
      });
      expect(parsed.success, `${key} must not be a legal clue-skin key`).toBe(false);
    }
  });

  it('has no caseId field, and gaining one is a decision rather than a slip', () => {
    // Binding is by FAMILY, never by case id: chapters are permanent, case ordering is not, and
    // orderInDistrict is unresolved. A stray key is stripped rather than stored, so this asserts
    // the SHAPE that comes out, not merely that the parse succeeded.
    const parsed = storyWrapperSchema.parse({ ...validWrapper, caseIds: ['case-vr-08'] });
    expect(parsed).not.toHaveProperty('caseIds');
    expect(Object.keys(storyWrapperSchema.shape)).not.toContain('caseId');
    expect(Object.keys(storyWrapperSchema.shape)).not.toContain('caseIds');
  });

  it('gates open, close and every label as child-facing copy', () => {
    const failures = checkStoryWrapperCopy('case-vr-08', {
      ...validWrapper,
      season: 's1',
      // "wrong" is banned child-facing (D1); the label carries an internal id.
      open: 'Ozzie got the postmark wrong again.',
      clueSkinLabels: { envelope: 'vr-08-move-letter' },
    } as never);
    const rules = failures.map((failure) => failure.rule);
    expect(rules).toContain('banned-vocabulary');
    expect(rules).toContain('internal-id-leak');
    // The label failure is attributed to the label, not to the wrapper as a whole.
    expect(failures.map((failure) => failure.where)).toContain(
      'case:case-vr-08 storyWrapper.clueSkinLabels.envelope',
    );
  });
});

describe('chapter clue-tap', () => {
  const chapter = (clueTap: Record<string, unknown>) => ({
    kind: 'chapter',
    chapter: {
      id: 's1-ch01',
      title: 'A Chapter',
      season: 's1',
      trigger: { kind: 'rank', rank: 'TRAINEE' },
      body: 'x'.repeat(250),
      seededWordIds: [],
      audioRef: null,
      spotImage: null,
      clueTap,
    },
  });

  it('takes a mechanic family, not a question type — the value the field is named for', () => {
    const prompt = 'Want to try it?';
    expect(chapterFileSchema.safeParse(chapter({ itemId: 'i', engineFamily: 'wordweb', prompt })).success).toBe(true);
    // The value the first authored chapter actually carried, before this was constrained.
    expect(
      chapterFileSchema.safeParse(chapter({ itemId: 'i', engineFamily: 'vr-04-closest-meaning', prompt })).success,
    ).toBe(false);
    // Optional: only VR has this vocabulary, so a Maths or NVR clue-tap declares nothing rather
    // than inventing a value.
    expect(chapterFileSchema.safeParse(chapter({ itemId: 'i', prompt })).success).toBe(true);
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
