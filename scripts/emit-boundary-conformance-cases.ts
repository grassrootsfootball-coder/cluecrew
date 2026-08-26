/**
 * THE EIGHT BOUNDARY CONFORMANCE CASES, CROSSED AS THEIR OWN ARTEFACT (David, 2026-08-26 — R753).
 *
 * They were authored at R745 and put inside the membership crossing, where they have twice failed
 * to arrive: Cowork reports the crossed membership still holds its ORIGINAL ELEVEN. A case block
 * riding inside a larger artefact shares that artefact's fate, and the fate here was not-arriving.
 * So they cross alone, named for what they are, small enough to be run rather than read.
 *
 * They also cross with Cowork's own eight run through THIS implementation, because that is the
 * thing that lets its two alias names go: the migration order says the replacement is proved
 * against the ruled fixture before the old path is deleted, and it cannot make that proof from
 * cases it authored itself.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { capitalRunIsExempt, gapMarkerSpans, isSymbolString } from '../packages/core/src/index';
import { assertFixture } from './lib/carried-fixture';
import { deliver, stampedName } from './lib/export-destination';
import { findingsDigest } from './lib/findings-digest';
import { createHash } from 'node:crypto';

const REPO = join(__dirname, '..');
const at = (text: string, run: string) => { const i = text.indexOf(run); if (i < 0) throw new Error(`run ${run} not in ${text}`); return [i, i + run.length] as const; };

/** THE EIGHT. Every span computed from the TypeScript — a hand-typed offset is how the fixture caught me last time. */
const spanCase = (klass: string, text: string, why: string) => ({
  class: klass, fn: 'gapMarkerSpans', text, why,
  expect: gapMarkerSpans(text),
  marks: gapMarkerSpans(text).map(([a, b]) => text.slice(a, b)),
});
const runCase = (klass: string, root: string, path: string, text: string, run: string, why: string) => {
  const [a, b] = at(text, run);
  return { class: klass, fn: 'capitalRunIsExempt', args: [root, path, text, a, b], text, run, runSpan: [a, b], why, expect: capitalRunIsExempt(root, path, text, a, b) };
};

const THE_EIGHT = [
  spanCase('letters BOTH sides of the blank', 'The word stops at DE___VE.', 'her cited frame; the whole mark or nothing'),
  spanCase('a LONE capital at the tail of the mark', 'See where the word splits: COM___E.', 'the run rule needs two capitals, so E is never ASKED about — but it must be INSIDE the span or the mark is not the token'),
  spanCase('letters LEFT of the blank only', 'The frame reads SH___.', 'the string the crossing turned on'),
  spanCase('letters RIGHT of the blank only', 'Look at the frame ___AN.', 'the mirror; a rule that handles one side is half a rule'),
  runCase('the PREDICATE on letters before the blank', 'explanation', 'walkScript', 'The word stops at DE___VE.', 'DE', 'the tokeniser being right does not make the predicate right — this is the question her ruling actually asked'),
  runCase('the PREDICATE on letters after the blank', 'explanation', 'walkScript', 'The word stops at DE___VE.', 'VE', 'the far side of the same mark; a predicate reading only the left of a span passes the case above and fails here'),
  runCase('the PREDICATE where the frame OPENS with the blank', 'explanation', 'walkScript', 'Look at the frame ___AN.', 'AN', 'no letters precede the underscores, so a predicate that looks backwards from the run finds nothing'),
  runCase('THE CONTROL — a capital run with NO marker anywhere', 'explanation', 'walkScript', 'OUT makes SHOUT, and shouting wakes the baby.', 'OUT', 'two implementations that exempt everything also agree. This is the case that distinguishes agreement from surrender, and it must be FALSE on both sides.'),
];

/** COWORK'S OWN EIGHT, verbatim from port-proved (kind: mark-predicate-ported-and-proved), run here. */
const COWORKS_EIGHT: Array<{ class: string; text: string; expect: Array<[number, number]> }> = [
  { class: 'letters BOTH sides of the blank', text: 'The word stops at DE___VE.', expect: [[18, 25]] },
  { class: 'letters LEFT of the blank only', text: 'The frame reads SH___.', expect: [[16, 21]] },
  { class: 'letters RIGHT of the blank only', text: 'Look at the frame ___AN.', expect: [[18, 23]] },
  { class: 'numbered gap inside a sentence a child reads', text: 'Ade was the ___(2)___ runner.', expect: [[12, 21]] },
  { class: 'a bare mention — capitals, NO blank', text: 'OUT makes SHOUT, and shouting wakes the baby.', expect: [] },
  { class: 'a LONE capital at the tail of the mark', text: 'See where the word splits: COM___E.', expect: [[27, 34]] },
  { class: 'TWO marks in one string', text: 'From SH___ to ___AN.', expect: [[5, 10], [14, 19]] },
  { class: 'a pure blank, no letters either side', text: 'Ade was the ___ runner.', expect: [[12, 15]] },
];

const eq = (a: Array<[number, number]>, b: Array<[number, number]>) => JSON.stringify(a) === JSON.stringify(b);

