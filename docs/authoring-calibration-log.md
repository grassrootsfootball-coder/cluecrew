# Authoring calibration log

Corrections from the human reviewer that generalise into house rules. The
first run of any new item mode goes to the reviewer as a CALIBRATION task,
and what comes back is recorded here before the volume run — so a correction
is made once, in the brief, rather than a thousand times in the output.

Format: rule → why → worked examples, with the reviewer's own wording kept.

---

## R1 — Over-long stems are SPLIT, not compressed
*Reviewer, written review 2026-08-03. Recorded by David.*
*Corrected 2026-08-02 (David) — see "What splitting actually did" below.*

> **Numbering warning.** The authoring batches call this rule **R2**; this log
> calls it **R1**, and the log's R2 is the tagging rule. The two numbering
> schemes have been in use side by side since the first tranche, and the
> miscount corrected below travelled precisely because "R2" meant different
> things at each end. When citing a rule across the boundary, name it — "split,
> not compress" — rather than numbering it.

A stem over the 16-word sentence cap is fixed by **breaking it into short
sentences**, never by squeezing the same clause into fewer words.

**Why.** Compression buys the word count by raising the vocabulary: a longer
word replaces a plain phrase, subordinate clauses stack, and the sentence
gets denser exactly as it gets shorter. That is worse for a nine-year-old
than the length was. Splitting keeps every word plain and gives the reader
somewhere to breathe. The reviewer's phrasing: *"Splitting them into shorter,
punchier sentences is definitely the right move for this age group."*

**Worked examples** — the reviewer's own five rewrites, applied verbatim:

| Item | Before | After |
|---|---|---|
| `ENG-001-WIW-14` | In lines 34 to 36 the Mole is compared to a small child walking beside a man who tells exciting stories. What does this comparison show? | Lines 34 to 36 compare the Mole to a small child walking beside a storyteller. What does this comparison show? |
| `ENG-002-pp-08` | The word 'countenance' is used about Mr Bingley in line 24 and about Mr Darcy in line 34. What does it mean both times? | Line 24 uses the word 'countenance' about Mr Bingley. Line 34 uses it about Mr Darcy. What does it mean both times? |
| `ENG-002-pp-11` | In the middle of this part the writer suddenly says: 'What a contrast between him and his friend!' Why is that sentence put there? | The writer includes a sudden short sentence. It says: 'What a contrast between him and his friend!' Why is it there? |
| `ENG-002-pp-16` | The writer lets Elizabeth hear Mr Darcy's words for herself, rather than having a friend tell her about them later. Why is that a good choice? | Elizabeth hears Mr Darcy's words for herself. A friend does not tell her later. Why is this a good choice? |
| `ENG-002-pp-17` | Mr Bingley says to his friend: 'I hate to see you standing about by yourself in this stupid manner.' What is Mr Bingley trying to do? | Mr Bingley speaks to his friend. He says: 'I hate to see you standing about by yourself in this stupid manner.' What is he trying to do? |

Note the shape of every one: the original front-loads circumstance before
the question; the rewrite states the facts one per sentence and asks last.

**What splitting actually did — correction, David, 2026-08-02.**

`WS-REDRAFT-3` reported "5 comprehension stems breached and were fixed" and
"the 5 breaching comprehension stems split, not compressed". Measuring the
batch's final stems against the cap with declared quotations stripped gives a
different account on both numbers:

| resolved by | count | items |
|---|---|---|
| declaring the quotation (R4) | 5 | WIW-18, pp-11, pp-13, pp-17, pp-19 |
| splitting the sentence (this rule) | 2 | pp-08, pp-16 |
| still over the cap | 0 | — |

**Seven breached, not five. Two were split, not five.** The five resolved by
declaring kept every word they had; what changed was the exemption, not the
prose. Crediting this rule with their fix teaches the next batch to reach for
scissors when the right move was a declaration — and the two techniques are
not interchangeable, because splitting alters the child's reading while
declaring does not.

**AUTHORING DISAGREES, and the disagreement is unresolved.** The batch file
was revised the same day to the opposite attribution: *"7 comprehension stems
breached; 2 (pp-13, pp-17) fell below the cap on R4 declaration alone, and 5
needed R2 splitting."* Both sides agree on seven and on pp-13 and pp-17. They
differ on WIW-18, pp-11 and pp-19.

