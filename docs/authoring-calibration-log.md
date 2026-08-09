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

**The split hypothesis is REVISED, not partly confirmed (annie, 2026-08-08) — and this is the
version to carry forward.** A mixed family splits only when the arguable cases are **COMMON in
natural sentences**, not merely when they exist. Apostrophe split because noun-modifiers are
everywhere and unavoidable; terminal and speech do not, because mark-less speech and short parallel
splices are easy to avoid without straining the prose. **So the test is FREQUENCY, not arguability**
— measure how often the arguable case appears in natural child-level sentences before deciding to
split. Here the arguable cases are excluded by a build rule rather than rehoused, and **the district
stays at twelve families.**

**SPEECH — every unarguable error requires a mark ALREADY PRESENT.** This is the as-presented rule
biting harder than in possessive: there the stripped form was ambiguous but still clearly needed a
mark; here the stripped form may be CORRECT. `She said I am coming home now.` is correct as REPORTED
speech and wrong only as direct — so an item with no marks carries no unarguable error at all.
- Unarguable (all need ≥1 existing mark): **missing closing mark** (opening present); **missing
  opening mark** (closing present); **missing capital** at the start of quoted speech (both present).
- Arguable, therefore EXCLUDED: **terminal placement at a quote boundary** (British "logical"
  placement genuinely permits outside) — excluded from CLEAN parts, **and the exclusion reaches the
  KEYED part too** (annie, 2026-08-08): if the key is a missing closing mark, the correction must
  place the full stop on one side of it, and the WALK SCRIPT would then teach one convention as
  though it were the only one. The child only names the part, so the item holds — but the teaching
  does not. **SETTLED, once, like the serial comma: the platform teaches terminal punctuation INSIDE
  the closing mark for a quoted full sentence.** Every walk script follows it.
- Not an error either way: **single vs double marks** — safe in a clean part.
- **BUILD RULES:** every item carries at least one existing quotation mark; no clean part places
  terminal punctuation at a quote boundary.

