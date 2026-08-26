/**
 * WHAT EVERY STRING ON AN ITEM IS, AND THEREFORE WHICH GATE BINDS IT (David's ruling on the
 * sweep's lead, 2026-08-25 — R714).
 *
 * **The child-facing gate walks every string on the row and screens BY DISPOSITION, never by a
 * field list.** The gate had walked `explanation` through a three-name list —
 * `walkScript`, `walk`, `hintCore` — so `explanation.note`, a path this store classifies CHILD,
 * carried a US spelling past every check, and `teachBack` carried banned vocabulary. A field list
 * screens what somebody remembered; a disposition screens what the row actually holds.
 *
 * **A PATH WITH NO DISPOSITION REFUSES UNTIL RULED.** An unclassified string is not assumed safe
 * and not assumed child-facing: it stops the item and comes to the desk as a question. That is
 * the only default that cannot silently widen — the same choice `roleForItemStem` makes when it
 * falls back to the strictest rules.
 *
 * ONE MEMBERSHIP, TWO READERS: the gate screens from this map and `check:every-string-field`
 * reports from it. Neither re-lists (R57/R429).
 */
export type FieldDisposition = 'child' | 'staff' | 'quotation' | 'undecided' | 'retention';

/**
 * RETENTION FIELDS ARE READ-ONLY EVIDENCE (Annie's 156th, David's ruling, 2026-08-25 — R715).
 *
 * An underscore-prefixed field holds a BEFORE-IMAGE: the string as it stood before a repair.
 * Cowork's screen found six punctuation faults in `stem._previousText` and named them correctly
 * as **not faults** — *"a doubled quotation mark in a retained before-image is a record of what
 * was repaired."* **No gate flags them and no repairer touches them**, because repairing a
 * retention field destroys the evidence it exists to hold.
 *
 * The rule is the UNDERSCORE, not a list: any path segment beginning `_` is retention, so a
 * before-image nobody has thought of yet is covered on the day it is written.
 */
export const isRetentionPath = (path: string): boolean =>
  path.split('.').some((seg) => seg.replace(/\[\d+\]/g, '').startsWith('_'));

/**
 * A QUESTION TYPE'S OWN ORTHOGRAPHY IS NOT EMPHASIS — AND THE EXEMPTION HAS A BOUNDARY
 * (Annie's 156th/157th, David's rulings, 2026-08-25 — R716, scoped R719).
 *
 * vr-06 renders the target `SHOUT`, the frame `SH___` and the option `OUT` in capitals BECAUSE
 * the child is completing letters; a joins-with prompt capitalises `AIR` because it is the thing
 * being joined. The shouted-capitals rule binds EMPHASIS ONLY.
 *
 * **HER SCOPE LINE, WHICH IS THE WHOLE RULE**: *notation is exempt where the string is an
 * IDENTIFIER OR SYMBOL IN ITS OWN SYSTEM, and never where it sits inside a sentence a child
 * reads. A code letter in a series is notation; a capital inside a stem is emphasis wearing
 * notation's coat.*
 *
 * So the exemption needs BOTH conditions and neither alone:
 *   1. the PATH must be one that carries symbols rather than prose, and
 *   2. the STRING itself must BE a symbol — no internal whitespace, no sentence punctuation.
 * `stem.prompt` fails (1). A capital inside any sentence fails (2), on every path, including the
 * notation-bearing ones — because `options[].content.value` is a single letter on a VR card and a
 * full sentence on a comprehension one, the same field name carrying two kinds of content.
 */
export const NOTATION_BEARING_PATHS = new Set([
  'stem.target', 'stem.frame', 'stem.stemWord', 'stem.word1', 'stem.word2', 'stem.sum',
  'stem.code.P', 'stem.code.Q', 'stem.code.R', 'stem.code.S',
  'stem.series[]', 'stem.pairA[]', 'stem.words[]', 'stem.clues[]',
  'options[].content.value', 'options[].content.label',
]);

/** A symbol in its own system: one token, no sentence punctuation. Never a sentence. */
export const isSymbolString = (text: string): boolean => {
  const s = text.trim();
  if (s === '' || /\s/.test(s)) return false;
  return !/[.!?,;:]/.test(s.replace(/[.]{2,}/g, ''));
};

/**
 * The notation exemption, with her boundary enforced. A capital inside a sentence a child reads
 * CANNOT claim it, whatever path it sits on.
 */
