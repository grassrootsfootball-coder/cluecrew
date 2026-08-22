import { describe, expect, it } from 'vitest';
import { chooseHint, hintToServe, resolveLibraryHint } from './item-hint';

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

  /**
   * PU-08 (R601). Her ruling is `hintServes: 'library'` — the item hint is good and the general one
   * is better here. Nothing read that field, and the row served the library hint only because its
   * authorship fields were absent: **the decision and the outcome agreed by accident.**
   */
  describe('an explicit ruling to withhold outranks the authorship fields (PU-08, R601)', () => {
    const RULED = {
      hintCore: 'The item hint she ruled against serving.',
      hintServes: 'library',
      hintAuthoredBy: 'Annie',
      hintAuthority: 'annie-return.md, sha256 deadbeef',
    };

    it('withholds the item hint even when it is fully attested', () => {
      const choice = chooseHint(RULED);
      expect(choice.serves).toBe('library');
      expect(hintToServe(RULED, LIB)).toBe(LIB);
    });

    it('says WHY, so a ruling is never mistaken for an unread field', () => {
      const choice = chooseHint(RULED);
      expect(choice.serves === 'library' && choice.why).toBe('ruled to serve the library hint on this item');
    });

    /**
     * The hazard this closes. Applying an amendment to an item hint SETS both authorship fields —
     * it is how four hints moved into service this week. Without this, improving the wording of a
     * hint she ruled against serving would silently overturn the ruling.
     */
    it('survives the act of amending the wording, which is what would have broken it', () => {
      const amended = { ...RULED, hintCore: 'A better wording, applied by an amendment.' };
      expect(chooseHint(amended).serves).toBe('library');
    });
  });
});

describe('the status filter: a non-ACTIVE entry serves nothing, distinguishably (R618, approved)', () => {
  const ENTRY = { status: 'ACTIVE', childHint: 'The library hint.' };

  it('an ACTIVE entry serves its hint', () => {
    expect(resolveLibraryHint(ENTRY)).toEqual({ text: 'The library hint.', why: 'ACTIVE entry' });
  });

  it('a RETIRED or REJECTED entry serves undefined — the untagged fallthrough, by design', () => {
    for (const status of ['RETIRED', 'REJECTED']) {
      const r = resolveLibraryHint({ ...ENTRY, status });
      expect(r.text).toBeUndefined();
      expect(r.why).toBe('tag resolves to a RETIRED/REJECTED entry');
    }
  });

  it('the two nothings are distinguishable — status is never mistaken for untagged', () => {
    const byStatus = resolveLibraryHint({ ...ENTRY, status: 'RETIRED' });
    const untagged = resolveLibraryHint(null);
    expect(byStatus.text).toBe(untagged.text);
    expect(byStatus.why).not.toBe(untagged.why);
  });

  it('end to end: a child on a retired tag gets nothing, not the rejected wording', () => {
    expect(hintToServe({ hintCore: 'unread' }, resolveLibraryHint({ ...ENTRY, status: 'REJECTED' }).text)).toBeUndefined();
  });
});
