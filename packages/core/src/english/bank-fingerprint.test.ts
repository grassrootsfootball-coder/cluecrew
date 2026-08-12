import { describe, expect, it } from 'vitest';
import { bankEntryHash, bankFingerprint, compareBank, bankEntryHashes } from './bank-fingerprint';
import { FAMILY_BANKS, orphanedRegistryEntries, unregisteredFamilies } from './bank-registry';

const entry = (id: string, text: string) => ({ id, text });

describe('bankEntryHash', () => {
  it('moves when the entry content moves', () => {
    expect(bankEntryHash(entry('a', 'one'))).not.toBe(bankEntryHash(entry('a', 'two')));
  });

  it('ignores key order — Postgres JSONB does not preserve it', () => {
    expect(bankEntryHash({ id: 'a', x: 1, y: 2 } as never)).toBe(
      bankEntryHash({ y: 2, x: 1, id: 'a' } as never),
    );
  });
});

describe('bankFingerprint', () => {
  it('is order-independent — a reordered bank is not a changed bank', () => {
    const a = [entry('1', 'one'), entry('2', 'two')];
    expect(bankFingerprint(a)).toBe(bankFingerprint([...a].reverse()));
  });

  it('moves when any entry moves', () => {
    expect(bankFingerprint([entry('1', 'one')])).not.toBe(bankFingerprint([entry('1', 'ONE')]));
  });
});

describe('compareBank — the three classes must stay distinguishable', () => {
  const signed = bankEntryHashes([entry('a', 'alpha'), entry('b', 'beta')]);

  it('reports UNCHANGED and does not void', () => {
    const c = compareBank('f', 'B', [entry('a', 'alpha'), entry('b', 'beta')], signed);
    expect(c.unchanged).toEqual(['a', 'b']);
    expect(c.voided).toBe(false);
  });

  it('an EDIT to a signed entry VOIDS — the reviewer signed that sentence', () => {
    const c = compareBank('f', 'B', [entry('a', 'ALPHA'), entry('b', 'beta')], signed);
    expect(c.edited).toEqual(['a']);
    expect(c.voided).toBe(true);
  });

  it('a REMOVAL of a signed entry VOIDS', () => {
    const c = compareBank('f', 'B', [entry('a', 'alpha')], signed);
    expect(c.removed).toEqual(['b']);
    expect(c.voided).toBe(true);
  });

  it('an ADDITION does NOT void — a bank legitimately grows', () => {
    const c = compareBank('f', 'B', [entry('a', 'alpha'), entry('b', 'beta'), entry('c', 'gamma')], signed);
    expect(c.added).toEqual(['c']);
    expect(c.voided).toBe(false);
  });

  it('separates an addition from an edit in the same run — collapsing them is the failure mode', () => {
    const c = compareBank('f', 'B', [entry('a', 'ALPHA'), entry('b', 'beta'), entry('c', 'gamma')], signed);
    expect(c.edited).toEqual(['a']);
    expect(c.added).toEqual(['c']);
    expect(c.voided).toBe(true);
  });
});

describe('bank registry', () => {
  it('covers every family that draws from a bank', () => {
    expect(unregisteredFamilies()).toEqual([]);
  });

  it('names no family that has ceased to exist', () => {
    expect(orphanedRegistryEntries()).toEqual([]);
  });

  it('gives every registered bank entries with unique ids — the comparison depends on it', () => {
    for (const reg of FAMILY_BANKS) {
      const ids = reg.bank.map((e) => e.id);
      expect(ids.length, `${reg.bankName} is empty`).toBeGreaterThan(0);
      expect(new Set(ids).size, `${reg.bankName} has duplicate ids`).toBe(ids.length);
    }
  });
});
