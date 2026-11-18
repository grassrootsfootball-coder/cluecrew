# Proposer brief — new distractors and row repairs

You are the PROPOSING agent for ClueCrew, an 11+ practice platform for children aged 9–11. A separate
agent acting in the reviewer role will check everything you propose, independently, and nothing lands
unless it attests every change AND signs the whole row.

## Input (all in `content/agent-review/<door>/`)
- `packet.json` — every row: stem, key, options, tags, each tag's library `description`/`childHint`,
  house-form executions. NOTE: executions landed since the packet was written are in the database, not
  the packet; `held.json` lists only what is still open.
- `held.json` — `seatsHeld`: seats whose current value the tag does not produce (`needs: NEW DISTRACTOR`)
  or whose value is right but needs an execution (`needs: redraft`); `rowsHeld`: whole rows held, with
  the reviewer's fault.
- `verdicts.json` — the first reviewer's reasons. Read them: they say exactly what was wrong.
- Any extra defects named in your task message.

## Task
1. **Every `NEW DISTRACTOR` seat**: propose a new value that THE SEAT'S TAG GENUINELY PRODUCES on this
   row — the mistake a real 9–11-year-old makes — plus its execution (2–3 sentences, staff-facing, house
   form, every fact true of the row). Keep the tag. If no value of that tag can work on this row, you
   may instead use another tag from this door's entries and say so in the execution.
2. **Every `redraft` seat**: keep the value and tag, write the execution.
3. **Every held row and every named defect row**: propose a `rebuild` — a full new stem (same keys as
   the old stem object) and all options (SAME option ids, one key, every distractor tagged with an entry
   from this door and carrying an execution). Keep the row's question type and difficulty. Fix exactly
   the fault named; do not restyle.

## Hard rules
- The key must be the ONLY correct answer. No distractor may also be correct (check every reading).
- **Vary the distractors.** The old bank put the same offset in the same seat every time (key+1, key+5,
  next letter) — a child learns the pattern instead of the skill. No fixed offset, no fixed relation
  between a seat and the key; spread values above and below the key.
- Every word must be one a 9–11-year-old in Britain knows; no brand names, no proper names, nothing
  unsuitable — including words a distractor makes the child build in their head (vr-08: the words left
  and formed by moving the letter).
- British English. Sentences end with `.`, `?` or `!`; ≤16 words.

## Self-check — required
Run, from `packages/db`:
`pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-proposals.ts --door=<door> --precheck`
Fix every failure it reports and re-run until it reports 0 fail. It checks the key, uniqueness, child-
facing text, the tag predicates where one exists, and (vr-20) that no distractor spells a real word.
It does NOT check whether the tag's mistake really produces the value — that is your job.

## Output — write ONLY `content/agent-review/<door>/proposals.json`
```json
{ "door": "vr-17", "proposer": "agent",
  "seats":    [ { "optionId": "...", "itemId": "...", "oldValue": "8", "tag": "...", "newValue": "9", "execution": "..." } ],
  "redrafts": [ { "optionId": "...", "itemId": "...", "value": "...", "tag": "...", "execution": "..." } ],
  "rebuilds": [ { "itemId": "...", "why": "...", "stem": { ... }, "options": [ { "optionId": "...", "value": "...", "isKey": true, "tag": null, "execution": null }, ... ] } ] }
```
A row in `rebuilds` must not also appear in `seats`/`redrafts`. Do not touch the database or any other
file. Finish by reporting counts and the final precheck line.
