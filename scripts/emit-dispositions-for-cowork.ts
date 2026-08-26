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
];

const artefact = {
  kind: 'field-dispositions-for-cowork',
  what: 'THE membership, in a form to import rather than read. One membership, both stores.',
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
    cases: CONFORMANCE,
  },
  counts: Object.entries(FIELD_DISPOSITIONS).reduce((a: Record<string, number>, [, v]) => ({ ...a, [v]: (a[v] ?? 0) + 1 }), {}),
};
const json = JSON.stringify(artefact, null, 1) + '\n';
const name = stampedName('field-dispositions-for-cowork', sha256(json).slice(0, 16), 'json');
writeFileSync(join(REPO, 'content/exports', name), json);
deliver(join(REPO, 'content/exports', name), 'field-dispositions-for-cowork');
console.log(`paths: ${Object.keys(FIELD_DISPOSITIONS).length}; conformance cases: ${CONFORMANCE.length}`);