export function notationExempt(root: string, path: string, text: string): boolean {
  return NOTATION_BEARING_PATHS.has(dispositionKey(root, path)) && isSymbolString(text);
}

/**
 * GAP MARKERS ARE EXEMPT WHEREVER THEY SIT (David's ruling, 2026-08-25 — R722).
 *
 * **The sentence is where the gap must appear**, so a gap marker is a symbol in its own system
 * even inside prose a child reads — the one thing that can be, because moving it out of the
 * sentence destroys the question. `___(2)___` in a cloze carrier and `SH___` in a vr-06 frame are
 * the same object in two shapes.
 *
 * The exemption is for THE MARKER, never for the sentence around it: everything outside these
 * spans is screened exactly as before.
 */
const GAP_MARKER = /[A-Z]*_{2,}(?:\(\d+\)_{2,})?[A-Z]*/g;

export function gapMarkerSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  for (const m of text.matchAll(GAP_MARKER)) {
    if (m.index === undefined) continue;
    spans.push([m.index, m.index + m[0].length]);
  }
  return spans;
}

/**
 * Is this capital run exempt from the shouted-capitals rule? Exempt when it IS a gap marker
 * wherever it sits (R722), or when the whole string is a symbol on a notation-bearing path
 * (R719). **A stimulus word inside a prompt is NEITHER** — it amends to quoted form under her
 * 142nd's precedent (R723) — and a bare shout inside a stem is neither, which is the probe.
 */
export function capitalRunIsExempt(root: string, path: string, text: string, runStart: number, runEnd: number): boolean {
  if (notationExempt(root, path, text)) return true;
  return gapMarkerSpans(text).some(([s, e]) => runStart >= s && runEnd <= e);
}

/** Normalises a walked path to its declaration key: array indices collapse to `[]`. */
export function dispositionKey(root: string, path: string): string {
  const normalised = path.replace(/\[\d+\]/g, '[]');
  return normalised ? `${root}.${normalised}` : root;
}

