/**
 * THE MEMBERSHIP CROSSES IN AN IMPORTABLE FORM (David, 2026-08-25 — R724).
 *
 * Cowork asked, and its screen currently re-derives child/quotation/staff by a LEAF-NAME rule of
 * its own — a second implementation, which is the fault this store has just spent two turns
 * removing from its own check. One membership, both stores.
 *
 * The artefact carries DATA, not prose: the map to import, and the two things that are RULES
 * rather than lists (retention by underscore, symbol-hood by shape), stated as testable
 * predicates with worked cases so an importer can implement them identically and PROVE it did.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIELD_DISPOSITIONS, NOTATION_BEARING_PATHS, capitalRunIsExempt,
  dispositionFor, gapMarkerSpans, isRetentionPath, isSymbolString,
} from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';

const REPO = join(__dirname, '..');
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// Worked cases the importer can run its own implementation against — the fixture discipline
// (R721) applied to a crossing: a membership that cannot be verified on arrival is prose.
const CONFORMANCE = [
  { fn: 'dispositionFor', args: ['stem', 'text'], expect: dispositionFor('stem', 'text') },
  { fn: 'dispositionFor', args: ['explanation', 'note'], expect: dispositionFor('explanation', 'note') },
  { fn: 'dispositionFor', args: ['options[]', 'attractorQuote'], expect: dispositionFor('options[]', 'attractorQuote') },
  { fn: 'dispositionFor', args: ['stem', '_previousText'], expect: dispositionFor('stem', '_previousText') },
  { fn: 'dispositionFor', args: ['stem', 'somethingNobodyHasRuled'], expect: dispositionFor('stem', 'somethingNobodyHasRuled') ?? null },
  { fn: 'isRetentionPath', args: ['explanation._repairAuthority.landedHereOn'], expect: isRetentionPath('explanation._repairAuthority.landedHereOn') },
  { fn: 'isSymbolString', args: ['SH___'], expect: isSymbolString('SH___') },
  { fn: 'isSymbolString', args: ['He SHOUTED at the dog.'], expect: isSymbolString('He SHOUTED at the dog.') },
  { fn: 'gapMarkerSpans', args: ['Ade was the ___(2)___ runner.'], expect: gapMarkerSpans('Ade was the ___(2)___ runner.') },
  { fn: 'capitalRunIsExempt', args: ['stem', 'sentence', 'Ade was the ___(2)___ runner.', 12, 21], expect: capitalRunIsExempt('stem', 'sentence', 'Ade was the ___(2)___ runner.', 12, 21) },
  { fn: 'capitalRunIsExempt', args: ['stem', 'prompt', 'Which word joins with AIR to make one new word?', 22, 25], expect: capitalRunIsExempt('stem', 'prompt', 'Which word joins with AIR to make one new word?', 22, 25) },

  /**
   * **THE BOUNDARY CLASS, ADDED AFTER ELEVEN CASES PROVED AGREEMENT ABOUT THE INTERIOR ONLY**
   * (R745). Not one of the original eleven carried a CAPITAL RUN ADJACENT TO A MARKER — the suite
   * had a symbol, a marker inside a sentence, and a stimulus word, and nothing at the seam where
   * letters meet underscores. That seam is the entire class the two implementations diverge on,
   * so 11 of 11 passed while the ports disagreed on every frame in the corpus.
   *
   * Every case below sits ON the boundary: letters before the blank, letters after it, letters on
   * both sides, and the trailing lone letter no run rule ever asks about.
   */
  { fn: 'gapMarkerSpans', args: ['The word stops at DE___VE.'], expect: gapMarkerSpans('The word stops at DE___VE.') },
  { fn: 'gapMarkerSpans', args: ['See where the word splits: COM___E.'], expect: gapMarkerSpans('See where the word splits: COM___E.') },
  { fn: 'gapMarkerSpans', args: ['The frame reads SH___.'], expect: gapMarkerSpans('The frame reads SH___.') },
  { fn: 'gapMarkerSpans', args: ['Look at the frame ___AN.'], expect: gapMarkerSpans('Look at the frame ___AN.') },
  { fn: 'capitalRunIsExempt', args: ['explanation', 'walkScript', 'The word stops at DE___VE.', 18, 20, '// DE — letters BEFORE the blank'], expect: capitalRunIsExempt('explanation', 'walkScript', 'The word stops at DE___VE.', 18, 20) },
  { fn: 'capitalRunIsExempt', args: ['explanation', 'walkScript', 'The word stops at DE___VE.', 23, 25, '// VE — letters AFTER the blank'], expect: capitalRunIsExempt('explanation', 'walkScript', 'The word stops at DE___VE.', 23, 25) },
  { fn: 'capitalRunIsExempt', args: ['explanation', 'walkScript', 'Look at the frame ___AN.', 21, 23, '// AN — a frame that OPENS with the blank'], expect: capitalRunIsExempt('explanation', 'walkScript', 'Look at the frame ___AN.', 21, 23) },
  { fn: 'capitalRunIsExempt', args: ['explanation', 'walkScript', 'OUT makes SHOUT, and shouting wakes the baby.', 0, 3, '// THE CONTROL — a capital run with no marker anywhere; both stores must say false, or they agree by exempting everything'], expect: capitalRunIsExempt('explanation', 'walkScript', 'OUT makes SHOUT, and shouting wakes the baby.', 0, 3) },
];

