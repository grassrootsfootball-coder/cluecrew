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
(named `en-error-spot-false-positive`, then split — see rule 1), and tagging the correct part
with a franchise it does not instantiate actively **misdescribes her** and teaches a rule she
applied correctly.

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
   2026-08-08). Near-miss count is visible in the single item a child meets, so it ladders at
   item level. **N-keying is NOT a tier dial** — "sometimes/often" are properties of a tier, not
   the one item a child sees, so an N-keying ladder collapses adjacent tiers (the magnitude
   problem one level up). N-keying is a **serving-distribution** property (`N_RATE`, held on the
   family), applied at **RUNG MINUS ONE**: an N-keyed item's un-errored slot is itself a
   near-miss, so building it from a rung-1 sentence lands it on the tier's true count — and
   excludes T1 automatically (rung-1 = -1). Word length makes no ladder claim.
4. **Near-miss is DERIVED and VERIFIED, never declared** (annie's third-district catch of the
   maths gate's blind spot, now one layer down: there a family declared a structural parameter
   the item didn't honour; here an item declared a count its own words didn't). A part is a
   near-miss **iff** a word in it is on the family's homophone list (a lookup). The generator
   sets the count from that lookup and the range gate enforces it == rung, so a mis-count
   ("long hours" = hours/ours; "ring out" = ring/wring; "the loud bells" = no homophone) fails
   the build, not the child. A CI test asserts every bank sentence's derived count == its
   declared `intended`.
5. **No stimulus twice, and sample the space** (serving rules, `generateSpagSample`): a sample
   never shows the same sentence twice — not its correct AND its errored form (`dedupKey`), so a
   child is never handed one item's answer by another; and no error pair exceeds a stated share
   of a tier (`diversityKey`, ≤ 1/3), so a family samples its homophone space rather than one
   pair.
6. **Tier reach is honest.** SPaG ceilings at T4 (corpus); no family reaches T5. A family
   reaches T1 only where the error can be made genuinely obvious (near-miss 0).
7. **The errored token is capped like the class** (annie, 2026-08-08). Dedup is by sentence and
   diversity by pair/class, so nothing stopped the same MISSPELLING keying twice — `iland` keyed
   silent-letters T1 and T4, `maid` keyed homophones T1 and T4. A child who learns `iland` is
   wrong at T1 is handed T4's answer, and the tier claim is hollow for her. Rule: the errored
   token (the corrected key word) is DISTINCT across a family's bank — used as the key in at most
   one sentence — enforced by a CI test and a sample-time cap (`errorTokenKey`). This changes the
   signed homophones bank, so it is regenerated and re-signed (the fingerprint moves; the
   signature voids by design — better than the rule applying to ten families and not the eleventh).
8. **Every sentence is correct in EVERY dimension the district tests, not only the one under
   test** (annie, 2026-08-08). A silent-letters item read "hid a silent ghost a knight and a
   lamb" — an unpunctuated list of three, on a sheet whose own punctuation families are about to
   teach that comma. A spelling item that punctuates badly teaches against a sibling family. So a
   clean part carries no error of ANY franchise; a checked list-of-three takes its commas; and
   (rung-3 naturalness) the traps sit in one- or two-word parts with a normal sentence shape
   around them, never adjective-stacked or list-padded to force three traps into one noun phrase.

**THE TRAP PRINCIPLE (annie, 2026-08-08 — the general form of the list-edge ruling).** A part is
a near-miss ONLY where the child has been *taught to hesitate*. This decides every family's
near-miss lookup, and it is why a lookup is a definable CLASS, not a regex and not a hand-picked
dozen:
- **Homophones** — the standard KS2 pairs (ruled above); `thyme` and weak-forms are out because a
  child is not taught to hesitate there.
- **Double letters** — NOT "any doubled consonant" (`/(.)\1/` catches `happens`, `summer`,
  `grassy`, which pose no decision). The class is *uncertain* doubling: a prefix/suffix boundary
  or an unstressed syllable where single and double both look plausible — `recommend`, `disappoint`,
  `embarrass`, `necessary`, `accommodate`, `beginning`, `travelling`. The regex was over-inclusive
  and it showed: it made an N-keyed key-part double as a trap (`Swiming happens`) and over-dense a
  rung-3 item (`appeared`). **Fix folded into the suffix/silent pass** so all three families share
  one trap definition, not two.
