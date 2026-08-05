import { describe, expect, it } from 'vitest';
import { checkUkSpelling, isBlocking } from './content-gates';

const found = (text: string): string[] =>
  checkUkSpelling('t', text).map((failure) => failure.detail);
const flagged = (text: string): boolean => checkUkSpelling('t', text).length > 0;

describe('UK spelling — the forms it must catch', () => {
  it('catches -ize and -isation', () => {
    expect(flagged('Organize your answer.')).toBe(true);
    expect(flagged('She recognized the pattern.')).toBe(true);
    expect(flagged('the organization of the text')).toBe(true);
  });

  it('catches -or for -our, including derived forms', () => {
    for (const word of ['color', 'colored', 'colorful', 'honor', 'favorite', 'neighbor', 'behavioral', 'armory']) {
      expect(flagged(`The ${word} is here.`), word).toBe(true);
    }
  });

  it('catches single-l past tenses and agents', () => {
    for (const word of ['traveled', 'traveling', 'canceled', 'labeled', 'modeling', 'jeweler']) {
      expect(flagged(`He ${word} on.`), word).toBe(true);
    }
  });

  it('catches -er for -re and -se for -ce', () => {
    for (const word of ['center', 'theater', 'liter', 'fiber', 'defense', 'offense']) {
      expect(flagged(`The ${word} is here.`), word).toBe(true);
    }
  });

  it('catches "math", which matters more than most for an 11+ product', () => {
    expect(flagged('Try the math questions.')).toBe(true);
    expect(flagged('Try the maths questions.')).toBe(false);
  });
});

describe('UK spelling — the words it must NOT catch', () => {
  it('leaves British -ous and -ary derivatives alone', () => {
    // humour → humorous, vigour → vigorous, honour → honorary. All correct
    // British English WITHOUT the u. A rule that flagged these would be
    // switched off within a week, which is the real cost of a false positive.
    for (const word of ['humorous', 'vigorous', 'glamorous', 'laborious', 'honorary', 'honorific', 'odorous']) {
      expect(flagged(`It was ${word}.`), word).toBe(false);
    }
  });

  it('leaves defensive and offensive alone — both are correct British', () => {
    expect(flagged('a defensive move')).toBe(false);
    expect(flagged('an offensive smell')).toBe(false);
  });

  it('leaves the genuine British -ize words alone', () => {
    for (const word of ['size', 'sized', 'resize', 'capsized', 'prize', 'maize', 'seize', 'seized']) {
      expect(flagged(`We ${word} it.`), word).toBe(false);
    }
  });

  it('leaves literal, literature and similar near-misses alone', () => {
    for (const word of ['literal', 'literature', 'literacy', 'bluster', 'litter', 'spectator', 'citizen', 'horizon']) {
      expect(flagged(`The ${word} is here.`), word).toBe(false);
    }
  });

  it('leaves the correct British spellings alone', () => {
    expect(
      flagged('The colour of the centre is grey and she travelled to the theatre to organise it.'),
    ).toBe(false);
  });
});

describe('UK spelling — severity', () => {
  it('treats the noun/verb pairs as warnings, not errors', () => {
    const practice = checkUkSpelling('t', 'Time to practice.');
    expect(practice).toHaveLength(1);
    expect(practice[0]!.severity).toBe('warning');
    expect(isBlocking(practice[0]!)).toBe(false);
  });

  it('treats a form that does not exist in British English as an error', () => {
    const colour = checkUkSpelling('t', 'Pick a color.');
    expect(colour[0]!.severity).toBe('error');
    expect(isBlocking(colour[0]!)).toBe(true);
  });

  it('warns on sense-dependent words rather than blocking them', () => {
    for (const text of ['a gas meter', 'the tire was flat', 'she was tired', 'curb your dog', 'a first draft']) {
      const failures = checkUkSpelling('t', text);
      expect(failures.every((failure) => !isBlocking(failure)), text).toBe(true);
    }
  });
});

describe('UK spelling — the two exemptions', () => {
  it('steps over a declared quotation: we do not re-spell someone else Text', () => {
    const quote = 'the color of the sky';
    expect(checkUkSpelling('t', `He wrote "${quote}" here.`, [quote])).toHaveLength(0);
    // …but our own wording around it is still fully in scope.
    expect(checkUkSpelling('t', `What color is it? "${quote}"`, [quote])).toHaveLength(1);
  });

  it('steps over a tested token: a spelling item may PLANT the US form', () => {
    expect(checkUkSpelling('t', 'Which word is misspelt: traveled?', [], ['traveled'])).toHaveLength(0);
  });

  it('reports each distinct word once, not once per occurrence', () => {
    expect(found('color, color, color')).toHaveLength(1);
  });
});