export const FIELD_DISPOSITIONS: Record<string, FieldDisposition> = {
  // --- STAFF: never rendered to a child. ---
  'stem.techniqueKey': 'staff', 'stem.answerShape': 'staff', 'options[].senseTarget': 'staff',
  'stem.passageRef': 'staff', 'stem.passageNames': 'staff', 'stem.passageNames[]': 'staff',
  'stem.lineRefs': 'staff', 'stem.lineRefs[]': 'staff', 'stem.gapIndex': 'staff', 'stem.gapRef': 'staff',
  'stem.quotes[].exemptFrom': 'staff', 'stem.quotes[].exemptFrom[]': 'staff',
  'stem.quotes[].line': 'staff', 'stem.quotesAuthority': 'staff', 'stem.sentenceKind': 'staff',
  'explanation.quotes[].exemptFrom': 'staff', 'explanation.quotes[].exemptFrom[]': 'staff',
  'explanation.quotes[].line': 'staff', 'explanation.quotesAuthority': 'staff',
  'explanation.walkScriptBatch': 'staff', 'explanation.walkScriptStatus': 'staff',
  'explanation.walkScriptApprovedBy': 'staff', 'explanation.hintAuthority': 'staff',
  'explanation.hintAuthoredBy': 'staff', 'explanation.hintServes': 'staff', 'explanation.hintRuledBy': 'staff',
  'explanation.hintRuling': 'staff', 'explanation.hintCoreSource': 'staff',
  'explanation.fieldWithoutAColumn.field': 'staff', 'explanation.fieldWithoutAColumn.value': 'staff',
  'explanation.fieldWithoutAColumn.appliesTo': 'staff', 'explanation.fieldWithoutAColumn.note': 'staff',
  'explanation.fieldWithoutAColumn.authority': 'staff',
  'options[].misconceptionExecution': 'staff', 'options[].misconceptionExecutionBasis': 'staff',
  'options[].a36Note': 'staff', 'options[].windowClass': 'staff', 'options[].tagStatus': 'staff',
  'options[].attractorLine': 'staff', 'options[].defeaterLine': 'staff',
  'options[].drafterDeclaredPull': 'staff', 'options[].drafterDeclaredPullVerdict': 'staff',
  drafterNote: 'staff',
  'mechanismLedger[].mechanism': 'staff', 'mechanismLedger[].evidence': 'staff',

  // --- CHILD: rendered on the card. Every one of these is screened. ---
  'stem.text': 'child', 'stem.prompt': 'child', 'stem.sentence': 'child', 'stem.question': 'child',
  'stem.frame': 'child', 'stem.carrier': 'child', 'stem.target': 'child',
  'stem.series[]': 'child', 'stem.pairA[]': 'child', 'stem.clues[]': 'child',
  'stem.stemWord': 'child', 'stem.word1': 'child', 'stem.word2': 'child',
  'stem.sum': 'child', 'stem.words[]': 'child',
  'stem.code.P': 'child', 'stem.code.Q': 'child', 'stem.code.R': 'child', 'stem.code.S': 'child',
  'stem.operands.expr': 'child', 'stem.operands.kind': 'child',
  'stem.quotes[]': 'child', 'stem.quotes[].text': 'child',
  'explanation.quotes[].text': 'child', 'explanation.note': 'child',
  'explanation.walkScript': 'child', 'explanation.walk': 'child', 'explanation.hintCore': 'child',
  'explanation.teachBack': 'child',
  'options[].content.value': 'child', 'options[].content.label': 'child',

  // --- QUOTATION: bound by fidelity to its source, never by house style (R711). ---
  'options[].attractorQuote': 'quotation', 'options[].defeaterQuote': 'quotation',

  // --- STAFF, ruled 2026-08-25 (her 157th thread): the THIRTY the whole-row walk surfaced —
  // sixteen draftSelfAssessment.*, three stem.quotes[].*, two stemRedraft.*, nine singletons.
  // Provenance, review record and drafting method throughout; none is rendered to a child. ---
  'draftSelfAssessment.handoffState': 'staff',
  'draftSelfAssessment.notes': 'staff',
  'draftSelfAssessment.rubric.banList': 'staff',
  'draftSelfAssessment.rubric.fairness': 'staff',
  'draftSelfAssessment.rubric.tierFit': 'staff',
  'draftSelfAssessment.rubricDerivability.banList': 'staff',
  'draftSelfAssessment.rubricDerivability.distractorsExecute': 'staff',
  'draftSelfAssessment.rubricDerivability.fairness': 'staff',
  'draftSelfAssessment.rubricDerivability.keyVerified': 'staff',
  'draftSelfAssessment.rubricDerivability.readingAge': 'staff',
  'draftSelfAssessment.rubricDerivability.tierFit': 'staff',
  'draftSelfAssessment.rubricDerivabilityNote': 'staff',
  'draftSelfAssessment.subjectHash': 'staff',
  'draftSelfAssessment.subjectHashCaveat': 'staff',
  'draftSelfAssessment.subjectHashCovers': 'staff',
  'draftSelfAssessment.subjectHashStampedAt': 'staff',
  'draftingMethod': 'staff',
  'itemModel': 'staff',
  'passageFlag': 'staff',
  'r4Note': 'staff',
  'reviewMethod': 'staff',
  'reviewNotes': 'staff',
  'reviewRecordNote': 'staff',
  'sourcedFrom': 'staff',
  'stem.quotes[].passageRef': 'staff',
  'stem.quotes[].rule': 'staff',
  'stem.quotes[].why': 'staff',
  'stemRedraft.rules[]': 'staff',
  'stemRedraft.why': 'staff',
  'tierRationale': 'staff',

  // --- STAFF, ruled 2026-08-25 (her 156th thread): the seven the gate surfaced. A declaration's
  // own metadata and a recorded ruling; neither is rendered to a child. ---
  'explanation.quotes[].rule': 'staff', 'explanation.quotes[].passageRef': 'staff',
  'explanation.unplacedBySplit.why': 'staff', 'explanation.unplacedBySplit.split': 'staff',
  'explanation.unplacedBySplit.state': 'staff', 'explanation.unplacedBySplit.ruledBy': 'staff',
  'explanation.unplacedBySplit.authority': 'staff',
};

/**
 * THE ONE FUNCTION BOTH READERS CALL (R717). The gate screens from this and
 * `check:every-string-field` reports from it — no second implementation, no re-derived predicate.
 * Returns undefined for a path nobody has ruled, which REFUSES rather than defaulting.
 */
export function dispositionFor(root: string, path: string): FieldDisposition | undefined {
  const key = dispositionKey(root, path);
  if (isRetentionPath(key)) return 'retention';
  return FIELD_DISPOSITIONS[key];
}

/** Is this path screened by the child-facing gate? The gate's own answer, never a model of it. */
export const isScreenedPath = (root: string, path: string): boolean => dispositionFor(root, path) === 'child';