- **Suffix vowel** — already the right shape: `-ant` vs `-ent` is uncertain *by definition*.
- **Silent letters** — already right: a silent letter either is or isn't there; no judgement, so
  a comprehensive class of silent-letter words is the property.

The test for any proposed trap: *would a taught child hesitate here?* If not, it is not a trap,
however much it superficially resembles the error pattern.

**RULING (annie, 2026-08-08): rung 3 = three traps among four parts; error items are all-live.**
An error item spends one part on the error, so at the ceiling its other three parts are all traps
by definition — 0 clean. Requiring a clean part would force error items down to two traps (rung 2),
leaving the family no top rung for error items at all; that is a worse ladder, not a stricter one.
And the all-live item is the correct T4 experience ("every other part looks wrong too"), the thing
that distinguishes it from T1's "one obvious slip among plain parts". Confirmed for all four signed
families incl. homophones; no re-sign. **Property to record so tag-exposure figures aren't misread:
`en-error-spot-guessed-a-part` cannot appear on a top-rung ERROR item (no clean part there), so it
is only reachable at rungs 0–2 and on N-keyed items. Its exposure legitimately drops off at T4 —
that is the design, not a break.**

**Where no generative rule exists, use a REVIEWED LIST — and call it a list** (annie, 2026-08-08;
now the second family to need it). Two of the eleven have no rule: **homophones** ("is a homophone"
has no cheaper test than membership) and **silent letters** (frequency and position both fail to
separate `knight` from `right`; the true criterion — do children omit it — is a fact about
children, not the word). Dressing a list as a rule is exactly what produced the double-letters
regex. So the definition SAYS "list", the list is authored to the trap principle and reviewed (not
derived, ~25–40 words), and it is checked by membership. This is the discipline applied honestly,
not a retreat from it — and naming it will stop the temptation to "derive" comma sites from
something that only looks like a parse. (Double-letters (c), the inert-double set, is also a
reviewed list; (a)/(b) remain generative.)

**PROCESS (annie, 2026-08-08): ratify the trap DEFINITION before the bank, not the items after.**
Every round of this district caught a mechanism deriving from something narrower than the property
it claimed — a hand list, then a regex, then the uncertain-doubling class — each found by reading
32 items and inferring the definition from where they failed. The definition is what the signature
rests on, so it is ratified first, as a written class per family (a rule that GENERATES the set,
checkable by lookup), the same move as ratifying a maths tier-rule + number ranges before the
sample sheet. Delivered: `content/exports/spag-trap-definitions.md` (eleven families). Build banks
only against a ratified definition.

**Subtype guidance for the two held families (annie, 2026-08-08), recorded before they are built
so the banks are authored to it, not retrofitted:**
- **Punctuation.** Near-miss is a SITE lookup, not a word lookup: a part is a near-miss if it
  contains a boundary where a mark could plausibly go (before a coordinating conjunction, after a
  fronted adverbial, at a subject–verb join) — derivable from sentence shape, verified the same
  way. And "clean parts correctly punctuated" is not strict enough, because comma placement has
  legitimate variation: a clean part must contain **no optional punctuation site at all** (no
  fronted adverbial, no serial-comma list, no parenthetical aside), or a well-taught child who
  flags it is marked wrong.
- **Cloze.** R13's spot-rules do not apply (there is no error to spot). The ladder analogue is
  how many options grammatically PARSE in the slot: rung 0 only the key parses; by rung 3 all four
  parse and only one is right on sense or register — the same derive-and-check discipline. At rung
  3 the DECIDING FACTOR (sense / register / collocation) is named per item; if the author cannot
  write one sentence why the key beats each distractor, the option comes out (the vr-04 rule).

**Comma family — a small bank is a FINDING, not a shortfall (annie, 2026-08-08, recorded before
the build).** The comma clean-part rule is strict by necessity: a clean part must admit no
acceptable comma insertion at any position. English rarely forbids a comma outright, so this rule
may leave the comma family at one or two rungs where the other three punctuation families reach
four. That is the rule telling the truth about comma placement, not a defect — record it (M-06a:
fewer rungs, or a single honest tier, stated) so no one later "fixes" comma to match its siblings
by loosening the very rule that makes it correct.

