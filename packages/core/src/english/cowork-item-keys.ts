/**
 * EVERY KEY COWORK'S ITEM SHAPE CARRIES, AND WHAT THIS SIDE DOES WITH IT.
 *
 * An import door VALIDATES a stem; it never FILTERS one (R57). The cluster importer did filter:
 * it declared an interface of six fields and wrote five, so ten item-level keys — `lineRefs`,
 * `orderAnchor`, `passageRef`, `mechanismLedger` among them — went in one side of the door and
 * came out of neither. Nothing reported it. That is R57's finding a fifth time.
 *
 * THE FIX IS NOT A LONGER LIST, IT IS A REFUSAL. Every key is named here with a DISPOSITION, and
 * a key that is not named STOPS THE IMPORT. A field Cowork adds next month must stop the pipeline
 * rather than vanish from it (David, 2026-08-13) — an allowlist that drops what it cannot name is
 * a gate that fails OPEN and reports success.
 *
 * THE CARRIAGE RULE (David, 2026-08-16, revising his own earlier ruling): EVERYTHING COWORK HOLDS
 * CROSSES, EXCEPT WHERE A REASON CAN BE NAMED FOR WHY IT SHOULD NOT. He had scoped carriage to the
 * 39 DECLARATIVE fields; Cowork's PROVENANCE classification was correct on its own terms and the
 * line was drawn in the wrong place, because provenance is what the platform's claim rests on.
 *
 * So NOT_CARRIED is the exceptional case and it must justify itself. Each one names its reason and
 * carries a RULING — `RULED` where David has decided, `PROPOSED` where this side is proposing the
 * exception and has not been ruled on. The importer prints the PROPOSED ones on every run: the
 * list to bring him is the EXCEPTIONS, never the inclusions.
 *
 * ONE REGISTRY, BOTH DOORS. Two doors that enumerate separately WILL drift — R42's finding, which
 * recurred in R55 where the CMS door passed a stem through while the script door stripped it.
 */

export type KeyDisposition =
  /** Written to a column or relation of its own. */
  | 'MAPPED'
  /** Stored, but not in a column of its own — `carriedAt` says where it actually lands. */
  | 'CARRIED'
  /** Deliberately not stored. `reason` is required and is the whole content of the decision. */
  | 'NOT_CARRIED';

/**
 * WHERE A VALUE LANDS — STRUCTURED, NOT PROSE (David's ruling, 2026-08-17).
 *
 * `carriedAt` was a free-text string, and that is why two stale destinations were invisible:
 * `Item.testedTokens` named a column that had been DROPPED, and `lineRefs` named `stem.lineRefs`
 * after R77 moved it to `Item.lineRefs` — the door writing to the new place while the registry
 * still described the old one. **Neither could be seen by reading the registry**, which is the
 * finding: a destination that does not exist and a destination that moved look exactly like a
 * destination that is fine, when both are sentences.
 *
 * Structured, they become one check: **every destination must resolve against the live schema.**
 *
 * The JSON-path case is EXPRESSED rather than written into prose — `stem.text` is a path inside
 * `Item.stem`, not a column called `stem.text`, and a matcher over prose could not tell those
 * apart. That was the third instance of the same fault, one layer up: my own join query reported
 * three false positives because it matched strings, two of which carried trailing commentary and
 * two of which were paths.
 */
export type Destination =
  /** A column of its own. `Item.draftingMethod`. */
  | { kind: 'column'; table: DestTable; column: string; note?: string }
  /** A path inside a JSON column. `Item.stem` → `text`. */
  | { kind: 'json'; table: DestTable; column: string; path: string; note?: string }
  /** A relation rather than a column on this row. `ItemOption` rows hanging off the item. */
  | { kind: 'relation'; table: DestTable; note?: string };

export type DestTable = 'Item' | 'ItemOption';

export const col = (table: DestTable, column: string, note?: string): Destination =>
  ({ kind: 'column', table, column, ...(note ? { note } : {}) });
