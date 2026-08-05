import { describe, expect, it } from 'vitest';
import {
  asAuthored,
  authoredStrings,
  bannedVocabularyIn,
  BANNED_CHILD_FACING,
  LADDER_RUNGS,
  openResponseItemSchema,
  validateForPublish,
  type OpenResponseItem,
} from './open-response';
import {
  assertAuthoredVerdict,
  buildUnmatchedAnswerLog,
  markOpenResponse,
  matchAcceptableAnswer,
  redactPersonalDetail,
  type OpenResponseVerdict,
} from './matching';
import { longestCommonRun, normalise, stem } from './text';

/**
 * Every passage and item here is ORIGINAL (L4). Nothing in this file is
 * derived from a past paper or familiarisation material.
 */
const PASSAGE = [
  'The corridor smelled of wet stone.',
  'Nadia counted the doors as she passed them, because counting kept her hands from shaking.',
  'At the seventh door the light gave out completely,',
  'and she stood in the dark listening to the building breathe.',
].join(' ');

/** A two-point retrieval item — the POINT credit model. */
const pointItem: OpenResponseItem = {
  id: 'eng-open-nadia-01',
  stem: 'Give two reasons Nadia counts the doors.',
  passageRef: 'passage-corridor',
  lineRefs: [2, 3, 4],
  tariff: 2,
  requiredPoints: 2,
  creditModel: 'POINT',
  acceptableAnswers: [
    {
      text: 'counting keeps her hands from shaking',
      tolerance: 'CLOSE_PARAPHRASE',
      barredNearMisses: [],
      conceptSets: [],
      pointId: 'calm',
      feedback: 'You tracked why she counts.',
    },
    {
      text: 'she wants to stay calm',
      tolerance: 'CONCEPT',
      barredNearMisses: [],
      conceptSets: [['calm', 'steady', 'stop shaking']],
      pointId: 'calm',
    },
    {
      text: 'she cannot see in the dark',
      tolerance: 'CLOSE_PARAPHRASE',
      barredNearMisses: ['she likes the dark'],
      conceptSets: [],
      pointId: 'dark',
    },
  ],
  bands: [],
  evidenceCapRule: false,
  ownWordsRequired: false,
  spagRiderChecks: [],
  misconceptions: [],
};

/** EXACT tolerance, one mark, with the CSSE-style accuracy rider. */
const exactItem: OpenResponseItem = {
  id: 'eng-open-nadia-02',
  stem: 'Which door did the light go out at?',
  passageRef: 'passage-corridor',
  lineRefs: [3],
  tariff: 1,
  creditModel: 'POINT',
  acceptableAnswers: [
    { text: 'the seventh', tolerance: 'EXACT', barredNearMisses: [], conceptSets: [] },
    { text: 'she cannot see', tolerance: 'EXACT', barredNearMisses: [], conceptSets: [] },
  ],
  bands: [],
  evidenceCapRule: false,
  ownWordsRequired: false,
  spagRider: 1,
  spagRiderLabel: 'Writing accuracy',
  spagRiderChecks: [],
  misconceptions: [],
};

/** Own-words rephrasing: lifting scores zero (§3). */
const ownWordsItem: OpenResponseItem = {
  id: 'eng-open-nadia-03',
  stem: 'In your own words, say why Nadia counts.',
  passageRef: 'passage-corridor',
  lineRefs: [2],
  tariff: 2,
  creditModel: 'POINT',
  acceptableAnswers: [
    {
      text: 'counting stops her feeling nervous',
      tolerance: 'CLOSE_PARAPHRASE',
      barredNearMisses: [],
      conceptSets: [],
      pointId: 'calm',
    },
  ],
  bands: [],
  evidenceCapRule: false,
  ownWordsRequired: true,
  spagRiderChecks: [],
  misconceptions: [],
};

/** Evidence-capped POINT item. */
const evidenceItem: OpenResponseItem = {
  ...pointItem,
  id: 'eng-open-nadia-04',
  evidenceCapRule: true,
};