The methods differ, and so does the evidence. This log measured the batch's
FINAL stems and credited declaration wherever a declaration existed — which
cannot tell "declaring sufficed" from "declared AND split". Authoring measured
against the pre-R1 baseline texts, which this repo does not hold. **On that
specific question authoring has the better evidence**, and their figures may
well be right. The correction above stands as David ruled it; the conflict is
recorded rather than settled by whoever wrote last, and settling it needs the
original stem texts preserved in the next batch.

The table of five rewrites above is unaffected: those are the REVIEWER's
splits of the stored stems, and they are splits. `pp-11` and `pp-17` appear in
both lists because the reviewer split them here and the batch separately
declared quotations on its own versions. That overlap is how the two accounts
came to look like one.

**Caveat carried forward, for the next brief.** Four of the five rewrites
clear the gates outright. `ENG-001-WIW-14` now passes the sentence cap but
trips the VOCABULARY ceiling: the split traded "a man who tells exciting
stories" for "a storyteller", and with "comparison" already in the sentence
that is two four-syllable words where one is allowed. **Splitting can raise
vocabulary too** — the rule is split rather than compress, but the plain-word
test still applies to what the split leaves behind. Flagged to the reviewer;
their copy, their call.

## R2 — Tag the misconception the distractor actually executes
*Reviewer, written review 2026-08-03. Recorded by David.*

A distractor's tag must name the reasoning that produces it, not merely a
plausible-sounding neighbour. Two from the calibration tranche:

- `ENG-001-WIW-14` — "The Mole was tired and wanted to go home" was tagged
  wrong-scope-retrieval. The detail is **not in the passage at all**, so the
  hint would send a child hunting for something that was never there.
  Correct tag: plausible-but-not-stated.
- `ENG-002-pp-11` — "To show that the two men were really rather alike" was
  tagged as a secondary sense of the target word. The target is *contrast*,
  and "alike" is its **antonym**, not another dictionary sense. Correct tag:
  the relation word read as its opposite.

**Why it matters more than a filing error:** the tag chooses the hint. A
mistagged distractor teaches the wrong lesson to the child who picks it, which
is precisely the child who needed the right one.

## R3 — Error-spotting puts the segments in the OPTIONS, not the stem
*Structural fix, 2026-08-03. Recorded by David.*

A GL error-spotting item is a sentence cut into four labelled segments, with
N ("no mistake") as the fifth option. **The segments ARE the options.** The
stem carries the instruction and nothing else.

The calibration tranche drafted them with the whole sentence duplicated
inside `stem.text` as well as split across the options — 38 to 47 words of
stem, all of it a second copy of text the child already had in front of them.
Remodelled: 18 items (9 spelling-spot, 9 punctuation-spot). No segment text
was altered; the duplicate was removed. Every one was checked first by
reconstructing the sentence from options A–D and comparing it to the stem's
copy — all 18 matched exactly, so nothing was lost in the move.

**N stays genuinely keyed 1–2 per set of nine**: spelling 2, punctuation 1,
unchanged by the remodel (relocating text does not touch a key).

**Cloze is NOT this shape and was left alone.** Its options are candidate
words for a gap, and the sentence carrying that gap has to stay in the stem
or there is no question. 16 items, correctly excluded.

## R4 — A quotation sits outside the sentence cap
*Gate rule, 2026-08-02. Recorded by David.*

Text inside a declared `stem.quotes` span is not counted toward the 16-word
sentence cap. Our wording around it is. A child has to read the passage's
words to answer, and the alternative — trimming Austen to fit — is not
something we should ever be doing.

**Extended the same day to the vocabulary ceiling.** A declared span is now
outside all three gates: ban list, sentence cap, vocabulary ceiling. Quoted
archaic vocabulary is the content under test — comprehension passages are
pre-1950 literature by design.

Practical consequence for authoring, and it is the important one:
**declare the quotation rather than paraphrasing it away.** A paraphrase is
OUR wording and is measured as such; a declared quotation is the passage's
and is not. `ENG-002-pp-17` carries a 15-word Austen line and passes on nine
words of our own wording. `ENG-001-WIW-14` paraphrases instead — "a small
child walking beside a storyteller" — and is measured in full, which is why
it is the one item in the bank still failing.

## R5 — The walk script, worked from three reviewer examples
*House style, 2026-08-02. Written by the reviewer, recorded by David.*

The house style ruling (direct, addresses the child, 3–4 sentences, scaffolds
toward the answer rather than handing it over or narrating the mistake) was
abstract until these three arrived. They are the calibration set. All three
passed the child-facing gates unchanged.

**`ENG-001-WIW-01`** — "Go straight to line 1. It tells you the Mole had been
spring-cleaning his little home. That gives you your answer. The other choices
happen later in the passage."

