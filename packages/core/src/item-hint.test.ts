import { describe, expect, it } from 'vitest';
import { chooseHint, hintToServe } from './item-hint';

const READ = {
  hintCore: 'Does your voice go up at the end? Then it needs a question mark.',
  hintAuthoredBy: 'Annie',
  hintAuthority: 'annieeng003secondreturn.md §8, read from the file, sha256 90bd5b1ee56790d4',
};
const LIB = 'If the SPOKEN words are the question, the mark lives inside the speech marks.';

describe('an item hint serves only if a named reviewer has read it', () => {
  it('serves the item hint when both a name and an authority are recorded', () => {
    expect(chooseHint(READ)).toMatchObject({ serves: 'item', readBy: 'Annie' });
    expect(hintToServe(READ, LIB)).toBe(READ.hintCore);
  });

  it('falls back to the library when the hint is UNREAD — the 366 reach nobody', () => {
    const unread = { hintCore: READ.hintCore };
    expect(chooseHint(unread)).toEqual({ serves: 'library', why: 'item hint not read by a named reviewer' });
    expect(hintToServe(unread, LIB)).toBe(LIB);
  });

  it('a name with no authority does not serve — a bare name is an assertion', () => {
    expect(hintToServe({ ...READ, hintAuthority: '' }, LIB)).toBe(LIB);
  });

  it('an authority with no name does not serve — a bare citation is unattributed', () => {
    expect(hintToServe({ ...READ, hintAuthoredBy: '' }, LIB)).toBe(LIB);
  });

  it('no item hint at all leaves the library serving exactly as today', () => {
    expect(chooseHint({})).toEqual({ serves: 'library', why: 'no item hint' });
    expect(hintToServe({}, LIB)).toBe(LIB);
    expect(hintToServe(null, LIB)).toBe(LIB);
  });

  it('SUPERSEDES rather than appends — a child sees one hint, not two', () => {
    const served = hintToServe(READ, LIB);
    expect(served).toBe(READ.hintCore);
    expect(served).not.toContain(LIB);
  });

  it('a read item hint with NO library hint behind the option still serves', () => {
    expect(hintToServe(READ, null)).toBe(READ.hintCore);
  });

  it('an unread item hint with no library hint serves nothing, rather than serving the unread text', () => {
    expect(hintToServe({ hintCore: 'unread' }, null)).toBeUndefined();
  });
});