**Comma probe result (2026-08-08, six sentences authored to the two-sided clean-part rule).** The
rule has two sides: no comma acceptable INSIDE a clean part, and none at a JOIN between two clean
parts (a four-part split has three joins). The join side binds hardest: five of six candidates
failed at a join — a trailing adverbial (`after school`), a post-modifying PP (`on the shelf`), or
a comma-before-coordinator (`and sat down`), which is exactly where four-part items split. Only a
contrived double-object item survived, and only if a trailing PP is read as integral. **Verdict:
the "spot the mistake" comma family sustains ONE rung at most, unnaturally — the question type
rests on "no comma is acceptable here", which English almost never grants at a phrase boundary.**
The surviving shape is the REFRAME: **"which part NEEDS a comma"** — clean parts then only need to
be places a comma is not REQUIRED (abundant), same skill, natural sentences, a real multi-rung
bank. Decision pending; the other three punctuation families hit this wall far less hard.

**Comma site-typing is the THIRD no-rule case — reviewed PER-SENTENCE, not a lookup (annie,
2026-08-08).** Unlike homophones/silent (word lists), comma site-type depends on the construction,
not the word ("by the river" is optional in one sentence, part of a required list in another), so a
cue-classifier would mis-type trailing adverbs and appositives as forbidden — the exact mis-typed-
clean-part fault caught in three districts. So each sentence is typed by hand and REVIEWED. To keep
the 24th sentence typed like the first, the SETTLED CASES (extend as new ones arise):
- **Required (R) — beyond argument only:** fronted subordinate CLAUSE — one with a verb (`When the
  bell rang`, `After we finished lunch`) — takes a required comma; a fronted adverbial PHRASE
  without a verb (`After the match`, `For the fair`, `In the morning`) is **O, not R** (annie
  2026-08-08 — the distinction is the verb, and it is subtle enough to state explicitly). Also R:
  a list's internal commas (between items 1–2, 2–3). Nothing "strongly preferred" — that is a trap
  in a key's clothes. A **TRAILING** subordinate clause (`we cleared the room once the film ended`)
  is **O, not R** — a comma before it is acceptable but not required, and it is exactly where a
  child over-applies the fronted-clause rule. Using each subordinator both fronted (R, key A) and
  trailing (O) is what stops "opens with a subordinator → answer A" being a shortcut, and it
  teaches the real Year-5 rule (fronted clause takes a comma, trailing one does not).
- **Rung 0 is KEYED-ONLY (annie 2026-08-08).** An N item needs at least one O site or the child is
  asked nothing (a plain S-V-O with no comma anywhere is hollow); but an N item with one O is a
  rung-1 item. So rung 0 carries only keyed (fronted-clause) items — N items live at rung 1+, most
  naturally as trailing-subordinate-clause sentences.
- **Mirrored pairs — the district's ONLY sanctioned repeated sentence (annie 2026-08-08).** The
  same subordinate clause appears once fronted (key A, rung 0) and once trailing (key N, rung 1) —
  `once the film ended`, `while we waited`, `although he was tired`. This is rule 7 (no repeated
  sentence) DELIBERATELY excepted, because the repetition IS the teaching: the pair makes the
  fronted-vs-trailing contrast directly, which a bank of only fronted clauses never could. Allowed
  under two conditions, both holding here: (1) the pair is **never served to the same child in the
  same session** — met together it becomes a giveaway, not a contrast; (2) the pair **straddles
  rungs** (fronted rung 0 / trailing rung 1) so it cannot collide inside one tier's sample. Flagged
  so a later reader does not mistake it for a rule-7 leak; the serving layer must honour condition
  (1) as a pair constraint (the two ids are a linked pair, not independent items).
- **Optional (O) — a trap:** trailing prepositional phrase; trailing adverb; the **serial-comma
  slot** (pre-final-conjunction in a list — British: optional, a trap, NEVER the key); a short
  fronted adverbial; **a coordinator joining two INDEPENDENT clauses** (British: optional — "the
  rain stopped, and we left" is acceptable but not required, so it is O, never the key; annie
  2026-08-08, the clause form of the serial-comma settlement).
