/**
 * THE 39 DECLARATIVE FIELDS — the ones a stem/option hash cannot see.
 *
 * Cowork scanned 26 files over 354 items and hand-classified 70 field paths: 39 DECLARATIVE,
 * 22 PROVENANCE, 9 CONTENT, with its scan refusing on anything unclassified. This is the
 * DECLARATIVE 39, carried whole (David, 2026-08-13) — versioning the manifest later costs more
 * than carrying fields now.
 *
 * A DECLARATIVE field says what an item IS, or what has been decided about it. Two stores can
 * hold byte-identical stems and options and disagree on every one of these. `segmentsInOptions`
 * is the case that produced the list: four options that RECONSTRUCT A SENTENCE, and a renderer
 * that does not read the flag lays them out as independent choices, so the child reads a
 * different question. The hashes match throughout.
 *
 * THE COUNTS ARE COWORK'S, over its 354. They are recorded so a field present there and absent
 * here is visible as a NUMBER rather than as an absence nobody sized.
 */

export type DeclarativeWeight = 'critical' | 'high' | 'normal';

export interface DeclarativeField {
  /** Dotted path in Cowork's item shape. `[]` marks an array element level. */
  path: string;
  /** How many of Cowork's 354 items carry it. */
  coworkCount: number;
  weight: DeclarativeWeight;
  /** Why losing it matters. Empty where the path speaks for itself. */
  note?: string;
}

