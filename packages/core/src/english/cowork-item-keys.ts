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

export interface CoworkKeyRule {
  key: string;
  disposition: KeyDisposition;
  /** Where the value ends up. Required for MAPPED and CARRIED. */
  carriedAt?: string;
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
    { key: 'itemId', disposition: 'MAPPED', carriedAt: 'Item.id' },
    { key: 'questionTypeId', disposition: 'MAPPED', carriedAt: 'Item.questionTypeId' },
    { key: 'difficultyTier', disposition: 'MAPPED', carriedAt: 'Item.difficultyTier' },
    { key: 'stem', disposition: 'MAPPED', carriedAt: 'Item.stem' },
    { key: 'explanation', disposition: 'MAPPED', carriedAt: 'Item.explanation' },
    { key: 'options', disposition: 'MAPPED', carriedAt: 'ItemOption rows' },
    {
      key: 'authoredBy',
      disposition: 'MAPPED',
      carriedAt: 'Item.authoredBy',
      // The importer used to hardcode 'ai-draft:cowork-okafor-v1' and ignore this field. It
      // happened to be the value in all 96 files, so a guess that matched hid the fact that a
      // provenance column was being written from a literal rather than from the source.
    },
    {
      key: 'passageRef',
      disposition: 'CARRIED',
      carriedAt: 'stem.passageRef — item level on Cowork; the manifest reports the difference',
    },
    {
      key: 'lineRefs',
      disposition: 'CARRIED',
      carriedAt: 'stem.lineRefs — RULED item level; migration is queued and measured by the manifest',
    },
    { key: 'orderAnchor', disposition: 'CARRIED', carriedAt: 'stem.orderAnchor' },
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
      carriedAt: 'Item.draftSelfAssessment (+ draftSelfAssessmentHash, computed here)',
      // AUTHORING METADATA, not review. Both of Cowork's verdict values mean a human has not
      // looked. check:review-queries fences the column off from anything answering "has this
      // been reviewed"; the name alone is not the control.
    },
    { key: 'clusterPosition', disposition: 'MAPPED', carriedAt: 'Item.clusterPosition — serve order, file position' },
    { key: 'tierRationale', disposition: 'MAPPED', carriedAt: 'Item.tierRationale' },
    { key: 'sourcedFrom', disposition: 'MAPPED', carriedAt: 'Item.sourcedFrom' },
    { key: 'mechanismLedger', disposition: 'MAPPED', carriedAt: 'Item.mechanismLedger' },
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
    { key: 'text', disposition: 'MAPPED', carriedAt: 'stem.text' },
    { key: 'prompt', disposition: 'MAPPED', carriedAt: 'stem.prompt' },
    { key: 'quotes', disposition: 'MAPPED', carriedAt: 'stem.quotes' },
    { key: 'testedTokens', disposition: 'MAPPED', carriedAt: 'stem.testedTokens' },
    { key: 'techniqueKey', disposition: 'MAPPED', carriedAt: 'stem.techniqueKey' },
    { key: 'answerShape', disposition: 'MAPPED', carriedAt: 'stem.answerShape' },
    { key: 'segmentsInOptions', disposition: 'MAPPED', carriedAt: 'stem.segmentsInOptions' },
    { key: 'passageNames', disposition: 'MAPPED', carriedAt: 'stem.passageNames' },
  ],
  explanation: [
    { key: 'walkScript', disposition: 'MAPPED', carriedAt: 'explanation.walkScript' },
    { key: 'hintCore', disposition: 'MAPPED', carriedAt: 'explanation.hintCore' },
    { key: 'quotes', disposition: 'MAPPED', carriedAt: 'explanation.quotes' },
  ],
  'options[]': [
    { key: 'label', disposition: 'MAPPED', carriedAt: 'ItemOption.content.label' },
    { key: 'content', disposition: 'MAPPED', carriedAt: 'ItemOption.content.value' },
    { key: 'isCorrect', disposition: 'MAPPED', carriedAt: 'ItemOption.isCorrect' },
    { key: 'misconceptionId', disposition: 'MAPPED', carriedAt: 'ItemOption.misconceptionId' },
    {
      key: 'misconceptionExecution',
      disposition: 'MAPPED',
      carriedAt: 'ItemOption.misconceptionExecution',
      // The affordance test's output and the first thing a reviewer asks to see. Reviewer-facing,
      // never child-facing — distinct from the library's childHint, which the DB owns.
    },
    { key: 'tagStatus', disposition: 'MAPPED', carriedAt: 'ItemOption.tagStatus' },
    {
      key: 'senseTarget',
      disposition: 'MAPPED',
      carriedAt: 'ItemOption.senseTarget',
      // One of the 39, weighted critical. CHECK 10 holds an entire tag on it, and without it a
      // vocabulary item is unshippable while reading perfectly. Columned before ENG-013 arrives
      // rather than under the pressure of a blocked import (David, 2026-08-16).
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
export const CARRIED_PATHS: readonly { path: string; carriedAt: string }[] = (
  Object.entries(COWORK_ITEM_KEYS) as Array<[CoworkLevel, readonly CoworkKeyRule[]]>
).flatMap(([level, rules]) =>
  rules
    .filter((r) => r.disposition !== 'NOT_CARRIED')
    .map((r) => ({ path: level === 'item' ? r.key : `${level}.${r.key}`, carriedAt: r.carriedAt! })),
);
