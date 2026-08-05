import { describe, expect, it } from 'vitest';
import { REGION_CAVEAT, UNKNOWN_REGION, type Region } from '../regions';
import {
  TRACK_TIER_CEILING,
  allowsErrorSpotting,
  allowsOpenResponse,
  assignEnglishTrack,
} from './tracks';
import {
  PASSAGE_BANDS,
  checkGlComprehensionCluster,
  checkPassageStemSplit,
  checkPlainText,
  clusterSetSchema,
  invalidLineRefs,
  isMidRun,
  passageQuoteSchema,
  passageSchema,
  quoteMatchesPassage,
  validatePassageQuote,
  resolveLineRefs,
  type Passage,
} from './passages';

function region(overrides: Partial<Region>): Region {
  return { ...UNKNOWN_REGION, code: 'test', name: 'Testshire', ...overrides };
}

describe('track assignment from the Region Registry (gate #3)', () => {
  it('a CSSE region runs the Selective track, with GL still reachable', () => {
    const assignment = assignEnglishTrack(region({ examFormat: 'csse', name: 'Essex (CSSE)' }));
    expect(assignment.track).toBe('SELECTIVE');
    expect(assignment.alternateAvailable).toBe(true);
    expect(assignment.isDefault).toBe(false);
  });

  it('a GL-style region runs the GL track', () => {
    expect(assignEnglishTrack(region({ examFormat: 'gl-style' })).track).toBe('GL');
  });

  it('a school-specific region runs the Selective track', () => {
    expect(assignEnglishTrack(region({ examFormat: 'school-specific' })).track).toBe('SELECTIVE');
  });

  it('an unknown target defaults to GL with Selective available, and says it is a default', () => {
    const assignment = assignEnglishTrack(null);
    expect(assignment.track).toBe('GL');
    expect(assignment.alternateAvailable).toBe(true);
    expect(assignment.isDefault).toBe(true);
  });

  it('every assignment carries a reason and the verify-with-the-school caveat', () => {
    const formats: Array<Region['examFormat']> = [
      'gl-style', 'csse', 'set', 'school-specific', 'mixed', 'unknown',
    ];
    for (const examFormat of formats) {
      const assignment = assignEnglishTrack(region({ examFormat }));
      expect(assignment.caveat).toBe(REGION_CAVEAT);
      expect(assignment.reason.length).toBeGreaterThan(20);
    }
    expect(assignEnglishTrack(null).caveat).toBe(REGION_CAVEAT);
  });

  it('parent-facing reasons never claim affiliation or an outcome (L1/L3)', () => {
    const formats: Array<Region['examFormat']> = [
      'gl-style', 'csse', 'set', 'school-specific', 'mixed', 'unknown',
    ];
    for (const examFormat of formats) {
      const { reason } = assignEnglishTrack(region({ examFormat }));
      expect(reason).not.toMatch(/guarantee|will pass|official|approved by|in partnership/i);
    }
  });

  it('track ceilings and item models follow the evidence (SCP-E-9/10/11)', () => {
    expect(TRACK_TIER_CEILING.GL).toBe(4);
    expect(TRACK_TIER_CEILING.SELECTIVE).toBe(5);
    expect(allowsErrorSpotting('GL')).toBe(true);
    expect(allowsErrorSpotting('SELECTIVE')).toBe(false);
    expect(allowsOpenResponse('SELECTIVE')).toBe(true);
    expect(allowsOpenResponse('GL')).toBe(false);
  });
});

const PASSAGE: Passage = passageSchema.parse({
  id: 'test-extract',
  stream: 'A_PUBLIC_DOMAIN_PRE1950',
  title: 'A test extract',
  provenance: 'Public domain, synthetic text written for this test',
  preamble: 'A boy waits at a gate. Read what happens next.',
  lines: ['The gate was shut.', 'He waited.', 'Nobody came.'],
  readingAge: 11,
  form: 'prose',
});

