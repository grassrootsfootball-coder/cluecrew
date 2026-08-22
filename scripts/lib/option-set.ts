/**
 * THE SET IS THREE PARTS, NOT TWO: THE KEY, ITS SIBLINGS, AND THEIR TAGS (Annie, 2026-08-22 — R573).
 *
 * **"Send the option set" hides the third part, and the next thing built to satisfy that phrase will
 * build what the phrase says.** So the parts are named on the face of every artefact that carries
 * them, and this is the one function that assembles them.
 *
 * **HER INSTANCE, AND IT IS DECISIVE.** `ENG-001-WIW-10` asks what the Mole's treatment of the
 * rabbits shows about him. The hint is *"Find the two words the writer uses to describe the Mole in
 * this bit."* Two words, two readings, and **no reason to prefer either** — until the tags are
 * present:
 *
 *     "He is frightened of the older rabbit."          en-emotion-label-approximation
 *     "He is so excited that he will not stop…"        KEY
 *     "He is a cruel animal who is always unkind."     en-extreme-option-pull   <- the one
 *     "He is rushing home to get his dinner."          en-motive-invention
 *     "He is sorry at once for knocking the rabbit…"   en-plausible-not-stated
 *
 * **Option C carries the extreme where every sibling carries something milder**, which is what
 * identifies it as the likely wrong answer. The tags are not metadata about the set; they are the
 * half of it that answers her question.
 *
 * **AND THE TAG'S OWN HINT TRAVELS WITH IT** where the caller supplies the library. A tag id is a
 * name; the wording a child would actually receive is the value (R25).
 */

export interface TaggedOption {
  value: string;
  label: string | null;
  /** The misconception this option carries. Null on the key, and null on an untagged distractor. */
  tag: string | null;
  /** That tag's child-facing wording, when the caller passes a library. Null when it does not. */
  tagChildHint: string | null;
}

export interface ThreePartSet {
  /** Stated on the artefact so the next reader does not have to infer the shape from the fields. */
  theThreeParts: string;
  key: { value: string; label: string | null } | null;
  siblings: TaggedOption[];
  /** The distinct tags in play, with their wordings — the comparison her WIW-10 reading turns on. */
  theirTags: Array<{ tag: string; childHint: string | null; onSiblings: number }>;
  /** Present and false is a finding: an item with no key, or more than one. */
  exactlyOneKey: boolean;
}

interface RawOption {
  content: unknown;
  isCorrect: boolean;
  misconceptionId?: string | null;
}

const valueOf = (content: unknown): string => {
  const c = (content ?? {}) as { value?: unknown };
  return typeof c.value === 'string' ? c.value : JSON.stringify(c.value ?? null);
};
const labelOf = (content: unknown): string | null => {
  const c = (content ?? {}) as { label?: unknown };
  return typeof c.label === 'string' ? c.label : null;
};

/**
 * Build the three parts from an item's raw options.
 *
 * `library` maps a misconception id to its child-facing hint. Omit it and `tagChildHint` is null
 * everywhere — which is honest, and different from a tag having no hint.
 */
export function threePartSet(
  options: readonly RawOption[],
  library?: ReadonlyMap<string, string | null>,
): ThreePartSet {
  const keys = options.filter((o) => o.isCorrect);
  const siblings = options
    .filter((o) => !o.isCorrect)
    .map((o) => ({
      value: valueOf(o.content),
      label: labelOf(o.content),
      tag: o.misconceptionId ?? null,
      tagChildHint: o.misconceptionId ? (library?.get(o.misconceptionId) ?? null) : null,
    }));

  const counts = new Map<string, number>();
  for (const s of siblings) if (s.tag) counts.set(s.tag, (counts.get(s.tag) ?? 0) + 1);

  return {
    theThreeParts: 'the KEY, its SIBLINGS, and THEIR TAGS. Named rather than abbreviated to "the '
      + 'option set", because that phrase hides the third part and the tags are what identify a '
      + 'likely wrong answer (Annie, R573 — see ENG-001-WIW-10).',
    key: keys[0] ? { value: valueOf(keys[0].content), label: labelOf(keys[0].content) } : null,
    siblings,
    theirTags: [...counts]
      .map(([tag, onSiblings]) => ({ tag, childHint: library?.get(tag) ?? null, onSiblings }))
      .sort((a, b) => b.onSiblings - a.onSiblings || a.tag.localeCompare(b.tag)),
    exactlyOneKey: keys.length === 1,
  };
}

/** Every misconception id an item's options carry — for building the library map in one query. */
export const tagsIn = (options: readonly RawOption[]): string[] =>
  options.map((o) => o.misconceptionId).filter((m): m is string => typeof m === 'string');