**`ENG-001-WIW-15`** — "The word 'first' is key here. Look for the very first
thing the Mole sees. It is 'something bright and small' that twinkles. The
face and whiskers appear later."

**`ENG-002-pp-03`** — "Look at lines 11 and 12. His answer says he was obliged
to be in town the following day. 'Town' means London here. He simply had to be
somewhere else."

What the rewrite pass should take from them:

**Sentence one is a location, not an introduction.** "Go straight to line 1",
"Look at lines 11 and 12", "The word 'first' is key here". No script opens by
restating the question. The child already read it.

**The passage's own words are quoted, not paraphrased.** "something bright and
small", "obliged to be in town", "spring-cleaning". This is R4 arriving in the
walk script: quoting is both truer to the text and cheaper against the gates.

**The last sentence disposes of the distractors as a group, without naming the
mistake.** "The other choices happen later in the passage." "The face and
whiskers appear later." It tells the child where the wrong answers came from —
which is the thing worth learning — and never says they fell for anything.

**A hard word gets glossed in place.** "'Town' means London here." Four words,
no detour. Compare with the drafted scripts, which tend to either dodge the
word or spend a whole sentence on it.

**Length runs short.** 28, 27 and 30 words against the drafted median of 51.
Four sentences each, all of them under the cap without effort.


## R6 — Reword away from the FAMILY, not the flagged token
*Authoring rule, 2026-08-02. Recorded by David.*

Two of the reviewer's twelve rewrites fixed the fault they were sent for and
introduced a new one, both by reaching for the nearest synonym: "wrong" became
"incorrect". The scanner named the new token, the rewrite cycle went round
again, and nothing had actually changed for the child.

"wrong", "incorrect", "error", "mistake" are one family. They are not banned
as words; they are banned as a **stance** — telling a child what they got
rather than what to do next. Swapping within the family keeps the stance and
only moves the flag.

The two fixes, and what each one does instead:

**`en-wrong-scope-retrieval`** — "Check the line numbers and re-read just that
bit. True facts from other paragraphs do not answer this question." The
judgement moves off the child and onto the *fact's relevance*: a true fact
elsewhere is still true, it just does not answer this. That is the actual
lesson, and the earlier wording never said it.

**`en-inference-literal-lookalike`** — "Some options just copy words from the
passage. The right one explains the idea behind them." The banned word was
carrying the contrast ("*Incorrect* choices copy words…"), so removing it
alone would have lost the point of the hint. "Some … The right one" restores
the same contrast without the stance.

**Test before you submit a rewrite:** does the sentence say what the child
should DO, or what their answer WAS? If the second, no synonym will fix it.

## R7 — An item's own symbols never draw from the option-label range
*Ruling, 2026-08-02. Recorded by David.*

`vr-07` asked *"If A = 3, B = 4, C = 5, D = 6, what is A + B + C?"* over
options the interface labels **A** to **E**. The A in the question and the A
beside the first option are different things wearing the same glyph, and the
child has to work that out before they can begin.

It is not a typo and it is not fixable by careful writing. Two namespaces are
sharing a set of letters, and the only repair is to move one of them: the
codes are now **P, Q, R, S**, clear of A–E and carrying no arithmetic
connotation of their own.

**The rule generalises to anything an item names for itself** — code letters,
series markers, labelled diagram parts, shape names. If the child sees it as a
symbol in the question, it must not be a letter they will also see as an
answer label.

**Checked, not remembered.** `pnpm check:word-puzzles` compares an item's
declared symbols against the labels its options WILL be given. That last part
matters: generated items store no label at all and the interface supplies
A–E at render time, so a check reading the stored value finds nothing to
collide with and passes everything. All 25 breaches were invisible to a reader
of the database for exactly that reason.

The generator was fixed alongside the rows, so regeneration cannot reintroduce
it.

## R8 — An unanswerable item is a defect, and no signature clears it
*Ruling, 2026-08-02. Recorded by David.*

Where an item states a rule — move a letter, build the middle word, find the
hidden word — the answer must be DERIVED from that rule and counted, never
asserted. Eight items fail this today:

- `gen-vr-08-move-letter-01`, `-13`, `-25`: CHAIR/MOP admits **no** valid move.
  There is no letter a child can move that leaves two real words.
- `gen-vr-08-move-letter-04`, `-16`: the key is "S"; the only valid move is "H".
- `gen-vr-08-move-letter-05`, `-17`: the key is "C"; the only valid move is "E".
- `gen-vr-05-hidden-word-16`: keys "PEAR"; the only word hidden at a join is
  "airs".