- **Forbidden (F):** between a verb and its object; inside a noun phrase; between an auxiliary and
  its main verb; the subject–verb join. Forbidden means forbidden, not merely unusual — "you
  wouldn't but could" is O, not F.
Key = the R part (or N if none). rung = number of O parts. An N item carries no REQUIRED site and
**no paired construction** (parentheticals / non-restrictive relatives) AND **no sequence of three
or more parallel phrases** (a run like "down the hill past the shops into the square" reads as a
list and invites the list rule — annie 2026-08-08, the same concern as parentheticals).

**No part may end inside a noun phrase — a SPLIT rule, not a typing one (annie 2026-08-08).** A
part must be a constituent; a chunk like "near the busy" (ending inside "the busy market") cannot
be evaluated for a comma at its own boundary because that boundary is not a site. **And the deeper
finding: a four-part split fights short natural syntax** — a ~12-word sentence has perhaps three
genuine boundaries, and comma splits must land on syntactic joins (spelling got away with mid-word
readability; comma cannot). **RULING: comma items are THREE parts + N, not four** (annie 2026-08-08).
Consequence: with three parts a keyed item is 1 R + up to 1 O + 1 F for the main verb, so keyed
tops at rung 1 unless the key is a LIST (verb inside the list part), which reaches rung 2; rung 3 is
unreachable. **Comma therefore serves T1–T3, not T4** — an honest ladder outcome of the shape, like
the collapsed maths families. (Spelling families keep four parts: their task is word-level, so
mid-phrase splits are readable and acceptable there — tightened only if a reviewer asks.)

**The constituent rule is COMMA-SPECIFIC — do not apply it district-wide (annie 2026-08-08).** It
exists because comma items are judged at part BOUNDARIES. Spelling items are judged at the WORD, so
a mid-phrase part (`beyond the`, `on her`) is perfectly readable and its boundary carries nothing;
double has 0 such splits, suffix 4, silent 5, all on CLEAN parts where nothing rests on the
boundary. Applying the constituent rule there would regenerate three SIGNED families (moving their
fingerprints, voiding signatures) for no gain — the rule outside its reason. Left as-is by ruling.

**Two things to hold as the comma bank expands to 24 (annie 2026-08-08).** (1) **Cap the opening
construction like the errored token (rule 7).** The R-well is narrow — every keyed non-list item
uses a fronted subordinate clause, so without a cap a bank reads monotonously and teaches "the
answer is part A". The `diversityKey` is the opening construction (subordinator / list / none). (2)
**Watch the key-position spread across the full 24, not the 12** — required commas come only from
fronted clauses (key A) and lists (A or B), so keys structurally cluster at A/B/N; the mitigation
is an N-heavy bank plus list-at-B items to dilute the A cue. A remains the modal keyed position —
an inherent property of the R-well, worth stating, not a bug.

**The general lesson (annie, 2026-08-08 — state it this way, it is the reusable part).** "No comma
is acceptable here" is not a thin property, it is a nearly-EMPTY one *at phrase boundaries*, and a
four-part item splits at phrase boundaries by construction. Five of six candidates failed at a
JOIN, not inside a part — meaning no amount of careful part-authoring could have saved them: **the
spot-the-mistake question type and the four-part split are incompatible whenever the tested property
lives at phrase boundaries.** Any future spot-the-mistake family built on a phrase-boundary property
will hit the same wall for the same reason; check the joins first. **RULING: comma is rebuilt as
"which part needs a comma" (annie, 2026-08-08).** Consequence for the district: punctuation now
holds TWO question types (comma = needs-a-comma; apostrophe/terminal/speech = spot-the-mistake, if
they survive their probes), so family names and stems must make the two obvious to the child — she
must not have to work out which task she has been handed.

**Pool sizing carried on the spelling families (annie, 2026-08-08).** An honest small bank beats a
padded large one: **double letters ships at 4/rung** (16), its key pool restricted to child-used
words though its trap pool is the full ~30; **silent letters aims at 6/rung** on the 36-word list
but drops to 5 or 4 if rung-3 cannot be built cross-group; **suffix holds 6/rung**. Bank depth is
the serving caveat already carried on every SPaG signature.