/** The ladder (§4) — GRADUATED credit, evidence-capped at the top rung. */
const ladderItem: OpenResponseItem = {
  id: 'eng-open-nadia-05',
  stem: 'How does the writer make the building feel alive?',
  passageRef: 'passage-corridor',
  lineRefs: [4],
  tariff: 6,
  creditModel: 'GRADUATED',
  acceptableAnswers: [
    {
      text: 'the building breathes at the end of the passage',
      tolerance: 'CLOSE_PARAPHRASE',
      barredNearMisses: [],
      conceptSets: [],
      rung: 'LOCATE',
      feedback: 'You found the line that does the work.',
    },
    {
      text: 'the writer uses personification',
      tolerance: 'CONCEPT',
      barredNearMisses: [],
      conceptSets: [['personification', 'human', 'person', 'alive']],
      rung: 'NAME',
    },
    {
      text: 'it makes the building feel like something watching her',
      tolerance: 'CONCEPT',
      barredNearMisses: [],
      conceptSets: [['watching', 'waiting', 'threat', 'danger']],
      rung: 'EXPLAIN_EFFECT',
    },
    {
      text: 'the building both shelters her and threatens her',
      tolerance: 'CONCEPT',
      barredNearMisses: [],
      conceptSets: [
        ['shelter', 'safe', 'protects'],
        ['threat', 'danger', 'frightening'],
      ],
      rung: 'DEVELOP',
    },
  ],
  bands: [
    { level: 'LOCATE', descriptor: 'You point at the right line.', exampleAnswer: 'The building breathes.', marks: 1 },
    {
      level: 'NAME',
      descriptor: 'You name what the writer is doing.',
      exampleAnswer: 'The writer gives the building a human action.',
      marks: 3,
    },
    {
      level: 'EXPLAIN_EFFECT',
      descriptor: 'You say what it does to the reader.',
      exampleAnswer: 'It makes the building feel like something watching her.',
      marks: 5,
    },
    {
      level: 'DEVELOP',
      descriptor: 'You notice a complication: two feelings pulling against each other.',
      exampleAnswer: 'The building shelters her and threatens her at the same time.',
      marks: 6,
    },
  ],
  evidenceCapRule: true,
  ownWordsRequired: false,
  spagRiderChecks: [],
  misconceptions: [],
};

const mark = (item: OpenResponseItem, answer: string) =>
  markOpenResponse({ item, answer, passageText: PASSAGE });

/* ------------------------------------------------------------------ *
 * Gate #1 — the publish gate
 * ------------------------------------------------------------------ */

