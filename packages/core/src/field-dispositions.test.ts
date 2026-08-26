import { describe, expect, it } from 'vitest';
import { capitalRunIsExempt, dispositionFor, isRetentionPath, isSymbolString, notationExempt } from './field-dispositions';

describe('R719 — the notation exemption has a boundary', () => {
  it('a symbol on a notation path is exempt', () => {
    expect(notationExempt('stem', 'frame', 'SH___')).toBe(true);
    expect(notationExempt('stem', 'target', 'SHOUT')).toBe(true);
    expect(notationExempt('options[]', 'content.value', 'OUT')).toBe(true);
    expect(notationExempt('stem', 'code.P', 'ABC')).toBe(true);
  });
  it('A CAPITAL INSIDE A SENTENCE CANNOT CLAIM IT — on any path', () => {
    expect(notationExempt('stem', 'prompt', 'Which word joins with AIR to make one new word?')).toBe(false);
    // even on a notation-bearing path: the same field name carries symbols and sentences
    expect(notationExempt('options[]', 'content.value', 'He SHOUTED at the dog.')).toBe(false);
    expect(isSymbolString('He SHOUTED at the dog.')).toBe(false);
  });
  it('a prose path never claims it, however symbol-like the string', () => {
    expect(notationExempt('explanation', 'walkScript', 'SHOUT')).toBe(false);
  });
  it('retention is decided by the underscore, not a list', () => {
    expect(isRetentionPath('stem._previousText')).toBe(true);
    expect(isRetentionPath('explanation._repairAuthority.landedHereOn')).toBe(true);
    expect(dispositionFor('stem', '_previousText')).toBe('retention');
    expect(isRetentionPath('stem.text')).toBe(false);
  });
});

describe('R722/R723 — gap markers are exempt wherever they sit; stimulus words are not', () => {
  const run = (text: string, needle: string): [number, number] => {
    const i = text.indexOf(needle);
    return [i, i + needle.length];
  };
  it('a gap marker inside a cloze sentence IS exempt — the sentence is where the gap must appear', () => {
    const s = 'Ade was the ___(2)___ runner in Year 5.';
    expect(capitalRunIsExempt('stem', 'sentence', s, ...run(s, '___(2)___'))).toBe(true);
  });
  it('a vr-06 frame marker is exempt in a sentence too', () => {
    const s = 'Please do not SH___ so loudly here.';
    expect(capitalRunIsExempt('stem', 'sentence', s, ...run(s, 'SH___'))).toBe(true);
  });
  it('A STIMULUS WORD IN A PROMPT IS NOT EXEMPT — it amends to quoted form (R723)', () => {
    const s = 'Which word joins with AIR to make one new word?';
    expect(capitalRunIsExempt('stem', 'prompt', s, ...run(s, 'AIR'))).toBe(false);
  });
  it('THE PROBE: a bare shout in a stem can claim neither exemption', () => {
    const s = 'You must READ the whole sentence before you choose.';
    expect(capitalRunIsExempt('stem', 'text', s, ...run(s, 'READ'))).toBe(false);
    expect(capitalRunIsExempt('stem', 'sentence', s, ...run(s, 'READ'))).toBe(false);
    // and not even on a notation-bearing path, because the string is a sentence
    expect(capitalRunIsExempt('options[]', 'content.value', s, ...run(s, 'READ'))).toBe(false);
  });
});
