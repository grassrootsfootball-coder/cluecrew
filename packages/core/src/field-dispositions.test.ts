import { describe, expect, it } from 'vitest';
import { dispositionFor, isRetentionPath, isSymbolString, notationExempt } from './field-dispositions';

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