export const DECLARATIVE_FIELDS: readonly DeclarativeField[] = [
  { path: 'difficultyTier', coworkCount: 354, weight: 'high',
    note: 'Drives every structural rule in the bank. Not derivable from the text.' },
  { path: 'misconceptions[]', coworkCount: 354, weight: 'high' },
  { path: 'options[].isCorrect', coworkCount: 354, weight: 'critical',
    note: 'The one declarative field whose loss is catastrophic and whose absence a text hash cannot see.' },
  { path: 'options[].misconceptionId', coworkCount: 354, weight: 'high',
    note: 'Two stores can hold the same option text and disagree about what a child who picks it did wrong.' },
  { path: 'questionTypeId', coworkCount: 354, weight: 'high' },
  { path: 'passageRef', coworkCount: 336, weight: 'high' },
  { path: 'lineRefs[]', coworkCount: 312, weight: 'high',
    note: 'The window the disposals live in. Ruled ITEM level; CHECK 11 asserts quote-level copies agree.' },
  { path: 'orderAnchor', coworkCount: 263, weight: 'normal',
    note: 'ENG-001 and ENG-002 predate it; the gate reports NOT RUN rather than passing it.' },
  { path: 'itemModel', coworkCount: 79, weight: 'normal' },
  { path: 'draftSelfAssessment.handoffState', coworkCount: 78, weight: 'critical',
    note: 'A stored REVIEW OUTCOME. Two stores can hold the same item and disagree about whether it has been passed. The platform’s provenance claim.' },
  { path: 'draftSelfAssessment.rubric.banList', coworkCount: 78, weight: 'critical' },
  { path: 'draftSelfAssessment.rubric.distractorsExecute', coworkCount: 78, weight: 'critical' },
  { path: 'draftSelfAssessment.rubric.fairness', coworkCount: 78, weight: 'critical' },
  { path: 'draftSelfAssessment.rubric.keyVerified', coworkCount: 78, weight: 'critical' },
  { path: 'draftSelfAssessment.rubric.readingAge', coworkCount: 78, weight: 'critical' },
  { path: 'draftSelfAssessment.rubric.tierFit', coworkCount: 78, weight: 'critical' },
  { path: 'stem.answerShape', coworkCount: 32, weight: 'high',
    note: 'The shape the key must take. The surface gate reads it; an importer that drops it drops the rule.' },
  { path: 'stem.techniqueKey', coworkCount: 32, weight: 'high',
    note: 'What the item is FOR. Two stores can hold the same four options and disagree about that.' },
  { path: 'stem.segmentsInOptions', coworkCount: 18, weight: 'high',
    note: 'THE CASE THAT PRODUCED THIS LIST. Options reconstruct a sentence; option text byte-identical, so a hash reports no difference.' },
  { path: 'options[].senseTarget', coworkCount: 13, weight: 'critical',
    note: 'CHECK 10 holds a whole tag on it. Without it the hint cannot be built from a stored field and the item is unshippable, though it reads fine.' },
  { path: 'clusterPosition', coworkCount: 12, weight: 'normal' },
  { path: 'stem.testedTokens[]', coworkCount: 10, weight: 'normal',
    note: 'Same job as the item-level field under a different path. Ruled ITEM level; migrate.' },
  { path: 'explanation.quotes[].exemptFrom[]', coworkCount: 8, weight: 'high' },
  { path: 'explanation.quotes[].passageRef', coworkCount: 8, weight: 'normal' },
  { path: 'explanation.quotes[].rule', coworkCount: 8, weight: 'normal' },
  { path: 'explanation.quotes[].atLines[]', coworkCount: 6, weight: 'normal',
    note: 'Name collision with lineRefs. Ruled: lineRefs wins; migrate.' },
  { path: 'stem.quotes[].exemptFrom[]', coworkCount: 6, weight: 'critical',
    note: 'Which child-facing ceilings this quotation is exempt from. Drop it and the gate refuses a legal item or passes an illegal one, depending on the default.' },
  { path: 'stem.quotes[].lineRefs[]', coworkCount: 6, weight: 'normal' },
  { path: 'stem.quotes[].passageRef', coworkCount: 6, weight: 'normal' },
  { path: 'stem.quotes[].rule', coworkCount: 6, weight: 'normal' },
  { path: 'importDoorFix.citationsResolved', coworkCount: 4, weight: 'normal',
    note: 'A claim about verification, not about text.' },
  { path: 'options[].secondaryMisconceptionId', coworkCount: 3, weight: 'high',
    note: 'A SECOND tag on one option. An importer expecting one tag per option drops it silently.' },
  { path: 'explanation.quotes[].lineRefs[]', coworkCount: 2, weight: 'normal' },
  { path: 'options[].tagStatus', coworkCount: 2, weight: 'high',
    note: 'Marks a tag provisional. An importer that drops it imports a provisional tag as a settled one.' },
  { path: 'banListException.needsReviewerRuling', coworkCount: 1, weight: 'critical',
    note: 'Says the item is BLOCKED pending a ruling. Drop it and a blocked item ships.' },
  { path: 'banListException.word', coworkCount: 1, weight: 'high' },
  { path: 'banListExceptionResolved', coworkCount: 1, weight: 'high' },
  { path: 'passageFlag', coworkCount: 1, weight: 'normal' },
  { path: 'testedTokens[]', coworkCount: 1, weight: 'normal',
    note: 'Exempts words from the long-word ceiling by EQUALITY, never prefix.' },
] as const;

/**
 * FIELDS THE DATABASE HOLDS IN A DIFFERENT SHAPE — declared, never inferred.
 *
 * A field misfiled here HIDES A REAL LOSS, which is the worse direction, so each entry names the
 * column or table that carries the fact and was verified by reading the enclosing model rather
 * than by grepping the name.
 *
 * THE NEAR MISS THAT SET THIS RULE: `preReviewVerdict` EXISTS as a column — on `Word`, meaning
 * the authoring pass's own verdict on a vocabulary card. A grep for the name would have declared
 * `preReview.verdict` MODELLED and hidden a real loss on 78 items. It is DROPPED. That is the
 * third name collision across two models this month, after `atLines`/`lineRefs` and
 * `stem.testedTokens`/`testedTokens`.
 */
export interface ModelledField {
  path: string;
  /** Where the database actually carries the fact. */
  carriedBy: string;
  /** How it was established — never "the name matched". */
  verifiedBy: string;
}

