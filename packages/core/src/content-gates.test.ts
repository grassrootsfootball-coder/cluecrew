import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_SENTENCE_WORDS,
  ROLE_RULES,
  checkBannedVocabulary,
  checkChildFacingText,
  checkNoInternalIds,
  checkReadingAge,
  checkWordCard,
  isTestedToken,
  roleForItemStem,
  checkWordCardImagePrompts,
  headwordIsBanned,
} from './content-gates';

const LONG =
  'The dealer held the coin under his lamp for a long time before he agreed that it was real and not made last year.';

describe('reading age is checked BY ROLE (David’s spec correction, 2026-08-02)', () => {
  it('a Word-card sentence has NO length cap — disambiguating is its job', () => {
    expect(ROLE_RULES['word-card'].maxSentenceWords).toBeNull();
    const failures = checkReadingAge('word-card', 'card', LONG, 'genuine');
    expect(failures.filter((f) => f.rule === 'sentence-length')).toEqual([]);
  });

  it('an item stem, option or instruction IS capped at 16 words', () => {
    for (const role of ['item-stem', 'item-option', 'instructions', 'hint', 'narrative'] as const) {
      expect(ROLE_RULES[role].maxSentenceWords).toBe(DEFAULT_MAX_SENTENCE_WORDS);
      const failures = checkReadingAge(role, 'x', LONG);
      expect(
        failures.some((f) => f.rule === 'sentence-length'),
        `${role} must stay capped`,
      ).toBe(true);
    }
  });

  it('a Word card still carries the VOCABULARY ceiling — that is what RA ≤9 means', () => {
    const failures = checkReadingAge(
      'word-card',
      'card',
      'Something completely unnecessary and unbelievably complicated.',
      'thing',
    );
    expect(failures.some((f) => f.rule === 'long-words')).toBe(true);
  });

  it('the word being taught is exempt from its own definition', () => {
    const withHeadword = checkReadingAge('word-card', 'c', 'Extraordinary means very unusual.', 'extraordinary');
    expect(withHeadword.filter((f) => f.rule === 'long-words')).toEqual([]);
  });

  it('an unclassified role falls back to the STRICTEST rules, never the loosest', () => {
    const failures = checkReadingAge('not-a-role' as never, 'x', LONG);
    expect(failures.some((f) => f.rule === 'sentence-length')).toBe(true);
  });
});

describe('banned vocabulary comes from the ONE shared list', () => {
  it('child-facing scope includes the everywhere rules', () => {
    expect(checkBannedVocabulary('x', 'We guarantee a pass.').length).toBeGreaterThan(0);
    expect(checkBannedVocabulary('x', 'That answer is wrong.').length).toBeGreaterThan(0);
  });

  it('everywhere scope excludes the child-only rules', () => {
    expect(checkBannedVocabulary('x', 'That answer is wrong.', 'everywhere')).toEqual([]);
    expect(checkBannedVocabulary('x', 'We guarantee a pass.', 'everywhere').length).toBeGreaterThan(0);
  });

  it('clean product voice passes', () => {
    expect(checkChildFacingText({ role: 'hint', label: 'h', text: 'Have another go. Check each part.' })).toEqual([]);
  });
});

describe('checkWordCard — what the publish door and the DB sweep both ask', () => {
  const clean = {
    id: 'brave',
    headword: 'brave',
    definitionChild: 'Ready to face something scary.',
    sentence: LONG,
    senseBDefinition: null,
    senseBSentence: null,
  };

  it('passes a card whose only sin is a long sentence (ruling 1)', () => {
    expect(checkWordCard(clean)).toEqual([]);
  });

  it('catches banned vocabulary in either sense', () => {
    expect(
      checkWordCard({ ...clean, definitionChild: 'To punish someone for doing wrong.' }).some(
        (f) => f.rule === 'banned-vocabulary',
      ),
    ).toBe(true);
    expect(
      checkWordCard({
        ...clean,
        senseBDefinition: 'Left behind by everyone.',
        senseBSentence: 'A sentence.',
      }).some((f) => f.rule === 'banned-vocabulary'),
    ).toBe(true);
  });

  it('names the field so a reviewer can act without opening the row', () => {
    const failures = checkWordCard({ ...clean, definitionChild: 'A wrong answer.' });
    expect(failures[0]!.where).toContain('word:brave definition');
  });
});

