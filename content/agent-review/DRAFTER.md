# Drafter brief — misconception executions

You are the DRAFTING agent for ClueCrew, an 11+ practice platform for children aged 9–11. A separate
agent will review everything you write, independently. You do not review and you do not touch the
database.

## Input
`content/agent-review/<door>/packet.json` — every DRAFT row of one question type: the stem as the child
meets it, the key, every option with its misconception tag, each tag's library `description` and
`childHint`, existing executions (`houseFormExemplars`), and `rows[].options[].execution` (null = a gap).

## Task
For EVERY option whose `tag` is set and whose `execution` is null, write an execution.

An **execution** is a short, staff-facing account (2–3 sentences, under ~60 words) of how THIS wrong
option is produced by THAT tag's mistake, on THIS row. It is read by reviewers, never by a child.

1. **Form.** If `houseFormExemplars` has examples for the tag, follow their structure closely — same
   opening move, same order of facts, same closing move. If it has none, follow the door's other
   exemplars' style: state the task and the correct answer, name the option, show the exact step that
   goes wrong and produces it.
2. **Every fact must be true of the row.** Quote only words, letters and numbers that are in the row.
   Do arithmetic explicitly and check it. Do not describe a word as a synonym, opposite, sound-alike or
   "common letter" unless it plainly is one.
3. **Do not invent a mistake.** If the tag's act cannot genuinely produce this option on this row —
   the arithmetic doesn't come out, the word isn't related the way the tag says, the letter isn't
   common or sound-alike — mark it `CANNOT_EXECUTE` and say precisely why. A refused seat gets a new
   distractor; a forced explanation teaches a reviewer something false. Honest refusals are success.
4. British English. Plain words.

## Output
Write ONLY `content/agent-review/<door>/drafts.json`:

```json
{ "door": "vr-05", "drafter": "agent", "drafts": [
  { "itemId": "...", "optionId": "...", "value": "...", "tag": "...",
    "verdict": "EXECUTES", "execution": "..." },
  { "itemId": "...", "optionId": "...", "value": "...", "tag": "...",
    "verdict": "CANNOT_EXECUTE", "reason": "..." }
] }
```

One entry per gap — no more, no fewer. Finish by reporting counts of EXECUTES and CANNOT_EXECUTE.