export const json = (table: DestTable, column: string, path: string, note?: string): Destination =>
  ({ kind: 'json', table, column, path, ...(note ? { note } : {}) });
export const relation = (table: DestTable, note?: string): Destination =>
  ({ kind: 'relation', table, ...(note ? { note } : {}) });

/** Human-readable, for reports. Derived FROM the structure, never the source of it. */
export function destinationLabel(d: Destination): string {
  const base = d.kind === 'json' ? `${d.table}.${d.column}.${d.path}`
    : d.kind === 'relation' ? `${d.table} rows`
      : `${d.table}.${d.column}`;
  return d.note ? `${base} — ${d.note}` : base;
}

export interface CoworkKeyRule {
  key: string;
  disposition: KeyDisposition;
  /** Where the value ends up. Required for MAPPED and CARRIED. */
  carriedAt?: Destination;
  /** Why it is not stored. Required for NOT_CARRIED. */
  reason?: string;
  /**
   * Required on NOT_CARRIED. `RULED` — David has decided this field does not cross. `PROPOSED` —
   * this side proposes the exception on the stated reason and awaits a ruling. `MODELLED` — not a
   * judgement at all: the fact is held here in another shape, verified against the data.
   */
  ruling?: 'RULED' | 'PROPOSED' | 'MODELLED';
}

export type CoworkLevel = 'item' | 'stem' | 'explanation' | 'options[]';

