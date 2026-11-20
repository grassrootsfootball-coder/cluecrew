# English tell repair — brief for drafters and reviewers (R1029)

On LIVE English comprehension rows, surface features give the key away (R1028). When only one option
has a comma, it is the key 58% of the time (chance 24%). The only two-part option (", and", "while",
"but") is the key 51% of the time. In retrieval, the option sharing most words with the cited lines is
the key 49% of the time. In inference, the longest option is the key 45% of the time. The cause is how
the options were written: keys as fuller, qualified, two-claim statements; distractors as short single
claims. The repair is on the DISTRACTORS.

## Your packet: `content/agent-review/english-rewrite/tells/<door>/packet.json`
- `passages[ref].numberedLines`: the passages, verbatim. Cite lines by `n`.
- `rows[]`: each LIVE row with `tellsPointingAtKey` (the tells to break on this row) and
  `distractorsRestatingStem` (a distractor that just repeats the question). For each option it gives
  `features`: `comma`, `twoPart`, `words`, `windowOverlap` (share of its words found in the cited
  lines) and `not`.
- `entries`: the attested library tags a distractor may carry, with child hints.

## Drafter — what to change
For each row, break every tell in `tellsPointingAtKey` by making the key NO LONGER STAND ALONE on that
feature. **Aim for a TIE, not a flip:** usually ONE distractor takes the key's shape.
- **comma / two-part:** rewrite one distractor as two claims or with a comma, e.g. "He was tired, and
  wanted to go home." Its second claim must also be wrong, or the first must be.
- **longest:** make one distractor about as long as the key, with real content, not padding.
- **window overlap (retrieval):** make one distractor reuse words from the cited lines but get the
  detail wrong: the wrong person, the wrong order, a detail from the same lines answering a different
  question. `en-within-span-wrong-element` names this.
- **"not":** give one distractor a "not" that is still wrong.
- **A distractor that restates the stem:** replace it with a real mistake.
You MAY instead make the key plainer, if it stays complete and correct. Prefer changing a distractor.

**Hard rules**
- Every changed distractor is wrong under every reasonable reading of the passage, and wrong in the way
  its tag names. Retag it if the new value is a different mistake; use only tags in `entries`. Never
  create a second defensible answer.
- **Do not overshoot.** Do NOT give commas or two parts to EVERY distractor. That teaches "never the
  comma", and the measure checks reverse tells too.
- Child-facing text: British English, each sentence at most 16 words, ending in `.`, `?` or `!`
  (a dash does not end a sentence), words a 9–11-year-old knows.
- Every changed distractor gets an execution (staff-facing, at least 40 characters, every line number
  and quotation exactly right). Every other distractor on a row you touch must have one too (use
  `redrafts` for missing ones).
- Change nothing a tell does not need. Every change must be merged by hand into the authoring store.

**Output: ONLY `content/agent-review/english-rewrite/tells/<door>/proposals.json`**
```json
{ "door": "english-rewrite/tells/<door>", "proposer": "agent",
  "seats":    [ { "optionId": "...", "itemId": "...", "oldValue": "<stored value exactly>", "tag": "en-...", "newValue": "...", "execution": "..." } ],
  "redrafts": [ { "optionId": "...", "itemId": "...", "value": "<stored>", "tag": "<stored>", "execution": "..." } ],
  "rebuilds": [] }
```
Use `rebuilds` (the whole row, same option ids) only if you must change the key's wording. List each
row's reason in a top-level `"notes": { "<itemId>": "..." }`.

**Self-checks, from `packages/db`:**
- `pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-proposals.ts --door=english-rewrite/tells/<door> --precheck --from-live`, until 0 fail.
- `pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/measure-english-tells.ts --after=../../content/agent-review/english-rewrite/tells/<door>/proposals.json --by-type`. Confirm that on YOUR rows no failing tell still points at the key, and that no reverse tell appears. The door-wide target needs all four doors, so it may not be met by yours alone.

## Reviewer — acting as `rev-agent-01`
Follow `content/agent-review/PROPOSAL-REVIEWER.md`. Refs are `seat:<optionId>`, `redraft:<optionId>` and
`rebuild:<itemId>`; give one row verdict per touched row.
- **ATTEST a seat** only if the new distractor is wrong under every reading of the passage, its tag names
  the mistake, every fact in its execution is true, and it breaks the tell it was written to break.
- **SIGN a row** only if, read whole as the child meets it, it has one defensible answer, the tells in
  `tellsPointingAtKey` no longer single out the key, and no new giveaway appears. Look especially for a
  distractor that now reads as a better answer than the key, and for padding a child would spot.
- Run the precheck and the measure with `--after` as above.

## Round 2 — `content/agent-review/english-rewrite/tells/r2/<door>/`
Round 1 landed. The comma, two-part, length and "not" tells now sit at chance. Two things remain, and
each row in your packet carries one or both:
1. **`keyInClosestNearTwinPair: true` (convergence).** Two options are near-twins, and the key is one of
   them. A child who learns "the answer is one of the two nearly identical options" goes from four
   choices to two. Before round 1 this was 14 of 14 in retrieval; now it is 17 of 17. Break it WITHOUT
   bringing back a round-1 tell. Either:
   - make two DISTRACTORS each other's near-twins (sharing most of their content words), so the closest
     pair holds no key; or
   - reword the key's twin so it no longer shares most of the key's words, while it stays wrong in the
     way its tag names.
   The measure counts a pair only if it is the unique closest pair and shares at least half its
   content words (Jaccard ≥ 0.5).
2. **`previousRound` holds a reviewer's HOLD or REFUSE.** Fix exactly what the reviewer named. Their
   suggested wording is a starting point, not an instruction.
Do not reintroduce a comma, two-part, length or "not" tell on any row. If a row cannot be fixed
honestly, leave it out and say why.

Measure with `--after` pointing at the round-2 proposal files (round 1 is already live), e.g.
`--after=../../content/agent-review/english-rewrite/tells/r2/A/proposals.json`. Run the precheck with
`--door=english-rewrite/tells/r2/<door> --precheck --from-live`.