export const MODELLED_FIELDS: readonly ModelledField[] = [
  {
    path: 'misconceptions[]',
    carriedBy: 'ItemOption.misconceptionId (one relation per option)',
    verifiedBy:
      'Read the Item and ItemOption models in full. There is no item-level misconceptions array; ' +
      'the relation is per-option and populated on 164 of 164 ENG items.',
  },
  {
    path: 'options[].senseTarget',
    carriedBy: 'ItemOption.senseTarget',
    verifiedBy:
      'Columned on David’s ruling (2026-08-16) rather than left to a schema decision made under ' +
      'the pressure of a blocked import. The migration is applied and the column exists; no ' +
      'source delivered so far carries a value, so it is unpopulated rather than unrepresentable.',
  },
  {
    path: 'options[].secondaryMisconceptionId',
    carriedBy: 'ItemOptionTag (optionId, misconceptionId, role) with @@unique([optionId, role])',
    verifiedBy:
      'Read the ItemOptionTag model. A two-role tag model exists and the schema calls it "the ' +
      'source of truth for maths". The SHAPE is present; the table holds 0 rows, so the fact is ' +
      'unpopulated rather than unrepresentable. Reporting it DROPPED would put schema work on ' +
      'the list that is already done.',
  },
] as const;

/**
 * FIELDS COWORK CLASSIFIED PROVENANCE OR CONTENT THAT CROSS ANYWAY.
 *
 * David scoped carriage to the 39 DECLARATIVE fields and then revised it (2026-08-16): Cowork's
 * PROVENANCE classification was correct on its own terms and the line was drawn in the wrong
 * place, because PROVENANCE IS WHAT THE PLATFORM'S CLAIM RESTS ON. `misconceptionExecution` is
 * the affordance test's output — why this distractor executes this error — and the first thing a
 * reviewer asks to see.
 *
 * They are in the manifest for one reason: a field that is not in the manifest is not in the
 * baseline, and a field that is not in the baseline can be lost again without the guard noticing.
 */
export const PROVENANCE_FIELDS: readonly DeclarativeField[] = [
  { path: 'tierRationale', coworkCount: 354, weight: 'high', note: 'Why this item sits at this tier.' },
  { path: 'sourcedFrom', coworkCount: 354, weight: 'high', note: 'What the authoring pass read to write it.' },
  { path: 'mechanismLedger', coworkCount: 60, weight: 'high',
    note: 'Per-mechanism evidence at item level: which mechanism each distractor executes and why.' },
  { path: 'options[].misconceptionExecution', coworkCount: 282, weight: 'high',
    note: 'The affordance test’s output, per option. The first thing a reviewer asks to see.' },
  // THE NINE CONTENT KEYS (David, 2026-08-16). Each holds a fact that exists nowhere else, and
  // each is tracked here for one reason: a field not in the manifest is not in the baseline, and a
  // field not in the baseline can be lost again with nothing noticing.
  // itemModel and passageFlag are already in the 39 above; listing them again here made the
  // manifest emit two rows for one field. Only the keys the 39 does NOT name belong in this list.
  { path: 'r4Note', coworkCount: 1, weight: 'normal',
    note: 'Why this item’s stem was rebuilt under R4. The rule is in the register; this application of it is not.' },
  { path: 'importDoorFix', coworkCount: 4, weight: 'high',
    note: 'A citation error and its repair, carrying the prior text.' },
  { path: 'stemRedraft', coworkCount: 5, weight: 'high',
    note: 'why CROSSES by ruling; before is preserved because 2 of 5 exist in no other artefact at all.' },
  { path: 'draftingMethod', coworkCount: 251, weight: 'high',
    note: 'RENAMED from draftingOrder, and the old name was a live defect: all 251 values are method-label strings and agree with orderAnchor on 0 of 251.' },
] as const;

export const MODELLED_PATHS: ReadonlySet<string> = new Set(MODELLED_FIELDS.map((f) => f.path));