**Two things a SPaG signature carries, made explicit (annie, 2026-08-08):**
1. **Bank depth is a per-family qualification, and the numbers now differ.** Suffix 24 (6/rung),
   silent 24 or 20 (6 or 5), double 16 (4/rung → four items per tier, so a child sees the whole of
   double letters in one sitting). The signature warrants that *every item the family can produce
   is fair at its tier* — NOT that a child can practise it without exhaustion. Each family's depth
   is **sized before serving**, and it is a different number for each (same shape as M-place).
2. **The trap definition travels WITH the signature, not three documents away.** The trap principle
   (a trap is a trap only where a taught child hesitates) is what every ratified definition — and
   so every signature — rests on, and it is why two of the eleven are lists. So the signature
   record itself states the family's trap definition, so that a later reader asking "why is `right`
   clean and `knight` a trap?" finds the answer next to the signature. `apply-spag-signatures.ts`
   carries each family's one-line trap definition in its signature note.

Homophones was rebuilt to all of this and SIGNED (annie, 2026-08-08, T1–T4) with a bank-depth
qualification carried on the signature (24 verified sentences, 6/rung → a tier emits six
distinct items; two sittings exhaust a tier — a serving concern to size before volume, same
shape as M-place). R13 carries all six rules to the other ten in one pass.

**Two notes for whoever grows a bank (annie, 2026-08-08):**
- **Rung-zero is structurally the hardest to grow, and matters most.** A 0-near-miss item needs
  three of four parts with NO homophone, and English function words are dense with them (to/two,
  for/four, by/buy, in/inn, no/know, one/won, here/hear, week/weak, our/hour, would/wood …). So
  the T1 bucket will always be thinnest, and it serves the youngest, least secure children, who
  tolerate repetition worst. Two mitigations: **allow rung-zero parts to be shorter** (a two-word
  part is easier to keep clean than a four-word one); and **the pair-share cap may need to be a
  fraction of the available bank, not a fixed third**, because it binds hardest at T1.
- **Decide the homophone list's edge once, not per sentence.** Weak-form / near-homophone pairs
  (were/we're/wear) are excluded by the current lookup, so a sentence like "games were played"
  reads as rung-zero — correct by the lookup, but a child taught were/we're may flag it. Whether
  the list includes weak-form and near-homophone pairs changes which sentences qualify as clean;
  make that call once (it is a lookup edit) rather than arguing it per sentence.
  **RULED (David, 2026-08-08): standard KS2 homophone pairs only** — weak-forms (were/we're),
  near-homophones (shore/sure) and low-frequency pairs (time/thyme) are EXCLUDED, because
  near-miss should mirror what a child is taught to flag. The current lookup already matches this,
  so `time`/`shore`/`were` stay clean and homophones needs no rung-zero change on their account.

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

**Apostrophe probe result (2026-08-08, six natural candidates).** Plural/noun-before-noun is
COMMON — four of six carried an arguable apostrophe site (`dogs bowl`, `boys changing room`,
`teachers lounge`, `teams match`), and in two the ERROR site itself was ambiguous (singular vs
plural possessive vs attributive vs verb). Only two error types are cleanly unarguable: irregular-
plural possessives (`children's`, `men's` — the bare plural is never right) and its/it's (a fixed
rule). So the general apostrophe family fails the spot-form clean-part rule for the same reason
comma did — the tested property lives where natural sentences constantly put arguable sites.
**Recommendation: reframe to "which part NEEDS an apostrophe"** (arguable noun-modifier → an
`over-applied` trap, not a broken clean part; key = a clear required possessive). A narrow spot-form
survives only if restricted to its/it's + irregular-plural possessives with clean parts scrubbed of
regular-plural-before-noun — thin, and a slice of the skill. Decision pending. Terminal/boundary and
speech are expected to survive the spot-form (their sites are far less arguable) but each is probed
at the joins before assuming.

## R14 — Apostrophe splits into TWO families; and the four stem forms, settled once
*Annie, 2026-08-08. Recorded by David.*

The apostrophe probe found two different properties that want two question types, so apostrophe
becomes **two families**, not one:

- **`apostrophe-contraction` — SPOT-THE-MISTAKE.** its/it's, they're/their/there, you're/your,
  we're/were, who's/whose. UNARGUABLE: one form is right, the other wrong, no reading rescues it —
  exactly the spot-form's requirement. Highest value in the subtype: its/it's is the commonest KS2
  apostrophe error, and spotting it is the very thing a child fails to do in her own writing. TRAP
  DEFINITION: a part contains a word from the reviewed contraction-confusion set (in EITHER form);
  clean parts contain none. A word list, no generative rule — **the fourth no-rule case** (after
  homophones, silent, comma-site-typing), and it says so.
- **`apostrophe-possessive` — REFRAME "which part needs an apostrophe".** Regular plurals,
  noun-modifiers, singular/plural possessives — the probe shows these blur constantly (`boys
  changing room`), so the spot-form can't hold them; under the reframe an arguable site becomes an
  `over-applied` trap, not a broken clean part. TYPING (reviewed per sentence, comma-style): R = a
  clear singular possessive with an animate owner (`the girl's coat`, `my brother's bike`); O = any
  noun-before-noun / plural-before-noun where a possessive reading is defensible; F = a plain plural
  or a verb. **Probe the R-well BEFORE authoring** — if the only unarguable required site is the
  singular animate possessive, that is one construction, and comma's experience says one
  construction gives a positional cue.

**The four stem forms, settled as a SET (annie 2026-08-08) — so four near-identical stems don't
make a child misread which task she has, an error unrelated to the skill:**
1. **Spot-the-mistake** (spelling; contraction): "Read the sentence. One part has a {spelling|
   punctuation} mistake. Which part is it? If every part is right, choose N."
