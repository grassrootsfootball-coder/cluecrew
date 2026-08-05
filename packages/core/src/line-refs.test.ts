import { describe, expect, it } from 'vitest';
import {
  checkLineRefs,
  extractLineCitations,
  extractQuotedSpans,
  findSpan,
  lastLineOf,
  verbatimCheck,
  type CitablePassage,
} from './line-refs';

// Hard-wrapped mid-sentence and broken by a paragraph, exactly like the real
// curated extracts — the two properties that broke the first implementation.
const passage: CitablePassage = {
  id: 'test-extract',
  numberedLines: [
    { n: 1, text: 'The Mole had been working very hard all the morning,' },
    { n: 2, text: 'spring-cleaning his little home. First with brooms, then with' },
    { n: 3, text: 'dusters; till he had dust in his throat and eyes.' },
    { n: null, text: '' },
    { n: 4, text: '“This is fine!” he said to himself. “This is better than' },
    { n: 5, text: 'whitewashing!” The sunlight was warm on his fur.' },
  ],
};

describe('line numbering', () => {
  it('counts the last LINE, not the array length', () => {
    // The array has six entries; the passage has five lines. Anything using
    // .length would accept a citation to line 6, which does not exist.
    expect(passage.numberedLines).toHaveLength(6);
    expect(lastLineOf(passage)).toBe(5);
  });

  it('rejects a citation past the end', () => {
    const failures = checkLineRefs({ label: 't', passageRef: 'test-extract', passage, lineRefs: [6] });
    expect(failures).toHaveLength(1);
    expect(failures[0]!.rule).toBe('line-out-of-range');
  });

  it('reports a missing passage rather than passing silently', () => {
    const failures = checkLineRefs({ label: 't', passageRef: 'nope', passage: undefined, lineRefs: [1] });
    expect(failures[0]!.rule).toBe('no-such-passage');
  });
});

describe('finding a span', () => {
  it('reports the line the span BEGINS on, not where the search began', () => {
    // This is the regression that produced a uniform six-line offset: a
    // sliding window returned the window's first line instead of the match's.
    expect(findSpan(passage, 'dust in his throat')).toBe(3);
    expect(findSpan(passage, 'The sunlight was warm')).toBe(5);
  });

  it('finds a span that crosses a line break', () => {
    expect(findSpan(passage, 'all the morning, spring-cleaning his little home')).toBe(1);
  });

  it('finds a span that crosses a paragraph break', () => {
    expect(findSpan(passage, 'in his throat and eyes. “This is fine!”')).toBe(3);
  });

  it('normalises typography — a curly apostrophe is the same words', () => {
    expect(findSpan(passage, '‘This is fine!’ he said')).toBe(4);
  });

  it('returns null for something that is not there', () => {
    expect(findSpan(passage, 'he flung down his brush')).toBeNull();
  });
});

describe('citations written in prose', () => {
  it('reads single lines, pairs and runs', () => {
    expect(extractLineCitations('Go straight to line 1.')).toEqual([1]);
    expect(extractLineCitations('Look at lines 11 and 12.')).toEqual([11, 12]);
    expect(extractLineCitations('Lines 34 to 36 match the Mole to a child.')).toEqual([34, 35, 36]);
  });

  it('ignores numbers that are not line citations', () => {
    expect(extractLineCitations('There are 5 rabbits and 3 stoats.')).toEqual([]);
  });
});

describe('quoted spans in prose', () => {
  it('does not mistake a possessive apostrophe for an opening quote', () => {
    // The bug this guards: /'…'/ paired the apostrophe in "Darcy's" with the
    // next one and reported the words between them as a quote.
    expect(extractQuotedSpans("Darcy's one cross moment is the ball's early end.")).toEqual([]);
  });

  it('still reads a real quotation', () => {
    expect(extractQuotedSpans("He goes 'without even waiting' at once.")).toEqual(['without even waiting']);
  });

  it('ignores a one-word gloss', () => {
    expect(extractQuotedSpans("'party' means a group of people")).toEqual([]);
  });
});