export const COWORK_ITEM_KEYS: Readonly<Record<CoworkLevel, readonly CoworkKeyRule[]>> = {
  item: [
    { key: 'itemId', disposition: 'MAPPED', carriedAt: col('Item', 'id') },
    { key: 'questionTypeId', disposition: 'MAPPED', carriedAt: col('Item', 'questionTypeId') },
    { key: 'difficultyTier', disposition: 'MAPPED', carriedAt: col('Item', 'difficultyTier') },
    { key: 'stem', disposition: 'MAPPED', carriedAt: col('Item', 'stem') },
    { key: 'explanation', disposition: 'MAPPED', carriedAt: col('Item', 'explanation') },
    { key: 'options', disposition: 'MAPPED', carriedAt: relation('ItemOption') },
    {
      key: 'authoredBy',
      disposition: 'MAPPED',
      carriedAt: col('Item', 'authoredBy'),
      // The importer used to hardcode 'ai-draft:cowork-okafor-v1' and ignore this field. It
      // happened to be the value in all 96 files, so a guess that matched hid the fact that a
      // provenance column was being written from a literal rather than from the source.
    },
    {
      key: 'passageRef',
      disposition: 'CARRIED',
      carriedAt: json('Item', 'stem', 'passageRef', 'item level on Cowork; the manifest reports the difference'),
    },
    {
      key: 'lineRefs',
      /**
       * CORRECTED 2026-08-17 (David's ruling). This named `stem.lineRefs` and said the migration was
       * "queued" — **R77 moved it to `Item.lineRefs` and the import door has written there since.**
       * The registry described the pre-migration destination while the door used the new one, and
       * nothing connected the two, so it read as current for as long as it was prose.
       *
       * Corrected openly rather than quietly: a declaration changed in silence is what the registry
       * exists to prevent.
       */
      disposition: 'MAPPED',
      carriedAt: col('Item', 'lineRefs', 'R77 moved this off the stem; the door writes here'),
    },
    { key: 'orderAnchor', disposition: 'CARRIED', carriedAt: json('Item', 'stem', 'orderAnchor') },
    {
      key: 'misconceptions',
      disposition: 'NOT_CARRIED',
      ruling: 'MODELLED',
      reason:
        'MODELLED per-option as ItemOption.misconceptionId. Verified against the data, not the ' +
        'shape: on 96 of 96 items this array equals the set of option misconceptionIds exactly, ' +
        'so it is the same fact and not a superset.',
    },
    {
      key: 'preReview',
      disposition: 'MAPPED',
      carriedAt: col('Item', 'draftSelfAssessment', '+ draftSelfAssessmentHash, computed here'),
      // AUTHORING METADATA, not review. Both of Cowork's verdict values mean a human has not
      // looked. check:review-queries fences the column off from anything answering "has this
      // been reviewed"; the name alone is not the control.
    },
    { key: 'clusterPosition', disposition: 'MAPPED', carriedAt: col('Item', 'clusterPosition', 'serve order, file position') },
    {
      /** Names the item this one corrects (second return, 2026-08-19: SP-06). Provenance a reader
       * of the ROW should meet, so it rides the stem rather than living only in a receipt. */
      key: 'correctionOf',
      disposition: 'CARRIED',
      carriedAt: json('Item', 'stem', 'correctionOf', 'second-return provenance; arrived 2026-08-19'),
    },
    {
      /**
       * ITEM-LEVEL on Cowork since its gapRef->gapIndex migration; STEM-LEVEL here by Annie's
       * field-geometry ruling applied 2026-08-19 (R209): a gap index is not a line reference,
       * `lineRefs` empty on cloze, the gap number lives at stem.gapIndex. The door NORMALISES the
       * level and never the value (R57's boundary: validate and place, don't rewrite).
       */
      key: 'gapIndex',
      disposition: 'CARRIED',
      carriedAt: json('Item', 'stem', 'gapIndex', 'item level on Cowork; stem level here, ruled 2026-08-19'),
    },
    {
      /** Cowork's marker that the gap number was migrated out of lineRefs (16 cloze items).
       * Migration shadow: both sides applied the ruled geometry independently and each records its
       * own act (here: R209 + write-log rows). Carrying the other side's marker would be a second
       * copy of a fact this store already holds. */
      key: '_migratedFromLineRefs',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Migration shadow; this store records its own migration as R209 + write-log rows.',
    },
    // Cowork now sends the POST-RENAME names (R79). `draftingOrder` above stays for the older
    // deliveries; both land on the same column.
    { key: 'draftingMethod', disposition: 'MAPPED', carriedAt: col('Item', 'draftingMethod') },
    { key: 'itemModel', disposition: 'MAPPED', carriedAt: col('Item', 'itemModel') },
    // Carried by the backfill since 2026-08-16; the IMPORT door never named them, so a re-emission
    // that includes them was refused. Same columns, now reachable from both routes.
    { key: 'banListException', disposition: 'MAPPED', carriedAt: col('Item', 'banListException') },
    { key: 'banListExceptionResolved', disposition: 'MAPPED', carriedAt: col('Item', 'banListExceptionResolved') },
    { key: 'passageFlag', disposition: 'MAPPED', carriedAt: col('Item', 'passageFlag') },
    { key: 'r4Note', disposition: 'MAPPED', carriedAt: col('Item', 'r4Note') },
    { key: 'stemRedraft', disposition: 'MAPPED', carriedAt: col('Item', 'stemRedraft') },
    {
      key: 'testedTokens',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason:
        'ITEM-LEVEL ONLY. `Item.testedTokens` was DROPPED under R159 — 13 items carried it and '
        + 'NOTHING read it, because `checkItemChildFacing` reads `stem.testedTokens`. So the '
        + 'destination no longer exists and this key has nowhere to land. **The STEM-level '
        + '`stem.testedTokens` still crosses and is still read**; only the item-level duplicate is '
        + 'affected. Proposed as an exception rather than silently dropped: the field is a real '
        + 'declaration on Cowork\'s side and the ruling that removed its column here was about a '
        + 'dead reader, not about the field being unwanted. If item-level tokens should carry, the '
        + 'column comes back and this reverts.',
    },
    { key: 'importDoorFix', disposition: 'MAPPED', carriedAt: col('Item', 'importDoorFix') },
    { key: 'draftSelfAssessment', disposition: 'MAPPED', carriedAt: col('Item', 'draftSelfAssessment') },
    {
      key: 'banListException_SHAPE_NOTE',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'A note about the SHAPE of banListException, not a fact about the item.',
    },
    { key: 'tierRationale', disposition: 'MAPPED', carriedAt: col('Item', 'tierRationale') },
    { key: 'sourcedFrom', disposition: 'MAPPED', carriedAt: col('Item', 'sourcedFrom') },
    { key: 'mechanismLedger', disposition: 'MAPPED', carriedAt: col('Item', 'mechanismLedger') },
    {
      key: 'draftingMethod_SHAPE_NOTE',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'A note about the SHAPE of draftingMethod, not a fact about the item.',
    },
    {
      key: '_previousMisconceptionsArray',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The tag list a retag replaced, on 1 item. Underscore-prefixed by Cowork; the current '
        + 'tags are the claim and the supersession belongs in an attribution event.',
    },
    {
      key: '_previousLineRefs',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The citation window a reviewer ruling replaced, on 1 item (WIW-12, [29] -> 29-33). '
        + 'Same class as the other _previous shadows: the CURRENT window is the claim and the '
        + 'supersession belongs in an attribution event.',
    },
    {
      key: '_previousOrderAnchor',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Drafting history of a re-anchor, on 1 item. Underscore-prefixed by Cowork; the '
        + 'current anchor is the claim and the supersession belongs in an attribution event.',
    },
    {
      key: 'notes',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason:
        'Drafting scratch, non-empty on 16 items. Proposed as an exception because it is the ' +
        'authoring pass talking to itself, not a claim about the item. If any of the 16 turn out ' +
        'to carry a judgement, this is wrong and the field crosses.',
    },
    {
      key: 'draftingOrder',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason:
        'The order the drafting pass wrote items in, on 60. Distinct from orderAnchor, which is ' +
        'the item’s position in the cluster and DOES cross. This one describes the pass, not the item.',
    },
  ],
  stem: [
    { key: 'text', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'text') },
    { key: 'prompt', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'prompt') },
    { key: 'quotes', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'quotes') },
    {
      /** The pre-repair stem text, second return (26 items). Retag-history class: the history
       * lives in Cowork's store; shadow fields do not cross (the _previousMisconceptionId
       * precedent, R105 sweep). */
      key: '_previousText',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Shadow history of the 2026-08-19 stem repairs ("has" -> "may have" et al). The '
        + 'repair history lives in Cowork\'s store; this side holds the CURRENT text and the '
        + 'batch file itself remains on disk as the witness.',
    },
    {
      key: '_previousText2',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Second-generation shadow of the same class as _previousText, on 3 cloze items.',
    },
    {
      key: '_previousQuotes',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The declared quotation spans a repair replaced, on 4 items (the mis-declared spans '
        + 'that failed the child-facing gate). Same class as every other _previous shadow: the '
        + 'current declaration is the claim and the supersession belongs in an attribution event.',
    },
    { key: 'testedTokens', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'testedTokens') },
    { key: 'techniqueKey', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'techniqueKey') },
    { key: 'answerShape', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'answerShape') },
    { key: 'segmentsInOptions', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'segmentsInOptions') },
    { key: 'passageNames', disposition: 'MAPPED', carriedAt: json('Item', 'stem', 'passageNames') },
  ],
  explanation: [
    { key: 'walkScript', disposition: 'MAPPED', carriedAt: json('Item', 'explanation', 'walkScript') },
    {
      /**
       * WHO WROTE THE HINT, WITH ITS AUTHORITY BESIDE IT — the pair arrives together (second
       * return, 7 items) and is carried together: hintAuthoredBy is a NAME, hintAuthority is the
       * artefact+hash that makes the name checkable. A name that crossed without its authority
       * would be the bare-name fault (R203) imported fresh.
       */
      key: '_previousHintCore',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Shadow of the repaired hint text (4 items). Repair history lives in Cowork\'s '
        + 'store; the batch file on disk is the witness.',
    },
    {
      key: '_previousHintCore2',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'Second-generation shadow of the same class, 7 items.',
    },
    {
      key: 'hintAuthoredBy',
      disposition: 'CARRIED',
      carriedAt: json('Item', 'explanation', 'hintAuthoredBy', 'paired with hintAuthority below'),
    },
    {
      key: 'hintAuthority',
      disposition: 'CARRIED',
      carriedAt: json('Item', 'explanation', 'hintAuthority', 'the artefact+sha256 behind hintAuthoredBy'),
    },
    {
      key: '_previousWalkScript',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The walk script a redraft replaced. Underscore-prefixed by Cowork; the current script '
        + 'is the claim and the supersession belongs in an attribution event.',
    },
    { key: 'hintCore', disposition: 'MAPPED', carriedAt: json('Item', 'explanation', 'hintCore') },
    { key: 'quotes', disposition: 'MAPPED', carriedAt: json('Item', 'explanation', 'quotes') },
  ],
  'options[]': [
    { key: 'label', disposition: 'MAPPED', carriedAt: json('ItemOption', 'content', 'label') },
    { key: 'content', disposition: 'MAPPED', carriedAt: json('ItemOption', 'content', 'value') },
    { key: 'isCorrect', disposition: 'MAPPED', carriedAt: col('ItemOption', 'isCorrect') },
    { key: 'misconceptionId', disposition: 'MAPPED', carriedAt: col('ItemOption', 'misconceptionId') },
    {
      /**
       * A SECOND live tag per option (second return, 12 options). No column holds it and a second
       * tag is a SCHEMA decision, not an import-door improvisation — the platform's option model
       * is deliberately one-diagnosis-per-option, and widening that silently at the door would be
       * a model change nobody ruled. PROPOSED to David; the batch file on disk is the witness and
       * the door prints this exception on every run, so the gap cannot decay into silence.
       */
      key: 'secondaryMisconceptionId',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'No column; one-diagnosis-per-option is the ruled option model. A second tag needs '
        + 'a schema ruling, not a door improvisation. Witness: the second-return batch file.',
    },
    {
      key: 'misconceptionExecution',
      disposition: 'MAPPED',
      carriedAt: col('ItemOption', 'misconceptionExecution'),
      // The affordance test's output and the first thing a reviewer asks to see. Reviewer-facing,
      // never child-facing — distinct from the library's childHint, which the DB owns.
    },
    { key: 'tagStatus', disposition: 'MAPPED', carriedAt: col('ItemOption', 'tagStatus') },
    {
      key: 'tagStatus_SHAPE_UNRESOLVED',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'A note that the tagStatus shape is unresolved, not a fact about the option.',
    },
    { key: 'value', disposition: 'MAPPED', carriedAt: json('ItemOption', 'content', 'value') },
    { key: 'attractorLine', disposition: 'MAPPED', carriedAt: col('ItemOption', 'attractorLine') },
    { key: 'defeaterLine', disposition: 'MAPPED', carriedAt: col('ItemOption', 'defeaterLine') },
    { key: 'attractorQuote', disposition: 'MAPPED', carriedAt: col('ItemOption', 'attractorQuote') },
    { key: 'defeaterQuote', disposition: 'MAPPED', carriedAt: col('ItemOption', 'defeaterQuote') },
    { key: 'windowClass', disposition: 'MAPPED', carriedAt: col('ItemOption', 'windowClass') },
    { key: 'a36Note', disposition: 'MAPPED', carriedAt: col('ItemOption', 'a36Note') },
    { key: 'defeatedByAbsence', disposition: 'MAPPED', carriedAt: col('ItemOption', 'defeatedByAbsence') },
    {
      key: 'senseTarget',
      disposition: 'MAPPED',
      carriedAt: col('ItemOption', 'senseTarget'),
      // One of the 39, weighted critical. CHECK 10 holds an entire tag on it, and without it a
      // vocabulary item is unshippable while reading perfectly. Columned before ENG-013 arrives
      // rather than under the pressure of a blocked import (David, 2026-08-16).
    },
    {
      key: '_previousValue',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The option TEXT a reviewer ruling replaced, on 2 options (WIW-12 B, WIW-16 A). The '
        + 'current text is the claim. Weightier than the other shadows — this one is child-facing '
        + 'and is what the reviewer actually struck — so it is named for a ruling, not assumed.',
    },
    {
      key: '_previousExecution',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The execution note that went with the replaced option text, on 2 options. Reviewer-'
        + 'facing, superseded by the note now on the option.',
    },
    {
      key: '_previousAttractorLine',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The Addendum 36 attractor line a replacement re-measured, on 1 option (WIW-16 A, '
        + '52 -> null under the CONTENT NOWHERE ruling). The current measurement is the claim.',
    },
    {
      key: '_previousWindowClass',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason: 'The Addendum 36 window class a replacement re-measured, on 1 option (WIW-16 A, '
        + 'ENTRAPMENT -> NOISE). The current measurement is the claim.',
    },
    {
      key: '_previousMisconceptionId',
      disposition: 'NOT_CARRIED',
      ruling: 'PROPOSED',
      reason:
        'The tag a retag replaced, on 26 options. Proposed as an exception because the CURRENT ' +
        'tag is the claim and the supersession belongs in an attribution event, not a shadow ' +
        'column. Cowork marks it internal with an underscore.',
    },
  ],
} as const;

