/**
 * WHAT A FAMILY'S BANK CONTAINS, AND WHETHER IT STILL CONTAINS IT (annie's third leg, 2026-08-12).
 *
 * A fingerprint guards the DECLARED SURFACE. The param sweeps guard EMITTED BEHAVIOUR. Neither
 * sees BANK CONTENT: verified 2026-08-12, extending a family's bank moves neither its fingerprint
 * nor a sweep verdict, and the bank IS the sentences a child reads. This closes that.
 *
 * WHY THIS IS A SEPARATE HASH AND NOT PART OF `familyFingerprint` (option A, rejected on the
 * record). Folding the bank into the family fingerprint changes every existing hash, which
 * silently un-pins all fourteen English signatures. That is the refactor R34 forbids, and it is
 * exactly why `mathsFamilyFingerprint` was kept separate from `familyFingerprint` rather than
 * unified over a common type. Two hashes, one idea, no signature disturbed.
 *
 * WHY PER-ENTRY AND NOT ONE BANK-WIDE HASH. A bank legitimately GROWS — authoring adds sentences,
 * and a single hash would flag every addition as a possible tamper, which makes the guard
 * annoying enough to be switched off. But growth is not free either: `familyDepth` generates to
 * exhaustion, so depth is a function of bank size, and depth figures are carried in the signature
 * notes. So additions are reported and force a depth re-check; they do not void a signature.
 * EDITS and REMOVALS do void it — the reviewer signed those sentences.
 *
 * Every bank entry carries a unique stable `id` (verified across all fourteen banks), which is
 * what makes the per-entry comparison possible at all.
 */
import { createHash } from 'node:crypto';

/**
 * A bank entry only has to be IDENTIFIABLE. Deliberately no index signature: every bank's entry
 * type (SpotSentence, EsSentence, ClozeSentence, VocabItem…) carries `id` plus its own fields, and
 * an index signature would make each of those a non-overlapping conversion needing a cast. Widening
 * to `{ id: string }` is structurally valid for all of them, and the hash reads the whole object
 * regardless of which fields the type declares.
 */
export interface BankEntry {
  id: string;
}

export type BankEntryVerdict = 'UNCHANGED' | 'EDITED' | 'REMOVED' | 'ADDED';

export interface BankComparison {
  familyId: string;
  bankName: string;
  /** Hash of the whole bank as it stands now. */
  bankHash: string;
  signedEntries: number;
  currentEntries: number;
  unchanged: string[];
  /** Signed, still present, but its content has moved. VOIDS the signature. */
  edited: string[];
  /** Signed and now gone. VOIDS the signature. */
  removed: string[];
  /** Not signed, present now. Does NOT void — but it moves depth. */
  added: string[];
  /** True when anything the reviewer signed has been edited or removed. */
  voided: boolean;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex').slice(0, 16);

/** The hash of one bank entry — its full content, key order independent. */
export function bankEntryHash(entry: BankEntry): string {
  return digest(entry);
}

/**
 * The hash of a whole bank. Order-independent: a bank reordered is not a bank changed, and the
 * generators pick from it by filter rather than position.
 */
export function bankFingerprint(bank: readonly BankEntry[]): string {
  return digest(
    [...bank]
      .map((e) => [e.id, bankEntryHash(e)] as const)
      .sort((a, b) => a[0].localeCompare(b[0])),
  );
}

/** Every entry's hash, by id — what gets recorded at signing. */
export function bankEntryHashes(bank: readonly BankEntry[]): Record<string, string> {
  return Object.fromEntries(bank.map((e) => [e.id, bankEntryHash(e)]));
}

/**
 * Compare a bank as it stands against the per-entry hashes recorded when it was signed.
 *
 * The three classes are reported separately on purpose. Collapsing EDITED/REMOVED together with
 * ADDED into one "changed" boolean is what would make this unusable: an addition is ordinary
 * authoring, an edit to a signed sentence is a reviewer's ruling.
 */
export function compareBank(
  familyId: string,
  bankName: string,
  bank: readonly BankEntry[],
  signedEntryHashes: Record<string, string>,
): BankComparison {
  const now = bankEntryHashes(bank);
  const unchanged: string[] = [];
  const edited: string[] = [];
  const removed: string[] = [];
  const added: string[] = [];

  for (const [id, hash] of Object.entries(signedEntryHashes)) {
    if (!(id in now)) removed.push(id);
    else if (now[id] !== hash) edited.push(id);
    else unchanged.push(id);
  }
  for (const id of Object.keys(now)) {
    if (!(id in signedEntryHashes)) added.push(id);
  }

  return {
    familyId,
    bankName,
    bankHash: bankFingerprint(bank),
    signedEntries: Object.keys(signedEntryHashes).length,
    currentEntries: bank.length,
    unchanged: unchanged.sort(),
    edited: edited.sort(),
    removed: removed.sort(),
    added: added.sort(),
    voided: edited.length > 0 || removed.length > 0,
  };
}