describe('the headwordInOwnCard exemption (David’s ruling, 2026-08-02)', () => {
  const guaranteeCard = {
    id: 'guarantee',
    headword: 'guarantee',
    definitionChild: 'to promise that something will definitely happen or be put right.',
    sentence:
      'The shop guarantees the bike for two years, so if the frame cracks they will replace it without charging.',
  };

  it('the card teaching a ban-list word may use it — that was the whole point', () => {
    expect(checkWordCard(guaranteeCard)).toEqual([]);
  });

  it('covers inflections, since the motivating case IS one', () => {
    expect(headwordIsBanned('guarantee')).toBe(true);
    for (const form of ['guarantee', 'guarantees', 'guaranteed']) {
      expect(
        checkWordCard({ ...guaranteeCard, sentence: `The shop ${form} the bike.` }),
        `"${form}" should be exempt on its own card`,
      ).toEqual([]);
    }
  });

  // The three bounds, each tested, because an exemption in a ban list is
  // exactly where drift would enter.
  it('BOUND 1 — only the headword: other banned words in the same card still fail', () => {
    const failures = checkWordCard({
      ...guaranteeCard,
      definitionChild: 'A clever promise that nothing will go wrong.',
    });
    const names = failures.map((f) => f.detail).join(' ');
    expect(names).toContain('clever');
    expect(names).toContain('wrong');
    // …and the headword itself is still exempt in the same breath.
    expect(names).not.toContain('guarantee');
  });

  it('BOUND 2 — only inside its own card: another card may not use the word', () => {
    const otherCard = {
      id: 'promise',
      headword: 'promise',
      definitionChild: 'To say you will definitely do something.',
      sentence: 'The shop guarantees the bike for two years.',
    };
    expect(checkWordCard(otherCard).some((f) => f.detail.includes('guarantee'))).toBe(true);
  });

  it('BOUND 3 — only where the headword IS the banned term', () => {
    const braveCard = {
      id: 'brave',
      headword: 'brave',
      definitionChild: 'Ready to face something scary.',
      sentence: 'He was brave even when the answer was wrong.',
    };
    expect(headwordIsBanned('brave')).toBe(false);
    expect(braveCard && checkWordCard(braveCard).some((f) => f.detail.includes('wrong'))).toBe(true);
  });

  it('does not stretch past an inflection — a longer form is not the headword', () => {
    // The ban patterns are word-bounded, so the bound is about which MATCHED
    // form counts as the headword. On a card teaching "fail": "failure" is 3
    // characters past it and is covered; "failures" is 4 and is not.
    expect(checkBannedVocabulary('x', 'a failure', 'child-facing', 'fail')).toEqual([]);
    expect(checkBannedVocabulary('x', 'many failures', 'child-facing', 'fail').length).toBe(1);
  });

  it('applies to image prompts too, which is where the ruling also points', () => {
    expect(
      checkWordCardImagePrompts({
        id: 'guarantee',
        headword: 'guarantee',
        imagePrompt: 'A shop sign reading guaranteed repairs.',
      }),
    ).toEqual([]);
    expect(
      checkWordCardImagePrompts({
        id: 'brave',
        headword: 'brave',
        imagePrompt: 'A guaranteed win.',
      }).length,
    ).toBe(1);
  });

  it('the exemption is off by default — you have to pass the headword', () => {
    expect(checkBannedVocabulary('x', 'The shop guarantees it.').length).toBe(1);
  });
});

describe('"behind" catches lagging, not position (David’s narrowing, 2026-08-02)', () => {
  const hit = (text: string) =>
    checkBannedVocabulary('x', text).some((f) => f.detail.includes('behind'));

  it('catches the progress senses — a child told they are lagging', () => {
    for (const text of [
      'You are falling behind.',
      'She fell behind the others.',
      'behind the class',
      'We are behind schedule.',
      'That is behind where you should be.',
      'You’re behind in maths.',
      'He is a bit behind.',
      'so far behind',
      'left behind by the class',
    ]) {
      expect(hit(text), `should catch: ${text}`).toBe(true);
    }
  });

  it('allows spatial position — every real occurrence in the vault was spatial', () => {
    for (const text of [
      'A puppy behind a stair gate in a kitchen doorway.',
      'Two children whispering behind a sofa.',
      'the woman behind it printed his ticket',
      'a queue of cars behind it',
      'Seagulls flying low behind a ferry.',
      'the bins behind the chip shop',
      'the meadow behind the caravan park',
      'a cupboard boarded up behind it',
      'People walking down a high street behind a brass band.',
      'A dining hall with half-eaten trays left behind.',
      'so easy to see the truth behind that nobody is fooled',
      'the door might lock behind him',
      'behind the door',
    ]) {
      expect(hit(text), `should allow: ${text}`).toBe(false);
    }
  });
});