describe('validateForPublish (gate #1: what an item may not ship without)', () => {
  const fields = (item: OpenResponseItem) => validateForPublish(item).failures.map((f) => f.field);

  it('passes the authored fixtures', () => {
    for (const item of [pointItem, exactItem, ownWordsItem, evidenceItem, ladderItem]) {
      expect(validateForPublish(item)).toEqual({ ok: true, failures: [] });
    }
  });

  it('REFUSES an item with an empty acceptable-answer set', () => {
    const check = validateForPublish({ ...pointItem, acceptableAnswers: [], requiredPoints: undefined });
    expect(check.ok).toBe(false);
    expect(check.failures[0]).toMatchObject({ field: 'acceptableAnswers' });
  });

  it('REFUSES a tariff outside 1–12', () => {
    expect(fields({ ...pointItem, tariff: 0 })).toContain('tariff');
    expect(fields({ ...pointItem, tariff: 13 })).toContain('tariff');
    expect(fields({ ...pointItem, tariff: 2.5 })).toContain('tariff');
  });

  it('REFUSES a GRADUATED item missing a band', () => {
    const check = validateForPublish({
      ...ladderItem,
      bands: ladderItem.bands.filter((band) => band.level !== 'DEVELOP'),
    });
    expect(check.ok).toBe(false);
    expect(check.failures.some((f) => f.reason.includes('DEVELOP'))).toBe(true);
  });

  it('REFUSES a GRADUATED band with no example answer', () => {
    const check = validateForPublish({
      ...ladderItem,
      bands: ladderItem.bands.map((band) =>
        band.level === 'EXPLAIN_EFFECT' ? { ...band, exampleAnswer: '   ' } : band,
      ),
    });
    expect(check.ok).toBe(false);
    expect(fields({
      ...ladderItem,
      bands: ladderItem.bands.map((band) =>
        band.level === 'EXPLAIN_EFFECT' ? { ...band, exampleAnswer: '   ' } : band,
      ),
    })).toContain('bands.EXPLAIN_EFFECT.exampleAnswer');
  });

  it('REFUSES a CONCEPT answer with no authored concept vocabulary', () => {
    const check = validateForPublish({
      ...pointItem,
      acceptableAnswers: pointItem.acceptableAnswers.map((answer) =>
        answer.tolerance === 'CONCEPT' ? { ...answer, conceptSets: [] } : answer,
      ),
    });
    expect(check.ok).toBe(false);
    expect(check.failures.some((f) => f.reason.includes('never invents synonyms'))).toBe(true);
  });

  it('REFUSES more required points than the authored answers can credit', () => {
    expect(fields({ ...pointItem, requiredPoints: 3 })).toContain('acceptableAnswers');
  });

  it('REFUSES a GRADUATED answer that does not say which rung it evidences', () => {
    const check = validateForPublish({
      ...ladderItem,
      acceptableAnswers: ladderItem.acceptableAnswers.map((answer, index) =>
        index === 0 ? { ...answer, rung: undefined } : answer,
      ),
    });
    expect(check.ok).toBe(false);
    expect(fields({
      ...ladderItem,
      acceptableAnswers: ladderItem.acceptableAnswers.map((answer, index) =>
        index === 0 ? { ...answer, rung: undefined } : answer,
      ),
    })).toContain('acceptableAnswers[0].rung');
  });

  it('REFUSES an own-words item with no passage reference', () => {
    expect(fields({ ...ownWordsItem, passageRef: '  ' })).toContain('passageRef');
  });

  it('REFUSES a SPaG rider with no label, or a label that judges the writing (gate #9)', () => {
    expect(fields({ ...exactItem, spagRiderLabel: undefined })).toContain('spagRiderLabel');
    expect(fields({ ...exactItem, spagRiderLabel: 'Spelling mistakes' })).toContain('spagRiderLabel');
  });

  it('REFUSES banned vocabulary anywhere a child would read it (gate #11)', () => {
    const check = validateForPublish({
      ...ladderItem,
      bands: ladderItem.bands.map((band) =>
        band.level === 'LOCATE' ? { ...band, descriptor: 'This one is wrong.' } : band,
      ),
    });
    expect(check.ok).toBe(false);
    expect(check.failures.some((f) => f.reason.includes('banned child-facing vocabulary'))).toBe(true);
  });

  it('REFUSES a misconception tag the item does not list', () => {
    const check = validateForPublish({
      ...pointItem,
      acceptableAnswers: pointItem.acceptableAnswers.map((answer, index) =>
        index === 0 ? { ...answer, misconceptionId: 'eng-nadia-surface-read' } : answer,
      ),
    });
    expect(check.ok).toBe(false);
  });

  it('parses a well-formed item and rejects an empty example answer at the schema door too', () => {
    expect(openResponseItemSchema.safeParse(ladderItem).success).toBe(true);
    expect(
      openResponseItemSchema.safeParse({
        ...ladderItem,
        bands: [{ level: 'LOCATE', descriptor: 'ok', exampleAnswer: '' }],
      }).success,
    ).toBe(false);
  });

  it('refuses to MARK an item that could not publish — no silent degradation', () => {
    expect(() => mark({ ...pointItem, acceptableAnswers: [], requiredPoints: undefined }, 'anything')).toThrow(
      /cannot publish/,
    );
  });

  it('refuses to mark an own-words item without the passage', () => {
    expect(() => markOpenResponse({ item: ownWordsItem, answer: 'she counts to settle' })).toThrow(
      /passage text is required/,
    );
  });
});

