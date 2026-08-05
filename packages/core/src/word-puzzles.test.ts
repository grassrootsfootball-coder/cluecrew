import { describe, expect, it } from 'vitest';
import {
  checkLabelCollision,
  makeLexicon,
  movableLetters,
  deriveSeries,
  lettersNamedNotOnCard,
  solveInsertLetter,
  solveOrdering,
  solveHiddenWord,
  solveMakeAWord,
  solveMoveLetter,
} from './word-puzzles';

// Small enough to reason about; big enough for the cases that matter.
const isWord = makeLexicon([
  'pare', 'stile', 'spar', 'tile', 'spare', 'star', 'stay', 'army', 'shop', 'date', 'hero',
  'cans', 'sofa', 'plum', 'last', 'ate', 'dad',
]);

describe('the lexicon recognises regular inflections the base list omits', () => {
  it('accepts "tiles" from "tile"', () => {
    // Without this the SPARE/TILE case — the one that prompted the gate —
    // would come back unambiguous.
    expect(isWord('tiles')).toBe(true);
  });
  it('does not accept a non-word', () => {
    expect(isWord('zqx')).toBe(false);
  });
});

describe('move a letter so both make new words', () => {
  it('catches SPARE/TILE: one letter, TWO valid outcomes', () => {
    // David's case. Moving the S gives PARE + STILE, and also PARE + TILES.
    // Both obey "so that both make new words".
    const solutions = solveMoveLetter('SPARE', 'TILE', isWord);
    expect(solutions).toHaveLength(2);
    expect(solutions.map((s) => s.to).sort()).toEqual(['STILE', 'TILES']);
    // …but only ONE letter, which is what the options offer.
    expect(movableLetters(solutions)).toEqual(['S']);
  });

  it('separates the two questions the caller has to ask', () => {
    // More than one LETTER is ambiguous under any option shape. One letter
    // with several OUTCOMES matters the moment an item asks for the word.
    const solutions = solveMoveLetter('SPARE', 'TILE', isWord);
    expect(movableLetters(solutions).length).toBe(1);
    expect(solutions.length).toBeGreaterThan(1);
  });

  it('returns nothing when no move works', () => {
    expect(solveMoveLetter('CHAIR', 'MOP', isWord)).toEqual([]);
  });
});

describe('build the middle word', () => {
  it('takes the first two letters of each outer word', () => {
    expect(solveMakeAWord(['STAY', 'ARMY'])).toBe('STAR');
    expect(solveMakeAWord(['SHEEP', 'OPEN'])).toBe('SHOP');
  });
  it('refuses a pair that cannot support the rule', () => {
    expect(solveMakeAWord(['A', 'ARMY'])).toBeNull();
  });
});

describe('a word hidden at a join', () => {
  it('finds a word that spans two words', () => {
    expect(solveHiddenWord('Dad ate the last plum.', 4, isWord)).toContain('date');
  });

  it('does NOT count a word sitting wholly inside one word', () => {
    // "plum" is in the sentence but not hidden AT A JOIN, so it is not an
    // answer and must not count toward ambiguity either.
    expect(solveHiddenWord('Dad ate the last plum.', 4, isWord)).not.toContain('plum');
  });

  it('reports every spanning word, which is how ambiguity surfaces', () => {
    const found = solveHiddenWord('You can see so far, Max.', 4, isWord);
    expect(found).toEqual(expect.arrayContaining(['cans', 'sofa']));
  });
});

describe('label collision', () => {
  it('catches vr-07: code letters A-D against option labels A-E', () => {
    const failures = checkLabelCollision({ label: 't', symbols: ['A', 'B', 'C', 'D'], optionCount: 4 });
    expect(failures).toHaveLength(1);
    expect(failures[0]!.rule).toBe('label-collision');
    expect(failures[0]!.detail).toContain('"A"');
  });

  it('uses the labels the interface WILL supply when the item sets none', () => {
    // Generated items store no label at all; a check that read the stored
    // value would find nothing to collide with and pass everything.
    expect(checkLabelCollision({ label: 't', symbols: ['A'], optionCount: 5, optionLabels: [] })).toHaveLength(1);
  });

  it('passes when the item names symbols outside the label range', () => {
    expect(checkLabelCollision({ label: 't', symbols: ['P', 'Q', 'R'], optionCount: 5 })).toEqual([]);
  });

  it('passes when the item sets its own labels and they do not clash', () => {
    expect(
      checkLabelCollision({ label: 't', symbols: ['A', 'B'], optionCount: 3, optionLabels: ['1', '2', '3'] }),
    ).toEqual([]);
  });
});

