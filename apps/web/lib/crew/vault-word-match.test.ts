import { describe, expect, it } from 'vitest';
import { firstVaultWordMatch } from './vault-word-match';

const W = (headword: string) => ({ id: headword, headword, definitionChild: 'd' });

describe('vault words in passage lines (R638)', () => {
  it('matches a whole word and keeps the passage bytes, not the headword casing', () => {
    const hit = firstVaultWordMatch('till his manners gave a disgust', [W('Manners')]);
    expect(hit?.matched).toBe('manners');
    expect(hit?.index).toBe(9);
  });
  it('never fires inside another word — tolerable is not intolerable', () => {
    expect(firstVaultWordMatch('quite intolerable company', [W('tolerable')])).toBeNull();
  });
  it('a phrase headword matches whole, which is what an idiom card needs', () => {
    const hit = firstVaultWordMatch('his manners gave a disgust which turned the tide', [W('gave a disgust')]);
    expect(hit?.matched).toBe('gave a disgust');
  });
  it('first matching word wins; a line with none returns null', () => {
    expect(firstVaultWordMatch('no vault words here', [W('tolerable'), W('spirit')])).toBeNull();
    const hit = firstVaultWordMatch('her spirit was tolerable', [W('tolerable'), W('spirit')]);
    expect(hit?.word.headword).toBe('tolerable');
  });
});