2. **Needs a comma:** "One part must have a comma but does not. Which part is it? If every part is
   right, choose N."
3. **Needs an apostrophe:** "One part must have an apostrophe but does not. Which part is it? If
   every part is right, choose N."
4. **Cloze:** "Choose the word that fits best." (a different shape — a gap, not four parts.)
Every one ends on the same N clause ("If every part is right, choose N") so only the TASK verb
changes; the difference between "has a mistake", "must have a comma", "must have an apostrophe" is
carried in the main verb where a child reads it first.

**Terminal and speech — probe before building (annie 2026-08-08), and check specifically:**
- **Terminal:** a comma splice is an error, but a full stop where a comma belongs is arguable
  against it ("It was raining. We stayed inside" vs "…, so we stayed inside" are both correct), so
  a clause-join boundary may be OPTIONAL — the comma failure in a new place.
- **Speech:** check the CLEAN parts — British allows single or double quotation marks, and
  comma-vs-colon before speech varies, so a clean part holding a punctuation CHOICE is optional,
  not forbidden.

**Possessive family — the optional type must record WHICH reading makes a part arguable (annie
2026-08-08).** `the girls coats` has three readings — singular possessive (`girl's`), plural
possessive (`girls'`), attributive plural (`girls` as a noun-modifier) — and they take different
punctuation. A child defending any of the three is defending something real, so the O-type is not
binary: it must carry which reading it is, or the `over-applied` tag is as vague as the borrowed
franchise tags were at the start of the district. Type possessive O sites as `O:sing-poss` /
`O:plur-poss` / `O:attributive`, so the trap tag says what the child actually did.

## R15 — Spot-the-mistake needs a BINARY property; permissive properties reframe
*Annie, 2026-08-08. The general fact behind all four probes. Recorded by David.*