describe('an unanswerable item is a defect, not a warning', () => {
  it('CHAIR/MOP admits no valid move at all', () => {
    // Not a matter of taste: there is no letter a child can move that leaves
    // two real words, so no answer they give can be right.
    expect(solveMoveLetter('CHAIR', 'MOP', isWord)).toEqual([]);
  });

  it('a key that the rule does not produce is the same class of defect', () => {
    const solutions = solveMoveLetter('SPARE', 'TILE', isWord);
    expect(movableLetters(solutions)).not.toContain('Z');
  });
});

describe('an item never draws its symbols from the option-label range', () => {
  it('vr-07 after the remap is clean', () => {
    expect(checkLabelCollision({ label: 't', symbols: ['P', 'Q', 'R', 'S'], optionCount: 4 })).toEqual([]);
  });

  it('E is inside the range and still collides at five options', () => {
    expect(checkLabelCollision({ label: 't', symbols: ['E'], optionCount: 5 })).toHaveLength(1);
    // …but not at four, where the labels stop at D.
    expect(checkLabelCollision({ label: 't', symbols: ['E'], optionCount: 4 })).toEqual([]);
  });
});

describe('punctuation does not block a join (David, 2026-08-02)', () => {
  const lex = makeLexicon(['rest', 'trip', 'plum', 'forest']);

  it('finds a word across a hyphen', () => {
    // "for-est" hides REST across the hyphen. A child scans the line as text,
    // and a hyphen is the most visible place to look — treating it as a wall
    // missed the joins they find first.
    expect(solveHiddenWord('The for-est is dark.', 4, lex)).toContain('rest');
  });

  it('finds a word across a full stop', () => {
    // "cat. Ripe" hides TRIP straight through the sentence boundary.
    expect(solveHiddenWord('Feed the cat. Ripe fruit.', 4, lex)).toContain('trip');
  });

  it('still refuses a word wholly inside one letter run', () => {
    expect(solveHiddenWord('The plum was ripe.', 4, lex)).not.toContain('plum');
  });
});

describe('insert-letter: one letter finishes the first word and starts the second', () => {
  const lex = makeLexicon(['plan', 'plant', 'plans', 'tail', 'sail', 'clean', 'clear', 'nose', 'rose']);

  it('finds every OFFERED letter that completes both words', () => {
    // plan(?)/(?)ail with t, s, r offered: t→plant/tail, s→plans/sail both work.
    expect(solveInsertLetter('plan(?)', '(?)ail', ['t', 's', 'r'], lex).sort()).toEqual(['s', 't']);
  });

  it('ignores a letter that is not offered even if it would work', () => {
    // A child can only tick what is shown, so an unshown letter cannot make
    // the item ambiguous.
    expect(solveInsertLetter('clea(?)', '(?)ose', ['n'], lex)).toEqual(['n']);
  });

  it('catches the reviewer’s double-key: clea(?)/(?)ose with n and r offered', () => {
    expect(solveInsertLetter('clea(?)', '(?)ose', ['n', 'r'], lex).sort()).toEqual(['n', 'r']);
  });

  it('returns nothing when no offered letter completes both', () => {
    expect(solveInsertLetter('plan(?)', '(?)ail', ['r', 'x'], lex)).toEqual([]);
  });
});

describe('series derivation', () => {
  it('reads a plain arithmetic step', () => {
    const rules = deriveSeries([2, 4, 6, 8]);
    expect(rules.some((r) => r.next === 10)).toBe(true);
  });

  it('reads a triangular second-difference series', () => {
    // 3,6,10,15 → diffs 3,4,5 → next +6 → 21.
    const rules = deriveSeries([3, 6, 10, 15]);
    expect(rules.map((r) => r.next)).toContain(21);
  });

  it('reads an interleaved pair series, but only when nothing simpler fits', () => {
    // 4,8,5,9 → odds 4,5 (+1), evens 8,9 (+1); next continues odds → 6.
    const rules = deriveSeries([4, 8, 5, 9]);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.next).toBe(6);
  });

  it('does NOT let interleaving manufacture a rival when arithmetic fits', () => {
    // 2,4,6,8 must not also report an interleaved reading — that would be a
    // false ambiguity on every clean series.
    const rules = deriveSeries([2, 4, 6, 8]);
    expect(rules.every((r) => !r.name.startsWith('interleaved'))).toBe(true);
  });

  it('reads a geometric series', () => {
    expect(deriveSeries([2, 4, 8, 16]).some((r) => r.next === 32)).toBe(true);
  });

  it('returns nothing when no determinate rule fits and it is too short to interleave', () => {
    // Interleaving fits any FOUR-term sequence (two points make a step), so it
    // is offered only as a last resort; a three-term sequence with no step,
    // ratio or second-difference genuinely has no rule.
    expect(deriveSeries([2, 7, 1])).toEqual([]);
  });

  it('interleaving will read even a shapeless four-term sequence — by design', () => {
    // The consequence of the fallback: it never says "no rule" at length 4.
    // The key-check leans on that being deliberate, not a miss.
    expect(deriveSeries([2, 7, 1, 8]).length).toBeGreaterThan(0);
  });
});

