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

**maths-01 (all seven maths types, four options each).** Children learn where the right answer sits
among the VALUES (option order is shuffled, so position gives nothing away). On 161 rows whose options
can be compared, the key is the second-smallest on 69 (43%) and the largest on only 13 (8%). "Never the
biggest, usually second-smallest" beats chance by a wide margin. Target, measured by
`scripts/agent-review/measure-maths-key-rank.ts --after=<proposals>`: every rank (smallest,
second-smallest, second-largest, largest) on at least 28 and at most 52 of the rankable rows.
`content/agent-review/patterns/maths-01/ranks.json` gives each row's key rank, which side of the key
each distractor sits on, and how many times each tag occurs on the door (`tagCount`).
- The moves: on a rank-1 row (one distractor below the key), replace that distractor with one ABOVE the
  key, and the row becomes rank 0. On a rank-2 row (one distractor above), replace that one with one
  BELOW, and the row becomes rank 3. Use `seats`, one per row.
- **Never drop a scarce diagnosis to top up an abundant one** (house rule for every generated door).
  Replace only a distractor whose tag occurs at least 10 times on the door (`tagCount`). The new value
  must come from a mistake a real child makes on THIS question, tagged with an entry from `entries` that
  produces exactly that value. Prefer a tag that is rare on the door.
- The new value must be wrong, must differ from every other option, and must not be a "nearly right"
  answer that a marker could accept (a rounding of the key, an equivalent fraction, the same amount in
  other units).
- Many maths distractors have no execution. The lander refuses a touched row unless EVERY distractor
  has one of at least 40 characters, so on each row you touch, add a `redrafts` entry (value and tag
  unchanged) for every other distractor without one. Every fact and every calculation in it must be
  right.

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
