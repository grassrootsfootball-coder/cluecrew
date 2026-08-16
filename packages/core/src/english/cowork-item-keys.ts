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
 * NOT_CARRIED IS A DECISION WITH A REASON, NOT A SHRUG. Each one states why, and the importer
 * prints the substantive ones as declared losses so they stay visible for a ruling instead of
 * decaying into "the importer has always done that".
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
   * A NOT_CARRIED key holding real authored content, as opposed to drafting scaffolding.
   * Printed as a declared loss on every run so it stays a live question.
   */
  substantiveLoss?: boolean;
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
      reason:
        'MODELLED per-option as ItemOption.misconceptionId. Verified against the data, not the ' +
        'shape: on 96 of 96 items this array equals the set of option misconceptionIds exactly, ' +
        'so it is the same fact and not a superset.',
    },
    {
      key: 'tierRationale',
      disposition: 'NOT_CARRIED',
      reason: 'PROVENANCE class. No column holds it and carriage of provenance is unruled.',
      substantiveLoss: true,
    },
    {
      key: 'sourcedFrom',
      disposition: 'NOT_CARRIED',
      reason: 'PROVENANCE class. No column holds it and carriage of provenance is unruled.',
      substantiveLoss: true,
    },
    {
      key: 'mechanismLedger',
      disposition: 'NOT_CARRIED',
      reason:
        'Per-mechanism EVIDENCE, on 60 items — the authoring pass’s reasoning for each ' +
        'distractor. Substantive, unruled, and no column holds it.',
      substantiveLoss: true,
    },
    { key: 'notes', disposition: 'NOT_CARRIED', reason: 'Drafting scratch; non-empty on 16 items.' },
    { key: 'draftingOrder', disposition: 'NOT_CARRIED', reason: 'Ordering scaffolding internal to the drafting pass.' },
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
      disposition: 'NOT_CARRIED',
      reason:
        'How THIS distractor executes its misconception, on 282 options. Distinct from the ' +
        'library’s childHint, which the DB owns; this is per-option and unruled.',
      substantiveLoss: true,
    },
    {
      key: '_previousMisconceptionId',
      disposition: 'NOT_CARRIED',
      reason: 'Drafting history of a retag, on 26 options. Underscore-prefixed by Cowork.',
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

/** The NOT_CARRIED keys holding real authored content — printed on every run, never inferred. */
export const DECLARED_LOSSES: readonly (CoworkKeyRule & { level: CoworkLevel })[] = (
  Object.entries(COWORK_ITEM_KEYS) as Array<[CoworkLevel, readonly CoworkKeyRule[]]>
).flatMap(([level, rules]) => rules.filter((r) => r.substantiveLoss).map((r) => ({ ...r, level })));