Every SPaG probe found the same thing: a family survives the spot-the-mistake form iff the tested
property is **binary — one reading right, all others wrong**. Where the property lives where natural
English is PERMISSIVE, the spot-form dies and the "which part NEEDS it" reframe is the survivor.
- **Binary → spot-form:** a misspelled word (spelling), a wrong contraction (its/it's). No second
  reading exists, so a clean part is genuinely unimpeachable.
- **Permissive → reframe:** a comma at a phrase boundary, an apostrophe at a noun-modifier. English
  admits a second reading, so clean parts can't be unimpeachable and the arguable site becomes the
  trap instead.
- **Mixed → SPLIT the family** (the apostrophe pattern): terminal and speech each hold both. A comma
  splice is unarguably wrong (spot) but a full stop where a comma also works is not (reframe); a
  missing closing quote is unarguably wrong (spot) but single-vs-double marks is a choice (reframe).
  **Probe terminal and speech with the split hypothesis in hand** — a narrow spot-form on the
  unarguable errors, a reframe for the rest — rather than testing the whole family against one shape.

**Possessive R-well probe result (2026-08-08, six candidates).** Possessive reframes (arguable
sites common — regular-plural-before-noun and noun-modifiers all blur into girl's/girls'/attributive).
The unarguable R-well is **two constructions**: irregular-plural possessive (`children's`, `men's` —
bare plural never right) and named/unambiguously-singular animate possessive (`Tom's bike`, number
fixed). **Do not widen it** (annie): the singular possessive MOVES (keys A/B/C by position), the
arguable O sites are abundant so the ladder fills, and `the coat belonged to Tom` gives an N item —
position variety + N, comma's answer, not more constructions. O sites typed by reading (R14).

## R16 — Possessive: the R-well is THREE well types, and N items need an O
*Annie, 2026-08-08. Recorded by David, before authoring the possessive bank.*

Construction (2) — "named or singular animate" — is only unambiguous when the DETERMINER fixes the
number, because a plural name blurs exactly like a plural noun (`the Smiths house` has the same three
readings as `the girls coats`). So the unarguable R-well is **three well types**:
1. **Irregular-plural possessive** — `children's`, `men's`, `women's`, `people's` (bare plural never right).
2. **Proper-name possessive** — `Tom's bike`, `Sara's book`.
3. **Singular determiner + singular noun** — `my brother's`, `the girl's`, `her teacher's`. The
   determiner does the work: `my brother's` fixes number in a way `brothers` cannot.
The useful pair is (3) against its plural: `my brother's bike` is required, `my brothers bike` is
arguable, and they differ by one word — a bank holding both teaches the actual rule (the apostrophe's
POSITION depends on the number, not the noun).

**O subtyping — two children, probably two tags (drafted for the reviewer to rule).** The child who
picks an attributive noun-modifier (`the school gate`) thinks a noun before a noun always shows
possession; the child who picks a plural-before-noun (`the girls coats`) knows possession is involved
but cannot place the apostrophe. Different hints, so likely two tags rather than one with a reading
parameter — reviewer rules on the drafts.

**N items carry at least one O (same as comma rung 0).** `The coat belonged to Tom` has no apostrophe
site anywhere — hollow, nothing to consider. A good N item keeps an arguable site and no required one,
so the child must DECIDE the arguable one does not need an apostrophe: `The teachers lounge had new
chairs this term` is a real N because `teachers lounge` is a tempting, defensible attributive.

**Possessive O sites collapse to ONE type — natural attributive — with two child readings (annie
2026-08-08).** A `plur-poss` O only works where the attributive reading is NATURAL: facility/group
nouns (`teachers lounge`, `boys club`, `changing room`). A CONCRETE possession (`boys ball`, `girls
coats`, `brothers bike`) has no reading but ownership, so it REQUIRES an apostrophe — it is a second
R, not an O, and printing it unapostrophised gives the item two answers (the fault in four of the
first twelve). So: **an O site is always a natural attributive noun-modifier; a concrete personal
possession is R, never O.** The two tags stay, assigned by the modifier's NUMBER — the site is one
type, the child's reading is what differs:
- **singular modifier** (`school gate`, `kitchen table`) → `en-apostrophe-attributive` — the child
  thinks a noun before a noun shows ownership.
- **plural modifier** (`teachers lounge`, `boys club`) → `en-apostrophe-plural-misplaced` — the
  child senses possession but the apostrophe is not required there.
Hint reworded (annie): `en-apostrophe-plural-misplaced` → "Ownership can be shown without an
apostrophe here. Find the part that cannot manage without one." (the drafted "something does belong
here" was false — the O part is a distractor, nothing needs an apostrophe there).

**MERGED to one O-tag (annie, 2026-08-08).** The collapse above made the attributive/plural split
cosmetic: in `the teachers lounge` NOTHING belongs to anyone — the plural describes the lounge — so
both children read a modifier as an owner, differing only in the modifier's number. Same
misconception with a parameter = **one tag**, `en-apostrophe-attributive`, number as a parameter.
(Test applied: no second hint could be written that the first does not already say.)

**COVERAGE GAP, recorded not lost — the plural-possessive-placement child.** The child who KNOWS
possession is involved but cannot place the apostrophe (`girls' coats`) is a real and common error,
and the reframe cannot reach her: reaching her needs a concrete-possession site, and a concrete
possession is a second REQUIRED answer (the fault that held four items). She is **out of scope for
this family, not for the district** — a parent or teacher would reasonably expect an apostrophe
family to test plural possessives, so the gap is stated rather than left silent.
**v2 note (annie):** the only frame that can test plural-possessive PLACEMENT without ambiguity asks
*where the apostrophe goes* rather than which part needs one — "The girls coats were soaked. Which is
correct: girl's / girls' / girls?" A different shape again; carried to v2.

**A required site must be unambiguous AS PRESENTED, not as corrected (annie, 2026-08-08 — the
general rule, and it is new).** Every trap definition in this district had been checked against the
CORRECTED form. Possessive is the first family where removing the mark changes what the phrase can
MEAN: `the girl's purse` is unambiguous, but the child is shown `the girls purse`, which reads as
girl's / girls' / plural-attributive — three answers. So the singular-determiner well type FAILS
(the determiner fixes number only while the apostrophe is present), and the R-well is **two
constructions, not three**:
- **proper name** — `Toms bike` can only be `Tom's`, because `Toms` is not a word;
- **irregular plural** — `The childrens shoes` can only be `children's`, because `childrens` is not
  a word.
Both survive stripping precisely because the stripped form is not a word — which is why the probe
found them first. (A rescue exists for the determiner type — make the number explicit elsewhere,
"The girl who won the race lost her purse" — but it is long and puts the disambiguator in another
part for the child to connect across; not worth it. Two well types plus position movement is
cleaner.) **Apply this test in the SPEECH probe**, where removing a quotation mark changes which
words are spoken — the same failure mode.

## R17 — Terminal and speech probes: both keep the spot-form, narrowly
*Annie's split hypothesis, probed 2026-08-08 (six sentences each). Recorded by David.*

Both families are MIXED as predicted (R15), but unlike apostrophe the arguable half does not
dominate natural sentences, so neither needs a companion reframe family: the arguable cases are
EXCLUDED BY A BUILD RULE rather than rehoused. **The district stays at twelve families.**

**SPEECH — every unarguable error requires a mark ALREADY PRESENT.** This is the as-presented rule
biting harder than in possessive: there the stripped form was ambiguous but still clearly needed a
mark; here the stripped form may be CORRECT. `She said I am coming home now.` is correct as REPORTED
speech and wrong only as direct — so an item with no marks carries no unarguable error at all.
- Unarguable (all need ≥1 existing mark): **missing closing mark** (opening present); **missing
  opening mark** (closing present); **missing capital** at the start of quoted speech (both present).
- Arguable, therefore EXCLUDED: **terminal placement at a quote boundary** (British "logical"
  placement genuinely permits outside) — and excluded from CLEAN parts too, or a child taught
  "inside" flags a correct part (the comma clean-part failure in miniature).
- Not an error either way: **single vs double marks** — safe in a clean part.
- **BUILD RULES:** every item carries at least one existing quotation mark; no clean part places
  terminal punctuation at a quote boundary.

**TERMINAL — the splice survives; SHORTNESS is what weakens it, not the semicolon.** The semicolon
defence does not rescue a splice: a child arguing "the comma stands in for a semicolon" is still
saying the mark must change, and the spot-form asks only WHICH part is wrong, not what the fix is.
But **short parallel clauses do** rescue it — `It was cold, we stayed in.` is licensed by the
tricolon convention, while `The rain fell all afternoon, we stayed inside the hall.` is not.
- Unarguable: **comma splice on long, non-parallel clauses**; **run-on** (no mark); **fragment**
  after a subordinator.
- Clean parts are safe: correct terminal punctuation (full stop, or semicolon — Year 6) is never
  arguable-wrong, so unlike comma there is no optional-site problem.
- **BUILD RULE:** splice items use clauses of roughly five-plus words, non-parallel in structure.