describe('image prompts are a scanned surface (David’s ruling, 2026-08-02)', () => {
  const card = {
    id: 'brave',
    headword: 'brave',
    definitionChild: 'Ready to face something scary.',
    sentence: 'She was brave.',
  };

  it('a banned word in an image prompt now fails the card', () => {
    expect(
      checkWordCard({ ...card, imagePrompt: 'A child looking clever about it.' }).some((f) =>
        f.where.includes('image prompt'),
      ),
    ).toBe(true);
  });

  it('an innocent spatial prompt passes', () => {
    expect(checkWordCard({ ...card, imagePrompt: 'A puppy behind a stair gate.' })).toEqual([]);
  });

  it('the headword exemption reaches image prompts too', () => {
    expect(
      checkWordCard({
        id: 'guarantee',
        headword: 'guarantee',
        definitionChild: 'A promise to put something right.',
        sentence: 'The shop guarantees the bike.',
        imagePrompt: 'A shop sign reading guaranteed repairs.',
      }),
    ).toEqual([]);
  });

  it('reading-age caps do NOT apply — nobody reads a prompt', () => {
    const wordy = 'A very long illustrator brief that runs well past sixteen words in a single unbroken sentence about a bicycle.';
    expect(checkWordCard({ ...card, imagePrompt: wordy })).toEqual([]);
  });
});

describe('internal ids never reach a child (David’s ruling, 2026-08-02)', () => {
  const leak = (text: string) =>
    checkNoInternalIds('x', text).some((f) => f.rule === 'internal-id-leak');

  it('catches a misconception slug in a child-facing string', () => {
    expect(leak('Not yet — en-plausible-not-stated')).toBe(true);
    expect(leak('Have another go: nvr-code-row-swap')).toBe(true);
    expect(leak('see vr-08-move-letter')).toBe(true);
  });

  it('catches provenance, batch ids and internal statuses', () => {
    expect(leak('written by ai-draft:cowork-okafor-v1')).toBe(true);
    expect(leak('from batch ENG-002')).toBe(true);
    expect(leak('This item is PROPOSED')).toBe(true);
  });

  it('leaves ordinary hyphenated English alone — the rule must survive contact', () => {
    for (const text of [
      'A well-behaved puppy behind a stair gate.',
      'He had been spring-cleaning his little home all morning.',
      'Read the passage. Then answer the question.',
      'That one is a near-miss, so look again at the second half.',
      'Have another go — check each part.',
    ]) {
      expect(leak(text), `should allow: ${text}`).toBe(false);
    }
  });

  it('is part of the standard child-facing check, not an opt-in', () => {
    expect(
      checkChildFacingText({ role: 'hint', label: 'h', text: 'Try again: en-attribute-transfer' }).some(
        (f) => f.rule === 'internal-id-leak',
      ),
    ).toBe(true);
  });
});

describe('the proofread stem role (David’s spec correction, 2026-08-02)', () => {
  const PROOFREAD =
    'The twins left there lunch boxes beside the quiet library door before the bell rang for lunch.';

  it('an error-spotting or cloze stem has NO word cap — the sentence IS the format', () => {
    expect(ROLE_RULES['item-stem-proofread'].maxSentenceWords).toBeNull();
    expect(checkReadingAge('item-stem-proofread', 'x', PROOFREAD).filter((f) => f.rule === 'sentence-length')).toEqual([]);
  });

  it('an ordinary comprehension stem is still capped', () => {
    expect(checkReadingAge('item-stem', 'x', PROOFREAD).some((f) => f.rule === 'sentence-length')).toBe(true);
  });

  it('the role follows the MECHANIC, so a new spotting type is covered on day one', () => {
    expect(roleForItemStem('error-spot')).toBe('item-stem-proofread');
    expect(roleForItemStem('cloze')).toBe('item-stem-proofread');
    expect(roleForItemStem('select-one')).toBe('item-stem');
    expect(roleForItemStem(undefined)).toBe('item-stem');
  });
});