describe('passage-cluster delivery (SCP-E-2)', () => {
  it('line references resolve against authored line numbers', () => {
    expect(resolveLineRefs(PASSAGE, [1, 3])).toEqual(['The gate was shut.', 'Nobody came.']);
  });

  it('a stem pointing past the passage is caught, not silently dropped', () => {
    expect(invalidLineRefs(PASSAGE, [1, 9])).toEqual([9]);
  });

  it('a dual-stimulus set is valid — Bancroft’s runs prose and a poem together', () => {
    const parsed = clusterSetSchema.safeParse({
      id: 'dual',
      clusters: [
        { passageId: 'prose-extract', itemIds: ['a', 'b'], instructions: 'Read the story. Then answer.' },
        { passageId: 'the-poem', itemIds: ['c', 'd'], instructions: 'Now read the poem. Then answer.' },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('the same item cannot sit in two clusters of one set', () => {
    const parsed = clusterSetSchema.safeParse({
      id: 'clash',
      clusters: [
        { passageId: 'p1', itemIds: ['a'], instructions: 'Read the story. Then answer.' },
        { passageId: 'p2', itemIds: ['a'], instructions: 'Read the poem. Then answer.' },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('the poem stream must actually be a poem', () => {
    const parsed = passageSchema.safeParse({
      ...PASSAGE, stream: 'C_COMMISSIONED_POEM', form: 'prose',
    });
    expect(parsed.success).toBe(false);
  });

  it('a passage with no provenance cannot parse (L4 licensing control)', () => {
    const parsed = passageSchema.safeParse({ ...PASSAGE, provenance: '' });
    expect(parsed.success).toBe(false);
  });
});

describe('the passage-quote carve-out (manifesto v1.5)', () => {
  const bank = new Set(['test-extract']);

  it('a quote naming a real passage is a valid exemption claim', () => {
    const quote = passageQuoteSchema.parse({
      text: 'The gate was shut.',
      passageQuote: true,
      passageRef: 'test-extract',
      lineRefs: [1],
    });
    expect(validatePassageQuote(quote, bank)).toEqual([]);
    expect(quoteMatchesPassage(quote, PASSAGE)).toBe(true);
  });

  it('a quote naming no real passage is refused — the exemption needs a source', () => {
    const quote = passageQuoteSchema.parse({
      text: 'The gate was shut.',
      passageQuote: true,
      passageRef: 'not-a-passage',
      lineRefs: [1],
    });
    expect(validatePassageQuote(quote, bank).length).toBe(1);
  });

  it('passageQuote must be stated as literal true — the field IS the claim', () => {
    expect(
      passageQuoteSchema.safeParse({
        text: 'x', passageQuote: false, passageRef: 'test-extract', lineRefs: [],
      }).success,
    ).toBe(false);
  });

  it('lineRefs on a quote are integers, matching the canonical shape', () => {
    expect(
      passageQuoteSchema.safeParse({
        text: 'x', passageQuote: true, passageRef: 'test-extract', lineRefs: [{ from: 1, to: 2 }],
      }).success,
    ).toBe(false);
  });

  it('a span the passage does not contain is not really a quote', () => {
    const invented = passageQuoteSchema.parse({
      text: 'He was wrong about everything.',
      passageQuote: true,
      passageRef: 'test-extract',
      lineRefs: [1],
    });
    expect(quoteMatchesPassage(invented, PASSAGE)).toBe(false);
  });
});

describe('the passage-hard / stems-plain gate (gate #8)', () => {
  const plainStems = [{ id: 'q1', text: 'Why did the boy wait?', optionTexts: ['He was told to.', 'He was lost.'] }];

  it('a hard passage with plain stems passes', () => {
    expect(
      checkPassageStemSplit({
        passage: PASSAGE,
        passageBand: PASSAGE_BANDS.SELECTIVE,
        instructions: ['Read the story. Then answer the questions.'],
        stems: plainStems,
      }),
    ).toEqual([]);
  });

  it('a long stem sentence fails the plain side', () => {
    const failures = checkPassageStemSplit({
      passage: PASSAGE,
      passageBand: PASSAGE_BANDS.SELECTIVE,
      instructions: ['Read the story. Then answer the questions.'],
      stems: [
        {
          id: 'q1',
          text: 'Considering everything that the writer has told you about the boy and the gate and the long wait, why do you think he stayed?',
        },
      ],
    });
    expect(failures.some((failure) => failure.where === 'stem:q1')).toBe(true);
  });

  it('a passage outside its track band fails', () => {
    const failures = checkPassageStemSplit({
      passage: { ...PASSAGE, readingAge: 14 },
      passageBand: PASSAGE_BANDS.GL,
      instructions: ['Read the story. Then answer.'],
      stems: plainStems,
    });
    expect(failures.some((failure) => failure.where === `passage:${PASSAGE.id}`)).toBe(true);
  });

  it('our own preamble obeys the plain side, not the passage side', () => {
    const failures = checkPassageStemSplit({
      passage: {
        ...PASSAGE,
        preamble:
          'This particularly extraordinary introductory explanation deliberately accumulates unnecessarily complicated vocabulary.',
      },
      passageBand: PASSAGE_BANDS.SELECTIVE,
      instructions: ['Read the story. Then answer.'],
      stems: plainStems,
    });
    expect(failures.some((failure) => failure.where.includes('preamble'))).toBe(true);
  });

  it('a GL comprehension cluster runs 23–25 items', () => {
    const build = (count: number) =>
      Array.from({ length: count }, (_, index) => ({
        id: `q${index}`,
        wordClass: index === 5 || index === 11,
      }));
    for (const count of [23, 24, 25]) {
      expect(checkGlComprehensionCluster({ clusterId: 'c', items: build(count) })).toEqual([]);
    }
    for (const count of [22, 26, 28]) {
      expect(
        checkGlComprehensionCluster({ clusterId: 'c', items: build(count) }).some((failure) =>
          failure.detail.includes('runs 23–25'),
        ),
      ).toBe(true);
    }
  });

  it('a GL comprehension cluster carries 2–4 word-class items', () => {
    const build = (wordClassCount: number) =>
      Array.from({ length: 24 }, (_, index) => ({
        id: `q${index}`,
        wordClass: index >= 5 && index < 5 + wordClassCount,
      }));
    for (const count of [2, 3, 4]) {
      expect(checkGlComprehensionCluster({ clusterId: 'c', items: build(count) })).toEqual([]);
    }
    for (const count of [0, 1, 5]) {
      expect(
        checkGlComprehensionCluster({ clusterId: 'c', items: build(count) }).some((failure) =>
          failure.detail.includes('word-class items'),
        ),
      ).toBe(true);
    }
  });

  it('word-class items are embedded mid-run, never at either end', () => {
    const atEnds = Array.from({ length: 24 }, (_, index) => ({
      id: `q${index}`,
      wordClass: index === 0 || index === 23,
    }));
    const failures = checkGlComprehensionCluster({ clusterId: 'c', items: atEnds });
    expect(failures.filter((failure) => failure.detail.includes('mid-run'))).toHaveLength(2);
    expect(isMidRun(0, 24)).toBe(false);
    expect(isMidRun(23, 24)).toBe(false);
    expect(isMidRun(1, 24)).toBe(true);
  });

  it('checkPlainText agrees with the repo lint on the boundary case', () => {
    const sixteen = 'one two three four five six seven eight nine ten more words again and once more';
    expect(checkPlainText('x', `${sixteen}.`)).toEqual([]);
    expect(checkPlainText('x', `${sixteen} over.`).length).toBeGreaterThan(0);
  });
});