**These are not style findings.** A child cannot answer them correctly by any
route, so a reviewer's signature would record only that nobody checked. The
flag (`answerFlaggedAt`) is set by the gate and **has no clearing field** —
deliberately unlike the similarity flag, which a reviewer clears with a note
because coincidence-versus-derivation is a judgement. This is not a judgement.
The flag lifts when the item is fixed and the gate stops setting it.

All three routes to REVIEWED refuse a flagged item, and the check sits in
`publishBlockers` so a fourth route added later inherits it.

**Distinguish this from AMBIGUITY.** An item with two valid answers is a
fairness problem a reviewer can weigh — it is answerable, just unfairly. An
item whose rule produces nothing, or produces something other than the key, is
broken. The first is reported; only the second blocks.

## R9 — The two-distractor floor: don't force a fourth option that collides with the key
*Cowork finding, maths volume run batches 04–05, 2026-08-07. Recorded by David.*

Some items can only carry **two** honest distractors, because a third would be
**correct by construction** — a defensible second answer, not a wrong one. Forcing
a fourth option on them manufactures the very ambiguity R8's sibling rule (single-
answer) exists to prevent. The floor is a property of the item's structure, not a
gap to fill.

Two from the batch run:

- **`#52` ratio-to-fraction is a lone wolf.** On a bare "what fraction is red, from a
  1:3 ratio" item there is no second or third ratio-to-fraction sibling to fill the
  other slots without straying into another topic. Hardest instance: **2:5**, where
  2/5 (correct part-to-whole) and 2/7 (part-to-part read as a fraction) are *both*
  defensible — so the item floors at one clean distractor, not three.
- **Metric g↔kg affords only two clean distractors** — ×1000 the wrong way (`#36`)
  and the wrong prefix (`#37`). A third strains, because `#68` is now narrowed to the
  hundreds context. Not a gap to fill: **allow-list the family, or don't demand a
  fourth option on it.**

**The rule:** where a family's structure yields fewer than three distinct, non-
colliding distractors, the item ships with what it honestly has and the family is
allow-listed — never topped up with an option that is defensibly correct.

**A general fact, not a per-family quirk (annie, 2026-08-07 — third instance).** The
floor arrives for a DIFFERENT reason each time, which is why it is worth stating as a
property of items rather than of families:
1. **`M-06a` unit fraction** — a third distractor would be *defensibly correct* (a valid
   alternative reading), so it cannot be offered.
2. **`M-05a` unit price** — a third *strays into another topic*; there is no third
   unit-price error to reach for.
3. **`M-column` subtraction with no borrow** — the commutative-subtraction error
   (`|top−bottom|` per column) **equals the key** when no column borrows, so that
   distractor produces the right answer and cannot be offered at the no-borrow tier.
Three families, three causes — a defensible alternative, a topic boundary, and a
misconception that degenerates to the key. The floor is a fact about the item's
distractor space; expect it to recur wherever that space is genuinely thin.

## R10 — Tag against the entry's current wording, not its id slug (slug drift)
*Cowork finding, maths volume run batches 04–05, 2026-08-07. Recorded by David.*

A misconception id's **slug** — the human-readable tail of `maths-88-incomplete-perimeter`
— is frozen at creation, but the entry's **description** is re-worded and narrowed as
the library is calibrated. After a narrowing pass the slug lags the meaning, and a
tagger reading the slug tags by the sense it *used* to carry. The description is
authoritative; the slug is a label, not the definition.

Two mis-tags the batch cold-read caught, both slug-driven:

- **`#71`** now means *a given number is never used*, not *stopped halfway* — its slug
  still reads like the latter. A "found the rest and stopped" distractor tagged `#71`
  by the slug was retagged to **PROC-01**.
- **`#88`** ("missed-a-side" / incomplete-perimeter) was hung on a **half-perimeter**
  value it does not produce; the slug looked close enough. Retagged to a real
  missed-a-side value.

**The rule:** read the entry's current `description` beside the distractor before
tagging; never tag from the slug or from memory of what an id "means". When a slug and
its description have drifted far enough to mislead, that is a library note (rename is
v2), not a licence to tag by the slug.

## R13 — A spot-the-mistake distractor is a false positive, not the error it resembles
*Annie, written review of the SPaG homophones sheet, 2026-08-08. The vr-03 fault in a new district.*

In a spot-the-mistake item every wrong option is a **correct part** of the sentence. A child
who picks one is not making the spelling or punctuation error a franchise tag would claim —
"The coach checked her list" has no dropped silent letter — she is making a **false-positive
error**: thinking something is wrong when it isn't. That is a real, nameable misconception
(`en-error-spot-false-positive`), and tagging the correct part with a franchise it does not
instantiate actively **misdescribes her** and teaches a rule she applied correctly.

