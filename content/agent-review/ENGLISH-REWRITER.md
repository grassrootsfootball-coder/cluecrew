# English rewriter brief — repairing held comprehension rows (R1023)

You are the DRAFTING agent for ClueCrew's English comprehension items (11+, children aged 9–11 in
Britain). A machine reviewer HELD each row in your packet for a named fault. David has ruled (R1023)
that agents may now rewrite these rows. A separate agent acting in the reviewer role will check your
work independently against the passage and against the original hold; nothing lands unless it attests
your change, signs the whole row, and confirms the original fault is fixed. You are recorded as the
author: a machine, never a person.

## Input — `content/agent-review/english-rewrite/<G>/packet.json`
- `passages[ref].numberedLines` — the passage, verbatim. Cite lines by their `n`. Lines with `n: null`
  are not numbered and cannot be cited.
- `rows[]` — each held row as the database holds it now: `hold.reason` and `hold.faultField` (read the
  reason in full: it often names a second fault after "Also"), `stem`, `lineRefs` (item-level line
  references), `explanation` (`hintCore` is the hint a child sees, `walkScript` the worked explanation,
  `quotes` the declared quotations), and every option with `isKey`, `tag` and `execution`.
- `entries` — the ONLY library tags a distractor may carry, with each one's `description`, `childHint`
  (what a child is told when they pick it) and `approvalNote`.

## Task — one `rebuild` per row
1. **Fix every fault the hold reason names. Change nothing else.** Do not restyle a field the reason
   does not name. Cowork must merge every change you make by hand, so a needless change is a cost.
2. If the fault is in the question itself (key not the only answer, stem misquotes the passage) and a
   small repair cannot fix it, you may rewrite the question on the SAME passage, SAME `questionType`
   and SAME difficulty tier. Say so in `why`.
3. If no honest repair exists, put the row in `cannotFix` with the reason. It stays held. That is a
   legitimate outcome and better than a fitted repair.
4. A row with `passageRefMissing: true` must get `stem.passageRef` set to the row's `passageRef`. It
   must also get line references in the stem text and in `lineRefs` if it has none, and executions on
   every distractor if they are null.

## Hard rules
- **The key is the ONLY defensible answer** under every reasonable reading of the passage. Test every
  distractor against the text. A distractor the text supports is a second key.
- **Every distractor is wrong in the way its tag names.** The tag is the mistake a real child makes
  that produces exactly this option. If the tag does not fit, change the tag, the option, or both.
- **Executions** (staff-facing, never shown to a child): 1–3 sentences on how the mistake produces this
  option. Every line number and every quoted word must be right; check each one against
  `numberedLines`. Do not add boilerplate such as "In the window, line N answers the stem" unless it
  is true and useful.
- **hintCore must not coach (R572).** It must not quote or paraphrase the key's words, offer a choice
  whose one half is the key, or ask the child to define the exact phrase whose definition is the key.
  It should describe a MOVE ("Find where he gives his reason") rather than assert a feature of the item.
- **walkScript must be accurate** to the passage, including every line number and every quotation.
- **Quotations (R23):** any passage words you put in quotation marks in the stem, hint or walk script
  must appear verbatim in the passage, and must be declared in `explanation.quotes` as
  `{ "rule": "quoted-from-passage", "text": "<exact words>", "passageRef": "<ref>" }`. Remove a
  declaration whose quotation you remove.
- **Child-facing text** (stem, options, hintCore, walkScript): British English. Every sentence has at
  most 16 words and ends with `.`, `?` or `!`. A dash does not end a sentence; split the sentence
  instead. Words a 9–11-year-old knows; nothing unsuitable.
- **Line references:** if you change which lines the question is about, update both the stem text and
  `lineRefs`.

## Output — write ONLY `content/agent-review/english-rewrite/<G>/proposals.json`
```json
{ "door": "english-rewrite/<G>", "proposer": "agent",
  "rebuilds": [ { "itemId": "...", "why": "the fault, and what you changed to fix it",
      "stem": { ...the WHOLE stem object, every key, including passageRef... },
      "options": [ { "optionId": "...", "value": "...", "isKey": false, "tag": "en-...", "execution": "..." },
                   { "optionId": "...", "value": "...", "isKey": true, "tag": null, "execution": null } ],
      "explanationPatch": { "hintCore": "...", "walkScript": "...", "quotes": [ ... ] },
      "lineRefs": [ 9, 10, 11, 12 ] } ],
  "cannotFix": [ { "itemId": "...", "why": "..." } ] }
```
- `options`: ALL of the row's options, with the SAME `optionId`s, exactly one key.
- `explanationPatch`: only the explanation keys you changed. It is merged into the stored explanation,
  so keys you leave out are kept as they are.
- `lineRefs`: include only if you changed it.
Every row in your packet appears exactly once, in `rebuilds` or in `cannotFix`.

## Self-check — required
From `packages/db`, run:
`pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-proposals.ts --door=english-rewrite/<G> --precheck`
Fix every failure and re-run until it reports 0 fail. It checks one key, distinct options, tags from
the offered entries, executions present, the child-facing gate (vocabulary, reading age, sentence
length, quotation declarations, notation) and that `passageRef` is present. It does NOT check that your
key is right, that your tags name the mistakes, or that your line numbers are true. That is your job.

Do not touch the database or any file other than your `proposals.json`. Finish by reporting how many
rows you rebuilt, how many are in `cannotFix`, and the final precheck line.

## Round 2 and later — `content/agent-review/english-rewrite/r<N>/<G>/`
Each row also carries `previousRound`: the last round's `proposal` for it (or its `cannotFix`), the
reviewer's verdict on that change (`reviewOfChange`) and on the whole row (`reviewOfRow`). The row in
the packet is still the STORED row; the last proposal did not land.
- Start from the previous proposal, not from scratch. Fix every fault the reviewer named in
  `reviewOfChange` and `reviewOfRow`, keep what the reviewer accepted, and the original `hold` must
  stay fixed.
- **If the reviewer refused a change as undisclosed or unrequested rewording, revert that wording**
  to the stored value. Every word you change must be listed in `why`.
- **The stock sentence "In the window, line N answers the stem: '…'"** appears in many stored
  executions and is often false: the quoted words do not answer the question, or sit on another
  line. On every row you rebuild, check each execution that contains it. Remove it, or correct it
  so the line and the words are exactly right and really answer the stem.
- A reviewer may hold a row for a fault in a field the original hold did not name. You may fix
  that field too. That is a fault now named by the review.
- Write `proposals.json` in the `r<N>/<G>/` folder and run the precheck with
  `--door=english-rewrite/r<N>/<G>`.
