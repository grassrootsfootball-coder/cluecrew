import { describe, expect, it } from 'vitest';
import { itemHintRulingPatch } from './item-hint-ruling';
import { chooseHint } from './item-hint';

describe('what an item-hint ruling writes (R617)', () => {
  const AUTH = ['Annie', 'annie-seventieth-return.md, sha256 abc'] as const;

  it('a ruling with before === authored STILL sets both authorship fields', () => {
    const r = itemHintRulingPatch({ hintCore: 'The hint.' }, 'The hint.', ...AUTH);
    expect(r.verdict).toBe('APPROVED_AS_WRITTEN');
    expect(r.patch.hintAuthoredBy).toBe('Annie');
    expect(r.patch.hintAuthority).toContain('seventieth');
  });

  it('an approval does NOT touch the text — no hintCore, no supersession', () => {
    const r = itemHintRulingPatch({ hintCore: 'The hint.' }, 'The hint.', ...AUTH);
    expect('hintCore' in r.patch).toBe(false);
    expect('_previousHintCore' in r.patch).toBe(false);
    expect(r.gateRequired).toBe(false);
  });

  it('a ruling is NEVER a no-op: the patch always carries authorship', () => {
    for (const explanation of [null, {}, { hintCore: 'x' }, { hintCore: 'same' }]) {
      const r = itemHintRulingPatch(explanation, 'same', ...AUTH);
      expect(Object.keys(r.patch).length).toBeGreaterThan(0);
      expect(r.patch.hintAuthoredBy).toBe('Annie');
    }
  });

  it('a text change supersedes rather than appends, and requires the gate', () => {
    const r = itemHintRulingPatch({ hintCore: 'Old.' }, 'New.', ...AUTH);
    expect(r.verdict).toBe('REPLACED');
    expect(r.patch.hintCore).toBe('New.');
    expect(r.patch._previousHintCore).toBe('Old.');
    expect(r.gateRequired).toBe(true);
  });

  it('the whole point: an approval makes the hint SERVE', () => {
    const before = { hintCore: 'The hint.' };
    expect(chooseHint(before as never).serves).toBe('library');
    const r = itemHintRulingPatch(before, 'The hint.', ...AUTH);
    expect(chooseHint({ ...before, ...r.patch } as never).serves).toBe('item');
  });
});