describe('inline quotation inside a stem (David’s ruling, 2026-08-02)', () => {
  const span = 'you are behind the class in this manner';
  const stem = `The writer says: '${span}.' What does he mean?`;

  it('a banned word inside a declared quote is stepped over', () => {
    expect(checkBannedVocabulary('x', stem, 'child-facing', undefined, [span])).toEqual([]);
  });

  it('the same text with no declaration is caught', () => {
    expect(checkBannedVocabulary('x', stem).length).toBeGreaterThan(0);
  });

  it('OUR wording around the quote stays fully in scope', () => {
    const ours = `The writer says: '${span}.' Is the boy behind the class?`;
    expect(checkBannedVocabulary('x', ours, 'child-facing', undefined, [span]).length).toBeGreaterThan(0);
  });

  it('a declared span that is not in the text is REPORTED, not trusted', () => {
    const failures = checkBannedVocabulary('x', 'Nothing quoted here.', 'child-facing', undefined, [
      'a line never written',
    ]);
    expect(failures.some((f) => f.detail.includes('not in the text'))).toBe(true);
  });

  // SUPERSEDED 2026-08-02: this originally asserted that reading age counted
  // quoted text. David ruled the other way — a child must read the passage's
  // words to answer, and a quotation should not be butchered to fit a cap
  // written for our prose. The SENTENCE CAP now steps over a declared quote;
  // the VOCABULARY ceiling still counts it. Both halves asserted here.
  it('both reading-age checks step over a declared quote', () => {
    const long = `The writer says: '${span} and then some more words follow here.' What does he mean by it?`;
    expect(
      checkChildFacingText({ role: 'item-stem', label: 'x', text: long, quotedSpans: [span] }).some(
        (f) => f.rule === 'sentence-length',
      ),
    ).toBe(false);
    const hard = 'his countenance was extraordinarily disagreeable and unnecessarily complicated';
    expect(
      checkChildFacingText({
        role: 'item-stem',
        label: 'x',
        text: `He writes: ${hard}. Why?`,
        quotedSpans: [hard],
      }).some((f) => f.rule === 'long-words'),
    ).toBe(false);
  });
});

describe('the tested-token exemption (David’s ruling, 2026-08-02)', () => {
  const SPELLING = 'The librarian showed us the new dictionery, explained the temporary shelves and left.';

  it('the words an item tests do not count against its vocabulary ceiling', () => {
    expect(
      checkReadingAge('item-stem-proofread', 'x', SPELLING, '', ['dictionery', 'dictionary', 'temporary']),
    ).toEqual([]);
  });

  it('without the declaration they still count', () => {
    expect(
      checkReadingAge('item-stem-proofread', 'x', SPELLING).some((f) => f.rule === 'long-words'),
    ).toBe(true);
  });

  it('BOUND — only the declared tokens; other long words still count', () => {
    const failures = checkReadingAge(
      'item-stem-proofread',
      'x',
      'The dictionery sat beside the extraordinary unnecessary catalogue.',
      '',
      ['dictionery'],
    );
    expect(failures.some((f) => f.rule === 'long-words')).toBe(true);
    expect(failures[0]!.detail).not.toContain('dictionery');
  });

  it('BOUND — it reaches the vocabulary ceiling ONLY, never the ban list', () => {
    expect(
      checkChildFacingText({
        role: 'item-stem',
        label: 'x',
        text: 'A wrong dictionery answer.',
        testedTokens: ['dictionery', 'wrong'],
      }).some((f) => f.rule === 'banned-vocabulary'),
    ).toBe(true);
  });

  it('BOUND — nor sentence length', () => {
    const long = `${'word '.repeat(20)}dictionery.`;
    expect(
      checkChildFacingText({ role: 'item-stem', label: 'x', text: long, testedTokens: ['dictionery'] }).some(
        (f) => f.rule === 'sentence-length',
      ),
    ).toBe(true);
  });

  it('matches the exact token, not a family of lookalikes', () => {
    expect(isTestedToken('dictionery,', ['dictionery'])).toBe(true);
    expect(isTestedToken('Dictionery', ['dictionery'])).toBe(true);
    expect(isTestedToken('dictioneries', ['dictionery'])).toBe(false);
    expect(isTestedToken('extraordinary', ['dictionery'])).toBe(false);
  });
});

