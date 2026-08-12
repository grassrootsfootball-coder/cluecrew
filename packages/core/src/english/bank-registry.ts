/**
 * WHICH BANK EACH SIGNED ENGLISH FAMILY DRAWS FROM.
 *
 * This registry exists because a family object has NO handle on its bank, so nothing can be
 * derived. Ten families receive their bank through a factory (`errorSpotFamily({ bank: … })`)
 * which captures it in a closure; four reach a module constant directly inside their own code
 * (`HOMOPHONE_BANK.filter(…)`). Either way `familyFingerprint(family)` cannot see it — the map
 * has to be written down.
 *
 * A WRITTEN-DOWN MAP DRIFTS, so `unregisteredFamilies()` is the guard: every SPaG family plus
 * `en-vocab-in-context` must appear here, and the verifier refuses to run if one does not. That
 * is the `en-vocab-in-context` lesson exactly — a family deliberately outside `SPAG_FAMILIES` was
 * signed, pinned, and invisible to every sweep keyed on that array. A new family added without a
 * bank entry would be unguarded in the same silent way.
 *
 * This maps GENERATOR BANKS only. English comprehension items are authored in the database under
 * a different mechanism and are not covered here — see the verifier's own output.
 */
import type { BankEntry } from './bank-fingerprint';
import {
  COMMA_BANK,
  CONNECTIVE_BANK,
  CONTRACTION_BANK,
  DOUBLE_BANK,
  HOMOPHONE_BANK,
  POSSESSIVE_BANK,
  SILENT_BANK,
  SPAG_FAMILIES,
  SPEECH_BANK,
  SUFFIX_BANK,
  TAG_BANK,
  TENSE_BANK,
  TERMINAL_BANK,
  WORD_CLASS_BANK,
} from './spag-families';
import { VOCAB_BANK, VOCAB_IN_CONTEXT } from './vocab-context';

export interface RegisteredBank {
  familyId: string;
  bankName: string;
  bank: readonly BankEntry[];
}

export const FAMILY_BANKS: RegisteredBank[] = [
  { familyId: 'spag-spell-homophone-by-sound', bankName: 'HOMOPHONE_BANK', bank: HOMOPHONE_BANK },
  { familyId: 'spag-spell-double-consonant-boundary', bankName: 'DOUBLE_BANK', bank: DOUBLE_BANK },
  { familyId: 'spag-spell-unstressed-suffix-vowel', bankName: 'SUFFIX_BANK', bank: SUFFIX_BANK },
  { familyId: 'spag-spell-silent-letter-dropped', bankName: 'SILENT_BANK', bank: SILENT_BANK },
  { familyId: 'spag-punct-apostrophe-contraction', bankName: 'CONTRACTION_BANK', bank: CONTRACTION_BANK },
  { familyId: 'spag-punct-apostrophe-possessive', bankName: 'POSSESSIVE_BANK', bank: POSSESSIVE_BANK },
  { familyId: 'spag-punct-comma-needs', bankName: 'COMMA_BANK', bank: COMMA_BANK },
  { familyId: 'spag-punct-terminal-boundary', bankName: 'TERMINAL_BANK', bank: TERMINAL_BANK },
  { familyId: 'spag-punct-speech', bankName: 'SPEECH_BANK', bank: SPEECH_BANK },
  { familyId: 'spag-cloze-word-class', bankName: 'WORD_CLASS_BANK', bank: WORD_CLASS_BANK },
  { familyId: 'spag-cloze-tense', bankName: 'TENSE_BANK', bank: TENSE_BANK },
  { familyId: 'spag-cloze-connectives', bankName: 'CONNECTIVE_BANK', bank: CONNECTIVE_BANK },
  { familyId: 'spag-cloze-tags', bankName: 'TAG_BANK', bank: TAG_BANK },
  { familyId: 'en-vocab-in-context', bankName: 'VOCAB_BANK', bank: VOCAB_BANK },
];

/**
 * Families that draw from a bank but are not registered above. Must be empty — a family missing
 * here is a family whose sentences nothing guards, and it would fail open exactly like the
 * allowlist R57 removed.
 */
export function unregisteredFamilies(): string[] {
  const registered = new Set(FAMILY_BANKS.map((b) => b.familyId));
  const expected = [...SPAG_FAMILIES.map((f) => f.id), VOCAB_IN_CONTEXT.id];
  return expected.filter((id) => !registered.has(id));
}

/** Registry entries naming a family that no longer exists — the other direction of the same drift. */
export function orphanedRegistryEntries(): string[] {
  const expected = new Set([...SPAG_FAMILIES.map((f) => f.id), VOCAB_IN_CONTEXT.id]);
  return FAMILY_BANKS.filter((b) => !expected.has(b.familyId)).map((b) => b.familyId);
}