/* ------------------------------------------------------------------ *
 * The three tolerance tiers
 * ------------------------------------------------------------------ */

describe('EXACT tolerance', () => {
  it('ignores case, punctuation, whitespace and contractions', () => {
    expect(mark(exactItem, 'The Seventh!').kind).toBe('credit');
    expect(mark(exactItem, '  the   seventh  ').kind).toBe('credit');
    expect(mark(exactItem, "She can't see.").kind).toBe('credit');
  });

  it('does not stretch any further than that', () => {
    expect(mark(exactItem, 'the seventh door').kind).toBe('compare');
    expect(mark(exactItem, 'the seven').kind).toBe('compare');
  });
});

describe('CLOSE_PARAPHRASE tolerance', () => {
  it('matches a reordered, reworded answer above both thresholds', () => {
    const verdict = mark(pointItem, 'Counting stopped her hands shaking.');
    expect(verdict.kind).toBe('credit');
    expect(verdict.matchedPoints[0]?.pointId).toBe('calm');
  });

  it('does not match an answer that shares only a word or two', () => {
    const verdict = mark(pointItem, 'She was frightened of the dark corridor.');
    expect(verdict.kind).toBe('compare');
    expect(verdict.diagnostics.bestCoverage).toBeLessThan(0.6);
  });

  it('is order-insensitive and stopword-blind', () => {
    const answer = matchAcceptableAnswer(
      { text: 'the dark tunnel frightened her', tolerance: 'CLOSE_PARAPHRASE', barredNearMisses: [], conceptSets: [] },
      'she was frightened by a tunnel that was very dark',
    );
    expect(answer.matched).toBe(true);
  });

  it('refuses an answer that buys coverage with length (the Dice floor)', () => {
    const short = { text: 'she cannot see', tolerance: 'CLOSE_PARAPHRASE' as const, barredNearMisses: [], conceptSets: [] };
    expect(matchAcceptableAnswer(short, 'she could not see').matched).toBe(true);
    // Coverage alone would credit a child who copies the paragraph and hopes
    // the answer is somewhere inside it. The symmetric floor is what stops it.
    expect(matchAcceptableAnswer(short, `she cannot see ${PASSAGE}`).coverage).toBe(1);
    expect(matchAcceptableAnswer(short, `she cannot see ${PASSAGE}`).matched).toBe(false);
  });
});

describe('CONCEPT tolerance', () => {
  it('matches only on the AUTHOR’s concept vocabulary', () => {
    expect(mark(pointItem, 'She wanted to stay steady.').kind).toBe('credit');
    // "settled" is a perfectly good synonym. The author did not write it
    // down, so the engine does not know it — and never invents it.
    expect(mark(pointItem, 'She wanted to feel settled.').kind).toBe('compare');
  });

  it('needs every authored concept set, not just one', () => {
    const onlyShelter = mark(ladderItem, 'The building feels like a shelter to her.');
    expect(onlyShelter.rungReached).not.toBe('DEVELOP');
  });
});

describe('barredNearMisses (the authored traps)', () => {
  it('blocks a match however high the similarity', () => {
    const trap = 'She could not see and she likes the dark.';
    const loose = matchAcceptableAnswer(
      { ...pointItem.acceptableAnswers[2]!, barredNearMisses: [] },
      trap,
    );
    expect(loose.matched).toBe(true); // similarity alone would credit it

    const verdict = mark(pointItem, trap);
    expect(verdict.kind).toBe('compare');
    expect(verdict.diagnostics.barredHits).toEqual(['she likes the dark']);
    expect(verdict.diagnostics.reasons).toEqual(['barred-near-miss']);
  });

  it('is order-insensitive, like the matching it blocks', () => {
    expect(mark(pointItem, 'The dark is something she likes, and she could not see.').kind).toBe('compare');
  });
});

