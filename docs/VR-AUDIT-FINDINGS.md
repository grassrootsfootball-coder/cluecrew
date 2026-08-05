# VR audit findings — reported before fixing (reviewer, 2026-08-05)

The reviewer's VR audit raised five issues beyond the key-order one. All were
investigated **across the whole bank**, not just her sample. The unifying cause
in four of the five is the same: **the generator tags distractors by fixed
option slot rather than deriving which error each distractor embodies** — the
same class of fault as the key-position incident, and the VR analogue of the
maths §4.3 rule that a distractor must BE what its misconception produces.

Source in all cases: `packages/db/prisma/generate-content.ts`. **Nothing is
fixed here** — this is the report; the fixes are a generator / data / word-list
pass to run on your approval.

---

## 1. vr-03 `reversed-relation` — fixed-slot mislabel, whole bank (23/23 live)

`analogies()` builds every item as `[key, distractor1 → same-topic, distractor2
→ reversed-relation]`. The tag is the **column**, so `same-topic` is always
stored slot 1 and `reversed-relation` always slot 2 (confirmed on all 23 live
items). Whether slot 2 is *actually* a reversed relation depends entirely on the
`ANALOGIES` data — and it isn't. Column 5 holds **topic associates**:

`kennel, sleep, sky, sting, ticket, yellow, nurse, head, sharp, wing, note…`

Our own library definition (exported for you) says `reversed-relation` =
"Applied the relationship backwards — which one is the little one, which is the
big one?" None of the column-5 words model that; they are second topic
associates, identical in kind to the `same-topic` distractor. **The reviewer is
right on all 8 sampled, and it holds across all 25 generator entries.**

Fix (later): supply genuine reversed-relation distractors, or accept the bank
has one honest distractor type and give the second slot a different real
misconception. A generator/data fix, not a per-item edit.

## 2. vr-15 `clue-flip` — genuine library gap, 13 of 25 items

`first-mention` **is** derived from the clue text (a prior fix, line ~682) and
is correct. But `clue-flip` is the residual "the other distractor" — not derived
from that person's actual error. On **13 of 25 items** the `clue-flip` tag sits
on the **middle person** (named in *both* clues) who read both clues but never
chained them. That is a transitive-chain-miss — a distinct error from "read a
comparison backwards," which is what `clue-flip` names.

This is a real gap: a **"didn't chain the clues"** misconception is missing from
the library, so `clue-flip` is mislabelled on those 13. Same shape as the NVR
thin-vocabulary finding — it needs a ratified new id, not a code tweak.

## 3. vr-07 — non-derivable near-misses + fixed slot + duplicate values (25/25)

`lettersForNumbers()` builds `[key(sum), sum+1 → value-slip, opSlip → operation-
slip, sum−1 → value-slip]`. `operation-slip` is fixed at slot 2; `value-slip`
rides the two ±1 near-misses.

- The distractor **values** (`sum+1`, `sum−1`; and `opSlip = sum+2` at tier 1)
  are arithmetic near-misses — **not** the "substituted one letter with the
  neighbouring value" the tag names, nor a real operation swap. They fail §4.3
  derivability. Her reading of items 28–30 is correct and the whole bank is the
  same: 7±1 / 7±2 wearing misconception labels.
- **15 of 25 items** have two code letters sharing a value (e.g. `Q=5, S=5` on
  item 29) — an ambiguous code where two letters are interchangeable.

Fix (later): derive each distractor from a real error (a genuine value
substitution; a genuine operation swap) and de-duplicate the letter values; add
a VR derivability gate (the analogue of the maths distractor gate).

## 4. vr-01 — word-list quality, NOT fixed-slot

The odd one out. `insertLetter()` **derives** its distractors honestly via the
`isCommon` common-usage floor (a prior fix) — a letter "completes" a fragment
only if the result is a word a child knows, else it is `completes-neither`. The
logic is right. The **list** is wrong:

- `isCommon("bose")` returns **true** — a non-word is in
  `content/wordlists/common-en.txt`, so "b" → "bose" was judged to complete the
  word and tagged `second-word-only`.
- `isCommon("lea")` returns **true** — a real but child-obscure word is in the
  list, so "l" → "lea" was tagged rather than treated as invisible.

So the floor **did** fire; it fired on bad list entries. Fix (later): clean the
common-usage list (drop non-words like `bose` and child-obscure entries like
`lea`), not the generator.

## 5. vr-09 / vr-11 — systematic positional mislabels, not single items

Both bury a mislabel in a fixed slot on **every generator item**:

- **vr-09** `letterSeries()`: `[key, answer+step → step-repeat, answer−2·step →
  direction, answer+1 → step-repeat]`. `answer+1` is an **off-by-one** but wears
  `step-repeat`, on all 25 generator items (the other 13 live are seed-authored).
  Item 32 is one instance.
- **vr-11** `numberSeries()`: `[key, answer−1 → off-by-one, answer+d → step-
  carryover, answer+1 → off-by-one]`. `answer+d` is a **repeated step** but wears
  `step-carryover`, on all 25 generator items (14 seed-authored). Item 36 is one
  instance.

So her "single mistags" are each the visible tip of a positional mislabel that
recurs across the whole generator half of the bank.

> Also affected but not in her sample: **vr-14** `letterConnections()` uses the
> same fixed-slot shape (`answer±1` near-misses tagged by position). Worth
> folding into the same fix.

---

## Root cause and the durable fix (for your approval)

Four of five (vr-03, vr-07, vr-09/11, vr-14) are one bug: **tags assigned by
option slot, and distractor values that are positional/arithmetic near-misses
rather than the executed error the tag names.** The two banks that are already
right — vr-01 and vr-15's `first-mention` — both *derive* the tag from the
distractor's real relationship to the key. That is the pattern to extend
everywhere.

Proposed fix pass (not started):
1. Derive every VR distractor tag from what the distractor actually is (as vr-01
   and vr-15-first-mention do), replacing the fixed-slot `m: 0/1/2` assignments.
2. Add a **VR derivability + positional gate** — the analogue of the maths
   distractor gate and the new option-position gate — so a fixed-slot or
   non-derivable tag fails CI instead of reaching a reviewer.
3. vr-15 needs a new ratified **"didn't chain the clues"** misconception (a
   corpus decision, like the NVR vocabulary gap).
4. vr-01 needs the common-usage word list cleaned.
