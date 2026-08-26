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
 * A QUESTION TYPE'S OWN ORTHOGRAPHY IS NOT EMPHASIS (Annie's 156th, David's ruling — R716).
 *
 * vr-06 renders the target `SHOUT`, the frame `SH___` and the option `OUT` in capitals BECAUSE
 * the child is completing letters; a joins-with prompt capitalises `AIR` because it is the thing
 * being joined. **The shouted-capitals rule binds EMPHASIS ONLY.** Scoring these would return 450
 * wrong verdicts — the qualifier lesson in a third guise, and the item gate has never done it:
 * probed before this rule was written, `SH___`/`SHOUT`/`OUT`/`AIR` all pass clean. This constant
 * exists so a LATER gate cannot be written that flags orthography without meeting the ruling.
 */
export const NOTATION_IS_NOT_EMPHASIS = true;

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