/* ------------------------------------------------------------------ *
 * Own words, evidence, credit
 * ------------------------------------------------------------------ */

describe('ownWordsRequired (lifting scores zero)', () => {
  it('detects a lifted run and returns no credit — without ever saying so', () => {
    const verdict = mark(ownWordsItem, 'counting kept her hands from shaking');
    expect(verdict.kind).toBe('compare');
    expect(verdict.diagnostics.lifted).toBe(true);
    expect(verdict.diagnostics.reasons).toEqual(['lifted-from-passage']);
    expect(verdict.marks).toBe(0);
    expect(verdict.modelAnswer).toBe('counting stops her feeling nervous');
  });

  it('credits the same idea in the child’s own words', () => {
    const verdict = mark(ownWordsItem, 'Counting stops her feeling nervous inside.');
    expect(verdict.kind).toBe('credit');
    expect(verdict.diagnostics.lifted).toBe(false);
  });

  it('leaves short unavoidable overlaps alone', () => {
    expect(longestCommonRun(['in', 'the', 'dark'], ['stood', 'in', 'the', 'dark', 'listening'])).toBe(3);
    const verdict = mark(ownWordsItem, 'Counting stops her feeling nervous in the dark.');
    expect(verdict.diagnostics.lifted).toBe(false);
  });
});

describe('evidenceCapRule (an unsupported answer hits a ceiling)', () => {
  it('caps POINT credit below the tariff when nothing from the passage is quoted', () => {
    const verdict = mark(evidenceItem, 'She stays calm and it is too dark to see.');
    expect(verdict.kind).toBe('credit');
    expect(verdict.diagnostics.evidencePresent).toBe(false);
    expect(verdict.diagnostics.evidenceCapApplied).toBe(true);
    expect(verdict.marks).toBe(1);
  });

  it('lifts the cap when the child quotes', () => {
    const verdict = mark(
      evidenceItem,
      'She stays calm and it is too dark to see: "listening to the building" proves it.',
    );
    expect(verdict.diagnostics.evidencePresent).toBe(true);
    expect(verdict.marks).toBe(2);
  });

  it('caps the LADDER below the top rung without evidence, and releases it with', () => {
    const unsupported = mark(
      ladderItem,
      'The writer makes it human and watching her, so it is both shelter and danger.',
    );
    expect(unsupported.rungReached).toBe('EXPLAIN_EFFECT');
    expect(unsupported.diagnostics.evidenceCapApplied).toBe(true);

    const supported = mark(
      ladderItem,
      'The writer makes it human and watching her — "the building breathe" — so it is both shelter and danger.',
    );
    expect(supported.rungReached).toBe('DEVELOP');
  });
});

describe('POINT credit', () => {
  it('awards one mark per distinct authored point', () => {
    const verdict = mark(pointItem, 'Counting stopped her hands shaking, and it was too dark to see.');
    expect(verdict.marks).toBe(2);
    expect(new Set(verdict.matchedPoints.map((point) => point.pointId))).toEqual(new Set(['calm', 'dark']));
  });

  it('credits the same point once, however many ways the child says it', () => {
    const verdict = mark(pointItem, 'Counting stopped her hands shaking and kept her calm.');
    expect(verdict.matchedPoints.length).toBe(2); // two authored patterns…
    expect(verdict.marks).toBe(1); // …one point
  });

  it('never exceeds the tariff', () => {
    const verdict = mark(pointItem, 'Counting stopped her hands shaking, she stays calm, and it was too dark to see.');
    expect(verdict.marks).toBeLessThanOrEqual(pointItem.tariff);
  });

  it('returns the authored feedback for the matched pattern, verbatim', () => {
    const verdict = mark(pointItem, 'Counting stopped her hands shaking.');
    expect(verdict.matchedPoints[0]?.feedback).toBe('You tracked why she counts.');
  });
});