**The rules (all eleven SPaG families):**
1. **Correct-part distractors carry a false-positive tag split by the near-miss flag** (annie,
   2026-08-08): a NEAR-MISS part (a real error pattern, correctly used) → `en-error-spot-rule-
   over-applied`; a PLAIN part → `en-error-spot-guessed-a-part` (a close relative of, and
   worded as the pair of, `en-n-option-avoidance`). Never a franchise tag the part does not
   instantiate. `No mistake` as a distractor carries `en-n-option-avoidance`; the keyed error
   part carries no tag.
2. **The item is ONE coherent sentence in labelled parts**, exactly one part carrying the
   error — not four unrelated clauses. Parts show in sentence order, never shuffled.
3. **The ladder is NEAR-MISS PROXIMITY, and only that — 0, 1, 2, 3** (annie's correction,
   2026-08-08). Near-miss count is visible in the single item a child meets, so it laddens at
   item level. **N-keying is NOT a tier dial** — "sometimes/often" are properties of a tier,
   not the one item a child sees, so an N-keying ladder collapses adjacent tiers into identical
   items (the magnitude problem one level up). N-keying is a **serving-distribution** property,
   a fixed share of every tier's items, held on the family, out of the tier rule. Word length
   likewise makes no ladder claim.
4. **Tier reach is honest.** SPaG ceilings at T4 (corpus); no family reaches T5. A family
   reaches T1 only where the error can be made genuinely obvious (near-miss 0).

Homophones was rebuilt to this and sent for check before the other ten; they get the same pass
once it is signed — the maths discipline of proving one family before the volume run.

## R12 — Comprehension misconceptions cannot have executors — a property, not a gap
*David, 2026-08-08, recorded during the English generator build.*

A maths executor reproduces a distractor's VALUE by running the misconception on the
item's operands (`MISCONCEPTION_EXECUTORS`, keyed by entry number) — the derivability gate
then reproves it. That mechanism needs two things a comprehension item does not have:
operands, and a single computable wrong value. A comprehension misconception is an
error-TYPE of *reading* — mis-scoped retrieval, an inference the text does not license, a
pull to the extreme option — and its "distractor" is a phrase chosen against a specific
passage, not a number a function can emit. **There is nothing to execute, and that is a
property of the content, not a coverage gap.**

**The rule:** do NOT scope executors for the ~24 comprehension-domain entries. "0 of 24
have an executor" is correct-by-nature and must never be read as work outstanding — the
figure a maths reader would flag was never possible. What stands in for derivability by
district: **maths** — the executor + derivability gate; **SPaG** — the legality gate
(`assembleSpagItem`: every wrong option tagged (P3), no tie/repeat, floor held) with
correctness of the untouched material guaranteed by drawing distractor segments from a
pre-cleared bank; **vocabulary-in-context** — Annie's two-part bare-card screen (`checkVr04Row`:
no distractor correct in the headword's other sense); **comprehension** — authored-and-
reviewed distractors, each tagged to a reading error-type, checked by the line-reference gate
for citation accuracy. Four districts, four correctness mechanisms; only maths executes.

## R11 — Minimality is load-bearing in constrained-deduction items
*Annie, relayed by David, 2026-08-07 — the LOGIC-tail logic-grid shape (L-04, L-05).*

A redundant clue teaches a child that clues are optional, and in real papers they almost
never are. In the constrained-deduction shape (logic grids, ordering puzzles) **minimality
is part of what the item teaches, not a stylistic preference**: every clue must be
load-bearing — drop any one and a second solution appears.

- **L-04 rebuilt** to four load-bearing clues (Cara=chess; Ben not swim; Ben not run; Dan
  not swim → Ben=tennis). Each is checked: removing any one admits a second solution. The
  clue set is now minimal **and** diagnostic — "running" is Dan's sport, so the wrong-person
  read (#114) lands on it; "swimming" is the negated clue read positively (#113); "chess" is
  the name-a-sport clue taken as the whole answer (PROC-01).
- **L-05** dropped "Finn finishes ahead of Ella" — dead weight that generated no distractor;
  the puzzle stays unique and all three distractors are intact.

Test a deduction item by deletion: if the puzzle survives a clue's removal, the clue is
teaching the wrong lesson and comes out (or the item is under-constrained and has two
answers). This is a property of the shape, alongside R9's distractor floor.