describe('a quotation is outside the sentence cap (David’s gate rule, 2026-08-02)', () => {
  const quote =
    'the boy stood alone by the window watching the rain fall steadily on the empty yard below';
  const stem = `The writer says ${quote} here. Why?`;
  const capped = (text: string, spans: string[] = []) =>
    checkReadingAge('item-stem', 'x', text, '', [], spans).filter((f) => f.rule === 'sentence-length').length;

  it('a sentence long only because it carries a quotation passes once declared', () => {
    expect(capped(stem)).toBe(1);
    expect(capped(stem, [quote])).toBe(0);
  });

  it('OUR OWN wording around a declared quote is still counted and still capped', () => {
    const ours = `The writer here is doing something quite deliberate and rather clever and unusual in this particular passage. ${quote} Why?`;
    expect(capped(ours, [quote])).toBe(1);
  });

  it('the quotation’s own full stop does not flatter the count', () => {
    // Stripping rather than blanking: a quote ending in "." would otherwise
    // split our sentence in two and each half would look short.
    //
    // Trailing clause lengthened 2026-08-02. Stripping the quote leaves the
    // orphaned `''` behind, and that token used to count as a word — so this
    // test was passing on 16 words of ours plus one piece of punctuation.
    // Once notation stopped counting, the padding went and the case had to be
    // made out of real words, which is what it was always meant to assert.
    const withStop = `He says: '${quote}.' What is he trying to do in this rather long and quite deliberately trailing clause here?`;
    expect(capped(withStop, [`${quote}.`])).toBe(1);
  });

  // SUPERSEDED 2026-08-02 (second extension): the ceiling now steps over a
  // declared quote too — comprehension passages are pre-1950 literature by
  // design, so quoted archaic vocabulary is the content under test.
  it('the vocabulary ceiling also steps over a declared quote', () => {
    const hard = 'his countenance was extraordinarily disagreeable and unnecessarily complicated';
    expect(
      checkReadingAge('item-stem', 'x', `He writes: ${hard}. Why?`, '', [], [hard]).some(
        (f) => f.rule === 'long-words',
      ),
    ).toBe(false);
  });

  it('BOUND — our OWN long words beside a declared quote are still counted', () => {
    const quoted = 'his countenance was disagreeable';
    const ours = `This extraordinary unnecessarily complicated question asks: '${quoted}'. Why?`;
    expect(
      checkReadingAge('item-stem', 'x', ours, '', [], [quoted]).some((f) => f.rule === 'long-words'),
    ).toBe(true);
  });

  it('BOUND — an undeclared archaic quote is still counted', () => {
    const hard = 'his countenance was extraordinarily disagreeable and unnecessarily complicated';
    expect(
      checkReadingAge('item-stem', 'x', `He writes: ${hard}. Why?`).some((f) => f.rule === 'long-words'),
    ).toBe(true);
  });
});

describe('notation is not a word (David, 2026-08-02)', () => {
  const longest = (text: string) =>
    checkChildFacingText({ role: 'item-stem', label: 't', text }).filter((f) => f.rule === 'sentence-length');

  it('does not count = and + as words', () => {
    // 14 English words; 20 whitespace tokens. The old tokeniser failed this
    // on punctuation alone and no rewrite could have saved it.
    expect(longest('If A = 3, B = 4, C = 5, D = 6, what is A + B + C?')).toEqual([]);
  });

  it('still counts a genuinely long sentence', () => {
    expect(
      longest('Move one letter from the first word to the second word so that both make new words.'),
    ).toHaveLength(1);
  });

  it('leaves hyphenated words alone — they are one token, not notation', () => {
    expect(longest('The well-behaved spring-cleaning mole went out.')).toEqual([]);
  });
});

describe('R23 — declared passage proper nouns', () => {
  it('R23: a declared passage name is exempt from the CEILING ONLY', () => {
    const text = 'Elizabeth understood immediately.';
    // Undeclared, the name counts against the ceiling like any other four-syllable word.
    expect(checkReadingAge('item-stem', 'T', text, '', [], [], []).some((f) => f.rule === 'long-words')).toBe(true);
    // Declared, it does not — the passage has already taught it.
    expect(checkReadingAge('item-stem', 'T', text, '', [], [], ['Elizabeth']).some((f) => f.rule === 'long-words')).toBe(false);
    // But the exemption reaches the ceiling and nothing else: the ban list still bites.
    expect(
      checkChildFacingText({ role: 'item-stem', label: 'T', text: 'Elizabeth got the wrong answer.', passageNames: ['Elizabeth'] })
        .some((f) => f.rule === 'banned-vocabulary'),
    ).toBe(true);
  });
});