describe('GRADUATED credit (the ladder, §4)', () => {
  it('returns the rung NAME reached and what the next rung adds — never a number to the child', () => {
    const verdict = mark(ladderItem, 'The building is described like a person.');
    expect(verdict.rungReached).toBe('NAME');
    expect(verdict.rungBand?.descriptor).toBe('You name what the writer is doing.');
    expect(verdict.nextRung?.level).toBe('EXPLAIN_EFFECT');
    expect(verdict.nextRung?.descriptor).toBe('You say what it does to the reader.');
  });

  it('reaches the top rung only when the complication is noticed', () => {
    const top = mark(
      ladderItem,
      'The writer makes it human and watching her — "the building breathe" — so it is both shelter and danger.',
    );
    expect(top.rungReached).toBe('DEVELOP');
    expect(top.nextRung).toBeNull();
    expect(top.rungBand?.descriptor).toContain('complication');
  });

  it('keeps the mark for the record only, and the rungs in ladder order', () => {
    const verdict = mark(ladderItem, 'The building is described like a person.');
    expect(verdict.marks).toBe(3); // parent report / readiness, never rendered to the child
    expect(LADDER_RUNGS).toEqual(['LOCATE', 'NAME', 'EXPLAIN_EFFECT', 'DEVELOP']);
  });
});

/* ------------------------------------------------------------------ *
 * Gate #2 — the unmatched path
 * ------------------------------------------------------------------ */

describe('the unmatched path (gate #2)', () => {
  const verdict = mark(pointItem, 'She was thinking about her cousin in Leeds.');

  it('never marks the answer wrong — there is no verdict that means it', () => {
    expect(verdict.kind).toBe('compare');
    expect(['credit', 'compare']).toContain(verdict.kind);
  });

  it('always carries the authored model answer', () => {
    expect(verdict.modelAnswer).toBe('counting keeps her hands from shaking');
  });

  it('carries the band descriptors on a ladder item', () => {
    const ladder = mark(ladderItem, 'It is a spooky bit of the story.');
    expect(ladder.kind).toBe('compare');
    expect(ladder.modelAnswer).toBe('The building shelters her and threatens her at the same time.');
    expect(ladder.bands.map((band) => band.level)).toEqual([...LADDER_RUNGS]);
    expect(ladder.bands.every((band) => band.descriptor.length > 0)).toBe(true);
  });

  it('flags itself for reviewer sampling', () => {
    expect(verdict.logForReview).toBe(true);
    expect(verdict.diagnostics.reasons).toEqual(['no-match']);
  });

  it('does NOT sample answers whose outcome was already authored', () => {
    expect(mark(pointItem, '   ').logForReview).toBe(false);
    expect(mark(pointItem, 'She could not see and she likes the dark.').logForReview).toBe(false);
    expect(mark(ownWordsItem, 'counting kept her hands from shaking').logForReview).toBe(false);
  });
});