async function run() {
  assertFixture('boundary-conformance', [
    { name: 'a frame with letters both sides is ONE token', input: 'The word stops at DE___VE.', mustBeCaught: true },
    { name: 'a frame opening with the blank is ONE token', input: 'Look at the frame ___AN.', mustBeCaught: true },
    { name: 'a capital run with no marker is not a token', input: 'OUT makes SHOUT here.', mustBeCaught: false },
    { name: 'ordinary prose yields nothing', input: 'Please do not shout so loudly.', mustBeCaught: false },
  ], (t) => gapMarkerSpans(t).length > 0);

  const coworksEightHere = COWORKS_EIGHT.map((c) => {
    const mine = gapMarkerSpans(c.text);
    return { class: c.class, text: c.text, coworkExpects: c.expect, thisStoreReturns: mine, marks: mine.map(([a, b]) => c.text.slice(a, b)), agrees: eq(mine, c.expect as Array<[number, number]>) };
  });
  const disagreeing = coworksEightHere.filter((c) => !c.agrees);

  // A class in its suite and not in mine is a fact about MY suite, and it is the same fault her
  // §1 named — measured on my own work rather than declared closed.
  const myTexts = new Set(THE_EIGHT.map((c) => c.text));
  const classesOnlyCowork = COWORKS_EIGHT.filter((c) => !myTexts.has(c.text)).map((c) => c.class);

  const payload = {
    kind: 'boundary-conformance-cases',
    what: 'THE EIGHT BOUNDARY CASES, crossed alone because twice they did not arrive inside the membership. Every value computed by running packages/core — none typed by hand.',
    theMigrationOrderThisSERVES: 'Cowork aliased frameTokenSpans and isExemptByFrame rather than deleting them, on the grounds that a migration proved against the wrong fixture is proved against nothing. This is the right fixture. When these eight pass there, the alias names go.',
    THE_EIGHT_CASES: THE_EIGHT,
    COWORKS_OWN_EIGHT_RUN_HERE: {
      why: 'it cannot prove its port against cases it authored itself. Run through this store\'s gapMarkerSpans, its eight are:',
      agreeing: coworksEightHere.length - disagreeing.length,
      of: coworksEightHere.length,
      disagreements: disagreeing.length ? disagreeing : 'NONE — all eight of its expectations reproduce here, span for span.',
      cases: coworksEightHere,
    },
    AND_ITS_SUITE_CAUGHT_A_CLASS_MINE_LACKS: {
      classes: classesOnlyCowork,
      theOne: 'TWO marks in one string — "From SH___ to ___AN.". A SINGLE-MATCH IMPLEMENTATION PASSES EVERY ONE OF MY EIGHT AND FAILS THERE. My four span cases each carry exactly one mark, so the suite I authored to close a blind-agreement finding was itself blind to the multiplicity class.',
      soItIsCARRIEDHERE: 'as the ninth, credited to Cowork, because the case matters more than whose it is. It passes: ' + JSON.stringify(gapMarkerSpans('From SH___ to ___AN.')),
      andTheOTHERS: 'the numbered gap and the pure blank were in the ORIGINAL eleven, so those two are covered — they are absent from my eight, not from the suite.',
      theFindingABOUTSUITES: 'a boundary suite is not finished when it reaches the boundary. Mine reached the seam between letters and underscores, which was the disagreement, and never asked whether there could be TWO seams. Coverage of a class is not coverage of its cardinality.',
    },
    theNinth: spanCase('TWO marks in one string (Cowork\'s case, carried)', 'From SH___ to ___AN.', 'a single-match implementation passes all eight above and fails here'),
    THE_RULE_THE_CASES_ENCODE: 'gapMarkerSpans RETURNS THE FRAME TOKEN — letters and underscores together (R748, ruled on the spec rather than on either implementation). A run of underscores, plus the capitals immediately adjacent on either side, plus the optional (n) a numbered marker carries. SH___, ___AN, DE___VE, ___(2)___ are each ONE span. capitalRunIsExempt exempts a run that lies WHOLLY INSIDE such a span, and nothing else — which is what the control proves.',
    provenance: {
      source: 'packages/core/src/field-dispositions.ts, executed — this artefact is generated, not transcribed',
      alsoInside: 'the membership crossing (field-dispositions-recross-for-cowork, 19 cases). These are the same eight; this file exists so their arrival does not depend on that one\'s.',
      isSymbolStringOnAFrame: isSymbolString('SH___'),
    },
  };

  const artefact = { ...payload, ...findingsDigest(payload, ['THE_EIGHT_CASES', 'COWORKS_OWN_EIGHT_RUN_HERE', 'AND_ITS_SUITE_CAUGHT_A_CLASS_MINE_LACKS', 'theNinth']) };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const name = stampedName('boundary-conformance-cases-for-cowork', createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  writeFileSync(join(REPO, 'content/exports', name), json);
  deliver(join(REPO, 'content/exports', name), 'boundary-conformance-cases');
  console.log(`eight crossed; Cowork's eight agree here ${coworksEightHere.length - disagreeing.length}/${coworksEightHere.length}; classes only in its suite: ${classesOnlyCowork.join(' | ') || 'none'}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