describe('anchoring a citation', () => {
  it('passes when a quote begins at a cited line, even if it runs past it', () => {
    const failures = checkLineRefs({
      label: 't',
      passageRef: 'test-extract',
      passage,
      text: "Read line 2 to the end. He goes 'spring-cleaning his little home. First with brooms'.",
    });
    expect(failures).toEqual([]);
  });

  it('allows a script to quote away from the line it sends the child to', () => {
    // "back on line 1 he had…" is correct writing, not a bad reference: at
    // least one quote anchors the citation.
    const failures = checkLineRefs({
      label: 't',
      passageRef: 'test-extract',
      passage,
      text: "Look at line 3. He has 'dust in his throat'. Later comes 'The sunlight was warm'.",
    });
    expect(failures).toEqual([]);
  });

  it('fails when NO quote anchors the cited line', () => {
    const failures = checkLineRefs({
      label: 't',
      passageRef: 'test-extract',
      passage,
      text: "Go straight to line 1. It says 'The sunlight was warm on his fur'.",
    });
    expect(failures).toHaveLength(1);
    expect(failures[0]!.rule).toBe('quote-not-at-cited-lines');
  });

  it('holds a quotation to the passage EXACTLY, apparent errors included', () => {
    // Grahame prints "its". An item that "corrects" it to "it's" sends a
    // child scanning the passage for words that are not there.
    const grahame: CitablePassage = {
      id: 'wiw',
      numberedLines: [{ n: 1, text: '“Oh, its all very well to talk,” said the Mole, rather pettishly.' }],
    };
    expect(
      checkLineRefs({ label: 't', passageRef: 'wiw', passage: grahame, declaredQuotes: ['Oh, its all very well to talk'] }),
    ).toEqual([]);
    const corrected = checkLineRefs({
      label: 't',
      passageRef: 'wiw',
      passage: grahame,
      declaredQuotes: ["Oh, it's all very well to talk"],
    });
    expect(corrected[0]!.rule).toBe('quote-not-verbatim');
  });

  it('tolerates sentence-initial capitalisation of a quoted word', () => {
    // "till he had dust…" set at the head of our sentence becomes "Till".
    expect(
      checkLineRefs({ label: 't', passageRef: 'test-extract', passage, declaredQuotes: ['Till he had dust in his throat'] }),
    ).toEqual([]);
    expect(verbatimCheck(passage, 'Till he had dust in his throat')).toBe('initial-capital');
  });

  it('tolerates terminal punctuation on a truncated quote', () => {
    // The passage runs on with a full stop after "eyes"; closing our own
    // quotation with a comma or a full stop earlier is a setting artefact.
    expect(
      checkLineRefs({ label: 't', passageRef: 'test-extract', passage, declaredQuotes: ['he had dust in his throat,'] }),
    ).toEqual([]);
    expect(verbatimCheck(passage, 'he had dust in his throat,')).toBe('terminal-punctuation');
  });

  it('tolerates NOTHING else — an interior change is still a failure', () => {
    // pp-19's fault: an attribution deleted from the middle. Not terminal,
    // not initial, not tolerated.
    expect(verbatimCheck(passage, 'he had dust in his eyes and throat')).toBe('altered');
    const failures = checkLineRefs({
      label: 't',
      passageRef: 'test-extract',
      passage,
      declaredQuotes: ['he had dust in his eyes and throat'],
    });
    expect(failures[0]!.rule).toBe('quote-not-verbatim');
  });

  it('allows a quotation to be TRUNCATED — quoting less is still quoting', () => {
    // Austen runs on with a comma; stopping early is faithful, closing the
    // span with an invented full stop is not.
    expect(
      checkLineRefs({ label: 't', passageRef: 'test-extract', passage, declaredQuotes: ['he had dust in his throat'] }),
    ).toEqual([]);
    // Superseded 2026-08-02: a full stop closing a truncated quote used to
    // fail and is now one of the two permitted tolerances. Kept as the record
    // of the change rather than deleted.
    expect(verbatimCheck(passage, 'he had dust in his throat.')).toBe('terminal-punctuation');
  });

  it('reports where a near-miss quote diverges', () => {
    const failures = checkLineRefs({
      label: 't',
      passageRef: 'test-extract',
      passage,
      declaredQuotes: ['he had dust in his throat and ears.'],
    });
    expect(failures[0]!.rule).toBe('quote-not-verbatim');
    expect(failures[0]!.detail).toContain('diverges');
    expect(failures[0]!.detail).toContain('throat and eyes');
  });
});

describe('cloze vehicles count gaps, not lines', () => {
  const vehicle: CitablePassage = {
    id: 'cloze-test',
    gapCount: 8,
    numberedLines: [
      { n: 1, text: 'Maya had never volunteered for anything ___(1)___ before.' },
      { n: 2, text: 'By lunchtime she had spent ___(2)___ hour drawing a plan.' },
    ],
  };

  it('accepts a gapRef inside the gap count', () => {
    expect(checkLineRefs({ label: 't', passageRef: 'cloze-test', passage: vehicle, gapRef: 8 })).toEqual([]);
  });

  it('rejects a gap past the end', () => {
    const failures = checkLineRefs({ label: 't', passageRef: 'cloze-test', passage: vehicle, gapRef: 9 });
    expect(failures.map((failure) => failure.rule)).toContain('line-out-of-range');
  });

  it('still refuses lineRefs on a cloze vehicle — an unmigrated row', () => {
    // The rename IS the fix: a gap number resolved as a line number was
    // always "in range" in the real vehicles, so the citation certified
    // itself. A row still carrying lineRefs has not been migrated.
    const failures = checkLineRefs({ label: 't', passageRef: 'cloze-test', passage: vehicle, lineRefs: [2] });
    expect(failures.map((failure) => failure.rule)).toEqual(['citation-unit']);
  });

  it('refuses a gapRef on a prose passage — the other direction', () => {
    const failures = checkLineRefs({ label: 't', passageRef: 'test-extract', passage, gapRef: 3 });
    expect(failures.map((failure) => failure.rule)).toContain('citation-unit');
  });
});