describe('the reviewer sampling log (S1/S5 minimisation)', () => {
  it('stores normalised text, no child link, and only when the verdict asks', () => {
    const unmatched = mark(pointItem, 'She was Thinking about her cousin!');
    const entry = buildUnmatchedAnswerLog(pointItem, 'She was Thinking about her cousin!', unmatched);
    expect(entry).toEqual({
      itemId: 'eng-open-nadia-01',
      normalisedAnswer: 'she was thinking about her cousin',
      tokenCount: 6,
      bestCoverage: 0,
      reasons: ['no-match'],
    });
    expect(Object.keys(entry ?? {})).not.toContain('childId');
  });

  it('returns nothing when the verdict did not ask to be logged', () => {
    const credited = mark(pointItem, 'Counting stopped her hands shaking.');
    expect(buildUnmatchedAnswerLog(pointItem, 'Counting stopped her hands shaking.', credited)).toBeNull();
  });

  it('strips the shapes of personal detail before anything is stored (S5)', () => {
    const raw = 'my mum is at nadia@example.com or 07700 900123, CB4 1XY';
    const redacted = redactPersonalDetail(raw);
    expect(redacted).not.toContain('@');
    expect(redacted).not.toMatch(/\d/);
    expect(redacted).not.toMatch(/CB4/i);
  });

  it('caps what it keeps', () => {
    const long = `${'the corridor was very long '.repeat(60)}`;
    const verdict = mark(pointItem, long);
    const entry = buildUnmatchedAnswerLog(pointItem, long, verdict);
    expect((entry?.normalisedAnswer.length ?? 0) <= 300).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Gate #9 — the SPaG rider
 * ------------------------------------------------------------------ */

describe('the SPaG rider (gate #9)', () => {
  it('scores separately, with an authored neutral label and no criticism string', () => {
    const verdict = mark(exactItem, 'the seventh');
    expect(verdict.spag).toEqual({
      label: 'Writing accuracy',
      marksAvailable: 1,
      marksAwarded: 0,
      checksNotMet: ['CAPITAL_START', 'TERMINAL_PUNCTUATION'],
    });
  });

  it('awards the rider when the authored checks are met', () => {
    expect(mark(exactItem, 'The seventh.').spag?.marksAwarded).toBe(1);
  });

  it('never touches the comprehension verdict — the child can be told nothing about spelling', () => {
    const scruffy = mark(exactItem, 'the seventh');
    const tidy = mark(exactItem, 'The seventh.');
    expect(scruffy.kind).toBe(tidy.kind);
    expect(scruffy.marks).toBe(tidy.marks);
    expect(scruffy.matchedPoints.map((point) => point.pointId)).toEqual(
      tidy.matchedPoints.map((point) => point.pointId),
    );
    // The only thing that differs is a structured field the caller may hold
    // back entirely: there is no string here to show mid-comprehension.
    expect(scruffy.spag?.marksAwarded).not.toBe(tidy.spag?.marksAwarded);
    expect(typeof scruffy.spag?.checksNotMet[0]).toBe('string');
    expect(scruffy.spag?.checksNotMet).not.toContain(' ');
  });

  it('checks only the spellings the author wrote down — there is no dictionary', () => {
    const withBarred: OpenResponseItem = {
      ...exactItem,
      spagRiderChecks: [{ kind: 'BARRED_SPELLINGS', barredSpellings: ['definately'] }],
    };
    expect(mark(withBarred, 'the seventh').spag?.marksAwarded).toBe(1); // capitals are not checked here
    expect(mark(withBarred, 'the seventh definately').spag?.checksNotMet).toEqual(['BARRED_SPELLINGS']);
  });

  it('is absent entirely on an item that carries no rider', () => {
    expect(mark(pointItem, 'Counting stopped her hands shaking.').spag).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * S3 — the engine has no vocabulary of its own
 * ------------------------------------------------------------------ */

const CHILD_FACING_OF = (verdict: OpenResponseVerdict): string[] => [
  ...(verdict.modelAnswer === null ? [] : [verdict.modelAnswer]),
  ...verdict.matchedPoints.flatMap((point) => (point.feedback === null ? [] : [point.feedback])),
  ...verdict.bands.flatMap((band) => [band.descriptor, band.exampleAnswer]),
  ...(verdict.rungBand === null ? [] : [verdict.rungBand.descriptor, verdict.rungBand.exampleAnswer]),
  ...(verdict.nextRung === null ? [] : [verdict.nextRung.descriptor, verdict.nextRung.exampleAnswer]),
  ...(verdict.spag === null ? [] : [verdict.spag.label]),
];

const EVERY_VERDICT: Array<[OpenResponseItem, OpenResponseVerdict]> = [
  [pointItem, mark(pointItem, 'Counting stopped her hands shaking, and it was too dark to see.')],
  [pointItem, mark(pointItem, 'She was thinking about her cousin.')],
  [pointItem, mark(pointItem, '')],
  [pointItem, mark(pointItem, 'She could not see and she likes the dark.')],
  [exactItem, mark(exactItem, 'The Seventh!')],
  [exactItem, mark(exactItem, 'no idea')],
  [ownWordsItem, mark(ownWordsItem, 'counting kept her hands from shaking')],
  [ownWordsItem, mark(ownWordsItem, 'Counting stops her feeling nervous inside.')],
  [evidenceItem, mark(evidenceItem, 'She stays calm and it is too dark to see.')],
  [ladderItem, mark(ladderItem, 'The building is described like a person.')],
  [ladderItem, mark(ladderItem, 'It is a spooky bit of the story.')],
  [
    ladderItem,
    mark(ladderItem, 'The writer makes it human and watching her — "the building breathe" — so it is both shelter and danger.'),
  ],
];

describe('S3: every returned string is one the author wrote', () => {
  it('holds for every verdict this suite produces', () => {
    for (const [item, verdict] of EVERY_VERDICT) {
      const pool = authoredStrings(item);
      for (const text of CHILD_FACING_OF(verdict)) {
        expect(pool.has(text), `"${text}" is not authored on ${item.id}`).toBe(true);
      }
      expect(() => assertAuthoredVerdict(verdict, item)).not.toThrow();
    }
  });

  it('catches a verdict carrying text the engine composed', () => {
    const [item, verdict] = EVERY_VERDICT[0]!;
    const forged = { ...verdict, modelAnswer: 'You should have said the tunnel was dark.' as never };
    expect(() => assertAuthoredVerdict(forged, item)).toThrow(/S3 breach/);
  });

  it('refuses to mint authored text that is not on the item', () => {
    const pool = authoredStrings(pointItem);
    expect(() => asAuthored(pool, 'nice try')).toThrow(/S3 breach/);
    expect(asAuthored(pool, 'she wants to stay calm')).toBe('she wants to stay calm');
  });
});

describe('D1 / Addendum A §1.3: banned vocabulary cannot reach a child', () => {
  it('appears in no child-facing string of any verdict', () => {
    for (const [item, verdict] of EVERY_VERDICT) {
      for (const text of CHILD_FACING_OF(verdict)) {
        expect(bannedVocabularyIn(text), `${item.id}: "${text}"`).toEqual([]);
      }
    }
  });

  it('has no way in, because the publish gate is the door', () => {
    for (const rule of BANNED_CHILD_FACING) {
      expect(rule.pattern.test('This answer is wrong, incorrect and a failure. You should have. Unfortunately you are behind, weak, poor, careless and clever. An error. You must.')).toBe(
        true,
      );
    }
  });

  it('proves the two words that matter are absent from the whole verdict payload', () => {
    for (const [, verdict] of EVERY_VERDICT) {
      const payload = JSON.stringify(verdict);
      expect(/\bwrong\b/i.test(payload)).toBe(false);
      expect(/\bincorrect\b/i.test(payload)).toBe(false);
    }
  });
});

/* ------------------------------------------------------------------ *
 * The primitives, so the thresholds stay explainable
 * ------------------------------------------------------------------ */

describe('text primitives', () => {
  it('normalises case, punctuation and contractions', () => {
    expect(normalise("She Can't — really — see!")).toBe('she cannot really see');
    expect(normalise('  ')).toBe('');
  });

  it('stems the inflections children actually vary', () => {
    expect(stem('counting')).toBe(stem('counted'));
    expect(stem('hands')).toBe(stem('hand'));
    expect(stem('hoped')).toBe(stem('hope'));
    expect(stem('the')).toBe('the');
  });

  it('finds the longest verbatim run', () => {
    expect(longestCommonRun(['a', 'b', 'c'], ['x', 'a', 'b', 'c', 'y'])).toBe(3);
    expect(longestCommonRun([], ['a'])).toBe(0);
  });
});
