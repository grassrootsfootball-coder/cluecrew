/**
 * ONE SPLITTER FOR A DISJUNCTIVE DESCRIPTION (R580/R584).
 *
 * Extracted the moment a second reader needed it. Two would disagree eventually — R429 — and this
 * one carries a refusal that a re-implementation would quietly drop: **comma-or, first sentence
 * only.** Allowing any ` or ` split *"the spelling or punctuation error"* (one noun phrase) and split
 * across sentences; two of three English findings were the splitter rather than the entry.
 */
export const STOP = new Set(
  ('a an the and or but of in on at to for from with is are was were be been being it its this that these'
  + ' those what which who whom how why when where do does did not no so as if then than you your he she'
  + ' they them his her their there here one two more most just also very can could would should will'
  + ' about into out up down over under again still had has have chooses choose picks pick child').split(' '),
);

export const contentWords = (s: string): string[] => [...new Set(
  s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)),
)];

/** The branches of a disjunctive description, or null when it states one case. */
export function branches(description: string): string[] | null {
  const firstSentence = description.split(/(?<=[.!?])\s+/)[0] ?? description;
  const commaOr = firstSentence.split(/,\s+or\s+/i);
  if (commaOr.length >= 2 && commaOr.every((b) => contentWords(b).length >= 2)) return commaOr;
  return null;
}