const payload = {
  kind: 'field-dispositions-recross-for-cowork',
  what: 'THE membership, in a form to import rather than read. One membership, both stores. RE-CROSSED under a new name: the first crossing never arrived — the desk holds 161 files and none is it.',
  why: 'Cowork\'s screen re-derives child/quotation/staff by a leaf-name rule of its own. Two implementations agreeing proves only that they agree — this store deleted its own second implementation two turns ago (R717) and this is the other half of that repair.',
  sourceOfTruth: { file: 'packages/core/src/field-dispositions.ts', note: 'this artefact is GENERATED from the live constants, never transcribed — a copied membership is a second implementation wearing a data hat.' },
  theMembership: FIELD_DISPOSITIONS,
  theRulesThatAreNotLists: {
    retention: { rule: 'ANY path segment beginning with an underscore is RETENTION (R715). It is a rule, not a list, so a before-image nobody has written yet is covered on the day it appears.', predicate: 'isRetentionPath(path)' },
    notationBearingPaths: [...NOTATION_BEARING_PATHS],
    symbolhood: { rule: 'a symbol in its own system: one token, no internal whitespace, no sentence punctuation (R719). Notation is exempt ONLY where the path carries symbols AND the string IS one — a capital inside a sentence a child reads can never claim it.', predicate: 'isSymbolString(text)' },
    gapMarkers: { rule: 'a gap marker is exempt WHEREVER IT SITS, including inside a sentence, because the sentence is where the gap must appear (R722). The exemption is for the MARKER, never the sentence around it.', predicate: 'gapMarkerSpans(text)' },
    stimulusWords: { rule: 'a stimulus word in a prompt is NOT notation and amends to QUOTED form under her 142nd\'s precedent (R723). Wired this turn: the vr-12 generator and 25 derived rows now read joins with "tooth" rather than TOOTH.', predicate: 'capitalRunIsExempt(...) === false' },
  },
  conformanceCases: {
    why: 'run your implementation against these and it either agrees or it does not — a membership that cannot be verified on arrival is prose (the fixture discipline, R721, applied to a crossing).',
    THE_BOUNDARY_RULE: 'A CONFORMANCE SUITE THAT AVOIDS THE BOUNDARY PROVES AGREEMENT ABOUT THE INTERIOR ONLY. The first eleven cases here passed 11 of 11 while the two implementations disagreed on every frame in the corpus, because not one case put a capital run ADJACENT TO A MARKER — the only place they differ. Cases are chosen at the seams a rule creates, never in the middle of what it obviously covers.',
    cases: CONFORMANCE,
  },
  counts: Object.entries(FIELD_DISPOSITIONS).reduce((a: Record<string, number>, [, v]) => ({ ...a, [v]: (a[v] ?? 0) + 1 }), {}),
};
/**
 * **THE DIGEST INLINE, HONESTLY** (David asked for it, and a file cannot contain its own digest —
 * writing the hash in changes the document). So what IS inline is the digest of the MEMBERSHIP
 * PAYLOAD: a canonical serialisation of the membership and its rules, hashed before the envelope
 * is built. That value can be recomputed on arrival over the same subtree and is what an importer
 * actually needs to check. The FILE digest travels where it must — the staging line and the
 * .sha256 sidecar.
 */
const canonical = (o: unknown): string => {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return `[${o.map(canonical).join(',')}]`;
  return `{${Object.keys(o as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((o as Record<string, unknown>)[k])}`).join(',')}}`;
};
const membershipSha256 = sha256(canonical({ theMembership: payload.theMembership, theRulesThatAreNotLists: payload.theRulesThatAreNotLists }));
const artefact = {
  ...payload,
  membershipSha256,
  howToCheckThisOnArrival: {
    subtree: '{theMembership, theRulesThatAreNotLists}',
    /**
     * THE CONVENTION IS NAMED BECAUSE THE DEFAULT IS WRONG. Checking this on arrival with
     * Python's default json.dumps FAILS — ensure_ascii=True escapes the em dashes and
     * apostrophes in the rule text and the digest moves. I raised exactly that false alarm
     * against my own artefact before naming the spec, which is the fault Cowork already
     * recorded once: "six false alarms from my instrument, about a file that was intact."
     */
    spec: 'sha256 over json.dumps(subtree, sort_keys=True, separators=(",",":"), ensure_ascii=False).encode("utf-8") — Cowork\'s own declared digestSpec, restated so the default cannot bite.',
    verifiedBothWays: 'reproduced here under that spec before crossing; it does NOT reproduce under ensure_ascii=True, and that is a property of the convention rather than of the bytes.',
    fileDigest: 'in the staging line and the .sha256 sidecar — a file cannot carry its own.',
  },
};
const json = JSON.stringify(artefact, null, 1) + '\n';
const name = stampedName('field-dispositions-recross-for-cowork', sha256(json).slice(0, 16), 'json');
writeFileSync(join(REPO, 'content/exports', name), json);
deliver(join(REPO, 'content/exports', name), 'field-dispositions-recross-for-cowork');
console.log(`paths: ${Object.keys(FIELD_DISPOSITIONS).length}; conformance cases: ${CONFORMANCE.length}; membershipSha256 ${membershipSha256}`);