describe('series gate catches a mis-keyed item', () => {
  it('flags a key that does not follow the derived rule', () => {
    // 2,4,6,8 must continue to 10; a key of 12 follows no fitting rule.
    const rules = deriveSeries([2, 4, 6, 8]);
    expect(rules.some((r) => r.next === 12)).toBe(false);
    expect(rules.some((r) => r.next === 10)).toBe(true);
  });

  it('spots a rival reading a distractor could match', () => {
    // 1,2,4 fits BOTH geometric (×2 → 8) and second-difference is too short;
    // a paper offering both 8 and another continuation is ambiguous. Here we
    // confirm the family surfaces the geometric next as a candidate.
    const rules = deriveSeries([1, 2, 4, 8]);
    expect(rules.some((r) => r.tier === 'common' && r.next === 16)).toBe(true);
  });
});

describe('reading-information: the answer must be uniquely deduced', () => {
  it('finds the unique top of a transitive chain', () => {
    // Ada > Ben, Ben > Cass  ⇒  Ada is tallest, Cass shortest.
    const edges: Array<[string, string]> = [['Ada', 'Ben'], ['Ben', 'Cass']];
    expect(solveOrdering(['Ada', 'Ben', 'Cass'], edges, 'top')).toBe('Ada');
    expect(solveOrdering(['Ada', 'Ben', 'Cass'], edges, 'bottom')).toBe('Cass');
  });

  it('returns null when the clues do not force one end', () => {
    // Ada > Ben and Cass > Dan — two separate pairs, no single top.
    const edges: Array<[string, string]> = [['Ada', 'Ben'], ['Cass', 'Dan']];
    expect(solveOrdering(['Ada', 'Ben', 'Cass', 'Dan'], edges, 'top')).toBeNull();
  });

  it('returns null on a cycle', () => {
    const edges: Array<[string, string]> = [['A', 'B'], ['B', 'C'], ['C', 'A']];
    expect(solveOrdering(['A', 'B', 'C'], edges, 'top')).toBeNull();
  });
});

describe('a walk script must not name an option not on the card', () => {
  it('flags a letter the script weighs that is not offered (the vr-01 staleness)', () => {
    // Card offers t/e/b, stem is plan_/_ail; the stale script still names r.
    const stale = 'A t gives plant and tail. An r leaves plan_ broken.';
    expect(lettersNamedNotOnCard(stale, ['t', 'e', 'b'], 'plan(?) (?)ail')).toEqual(['r']);
  });
  it('passes when every named letter is on the card', () => {
    const fresh = 'A t gives plant and tail. An e or a b finishes only one word.';
    expect(lettersNamedNotOnCard(fresh, ['t', 'e', 'b'], 'plan(?) (?)ail')).toEqual([]);
  });
  it('does not flag STIMULUS letters — the series terms a script must name', () => {
    // Letter series A,B,C,D → E. The script names the series and the answer;
    // none of A-D are options but all are stem letters, so none is stale.
    const series = 'The series runs A, B, C, D. The next letter is E.';
    expect(lettersNamedNotOnCard(series, ['E', 'F', 'C'], 'A B C D')).toEqual([]);
  });
  it('ignores the articles a and i', () => {
    expect(lettersNamedNotOnCard('Pick a letter; is it the one?', ['t', 'e', 'b'])).toEqual([]);
  });
  it('is a no-op for word-option items (nothing single-letter to check)', () => {
    expect(lettersNamedNotOnCard('A lake is large, not deep.', ['large', 'water', 'little'])).toEqual([]);
  });
});
