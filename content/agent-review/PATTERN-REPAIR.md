# Pattern repair brief — breaking a door-level shortcut (2026-11-20)

Some LIVE doors have a pattern that lets a child score without the skill. No single row is at fault:
the pattern lives in the DOOR. The repair rebuilds the fewest rows needed to break it. Every other rule
is unchanged: proposers follow `content/agent-review/PROPOSER.md` (hard rules, self-check, output
format) and reviewers follow `content/agent-review/PROPOSAL-REVIEWER.md`. Where those briefs say
`<door>`, use `patterns/<door>`, for example `--door=patterns/vr-08`.

Your packet is `content/agent-review/patterns/<door>/packet.json`. It holds the door's LIVE rows
(`signed: true`), every option with its tag and execution, and the tag entries.

## The patterns

**vr-08 (move a letter).** The letter to move is the FIRST letter of word1 on 15 of 25 rows. A child
who always tries the first letter scores 60%; by chance it would be about 20%. Target: across all 25
rows as they will stand, no single position of the key letter within word1 (first, second, …, last)
on more than 7 rows, and the first letter on no more than 6. Every distractor letter must still occur
in word1, as now, so the letters themselves give nothing away.

**vr-16 (opposite meaning).** On 23 of 25 rows the three distractors are near-synonyms of the card
word ("warm, spicy, boiling" for HOT), so the key is simply the option unlike the others. A child can
ignore the card and pick the odd one out. Target: on at least 15 of the 25 rows as they will stand,
the options must NOT split as three-alike plus the key. Mix twins (`vr16-synonym-pull`) with words
that are loosely different but not true opposites (`vr16-loose-opposite`). Then the child must decide
which word truly reverses the card word. Hard limits:
- No distractor may itself be a defensible opposite of the card word in ANY sense. The card is bare,
  so every sense counts: for LIGHT, both "dark" and "heavy" are opposites.
- If the card word has two senses with two opposites, the row must be rebuilt on a different card word.
  It cannot be repaired.

## For the proposer
- Choose which rows to rebuild. Prefer the fewest that reach the target, and do not touch a row the
  target does not need.
- vr-08: put each rebuilt row in `rebuilds` with a new word pair (same stem keys) and the same option
  ids. vr-16: for a row whose card word stays, you may use `seats` to change one or two distractors.
- Before you write `proposals.json`, count the target across all 25 rows as they will stand, and state
  the count in your report.
- Run the precheck with `--door=patterns/<door> --precheck --from-live` (the rows are LIVE).

## For the reviewer
In addition to your brief:
- Recount the target yourself across all 25 rows as they will stand, and say whether it is met.
- If a change would land and break a row, refuse it, even when the door target then falls short. A
  shortfall is reported, never forced.
- Run the precheck with `--door=patterns/<door> --precheck --from-live`.
