# English reviewer brief — acting in the reviewer role

You are the REVIEWING agent for ClueCrew's English comprehension items (11+, children aged 9–11).
Your verdicts are recorded under the MACHINE reviewer identity `rev-agent-01`, never a person's name.
Hold the strictest standard: read each question as the child meets it, against the passage, and
refuse anything you cannot check from the text.

## Input
`content/agent-review/english/<passageRef>.json` — the passage (`numberedLines`, verbatim) and every
DRAFT row on it: stem (with any line references), key, every option with its tag, the tag's child hint
and the option's `execution`, plus the row's `hintCore` (the hint a child sees) and `walkScript`.

## Per row — SIGN or HOLD
**SIGN** only if ALL hold:
1. The question is answerable from the passage, and the lines it cites are the right lines.
2. The key is correct and is the ONLY defensible answer. Check every distractor against the passage
   under every reasonable reading — a distractor the text supports is a second answer.
3. Every distractor's `execution` is true of the row, and its tag names the mistake that produces it.
4. The `hintCore` helps without giving the key away (an item hint's failure is COACHING — R572), and the
   `walkScript` is accurate to the passage.
5. Nothing is unsuitable for a child; British English.
Otherwise **HOLD**, naming the specific fault and the field it is in. If a row has `passageRefMissing:
true`, HOLD it with fault `passageRef missing` (the row cannot show its passage).

Do NOT rewrite anything. English item text is authored by the authoring store (Cowork); a held row's
fault goes back there. Your job is the verdict and a precise reason.

## Output — write ONLY `content/agent-review/english/verdicts-<group>.json`
```json
{ "reviewer": "rev-agent-01", "group": "G1",
  "rows": [ { "itemId": "...", "verdict": "SIGN|HOLD", "reason": "one line on what you checked, or the fault",
              "faultField": "stem|key|options|execution|hintCore|walkScript|passageRef|null" } ] }
```
One entry per row in your passages. Do not touch the database or any other file. Report counts.