**TERMINAL — the splice survives; SHORTNESS is what weakens it, not the semicolon.** The semicolon
defence does not rescue a splice: a child arguing "the comma stands in for a semicolon" is still
saying the mark must change, and the spot-form asks only WHICH part is wrong, not what the fix is.
**Short clauses are excluded, but NOT on tricolon grounds (annie's correction, 2026-08-08).**
`It was cold, we stayed in.` is two clauses in a CAUSAL relation, which the tricolon does not cover,
so strictly it IS a splice. It is excluded because **a child cannot tell the difference**: she has
met "I came, I saw, I conquered", and asking her to judge parallelism is a rhetorical judgement that
is not on the curriculum. Same build rule, sounder ground — and it stops someone later arguing that
a three-clause splice is acceptable.
- Unarguable: **comma splice on long, non-parallel clauses**; **run-on** (no mark); **fragment**
  after a subordinator.
- Clean parts are safe: correct terminal punctuation (full stop, or semicolon — Year 6) is never
  arguable-wrong, so unlike comma there is no optional-site problem.
- **BUILD RULE:** splice items use clauses of roughly five-plus words, non-parallel in structure.

**Speech is N-FREE, by consequence not omission (annie, confirmed 2026-08-08).** A speech N item
needs a properly closed quotation, which puts a terminal-at-a-quote-boundary CHOICE in a clean part;
the alternative — reported speech — has no speech punctuation to consider at all, which is the comma
rung-0 hollowness already rejected. So the family has **no N option at any rung**, which is cleaner
than one that appears at some. Two consequences, recorded so the absence is not later read as a
build gap: **`en-n-option-avoidance` is unreachable in this family**, and **the guessing rate is 1
in 4 throughout, not 1 in 5.**

**Correct full stops stay PLAIN in terminal's clean parts (annie, ruled 2026-08-08) — the trap
principle again.** A full stop between independent clauses is a RULE, not a choice, so the part is
genuinely clean; tagging it a trap would assert a child hesitates there, and a full stop after a
complete sentence is the most automatic punctuation decision in English. No lookup change. **This is
the THIRD family where the trap principle keeps something in the clean set that a mechanical test
would have flagged** — after `right`/`walk` in silent letters (silent but automatic) and `happens`/
`summer` in double letters (doubled but audible). The pattern: a mechanical test finds the FEATURE;
the trap principle asks whether the child gets a signal she can rely on.

## R18 — Cloze: the deciding factor is TYPED, and two of the four types are forbidden
*Annie, 2026-08-08, recorded before the cloze build. Recorded by David.*

The permissiveness fact that shaped the whole punctuation subtype **does apply to cloze** — not to
its form (nothing is marked wrong) but to its CONTENT. At rung 3 all four options parse, so the key
is decided by sense, grammar, register or collocation — and **register and collocation are exactly
the dimensions where English permits more than one acceptable answer**: `she walked quickly` and
`she walked fast` are both fine. A rung-3 cloze item decided on register carries a defensible second
answer, in the same way a comma at a phrase boundary did.

**The rule, built in from the start rather than probed for:** every cloze item DECLARES its deciding
factor, typed, and the type gates the rung:
- **`grammar`** (the sentence's syntax forces one form) — SAFE at every rung.
- **`sense`** (only one option is true of what the passage says) — SAFE at every rung.
- **`register`** (one option fits the tone better) — **FORBIDDEN as a deciding factor**; a second
  answer is defensible.
- **`collocation`** (one option is the idiomatic partner) — **FORBIDDEN**, same reason.
So rung 3 — all four parsing — is reachable only where the decision is grammatical or semantic.
Expect the three cloze families to land where the punctuation ones did: a real ceiling, stated.
This also discharges the vr-04 discipline named earlier: if the author cannot write one sentence
saying why the key beats each distractor, the option comes out — the declared factor IS that sentence.

**THE FOUR STEMS, SETTLED (annie, 2026-08-08).** "Read the sentence." is dropped from the spot stem
— every item implies it, and it delayed the one word that distinguishes the tasks. `needs` was
REJECTED in favour of `must have but does not`: the whole reframe rests on required-vs-acceptable,
and a child reading "needs a comma" as "could take a comma" picks an optional site and is right by
her own reading — the defensible wrong answer the longer wording closes. Shortness is not worth that.
1. **SPOT** — "One part has a spelling mistake. Which part is it? If every part is right, choose N."
2. **COMMA** — "One part must have a comma but does not. Which part is it? If every part is right, choose N."
3. **APOSTROPHE** — "One part must have an apostrophe but does not. Which part is it? If every part is right, choose N."
4. **CLOZE** — "Choose the word that fits the gap best."
The contrast lands at word three: **has** (something is wrong) vs **must** (something is missing),
with **Choose** at word one. Stems 2 and 3 sharing three words is correct — the task IS the same,
only the mark differs.

**CLOZE HAS NO N, DELIBERATELY (annie, 2026-08-08).** "None of these fits" is a different claim from
"every part is right": in a gap-fill one option is better than the others BY CONSTRUCTION. An N
option would either never be the key — teaching her to ignore it — or be the key sometimes, which
concedes that no word fits, and then the item is broken. **Serving requirement:** the eleven other
families render a fifth labelled option and cloze renders four, so the VISUAL difference must carry
the signal the stem cannot. Verified in the authored corpus (error-spot items hold 5 options with N;
cloze items hold 3–4 with none), but **no renderer exists for the generated families yet** — this is
a requirement on the serving build, not yet a verified fact.

**Tense sequence — the factor must be FORCING, not merely preferable (annie, 2026-08-08).** Tense is
grammatical only where the sentence contains a marker that forces it (`Yesterday`, `By the time the
bell rang`, a subordinate clause carrying its own tense). Without one it is stylistic: `she has
finished her homework` and `she finished her homework` are both fine in isolation. So a rung-3 tense
item MUST contain a forcing marker and **the declared factor must NAME it** — otherwise "grammar"
gets claimed for items where the grammar does not actually decide. Same shape as the required-site
test in comma.

**Cloze tiers, ruled (annie, 2026-08-08).** Word class **T2**; tense **T2 + T4** (the T3 gap is
correct — inventing a rung there would mean a tense that is *preferable* rather than forced, which
R18 forbids); connectives **T3**; question tags **T2, not T3**. The tags reasoning is worth keeping:
matching subject, auxiliary and polarity *sounds* harder than a single slot, but the child is
SELECTING, not deriving — `are you` / `isn't it` / `don't you` are audibly wrong to any native
speaker before analysis, and tags are among the last things a native speaker gets wrong in speech.
**Difficulty that looks like it is in the content and is absent in practice — the vr-04 problem
mirrored.** T2, revisited if serving data shows T2-rate failure; that is measurable, and the
judgement is a prediction, not a fact.

**Tense's T4 well widened 2 → 7 (2026-08-08), on the two patterns that genuinely FORCE.** Two items
is a pair, not a tier. Of the three constructions proposed, only one met the forcing test annie
herself set: `before we reached the station, the train had left` and `after she had finished, she
went out` both accept the past simple equally ("the train left before we reached the station"), so
the perfect is PREFERRED, not forced — R18 forbids them; and `she had already eaten when we called`
is genuinely forced but has only ONE parsing option, making it a T2-shaped item. The two forcing
patterns, both already in the bank, were extended instead: **(a) coordination with a past-simple
verb** forces past simple (`the cat ___ out and vanished`); **(b) `by the time` + a completed prior
event** forces past perfect (`by the time the bus came, we ___ for an hour`). T4 tense is now 7.

**TIER WEIGHTS — for whoever owns the English blueprint, with the REASON, not just the number.**
Across all thirteen SPaG families: **T1 41 items (23%) · T2 59 (33%) · T3 47 (26%) · T4 33 (18%)**,
and T4 is served by only **six** families — the four spelling families, speech, and tense.
**The top tier needs unarguable difficulty, and difficulty is where arguability lives.** Every
punctuation family capped at T3 because the constructions that would make a T4 item are precisely
the ones English permits two forms of; spelling reaches T4 because a misspelling is binary at any
level of difficulty. So the shortfall is a CONSEQUENCE, not a gap, and the fix is not more
punctuation families. It is either accepting that **English T4 is a spelling-and-comprehension
tier**, or building T4 out of **comprehension** — the second reviewer's district, where the
genuinely hard unarguable questions live. A paper weighted to spelling at the top is defensible; one
that pretends to an even spread it cannot supply is not. **Design question, to be ruled before import.**

## R19 — CONDITIONS ON THE SPaG SIGNATURES (not findings — they need an owner)
*Annie, 2026-08-08, closing the SPaG district at 13/13 signed. Recorded by David.*

Three requirements accumulated across the build sit on the SERVING and RENDER paths. Each is
something a signature ASSUMES to be true and cannot itself guarantee, so each needs an owner:
1. **The cloze four-option render.** Cloze has no N, deliberately; the other eleven families render
   a fifth labelled option. The VISUAL difference must carry the signal the stem cannot, or a child
   who has learned that N is always there will hunt for it in a timed test. (Verified true of the
   authored corpus — error-spot items hold 5 options, cloze 3–4 — but **no renderer exists for the
   generated families**, so this is a requirement, not a verified fact.)
2. **The comma mirrored-pair same-session constraint.** The fronted/trailing pairs are the district's
   ONLY sanctioned repeated sentence, allowed because the repetition teaches the contrast. Served to
   one child in one session they become a giveaway. The two ids are a LINKED PAIR, not independent
   items, and the serving layer must honour that.
3. **Per-family depth sizing.** Depth varies from 4 to 24 across the thirteen and cannot be applied
   as one number. Every signature carries its own figure; serving must respect them individually.

**And a product decision, not a content one: the English T4 ruling.** T4 is served by six of thirteen
families and holds 18% of items, because the top tier needs unarguable difficulty and difficulty is
where arguability lives. Either English T4 is a spelling-and-comprehension tier, or T4 is built out
of COMPREHENSION — the second reviewer's district, where the hard unarguable questions live. To be
put to the blueprint owner **with the reason, not the number**: the number reads as a shortfall and
it is a consequence.

**Depth correction on signing (2026-08-08).** The reviewer's recalled depths came from the presented
sample, not the built banks: word class is **6** (not 4), connectives **6** (not 4) — more than
signed for, no defect — and tense T2 was **4**, not the 8 signed for. Rather than correct a signature
downward, the definite-past well was WIDENED to 8 (Two days ago / Last summer / Yesterday morning / A
week ago), so the signed figure is true. A signature carrying a wrong depth is a defect; checking the
built bank against the recalled figure is part of signing.

## R20 — Vocabulary in context: the sense flip, the guard, and a T2 floor
*Annie, 2026-08-08. Recorded by David.*

**THE SENSE FLIP.** An earlier build tested the LESS-familiar sense in 16 of 18 items at every tier.
That is not merely a flat difficulty axis: the family then only ever asks "do you know the second
meaning?", when the skill it is named for is **letting the sentence tell you which meaning is live**.
A child who learns the trick scores 16/18 without reading a sentence — the vr-04 shortcut inside the
family's own mechanism. So the familiar sense is tested at the bottom (rarer sense as the trap) and
the rarer sense at the top. Two declared variables, and the flip is mechanically checkable against
the vault's `likelierKnown`: **tier <= 2 iff familiar**.

**THE GUARD.** A familiar-sense item may exist only where the HEADWORD is itself within reach of the
tier — vault tier <= 2. Otherwise the child is not choosing between senses, she is being asked
whether she has met the word at all, and no amount of sentence-reading rescues a word she does not
know (`warrant` at T2 was the case that showed it). Cards failing the guard contribute their
rare-sense item ONLY. Second checkable condition, on top of the flip.

**THE FLOOR IS T2, and the reason is a property of the VAULT, not of the question type.** Only 9 of
23 Mode A cards clear the guard, and just 3 sit at vault T1 — a pair and a half, which by the
tense standard is not a tier. So there is no T1: **two-sense words easy enough for a secure Year 4
child are rare, because a word must be common enough to be known TWICE OVER.** Recorded so that "no
T1" is not later read as a gap to fill by hunting for words that do not exist.

**ROUTE (b) COLLAPSES INTO ROUTE (a) — probe result, 3 cards.** Mode B cards were rejected for BARE
items because the FAMILIAR sense is broad and has no clean distractor space. Their RARE senses are
narrow and do: `dear` = costing much more than expected, `mature` = fully grown, `superior` =
behaving as if better than others. All three carry a clean rare-sense item. So route (b) is NOT 13
purpose-authored discrimination cards — it is 13 rare-sense-only cards, the same shape as a
guard-failing Mode A card, and much less authoring than scoped.

**Final shape: 35 items — T2 9 · T3 9 · T4 17.** The family is the district's LARGEST T4 contributor,
against a district T4 that was its thinnest tier. A constraint that looked like a cost three rounds
earlier ended by making the family bigger and filling the tier that needed it.

**PLAUSIBILITY, not just form — the fault the form audit cannot see (annie, 2026-08-08).** In the
first probe the two non-sense fillers were transparently wrong (`too small to wear` against a carrier
about savings), so a child who had never met the rare sense could reach the key BY ELIMINATION: the
item tested whether she could rule out the familiar sense, not whether she knew the rare one. The
fillers were doing T1 work in a T4 item. **The fix is the fillers, not the trap:** each must be
plausible AGAINST THE CARRIER — grammatical in the frame and topically consistent — so that every
wrong option sounds possible until you look properly (the vr-04 distractor-closeness rule). Checked
across all 35: 18 items had a filler that was ungrammatical in its frame (`quick to count very
carefully his argument`) or topically disconnected (`heavy to lift` of a tree); all rewritten.
**No heuristic catches this** — it is a judgement about meaning, and it is where the remaining risk
in the family sits.

**LIKELIER-KNOWN IS THE SENSE SHE CAN USE, NOT THE ONE SHE HAS SEEN (annie, 2026-08-08).** The vault's
`likelierKnown` feeds the vocabulary flip, which carries a signature — so a wrong value produces an
item labelled RARE that tests the FAMILIAR sense, the exact shortcut the flip closes. Four values were
INVERTED because whoever populated the field ranked EXPOSURE: `passive` claimed the grammar sense,
`genuine` the honest-about-feelings sense, `valid` the official-and-unexpired sense, `animated` the
cartoon sense. **`animated film` and `the passive voice` are LABELS a child recognises; they do not
give her the word.** All four corrected B→A in the DATA (`scripts/fix-vault-likelier-known.ts`), not
worked around in the bank, so the next reader is not misled too.
**Pass over all 67 two-sense cards:** 8 carry lk=B; those 4 are wrong; `capital`, `mature` and
`passage` are RIGHT (a child can use each — "start with a capital", "be mature", "read the passage");
`condemn` is borderline and left alone. From the lk=A side, **`noble` is raised as the reverse
candidate** ("brave and good" may be more available than "from an old family of lords") and left for
the reviewer. So the field is 4 wrong in 67 — not systematically exposure-ranked, which is a
reassuring result for an axis that carries a signature.

**A RARE SENSE THAT IS A LABEL CANNOT BE TESTED AT ALL (annie, 2026-08-08) — the `passive` test.**
The same argument that corrects `likelierKnown` also DISQUALIFIES some cards. If the rare sense is
one a child RECOGNISES but cannot USE, an item on it asks her to parse an unfamiliar paraphrase of a
concept rather than to read a sentence: `passive` = "built so it does not say who acted" is
metalanguage, and **a T4 vocabulary item must not require metalanguage**. `passive` DROPPED.
`condemn` stays out for the related reason — BOTH its senses are late, and a card whose two senses
are both unfamiliar makes no good item at any tier, whichever way the flip points.
**`noble` was the fifth inverted card** (5 of 67, still not systematic): brave-and-good is the child
sense, born-into-a-titled-family the Tudor-lesson one. Flipping it moves the aristocratic sense into
the RARE slot, where it fails this very test — so `noble` is corrected AND re-tiered T3→T2 (defensible:
brave-and-good is a Year 4 sense), and carries a FAMILIAR-only item. Two consequences worth seeing:
the flip and the guard interact, so a correction can change which HALF of a card survives; and a card
may legitimately contribute one item rather than two, in either direction.

**Instrument note.** The option-form audit is a heuristic: it separates "to …" / noun-phrase /
gerund reliably, but recognises adjective phrases only from a word list, and produced false
positives three times (`something`, `warm and friendly`, `fully grown and ready`). It catches gross
form mismatches; adjective-phrase items still need an eye.

**THE FILLER BAND — "plausible but not a synonym" (annie, 2026-08-08).** This is the vr-04 gate
arriving as an AUTHORING CONSTRAINT rather than a check, and it is what makes this family's fillers
slow to write. Each of the two non-sense options must be **plausible against the carrier** — grammatical
in the frame, topically consistent — so the elimination route is closed; and simultaneously **must not
drift into a synonym of the key**, or it is a defensible second answer. Options rejected on the second
half while authoring: `to prop up firmly` (lean), `to make necessary` (warrant), `to argue with
someone` (bait), `still hard and green` (mature). The test is the vr-04 one: *if you cannot write the
sentence saying why the key beats it, the option comes out*. **Expect this band to be narrowest on the
Mode B cards**, whose familiar sense is broad by definition — the trap writes itself, the fillers do not.

## R21 — The comprehension pilot (ENG-004): gate reversal, scoping, and the T4 ruling
*Annie, 2026-08-08, on the twelve-item Anne of Green Gables cluster. Recorded by David.*

**THE ONE-DIFFERENT-MISCONCEPTION-PER-OPTION GATE IS REVERSED.** Two distractors MAY share a tag
where both genuinely instantiate it — precedent: the lineup-counting split she reversed, and NPV-01's
two #61 distractors. Six of thirty-six tags in the pilot went OUTSIDE their own scope because the
honest tag was already taken, **so the gate caused the fault it was meant to prevent**. Replaced by
the check that matters: *every tag satisfies its own library entry's scope test, including
qualifiers.* The gate lived in Cowork's `verify-eng004.py:77`, not in the platform — the platform
never had it. **Mechanisable only in part:** tag-exists-and-is-ACTIVE and a per-distractor
execution statement are checkable; whether the distractor actually falls inside the entry's scope is
not, because entries carry prose descriptions, not structured qualifiers. Same division as the
plausibility finding — the machine checks presence, the reviewer checks fit.

**MOTIVE vs PLAUSIBLE, scoped on reason-versus-fact.** `en-motive-invention` covers a REASON,
INTENTION or WISH the text does not give; `en-plausible-not-stated` covers a FACT or EVENT it does
not state. Applied: AGG-06 option D ("wants Marilla to drive the horse home") is a wish →
motive-invention, now permitted alongside option C under the reversed gate.

**AGG-02 REBUILDS, it does not narrow.** The window is [6,7]; line 7 carries "expectation" (line 6
"tense rigidity"), giving in-window support to the opinion distractor — and the window CANNOT be
narrowed because the quoted phrase "her attitude and expression" is itself on line 7, so citing less
loses the quotation. The distractor was replaced. **Her convention, stated symmetrically: disposal
evidence sits INSIDE the cited window, AND no in-window text supports a distractor.**

**T4 BLUEPRINT RULING (David, 2026-08-08).** English T4 is **spelling, vocabulary, and roughly thirty
comprehension items** — the blueprint is set against that, not against a 25% comprehension share it
cannot reach. **The yield finding:** T4 hooks are NOT rare — 12 of 15 extracts carry at least one (a
double description, a say/do gap, an unreliable observation; 8 strong, 4 moderate, 3 weak). But a
say/do gap supports **two or three questions, not six**, so fifteen extracts yield ~30 T4 items
against the ~90 a 25% share would need. **The constraint is hook YIELD, not hook scarcity.**

## R22 — Urgency language is ROLE-SCOPED, and the headword exemption cannot reach it
*Annie's principle, ruled by David, 2026-08-08. Recorded by David.*

**No list entry. Role-scoped instead:** `hurry` / `quickly` are barred where the platform ADDRESSES
the child (`hint` — which covers hints AND walk scripts — and `instructions`) and permitted where they
are CONTENT (`word-card` definitions, `item-option`, passage-derived stems). Implemented as a third
ban band, `stanceOnly`, applied by role in `checkBannedVocabulary`.

**Why a flat list entry was impossible.** It would have caught 18 things, and nearly all were
legitimate: **10 word cards whose HEADWORD MEANS the banned word** — `hasty` ("in a hurry"), `nimble`,
`brisk`, `agile`, `scurry`, `flit`, `alacrity`, `seize`, `spring`, `animated` — plus vocabulary items
testing exactly those synonyms. A district cannot teach `hasty` while banning `hurry`.

**THE FINDING WORTH KEEPING: `headwordInOwnCard` cannot cover this shape.** The exemption masks
occurrences of THE HEADWORD when the headword itself trips a rule. Here the banned word sits in the
DEFINITION — `hasty` does not match `/hurry/`, so nothing is masked and the card fails anyway. It is
the same class as the ABOUT-language principle (a word may appear because it is what the text is
ABOUT), in a form the existing exemption does not reach. **Worth knowing before the next rule of this
kind: an exemption keyed to the headword protects the headword, not its gloss.**

**What the role-scoped version actually catches — and the residual over-fire.** Across all content:
**0 misconception hints, 3 walk scripts, 10 definitions correctly permitted.** But all three
walk-script hits are FALSE POSITIVES by annie's own `mistake` test — each describes the TEXT, not the
child's pace: "a happy animal in far too much of a hurry to be polite" (the Mole), "'Smartly' tells
you he went quickly" (a gloss), "the room's quick view sounds like a fact" (the room's judgement).
**THE RESIDUAL FINDING — the honest limit of the rule. Role-scoping separates FIELDS, not STANCE.**
A walk script legitimately holds BOTH instruction to the child AND description of the passage, and no
mechanical rule tells them apart. The rule is a **large improvement, not a clean one: 18 catches → 3,
with every vocabulary card surviving.** Any future stance rule will meet the same limit, because the
distinction it rests on is a judgement about who is being addressed, not a property of the field.

**Resolved by rewording rather than exempting (David, 2026-08-08).** The three were reworded — "in far
too much of a **rush** to be polite", "he went **at speed**", "the room's **hasty** view" — so the rule
now fires **ZERO** across all content while still permitting the ten definitions. Rewording beats a
permanent exception list: the rule keeps guarding against real stance drift, and nothing has to
remember why three items are allowed to break it. (`scripts/reword-urgency-walkscripts.ts`.)

## R23 — Declare the passage's word; reword only what is ours (2026-08-08)

*(Logged as R7 in Cowork's partial copy before the canonical number was known. Renumbered to R23 on
confirmation; R7 here remains the option-label rule and is cited elsewhere.)*

The R4 mechanism now works on **walk scripts and hints**, not only stems. The gate was
reading `stem.quotes` while the contract puts them in `explanation.quotes`, so declarations
made in the right place were being ignored and passage vocabulary was measured as ours.
Fixed.

**Consequence for authoring — ask whose word it is before touching it:**

| the word is | do this |
|---|---|
| the passage's own word | **declare it** in `explanation.quotes`. Do not reword around it. |
| our paraphrase of the passage | prefer **replacing it with the passage's own words**, then declare. Reword only if no passage phrase fits. |
| our own instructional word (*semicolon*, *paragraph*, *comparison*) | **reword**. Nothing to declare. |
| a character's name | a character's name from the passage may be declared as a passage noun and is then exempt; a name not in the passage is reworded. |

**Worked examples from this pass:**

- *ENG-001-WIW-19* — "He unfastened a rope earlier." `unfastened` is the passage's word at
  line 59. Declared, not reworded; the hint now shows it as a quotation.
- *ENG-001-WIW-14* — "…beside a good storyteller?" `storyteller` was our paraphrase, and it
  is the word R4 already names as this item's teaching case. Replaced with the passage's own
  `exciting stories` and declared, rather than reworded around.
- *ENG-002-pp-21* — "The words after the semicolon describe Elizabeth." `semicolon` is ours and
  stays as the item's one permitted long word; `Elizabeth` is the passage's name and is DECLARED.
  (An interim reword removed the name to satisfy a rule that does not apply. Reverted 2026-08-08 —
  it was a cost paid for nothing, and the original hint is the better one.)

**Passage proper nouns — ruled.** A proper noun that appears in the passage may be
**declared as a named token** and is then exempt from the vocabulary and long-word ceiling
within that item. Same machinery as `testedTokens`, a sibling field:

```
"passageNames": ["Elizabeth"]
```

Three limits, so this stays a carve-out and not a hole:

1. **It must be the passage's name.** Verified in code against the passage file, exactly as a
   quotation is. A name we invent for a worked example is our word and gets reworded.
2. **The exemption is from the ceiling only.** The ban list, the sentence cap and reading age
   all still apply to the sentence the name sits in.
3. **Declared, not automatic.** Declaring it is what records that the author checked whose
   word it is, which is the same discipline the quotation rule rests on.

The reasoning: the ceiling exists to stop *our own* wording out-running the child, and a name
is not vocabulary the child has to decode — the passage has just spent 900 words teaching it.
Across the live DB the rule bites on **Elizabeth alone, in six items**. The names sit mostly
in stems and options, where the only alternative is declining to name the character the
question is about. Every passage has a protagonist, so this recurs by construction rather
than by accident.

*(An earlier draft of this entry said 12 occurrences across three names. That figure came
from a local screen built to over-flag, and it was wrong: Netherfield and Derbyshire are
three syllables and never reached the ceiling. Corrected against the implementation.)*

**IMPLEMENTED 2026-08-08.** `passageNames` on the stem, exempt in the long-word filter beside
`testedTokens` (`content-gates.ts`); limit 1 verified by `pnpm check:line-refs` against the passage
file; limit 2 holds because only the ceiling filter consults it. Proven both ways: *"Elizabeth
understood immediately."* fails `2 long words (max 1): Elizabeth, immediately` undeclared and passes
declared, while a banned word in the same sentence still trips. Regression test in
`content-gates.test.ts` covers both directions so the carve-out cannot quietly widen.

## R24 — A ruling that refines an earlier one EDITS it; it never just appends
*Annie, 2026-08-08. Recorded by David.*

When a ruling refines an earlier one, **the earlier text is edited**, not left standing beside the
new one. If the earlier text belongs to someone else, **flag it and get it edited** rather than
leaving both in the log.

**Why it needs to be a rule: this is the second instance.**
1. **`en-plausible-not-stated` against `en-motive-invention`** — two entries whose scopes overlapped,
   so which label an item got depended on which entry was written first. Resolved by scoping them
   against each other (R21), not by either entry admitting the other existed.
2. **R23's table against R23's own ruling** — the row said a character's name is reworded; the
   passage-noun ruling below said it may be declared and exempted. Both were hers, written at
   different times, and the ruling was the one she meant. An author reading the table alone would
   reword a name they could declare — which is exactly what happened to `ENG-002-pp-21`, whose hint
   lost the character's name to satisfy a rule that did not apply, and has now been reverted.

Same shape both times: **a later, more specific statement added without going back to the earlier
one.** Worth its own rule because the calibration log is now long enough that nobody reads it end to
end — so a contradiction does not announce itself, it just quietly produces the wrong item.

**The practical test:** before adding a ruling, search the log for what it refines. If the earlier
text would now mislead someone reading only that entry, edit it. An annotation saying "these two
disagree" is not enough — it leaves the wrong text in place for whoever reads the table and not the
note. (This entry supersedes such an annotation, which was added to R23 and has been removed.)

## R25 — When a value carries a signature, send the VALUE, not an account of it
*Annie, 2026-08-08. Supersedes the "quote the whole field" reporting note. Recorded by David.*

**Depths from the bank. Hints from the field. Ranges from the generator.** Where a reviewer's
signature will rest on a value, that value is sent as it stands — not summarised, not truncated, not
recalled, not quoted in part.

**Her reasoning: a summary is a door into her judgement and there is no guard on it.** It is the same
fault as the seven ungated import scripts, one level up. Those wrote unchecked content into the
database; a summary writes unchecked content into a signature. The gate on one is code; the gate on
the other is this rule.

**The instances, all from this build:**
1. **Depths signed from a presented sample rather than the built bank.** Word class was 6 not 4,
   connectives 6 not 4, and tense T2 was 4 where 8 had been signed for — caught only because the
   banks were counted before the signatures were recorded.
2. **Tier rules describing generators that did not exist.** Sample sheets stated number ranges the
   generator never read, so the sheet described an intention rather than the family.
3. **`likelierKnown` values populated by exposure rather than meaning.** Four were inverted, and the
   field feeds the vocabulary flip — so a summary judgement about a word became a wrong item.
4. **Four figures supplied from memory**, each costing a round trip: 21 passages against 19, "12
   occurrences" against 6, a 13-field drift reported one-directional when it ran both ways, and a
   hint quoted as its failing sentence rather than its whole text — which came back as a redraft
   missing a leading sentence the DB had all along.

**The practical form.** A reviewer asking for a value gets the export, not the prose: the library
read path (`export-misconception-library.ts`), the proposed queue (`export-proposed-misconceptions.ts`),
the bank counts, the generated sample. Prose may accompany the value; it may not stand in for it.
And a proposal against a value is written as a TRANSFORM against the quoted text, because a
transform survives a stale copy where a rewrite does not.

## R26 — The record beats the transcript
*Annie, 2026-08-08, ratifying `vr-form-without-meaning`. Recorded by David.*

**A reviewer's file is the transcript of what she WROTE. The database is the record of what was
APPROVED. Where the two differ, the record wins.** This is the transform ruling one level up: apply
the transform, do not reimpose the text.

The case: `vr-form-without-meaning` was stored in a parenthesised form — "Read the whole sentence
(or picture the word written in a book)." — because the reviewer had instructed that the transform,
not her text, be applied to the DB's own wording. The character-for-character diff at ratification
therefore found the one entry that differed from her file, which is exactly what that diff is for.
Ratified as stored.

**Consequence:** a diff against a reviewer's file is a QUESTION, not a fault. It asks whether the
stored text is right, and the answer may be that the file is the stale side. Report it and let the
reviewer rule; do not "restore" the file's wording on the assumption it is authoritative.

**A readability note carried, not acted on** (recorded on the entry itself, so it travels with the
record rather than living only here): brackets are not neutral in child-facing copy, and a suspended
clause is slightly harder for a nine-year-old than the comma version. It passes the gate and stands.
It is a candidate for any future pass on hint READABILITY — which is a different job from the
COMPLIANCE the gate performs, and worth naming as such: the gate can tell you a hint is permitted,
never that it is easy to read.

## R27 — Content ages visibly; status ages silently
*Annie, 2026-08-08, after the tenth delivery failure. Recorded by David.*

**Any artefact mixing CONTENT with STATUS ages silently, and must say so on its face.**

Her distinction: a **content** snapshot stays true until the content changes, and that change is
visible to anyone comparing it against the live thing. A **status** snapshot is stale the moment
the status changes, and nothing in it says so. The fourteen-entry proposed queue was **dangerous
rather than merely out of date** because it looked like a valid queue — one entry had been ratified
between export and reading, and the file offered the reviewer no way to know.

The sharper form: *a content export that loses a race is a stale copy; a status export that loses a
race is a wrong instruction about what to work on.*

**The guard, hers — the one that made the NVR fingerprints work:** a generated-at timestamp plus
the hash of the thing the artefact describes, so a reader can tell whether it has moved.

Applied at three levels:

1. **Exports** declare `snapshotOf: content | status | mixed` and what they describe. Status and
   mixed artefacts must carry a builder in `check-export-freshness`, so staleness is DETECTABLE and
   not merely recorded; a status kind with no builder now reports `UNCHECKABLE-STATUS` instead of
   being skipped as an unknown kind. The stamp goes in the document a human opens, never only in a
   JSON sidecar — the reviewer-status pair had the guard on the file nobody opened.
2. **Signatures** carry `AttributionEvent.subjectHash`, the fingerprint of the family's generator
   surface at signing. A regenerated family now reads as a signature describing a superseded
   version. `pnpm audit:signed-depth` reports it.
3. **Status tables are generated, not maintained.** `maths-approved-families-proposal.md` had
   drifted three ways at once — internally inconsistent (M-inverse both PROPOSED and BUILT),
   overtaken by reality (all 19 families signed since), and unstamped, so neither was detectable.
   Replaced by `pnpm export:family-status`.

**A corollary worth stating, because it inverts the usual reading:** the depth figures on the SPaG
signatures do not equal the generator's depth, and that is a UNITS problem, not drift. The notes
count bank sentences; an N-keyed family yields two items per sentence. Six of thirteen differ for
exactly this reason. A figure carried in prose has no units, so nothing could ever have caught it —
which is the general argument for measuring rather than asserting.

## R28 — The handover is a step, not a bug
*David and annie, 2026-08-08, after the tenth delivery failure. Investigated and reported by Claude.*

**The last hop cannot be observed from this side, so it stops being counted as a delivery bug and
becomes a handover step that a human confirms.**

`deliver()` was built after three failures on the theory that the fault was a forgotten manual copy.
It fixed that hop — the write is proven, by path, byte size and content hash — and left the NEXT hop
unwatched, which is why the counter ran to ten. Every one of the ten is consistent with "written
correctly, never collected".

**What was tested, and what each is worth:**

| signal | verdict |
|---|---|
| `atime` | Recorded, but ANONYMOUS and CONTAMINATED — reading a file to check it moves its own atime. Demonstrated: 22:59:37 → 23:25:57 from nothing but the check. It cannot distinguish a reviewer from a `grep`. |
| Spotlight `kMDItemLastUsedDate` / `kMDItemUseCount` | Not available — the folder is not indexed. |
| `com.apple.macl` | A real but one-bit signal: an app was granted access via a user picker. UNDATED, ANONYMOUS, and absent for anything read by a CLI. Six files in the drop carry it; **no queue or status export ever has** — consistent with pickup being a manual upload that these files have never been through. Suggestive, not proof. |
| A sync layer | **None.** No cloud provider on the path. The drop is a plain local folder; nothing pushes from it. |
| A consumer-side manifest | Does not exist, and by design cannot: nothing on the far side writes into the drop. |

**So it is structurally outside what this repo can see.** Observing the hop would require a return
signal, and the consumers are a human reviewer and a separate agent — neither instrumentable from
here. No amount of care on the sending side closes it.

**What was done instead — invert the check.** `pnpm export:drop-manifest` publishes every file in
the drop with its byte size and content hash, so the READER can verify what she holds rather than
the sender trying to prove what he sent. "Do I have the current queue?" becomes one hash comparison
instead of a filename recalled from three messages ago. The manifest is itself subject to the hop,
and that is the point: **if she has it she can check everything; if she has not, the handover is
broken and we know at once rather than on the tenth attempt.**

The general form, which is the same move as the freshness stamp one level out: *a guard that cannot
see a fault directly can still make the fault answerable from the other side.*

**A related invariant is already broken and should be fixed separately.** `from-cluecrew` is
specified as outbound-only — "what this repo SENDS is never mixed with what authoring sends back" —
yet four inbound files sit in it (`ENG-004-anne-green-gables.json`, `en-hint-redraft.json`,
`vr-hint-redrafts.json`, `vr-hint-redrafts-corrective.json`). Not the cause of the ten failures, but
it is the exact confusion the separate folder exists to prevent.

## R29 — Declared is not enforced: the sweep
*Annie, 2026-08-08. She asked it as a sweep rather than waiting for a fourth instance. There was a
fourth, and a fifth.*

**The mechanism, once:** a generator's declaration and its enforcement live in different places, and
only the DECLARATION is visible in review. A reviewer signs a sample sheet showing tier rules,
structural parameters and number ranges; whether the generator obeys any of them is a separate
question that the sheet cannot answer.

**The sweep, complete:**

| declaration | enforced? | where |
|---|---|---|
| number ranges | **yes** | `assembleItem` / `assembleSpagItem` — the original lesson |
| key recomputes from its solution | **yes** | `assembleItem` |
| house notation (£, °C, cm²) | **yes** | `checkMathsNotation` inside the item gate |
| every distractor carries a misconception tag | **yes** | `assembleSpagItem` |
| child-facing text (length, ban list, reading age) | **yes** | `checkItemChildFacing` |
| **tier ladder — SPaG** | **was NOT** — fixed 2026-08-08 | `tiers` reached only `tierRule` |
| **tier ladder — MATHS** | **was NOT** — fixed 2026-08-08 | **10 of 19 families**, every collapsed one, drafted at all four tiers they do not claim |
| **structural parameters** | **NO — still open** | used for sample sheets, ladder-gap checks and the fingerprint; never compared to the emitted item |
| near-miss count per rung | by construction | the bank's `intended` is verified against a derived property, and drafting selects by rung — sound, but not asserted on the emitted item |
| diversity / dedup / matched-pair caps | partially | enforced in `generateSpagSample` only; a caller using `assembleSpagItem` directly gets none |
| serving conditions (R19) | **no owner** | unchanged |

**The maths instance was the largest and the quietest.** Every caller in the repo went through
`familyTiers`, so the ladder held by habit; nothing made it hold by rule. A family signed as a fair
T2 item was one direct call away from emitting a T5. The test suite was itself relying on the gap —
`generateSample(M-06a, 3, …)` asked a family collapsed to T2 for a T3 item and got one.

**`structuralParams` is the one left, and it is left deliberately.** Enforcing it means deciding
what each parameter MEANS operationally — is `segments: 4` a promise about option count, and is
`nearMissParts: 3` a promise the emitted item must keep? Those are reviewer questions, not
engineering ones. It is also the largest remaining exposure, because it is literally the column on
the sample sheet a signature is given against. **`spag-punct-terminal-boundary` above its ceiling
emitted items stamped `nearMissParts: 3` whose sentences were the rung-TWO bank entries** — a
declared parameter describing an item that was never built.

## R30 — The ceiling was the substance of the signature
*The T4/T5 reproduction, 2026-08-08.*

Annie signed `spag-punct-terminal-boundary` at T1–T3 because rung 3 needs three required-comma parts
in one sentence and that does not occur without strain. Forced past its ceiling, the family did not
strain — it **degenerated**:

- **Every item it emitted at T4 and T5 was keyed "No mistake".** The bank tops out at two near-miss
  parts, so no genuine rung-3 item could be built; the family fell through to its N branch, which
  draws at rung minus one. A tier whose answer is always the same option is not a hard tier.
- **T4 and T5 emitted the SAME two items.** Above the ceiling the ladder is one rung, twice.
- The items carried a structural parameter describing a rung they were not built at (R29).

**No live consequence.** No generated SPaG item has ever been persisted or served: the only callers
of the generator are three build-time scripts, the web app contains no reference to it, and the 34
SPaG items in the database are Cowork-authored DRAFTs with zero attempts against them. Confirmed
rather than assumed, because "build-time only" is exactly the belief that stops being true quietly.

The general point, worth more than the instance: **a reviewer's stated reason for a limit is a
prediction about what lies beyond it, and it can be tested.** This is the only case in the project
where that comparison was available, and the prediction was right.

## R31 — Every structural parameter is a promise about the emitted item
*Annie, 2026-08-09. Applied and swept. Her wording throughout.*

**A parameter is computed at emission and asserted by the generator — never the bank row it drew
from.** The sample sheet is what a reviewer signs; without an assertion the sheet could say one
thing and the generator do another, and only the sheet was ever visible in review.

**Her test, for any parameter anyone adds later:** *could you recompute this from the emitted item
alone?* **Yes** → it is a promise, assert it. **No** → it is not a parameter about the item; put it
in family metadata, off the sheet.

| parameter | ruling | how it is recomputed |
|---|---|---|
| `nearMissParts` | asserted | parts of THIS item holding a trap, by the family's own lookup, over the options that are neither the key nor N. One expression covers both shapes: error-keyed drops the error part; N-keyed keeps all four, so the slot that would have held the error counts if its correct form holds a trap — which is exactly why an N item draws at rung minus one and still honours the rung. |
| `segments` | asserted | the parts the sentence splits into. **Not option count** — comma and possessive are three-part with an N option, so four segments would be wrong and four options right. |
| `options` | asserted | option count, declared separately now the two have provably parted company. |
| tier ceiling | asserted | at emission, not at rule-string printing. A family that cannot honestly reach T4 must not emit T4. |
| number ranges | asserted | already generator-consumed; listed so the set is complete rather than remembered. |
| trap / site type | asserted **as a count** | comma's optional sites and possessive's well types are reviewed per sentence, but the reviewed type RIDES ON THE EMITTED OPTION as its misconception tag, so the count is recomputable from the item. This is why they pass her test and `optionsThatParse` does not. |
| `optionsThatParse` | **metadata** | how many options produce a grammatical sentence is a reviewed linguistic judgement, and nothing on an emitted cloze item carries it. Moved off the sheet by her own rule. |

**THE RETROSPECTIVE SWEEP she asked for, over the signed families and not only the unsigned:
13 of 13 families, 21,920 items emitted, ZERO disagreements.** She expected it to be small; it is
empty. Ranges were already enforced, the trap lookups are property-based and CI-verified against
their banks, and the N mechanism was correct. No sheet said anything untrue when she signed it.

**Three consequences she needs to rule on:**

1. **`spag-cloze-tense` loses its ladder.** It distinguished T2 from T4 ONLY by `optionsThatParse`,
   so moving that off the sheet leaves it with no declared structural ladder. The fix her own
   reasoning implies: give each cloze distractor a parses flag, exactly as comma and possessive
   carry their site type. The count then becomes recomputable AND a real ladder dimension, and
   parses-but-wrong becomes a diagnosis rather than a bank annotation.
2. **All 13 signatures now read MOVED.** Adding `segments` and `options` changed the generator
   surface the fingerprint covers. Nothing about the items changed and no tier rule or range moved,
   but the sheet now shows more than it did. Whether that needs re-signing or is a non-substantive
   amendment is hers, not ours — the guard exists to force the question rather than answer it.
3. **`spag-punct-speech` emits five options, not four.** Her ruling says "speech has four with no N,
   the spot families five". Measured: speech emits a "No mistake" option like every other spot
   family; it is simply never the key (`nRate: 0`). So the child sees five. Reported rather than
   encoded either way.

## R32 — The parses flag: a reviewed judgement per option
*Annie, 2026-08-09. Built to her two conditions.*

**Every cloze option DECLARES whether it parses in its slot** — a reviewed grammatical judgement per
option, not a lookup, exactly as comma declares its site typing. Required by the type, so
completeness is structural rather than remembered. It rides on the emitted option, which is what
makes `optionsThatParse` recomputable from the item and **returns it to the asserted sheet** under
R31. The R31 ladder gap in `spag-cloze-tense` is closed by the same move: the dimension that was
always doing the work is declared again, and asserted this time.

**Her second condition closes the last hole in the cloze design.** The declared deciding factor is
asserted against the parse count: **if every option parses, grammar cannot be what decides the
item** — something softer is, and R18 forbids exactly that, register and collocation being the
dimensions where English permits a second answer. An all-parsing item must declare `sense`; a
`grammar` claim over four grammatical options is a build failure, not a review note. `register` and
`collocation` are refused outright.

Nothing in the bank violates it today: word-class, tags and tense-T2 are 1-parse/grammar; tense-T4
is 2-parse/grammar (the marker forces the choice between two grammatical forms); connectives are
4-parse/**sense**, which is the safe all-parsing case and the reason the rule is worth having.

**One derivation to check.** The seven `parses: 2` tense rows needed a per-option call the aggregate
did not carry: which single distractor parses. Derived from the aggregate she already signed plus
each row's content — the past-form counterpart shares the sentence's past-time frame; the present
and future forms clash with it. Enumerated per row rather than buried in a rule, so any of the seven
can be overturned: `tn-bell` had run · `tn-bytime` started · `tn-cat` had run · `tn-bus` waited ·
`tn-film` had walked · `tn-teacher` copied · `tn-rain` had gone.

## R33 — A never-keyed option is not a neutral one
*Annie, 2026-08-09. Speech loses its N option.*

**`spag-punct-speech` now shows FOUR options, not five.** Her reasoning, recorded: a speech item
**cannot** carry an N key, because an N-keyed item needs a correctly closed quotation, and that puts
a terminal-at-boundary choice into a part the child is being told is clean — British usage argues
both ways there, so the part is not unimpeachable. That was the finding when the family was signed;
**the option's absence should follow from it, rather than the option surviving on the card at a zero
rate.**

**The general argument, which reaches past this family:** a never-keyed option costs a child
attention on every item, can never reward it, and teaches that "No mistake" is not a real answer —
the wrong lesson for the ten families where it IS one.

`noNOption` replaces `nRate: 0`, so the absence is declared rather than emergent, and the declared
`options` count follows from it automatically.

**Both checks she asked for:**
- **`en-n-option-avoidance` was tagged on the speech N option**, so it does become unreachable
  *there*. It remains reachable in **eight** other families, each keying N at a real rate
  (107–534 per ~1,500 draws), so nothing is orphaned platform-wide.
- **No other family carries an option at a zero rate.** Speech was the only one. The four cloze
  families carry no N at all, by design (R18).

## R34 — What makes a signature move substantive
*Annie, 2026-08-09, re-pinning the twelve. Her boundary, recorded because the guard will fire again
and this is NOT a general licence.*

**Non-substantive** — the surface gained a column describing something **already true of every
item**. Nothing the reviewer reads differently, nothing a child meets differently. R31's `segments`
and `options` were this: re-pinned at the new fingerprint without re-signing.

**Substantive, and re-signing is required:**
- **removing** a column — she signed against something no longer shown;
- **renaming** one — the next reviewer reads the name;
- **adding** one describing something **that wasn't true before**.

Speech is the worked example on the other side: the child now sees four options where she signed
five, so its fingerprint moves properly and it is **held MOVED** pending her signature on the new
sheet. Twelve re-pinned; one held. That asymmetry is the guard working, not failing.

## R35 — A test that asserts on an empty database asserts nothing
*David, 2026-08-09, after the corpus-gates fix. Swept as a class.*

**CI seeds a fresh database; a developer's machine holds a real library.** An assertion that only
holds when the test's own row is the only row passes in CI forever and fails the moment it meets
real content — so it was never testing the system, it was testing emptiness.

The instance: `corpus-gates` asserted that after approving a proposal, *the proposed queue
disappears*. True on a seeded database with one proposal; false against a library with thirteen
others still pending. It now asserts what the test is about — that **this** entry left the queue.

**THE SWEEP, as a class rather than an instance: the whole 71-test suite, and this was the only
one.** Everything that looked like it — `toHaveCount(0)` on a chapter shelf, on card fields, on
pricing copy — asserts absence caused by BEHAVIOUR (a feature flag, CSP, a role gate, a marketing
page), which is true on any database. The distinguishing question is not "does this assert
emptiness" but **"could a real library falsify it"**.

Four safe patterns were already in use and are now written down in `apps/web/e2e/README.md`: scope
to the row your test created; derive the expectation from the database; assert a floor rather than
an equality; filter a payload to your own fixture before counting. `entitlements` is the model —
it counts free-tier cases in the DB and compares, so it cannot go stale.

**Recorded alongside it, because it is the same lesson one level out:** some tests fail only inside
a full local run, and WHICH ONES CHANGES BETWEEN RUNS. Two consecutive clean runs on the same commit
gave different casualties — `daily-loop`/`nvr-samples`/`session-integrity`, then
`reviewer-surfaces`/`story-flag` — each passing alone and in CI. That makes it shared state across
71 tests on one server and one database, not five flaky tests. Not a finding, but not nothing: a
suite whose failure set differs each run cannot be trusted to fail for a real reason later. The
durable fix is per-spec fixture isolation, not chasing whichever test lost this time. Two Playwright runs must never overlap: they share port 3100 and the database, and a
contended suite once reported per-file durations of 12.8 hours.

## R36 — An aggregate figure cannot be decomposed into the facts that produced it
*Annie, 2026-08-09, holding `tn-teacher`. Her rule.*

**The aggregate came FROM the per-option facts; reconstructing them backwards is guesswork
constrained by arithmetic, and where the arithmetic has more than one solution it is a judgement
wearing a derivation's clothes.**

The case: R32 needed a per-option `parses` flag, and the bank held only the row-level count. For
the seven `parses: 2` tense rows I derived which single distractor parses. She ruled **six correct
and held one** — `tn-teacher` — because the arithmetic admitted two readings: a past perfect key
with a past simple second parse (which would group it with `tn-bytime` and `tn-bus`), or a simple
past key where "copied" parses a second way, which is ONE option parsing twice, not two options
parsing. **She could not settle it from the derivation, which is exactly the point.**

**Same family as R25** — the aggregate was an account of the values, and the values carry the
signature. R25 says send the value rather than an account of it; R36 says you cannot recover the
values from the account, however good the arithmetic looks.

*Resolved on the values: the field holds key `had copied` with `copied` as the second parse — the
first reading, grouping with `tn-bytime` and `tn-bus`. Sent verbatim rather than asserted
(`tn-teacher-held-dbe2e3354eb1fcee`), because the ruling is hers.*

## R37 — Speech signed, and what a designed-out option means
*Annie, 2026-08-09.*

**`spag-punct-speech` is SIGNED: T1–T4, four options, no N option.** Held MOVED under R34 as a
substantive change — the child sees four where she signed five — and now re-signed on the new sheet
and re-pinned. **All thirteen families are pinned and none reads MOVED.**

Her reason sits on the family itself: a speech item cannot carry an N key, because an N-keyed item
needs a correctly closed quotation, and that puts a terminal-at-boundary choice into a part the
child is being told is clean — British usage argues both ways there, so the part is not
unimpeachable.

**`en-n-option-avoidance` is recorded as UNREACHABLE BY DESIGN in speech, not unused.** The
distinction is the point: an unused tag invites a later coverage sweep to "fix" the gap by re-adding
the option. Recorded on the misconception itself, where the sweep will meet it. It stays reachable
in the other eight spot families, each keying N at a real rate.

**Added to R19's serving conditions, in her framing:** *if speech is ever the only punctuation
family a child meets in a session, that child gets no N exposure in that session at all.* **A
serving consideration, not a content one** — nothing about the family is wrong; the exposure gap is
created by what a session happens to contain, so it belongs with the other three R19 conditions that
still have no owner.

## R38 — The dev server was the flakiness
*David, 2026-08-09. Steps 1–3 done; step 4 reassessed and dropped.*

**The e2e suite now runs against a production build, with no retries: 71 of 71, twice
consecutively, in 1.8 minutes — down from ~12 minutes and a failure set that changed every run.**

The diagnosis in the previous entry was WRONG and is corrected here. Different casualties each run
looked like shared state across 71 tests, and per-spec database isolation was costed at ~2 minutes
plus real machinery. **It was the dev server's on-demand compilation.** Local used `next dev`, CI
used `next start`, and the same two specs took 2.2 minutes against one and 15 seconds against the
other. Nothing was isolated and the coupling vanished.

Worth keeping as a general caution: *a suite that fails differently each run does not necessarily
have a state problem.* Measure the environment before buying isolation.

**What the faster suite called in, none of it a regression:**

1. **A read-after-write race.** `reviewer-surfaces` asserted a row's status straight after a server
   action — no UI wait — and lost the race the moment the server got fast. Every other database read
   in the suite already waits on a UI signal first; this was the one that did not. The first fix was
   also wrong (it waited on the rejected table, which is ADMIN-ONLY and invisible to the reviewer
   who just rejected the entry): waiting on something the acting user never renders is how a fix for
   a race becomes a different failure. It now waits on the redirect.
2. **`NEXT_PUBLIC_APP_ENV` was read in two places and set nowhere.** Both engine debug harnesses
   gate themselves on it in a production build, so they could never render in one — and the EIGHT
   e2e tests driving them could never pass in CI, which builds before it runs. They had been failing
   since the harnesses were written. `APP_ENV` now feeds it through `next.config`.
3. **The 403 role wall was inert in any production build served over HTTP.** `middleware.ts` chose
   its session-cookie name from `NODE_ENV`, so a production build over http looked for the
   `__Secure-` cookie, found nothing, read the visitor as having no role, and fell through to
   `next()` — refusing nothing. Real https deployments were unaffected, which is why it stayed
   invisible; but **CI builds and serves over http, so CI has never once exercised that wall.** The
   cookie name is now derived from the request protocol (`x-forwarded-proto` first, for a
   TLS-terminating proxy).

**`retries: 1` is gone.** It was turning the race in (1) green. A retry that absorbs a real failure
is the same fault as an unread build, one level down.

**A correction I owe on my own reporting:** I twice told David that CI showed only two e2e failures.
It showed thirteen. GitHub caps the annotation list, and I read the capped list as the complete one
instead of counting the log. The engine failures above were sitting in plain sight the whole time.

**Step 4 — per-spec servers and databases — is DROPPED.** It was costed against a cause that turned
out not to exist. Two green deterministic runs is the evidence; if genuine cross-spec coupling ever
appears, the costing stands and can be revived.

## R39 — Environment-derived where it should be request-derived
*David, 2026-08-09. The cookie-name bug was one instance; this is the sweep for its class.*

**The pattern: behaviour keyed to the ENVIRONMENT the code was built for, in a place that should ask
the REQUEST.** It hides for the same reason every time — the two only differ in the mode nobody
tests.

**The sweep found one more, and it was the mirror of the first.** Both halves of the child session
were environment-keyed:

- the middleware READ the session cookie under a `__Secure-` name chosen by `NODE_ENV`;
- both writers SET the cookie's `Secure` flag from `NODE_ENV` too.

Being wrong together is what kept them consistent, and therefore invisible: a production build over
http wrote a cookie the browser discards and looked for a name nothing had written. Both now derive
from the request (`x-forwarded-proto` first, then the request's own scheme), through one shared
`isSecureRequest` + `childCookieOptions` in `lib/child-token.ts` — the duplication is what let the
two sides drift in the first place.

The residual fallback **fails safe by design**: with no proxy header and no scheme to read, it
returns *insecure*. A cookie without `Secure` still works over https; a cookie with it vanishes
silently over http, which is the failure that hid for months.

**Everything else that branches on `NODE_ENV` is dev tooling and stays**: the three debug pages, the
mascot controller, the service-worker registration, and the chapter cache. None of them decides
whether a request is authorised. Two adjacent things are deliberate configuration rather than this
fault, and are named so nobody re-finds them: `PRELAUNCH` in the middleware (a deploy-wide switch,
correctly not request-derived) and `ADMIN_EMAILS` (env-derived admin bootstrap — intentional, but it
IS privilege that varies by environment).

**A second class the same run exposed, and it is R35's mirror.** R35 swept for assertions a REAL
library would falsify. CI's two remaining failures were the opposite: assertions an EMPTY database
falsifies — `expect(imported).toBe(183)`, the count of one local import, and a vault assertion that
needs LIVE words CI never has (every imported card is DRAFT by design, which the neighbouring test
asserts). **Both directions are one fault: an expectation written as a literal instead of derived
from the system.** Fixed by asserting the invariant — an imported card never serves, at any bank
size including zero — and by asserting the vault state that MATCHES the journey just taken.

Local: **71 of 71, 1.8 minutes, no retries.**

## R40 — The ownerless set, measured
*David, 2026-08-09. Every figure from `pnpm state`; the judgements are named as judgements.*

**CI is green for the first time in this record: 70 e2e, 570 unit, 36 files, both jobs.**

**What has no owner.** R19's three serving conditions were the known set. The sweeps added four
more, and removed two that looked like gaps and were not.

| # | ownerless | why it has no owner |
|---|---|---|
| 1 | **Cloze four-option render** (R19) | Cloze has no N; eleven families render a fifth option. No renderer exists for the generated families, so the signal a child needs is a REQUIREMENT, not a verified fact. |
| 2 | **Comma mirrored-pair same-session** (R19) | The linked pair is the district's only sanctioned repeat. Served to one child in one session it is a giveaway. Nothing in serving honours `pairId`. |
| 3 | **Per-family depth sizing** (R19) | Depth runs 6–42 across thirteen families and cannot be one number. Each signature carries its own; serving must respect them individually. |
| 4 | **Speech-only session → no N exposure** (R37) | Speech now has no N option at all. If it is the only punctuation family in a session, that child meets no "No mistake" decision. A serving consideration, not a content one. |
| 5 | **19 maths signatures carry no fingerprint** | `AttributionEvent.subjectHash` exists and the maths families sign into it, but no `familyFingerprint` equivalent was ever written for `MathsFamily` — so R31/R34's guard covers SPaG alone. A maths family can move and its signature will not notice. |
| 6 | **`structuralParams` is asserted for SPaG only** | R31 makes every declared parameter a promise about the emitted item — in `assembleSpagItem`. `assembleItem` (maths, 19 signed families) has no `recomputeParams`. The sheet a maths signature is given against is still unchecked. |
| 7 | **Two LIVE VR items serve stale walk scripts** | `gen-vr-03-related-words-02` and `-04` name options no longer on the card. `check:db-content` has reported them as SERVING failures throughout. The text is the reviewer's; taking an item out of service is the platform's — which is exactly why neither has done it. |
| 8 | **`en-vocab-in-context` signature unpinned** | The fourteenth SPaG signature. The family is not in `SPAG_FAMILIES`, so the fingerprint machinery skips it silently — the same shape as #5, one row wide. |

**Two that LOOKED ownerless and are not, recorded so they are not re-found:**
- **NVR signatures.** All 13 carry `NvrTemplateSignature.sampleSheetHash` — its own dedicated
  fingerprint column, the mechanism R31 was modelled on. The zero against `nvr-signature` in the
  attribution table is not a gap; the guard simply lives elsewhere.
- **`ADMIN_EMAILS`.** Env-derived privilege, but deliberate bootstrap configuration rather than the
  R39 fault. Named because it reads like one.

**And one item that has no written home at all**, which is its own finding: the "three gates, none
identical" problem — the platform generator, the platform import door, and Cowork's local screen all
apply different rules, with the proposed fix being that the platform export its rule set for the
screen to consume. **It is not in this log.** It was raised in conversation and recorded nowhere, so
its state cannot be confirmed from the repo. If it is still live it needs an entry; if it was
settled, the settlement was never written down. Either way it is the argument for this section.

## R41 — The guard reaches the maths district; and the three gates, measured
*David, 2026-08-09, closing R40 #5–#8 and the item with no written home.*

**Every family signature is now pinned: 19 maths, 14 English, 13 NVR (its own `sampleSheetHash`).**
`mathsFamilyFingerprint` is deliberately a SECOND function rather than one generic over
`LadderedFamily` — unifying them would change the SPaG hash and silently un-pin thirteen signatures
annie ruled on the day before, which is the move R34 forbids. `en-vocab-in-context` is pinned too:
it satisfies `SpagFamily` but is not IN `SPAG_FAMILIES`, so every sweep keyed on that array had been
skipping it in silence — not unguarded, but invisible to the thing doing the guarding, which is
worse because it reports as covered.

**`structuralParams` is now asserted in maths as well as SPaG.** The retrospective sweep over all
19 signed families: **13,173 items generated, 0 disagreeing with the signed sheet.** Five parameters
are asserted (`place`, `exchange`, `steps` ×2, `band`); five are named as family metadata by annie's
test because nothing on the emitted item can recompute them (`kind`, `parts`, `shape` ×2, `mode`).

**One gap reported rather than closed:** M-pct T4 (`change`) emits `{amount, firstStepResults}` and
does not record the percentage it used, so its `band` claim is unverifiable at that tier. Recording
it means adding a `percent` operand to a signed family, and `percent` is executor-visible, so it
could move derived distractor values. That is a reviewer's call.

**A methodological correction worth more than the result.** The first version of M-column's
recompute re-derived "across-zero" independently and reported **69 disagreements against a signed
sheet**. Every one was mine: I counted any zero digit in the minuend, where the family means *a zero
column that was asked to lend*. **A recompute must recompute the property the family MEANS, not a
plausible second definition of it** — a second definition manufactures findings against the reviewer
rather than about the generator. It now calls the family's own `subInfo`.

### THE THREE GATES — measured, not assumed

Two of the three are reachable from this repo and were compared by running identical items through
both (`pnpm compare:gates`). The third is not.

| gate | what it applies | when |
|---|---|---|
| **Platform generator** | `checkItemChildFacing` + notation + key-recompute + P3 tags | at production — nothing can be generated that a door would reject |
| **Platform CMS import** | misconceptions-ACTIVE, maths solution, D7 commerce, similarity. **Not the copy gate** — that fires at the REVIEWED/LIVE doors instead | import lands DRAFT; copy is gated on the way OUT, not IN |
| **Platform SCRIPT import** (`import-english-items.ts`) | per-field `checkChildFacingText` | at import |
| **Cowork's local screen** | **UNKNOWN — outside this repo** | — |

**The measured difference:** the script import path takes `explanation.quotes` and validates them
against the STEM text. A quotation declared on a WALK SCRIPT — which is exactly what R23 exists for —
is therefore rejected as *"declares a quoted span that is not in the text"*, while the whole-item
gate passes it correctly. One path implements R23; the other implements a version of R23 that
predates it.

**The honest limit:** Cowork's screen cannot be inspected from here, so "all three differ" remains
unverified in its third term. What can be said is that **the two gates inside this repo already
differ from each other**, which was the premise's weaker form and is now measured rather than
asserted. The proposed fix — the platform exporting its rule set for the screen to consume — is
still the right shape, and it now has a first customer inside the repo: the script import path
should call the same whole-item gate the generator and the publish doors call, rather than its own
per-field approximation of it.

**R40 #7 closed.** `gen-vr-03-related-words-02` and `-04` are RETIRED. Their walk scripts named
options no longer on the card, and serving stale text while waiting for a redraft was the wrong side
of the reviewer/platform split to err on. RETIRED, not deleted — the script survives for the redraft.
`check:db-content` now reports everything serving as passing the child-facing gates.