export interface UnknownKey {
  itemId: string;
  level: CoworkLevel;
  key: string;
}

const RULES: Record<CoworkLevel, Map<string, CoworkKeyRule>> = {
  item: new Map(COWORK_ITEM_KEYS.item.map((r) => [r.key, r])),
  stem: new Map(COWORK_ITEM_KEYS.stem.map((r) => [r.key, r])),
  explanation: new Map(COWORK_ITEM_KEYS.explanation.map((r) => [r.key, r])),
  'options[]': new Map(COWORK_ITEM_KEYS['options[]'].map((r) => [r.key, r])),
};

export function ruleFor(level: CoworkLevel, key: string): CoworkKeyRule | undefined {
  return RULES[level].get(key);
}

/**
 * EVERY KEY THIS DRAFT CARRIES THAT THE REGISTRY DOES NOT NAME.
 *
 * Returned rather than thrown: the importer classifies before it writes, so an unknown key is one
 * more thing decided in the pre-flight, alongside the gate and tag holds. A non-empty result must
 * stop the whole run — not skip the item, which is how the dropped fields got here.
 */
export function unknownCoworkKeys(item: Record<string, unknown>): UnknownKey[] {
  const id = typeof item.itemId === 'string' ? item.itemId : '(no itemId)';
  const out: UnknownKey[] = [];
  const sweep = (level: CoworkLevel, obj: unknown): void => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const k of Object.keys(obj)) {
      if (!RULES[level].has(k)) out.push({ itemId: id, level, key: k });
    }
  };
  sweep('item', item);
  sweep('stem', item.stem);
  sweep('explanation', item.explanation);
  for (const o of Array.isArray(item.options) ? item.options : []) sweep('options[]', o);
  return out;
}

/**
 * THE EXCEPTIONS TO BRING HIM — every key proposed as not crossing, with its named reason.
 * Printed on every import run. The inclusions are not a list anyone needs to read; the exceptions
 * are the whole decision.
 */
export const PROPOSED_EXCEPTIONS: readonly (CoworkKeyRule & { level: CoworkLevel })[] = (
  Object.entries(COWORK_ITEM_KEYS) as Array<[CoworkLevel, readonly CoworkKeyRule[]]>
).flatMap(([level, rules]) => rules.filter((r) => r.ruling === 'PROPOSED').map((r) => ({ ...r, level })));

/** Every key that crosses, and where it lands. The guard reads this to know what to protect. */
export const CARRIED_PATHS: readonly { path: string; carriedAt: Destination }[] = (
  Object.entries(COWORK_ITEM_KEYS) as Array<[CoworkLevel, readonly CoworkKeyRule[]]>
).flatMap(([level, rules]) =>
  rules
    .filter((r) => r.disposition !== 'NOT_CARRIED')
    .map((r) => ({ path: level === 'item' ? r.key : `${level}.${r.key}`, carriedAt: r.carriedAt! })),
);
