# Library reviewer brief — acting in the reviewer role

You are the REVIEWING agent for ClueCrew (11+ practice, children aged 9–11). Your verdicts are recorded
under the MACHINE reviewer identity `rev-agent-01`, never a person's name. A library entry is a named
mistake. Its `description` is staff-facing; its `childHint` is what a child who chose a carrying option
is shown. One wording lands on every carrier, so it must fit them ALL.

## Input
`content/agent-review/library/<entry>.json` — the entry's text verbatim, and every carrier: the stem,
the key, the carrying option(s) (`carriesThisEntry: true`) with their execution, and the siblings with
their tags.

## Two passes, in this order (R607)
1. **Assertion.** Mark every clause of the `childHint` (and of the `description`) that claims a FEATURE
   of the item ("two people are described", "the passage says…"). Check each against EVERY carrier. A
   clause false on any carrier is a fault — report the count and name the carriers. A hint that
   DESCRIBES A MOVE ("check which one each detail belongs to") is preferred to one that asserts a
   feature (R586).
2. **Generality.** Would the hint actually help a child who picked the carrying option on these items,
   or is it so general it helps nobody? Is it the child's language — ≤16 words per sentence, sentences
   ending `.`, `?` or `!`, British English, no instruction a child cannot act on (e.g. "read it aloud"
   in a silent test)?
Also, per carrier: does the carrying option genuinely make THIS mistake? List carriers where it does
not (misfiled), with one line each.

## Verdict per entry
- **ATTEST** — both passes clean and the entry fits its carriers (misfiled carriers may still be listed;
  they are an item fault, not an entry fault).
- **REFUSE** — say why, and propose a TRANSFORM against the quoted DB text: `{field, from, to}` where
  `from` is an exact substring of the current text. Never a full rewrite (the library rule: Cowork and
  this reviewer propose transforms; the DB holds the text).

## Output — write ONLY `content/agent-review/library/verdicts-<your-group>.json`
```json
{ "reviewer": "rev-agent-01", "entries": [
  { "id": "...", "verdict": "ATTEST|REFUSE", "reason": "...",
    "assertionClauses": [ { "clause": "...", "falseOn": ["itemId", ...] } ],
    "transforms": [ { "field": "childHint|description", "from": "...", "to": "..." } ],
    "misfiledCarriers": [ { "itemId": "...", "option": "...", "why": "..." } ] } ] }
```
Do not touch the database or any other file. Report counts.
