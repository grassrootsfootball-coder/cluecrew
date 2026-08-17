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

Four requirements accumulated across the build sit on the SERVING and RENDER paths. Each is
something a signature or a content finding ASSUMES to be true and cannot itself guarantee, so each
needs an owner:
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
4. **Technique-repetition capping (R49, added 2026-08-11).** Whole-text-purpose T4 items across
   different passages can share the same underlying device — Wind in the Willows/Jungle Book
   anthropomorphism, Tom Sawyer/Anne/Christmas Carol "the reader sees what a character cannot,"
   Canterville/Mill on the Floss register-mismatch. Two items on the same technique must never be
   drawn into the same mock sitting. Unlike condition 2, this is an open-set TECHNIQUE TAG, not a
   linked pair — serving needs a technique-key field to constrain against, which does not exist yet.

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
comprehension items** — the blueprint is set against that, not against a percentage share.

**CORRECTION (David, 2026-08-11, per R24 — this paragraph originally used "25%" as though it were a
target; it is not one).** Checked against the platform's own ratified record before writing this
correction: `content/batch-mix.json`'s `english` pool entry reads, verbatim, **"EMPTY — pending
BUILD-DISTRICT-ENGLISH. Deliberately carries no mix: the spec is unwritten, so any number here would
be invention."** That is the census. No English-specific corpus-derived tier distribution exists
anywhere — `english-question-taxonomy.json` gives QUESTION-TYPE shares (SPaG 56%, retrieval 17.5%,
etc.) and a tier CEILING finding (no T5, cap at T4), never a T1–T5 percentage mix. The only T1–T5
percentage figures in the corpus are VR's (`difficulty-map.json`, 400 VR items, PASS 1) and Maths's
(`maths-topic-tier-map.json`, 1505 parts) — both district-specific, neither English's.

The "25%" this paragraph originally used is **not VR's number carried over** — VR's `specDefault`
T4 was 20%, and VR has since RATIFIED its own corpus-derived figure (T4=18%, practice and mock), so
VR itself no longer runs on either 20% or 25%. Checked further before calling it unsourced: the
`independent-prep` pool's `specDefault` IS `[10, 20, 30, 25, 15]` — **T4=25% exactly**, and its
status line reads *"UNCHANGED — T3+ centre with a real T5 tail, per the independents evidence.
CEM-style and independent tracks keep this centre."* ENG-004 is the non-GL/CSSE-style comprehension
track (graduated analysis ladders reaching T5, per `BUILD-DISTRICT-ENGLISH.md`'s own two-track
split) — the format `independent-prep` describes, not GL. So 25% most plausibly echoes THIS pool's
default rather than being invented from nothing.

**That does not make it English's number.** `independent-prep`'s own status says "UNCHANGED… per
the independents evidence" — evidence about CEM-style MATHS and the independent tracks generally,
never English specifically, and never corpus-checked the way VR's was (VR's moved because someone
compared it to `difficulty-map.json`; `independent-prep`'s has not moved because nobody has run the
equivalent English pass). **The correct sentence is: nobody derived an English tier-mix figure. The
25% this paragraph used almost certainly echoes the `independent-prep` pool's own pre-corpus
default — a real file, but a maths/CEM-track default all the same, not an English one — carried
across by resemblance of FORMAT (non-GL, graduated, T5-reaching) rather than by any evidence about
English's actual tier shape.**

**The yield finding stands on its own count, not on the withdrawn percentage:** T4 hooks are NOT
rare — 12 of 15 extracts carry at least one (a double description, a say/do gap, an unreliable
observation; 8 strong, 4 moderate, 3 weak). But a say/do gap supports **two or three questions, not
six**, so fifteen extracts yield ~30 T4 items. **The constraint is hook YIELD, not hook scarcity** —
this holds regardless of what any target percentage says, which is exactly why the blueprint was
right to set itself against a count (~30 comprehension T4 items) rather than a share of a total that
was never real.

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
are asserted (`place`, `exchange`, `steps` ×2, `band`); five (`kind`, `parts`, `shape` ×2, `mode`)
are metadata rather than asserted — **correction, R44: named as metadata here without saying
WHICH kind, and every one of the five is open, not settled.** Nothing about any of them is
unrecoverable by design; each is a fact the family's own drafting logic already knows and simply
has not written onto the item. See R44 for the class and the reason per parameter.

**M-pct T4's gap is closed (annie's ruling, 2026-08-09).** T4 (`change`) did not record the
percentage it used, so `band` was unverifiable there. Her ruling: what moves a distractor is a
change to EXECUTOR LOGIC, not the presence of a field — `amount` was already on the operand bag and
nothing moved because of it, and none of T4's three distractors (entries 0, 77, 92) has an executor
keyed to `percent` or `amount`, so recording it changes what can be VERIFIED, not what is emitted.
`percent` is now on every tier's operands; `band` asserts across all five; the family's fingerprint
is unmoved because the surface it hashes is the declared sheet, not the draft function.

**A methodological correction, widened to a general rule (annie's clause, 2026-08-09).** The first
version of M-column's recompute re-derived "across-zero" independently and reported **69
disagreements against a signed sheet**. Every one was mine: I counted any zero digit in the minuend,
where the family means *a zero column that was asked to lend*.

Her rule, wider than the instance: **a recompute must call the family's OWN definition of a
property, not a second implementation of it.** It is not enough that a fact can be derived from the
item — the derivation has to be the SAME derivation the family uses, or it is a different fact
wearing the same name. Where no such function exists to call, the property is not recomputable at
all, and belongs in metadata rather than in a plausible reconstruction of it. M-column's recompute
now calls the family's own `subInfo` rather than a second `acrossZero` test; see R43 for the fault
class this names.

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

## R42 — One gate, and two beliefs that were not true
*David, 2026-08-09, closing the three-gates finding as far as this repo can close it.*

**The script importer now calls `checkItemChildFacing` — the same whole-item gate the generator and
every REVIEWED/LIVE door already call.** It had been running a pre-R23 version: it handed
`explanation.quotes` to the STEM check, so a quotation declared on a WALK SCRIPT — exactly what R23
exists for — was rejected there as *"declares a quoted span that is not in the text"* while the other
doors accepted it. Two doors into the same database disagreeing about the same rule.

Two things fell out of the fix that are worth recording separately, because both were believed:

**1. "The import door gates copy" was never true.** The CMS bulk import applies
misconceptions-ACTIVE, the maths solution check, the D7 commerce screen and the similarity gate —
but NOT the child-facing copy gate. That fires at the REVIEWED and LIVE doors instead. This is
defensible for a DRAFT holding pen, and the code says so in its own comment ("every door to REVIEWED
or LIVE calls this"). It is recorded because the belief in circulation was that copy was gated on the
way IN, and it is gated on the way OUT. Anyone reasoning about what a DRAFT row can contain was
reasoning from the wrong premise.

**2. `passageNames` was never accepted by the script importer at all.** The field R23 introduced was
absent from `BatchItem`, so a batch declaring it would have had the declaration dropped silently at
the door and the name measured as ours — the same defect class as the `span`/`text` mismatch the
importer already guards against, one rule later. Added.

**The gate parity check is now a CI step** (`pnpm compare:gates`, non-zero on divergence). The
original divergence survived because nothing compared the two doors; a comparison nobody runs is the
same fault one level up. The pre-R23 implementation is kept in that script as a third column, so the
difference stays demonstrable rather than becoming a claim about the past.

**THE THIRD TERM IS STILL OPEN.** Cowork's local screen cannot be inspected from this repo, so
whether it agrees with the platform is **unverified — not closed, and not assumed either way**. What
is now settled is the weaker premise: the two doors inside the repo did differ, they no longer do,
and CI will say so if they drift. The proposed fix for the third term — the platform exporting its
rule set for the screen to consume — remains the right shape and remains unbuilt. It is the one part
of this finding that a repo-side change cannot reach.

## R43 — A taxonomy of guard faults, by how loudly they fail
*Annie, 2026-08-09. Her framing, after M-column.*

Every fault this week's sweeps have found sorts into one of three classes, and the classes differ
in how dangerous they are — not in how easy they are to make.

**1. Declaration not enforced.** Something is stated on the sheet and nothing checks it against the
generator. **SILENT.** Nobody is told anything false; they are told nothing at all, and the sheet
and the generator can disagree indefinitely with no signal either way. Every instance from R31
onward: the SPaG tier ladder, the maths tier ladder (10 of 19 families emitting outside their
declared tiers), `structuralParams` before this week's assertion existed. Found by building the
check that had been missing, not by anything failing loudly.

**2. A mechanism narrower than the property it claims, and HONEST about the gap.** The check exists
but says, correctly, "I cannot verify this part." M-pct T4 before annie's ruling: `recomputeParams`
returned `{}` rather than asserting `band`, because the item genuinely did not record what it would
need to. The five metadata-only parameters (`kind`, `parts`, `shape` ×2, `mode`) are this class by
design — named as unrecomputable rather than guessed at. **Reports as a gap, not a defect**, because
it never claims more than it can support.

**3. A VERIFIER narrower than the property it claims, presented as complete.** The check exists, runs,
and returns an answer — the WRONG answer, because it implements a different property under the same
name. My first M-column recompute: it did not say "I cannot verify exchange," it said "exchange is
X" using a definition the family does not use, and reported 69 REAL SIGNATURES as disagreeing with
their own sheets. **This is the dangerous class.** Class 1 is silent — nobody is misled, only
uninformed. Class 3 is confidently loud: it arrives dressed as a finding, with the authority of a
sweep result, against work a reviewer already signed. A false alarm from a verifier costs more than
a true gap from an honest one, because the false alarm has to be DISCOVERED as false before anyone
trusts the sweep again — and every true finding sitting beside it inherits that doubt until it is.

**The guard against class 3, stated once so it generalises past this instance:** a recompute must
call the family's own definition of a property, not a plausible second implementation of it (R41,
her clause). Where no such function exists to call, the property belongs in metadata (class 2), not
in a reconstruction that only class 3 would attempt.

## R44 — Metadata has two shapes, and "not asserted" is not "settled"
*Annie, 2026-08-09. Her condition on the five parameters R41 named as metadata.*

**Metadata is not one class.** R31's test — could you recompute this from the emitted item alone? —
answers "no" for two different reasons, and only one of them is a closed question:

- **A — design.** Nothing about the item, however much engineering effort, could ever disagree with
  the declaration, because the value is not a computed or drawn fact at all — it is a fixed label
  the family's own logic never varies within a tier.
- **B — open.** The value IS known at the exact point the item is built — sitting in scope as a
  config field, or a literal the branch could trivially carry — and simply is not yet written onto
  what the item emits. **This is R36's exact shape: `optionsThatParse` was here before `parses` was
  threaded onto each option.** A class-B parameter is not settled; it is a gap that reads as a
  decision until someone builds the thread.

**All five of R41's metadata parameters sorted to class B. None is class A.**

| family | param | why it is open, not closed |
|---|---|---|
| M-money | `kind` | Known the instant the tier's branch runs; not yet written onto `operands`. T3 (total) and T4 (change) currently emit the IDENTICAL operand shape — `{firstStepResults: [n]}` — which is the gap itself, not proof it cannot close. |
| M-money | `parts` | Same family, same gap. |
| M-pct | `shape` | The lowest-effort case: `draft` already holds it in scope as `c.shape` at every return. A one-line addition per branch, not a redesign. |
| M-geom | `shape` | Same shape of gap — `c.shape` from `GEOM_TIERS[tier]` is already in scope at every branch. |
| M-inverse | `mode` | Partial evidence already exists and nobody reads it: T3 alone carries `op: 'sub'`, so T3 vs T4 is separable TODAY. T1 vs T2 is harder — when T2's internal coin flip draws 'mult', its operands are byte-identical to T1's, so those two need the same direct-threading fix as `kind`/`parts`. |

Sent to her in full, per-tier, unsummarised: `metadata-params-classified-0dab04e7993d2c80`.

**Corrected on discovery, not left as found:** R41's text and the `recomputeParams` comments beside
all five parameters in `families.ts` previously said "metadata… by annie's test" with no class
attached, which reads as settled. Both edited to state the class and cite the evidence. None of the
five is built — writing the thread means editing a signed family, and that is a reviewer's call,
the same caution that held `percent` on M-pct T4 until her ruling.

## House rule — a verifier states its source before it runs
*Annie's standing instruction, 2026-08-09, added alongside R41.*

**Any new verifier, in any district, states which function it calls to define the property it is
checking.** If the answer is a re-derivation rather than the family's own code, that is flagged
BEFORE it runs, not after it reports.

The incident this generalises: the first version of M-column's recompute re-implemented
"across-zero" instead of calling the family's own `subInfo`, and reported 69 disagreements against
a signed sheet — every one manufactured by the checker, not found in the generator (R41, R43 class
3). A verifier that names its source is auditable before it runs; one that doesn't is auditable only
after someone notices its findings look wrong, which is the expensive order to discover it in.

**In practice:** a `recomputeParams` implementation's comment states either "reads `item.operands.X`
directly" (no derivation, nothing to misname) or "calls `<family's own function>`" by name. A
comment that instead describes independent logic — counts, parses, or classifies the item's fields
without naming an existing family function it is drawing from — is a class-3 risk and gets checked
against the family's actual definition before the sweep that uses it is trusted.

## R45 — All five closed; one split by a determinacy check
*Annie, 2026-08-09. Rulings on R44's four class-B parameters plus M-inverse.mode.*

**M-pct.shape, M-geom.shape, M-money.kind, M-money.parts — PROMOTED.** Each already sat in scope at
the point of return (`c.shape`, or a tier-indexed literal `draft` could trivially carry), so
threading it onto the emitted item is the `parses` pattern exactly: a fact always true of the item,
now recorded rather than merely knowable. No new executor input, no risk to derived values — her
framing, confirmed by the sweep (0 disagreements).

**M-inverse.mode split, because her determinacy question had two different answers within one
parameter — checked empirically before writing anything, not assumed:**

- **T3 vs T4 — asserted via the EXISTING `op` field.** T3 alone carries `op: 'sub'`; T4 never carries
  `op` at all. A real, checkable fact already on the item, no new field needed — same treatment as
  the four above, by mechanism if not by field.
- **T1 vs T2 — genuinely indeterminate, not a recording gap.** Sampled 3,000 draws each: **31 of 31
  T1 operand signatures also occurred among T2's multiplication draws.** When T2's internal coin flip
  draws 'mult', its operands are byte-identical to T1's — `{result, c, op: 'mult'}` — so the SAME
  emitted item is consistent with two declared tiers. No amount of future engineering recovers this
  from what `draft` already returns, because there is nothing there to distinguish. Closed with a
  **declared flag** at generation time — `mode` is now written directly onto T1's and T2's operands,
  the same way comma's site types are authored rather than inferred. A generator addition, not a
  verifier one, as she specified.
- **T5 — free.** `steps` already uniquely implies it (no other tier reaches steps=3), asserted as a
  consequence of an already-asserted fact, not a new judgement.

**Retrospective sweep, all five closed: 13,173 items across all 19 signed families, 0 disagreeing.**
**No signature fingerprint moved** — none of this touched the declared surface a signature hashes
(`tierRule`/`structuralParams`/`numberRanges`); it only changed what `draft` writes onto the emitted
item, confirmed against all 19 pinned fingerprints before and after.

Sent as the closure report: `metadata-params-closed-395aa847a8c984b7`, superseding the classification
export (`metadata-params-classified-0dab04e7993d2c80`, removed — nothing on it remains open).

**R41's earlier count is now stale and corrected here rather than re-edited a third time:** "five
asserted, five metadata" was true on 2026-08-09 before this ruling; it is now ten asserted, zero
metadata, out of the original ten declared structural parameters across the 19 maths families.

## R46 — Anne's fidelity pass on the ENG-004 pilot: three rulings, one drift caught mid-pass
*Annie, 2026-08-09, on the twelve-item Anne of Green Gables cluster (R21). Recorded by David.*

**1. AGG-02 walk script REWRITTEN, not the item.** Same key, same distractors. Her diagnosis: the
script opened on the right anchor — "had he looked he could hardly have failed to notice" frames
attitude as something SEEN — but closed by pointing straight back at the mental reading it exists to
exclude ("carries what she was feeling"). Rewritten to close on the looking clause instead:

> Look at lines 6 and 7. Had he looked, Matthew could not have missed her attitude. So expectation
> describes what her bearing showed, not what she was thinking. All of this is something Matthew
> would have seen.

"Failed to notice" is reworded to "could not have missed" — R5 discipline: the ban-list word is gone,
the certainty it carried is not. Verified against `checkItemChildFacing`, the actual production gate,
not a hand-check: clean.

**2. AGG-06 option D retagged** `en-plausible-not-stated` → `en-motive-invention`. "He wants Marilla
to drive the horse home" is a WANT, not a stated-or-not fact — the R21 boundary (motive covers a
reason/intention/wish; plausible-not-stated covers a fact/event). Now shares the tag with option C,
her example of the boundary rule and the shared-tag rule (R21's gate reversal) working together.

**Found mid-pass, not assumed: option D was already retagged on disk in both copies before this pass
touched it**, while the item's own `misconceptions` summary array still listed the old tag — a
per-item aggregate that had drifted from its own source fields, the same shape as the tier-
distribution bug below. Corrected. The retag itself is not attributed to this session; only the
summary-array fix is.

**3. AGG-11 confirmed T3** against lines 60-63. The item's own `difficultyTier` was already 3 (the
2026-08-08 retier), but its `tierRationale` and `notes` still carried the ORIGINAL hedge ("a reviewer
may judge this T3") and the batch's `lowestConfidence` array still flagged it as an open watch item.
All three updated to CONFIRMED. **The cluster now has one T4 item (AGG-08), not two** — which surfaced
a second stale aggregate: the batch's `tierDistribution` field said `{3: 4, 4: 2}` against items whose
own tiers summed to `{3: 5, 4: 1}`. Recomputed from the items, not hand-edited.

**Correction to the pilot notes.** `ENG-004-PILOT-NOTES.md` claimed two declared quotations cross a
line break, naming *"more scope for imagination"* (15–16, genuine) and *"her attitude and
expression"* (6–7, false). Verified against the passage: line 6 ends "...tense rigidity and", line 7
opens "expectation of her attitude and expression." The word that straddles the boundary is
*"expectation"*; the quoted phrase itself sits entirely on line 7. Corrected in the notes file.
Doesn't affect AGG-02's validity, which is [6,7] for the reason recorded in R21 regardless.

**Status confirmed, no file change:** both proposed tags (`en-comparison-vehicle-misread`,
`en-parallel-read-as-sequence`) stand ready per the batch's own `proposedMisconceptions` block;
`en-negation-dropped` is correctly filed under `gapsObserved` — an observed gap with no instance in
this cluster, not a proposal — and stays there, unentered. `en-comparison-vehicle-misread` is already
ACTIVE in the library; `en-parallel-read-as-sequence` is not yet in the DB. Neither created here — the
batch is still unimported (0 AGG items in `Item`), and creating a standalone misconception ahead of
its batch is a step nobody asked for this pass; flagged as the natural next action if the batch is
formally imported.

**Found, not fixed — two pre-existing blocking gate failures, untouched by this pass:** running the
whole cluster through `checkItemChildFacing` (the production gate, not a hand-check) turned up
`AGG-03` (walkScript, 2 long words) and `AGG-08` (stem, "ordinary, extraordinary") already failing.
Neither is part of this ruling; both are the reviewer's content to fix, reported rather than touched.

Both file copies (`items/` and `to-cluecrew/`) kept identical throughout, per the file-based pilot
workflow — this batch has never been imported, so there is no DB copy to diverge against yet.

## R47 — Hand-editing reviewed content is not a sanctioned path
*David, 2026-08-11, ruling on the AGG-06 mystery. Recorded by David.*

**Ruling: harmless that time is not a control.** The AGG-06 investigation found no actor for the
change and could not rule one in or out. Rather than treat "the value happens to be correct" as
resolution, the ruling is that the METHOD was the fault regardless of outcome — a direct Python edit
to a file mid-review is a process violation whether or not it lands on the right content, because
nothing distinguishes that edit from an unexplained one. This session's own prior turns had been
doing exactly this: hand-editing `ENG-004-anne-green-gables.json` in `~/Downloads/11+` via ad-hoc
scripts. That is now closed.

**What's built, not just written down:**

- **One canonical, git-tracked copy.** `content/pilot-review/ENG-004-anne-green-gables.json` (plus
  `ENG-004-CLUSTER.md`, `ENG-004-PILOT-NOTES.md`). Seeded from the state hash-verified at
  `749a8a6a13286fce` — the content this log already confirmed as R46's correct outcome — via an
  explicitly logged bootstrap migration (`scripts/migrate-pilot-to-canonical.ts`), not a silent copy.
- **Locked at rest.** `chmod 444`. `scripts/lib/pilot-review.ts` is the only code that unlocks it,
  and only for the duration of one write. **Tested, not assumed:** a direct write attempt against
  the locked file was run and confirmed `EPERM`.
- **Gated on write, scoped to what a ruling touches, not the whole batch — a design bug testing
  found, not one designed in.** The first version gate-checked every item in the file; against a
  real batch carrying two pre-existing, already-flagged failures (AGG-03, AGG-08) awaiting the
  reviewer's own redraft, that would have refused every future ruling on this file until those two
  specific items were fixed by someone else's hand. Rule kept: a ruling may not introduce a new
  failure on what it touches; it is not required to fix a failure it didn't create.
  `reportGateStatus` is the read-only counterpart — every item's status, touched or not, so a
  pre-existing fault stays visible rather than swallowed by the narrower scope.
- **Logged, append-only, independent of git.** `content/pilot-review/RULING-LOG.jsonl` — every
  write, who ruled it, who recorded it, what it touched, the gate verdict.
- **`~/Downloads/11+` demoted to a mirror.** `pnpm export:pilot` generates what Cowork reads, banner-
  stamped "DO NOT EDIT." `pnpm import:pilot` diffs anything coming back field by field and applies
  NOTHING automatically — a human reads the diff and applies accepted fields through the sanctioned
  path. The two old loose copies are `chmod 444`'d and left with a pointer to the new location,
  rather than deleted — reversible, not destructive, since deletion wasn't what was asked for.
- **A loud emergency override**, not a silent one: `emergencyOverridePilotFile` requires a `reason`
  (no default — an empty one throws), prints an unmissable banner, and tags its log entry
  `emergencyOverride: true` so a future reader can never mistake it for an ordinary ruling.

**Confirmed through the new single path** (`readPilotFile`, not a raw parse): AGG-02's walk script,
AGG-06's retag and corrected summary array, AGG-11's confirmed T3 and rationale, and the recomputed
`tierDistribution` all still hold exactly as R46 recorded them. The two pre-existing gate failures on
AGG-03 and AGG-08 are unchanged and still visible via `reportGateStatus`.

**AGG-03 and AGG-08 are NOT fixed in this pass.** Anne's suggested wording for either redraft does
not exist in any file this session has access to — checked `ENG-004-PILOT-NOTES.md`, `ENG-004-
CLUSTER.md`, and the batch file itself. Rather than draft wording and attribute it to her, both are
held, exactly as `tn-teacher` was held under the same discipline (R36).

**The mystery itself remains open**, and is recorded as open rather than settled: three independent
read/investigation passes found no actor, ruled out Google Drive (no registered sync roots) and
iCloud Desktop/Documents sync (doesn't cover `~/Downloads`), found a live Claude Desktop process
with standing same-user access to the folder and no direct evidence tying it to this specific write.
The fix in this entry does not depend on ever answering that question — it removes the CLASS of
vulnerability (an editable file with no lock, no gate, no log) regardless of what caused this one
instance.

## R48 — English's T4 target has no derivation; the census says so in its own words
*David, 2026-08-11, ruling on the target's provenance before the shortfall arithmetic is trusted.
Recorded by David.* **Superseded as of R52, below — a figure now exists. This entry stays as the
record of the state before it did: true when written, not the current answer.**

**Every file checked, so the negative is a finding, not a gap left open as a search:**

- `content/batch-mix.json` (the RATIFIED census — Okafor reads only this, never the difficulty map,
  per Addendum E §2) carries an `english` pool entry whose entire content is:
  *"EMPTY — pending BUILD-DISTRICT-ENGLISH. Deliberately carries no mix: the spec is unwritten, so
  any number here would be invention."* This is the platform's own record, already correct, already
  refusing to invent the figure this log's R21 paragraph then went ahead and used.
- `difficulty-map.json` — `"campaign": "ClueCrew corpus analysis — PASS 1 (VR)"`, `papersAnalysed`
  entirely VR papers (`VR_1`, `VR_2`, `VR_3`, `cgp-gl-vr`, `cgp-assess-vr`). Its
  `overallTierDistributionPct` (9.0/30.2/39.5/**19.2**/2.0) is VR data. VR's `19.2%` T4 is what the
  user's question named directly.
- `english-question-taxonomy.json` — the district's actual English corpus evidence. Gives
  QUESTION-TYPE shares (`classicGLEnglishMixPct`: SPaG 56.3% aggregate, retrieval 17.5%, inference
  13.6%, etc.) and a tier CEILING finding (`SCP-E-6`: no T5 observed, cap at T4). **Never a T1–T5
  percentage mix.** Question-type share and tier-difficulty share are different axes; this file
  answers the first and was never asked the second.
- `batch-mix-proposal.json` (the working draft the ratified file above was copied from) states it
  outright: `"ENGLISH": {"note": "No batch mix proposed yet — BUILD-DISTRICT-ENGLISH spec not
  written."}` — while its `VR` and `MATHS` entries each carry a full corpus-derived proposal with a
  named rationale (SCP-VR-5, SCP-M-2) and a source file (`difficulty-map.json`,
  `maths-topic-tier-map.json`).

**What the 20% and 25% figures in circulation actually are, traced precisely rather than assumed:**

| figure | where it's from | is it English's? |
|---|---|---|
| **20%** (`cluecrewTargetMix`, the user's figure) | `batch-mix.json`'s `specDefault` for VR — the platform's PRE-CORPUS baseline, superseded once VR ratified its own corpus figure (T4=18%) | No. Not even VR's CURRENT number — VR itself has moved off it. |
| **25%** (R21's figure, corrected above) | Most plausibly `independent-prep`'s `specDefault` (T4=25%, status "UNCHANGED… per the independents evidence"), the CEM/independent-track default — the format family ENG-004 (non-GL, graduated, T5-reaching) resembles | No. That default is itself uncorroborated by any English-specific pass; it moved across by FORMAT resemblance, not by evidence. |

**The ruling, stated the way it needs to be trusted:** nobody derived an English tier-mix figure.
Every number attached to "English T4 target" traces to a DIFFERENT district's pre-corpus default,
carried over by resemblance or convenience, never validated against English's own corpus evidence
the way VR's and Maths's targets were. This is now the sentence that gates whether the shortfall
arithmetic in R21's yield finding means anything: it does, because that finding is a raw COUNT
(~30 T4 items from 15 extracts) that never depended on a percentage; the percentage framing this log
used alongside it did not.

## R49 — Technique repetition joins the serving conditions list
*Annie, 2026-08-11, from the T4 purpose bounding rule's own duplication-across-passages finding.
Recorded by David.*

`T4-PURPOSE-BOUNDING-RULE.md`'s own census: **thirteen viable whole-text-purpose items across the
extracts carry only nine or ten genuinely distinct techniques.** Named pairs that share a device —
Wind in the Willows and The Jungle Book (near-identical anthropomorphism items); Tom Sawyer, Anne of
Green Gables and A Christmas Carol (three variants of "the reader sees what a character cannot");
Canterville and Mill on the Floss (both register-mismatch comedy).

**Joins R19's list rather than being handled ad hoc once volume starts** — same category as the
comma mirrored-pair rule: something a CONTENT finding assumes but the SERVING layer must
independently enforce, and nothing in serving currently reads for it. Two items sharing the same
underlying technique must never be drawn into the same mock sitting, the same failure mode as the
comma pair (met together, the pattern becomes a giveaway rather than a test of whether the child can
find it unprompted). Unlike the comma pair, this is not a linked two-id constraint — it is a
technique TAG shared across an open set of items across passages, so the serving layer needs a
technique-key field to constrain against, not a pair id.

## R50 — Technique-repetition capping, built
*David, 2026-08-11, scoping and building R49's field. Recorded by David.*

**Cardinality: a single string, not a set.** The two-halved-contrast test (`T4-PURPOSE-BOUNDING-
RULE.md` §3) produces exactly one key stated as one contrast per item, by construction, and the
census names technique CLUSTERS — every item it describes belongs to exactly one device. A set
would model a case the corpus gives no evidence for; building it now would be designing for a
hypothetical, which this build avoids elsewhere on purpose.

**Where it lives:** `stem.techniqueKey`, read the same defensive way `passageNames`/`testedTokens`
already are (`techniqueKeyOf` in `blueprints.ts`, one function so the DB query and any future audit
read the same field the same way) — no strict schema, matching the existing convention for this
class of declared field.

**Presence, derived not asserted:** an item is a whole-text-purpose candidate iff
`difficultyTier === 4` and it carries no `lineRefs` — exactly the bounding rule's own definition
("no line reference"). No redundant "shape" field was added to encode what's already inferable.

**A scope bug the audit script's own first run caught, not inspection — recorded because it is the
same shape of mistake as R41's M-column false positive.** The first version filtered candidates on
`difficultyTier === 4` alone and matched 81 items, nearly all VR (`gen-vr-09-letter-series-08`,
`bank-vr-04-closest-meaning-32`…). `lineRefs` is an ENGLISH-only stem field, so "T4 with no
lineRefs" was true of every T4 item in every OTHER district too — not because they're whole-text-
purpose, but because they have no `lineRefs` field to be absent in the first place. Fixed by scoping
to `questionTypeId.startsWith('en-comp-')` before the lineRefs test. **Correctly scoped, the real
count is 1**: `ENG-001-WIW-22`, DRAFT, no techniqueKey — the first real candidate, not yet resolved,
because assigning it a value is an authoring judgement (which device the item tests), not something
this pass should invent.

**Mock-assembly enforcement, tested against three shapes:**
1. Two items sharing a technique never both land in one paper, including two picks within the SAME
   type-mix slot (the `remaining` list is pruned mid-draw, not just filtered once before it starts).
2. Technique exhaustion is a loud SHORTFALL — the same alert path as running out of items outright —
   never a silent same-technique substitution. This required converting a genuinely unreachable
   `if (!item) break` into a reachable one: adding the constraint mid-loop meant the outer
   `available.length < count` gate no longer guaranteed enough picks on its own.
3. A technique used in an EARLIER section excludes a match in a LATER one — the exclusion set is
   whole-paper, matching how `takenThisPaper` already works, not per-section.

**Registry, not an enum.** `pnpm audit:technique-keys` lists every distinct key in use for a human
to eyeball for near-duplicate spellings of the same device — no fixed list, because only 3 of the
census's 9–10 distinct techniques are named so far and a closed enum would reject genuine new ones
as the nineteen clusters get authored. Same division as R21's tag-scope finding: the machine checks
presence and format, the reviewer checks whether two keys mean the same thing.

**What this does NOT do:** assign a techniqueKey to any existing item, including `ENG-001-WIW-22`.
The mechanism is built and tested; the vocabulary gets populated as items are authored.

## R51 — The comma linked-pair gap, scoped
*David, 2026-08-11. Flagged twice (R19, R40) without a pass; scoped now so it is a decision rather
than a third drift.*

**The finding that changes the scope: it isn't gated on `composeMockPaper` at all.** Checked fresh
rather than assumed — `authoredBy` across every row in `Item` is one of `ai-draft:claude-fable-5`,
`ai-draft:cowork-vocab-banks`, `ai-draft:cowork-okafor-v1`, `seed`. None is generator output, and
`comma-questionType` items number **zero**. No script calls `generateSpagSample`/`assembleSpagItem`
to persist anything — the only callers are sample-sheet and audit exports (build-time, in-memory).
**This is R30/R40's finding confirmed again, specifically for comma:** the whole SPaG district,
comma included, has no path into `Item` at all. `pairId`-in-`composeMockPaper` is unreachable code
today, not a live risk — there is nothing in the pool for it to fail to protect.

**So "closing the gap" is two separable decisions, not one:**

**Layer 0 — does generated SPaG content get a persistence path at all, and when?** Unscoped here on
purpose: it is a platform decision (build a review-and-import pipeline for generator output, the
way `ENG-004`'s pilot content has one), not a code task this entry can size. Nothing below matters
until this is decided.

**Layer 1 — IF Layer 0 happens, closing `pairId` in `composeMockPaper` is cheap, and mechanically
near-identical to R50's technique-key pass:**
- `stem.pairId` (single string), read the same defensive way as `techniqueKey` — one shared function.
- `MockCandidateItem.pairId?: string`, wired through the same DB-query pattern R50 used.
- The exclusion logic in `composeMockPaper` is THE SAME CODE SHAPE as the technique Set — filter
  `available` against already-used group values, prune `remaining` mid-draw, fall through to a
  shortfall (never a silent substitution) if exhausted. **The "exact-pair vs open-set-tag" distinction
  is a fact about the DATA, not about the algorithm that enforces it** — a Set of "values already
  used this paper" excludes correctly whether the set of members sharing a value is 2 or 20.
- Tests mirroring R50's four, minus the "no-key means unconstrained" case (comma items without a
  `pairId` are simply most of the bank, same as most items have no `techniqueKey`).

**Genuinely different from technique-key, and NOT reusable:** a CONTENT audit verifying every
`pairId` has exactly two members (an orphan or a triple would be a bank error, not a serving one).
Checked today: **3 pairs in `COMMA_BANK`, all size-2, no orphans** — clean now, but nothing
structural keeps it that way as the bank grows, the same "true by luck, not by rule" shape this
whole pass has been hunting. **This audit needs no persistence path and could be built today**,
running directly against `COMMA_BANK` the way `export-param-sweep.ts` runs against generator
functions rather than the database — independently actionable ahead of Layer 0, unlike the
`composeMockPaper` wiring itself.

**Built (2026-08-11, per Cowork's recommendation):** `pnpm audit:comma-pairs` (`scripts/audit-
comma-pairs.ts`), CI-wired. Checks three fault modes, each proven to actually fire before being
trusted — a deliberately broken copy of the bank was run through the logic for each, not just the
clean bank once:

1. **Orphans** — a `pairId` with one member. Confirmed against a stripped copy.
2. **Overfull** — a `pairId` with three or more. Confirmed against a copy with a third sentence
   pointed at an existing `pairId`.
3. **Same-rung pairs** — added beyond the literal cardinality ask, flagged as an addition rather
   than folded in silently: R13's own design note is that a mirrored pair is permitted ONLY because
   it straddles rungs (fronted rung 0, trailing rung 1) — a same-rung pair passes cardinality
   cleanly while failing the actual reason the repetition was allowed at all. Confirmed against a
   copy with one half's rung retagged to match the other.

Current bank: **CLEAN, 0 malformed of 3 declared.**

**Layer 0 recorded as the platform decision blocking Layer 1, not as an open engineering task on
this list.** `composeMockPaper`'s `pairId` wiring stays unbuilt. It is not missing work — it is work
correctly withheld pending whether generated SPaG content ever gets a review-and-import pipeline at
all. Building it now would add code with nothing to exercise it, the same unreachable state
`pairId` is already in, just moved one file over.

## R52 — English's T4 target: 18%, provisional, range 16–20%
*Annie, 2026-08-11, supplying the figure R48 found nobody had derived. Recorded by David.*
**SUPERSEDED — the live ruling is R54 (18.75%, measured, no range). Condition 1 was met by the
complete census (R53): the district figure is 18.75% measured across both streams, not 17.22% from
Stream A alone, and the 16–20% band recorded here is RETIRED TO HISTORICAL rather than narrowed.
This entry stays as the record of the provisional stage — true when written, superseded twice
since. Read R53 for the numbers and R54 for the ruling.**

**Traced, not asserted.** Two independently authored census documents cross-check to the same
number without either citing the other:

- `T4-CENSUS.md` (the locatable-span audit, four independent auditors, five passages each): Stream
  A yields **18 shippable span items across 15 passages.**
- `AUTHORING-BRIEF-ADDENDUM-19.md` (the whole-text-purpose census): **13 of the 15 extracts support
  one.**

`(18 + 13) / (15 × 12) = 31 / 180 = 17.22%`. That is Stream A's measured yield — the source R21's
withdrawn 25% never had (R48) — and 18% is the round provisional figure set against it, with a
16–20% band for the uncertainty a single stream's count carries.

**The coincidence, named so it is never mistaken for corroboration:** VR's own ratified T4 is 18%
(`batch-mix.json`, both practice and mock pools — R48). English's Stream-A-derived figure lands on
the identical number by measuring something else entirely — real GL-format paper analysis for VR,
a passage-craft census for English. **Two unrelated measurements landing near the same point is not
one measurement confirming the other.** Recorded explicitly so a future reader does not read the
match as evidence either way. Superseded for the same reason: neither VR's number nor the
withdrawn 20%/25% platform defaults contributed anything to 18% — it stands on Stream A alone.

**Two conditions before this can be FINALISED rather than provisional — both hers to check against,
not to nudge toward:**

1. **Stream B's whole-text pass, recomputed against the same contrast test — not estimated from
   `craftNotes` structure first.** The trap is real and already visible in the corpus: Stream B's
   `craftNotes.complication` fields are typically written in exactly the shape the two-halved-
   contrast test looks for — `stream-b-04`'s reads *"Reuben knows he is leaving... It is never
   stated. The evidence is behavioural: [six listed behaviours]."* That LOOKS like a ready-made
   contrast before anyone checks whether it survives the plot-summary test, the three-separate-
   instances test, or the half-pattern-distractor requirement — the four checks the two-halved
   test does not, by itself, replace. Estimating Stream B's yield from how its craftNotes read is
   the same fault R41 already named once: a plausible-looking property check standing in for the
   family's own definition. The census itself already knows why Stream B is more T4-fertile — its
   own note: *"every craftNotes.complication was written as 'the character believes X, the
   evidence says Y' — T4 architecture by design."* Fertile is not the same as checked.

2. **The technique-repetition cap (R49/R50) tested against 18% specifically — and not before the
   cap and the blueprints exist together.** Her structural point, recorded rather than computed
   here: **once the cap is enforced, one paper's achievable T4 rate is bounded by how many
   DISTINCT techniques fall among the passages that specific paper draws from — not by the
   district average.** A district sitting at a clean 18% can still hand one child a paper drawing
   three passages that all reduce to the same technique cluster (Tom Sawyer / Anne / A Christmas
   Carol are already one cluster — R49) and a different child a paper with five genuinely distinct
   devices. The first paper's ACHIEVABLE T4 rate is capped well below 18% once the cap refuses the
   second and third repeat; the second could legitimately run higher. **The real range — plausibly
   10% to 25% per paper against an 18% district figure — is not computed here, on purpose:** it
   depends on which passages a real blueprint draws from and how the technique registry actually
   distributes once populated, neither of which exists yet (R50: the registry has zero entries
   today). Report the ACTUAL spread once the cap and real blueprints exist together. **18% must
   never be written down as a per-paper expectation — only a district one.**

**House doctrine, hers, recorded because it applies past this one number:** a GENERATED district
(VR, Maths, NVR) chooses its tier SHAPE as a design decision — the family's `structuralParams`,
its number ranges, are authored to hit a target. **Comprehension's T4 supply is not that kind of
knob.** It is a property of WHICH PASSAGES WERE COMMISSIONED, not a fixable gap in the fifteen
extracts already acquired — Wind in the Willows and Eighty Days yield zero locatable-span T4 items
each because their narrators gloss their own points, and no amount of drafting effort recovers a
contrast the prose itself states outright. **The lever is commissioning future passages with the
contrast structure specified from the start** — `T4-CENSUS.md` already names the specification:
*"a minimum separation of ~15 numbered lines between the halves of the complication, and prohibit
narratorial signposting of the gap."* This is flagged for **whoever curates the next passage set**,
not as an instruction to draft harder against the current fifteen — the nineteen remaining clusters
are drafted from what exists, per `AUTHORING-BRIEF-ADDENDUM-19.md`; this doctrine governs what gets
commissioned after them, not what gets extracted from them now.

## R53 — The district total, and the second registry dimension
*Annie, 2026-08-11, on the complete census (`T4-CENSUS-COMPLETE.md`, both shapes, all twenty
passages). Recorded by David.*

### The number, and the shortfall

**45 T4 items across 240 — 18.75%.** Twenty-seven locatable-span, eighteen whole-text purpose;
every one of the twenty passages yields at least one. Arithmetic re-derived independently from
`t4-census.json` rather than taken from the prose headline: the per-passage `shippableInOnePaper`
values sum to **27**, matching the span figure exactly, and `45 / (20 × 12) = 18.75%`.

| stream | passages | span | whole-text | total | share |
|---|---|---|---|---|---|
| A (curated extracts) | 15 | 18 | 13 (87%) | 31 | 17.2% |
| B (commissioned) | 5 | 9 | 5 (100%) | 14 | 23.3% |
| **district** | **20** | **27** | **18** | **45** | **18.75%** |

**Against the 20% house default: three items short** (`0.20 × 240 = 48`; `48 − 45 = 3`). Recorded
as the number to close **if** Anne rules the target stays at 20%.

**That "if" is load-bearing and stays open.** Whether 20% is even English's figure is a SEPARATE
question, already answered once in the negative: R48 established that 20% is VR's superseded
pre-corpus `specDefault`, that VR itself has since moved off it to a corpus-derived 18%, and that
no English-specific tier mix has ever existed. The three-item gap is arithmetic against a default
nobody has yet ruled applies here. **Do not let the shortfall become the argument for the target** —
that inverts the order R48 was written to protect, and 18.75% measured sat inside R52's then-live
16–20% band without any items being added at all. *(That band is now retired — R54.)*

**R52's condition 1 is MET.** Stream B was recomputed against the contrast test rather than
estimated from `craftNotes` structure — and the prediction R52 made about that trap was confirmed
firing: see §1 of the authoring brief. The district figure moves from 17.22% (Stream A alone,
provisional) to **18.75% (both streams, measured)**.

### The second dimension: answer shape

**The finding: two items can carry DIFFERENT technique tags and still be near-duplicates in a
child's answer booklet, because the technique is what the WRITER did and the answer shape is what
the CHILD writes down.** The census's own case: `b-01` (the writer never uses the word *wasp*,
supplying the hum, the counting and the nest instead) and `b-04` (a rule kept for others, broken
for himself) are genuinely different devices — and both reduce, in the child's hand, to *"the
writer never names X, but gives you the evidence for X."* R50's registry keys on device. It would
pass this pair.

**This is a genuine second axis, not a re-cut of the first — and that is the thing to check before
building, because a re-cut would be cheaper and wrong.** The two axes cross rather than nest:
- The `claim-contradicted-on-the-page` technique family holds five items (A Christmas Carol,
  Canterville, Pride and Prejudice, b-03, b-05) — one technique, and the census does not claim they
  share an answer shape.
- b-01 and b-04 share an answer shape across two different techniques.

One technique spanning several answer shapes, and one answer shape spanning several techniques.
Neither field determines the other, so neither can be derived from the other — which is precisely
why this cannot be solved by renaming or re-clustering `techniqueKey`.

**Scope, same treatment as `techniqueKey` (R49/R50):**

- **`stem.answerShape`, a SINGLE string**, read through a shared `answerShapeOf` beside
  `techniqueKeyOf` — same defensive JSON read as `passageNames`/`testedTokens`, author-declared,
  never derived. Single for the same reason `techniqueKey` is: an item has one thing the child
  writes down. The evidence for a set does not exist in the corpus.
- **`MockCandidateItem.answerShape?: string`**, wired through the same DB-query pattern R50 used.
- **The exclusion logic is the SAME CODE SHAPE, and that is the whole economy of this** — R51
  already established the general form: a `Set` of "values already used this paper," filtered
  against `available`, pruned from `remaining` mid-draw, falling through to a loud shortfall rather
  than a silent substitution. `composeMockPaper` would carry **two** such Sets rather than one, not
  two different algorithms. The R50 tests generalise the same way.
- **Audit: extend `pnpm audit:technique-keys` to a second registry** rather than writing a new
  script — presence on every whole-text-purpose T4 item, kebab-case format, and the same
  open-ended eyeball registry (no enum: the census names one answer shape explicitly and implies
  others, so a closed list would reject genuine new ones exactly as it would have for techniques).
- **The cross-tabulation is the new reporting need, and it is what makes the second dimension
  earn its place:** technique × answer shape, so a reviewer can see a cell holding two items that
  look distinct on both axes separately but collide on the pair. That table is what neither
  registry alone can show.

**Not built in this pass.** Same reason as R51's Layer 1: `composeMockPaper` cannot exclude on a
field no item carries, and today **zero items carry `techniqueKey`** — the registry R50 built is
empty (its own audit reports `0 distinct techniques in use`). Adding a second empty registry
alongside the first buys nothing until the nineteen clusters are drafted and both fields get
populated. **The decision recorded here is the SHAPE**, so that when authoring starts, both fields
are declared together on the same item in one pass rather than `answerShape` being retrofitted
across a bank that already exists — which is the expensive order, and the one this entry exists to
avoid.

## R54 — English's T4 target: 18.75%, measured, live. The range is retired.
*Annie's final ruling, 2026-08-11. Recorded by David. Supersedes R52; the numbers are R53's.*

**The target is 18.75% — the measured district figure, not a round number set against it.** Live
as of this entry. `45 T4 items / 240` across twenty passages, both shapes, every passage yielding
at least one (R53, arithmetic re-derived from `t4-census.json` rather than taken from a headline).

**The 16–20% range is RETIRED TO HISTORICAL.** It is not narrowed, not tightened, not kept as a
tolerance — it stops being a live instrument. Her reasoning, recorded because the reasoning is the
part that generalises:

> The range was a hedge for a state that no longer exists. It was set when only Stream A had been
> honestly counted, and its width was the uncertainty a single stream's count carries. Stream B has
> now been counted the same way, so the thing the hedge was hedging against is gone.
>
> **A live range invites the same failure as a point target, with two numbers to be tempted by
> instead of one.** A range does not prevent drafting-to-the-number; it widens the target you can
> draft to, and it supplies a floor to settle for and a ceiling to claim. The measured figure has
> the property neither a point target nor a range has: **it is a description of what the passages
> actually yielded, so it moves only when the content moves.**

**The sequence, so the history is legible rather than three entries to reconcile:**

| entry | figure | status |
|---|---|---|
| **R48** | *no figure exists* | Historical. Established 20%/25% were other districts' defaults; no English tier mix had ever been derived. |
| **R52** | 18%, provisional, range 16–20% | Superseded. Stream A alone (17.22%), rounded, hedged for the missing stream. |
| **R53** | 45/240 = 18.75%, measured | The numbers. Both streams, both shapes, arithmetic verified. |
| **R54** | **18.75%, measured, LIVE. No range.** | **Current.** |

**What this settles about the three-item shortfall (R53).** It does not close it — it reframes what
closing would mean. The gap was arithmetic against a 20% default that R48 showed was never
English's, and the target is now the measured figure, so **there is no shortfall against the live
target: 18.75% IS the yield.** The three-item figure survives only as the answer to a conditional
nobody has ruled in favour of — *if* 20% were imposed as English's target, three items would close
it. Recorded, not pursued. R53's warning stands and is now structural rather than advisory: the
shortfall cannot become the argument for the target, because the target no longer references it.

**The doctrine this rests on is R52's, unchanged and now load-bearing:** comprehension's T4 supply
is a property of which passages were commissioned, not a knob content work can turn on the existing
twenty. A measured target is the honest expression of that — it reports the yield rather than
setting a quota against it. **The lever remains commissioning** (`T4-CENSUS.md`'s specification:
minimum ~15 numbered lines between the halves of a complication, no narratorial signposting of the
gap), and the figure will move when the next passage set lands, because the content moved — which
is the only reason it should ever move.

**Still open, unchanged by this ruling:** R52's condition 2 — the technique-repetition cap tested
against the live figure once the cap and real blueprints exist together. 18.75% is a DISTRICT
figure. The per-paper spread is bounded by how many distinct techniques fall among the passages a
given paper draws from (R49/R50), and R53's answer-shape finding narrows it further. **18.75% must
never be written down as a per-paper expectation**, exactly as 18% must not have been.

## R55 — pairId's serving wiring is Layer 0-blocked; techniqueKey's was not, and was silently broken
*David, 2026-08-12, scoping the comma linked-pair gap the way R51 scoped its cardinality audit.*

**The question:** is `composeMockPaper`'s `pairId` exclusion buildable now against `COMMA_BANK`
directly — the pattern that made the cardinality audit and the technique-key audit buildable ahead
of any persistence path — or does it depend on the Layer 0 decision?

**Answer: Layer 0, and the distinction is structural rather than a matter of degree.**

The two audits are buildable now because they read AUTHORED SOURCE. `audit:comma-pairs` runs against
`COMMA_BANK`, a TypeScript constant; `audit:technique-keys` runs against `Item` rows that already
exist. **`composeMockPaper` reads neither.** Its `candidates` come from `prisma.item.findMany`, so it
can only exclude on a field that PERSISTED items carry. Measured today: **737 items in `Item`, zero
carrying `stem.pairId`** — and none can, because comma items are generator output and generated SPaG
has no persistence path at all. That is not a missing field in an importer; there is no importer.
Building the wiring would produce code as unreachable as `pairId` is now, relocated one file over.
**Correctly withheld, unchanged.**

**But the comparison case did not survive the same check, and that is the finding.** R51 and R53
both reasoned that `techniqueKey`'s wiring was worth building while `pairId`'s was not, on the
grounds that comprehension items have a live import path. They do — `import-english-items.ts`, which
put the 78 English items in the database. **It does not carry `techniqueKey`.** The importer builds
`stem` from an explicit ALLOWLIST, so a declared `techniqueKey` was dropped in silence at the door.

**This is the third instance of one defect**, and the second time this exact file has produced it:
- R23's `quotes` — declared in the right place, read from the wrong one.
- R42's `passageNames` — the field R23 introduced, never added to this importer's allowlist.
- Now `techniqueKey` — same allowlist, same silence.

And it is R42's OTHER finding as well: **the two import doors disagreed again.** The CMS path's
`stemSchema` is `z.record(z.unknown())` — a passthrough that preserves any stem field — while the
script path enumerates. So the same authored item keeps `techniqueKey` through one door and loses it
through the other. R42 closed the doors' disagreement about the child-facing GATE; this is the same
two-doors shape one level down, in what a stem is permitted to carry.

**Fixed, with `answerShape` accepted alongside it** per R53's ruling that the two are declared
together in one pass rather than retrofitted across a bank that already exists. Verified by threading
a batch item carrying both through the importer's own `stemObject` construction and reading it back
with `techniqueKeyOf`, including a JSON round trip to match how Prisma stores it.

**What this would have cost if it had gone unfound:** the nineteen remaining clusters begin drafting
against a brief that now instructs authors to declare a technique on every whole-text-purpose T4
item (R49/R50). Every one of those declarations would have vanished at import, `composeMockPaper`
would have found nothing to exclude on, and the repetition cap would have reported itself working
while protecting nothing — an empty registry being indistinguishable from a registry whose contents
were thrown away at the door.

**The general shape, worth stating because it is now three-for-three:** an explicit allowlist that
silently drops what it does not name is a gate that fails OPEN and reports success. Every field this
project has added to a stem has hit it. The next one will too, unless the allowlist is replaced by
the passthrough the CMS door already uses — recorded as the standing fix rather than actioned here,
since changing what a script importer accepts wholesale is a wider decision than closing the field
that is live today.

## R56 — Sizing the allowlist-vs-passthrough decision
*David, 2026-08-12, raising R55's standing recommendation as its own item before acting on it.*

**The question:** if `import-english-items.ts` moved to the passthrough the CMS door already uses,
what would it newly accept, and does anything rely on the allowlist rejecting an unnamed field
INTENTIONALLY — as a validation boundary — rather than by accident?

### What the allowlist actually is

Measured across the 737 persisted items: **20 distinct `stem` keys exist; the script importer
produces 9** (`prompt`, `passageRef`, `lineRefs`, `gapRef`, `quotes`, `testedTokens`,
`passageNames`, and now `techniqueKey`/`answerShape`).

The other eleven — `words`, `operands`, `series`, `sum`, `code`, `clues`, `question`, `sentence`,
`stemWord`, `pairA`, `word1`/`word2`, `wordWithGap` — reached the database by **other paths
entirely**. Traced by author: they belong to `ai-draft:claude-fable-5` (the VR/maths generator via
`generate-content.ts`) and `seed`. The only author whose items came through this importer,
`ai-draft:cowork-okafor-v1`, carries exactly the allowlist and nothing else.

So the allowlist has never actually rejected anything that arrived — **it matches its own traffic
exactly.** The three fields it dropped (R23's `quotes`, R42's `passageNames`, R55's `techniqueKey`)
were dropped because they were newly introduced and nobody updated the list, not because a batch
tried to smuggle something past a boundary.

### Does anything rely on the rejection? No — and the boundary people assume it provides is elsewhere

The intuition worth testing was that the allowlist keeps this an ENGLISH importer. **It does not.**
The district boundary is enforced by two other things: `district: 'ENGLISH'` hard-coded at both the
question-type upsert and the item create, and a fixed `QUESTION_TYPES` list the mechanic is looked
up from. The stem allowlist does no validation work that is not already done by those.

Worse, as a boundary it fails in the unsafe direction. Hand this importer a VR batch today and it
would not refuse it — it would strip `series`/`words`/`code` and **create a structurally broken
item carrying only a prompt.** Passthrough would let that item arrive intact and fail visibly
downstream. The allowlist does not prevent wrong-district input; it silently corrupts it.

**Nothing anywhere rejects an unknown stem key.** The CMS `stemSchema` is
`z.record(z.unknown()).superRefine(...)` — a passthrough that VALIDATES five known keys when present
(`passageRef`, `lineRefs`, `quotes`, `testedTokens`, `sentence`) and passes everything else through.
There is no strict schema on `stem` anywhere in the codebase.

### One live asymmetry the sizing surfaced

The CMS door validates **`sentence`**, a key **81 persisted items carry** — and the script importer
does not accept it at all. English's own R1/R3 make `sentence` the canonical field for error-spot
and cloze stems ("the sentence IS the format"). So the moment an English batch carries an
error-spot or cloze item shaped that way, **the script path drops its stem body today**, and the
two doors disagree about what an English item may even contain. That is R42's finding again, in the
same file, and it is latent rather than theoretical.

### What changes, and the one interaction worth knowing about

**Newly accepted:** whatever an English batch carries beyond the nine — realistically new English
fields as they are introduced, which is precisely the class that has been silently lost three times.

**Not newly accepted:** anything district-crossing. The `district: 'ENGLISH'` hard-code and the
`QUESTION_TYPES` list are untouched by this decision.

**The interaction to know about, flagged rather than blocking:** `fingerprintItem` →
`normaliseItemText` → `textParts` walks stem VALUES recursively, so any field's value text feeds an
item's similarity fingerprint. This is **not live on the script path** — it does not fingerprint or
screen at all, so R55's fix introduced no drift — but it is live on the CMS path, which is already a
passthrough. The specific consequence worth recording: **`answerShape`'s value would make two items
sharing an answer shape look MORE textually similar to the fingerprinter** — inflating the score for
exactly the pair the field exists to tell apart. Two systems designed separately, meeting in one
JSON column. Not a reason to withhold the change; a reason for whoever wires `answerShape` into
serving to check whether tag fields belong in the fingerprinted body or beside it.

### Recommendation

**Adopt the CMS's exact pattern — passthrough PLUS validate-known-keys — not a raw passthrough.**
That removes the silent-drop class permanently, keeps every check the CMS door already performs,
and makes the two doors agree on what a stem may carry, which has now been the fix for three
separate findings (R42, R55, and the `sentence` asymmetry above). The cost is one function; the
allowlist it replaces is protecting nothing that another mechanism does not already protect.

**Not actioned here.** It is a change to what a shared import door accepts, and R55 raised it as
deserving sizing before doing — this entry is that sizing, not the doing.

## R57 — Passthrough plus validate-known-keys is the standard for every import path
*David, 2026-08-12, adopting R56's recommendation. Recorded by David.*

**The rule, and it is a STANDARD rather than a correction to one file:**

> An import door VALIDATES a stem; it never FILTERS one. Every key the schema knows is checked when
> present. Every key it does not know passes through untouched. A door that drops what it cannot
> name is a gate that fails OPEN and reports success.

**Built as one shared definition, not two that agree today.** `stemSchema` moved out of
`apps/web/lib/actions/admin-items.ts` into **`packages/core/src/item-stem.ts`**, and both doors now
import it. It MOVED rather than being copied, deliberately: two doors that enumerate separately
drift, which is precisely what R55 found between these two. One definition is what makes them agree
by construction instead of by coincidence — the same fix shape as R42's `checkItemChildFacing`
unification, one level down.

The script importer now spreads whatever the batch declared inside `stem`, then validates. `text`
and `prompt` are excluded from the spread because that is a RENAME to the canonical `prompt`, not a
drop — stated in the code so a later reader does not mistake it for the fault being fixed.

**Verified against all four cases rather than assumed:**
1. `sentence` survives — the live gap R56 measured on 81 items, closed before an English error-spot
   or cloze batch hit it.
2. An unknown field survives and validates — the passthrough half genuinely works.
3. A KNOWN key of the wrong shape is REPORTED, not written — validation is not weakened, and a
   malformed `lineRefs` still names the superseded `{from,to}` shape.
4. `passageNames` and `techniqueKey` — two of the four fields lost historically — both survive.

CMS behaviour is unchanged: its five e2e specs pass, which is what proves the move was a move.

**Why this is the standard and not a one-off.** It is the FOURTH time this exact shape has closed a
finding, and each time the previous fix was correct but too narrow:

| finding | what was lost | the fix then |
|---|---|---|
| R23 | `quotes` | read from the right field |
| R42 | `passageNames` | add it to the allowlist |
| R55 | `techniqueKey` | add it to the allowlist |
| R56/R57 | `sentence` (latent, 81 items) | **stop having an allowlist** |

The first three each fixed the instance and left the mechanism. This one removes the mechanism, so
the fifth field does not need a fifth ruling. **Any future import path validates by calling
`stemSchema`, never by re-listing the fields it expects** — that is the durable half of this entry.

## R58 — Open: does a tag field belong in the fingerprinted body, or beside it?
*Raised by David, 2026-08-12, from R56's sizing. Not blocking anything now.*

`fingerprintItem` → `normaliseItemText` → `textParts` walks stem VALUES recursively, so **any field's
value text feeds an item's similarity fingerprint.** That is correct for prose and wrong for tags,
and `answerShape` is the case where it bites:

**Two items sharing an `answerShape` would look MORE textually similar to the fingerprinter —
inflating the similarity score for exactly the pair the field exists to tell apart.** The field's
whole purpose (R53) is to mark items that are distinct in prose but collide in what the child
writes; the fingerprinter would read the shared tag as evidence the prose is similar too.

**Not live, and the reasons matter for whoever picks this up:** the script import path does not
fingerprint or screen at all, so R55's and R57's changes introduced no drift. The CMS path does
fingerprint, and has always been a passthrough — so this interaction predates both, and no item
carries `techniqueKey` or `answerShape` yet.

**The question to answer before `answerShape` is wired into serving:** does a machine tag belong
inside `stem` — the fingerprinted body — or beside it in a column of its own? Both fields are
authored metadata about the item rather than content a child reads, which is an argument for
beside; `stem` being an open JSON object with no migration cost is the argument for inside, and is
why they are there now. **Two systems designed separately, meeting in one JSON column.** Whoever
wires the serving exclusion should rule on it then, with the registry populated, rather than now
with both registries empty.

## R59 — The comma linked-pair wiring, built. R55's premise had been removed by R57.
*David, 2026-08-12. Re-scoped on request; the answer changed, and it changed because of work done
in between.*

**Neither option as posed, and the first is a category error worth naming.** "Buildable against
`COMMA_BANK` directly" is what made the two AUDITS buildable — they check authored source.
`composeMockPaper` reads `prisma.item.findMany`. A serving function cannot be built against a bank,
because it excludes among what is PERSISTED, not among what was authored. That distinction is the
one R51 drew and it still holds.

**On Layer 0: R55 said blocked. That was true when written, and my own R57 work removed the
premise.** Measured now rather than restated:

- The English importer's `QUESTION_TYPES` includes **`en-spag-punct-spot`** — the type a comma item
  is. It was never comprehension-only.
- Post-R57 that door is passthrough-plus-validate, so **a declared `stem.pairId` now survives
  import** — verified directly, schema accepts it.

So the blocker changed CHARACTER, from structural to ordinary:

| | R55 (2026-08-12, earlier) | R59 (now) |
|---|---|---|
| generated comma items | no persistence path | unchanged — still Layer 0 |
| **authored** comma items | allowlist dropped `pairId` | **path open** |
| what blocks the wiring | a platform decision | nothing — only that no item carries it yet |

**That is exactly `techniqueKey`'s status, whose wiring IS built (R50) with zero items carrying it.**
Withholding one while building the other, when both have open paths and empty populations, is an
inconsistency that would itself have become a finding. **Built.**

**The honest asymmetry, stated because it is the one argument against:** the brief instructs authors
to declare `techniqueKey` on the nineteen clusters, so planned work will populate it. Nothing
schedules hand-authored mirrored comma pairs. The path is open; no one is walking it. That makes
this weaker than R50's case — but the failure mode of NOT building is silent: the moment anyone
authors a linked pair, R19 #2 goes unenforced with nothing reporting it, which is the shape this
whole sequence has been closing.

**Generalised rather than duplicated.** The second exclusion is not a second Set and a second loop —
`composeMockPaper` now carries a small **dimension table** (`{name, of, used}`), because R51
established these are one algorithm over different data and R53 has already scoped a third
(`answerShape`). The third is a row, not a third copy. All 27 pre-existing technique tests pass
through the generalised path unchanged, which is what proves the generalisation was a refactor.

**Three tests added:** both halves of a pair never co-occur; pair exhaustion is a loud SHORTFALL, not
a silent both-halves draw; and the two dimensions are INDEPENDENT — a shared technique excludes even
when `pairId`s differ, and vice versa. 577 tests pass.

**Correcting my own record:** R51 ruled this "not worth building until Layer 0 is decided… dead code
exactly as unreachable as `pairId` is today." That reasoning was sound on its premise and the premise
is gone — not because Layer 0 was decided, but because a different fix (R57) opened the door
incidentally. **A withheld decision should be re-checked when the thing it was waiting on changes,
even when what changed was not the thing it was waiting FOR.**

## R60 — A count is necessary but not sufficient: a zero has to be LOUD, not merely visible
*annie, 2026-08-12. Backfilled into the register 2026-08-12 — recorded in CLAUDE.md at the time
and not here, which is the gap R64 closes.*

Every check and every export states the size of the population it actually screened, and when that
population is EMPTY it says so in terms that cannot be read as a pass. **A printed figure alone
does not do this.** `verify:solutions` printed "0 MATHS items checked" in every CI run since it was
written; the zero was in the log every time and still read as a pass, because nothing in the line
said that nothing had been checked.

Three questions, asked of any check BEFORE trusting a green:

1. What does it print when it sees nothing, and is that distinguishable from a clean pass?
2. Does it know anything it MUST find — a canary that fails if the check goes blind?
3. **Is it reading the artefact, or a copy of it?** Weight this one; it is R57's finding in
   checking clothes.

A verdict that is legitimate for a considered gap is the worst possible default for a blind run:
the maths param sweep scored PARTIAL on nineteen families that emitted nothing, PARTIAL meaning
"a recorded judgement", under a "0 disagreeing" headline. An export that delivers must also REFUSE
to supersede a good artefact with a blind one.

## R61 — The fourth register shape: a check named for a population the pipeline never produces
*annie, 2026-08-12. Backfilled 2026-08-12.*

The other three blind-check shapes are faults in the check: wrong scope, a stale proxy, an
unreported denominator. **This one is not.** The check is correctly written and points at something
that has never existed, so its empty run is GENUINELY CORRECT — and neither of R60's first two
questions catches it, because a canary cannot fire on a population that is legitimately absent and
a printed count of zero is the true number.

`verify:solutions` and `check:maths-distractors` are the instance: both correct, both screening a
MATHS item bank that no code path creates.

**The guard is a DECLARATION, not an inference.** Any gate whose population could legitimately be
empty says so explicitly, once, in writing, with the reason — `declareMayBeEmpty()` in
`scripts/lib/population.ts`, which reprints that reason on every empty run so a temporary gap
cannot decay into a green tick. **Every other gate treats an empty population as a PIPELINE
FAILURE** — `requirePopulation()`. A gate calling neither has not thought about it.

## R62 — Reviewed content is immutable to code changes
*annie, 2026-08-12. Backfilled 2026-08-12. R63 narrows WHICH writers this binds.*

Derived option values are a function of a derivation function, so a change to that function
rewrites every item it owns, reviewed ones included. `seed:items` and `content:generate` both did
this unconditionally, and `content:generate` deleted and recreated every option.

Both now CLASSIFY BEFORE WRITING (`packages/db/prisma/reviewed-guard.ts`). A row is reviewed if
LIVE, RETIRED, or carrying any attribution event. Reviewed-and-unchanged is a no-op; reviewed-and-
would-change FAILS the whole run before a single write, so a refusal leaves the database exactly as
it was. **No warning, no version, no automatic update with a note** — anything softer reintroduces
the same path with a paper trail, and the trail does not help if nobody reads it before serving.

**State the denominator you read.** The exposure was 127 derived+reviewed items, but only 100 were
measurable: a seed run had already overwritten the other 27, so their "no divergence" was trivially
true. Report it as 100 measured, 27 reconstructed — never 127 with a caveat.

**Zero divergence is an OUTCOME, not evidence the design held.** `distractors.ts` changed ninety
minutes AFTER those items were attributed, in a commit touching exactly the four affected families.
The coupling was live, unguarded, and exercised the same day; it happened not to alter those values.
Anyone skimming "all re-derived clean" reads reassurance about the design, and it is the opposite.

## R63 — Which writers need the guard: who authored the value, not how the command is invoked
*Anne + David, 2026-08-12. Three criteria were proposed in sequence; this is the third, and the
only one that is a FACT ABOUT THE CODE rather than a judgement about behaviour.*

**The register catches up first.** R60 (a zero must be loud), R61 (the fourth register shape) and
R62 (reviewed content is immutable to code changes) were recorded in `CLAUDE.md` and not here. They
are house rules that recur, which is why they landed there — but a ruling belongs in the register
too, and three in a row went unrecorded. Cross-referenced now; this entry assumes R62.

### The three criteria, and why the first two fail

| | criterion | what it decides on | why it fails |
|---|---|---|---|
| 1 | **How deliberate the command is** (mine) | intent of the person running it | `seed:items` was deliberate and did its damage on its only run. The person meant to run the seed; they did not mean to rewrite reviewed items. Intent is not about the write. |
| 2 | **Whether it writes reviewable content** (Anne's narrowing) | the FIELDS touched | Measured: **42 of 53** writers touch reviewable fields — the number went UP. Most exist precisely to change reviewed content, transcribing a ruling into a `childHint`, a `description`, a walk script. They ARE the re-review the guard sends you to do. |
| 3 | **Who authored the value** | where the value CAME FROM | Holds. See below. |

Criterion 2's failure is the instructive one. It is not that the measurement disappointed; it is
that guarding all 42 would have left thirty-odd doors permanently running with the override on,
**which makes the override the norm and the guard decorative** — a guard nobody can pass without
disabling is a guard that gets disabled.

### The criterion

> **A DERIVATION FUNCTION computed the value** → it can change because CODE changed, with no human
> deciding anything. Must CLASSIFY BEFORE WRITING (`classifyDerivedWrites`).
>
> **A HUMAN RULING supplied the value** → it changes because a reviewer said so. Needs PROVENANCE,
> not a guard, and already has provenance.

It is a fact about the code — does this file call a derivation function? — so it can be READ rather
than judged. That is the whole difference from criteria 1 and 2, both of which needed someone to
decide how a command would be used or how important a field was.

**On that line the number collapses: exactly TWO writers compute what they write** — `seed.ts` and
`generate-content.ts` — and both were already guarded by R62. A third candidate,
`import-english-items.ts`, NAMES `assembleItem` in a comment rather than calling it, which is why
the checker strips comments and strings before matching.

### The mechanism follows from the criterion being a code fact

`pnpm check:derived-writes` fails any file that both writes a content table and calls a derivation
function without calling `classifyDerivedWrites`. **"Guarded" becomes a property of the write path
rather than an entry on a list of forty files someone has to keep current** — a new deriving writer
fails on the commit that adds it, not on the day it rewrites something a reviewer approved.

Its canary earned itself immediately: the first version looked for the derivation functions in
`packages/core` only, and `seedDerived` is a local helper in `seed.ts`. It reported the function
missing and ABORTED rather than reading every writer as non-deriving — the blind-run failure of R60
question 2, caught by the guard against it.

The 16 one-shot ruling-appliers carry a header saying they write unguarded and that re-running one
on a database carrying rulings can quietly undo a newer one. **A warning, explicitly not the
mechanism** — it informs whoever reads before running, and protects nothing on its own.

### Method recorded alongside: git recovers a lost prior state

Derived values are deterministic functions of code, so **git IS the prior state**. A worktree at the
signing commit, run against operands the database still holds, reconstructs what a derivation
produced then. That is how the 27 seed items I had called "unmeasurable" became measurable — 14 had
changed, all by reviewer ruling, none silent. It answers any derived-value history question, and it
is why a lost prior state is usually not lost.

## R64 — The register is the destination; CLAUDE.md is what a session loads
*David, 2026-08-12.*

Two files hold rulings and they do different jobs. This log is THE REGISTER — the numbered record,
one `## R<n>` heading per ruling, with the reasoning and the evidence. `CLAUDE.md` is loaded at
session start and carries the operative TEXT of the rules that recur, because a rule reduced to
"see R57" is a rule nobody has in context at the moment they would break it.

Both therefore hold content, so they can drift — and did: **R60, R61 and R62 were written into
CLAUDE.md and never reached the register.** Three consecutive rulings, found only because R63 went
to cite R62 and the heading was not there. Measured at the time: the register ran R1–R63 with
exactly those three gaps and no other divergence in either direction.

`pnpm check:register` now fails if a rule cited in CLAUDE.md has no register entry. The reverse is
deliberately NOT asserted — the register holds sixty-odd rulings and only the recurring ones belong
in a session-start file, so "in the register but not in CLAUDE.md" is the normal case. Numbering
gaps are reported but do not fail: a number can be withdrawn deliberately.

**The ordering is the part that prevents recurrence: a ruling goes to the REGISTER FIRST, and
comes to CLAUDE.md only if it recurs.** All three lost rulings were written as house rules first.

## R65 — A signature names a person
*David + annie, 2026-08-12. Three commits: schema, evidence-backed backfill, door guard.*

46 generator signatures resolved to a role account rather than a human. annie raised it at 13, 33
and 46 signatures — **the one item that gets worse purely by waiting**, and the sixteen clusters
will produce more.

**Schema.** A `Reviewer` table with an opaque stable id and a display name nothing keys on, plus a
nullable `reviewerId` on `AttributionEvent`. A bare name is neither stable (a name change means
rewriting 462 rows) nor unique (a second Anne collides silently). `heldFrom`/`heldUntil` are
TIME-SCOPED so a third reviewer inheriting the `current-reviewer` placeholder cannot retroactively
claim these events. `actor` is DEPRECATED IN PLACE, not normalised: the placeholders and the
`actor-identity` REASSIGNED events resolving them are the EVIDENCE for the backfill.

**The backfill argument**, re-checked at run time rather than asserted in prose:

1. All 46 SIGNED events carry `actor: 'current-reviewer'`. Not most — all.
2. An explicit `actor-identity` REASSIGNED event (2026-08-06) maps `current-reviewer` → annie. A
   recorded mapping, not an inference.
3. NONE of joan's 97 `previous-reviewer` events is a SIGNED event, so the ambiguity the
   placeholders create does not reach the thing being backfilled.

Result: 462 → Annie (46 SIGNED), 97 → Joan (0 SIGNED), 0 signatures unnamed.

**A correction forced by measurement.** Selection was scoped by DATE as well as placeholder, on the
assumption the two reviewers occupied different windows. They do not: joan's events span
13:24:01.242–.361 and annie's begin at 13:24:01.278 — **they interleave inside 120 milliseconds**,
because one backfill pass wrote both. `at` is when an event was RECORDED, not when the work
happened. Selection is by placeholder alone.

**The door.** `recordSignature` refuses a `reviewerId` that does not resolve to a Reviewer row;
`check:signing-doors` makes that a property of the WRITE PATH. Detection failed in both directions
first — the bare literal called a READER a signing door, and requiring a `data:` payload found ZERO
writers and printed success. Inverted rule: a SIGNED literal is a write unless it sits in a `where:`
clause. Two of five HISTORICAL exemptions named files that only query; stale exemptions are now
reported.

**The paired statement is generated**, so the signature count cannot be printed without the
event-log figure beside it. Its first version disagreed with annie's own figures because it read the
SYMPTOM (null note/field/hash) instead of the CAUSE (method) — a derived figure that disagrees with
the reviewer's is wrong until explained, not published.

## R66 — Five library entries approved, two more commissioned
*Ruled by Annie, 2026-08-12, on two proposals and a sense-error census covering eight comprehension
clusters. Recorded verbatim.*

### APPROVED AND ENTERED

**`en-within-span-wrong-element`** (36 distractors, all eight clusters)

The option states something true inside the cited window and answers a different question. Approved
because the discriminating property is a conjunction — true, inside, irrelevant — where each half
alone belongs to an existing tag. Boundary against `en-wrong-scope-retrieval` settles by location;
ENG-011-CV-08 carries one of each and fixes the line. Wrong-speaker retained as a named sub-route:
"check whose words these are" is close enough to share the parent hint.

Child hint: **"This one is in the lines. Check it answers the question you were asked."**

Annie's note on why it works — it names the failure of the verification move the child already has.
Her strategy is "is this in the passage", that strategy returns yes, and the hint tells her the
strategy is insufficient rather than telling her she was careless.

**`en-negation-dropped`** (19 distractors, all eight clusters)

The passage carries an explicit negative and the option states the affirmative. 17 of 19 fit
exactly. Boundary against `en-relation-word-flipped`: a relation word joins two propositions, a
negative operates on one. ENG-012-ML-06 is the worked case.

**Three sense entries**, scoped to the ERROR and explicitly not to `en-comp-vocab`:

| entry | census rows |
|---|---|
| `en-vocab-dominant-sense-imported` | 19 of 39 |
| `en-vocab-neighbouring-sense` | 12 |
| `en-vocab-form-lookalike` | 4 |

**Scoping ruling: a tag describing an error that occurs across question types must not be scoped to
one.** This is the corollary of the earlier `en-inference-literal-lookalike` ruling — that one says a
tag scoped to one type must not stretch to another.

Form-lookalike is the sharpest of the three and would have been approved alone. Its hint — "read it
letter by letter and check it is the same word" — is orthographic where the other two are
contextual, and no tag carries both. `vr02-surface-link` exists independently in VR describing the
same child, which is convergent evidence a single-strand census cannot produce.

The S1/S2 boundary is acknowledged soft — a second reader would move rows across it — and approved
anyway, because the two hints differ: S1's child is told the commonest meaning isn't the live one,
S2's is told several meanings fit and the context decides.

### COMMISSIONED, NOT YET DRAFTED

**`en-coordination-wrong-conjunct`** — promoted from a sub-route to its own entry. Where the target
word sits in a coordination (X and Y, X as Y, X as well as Y) the child attaches the meaning to the
wrong conjunct. Five instances across four clusters, executions naming the connective independently.
Ground for promotion: **the cure is syntactic where the parent's is semantic, and one hint cannot
serve both.**

**A whole-text absence entry**, separate from `en-negation-dropped`. "Find the small negative word in
the line" is actively wrong advice where no such word exists; whole-text T4 items were borrowing the
tag for a whole-text absence.

### RETAGS CONFIRMED

- ENG-008-RC-05 → `en-attribute-transfer` (two elements, attributes swapped)
- ENG-006-TM-02 → `en-cause-agent-swap` (wrong performer)

**Both tags existed at drafting time and were passed over for one with no description to fail
against.**

- ENG-006-TM-04 → cold read rather than an asserted retag. An outcome inverted by implication rather
  than by a dropped word may not have a home yet.

### OBSERVED, NOT PROPOSED

S4 part-of-speech slip (n=2) and S5 right-sense-stock-instance (n=1), logged against their items. A
third instance promotes S4.

Annie's note: the grammatical cure argument is real and it will likely come. **Proposing from n=2
and n=1 is the scarcity error running forward** — inventing categories the content hasn't
demonstrated, so the next enumeration has something to reach for.

## R67 — An undescribed tag drifts only if its mechanism has loose edges
*Annie, 2026-08-12. Evidence: the per-cluster distribution below, from Cowork's eight-cluster tag
census. Recorded verbatim.*

Two tags shipped with no library entry across the same eight clusters. Neither had a description or
a child hint. **Their behaviour was opposite.**

| tag | per-cluster distribution | total |
|---|---|---|
| `en-within-span-wrong-element` | 1, 1, 1, 3 → 8, 5, 9, 8 | 36 uses |
| `en-negation-dropped` | 1 to 4 per cluster throughout | 19 uses |

Nothing about the passages changed between the fourth and fifth clusters. **So the absence of a
description is not sufficient to cause drift.**

The distinguishing property is the MECHANISM, not the record. A dropped negative is a single
checkable event — the passage carries an explicit negative and the option states the affirmative.
There is no adjacent error it can quietly absorb, so it stayed a real single thing without an entry
holding it. "True inside the window and answering a different question" has loose edges: attribute
transfer, agent reversal and wrong-scope retrieval all sit near it, and with no description to refuse
a use it took them.

**Diagnostic, for the next gap: an undescribed tag is dangerous in proportion to how much
neighbouring territory its mechanism touches. A tightly-bounded mechanism survives the absence of an
entry; a broad one becomes the sink for whatever needs a name. Prioritise describing the loose
ones.**

This refines R62's placeholder rule rather than contradicting it. R62 refuses an undescribed tag at
CREATION regardless of mechanism, because you cannot know in advance which side of this line a new
tag falls on. R67 says where to spend effort on the ones already shipped.

## R68 — The register's completeness depends on a human relay, which is R64 one level up
*David, 2026-08-12.*

R66 and R67 record rulings made in a conversation this repo cannot see. They reached the register
because someone relayed them verbatim. **Nothing would have surfaced their absence** — the register
has no way to know a ruling was made, so an unrelayed ruling is indistinguishable from no ruling.

That is the R64 shape one level up. R64 closed drift between two files this repo holds and can
compare. This is drift between the repo and a conversation outside it, where the comparison is not
available to either side: `check:register` verifies that a rule CITED here is RECORDED here, and
cannot know about a rule that was never cited because it never arrived.

**It will recur unless rulings route through Code by default rather than by memory.** The failure is
silent and the cost compounds — R66 alone carries five approvals, two commissions and three retags,
and a reviewer who believes a ruling is on record will not repeat it.

No mechanism proposed here. The fix is a process change about where rulings are made, not something
this repo can enforce on itself, and inventing a check that cannot see the input would be the blind
gate R61 describes.

## R69 — A ruling can be "entered" in one library and absent from the other
*David, 2026-08-12. Found while registering R66; reported, not fixed.*

R66 records five library entries as **APPROVED AND ENTERED**. Measured against this database, all
five are **ABSENT**:

| id | in DB | ruling says |
|---|---|---|
| `en-within-span-wrong-element` | absent | approved and entered, 36 distractors |
| `en-negation-dropped` | absent | approved and entered, 19 distractors |
| `en-vocab-dominant-sense-imported` | absent | approved and entered, 19 census rows |
| `en-vocab-neighbouring-sense` | absent | approved and entered, 12 |
| `en-vocab-form-lookalike` | absent | approved and entered, 4 |
| `en-coordination-wrong-conjunct` | absent | commissioned, not yet drafted — correctly absent |

Every tag the ruling cites as ALREADY EXISTING is present and ACTIVE here — `en-attribute-transfer`,
`en-cause-agent-swap`, `en-wrong-scope-retrieval`, `en-relation-word-flipped`,
`en-inference-literal-lookalike`, `vr02-surface-link`. So the database is not stale in general; it
is missing exactly the five the ruling created.

**"Entered" was true of Cowork's library and false here.** That is a delivery gap between a ruling
and the content it governs, and its cost is specific: **a reviewer can believe a decision is live
when it is not.** Annie ruled on 36 + 19 distractors' worth of tagging; none of it can be applied
in this repo until the entries exist, and the two confirmed retags (ENG-008-RC-05, ENG-006-TM-02)
are blocked behind them.

This is R68's shape with the direction reversed. R68 is a ruling that never arrives; this is a
ruling that arrives as a RECORD while the content it authorises does not. Both are silent, and both
leave the reviewer believing the work is done.

**Not fixed here, deliberately.** Creating the five is a content write against a ruling, and three
of the five (`en-vocab-dominant-sense-imported`, `en-vocab-neighbouring-sense`,
`en-coordination-wrong-conjunct`) have no `childHint` in the ruling at all — R66 supplies hint text
only for `en-within-span-wrong-element` and, in passing, `en-vocab-form-lookalike`. Drafting the
missing three would be authoring, not transcription.

**The R62 interaction is the guard working.** The database CHECK constraint
`misconception_needs_description_and_hint` will REFUSE three of the five for want of a hint. That is
correct and should not be relaxed to land them: an entry with no hint is the placeholder R62 exists
to keep out, and "Annie approved the tag" is not the same as "Annie wrote the hint".

**Open question for the reviewer, not answered here:** whether the five should be created as
PROPOSED with the two known hints and three awaiting text, or held entire until all five have hints.
The first makes the approval visible and the gap explicit; the second keeps the library uniformly
complete. Either is defensible and it is her call, not a script's.

## R70 — The coaching test moves to the second read as Q7, and the validator refuses to claim it
*Ratified by Annie, 2026-08-12. Recorded before the test is built, so it cannot be built into the
wrong place.*

The coaching test comes OFF the validator entirely and onto the SECOND READ as **Q7**. The
validator's part is the opposite of running it: **it refuses any entry that claims the test was
automated.**

**Annie's reasoning, which is the stronger half of the pair: a human test carrying a machine's
signature is worse than no test, because it LOOKS DISCHARGED.** No test at all leaves a visible
gap that someone eventually fills. A test recorded as automated closes the gap in the record while
leaving it open in fact, and nothing downstream has any reason to look again.

That is the same shape as a green tick standing for more than it covers (R60), and as the register's
"0 MATHS items checked" reading as a pass. The failure is never the missing check; it is the
CLAIM about the missing check, which is what stops anyone from noticing.

**Status: not built.** Nothing in this repo runs a coaching test today, which is why this is
recorded now — the natural place to put a new check is the validator, and that is exactly where it
must not go. When Q7 is built, the validator gains a REFUSAL, not a rule.

## R71 — A convincing near-hit is worse than an empty result
*Ratified by Annie, 2026-08-12. General principle with the specific instance attached, because a
general caution would not have saved anyone.*

**A sound search returning a convincing near-hit is worse than one returning nothing.** An empty
result prompts a second look. A result SHAPED LIKE THE ANSWER ends the enquiry, and everything
downstream inherits a premise nobody tested.

### The specific version, which is the part that has teeth

The five values were sought as `category`. **They exist nowhere as `category`.** What the search
found instead was `content/review-returns/r1-stem-audit-2026-08-02.json`, which carries a
PAPER-SECTION taxonomy under `role` — a different field, answering a different question — and it
shares two of the five values.

Verified independently while recording this. The `role` field carries exactly three values:

| value | n |
|---|---|
| `comprehension` | 44 |
| `error-spot` | 18 |
| `cloze` | 16 |

Two of those (`comprehension`, `error-spot`) also appear as real `category` values on English
misconceptions, which is precisely what makes the near-hit convincing: the overlap is genuine, the
field is not.

**Why a general caution would not have helped.** "Check your source" is advice nobody acts on when
the result already looks right. What breaks the chain is the SPECIFIC pairing — this taxonomy, that
field, those two shared values — because the next person searching for a category vocabulary will
land on the same file and needs to recognise it by name rather than by suspicion.

### The connection to R60 question 3

R60 asks of any check: *is it reading the artefact, or a copy of it?* This is that question one
level earlier, applied to a SEARCH rather than a check — is it reading the field, or a field that
looks like it? A near-hit under a different key is a copy of the answer, and it fails the same way:
convincingly, and with nothing downstream aware that a premise went untested.

## R72 — "Unresolvable by design" is a gate concept the schema does not share
*David, 2026-08-13. Found by a write, which is the problem.*

A declared absence at the gate is a BROKEN REFERENCE at the database, and nothing said so until a
write discovered it.

`en-vocab-dominant-sense` is held out by ruling (R66): the tag is right, the hint is unverified, and
the entry enters only when its hint can be read from a stored field. Four gates were taught to
treat that absence as a decision rather than a fault — `HELD_OUT` in the resolver, read by
`verify_clusters` and `verify_enumeration`, reported every run with its ground.

`ItemOption.misconceptionId` is a **foreign key**. Ten cluster distractors carry that tag, and the
database cannot store any of them:

```
code: P2003 | meta: {"constraint":"ItemOption_misconceptionId_fkey"}
```

**The gates model a held-out entry as an absence with a reason. The schema models it as a
reference to nothing.** Both are correct about their own artefact, and neither knew about the
other — so a batch that passed all four gates failed on its first write.

**The cost was a half-applied import.** The first attempt looped item by item with no pre-flight:
one item written, then the violation, and a batch neither in nor out. Rewritten to CLASSIFY BEFORE
WRITING and to write in ONE transaction — the `reviewed-guard` pattern, which existed and which I
had not applied to my own import.

**The ruling on the ten** (David, 2026-08-13): HOLD THEM WHOLE, do not null the tag. The diagnosis
is what Annie ruled on; nulling would make ten correctly-tagged items look untagged, and the
difference between "no diagnosis" and "diagnosis awaiting a transcription check" is the entire
content of the ruling. A split cluster is acceptable — these are DRAFT items awaiting review, not
serving content, and the ten are identifiable by tag, so nothing is lost by waiting.

**What the gates should do about it.** A gate that declares an id held out knows something the
schema will refuse. It should SAY SO — name the items that cannot be written and why — rather than
leaving a write to discover it. Any future held-out entry hits this identically, and the second
time it happens it will not be new information.

**A measurement worth keeping.** 96 drafted, 81 writable, 5 gate-held, 10 tag-held, and the two
held classes were fully DISJOINT — the expectation had been 86 writable, assuming the five gate
hits sat inside the ten. They did not. Two independent hold reasons do not overlap just because
both are small; count them, do not subtract them from each other.

## R73 — Two stores can hold identical text and disagree about what the item IS
*David, 2026-08-13. Found by accident, which is the whole finding.*

A hash comparison over stems and options is not a comparison of items. `segmentsInOptions` is the
case that proved it: on 18 ENG-003 error-spot items the stem ends "…choose N." and the sentence
lives in the options. A renderer that does not read the flag lays those four options out as
independent choices, and **the child reads a different question**. The stem text is byte-identical
across both stores throughout. Every hash matches. Nothing would have reported it.

It was found by asking an unrelated question about stem form. That is not a mechanism.

**The ruling.** `segmentsInOptions` goes into the manifest schema and is BACKFILLED on the 18
error-spot rows — scoped by MECHANIC, never an id list. And Cowork is asked what OTHER declarative
fields exist, because a field found by accident implies a class found by nothing.

**The class turned out to be 39.** Cowork scanned 26 files over 354 items and hand-classified 70
field paths: 39 DECLARATIVE, 22 PROVENANCE, 9 CONTENT. All 39 are carried in `cowork-manifest-v1`
(David: versioning the manifest later costs more than carrying fields now). 18 are carried by this
store, 20 are DROPPED, 1 is MODELLED — and 10 of the dropped are weighted CRITICAL, including all
seven `preReview.*` on 78 items, which is a stored REVIEW OUTCOME and therefore the platform's own
provenance claim.

**THREE ABSENCE STATES, AND THEY ARE A PROPERTY OF THE DIFF.** DROPPED (the other store has it,
this one lost it), MODELLED (held here in a different shape), EMPTY (neither holds it). An emitter
reading one store can only ever say "absent here" — it cannot distinguish DROPPED from EMPTY, and
an emitter that guessed would manufacture a state it cannot observe. So the emitter records
PRESENCE and LOCATION; the comparison assigns the state. *(David's original instruction was for the
emitter to classify; he withdrew it on this reasoning — "your redesign is right and my instruction
was wrong".)*

**MODELLED IS DECLARED, NEVER INFERRED, AND THE NEAR MISS IS WHY.** A field misfiled DROPPED puts
phantom work on the list; misfiled MODELLED it HIDES A REAL LOSS, and that direction is worse.
`preReviewVerdict` EXISTS as a column — **on `Word`**, meaning the authoring pass's verdict on a
vocabulary card. A grep for the name would have filed `preReview.verdict` as MODELLED and hidden a
real loss on 78 items. It is DROPPED. Each MODELLED entry now names the column or table that
carries the fact and how that was established, by reading the enclosing model.

That is the **third name collision across two models this month**: `atLines`/`lineRefs`,
`stem.testedTokens`/`testedTokens`, and now `preReviewVerdict`. A matching name is not evidence.

**LOCATION IS PART OF THE RECORD.** `lineRefs` sits at item level on Cowork and nested in the stem
here. A presence-only boolean reports that as agreement. The manifest records WHERE each field was
found, which is what makes the queued migration measurable rather than assumed — and it caught two
faults in its own first runs: a generic probe that searched the stem as a fallback COLLAPSED
`testedTokens[]` into `stem.testedTokens[]`, reporting the ruled winner as present while it held
nothing; and a collapse check added afterwards immediately caught `difficultyTier` and
`questionTypeId` both emitting the literal label `'Item column'` — one fact reported as two.

## R74 — An allowlist that drops what it cannot name is R57 in a new coat
*David, 2026-08-13. The fifth recurrence.*

R57 ruled that an import door VALIDATES a stem and never FILTERS one, after an allowlist silently
destroyed a declared field four times. The cluster importer then did it a fifth time, and I wrote
it: an interface of six fields, five of them written. Ten item-level keys went in one side of the
door and came out of neither — `lineRefs`, `orderAnchor`, `passageRef`, `tierRationale`,
`sourcedFrom`, `mechanismLedger`, `misconceptions`, `notes`, `draftingOrder`, `authoredBy` — plus
two more on the options. **All 86 items it landed were missing all three of the fields the manifest
later ruled must be carried.** Nothing reported it; the import printed a clean summary.

**THE FIX IS A REFUSAL, NOT A LONGER LIST.** A longer list is the same mechanism with a later
failure date. `packages/core/src/english/cowork-item-keys.ts` names every key at all four levels
with a DISPOSITION — MAPPED, CARRIED (stating where it actually lands), or NOT_CARRIED (with a
required reason). **A key the registry does not name STOPS THE RUN**, before anything else is read.
It does not skip the item, which is the behaviour that lost the fields. A field Cowork adds next
month must stop the pipeline rather than vanish from it.

In `packages/core` because two doors that enumerate separately WILL drift — R42's finding, which
recurred in R55 where the CMS door passed a stem through while the script door stripped it.

**ITS FIRST REAL RUN REFUSED NOTHING, AND THEREFORE PROVED NOTHING** (R60 question 2). The eight
cluster files carry no unregistered key. Eight tests are the canary, one per level, on synthetic
objects — fault injection goes on a scratch row, never a reviewed one.

**NOT_CARRIED IS A DECISION WITH A REASON, NOT A SHRUG.** Four keys are recognised, deliberately
not stored, and UNRULED — they print on every run so they stay a live question instead of decaying
into "the importer has always done that": `item.tierRationale`, `item.sourcedFrom`,
`item.mechanismLedger` (per-mechanism evidence on 60 items) and `options[].misconceptionExecution`
(282 options). `options[].senseTarget` is deliberately absent from the registry altogether: it is
one of the 39, weighted CRITICAL, and no column holds it, so a batch carrying it REFUSES until that
is ruled. That is the mechanism working, not a bug to route around.

**A GUESS THAT HAPPENS TO BE RIGHT IS STILL A GUESS.** The importer wrote the literal
`'ai-draft:cowork-okafor-v1'` into `authoredBy`, a provenance column, ignoring the field in the
source. It matched on all 96. It now reads the field.

## R75 — Two things are both called review, and only one of them is a person
*David, 2026-08-16.*

Cowork stores a `preReview` on 78 items. Its verdict takes exactly two values: `PASS_TO_HUMAN`
(62) and `FIXED_THEN_PASS` (16). **Both terminate in "a human has not looked yet."** It is a
drafting agent's assessment of its own work — a READINESS claim from the opposite end of the
process from Annie's ratification, not a lesser sign-off, and it must never be readable as one.
Model the two as one thing and an agent's self-assessment looks like a reviewer's sign-off in the
store that ships. That is the worst failure available here.

**The ruling:** it crosses, as AUTHORING METADATA, structurally unreachable from the reviewer path.
`Item.authoringPreReview` — not `reviewedBy`, not `reviewRecordedBy`, nothing `recordSignature`
writes.

**Three things the reviewer path has that it does not**, none incidental. NO ACTOR: it names no
agent, no version, no instance, so the naming path has nothing to resolve. NO SEPARATION of whose
judgement from who recorded it — the working half of that design. NO SUBJECT: it asserts nothing
about what it assessed, so it survives any later edit, which is the exact failure `subjectHash` was
added to prevent on `AttributionEvent`. Carrying that across unfixed would import a known defect,
so this side computes one over the stem, the options in stored order with their key flags, and the
tier. `check:pre-review-subject` reports a superseded claim and REFUSES TO REPAIR IT — re-hashing
would make the claim true by moving its subject.

**CAREFUL NAMING IS NOT A CONTROL.** `check:review-queries` is, in the shape of
`check:signing-doors`: leg A, the column may be named only in a declared door, and a STALE door
refuses too, because an exemption nobody can see is a hole; leg B, no line may bind it to a
review-decision symbol, door or not. An empty screen refuses: if no file names the column, the
symbol was renamed and the gate watches a name that does not exist.

**Leg B was file-level first and cried wolf** — it flagged the schema for declaring both columns in
one model, flagged the gate for listing the symbols as data, and flagged the import door for
selecting `reviewedBy` to prove it had changed no review state. Three true statements, none of them
the fault; the same shape as the bare-literal version of `check:signing-doors`. Narrowed to
line-level, it then caught a real line in my own import door, which read the claim and the review
state in one select. Split into two queries: they are different facts from different sources, and
the code now expresses the separation instead of asserting it in a comment while doing the opposite.

**THE RE-DERIVABLE RUBRIC KEYS ARE MARKED, AND THE MARKING TRAVELS WITH THE VALUE.** `readingAge`,
`banList` and `keyVerified` are computed by gates this repo already runs, so `describePreReview`
names the gate beside each one. Stored on nobody's authority is fine; mistaken later for findings is
not — a bare `readingAge: 7.6` reads exactly like a measurement.

**Said plainly, because it was better than assumed:** the naming path is in good shape. Two
reviewers with evidence, `heldFrom`/`heldUntil` bounding the window, 46 signatures all carrying a
`reviewerId`, one door with a gate on it. And: 164 English items, all DRAFT, `reviewedBy` on 0, not
one SIGNED event. That is correct, and it is also the whole remaining distance.

## R76 — A boundary that only catches writes made through the boundary
*David, 2026-08-16, from a fault found by a refusal rather than by reading.*

Two of 715 stored options carried NO label. The letter is derived at render time from position, so
both items read perfectly, no gate had anything to object to, and both survived every check in the
repo. Neither carried an attribution event. No script in this repo writes a single option's content
except the normalisation pass, which always writes a label. No commit references either id.

**The write was not suspicious. It was UNACCOUNTABLE**, which is worse: nothing could say what did
it, or when, or whether anything else went with it.

**So the boundary is a database TRIGGER, not a wrapper.** `ContentWriteLog` records every INSERT,
UPDATE and DELETE on `Item`, `ItemOption`, `Misconception` and `Word`, with the columns that
actually changed, the database user, the client's `application_name` and the transaction id.
Application code cannot opt out of a trigger, which is the whole point — a write from a script,
from Prisma Studio, from psql or from another agent entirely lands identically. An UPDATE that
changes nothing is still recorded, with an empty column list: "something wrote here and changed
nothing" is a different fact from "nothing wrote here".

`check:outside-writes` compares that record against `AttributionEvent` and names any write with no
ruling behind it. It fails on reviewed content and reports on DRAFT.

**THE DENOMINATOR IS THE BOUNDARY'S AGE, AND IT PRINTS ON EVERY RUN.** Every write before
2026-08-16 is invisible to it and always will be — including the two unlabelled options that
prompted it. "0 unattributed writes" without that sentence would be the most misleading true
statement available.

**A third class, and it is permanent.** A write to an option that has since been deleted cannot be
resolved to an item, because the log names the option and there is nothing left to look it up
against. Reported as UNRESOLVABLE rather than counted either way — and the pass line then says
"every RESOLVABLE write", never the bare version. Two writes I could not screen and a clean-sounding
headline is precisely R60.

**Recorded because it happened:** the canary that proved the trigger works then deleted its own four
log rows, before append-only was settled. Two rows it could not match by id survive and show as
unresolvable. A boundary whose first act was an undeclared prune of itself belongs in writing rather
than tidied away.

## R77 — The three citation migrations, and the check that had never run on any of it
*David, 2026-08-16.*

Three rulings applied together, because they touch the same rows and a half-migrated store is worse
than either state: `explanation.quotes[].atLines` → `lineRefs` (7, a NAME collision), `stem
.testedTokens` → `Item.testedTokens` (9, a LEVEL collision with the item-level field of the same
name), `stem.lineRefs` → `Item.lineRefs` (129, a LEVEL difference against Cowork). 131 items
touched, verified by re-reading all 131: the destination holds the value AND the source is gone,
because either alone leaves the duplication the migration exists to end.

The destinations are `Json?`, not `Int[]`/`String[]`. A Prisma scalar list CANNOT BE NULL — it
defaults to `[]`, which would collapse "this item declares no lines" into "this item cites
nothing". Same rule as `?? ''`; the type system offered the coercion and it had to be declined.

**The manifest guard caught all three as regressions, which is correct.** Two source-side losses and
a carrier move are exactly what it watches for. The workflow is `--accept` a new baseline, not a
softer guard.

**ROOT SCRIPTS WERE NEVER TYPECHECKED.** `pnpm typecheck` runs `pnpm -r`, which visits workspace
PACKAGES; `scripts/` is in none of them. About 90 files that write to the database sat outside every
type check in the repo. Three calls to `requirePopulation` passed three arguments to a two-argument
function and shipped clean — **one of them inside `check:outside-writes`, an instrument built to
catch exactly this class of silent wrongness.** It also caught a real defect in the cluster importer
that had not yet run: JS `null` written to a nullable Json column, which is the JSON VALUE null
rather than no value at all.

Closed as a RATCHET, not a clean sweep: 24 pre-existing files carry 66 errors and are on a declared
list; everything else, and everything new, is checked. **A file that starts typechecking must come
OFF the list or the run fails** — otherwise the list grows into an exemption nobody revisits, which
is the stale-door fault from R75. `tsconfig exclude` cannot do this (tsc still checks an excluded
file when an included one imports it), so the errors are filtered by file after the fact, which also
prints the size of the backlog on every run instead of hiding it in a config.

**A GATE THAT NAMES ONE OF TWO LIVE FIELD NAMES SCREENS THE HALF IT HAPPENS TO KNOW.**
`check:line-refs` read `stem.prompt`. 96 of 164 ENG items carry `stem.text` — the cluster door's
name — so it could not check a single one of them. It said so loudly rather than passing them,
which is the R60 fix from earlier working as intended. Reading both names took it from 96 unscreened
to 10, and from 27 explanation citations checked to 92. The same collision class as
`atLines`/`lineRefs`, one layer down: not two stores disagreeing, but one store holding both names
and one gate knowing one of them.

**What the newly-reachable items then revealed:** 10 declared quotes are stored as BARE STRINGS
rather than `{text, …}` — the identical fault as the 340 bare-string options, in a different field,
from the same importer passing Cowork's shape straight through. Invisible until the gate could reach
those items at all. Reported, not normalised: Cowork owns the quote envelope.

## R78 — A reader scoped to one store reports the other store's convention as a defect
*Cowork, ratified by David, 2026-08-16. The near miss is the entry.*

10 quotes in this store are stored as BARE STRINGS rather than `{text, …}`. `check:line-refs`
reported all 10 as "declared quote(s) carry no text", and I proposed normalising them — the same
repair that was correct for the 340 bare-string options.

**It would have been wrong.** Cowork's CHECK 8 documents a bare string in a quotes array as a
DECLARED CONVENTION: it declares A TEXT AND NOT A PLACE, and is checked for PRESENCE ONLY, because
no citation was claimed. 63 exist across the district. Normalising would have destroyed the
distinction between "quotes this text at these lines" and "quotes this text, claiming no place" —
inventing a claim its author did not make.

**What settles convention against leak, when you can only see one store:** across every source file
and every stored row, each quotes array is UNIFORMLY one shape or the other. **Zero arrays mix.** An
accidental shape leak is arbitrary; a form is consistent at the boundary that carries meaning. That
test is available without asking, and I did not apply it before proposing the repair.

Delivery 51's lesson, restated: **a reader scoped to one cluster reports the convention as a
defect.** Scoped to one STORE it does the same thing. The gate now counts placeless quotes and
reports them as present-only; a malformed OBJECT with no usable `text` is still a fault.

## R79 — Whatever Cowork authors is the name
*David, 2026-08-16, on the fourth two-name collision.*

`stem.prompt` against `stem.text`. Cowork holds `text` on 354 of 354. Ruled: TEXT WINS, migrate the
78 prompt-named rows, and the gate reads one name. That is four collisions — `atLines`/`lineRefs`,
`stem.testedTokens`/`testedTokens`, `passageId`/`passageRef`, `prompt`/`text` — and the pattern is
now a rule rather than four separate rulings.

**RENAMES, because a name can assert a state its writer could not confer.** `preReview` →
`draftSelfAssessment`; `verdict` → `handoffState`. "preReview" places the claim on the review
timeline and "verdict" is what a reviewer returns — both restate, as identifiers, the exact
conflation the column exists to prevent. **My own `authoringPreReview` still said preReview**: the
prefix named the class and left the confusion intact underneath it. The vintage names are still
READ, because every file delivered before the rename says `verdict` and a reader that knew only the
new name would report 78 readable claims as unreadable — R57's shape in vocabulary.

**`draftingOrder` → `draftingMethod` was a rename AND a correction of my reading.** I had proposed
dropping the field as "the order the drafting pass wrote items in". Every value is the string
`"mechanism-first (Addendum 20)"`, and it equals `orderAnchor` on 0 of 60 here and 0 of 251 across
the district. A column built to the old name would have rejected or corrupted all 251. **I proposed
an exception from the field's NAME without reading its VALUES.**

**THE `before` DISPUTE, SETTLED BY SEARCHING.** Cowork ruled `stemRedraft.why` crosses and `before`
does not, being recoverable from the 2026-08-02 snapshots. Searching every file on disk for each of
the five `before` texts: WIW-18 is in the Aug-2 batch file; pp-19 is in the Aug-2 review pack and
walk-script export; pp-08 is in a calibration-log section and an authoring skill doc. **pp-11 and
pp-16 appear in no artefact that is not itself a copy of `stemRedraft`.** Cowork's premise holds for
two of five and mine held for two of five — **each side was right about a different subset, and
both would have been acting on a general belief.** Promotion to ARCHIVE cannot save pp-11 and pp-16
because no snapshot holds them, so David's disjunction resolves one way: `before` crosses. Stored as
`beforePreservedPendingRuling`, so the carriage stays visibly provisional rather than being quietly
reclassified as content.

## R80 — A CORRECT INSTRUMENT READING A WRONG CLOCK
*2026-08-16. The write boundary's first real run. David: "the finding of the week."*

**THE GENERALISATION, which is the reason this entry sits where it does: a correct instrument
reading a wrong clock is INDISTINGUISHABLE from a correct instrument reading a true fault, and
NOTHING INSIDE THE INSTRUMENT CAN TELL THEM APART.** Every honesty mechanism in this repo was
working, and the number was still wrong.

`check:outside-writes` reported **345 UNATTRIBUTED WRITES**. Every one was false.

`ContentWriteLog.at` defaulted to `CURRENT_TIMESTAMP` — a `timestamptz` — stored into a naive
`TIMESTAMP(3)`. The session runs BST, so every logged write landed **exactly one hour ahead** of the
`AttributionEvent` recording the same act, and the fifteen-minute match window caught none of them.

**The failure mode is the entry.** An instrument with a skewed clock does not report "unknown", or
"cannot tell", or "out of range". It reports, in its own words, **"a change nobody decided"** — 345
times, about work that was fully attributed, *in the same run where it correctly printed its own
denominator, correctly declared the boundary's install date as a permanent bound, and correctly
separated out its unresolvable class*. Every discipline this repo has built was operating, and each
one made the wrong number more credible rather than less.

So the R60 questions do not reach this. A check can state its population, know what it must find,
and read the artefact rather than a copy, and still be wrong about every row — because all three
questions are about the instrument, and this is about what the instrument is measured AGAINST. The
fourth question: **is the thing I am comparing to keeping the same clock, the same units and the
same convention as the thing I am measuring?**

**THE CORRECTION, recorded rather than adjusted silently.** Migration
`20260816125500_write_log_utc`, applied 2026-08-16:
  · the trigger now writes `now() AT TIME ZONE 'UTC'`, set EXPLICITLY in the insert rather than left
    to the column default — the default was what was wrong, and a trigger relying on it inherits
    whatever the next migration does to it;
  · every row written before that migration was corrected by a **uniform offset of −1 hour**
    (`now() - (now() AT TIME ZONE 'UTC')`, which was BST at the time of application), total across
    the table because every row predated the fix.

**This is the one and only mutation of an append-only table.** It is a CLOCK CORRECTION, not a
prune: no row added, no row removed, and no row changed in WHAT it says happened — only in the
convention it says it in. After the fix: 342 attributed, 3 unattributed, and the 3 are the canary
scratch row that is unattributed by design.

**THE SAME SHAPE HAPPENED TWICE IN ONE TURN, and the second one is the cheaper lesson.**
`check:line-refs` read `stem.lineRefs` for an hour after R77's migration moved that field to
`Item.lineRefs`. It found an empty array on every row, checked **no citations at all**, and went on
printing "146 items citing a passage" — a true count of items it was not checking. Same structure:
the instrument was correct, its reference had moved underneath it, and its output stayed confident
and specific. **A MIGRATION AND ITS CONSUMERS ARE ONE CHANGE.** A field that moves is not migrated
until every reader of it has moved; the field being empty is not an error state anything reports,
because an empty list is a legitimate value.


## R81 — Retiring the loose copies, and what refused to go
*David, 2026-08-16. "The loose files can go. Explicit path, verified per file, hashes recorded."*

`~/Downloads/11+` is a TRANSFER AREA holding no source of truth, and it had accumulated multiple
copies of the same deliveries at different hashes — three of ENG-001 disagreeing on 22 of 22 items,
two vintages each of `eng005` and `eng007` declaring quotes on DIFFERENT items.

**Nothing was deleted that was not demonstrably held.** Per file, before any removal: every
`itemId` present in the database; every key the registry knows either CARRIED, declared VINTAGE, or
a declared exception; and any key the registry does not name AT ALL blocks the file, because nobody
has decided about it. **The check runs against the DATABASE, not the manifest** — this is the last
moment the content exists in two places, and comparing a copy against a derivative of itself proves
nothing (R57's finding in disposal clothing).

**6 of 20 retired. 14 refused, and the refusals are the useful half:**
  · nine files hold the **10 tag-held items** (`en-vocab-dominant-sense`) that R72 held whole and
    never imported. Those items exist ONLY in those files. The hold is still standing, so the files
    stand with it — a deletion policy that ignored an existing hold would have quietly executed it.
  · `ENG-004-anne-green-gables.json` — 12 pilot items, plus an undecided `options[].tagStatus`.
  · `enumeration-reopened.json` and `walk-scripts-english-2026-08-02.json` — 8 and 10 undecided keys
    each, including `currentWalkScript` and `rewrittenWalkScript`, which are content nobody has
    ruled on.

**THE LEDGER IS WRITTEN BEFORE THE DELETION, not after.** `content/exports/RETIRED-LOOSE-COPIES
.json` records each file's path, sha256, byte size, item ids and verdict — and the kept files with
their blockers. If the removal were interrupted, the record still says what was there; the reverse
order leaves a gap nobody can reconstruct.

Verified by RE-READING each path acted on, never by counting survivors: 6 of 6 confirmed gone, 14 of
14 confirmed present, 164 ENG items in the database after. Before the deletion, the five
`stemRedraft.before` texts were read back from the database individually — pp-11 and pp-16 among
them, the two that exist in no snapshot (R79).

## R82 — CHECK 11 is containment, not equality
*David, 2026-08-16. Cowork predicted it and built the check to fail rather than let a subset settle it.*

Quote-level `lineRefs` names WHERE THE QUOTATION SITS. Item-level `lineRefs` is the item's WINDOW —
the span the disposals live in. **Two different facts that agreed on six items by coincidence.**

The two held fields settled it. This store held `[56,57]` against a window of `[56..62]`, and
`[57,58]` against `[57,58,59]`; Cowork's copies repeated the window onto the quote. **An equality
check passes the second and fails the first** — it would have called the narrower, truer value the
defect, and the first subset case would have established the rule silently for everything after.

The rule is CONTAINMENT: the quote span must sit inside the item window, never equal it.
`quoteLinesOutsideWindow` in `packages/core/src/line-refs.ts`, run inside the line-reference gate,
which reports how many spans it screened so a zero cannot read as a pass. 8 screened, 0 outside.
The two held fields are RELEASED with the stored values.

**A CONSEQUENCE OF ORDERING, recorded because it is a cost.** The loose copies were retired before
this release, so `carry:quotes` can no longer recompute that disagreement — the source side is gone.
The hashes are in `RETIRED-LOOSE-COPIES.json` and the values are in this entry, but the comparison
itself is no longer re-runnable. Retire a copy and you retire the ability to re-derive every
comparison that used it.

## R83 — Prisma reverted the clock fix forty minutes after R80 was written
*2026-08-16, on the very next `migrate dev`.*

R80 fixed `ContentWriteLog.at` to store UTC and corrected the rows. The next routine `prisma migrate
dev` — run to add unrelated columns — emitted `ALTER COLUMN "at" SET DEFAULT CURRENT_TIMESTAMP` and
**put the local-time default straight back**.

Nothing in the schema was wrong. Prisma cannot express `now() AT TIME ZONE 'UTC'`, so it read its
own `@default(now())` as the truth, saw the database disagreeing, and corrected the database. **A
hand-written migration is not durable against a generator that believes it owns the column.**

**NOTHING BROKE, AND ONLY FOR ONE REASON:** the trigger sets `at` explicitly rather than relying on
the default. That explicitness was a note in R80 — "set explicitly in the trigger body rather than
left to the column default, because the default was what was wrong, and a trigger relying on it
inherits whatever the next migration does to it." The next migration is exactly what happened.

**The fix is REMOVAL, not restoration.** Setting the default back to UTC drifts again on the next
`migrate dev`. The default is dropped entirely and `@default(now())` removed from the model, so
there is no local-time fallback left for anyone to restore: the trigger supplies the value, and an
insert that does not is an error rather than a silently-local row.

**The general form:** when a hand-written migration and a generator disagree about a column, the
generator wins on a schedule nobody is watching. Either express it in the generator's language, or
remove the thing it thinks it owns.

## R84 — A live library entry whose text the authoring side has never seen
*David's question, 2026-08-16. Answered by dumping the row.*

`en-comparison-vehicle-misread` is ACTIVE here and Cowork holds only a bare string in a header. The
row says where it came from:

```
proposedBy       current-reviewer        approvedBy   current-reviewer
recordedBy       human:david@cluecrew.test
approvalMethod   written review — ENG-004 comprehension pilot, annie 2026-08-08
childHint        "Find what is being compared to what. The meaning belongs to the first thing."
approvalNote     BOUNDARY vs en-attribute-transfer: both put a quality on the wrong holder.
                 Attribute-transfer moves it BETWEEN CHARACTERS; this moves it from a comparison's
                 VEHICLE to its SUBJECT. Different remedies, different hints.
```

One AUTHORED attribution event, `reviewerId` rev-0001. So it was **written platform-side from
Annie's written review**, which is correct and is exactly what CLAUDE.md requires — *the DB authors
library text, Cowork proposes transforms*. **The fault is not authorship, it is DELIVERY.** Cowork's
drafters have been tagging items against an entry whose description, hint and boundary note they
have never received, and the boundary note is precisely what a drafter needs in order to tag
`en-attribute-transfer` correctly instead.

Note the number that makes this concrete: **0 options in this store carry the tag.** Every use of it
is on the authoring side, working from a name alone.

The read path already existed and had not been run since the entry was written:
`scripts/export-misconception-library.ts`. Run, delivered, stale copy pruned — 274 entries,
sha `6d3c109008854e71`. A one-direction rule needs the direction to actually be travelled.

> **⚠ THIS HASH IS AMBIGUOUS AND IS LEFT AS WRITTEN.** `6d3c109008854e71` names TWO materially
> different files: the six-field projection delivered when this entry was written, and the
> seventeen-field one delivered an hour later after `approvalNote` was added. The stamp was computed
> over a projection rather than over the payload, so it did not move (R88). **The entry is marked,
> not repointed** — silently rewriting it to `af7d1a75ad843996` would make a record of what was
> verified into a record of what was verified later, which is the failure the marking exists to
> prevent. What this entry actually verified was the SIX-FIELD delivery, which did not carry the
> reviewer's words. Commit `441d84d` cites the same hash with the same ambiguity and cannot be
> edited; this note is its correction too.

## R85 — A platform constraint and a reviewer ruling independently producing the same refusal
*2026-08-16. The first time this has happened, and it is worth naming.*

`en-vocab-dominant-sense` cannot cross, for two reasons arrived at separately:

  · **Anne's protocol** (R25, at the one entry whose failure mode is her name on words she did not
    write): the hint enters by being READ FROM A STORED FIELD, never retyped from a message. A
    confirmation obtained from a transcription tests nothing — if the typing is faithful she learns
    nothing, and if it is unfaithful she confirms the error.
  · **The schema**: `childHint` is `NOT NULL` with `CHECK (length(btrim(childHint)) >= 12)`. An
    entry with no hint is not storable.

Neither knows about the other. One is a judgement about how a reviewer's words may be obtained; the
other is a column definition. **They refuse the same import for different reasons and arrive at the
same place.**

This is the exact inverse of R72, where the gates modelled a held-out entry as a reasoned absence
and the schema modelled it as a broken foreign key — two systems disagreeing, discovered by a write.
Here they agree, and the agreement is evidence the rule is real rather than an artefact of one
mechanism. **Where a constraint and a ruling converge without coordination, trust the refusal.**

CHECK 10 being green at 28 of 28 closes the REASON for the hold; it does not supply the hint text.
The entry stays out until the hint exists as a stored value.

## R86 — A file is not its content; it is every check that reads it
*David, 2026-08-16, generalising a cost I recorded.*

Retiring the ENG-001/002 copies removed the ability to RECOMPUTE the WIW-18/pp-19 quote-lineRefs
disagreement. `carry:quotes` can no longer see the other side. The hashes are in the ledger and the
values are in R82 — **but a record is not a recomputation**, and nothing announced that the
comparison was about to become unrunnable. The verification asked only "is this content held
elsewhere", which it was.

So `retire:loose` now states, for EVERY file and not only the ones about to go, which scripts read
it and which of those it is the SOLE INPUT to. The reader map is derived by SCANNING `scripts/` for
the source roots each one names, never from a hand-kept list — a hand-kept list of readers is the
allowlist that fails open, one level up (R57). Sole-input status is printed and recorded in the
ledger. It does not block: the content is verified held, and the COMPARISON is what is being given
up, deliberately rather than accidentally.

**The moment to know what a file is the last input to is BEFORE it becomes a candidate**, which is
why kept files carry the statement too.

## R87 — The third mechanism this month that reports success on doing nothing
*David, 2026-08-16.*

`str.replace` returns the string unchanged when the anchor does not match. It does not raise, does
not warn, and the script exits 0. **Twice in one turn** an edit silently no-opped and every
downstream check stayed green — because a check cannot see an edit that was never made:

  · the Addendum 36 empty-population declaration was never inserted into `check-line-refs.ts`, while
    `typecheck:scripts` passed cleanly over the file it was supposed to be in;
  · the `attractorLine`/`defeaterLine` columns were never added to the schema, and the migration
    that should have carried them emitted an unrelated `ALTER` instead — **which is how Prisma's
    revert of the R80 clock fix came to be found at all: by accident, in an empty migration.**

Same family as `verify:solutions` printing "0 MATHS items checked" (R60) and a gate whose empty
population nobody declared (R61). The operation is CORRECT, the report is TRUE, and neither says
that nothing happened.

`tools/edit.py`: **asserting is the default and not-asserting needs a name.** `sub()` raises unless
the anchor matches exactly the expected number of times; a deliberate no-op must pass
`required=False`, a word someone types on purpose and a reviewer sees in the diff — the same shape
as `declareMayBeEmpty`. A non-unique anchor fails even with `required=False`, because an anchor that
is not unique edited something else as well. `edit_file` is all-or-nothing: a partially applied set
of edits is the half-applied import in a text editor.

## R88 — The return leg was never built, and one export claiming to carry the library dropped the reviewer's words
*David, 2026-08-16. "That is not a delivery lag. It is a whole direction of the pipeline that has never carried anything."*

Every ruling in this thread has been about Cowork's content reaching the database — the manifest,
the key registry, the field baseline, the write boundary. **Annie's rulings travel the other way.**
274 library entries crossed in one go on 2026-08-16, which means **every entry she has ever written
was in the same position as the one that exposed it.**

**AND RUNNING THE PATH WAS NOT ENOUGH.** The export delivered SIX of the twenty-two columns the row
holds — `id, district, status, description, childHint, gate` — and named none of the
reviewer-authored ones. R57 on the return leg, where nobody had been looking at all. So after the
first delivery, `approvalNote` still had not crossed.

The cost is specific and it was being paid in real time. `en-comparison-vehicle-misread` carries
Annie's discriminator: *attribute-transfer moves a quality BETWEEN CHARACTERS; this moves it from a
comparison's VEHICLE to its SUBJECT. Different remedies, different hints.* **Cowork spent a run
discovering by cold read that attribute-transfer was being used where it does not fit.** She wrote
the answer on 8 August. 0 options in this store carry the tag, so every use of it was on the
authoring side, working from a name alone.

**THE STAMP DID NOT MOVE WHEN THE PAYLOAD DID.** The artefact's identifying hash was computed from a
FIVE-field projection while the delivery carried seventeen, so adding the reviewer's words produced
a materially different file under an identical name — `6d3c109008854e71` twice. The name is what
every comparison in this repo cites; a name that does not move when the content moves is a
comparison reporting agreement between two different artefacts. Both now derive from one projection.
The gate VERDICT is excluded from the stamp deliberately, so the artefact's identity depends on the
content and not on the checker (R62, one level up).

**`pnpm check:return-leg` is the outbound guard's mirror.** Three states, and the middle one is
treated as seriously as the last, because AN UNTRAVELLED PATH AND AN ABSENT PATH ARE THE SAME
THING: CARRIED, STALE, NOT CARRIED. Whether an export carries a field is READ OUT OF ITS SOURCE,
never declared — a hand-kept list of what an export carries is the allowlist that fails open, and it
is precisely how this export came to claim it delivered the library while dropping her words.

**The first run: 1 CARRIED, 0 STALE, 5 NOT CARRIED.** And the one that is carried is the one fixed
that morning.

| class | rows | state |
|---|---|---|
| Misconception approvals — boundary notes, method, approver | 171 | CARRIED (as of today) |
| Item review notes — why an item was returned | 301 | NOT CARRIED |
| Attribution events — the reasoning behind every named ruling | 202 | NOT CARRIED |
| Word review notes — vocabulary card rulings | 14 | NOT CARRIED |
| Item answer flags — the gate says the child cannot answer it | 8 | NOT CARRIED |
| Reviewer identity — who holds the role, since when, on what evidence | 2 | NOT CARRIED |

The 202 attribution notes are the largest body of reviewer prose in the store and the record of WHY
each decision went the way it did. The 8 answer flags are UNCLEARABLE BY DESIGN — the child cannot
answer the item and only the author can fix it — and the author cannot see them. It reports rather
than blocks: these are unbuilt work, not a regression, and a gate red from its first run is muted
within a week.

## R89 — The proposal path exists and is already carrying traffic
*Answering David's question, 2026-08-16.*

A Cowork-authored entry does NOT have to arrive approved. `MisconceptionStatus.PROPOSED` exists, and
**19 entries sit in it right now — 8 of them proposed by `ai-draft:cowork-okafor-v1`**, with
`approvedBy` null on all 19. So the inbound half of the return leg's mirror is built and exercised;
this is the one direction that was not broken.

The only schema condition is the one from R85: `description` and `childHint` both NOT NULL and at
least 12 non-blank characters. A proposal needs a hedged hint, not no hint.

The reviewer-facing half exists too and follows R25 — `export-proposed-misconceptions.ts` sends
every entry's `description` and `childHint` VERBATIM FROM THE FIELD, because a ratification is made
against those strings and not against an account of them. Delivered: 19 entries,
`misconceptions-proposed-queue-cd38f828a7918d3e.json`.

So `en-gesture-function-misread` has a route: Cowork creates it PROPOSED with its hedged hint and
its one confirmed instance, the queue export carries it to Annie verbatim, and her ruling comes back
through the approval door that sets `approvedBy`, `approvalMethod` and `approvalNote`. **This side
builds nothing and rules nothing** — the entry needs Annie, and the platform's job is to carry it
without touching it.

## R90 — A broken instrument found a real regression by failing visibly, and that is luck
*2026-08-16. Recorded as luck so it is not mistaken for design.*

`str.replace` silently no-opped on a mismatched anchor and the `attractorLine`/`defeaterLine`
columns were never added to the schema. The migration run that should have carried them therefore
had nothing to carry — and came out holding an unrelated `ALTER COLUMN "at" SET DEFAULT
CURRENT_TIMESTAMP`. **That is how Prisma's revert of the R80 clock fix was discovered.**

Nothing detected it. No check watched for it. It surfaced because a DIFFERENT fault produced an
empty migration, and an empty migration is short enough to read. Had the schema edit applied
normally, the revert would have been one line inside a migration doing real work, and it would have
shipped unnoticed — reintroducing the local-time default that produced 345 false "a change nobody
decided" reports, forty minutes after the entry describing them was written.

**Two lessons, and the second is the one that generalises.** First: the silent no-op is still a
fault, and it is now closed (R87). Second: **a fault found by luck is an UNMONITORED failure mode,
not a solved one.** The question after any lucky catch is what would have caught it on purpose, and
the honest answer here is nothing — no check compares a hand-written migration's intent against what
the generator later does to the same column. That gap is open, and naming it is the point of this
entry.

## R91 — The eight answerability flags, and the four classes behind them
*David, 2026-08-16. "The eight answer flags go first. Not last on a list of six."*

Eight items in the bank that a child cannot answer, each carrying a recorded verdict saying so, and
the verdict had never reached anyone who could act on it. `answerFlaggedAt` is deliberately unlike
`similarityFlaggedAt`: THERE IS NO CLEARING FIELD. The flag goes when the item is fixed and the gate
stops setting it, and by no other route. So it is the one verdict in the store that only the AUTHOR
can discharge — and the author could not see it.

**One correction to my own report.** I described these as items Annie had marked. They are set by
`pnpm check:word-puzzles`, which executes the item's own rule and compares the result against its
key. A MACHINE verdict under David's 2026-08-02 ruling, not a reviewer's prose. Eight machine
findings travelling under a reviewer's authority would be R75's conflation in a new place, so the
export says which it is, in the artefact.

All eight are `gen-vr-*` word puzzles, all DRAFT: three where `CHAIR/MOP admits NO valid move`, two
where the key is `C` but the only valid move is `E`, two where the key is `S` but the only valid
move is `H`, and one where the key is `PEAR` but the only hidden word is `airs`. Delivered with the
note verbatim AND the stem and every option, because "key is C but the only valid move is E" cannot
be acted on without the item it describes.

Then, in the ruled order: **reviewer identity (2)** — first of the four, and structurally so, because
every one of the 202 rulings below is signed by an id that means nothing without those two rows;
**ruling notes (202)**; **item review notes (301)**, carrying `reviewedBy` and `reviewRecordedBy`
together so the whose-judgement/who-typed-it distinction survives the crossing; **word review notes
(14)**. Four separate artefacts, not one bundle, so one class can go STALE without the others hiding
behind it. `check:return-leg` now reports 6 CARRIED of 6 — but see the qualifier below.

**A CARRIED THAT CANNOT GO STALE IS A WEAKER CLAIM AND MUST NOT READ THE SAME.** Two classes have no
content timestamp to measure a delivery against, so nothing could ever report them stale. They are
`CARRIED?` — the artefact exists, and that is all the verdict means. Both timestamps are printed on
every row so a reader can see the comparison happened rather than trusting the verdict for it.

## R92 — Three guesses at one question, and the answer was that shape cannot tell you
*2026-08-16, building the check that answers "what else is named by a hash over a projection".*

`check:stamp-covers-payload` recomputes each delivered artefact's stamp FROM ITS OWN PAYLOAD and
compares it to the hash the artefact carries — the property stated as a fact about the file rather
than as a reading of the code, because reading five exporters goes stale on the next edit.

It took four attempts, and the failures are the entry:

  1. It read a payload key literally named `entries` — and reported FIVE artefacts clean while
     SKIPPING the misconception library, the artefact the whole check exists because of. R60 with
     the paint still wet.
  2. It read the stamp only at `body.stamp`, while the library and the proposed queue spread those
     fields FLAT at the top level. Both were skipped, and skipped INVISIBLY, because the skip list
     was keyed off the same field that was missing. Population 5 → 31 when fixed.
  3. It then took the FIRST top-level array as the payload, and produced two confident MISMATCHED
     verdicts against artefacts with two arrays each — it had hashed `signedTiers` instead of
     `emitted`, and `comparators` instead of `held`.
  4. Restricted to the ONLY array, it accused `tn-teacher-held` — whose payload is `held` AND
     `comparators`, an object and an array together.

**Three false accusations from three guesses at the same question, which IS the answer: SHAPE
CANNOT TELL YOU WHAT THE PAYLOAD IS.** The check now screens only artefacts with exactly one
non-envelope key and NAMES the other 38 as unscreened. The durable fix is a declaration from the
exporter — `stampedOver: 'entries'` — and it is unbuilt.

Result: 14 screened, 11 covering exactly what they ship, 3 UNVERIFIED status/mixed projections, 0
mismatched, 38 unscreened. The library is UNVERIFIED BY DESIGN: its stamp deliberately excludes the
`gate` verdict so the artefact's identity depends on content and not on the checker. The original
fault is closed — `approvalNote` is in the stamp source, so a change to the reviewer's words now
moves the name.

**The ambiguous citation is MARKED, NOT REPOINTED.** `6d3c109008854e71` names two files. R84's line
carries a marker saying so and stays as written; silently rewriting it to `af7d1a75ad843996` would
turn a record of what was verified into a record of what was verified LATER. Commit `441d84d` cites
the same hash and cannot be edited; the marker is its correction too. Nothing on Cowork's side cites
it — the superseded file was pruned on delivery, so the ambiguity is contained to this repo's records.

## R93 — Costing the migration-intent gap
*David, 2026-08-16: "you named it open, so scope it."*

Nothing compares a hand-written migration's INTENT against what the generator later does to the same
column. Prisma reverted the R80 clock fix on the next routine `migrate dev`, and it was caught only
because a broken edit tool made that migration short enough to read (R90).

**The exposure, measured:** 43 migrations, of which **6 contain SQL Prisma cannot express** —
7 `CHECK` constraints, 4 `CREATE TRIGGER`, 2 `CREATE OR REPLACE FUNCTION`, 4 `AT TIME ZONE`, 2
`DROP DEFAULT`. Every one of those is a fact about the database that the Prisma schema does not
know, which is exactly the set Prisma can silently overwrite.

**The shape David proposed is right: a post-migration assertion on the columns a hand-written
migration touched.** Concretely — a `packages/db/prisma/invariants.sql` holding one assertion per
hand-written fact (`ContentWriteLog.at` has no default; `log_content_write` contains `AT TIME ZONE
'UTC'`; the `Misconception` length CHECK exists; the four content triggers exist), run after every
migrate as `pnpm check:db-invariants`.

**Cost:** the assertions are ~40 lines of SQL over `information_schema` and `pg_proc`, plus a ~60
line runner and a CI step. The real cost is not the code — it is that **every future hand-written
migration must add its assertion, or the file becomes a list of the things we happened to think of
in August.** That is the same maintenance burden as `DECLARED_DOORS` and `KNOWN_UNTYPED`, and both
of those are held honest by a staleness rule: an entry that no longer applies FAILS. The same rule
works here — an assertion naming a column that no longer exists should fail rather than pass
vacuously.

**Not built this turn**, and the gap stays open and named. The one-line version of why it matters:
the six migrations above are the only place in this repo where the database knows something the
schema does not, and the generator's job is to make the database match the schema.

## R94 — Authority conflation arriving through the ruling channel
*David, 2026-08-16, correcting himself. The origin is the entry.*

**David's ruling said Annie had marked eight items a child cannot answer. She had not.**
`check:word-puzzles` sets `answerFlagNote` by executing the item's own rule against its key. He
issued the ruling without having seen the row; I repeated it in a report; it was one delivery from
a register entry recording eight machine findings under a reviewer's authority. R75's conflation —
the whole subject of which is that an agent's verdict must never read as a reviewer's — arriving
**through the ruling channel itself**, which is the one route nothing on either side screens.

It was caught by someone going and looking. Not by a gate.

**THE SWEEP, and its result is not the one the instrument first suggested.** A regex over `actor`,
`recordedBy`, `reviewerId`, `approvalMethod` and 1,235 attribution events found ZERO machine-shaped
authorities. That was a weak instrument answering a question it could not reach, because **the eight
were never wrong in the data.** `answerFlagNote` has no reviewer field beside it, by design; all
eight rows carry `reviewedBy` null. The store was right the whole time and the conflation lived
entirely in prose.

`check:authority-shape` now screens both directions and says that limit in its own output:
  · **0 machine verdicts wearing a person's authority.** 9 machine-set findings, none beside a
    reviewer attribution.
  · **463 rows carry a person-shaped authority that resolves to NO `Reviewer` row** —
    `human:staff-reviewer@cluecrew.test`, on 301 items via `reviewedBy` and 162 misconceptions via
    `approvedBy`, and on zero attribution events. It reads as a named individual and is not one.
    **That is the same conflation with the arrow reversed**, and it is the larger population by two
    orders of magnitude. Not resolved here: whether that id is a person, a role, or a seed artefact
    is a question for David, and guessing would be the fault repeating.

**The limit is printed on every run: this screens the STORE, not the PROSE.** The one instance we
have was correct in every row and wrong in a ruling, a report and nearly a register entry.

## R95 — The invariants file, built, and what it caught in its first minute
*David, 2026-08-16: "your objection is the argument for building it now."*

The objection was that the file becomes a list of what we thought of in August. The answer was
already in this district twice — `DECLARED_DOORS` and `KNOWN_UNTYPED` both FAIL on a stale entry —
so `check:db-invariants` has two halves and the second is the one that matters:

  1. **13 assertions**, each naming the fact and the reason. An invariant whose object no longer
     exists FAILS rather than passing vacuously.
  2. **COVERAGE, extracted from the migration SQL.** Every trigger, function, named CHECK and
     expression default across 43 migrations is matched against an invariant, and **a hand-written
     migration touching an unasserted object fails the check** — so the next one cannot land
     unasserted. Scanned, never hand-kept (R57).

**The canary reintroduced R83's exact regression** — `ALTER COLUMN "at" SET DEFAULT
CURRENT_TIMESTAMP` — and the check went from 13 of 13 to 12 of 13, naming the column and the
reason. Restored, and green again. A gate that has never failed has asserted nothing.

**Its first run over-reported, and the fix is a distinction worth keeping.** It flagged
`ContentWriteLog.changedColumns` as an unasserted hand-written fact. It was not: a bare `DROP
DEFAULT` is **Prisma's own vocabulary**, emitted whenever a model's default changes, and that line
came from a generated migration doing its job. The same statement inside a migration that also
carries a trigger, a function, a named CHECK or an expression default IS somebody deciding
something — R83's fix was exactly that. So the extractor scopes bare `DROP DEFAULT` to hand-written
migrations. 13 facts, 13 asserted, 0 unasserted.

## R96 — `stampedOver`, and a reversal about what an artefact's identity may depend on
*2026-08-16, closing R92.*

Three guesses at "which part of the body is the payload" produced three false accusations, and the
answer was that shape cannot tell you — **the exporter can**. `ArtefactStamp.stampedOver` names the
keys the hash was computed over. Optional, so the artefacts that predate it stay readable, and their
absence reports as UNSCREENED rather than as a pass.

**THE REVERSAL.** The misconception library's stamp deliberately EXCLUDED the gate verdict, on the
argument that an artefact's identity should not depend on the checker (R62's coupling, one level
up). That argument is sound and the consequence was worse than the coupling: the stamp covered
something other than the payload, so this artefact — the one the entire hash collision came from —
was the one thing `check:stamp-covers-payload` could never verify. The verdict is now in the stamp.
It costs nothing real, since `gate` is computed from `childHint` which the stamp already covers.
**Being VERIFIABLE beats being purely derived.**

The library's name moved `af7d1a75ad843996` → `ab381a4e7f68634d` when the projection was corrected,
which is the property working: a name that moves when the content moves.

Fixing the declaration then exposed one more instance of the two-shapes fault that has now run
through this whole thread. Some exports nest the stamp under `stamp`; others spread its fields FLAT.
Reconstructing only `sourceHash` and `snapshotOf` from the flat shape DROPPED the new declaration,
and the artefact fell back to the heuristic — which then read `stampedOver` itself as part of the
payload it was meant to describe. 12 of 14 screened artefacts now cover exactly what they ship; 38
remain unscreened and named.

## R97 — The two cannot be identified, because this store records no approval at all
*David's question, 2026-08-16. Answered by reading the rows.*

The question was which two of seven library entries record a person's approval where a machine
drafted to her ruling. **The answer inverts the premise twice.**

**FIRST: THE SPLIT IS 2 PERSON / 5 MACHINE, NOT 5 / 2.** Cowork's own `_meta.hintProvenance`, on
three files I hold and can quote:
  · `PLATFORM-IMPORT-english-misconceptions` (sha `293148522d245026`): *"TWO entries carry Annie's
    approved hint text VERBATIM… FIVE carry hints I drafted."*
  · `PLATFORM-IMPORT-BATCH-1` (sha `ee4bc48d5ce18153`) names them individually: within-span and
    negation-dropped are Anne's own words; neighbouring-sense and form-lookalike are drafts she
    approved unchanged.
  · `PLATFORM-IMPORT-BATCH-2` (sha `dcaf4b228ff0a722`): both drafts, approved unchanged.

So it IS recoverable — from Cowork's side, in files Cowork wrote. Whether Cowork still holds them
is a different question from whether they ever existed.

**SECOND, AND THIS IS THE ONE THAT MATTERS: THERE ARE NO FALSE APPROVALS IN THIS LIBRARY, BECAUSE
THERE ARE NO APPROVALS.** All six of the seven present here carry `approvedBy: null`,
`recordedBy: null`, `approvalMethod: null`, `approvalNote: null`, status PROPOSED,
`proposedBy: ai-draft:cowork-okafor-v1`, and **zero attribution events between them**. The seventh,
`en-vocab-dominant-sense`, is absent entirely (R85).

The `approvedBy: Anne` exists only in the transfer file. **It never crossed.** The platform library
never asserted it, so no row here carries a reviewer's approval that a reviewer did not give — the
loaded gun was in the file, and the door held. That is the import door being conservative and it is
worth saying plainly, because the same file has now produced three faults and this is the first
thing about it that went right.

**THE DISTINCTION THAT WAS MISSING IS REAL EVEN SO.** "Drafted by the agent, approved unchanged"
IS the reviewer's approval — she approved. It is not her authorship. Both read identically as
`approvedBy: Anne`, and that is what nothing could tell apart.

## R98 — Provenance on the row, and UNKNOWN is not ABSENT
*David, 2026-08-16, as the general repair.*

`Misconception.textProvenance` records where the text came from, who authored it, who approved it,
by what method, on what date, **and which of those are machine and which are person**.

**NULL MEANS UNKNOWN, NEVER ABSENT.** Cowork corrected a TRUE record of Annie's approval to false
because it looked on its own disk, found nothing, and treated silence as evidence. The export now
emits `{state: 'UNKNOWN'}` for a row with nothing recorded, so an entry whose source cannot be seen
reads as unknown rather than unsourced — the same distinction as `CARRIED?` on the return leg, and
the same one as R60's loud zero.

Six rows recorded from Cowork's quoted, hashed declarations: 2 PERSON, 4 MACHINE. Each row also
records that **this store holds no approval for it**, so the provenance cannot later be read as
confirming the transfer file's claim. **268 of 274 remain UNKNOWN**, and they say so.

## R101 — The hold caught a real error, and being faithful was not the point
*2026-08-16. Her hold of 2026-08-13, lifted by the artefact she wrote.*

`en-vocab-dominant-sense`'s hint entered by being READ from `annie-eng028-return.md`
(sha `2575946944cc0f41`, section 1, "hint (authored field)") — an artefact SHE WROTE, which is what
her protocol required. 93 characters, never retyped, never normalised. Cowork extracted it
independently and the two extractions are identical.

**TWO TRANSCRIPTIONS WERE ON RECORD AND THEY BEHAVE DIFFERENTLY. Both facts matter and neither
replaces the other:**

  · `_supersededHint` — *"…Read the words either side of it and check that meaning still works
    there."* — **differs from her field at offset 36.** That was the DRAFTED hint, and the words
    after offset 36 are `en-vocab-neighbouring-sense`'s direction. Her `hintRuling` names exactly
    that erosion: the dominant-sense child has ONE meaning and does not know a competition exists,
    so sending her to adjacent words sends her to check something she has no reason to doubt.
    **The ruling caught a live error in a hint that would otherwise have shipped.**

  · `_transcribedHintWithdrawn` — **matches her field exactly, no differing offset.** It was a
    FAITHFUL transcription of her replacement, withdrawn on protocol grounds rather than because it
    was wrong.

**THE SECOND IS THE ONE THAT VINDICATES THE PROTOCOL, NOT THE FIRST.** A hold that only ever
refuses wrong transcriptions is a spell-check. Hers refused a transcription that turned out to be
CORRECT, for three months, on the ground that its correctness could not be established from inside
the transcription — which is R25 stated exactly: *if my typing is faithful she learns nothing; if it
is unfaithful she confirms the error.* The faithful copy proves the discipline was not paranoia; the
drafted one proves it was not ceremony either.

No exception was needed on the way in. It was reported as 17 words against a 16-word cap; the cap is
per SENTENCE and her field is two sentences of 7 and 10 words, as her own note in the document says.
The gate returned 0 blocking. Nothing was exempted, amended, or asked of her.

## R102 — exemptFrom was in the registry and read by nothing
*David's ruling, 2026-08-16. One line for the record, not an investigation.*

`stem.quotes[].exemptFrom` names which child-facing ceilings a quotation is exempt from, because
the source text may exceed a cap we set for our own writing — when a child reads Grahame she reads
Grahame, and rewording him is not a fix. **The field sat in the declarative-field registry and was
read by NOTHING**: no file in `packages/core` mentioned it but the registry itself. Two ENG-001
items declared it and were refused three times on a sentence that is Grahame's own prose, and
neither side could break the loop — Cowork re-emitted what was already correct, my door refused a
declaration it was built to honour, and the receipt that would have said so did not exist yet.

`checkItemChildFacing` now reads it and skips only the NAMED ceilings, for the declared quotation
only; everything around the quotation stays capped. Two further faults surfaced doing it, both the
same two-name shape: the gate passed quotes only when the stem field was called `prompt` while R79
ruled `text` wins, and it screened `quotes[0].text` as its own string with no exemption at all.

## R103 — R79 migrated the data; the consumers did not follow
*David, 2026-08-16. One sweep, one count, no repair.*

R79 ruled `stem.text` wins and `migrate:citations` moved the field on every ENG row. FOUR consumers
never followed, and all four were found one at a time, by a refusal each: the exemption read, the
declared-quote pass, `textsFrom`'s treatment of `quotes[].text`, and the quote-presence check.

**The sweep, so the rest is a number rather than a series of surprises: 49 files name a stem
`prompt`. 22 read it WITHOUT also reading `text`. Of those, 8 can touch an English item** — three
serving components (`plain-item`, `engines/shared`, `mock-runner`) and five scripts
(`backfill-segments-in-options`, `compare-gates`, `export-review-pack`, `export-walk-scripts`,
`fix-quotations-and-gaprefs`). The other 14 are VR, NVR or story fixtures, where `prompt` is still
the authored name and nothing migrated.

Counted, not repaired. Three of the eight are on the child's serving path, which is the half that
matters; a stem that renders empty to a child is not the same fault as an export that omits a
column, and they should not be fixed as one batch. **R86 in a field name: a migration is not
complete until every reader has moved, and the readers are found by scanning, not by remembering.**

## R104 — Four defect rulings, and the one category that cannot be recovered
*David relaying Annie, 2026-08-16. Against the KNOWN DEFECTS sheet attached to the ENG-028/ENG-001 packet.*

- **Row 9 (295 options in ENG-001/002/003 with no execution note) is CLOSED PERMANENTLY.** Her
  ruling: it is VINTAGE, not loss, and back-writing the notes would produce **reconstructions
  rather than records**. Drop the row from the sheet. This is the strongest version of the point
  the sheet was already making in its own words and did not act on: a field introduced after a
  cluster was drafted has no true value for that cluster, and inventing one puts a fabricated
  provenance where an honest absence was.
- **Row 5 (31 notes needing a reader) stays open.** It is the half of the same family that CAN be
  written truthfully, because the reasoning exists — it is in the walk-through — and a reader is
  moving it, not inventing it. The two rows were paired in the sheet and are not the same ruling.
- **Row 2 is the ONLY unrecoverable category: nothing ships with a second defensible answer.**
  Everything else on the sheet is repairable after publication; a second correct answer is not,
  because the child who defended it was right and the mark said otherwise. Two options
  (`ENG-002-pp-19` C, `ENG-002-pp-23` B), both already held from every packet.
- **Row 8: the nine entries go to her.** See R105 for the count, which is not 172.

## R105 — The retag landed, and moved two items from one unapproved tag onto another
*2026-08-16, delivery 77. Seven ENG-001 items, applied with `--replace`.*

Verified 64/64 against the payload hash the file declares, all seven rows DRAFT with **zero
attribution events**, so nothing reviewed was destroyed by the replace. Five keys were refused at
the door first (`item._previousLineRefs`, `options[]._previousValue`, `_previousExecution`,
`_previousAttractorLine`, `_previousWindowClass`) and declared as PROPOSED exceptions — R57's
mechanism doing exactly its job for the sixth time, this time on the way IN rather than after.

**THE RETAG DID NOT DO WHAT THE SHEET SAYS IT DID.** Row 7 reports five of six retagged off the
retired name, one left. True. But a retag is only a release if the SUCCESSOR is approved, and two
of the successors are not:

| item | was | now | still refused? |
|---|---|---|---|
| WIW-08, -17, -20 | `en-vocab-secondary-sense` RETIRED | `en-vocab-dominant-sense` ACTIVE | released |
| WIW-04 | `en-vocab-secondary-sense` RETIRED | `en-vocab-neighbouring-sense` PROPOSED | still refused |
| WIW-11 | `en-vocab-secondary-sense` RETIRED | `en-vocab-form-lookalike` PROPOSED | still refused |

ENG-001 went from 19 distinct tags to 21, and from 10 items a verdict would refuse to 8. Net
progress, and two of the six moved sideways rather than out. **A RETAG OFF A RETIRED ENTRY ONTO A
PROPOSED ONE IS NOT A RELEASE, IT IS A CHANGE OF WHICH APPROVAL IS OUTSTANDING** — and it reads
as a release in every account of it, including the sheet's.

**THE COUNT IS 215, NOT 172.** Row 8 asserts 172 in capitals. `pnpm export:approval-batch`, reading
the store, screens 9 PROPOSED English entries carrying **215 items** — the same nine entries, a
different denominator, and the number is the size of the decision being put in front of her. The
sheet's own note explains why its figure moved once (the `en-vocab-dominant-sense` release moved
nobody) and does not reach a 43-item gap. Ours is measured and re-exported; theirs is asserted.
Not resolved here — reported, with the artefact.

**AND THE RETIREMENT WAS ONLY EVER WORKED THROUGH ENG-001.** `en-vocab-secondary-sense` is RETIRED
and still tagged on **11 options across 11 items**. One is WIW-19 B, which the sheet names and
reports to her unplaced. **The other ten are in clusters no sheet mentions**: `ENG-002-pp-05`,
`-08`, `-13`, `-19`, `-20`, `-21`; `ENG-004-AGG-02`, `-AGG-03`; `ENG-012-ML-02`; `ENG-020-HD-07`.
A retired tag refuses a verdict exactly as an unapproved one does, so those ten items are held and
nothing says so. Found by asking the store for every non-ACTIVE tag rather than by reading the row
about ENG-001 — R86's shape again: the sheet is not the population.

## R106 — The number between here and a signed bank, measured instead of assembled
*David, 2026-08-16. "Every account of it so far has been assembled from sheets rather than from the store."*

**224 of 371 English items would refuse a verdict today. 147 would take one.** `pnpm
check:verdict-refusals`, screening the store.

Three sheets had been answering this between them and none of them was answering it: row 8 counted
unapproved tags (172, wrong by 43), row 7 counted the retired one in ENG-001 (1 of 6, true of that
cluster and silent about ten more), row 3 counted weak distractors (not a refusal at all). Different
populations, none of them the door.

**THE CHECK CALLS THE DOOR'S OWN CODE, WHICH REQUIRED MOVING IT** (R41). `publishBlockers` was
private inside `admin-items.ts`, so any district survey had to reimplement its four conditions —
the M-column fault exactly, and it would have been reported as a measurement of the door. It now
lives in `packages/core/src/verdict-blockers.ts` and both call it; `assertMisconceptionsActive`
likewise decides through the shared `inactiveMisconceptions`.

| route | items | whose |
|---|---|---|
| `tag-proposed` | 215 | hers — the approval batch releases them |
| `tag-retired` | 11 | Cowork's — the items need retagging |
| `child-facing-copy` | 4 | Cowork's — reword, never exempt |
| `no-correct-option`, `missing-misconceptions`, `tag-missing`, `similarity-review` | 0 | measured clean |
| `unanswerable` | **NOT SCREENED** | — |

**ONE ROUTE IN CODE, THREE CAUSES IN THE STORE.** The door collapses PROPOSED, RETIRED and
no-row-at-all into one string, `unapproved-misconception`. They are three different jobs belonging
to two different people, and a single number tells the reviewer the wrong thing about her own
workload. Split at the report, not at the door.

**AND THE CHECK'S OWN ZEROS NEEDED R60 TURNED ON THEM.** Four of eight routes came back zero on the
first run and they were not the same kind of zero. `unanswerable` depends on `check:word-puzzles`,
which names ten VR `questionTypeId`s explicitly — **no English item can ever carry that flag**, so
its zero is guaranteed by scope and would read as a clean bill for a test never administered. It
now prints `NOT SCREENED`. `similarity-review` looked identical and was not: the scan filters on
status only, so English is in scope, and it screened 729 unpublished items against 2114 fingerprints
for 0 — the flag COLUMN is empty bank-wide only because CI runs without `RETRO`, which is what
writes flags. Screen clean and column empty are different facts and only one is a finding; the
route now records which. **R61's fourth shape found inside a check written to apply R61.**

**Six items fail more than one route**, so fixing the first would not release them — the thing a
short-circuiting door cannot show and the reason this one does not short-circuit.

## R107 — The approval batch goes to her on paper, and 209 of the 215 are her own sentences
*David, 2026-08-16. Her defect ruling 8.*

`export:approval-batch` now emits the sheet as well as the JSON — same nine entries, same order,
same strings, **one projection under one hash** (R88: the fault it names is a stamp computed from
something other than what shipped). She reviews on paper and never signs in, so the JSON was never
a delivery to her; it was a delivery about her decision.

**THE EXPORT'S OWN PROSE CARRIED THE WRONG NUMBER, HARD-CODED.** Its `note` field read "Nine
entries, 172 items" as a literal while the code three lines below counted 215 and printed it. The
artefact contradicted itself and the prose is the half a reader believes. Computed now.

**209 OF THE 215 HANG ON TWO ENTRIES WHOSE HINTS ARE RECORDED AS HER OWN WORDS.**
`en-within-span-wrong-element` (174) and `en-negation-dropped` (35) both carry
`hintAuthorKind: PERSON, hintAuthoredBy: Annie`. Four entries are Cowork's (55 items) and three
have no provenance at all (3 items) and say UNKNOWN rather than nothing (R98). So the batch is
overwhelmingly a request that she confirm sentences she wrote — which is a different act from
reviewing ours, and the sheet has to say which it is asking for on each entry, because **a hint we
wrote and she approved unchanged is indistinguishable from one she wrote.**

The first rendering printed the provenance object raw. On paper that buried the authorship line
inside a serialised blob — R98's failure mode one layer out: the record was TRUE and unreadable,
and unreadable is how a true record gets corrected to a false one.

## R108 — R98 inverted: unknown recorded as HER, at the field that decides what a child is taught
*David, 2026-08-16, on Annie's standing rule. She asked for this before she would open the batch.*

Her rule, from `en-vocab-dominant-sense`: **read the hint from the stored field with the tool, never
confirm it from a quote — a confirmation from a transcription tests nothing.** She applied it to the
two entries the batch said were hers, on the grounds that if they entered the store the way that one
did they may carry the same drift.

**FIRST: THE TOOL DOES NOT EXIST HERE.** `compare_stored_hint.py` is named in Cowork's authoring
documents and was never delivered; a whole-filesystem `find` returns nothing. The comparison was run
by hand to the same discipline — dump each `childHint` from the field to a file, extract the
candidate source by document STRUCTURE, byte-compare, never retype. Saying "I ran the tool" would
have been the precise class of claim she was testing for.

**THE TEXT IS CLEAN. THE AUTHORSHIP IS NOT.**

| entry | stored | source | |
|---|---|---|---|
| `en-within-span-wrong-element` | 71 ch `a167954591f9` | 71 ch `a167954591f9` | identical byte for byte |
| `en-negation-dropped` | 95 ch `893241c07185` | 95 ch `9a2159f861a5` | `*not*` stored as `'not'` |

The second is the finding a byte comparison exists for: **markdown emphasis silently read as
apostrophes at import**, in a field declared carried verbatim. Small, real, invisible to any check
that compares meaning.

**BOTH TEXTS COME FROM `LIB-PROPOSAL-*.md`, UNDER THE HEADING "## 3. Proposed child hint".** Those
are documents the drafting side wrote TO her. The entire basis for `hintAuthorKind: PERSON,
hintAuthoredBy: Annie` was one free-text sentence in another agent's metadata: *"Two are Anne's own
text quoted verbatim from her proposals"*. **"Her proposals" carries the whole claim and is
ambiguous exactly where it matters** — proposals BY her, or TO her. Every artefact here says the
latter. 1,738 text artefacts scanned across Downloads, `content/` and `docs/`; no document authored
by her contains either string. Two artefacts of hers exist on this disk — `annie-eng028-return.md`
and `annie-maths-families.md` — and neither carries these. (I first reported ONE, and overstated the
thinness of the record by a third; the base is small, and that is the finding, so its size has to be
right.)

**RULED: both go to her marked AUTHORSHIP UNKNOWN.** Not as her words. Nothing is marked as hers
without an authored artefact of hers carrying the text — today that is `en-vocab-dominant-sense`
alone, and it is already ACTIVE and not on the sheet. So **nothing on the batch is marked as hers,
she reads all nine as new, and that is more work than she was promised and the only honest version.**

**THE FIX IS IN THE STORE, NOT THE SHEET.** The paper batch RENDERS `textProvenance`, so correcting
the rendering would have left the store still claiming PERSON/Annie and the next export saying it
again. The superseded claim is kept beside the correction (`hintAuthorKindWasClaimedAs`), because a
correction that erases what it corrected leaves her ruling unreadable later. **UNKNOWN here is not a
denial** — it records that nothing available can tell, which she can settle in one sentence nobody
else can supply.

**THIS IS R98 RUNNING BACKWARDS.** R98 was written because Cowork read silence as evidence and
corrected a TRUE record of her approval to false. This is the same mechanism in the other direction:
an absence of evidence recorded as HER authorship, at the field that decides what a child is taught
after a wrong answer. And I built it into the delivery — the sheet told her in bold, on 209 of 215
items, that she was confirming her own wording. Held before it went.

**THIRD INSTANCE OF ONE FAULT IN TWO DAYS**: the hard-coded `172`, Cowork's `approvedBy`, and now
`hintAuthoredBy`. Each a claim in prose, derived from nothing, believed because it was written down.
**The prose is the half a reader believes, and none of these three was computed from anything.**

## R109 — One route, three causes, and only one of them is hers
*David, 2026-08-16, ratifying R106's proposal.*

`assertMisconceptionsActive` returned `unapproved-misconception` for PROPOSED, RETIRED and
no-library-row-at-all, and the message a reviewer then read said: *approve them in the misconception
queue first*. **For a RETIRED tag that instruction is wrong and the tag is not in the queue to
approve** — the option needs retagging onto a successor, which is not her job at all. Eleven English
items sit in exactly that state. Three codes now, three instructions, identical refusal: the door's
behaviour is unchanged and only the reason it gives is split, because the reason is the whole of
what the reader does next.

## R110 — Every retag on record, and the two claims that must not share a verdict
*David, 2026-08-16, on Annie's generalisation: moving a dependency does not discharge it.*

**THE SWEEP. 36 retags. 19 RELEASED, 17 NOT.** Cowork's `RETAGDEPENDENCYREPORT.txt` supplies the
population — the retag history lives in `_previousMisconceptionId`/`_previousMechanism`, which are
PROPOSED exceptions here and do not cross, so that half is genuinely theirs. Its STATE column is not:
in its own words, *"what CODE HAS SAID, relayed in conversation… every state here is REPORTED, not
read"*, and twelve of its rows were UNKNOWN for that reason alone. `pnpm check:retag-releases`
resolves every successor against the library table.

**All twelve UNKNOWNs resolved, and they split six-six** — the exact shape that makes an UNKNOWN
column dangerous, because either half alone would have been a safe guess and neither is:

| successor | retags | state |
|---|---|---|
| `en-vocab-dominant-sense` | 13 | ACTIVE |
| `en-wrong-scope-retrieval`, `en-plausible-not-stated`, `en-cause-agent-swap`, `en-attribute-transfer` | 6 | ACTIVE |
| `en-vocab-neighbouring-sense`, `en-coordination-wrong-conjunct`, `en-vocab-form-lookalike`, `en-within-span-wrong-element`, `en-whole-text-absence-asserted` | 17 | **PROPOSED** |

**Zero contradictions between the two stores, and every retag with an option to check against
LANDED here.** So the reporting was the whole fault: the moves were real and correctly applied, and
seventeen of them were described as releases while moving a row from a tag that blocks it onto a tag
that blocks it. **All seventeen land on entries in the approval batch**, so her nine signatures
discharge every one — which is the answer to her generalisation. Moving a dependency did not
discharge it; it queued it behind the same nine.

**THE APPROVAL CLAIM, MARKED AND NOT WITHDRAWN.** Seven entries name her as approver; exactly one
(`en-vocab-dominant-sense`) rests on an artefact she wrote. RULED: `approvalAuthorKind` goes to
UNKNOWN on the other six. **`approvedBy` STANDS and this script does not write it.**

That asymmetry is the ruling's content. R108 took authorship to UNKNOWN because nothing supported
it. Approval gets the same *treatment* and the opposite *verdict*, because **withdrawing a record of
her approval on an absence is the delivery-58 error** — an absence of evidence read as evidence of
absence, against her own work. Two of the six are the successors `WIW-04` and `WIW-11` were retagged
onto, so R105 and this are one fact met from two directions.

The sheet says: *recorded as approved by you on the authoring side — no artefact found, please
confirm or correct*, and explicitly **not** that the entry is unapproved. The first draft of that
line said "you are on record as approved **here**", which is false — this store holds `approvedBy:
null` for all six and the claim lives on the drafting side. **A second unsupported claim, made in the
act of marking the first.** Corrected before delivery; naming it because that is three times in one
day that prose ran ahead of what was measured.

Cowork ran the authorship search independently on its own roots and reached the same finding. Two
sides, two disks, no artefact. That is convergent and it is still not proof she did not write them.

## R111 — All nine approved, and 224 refusals become 15
*Annie's approval-batch return, 2026-08-16. `annie-approval-batch-return.md`, sha256 `f92d4bae97ea248e`.*

**SHE SETTLED THE AUTHORSHIP AND THE ANSWER WAS THE ONE THE AMBIGUITY SUSPECTED.** In her words:
*"'Her proposals' meant proposals written TO me, not BY me… Not authorship unknown. Known, and not
mine."* Entries 1-6 are `hintAuthorKind: AGENT`, authored by the drafting side, approved by her —
she read the drafts, tested the boundary clauses, rejected two first drafts and approved the
redrafts. **UNKNOWN was the right state to HOLD and the wrong state to KEEP**, and that distinction
is the whole value of R108: holding it is what made the question askable.

**THE APPROVALS WERE ALWAYS REAL.** Her note: *"The approvals are real. They were given in the review
conversation, item by item, with reasons. What does not exist is an artefact… The absence is in the
recording, not in the decision."* Which vindicates the ruling that `approvedBy` STANDS. Withdrawing
it would have been a false negative on work she had actually done.

**TWO DEPARTURES FROM THE INSTRUCTION, MADE OPENLY:**
1. **The artefact is THIS return, not the ENG-028 one.** The instruction named
   `annie-eng028-return.md`; that document is about `en-vocab-dominant-sense` and does not mention
   these six. Pointing a provenance record at a document that does not contain the claim is the
   exact fault of the preceding two days.
2. **Entries 7 and 8 are PERSON/Annie, not AGENT.** The ruling covered 1-6 and was silent on these,
   but she REWROTE both hints in her own file, so they are hers by the same test that makes
   `en-vocab-dominant-sense` hers. Her section 1 calls that entry "the only hint in the English
   library that is" hers; her own section 3 makes it three. Sequence, not contradiction.

**HER TWO REWRITES, READ FROM HER FILE BY DOCUMENT STRUCTURE AND NEVER RETYPED** (her condition of
signature). Both catch a fault no gate here has:
- `en-determiner-omitted`: the drafted hint said *"Read the line aloud and listen."* **A child
  sitting an 11+ paper cannot read aloud** — the only hint in the library asking her to do something
  the room forbids. 81 → 86 chars.
- `en-narrator-voice-as-fact`: the drafted hint's third sentence *coached the key*, naming the
  reporting to a child whose error IS taking a report as fact. 140 → 54 chars, three sentences to
  one. Her general rule, stated: an entry about mistaking a reported opinion for fact cannot have a
  hint that names the reporting.

Both pass `checkChildFacingText` with zero faults.

**THE NUMBER: 224 → 15.** And the arithmetic is not 224 − 215 = 9, which is what the batch's own
size predicts. **Six items carried a tag she released AND a fault of ours**, so they were in both
populations; only 209 items had tag-proposed as their ONLY blocker. What remains is 11 `tag-retired`
and 4 `child-facing-copy` — all ours, all disjoint now, `0 items failing more than one route`.
**All 36 retags are released**, the 17 discharged by these signatures exactly as predicted.

**A CHECK THAT CRIED WOLF ON ITS OWN GOOD NEWS.** The moment the nine went ACTIVE,
`check:retag-releases` reported *11 CONTRADICTIONS between the two stores* — Cowork's report is a
point-in-time file and this reads live state, so PROPOSED-then-ACTIVE is the expected direction of
travel, not a disagreement. Now reported as OVERTAKEN. A stale artefact and a contradiction are not
the same finding, and conflating them would have had someone chase eleven phantom disagreements
created by success.

Also caught: `pnpm scan:vocab` failed on the word "guarantee" in a comment I wrote this session.
Reworded, never exempted.

## R112 — Every approval in this project was given in conversation
*Annie's standing point, 2026-08-16: "That will keep happening until rulings have a channel."*

The ENG-028 return is the FIRST artefact carrying a ruling of hers. Every approval before it —
including the six the last two days were spent trying to evidence — was given in the review
conversation and recorded nowhere. **The attribution gap she raised in August, arriving at the one
place it bites: a decision that was made, cannot be evidenced, and can only be settled by asking the
person who made it.**

**What it would take, in one line: the reviewer surface writes her return document on submit — the
same authored-field shape she has now used twice — so a ruling becomes a file at the moment it is
made, instead of a reconstruction afterwards.** Everything needed already exists: the shape is
proven, `recordSignature` has the naming path, and `check:return-leg` measures whether a class
crosses. What is missing is that no door WRITES the artefact; they all write state and leave the
reasoning in the conversation.

## R113 — The return-document door: a ruling becomes a file at the moment it is made
*David, 2026-08-16, on Annie's standing point: "That will keep happening until rulings have a channel."*

She raised the attribution gap in August. It cost four corrections in two days — the hard-coded 172,
Cowork's `approvedBy`, `hintAuthoredBy`, and my own "on record as approved **here**" — and it cost
two days of trying to evidence six approvals she had genuinely given. Her diagnosis, exactly right:
*"The approvals are real… What does not exist is an artefact. The absence is in the recording, not
in the decision."*

**THE GAP IS A PROPERTY OF THE CODE, NOT OF ANYONE'S DILIGENCE. Every door here writes STATE and
leaves the REASONING in the conversation** — `status` moves, `approvedBy` gets a name, an
AttributionEvent records that a thing happened, and the WHY, the only part a later reader cannot
reconstruct, is nowhere. Nothing wrote the artefact.

**BUILT SMALL, AS SCOPED. One door.** `markReviewedAction` — the FIRST verdict, which everything
downstream is gated behind:
- `renderReviewerReturn` in `packages/core` is PURE: no clock, no filesystem, no database. The
  caller passes `at`. That is what makes it testable and what keeps the hash honest.
- `writeReviewerReturn` hashes **the exact string handed to `writeFileSync`** — not a second render,
  not the input, not a re-read. R88's fault was a stamp from a different projection than the one
  delivered; here it would put a reviewer's name on a document she never saw. Verified end to end:
  recorded hash equals the hash of the bytes on disk.
- `AttributionEvent.returnArtefact` pins `{file, sha256, bytes}` to the event. Null means NO
  ARTEFACT, which is the true state for all 609 prior events and must never read as "no reasoning
  was given".
- `content/reviewer-returns/` is git-tracked. That is most of the value: a ruling in a commit has a
  diff, a date and an author, which is precisely what the six approvals did not have.

**THE SHAPE IS HERS AND IS REPRODUCED DELIBERATELY.** Her two returns share a structure that survived
two agent-to-agent transfers without drift: an authored field marked as authored, a ruling per
subject rather than a status flag, and the reasoning travelling with the verdict.
`en-vocab-dominant-sense` is the only hint that survived the drift which caught everything else, and
it survived because it arrived in this shape.

**ABSENCE IS RENDERED, NEVER ELIDED.** A verdict with no reason prints the heading and says the door
accepted it without one — "no reason given" and "reason not asked for" are different facts. An empty
return renders **"This document should not exist"** rather than a blank page that reads like a
completed review (R60, in a document).

**WHAT IS NOT VERIFIED, STATED PLAINLY:** the web submit itself. The admin surface needs a staff
sign-in and I do not enter credentials. Renderer, writer, hash and schema are verified by test and
by direct call; the form-to-database path is not. Also: NEITHER `Reviewer` ROW HAS A `staffEmail`, so
today the door would write `reviewerId: UNRESOLVED` — honest, and it means the naming path is not yet
connected at this door even though `signItemAction` has it.

## R114 — After the nine signatures: the fifteen that are ours
*2026-08-16.*

`pnpm export:cowork-workorder`. **11 retags, 4 rewordings, 0 items on both routes** — so each is
exactly one pass and neither job blocks the other. All eleven retags are off the same tag
(`en-vocab-secondary-sense`, RETIRED), and each carries the option's own `misconceptionExecution`
note, because the successor has to match what the option EXECUTES rather than what is nearest. All
four rewordings are the same fault: a declared quoted span that is not in the text.

It also carries `en-determiner-omitted`, which this store holds and Cowork's 88 do not — **the entry
whose drafted hint she rejected for telling a child to read aloud in a room where she cannot.** If
the entry does not cross, the two sides hold different libraries and her correction exists on one
side only.

## R115 — A ruling channel that cannot name the ruler, and the count that did not reconcile
*David, 2026-08-16.*

**THE NINE, BY `hintAuthorKind`. THE ANSWER IS 2 PERSON / 7 AGENT — and NEITHER reported figure was
right, including mine.**

| entry | kind | authored by |
|---|---|---|
| `en-within-span-wrong-element` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-negation-dropped` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-vocab-neighbouring-sense` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-vocab-form-lookalike` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-whole-text-absence-asserted` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-coordination-wrong-conjunct` | AGENT | ai-draft:cowork-okafor-v1 |
| `en-determiner-omitted` | **PERSON** | Annie |
| `en-narrator-voice-as-fact` | **PERSON** | Annie |
| `en-relative-pronoun-choice` | AGENT | ai-draft:cowork-okafor-v1 |

**The reconciliation, and there are three things in it, not two.**
1. `en-determiner-omitted` — PERSON, ours only. Cowork holds 8 of the 9. Explains one.
2. **`en-relative-pronoun-choice` — Cowork says PERSON, the store says AGENT, and the store is
   right.** Her return, section 3: *"APPROVED AS WRITTEN, with a note. Both fields approved."* She
   did not rewrite it. **A note SHE wrote, attached to a hint the drafting side wrote, has been read
   as her authorship of the hint** — R94's conflation once more, this time from involvement rather
   than from a machine verdict. Cowork was right to refuse to guess which two.
3. **The "3 PERSON" was mine and it was wrong**: it counted `en-vocab-dominant-sense`, which is a
   tenth entry and not on the sheet. Three parties, three counts, none of them matching, and only
   one of them read from a store.

**THE NAMING PATH — AND THE INSTRUCTION WAS RIGHT ABOUT THE GAP AND INCOMPLETE ABOUT THE FIX.**

Setting `staffEmail` alone makes the door name **whoever is logged in**, and the person at that
keyboard is DAVID TRANSCRIBING ANNIE'S PAPER RULINGS. **She never signs in.** Inferring the reviewer
from the session names the transcriber — the gap the door was built to close, one layer in, exactly
as he put it, but reached from the workflow rather than from the credential.

So both halves:
- `rev-0001` → `staff-reviewer@cluecrew.test`, verified by re-reading. **With a standing caveat
  printed on every run: that is a SHARED SEED ROLE ACCOUNT — R94's 463 rows — so anyone holding the
  login now signs as Annie.** Correct for dev, wrong for anything real; a named reviewer needs her
  own account before this writes outside development.
- `rev-0002` (Joan) gets NO email. Held since 2026-08-06, no second reviewer account exists, and an
  invented address would bind signatures to a person who cannot hold them. Reported, not guessed.
- **The door no longer depends on either.** It takes an EXPLICIT reviewer selection: whose judgement
  from the form, who typed it from the session, never merged. A chosen reviewer that does not
  resolve is a REFUSAL, not a fallback to nobody — writing the return anyway would produce the exact
  artefact this door exists to prevent, a ruling naming no one.

**ONE RETURN DOCUMENT CONFIRMED, NAMING HER.**
`return-approval-batch-nine-english-library-entr-2026-08-16-14e6efcb8e11d956.md`, 1,990 bytes,
sha256 `14e6efcb…c335`. The AttributionEvent resolves `rev-0001` → "Annie" through the relation,
`recordedBy` stays `human:david@cluecrew.test`, and the hash on the event equals the hash of the
bytes on disk. Her standing note is in it, in her words, under an authored-field heading — including
the sentence that caused the door to exist.

Still not verified: the web submit itself, which needs a sign-in I do not perform. The resolution,
writer, hash and event were run through the door's own code path; the form and the redirect were not.

**AND THE DOOR HAD INVENTED A SECOND DIRECTORY FOR AN EXISTING CLASS.** It wrote to
`content/reviewer-returns`, ONE LETTER from `content/review-returns`, which has held reviewer
copy-coming-back since 5 August. `scan:vocab` caught it within the minute: the old path is already
excluded — *"copy coming BACK, quoted verbatim as the reviewer wrote it"* — and the new one was not,
so **her own reasoning was flagged for the word "error" in reviewer prose**. A SCOPE fault, not a
wording fault, and the distinction is the point: the house rule is that a scanner hit is reworded and
never exempted, but rewording HER text to satisfy a gate aimed at children is the single thing this
channel exists to prevent. Moved to the existing directory rather than adding a fourth exclusion —
two paths for one concept will drift, which is R57 in a filename.

## R116 — Involvement read as authorship, and a person wearing a role's login
*David, 2026-08-16. One line, no sweep — and the caveat made permanent.*

**NOTHING ELSE IS MARKED PERSON ON THE STRENGTH OF A COMMENT.** Two entries in the whole library
carry `hintAuthorKind: PERSON` — `en-determiner-omitted` and `en-narrator-voice-as-fact` — and both
name the same artefact, `annie-approval-batch-return.md` (`f92d4bae97ea248e`), in which she
demonstrably rejected a draft and wrote a replacement. Neither rests on a comment.

**BUT THE DENOMINATOR IS 9, NOT 277.** Only 9 of 277 library entries carry ANY `textProvenance`;
**268 have none at all**, so for those the question cannot be asked — not "no", but "unaskable". The
one-line answer is clean and it covers 3% of the library. Recording the figure because a clean
answer over an unstated denominator is how 172 happened.

`en-relative-pronoun-choice` remains the instance, and it is Cowork's row rather than ours: **she
wrote a NOTE attached to a hint the drafting side wrote, and the note became her authorship of the
hint.** R94's conflation arriving from INVOLVEMENT — the reviewer touched it, so the reviewer is
recorded as having made it. Nothing on either side screens for that, and nothing here can: it is a
judgement about what a person did, from a record that only says they were present.

**THE 463-ROW CAVEAT IS NOW PRINTED EVERY RUN, NOT ONCE.** `check:authority-shape` gains a third
shape. The first two are a machine verdict wearing a person's name, and a person-shaped string
resolving to nobody. This is neither: **the Reviewer row is real, the person is real, and the ACCOUNT
is shared**, so every holder of one login signs as one named individual. Nothing else in the check
catches it, because every row it produces resolves correctly — R94's conflation with the direction
reversed. There a role string wore a person's shape; here a person wears a role's login.

It prints on every CI run rather than at set-up, because **a caveat that appeared in a single console
output on the day it was created is true, recorded, and unread at the moment it matters** — which is
the same failure as the hard-coded 172 and Cowork's `approvedBy`, in a warning rather than a claim.

## R117 — Zero refusals; two artefacts under one name; and the cap already rewrote seven hints
*2026-08-16. Delivery 83, both payloads verified 64/64.*

**THE NUMBER IS ZERO. 371 of 371 English items would take a verdict today.** All fifteen landed
(the door refused first on `stem._previousQuotes`, R57's mechanism a seventh time), and the six
successors Cowork could not state are all ACTIVE — every one of the 15 distinct tags across those
items resolves ACTIVE, none missing, none retired.

**THE HASH DISAGREEMENT DOES NOT EXIST. THERE ARE TWO DOCUMENTS AND I GAVE THEM THE SAME NAME.**

| file | bytes | sha256 | whose |
|---|---|---|---|
| `annie-approval-batch-return.md` | 4,614 | `f92d4bae…` | **hers** — she wrote it, I read it |
| `return-approval-batch-…-14e6efcb….md` | 1,990 | `14e6efcb…` | **the door's** — it wrote it, about the same nine entries |

Both hashes are correct for their own bytes. Cowork holds `14e6efcb…` because that is the file I
SENT it; it has never had her document at all. **Nothing re-serialised.** Its inference was
reasonable and wrong, and the cause is mine: I named the door's output "reviewer return", the phrase
her file already used, so two artefacts arrived under one name — which is the day's theme
(`en-relative-pronoun-choice`, the 172, `approvedBy`) landing in my own naming.

**AND THE GENERAL ANSWER, SO IT IS NOT LUCK: a payload hash is over the canonical serialisation of
the payload OBJECT — `sort_keys=True`, compact separators, UTF-8 — and NEVER over the file.** That is
precisely what makes it survive re-serialisation, re-indentation, and any reformatting of the
container. Both d83 payloads verified 64/64 through that mechanism while their FILENAMES lost every
hyphen in transit. A file hash would have failed; the payload hash cannot notice.

**THE 16-WORD CAP HAS ALREADY SILENTLY REWRITTEN SEVEN HINTS.** The library comparison — a
VERIFICATION, not an import, because the DB authors library text — found **7 of 9 childHints differ**,
and every one of Cowork's is shorter and sits at 13-16 words. Ours are 17-23.

**She approved OUR wording.** The paper sheet rendered `childHint` from this store verbatim; that is
the string she read and ruled on. So Cowork's copies are **unapproved shortenings of text she
approved** — produced by the same 16-word cap David has just ruled does not govern her wording, and
the cap did to seven entries silently what it would have done to `en-determiner-omitted` visibly.

**The worst of the seven is `en-narrator-voice-as-fact`.** Cowork's copy reads *"…or what the room
decided?"* — **the coaching she struck.** She rejected the drafted hint precisely because its third
sentence named the reporting and so handed the child the answer. Their store still contains the
fault, one shortening later, and their own note asks for her wording as a field because the
transcription route is closed. It is in the export they now hold.

## R118 — Nothing between a signed bank and a child is content
*David, 2026-08-16: "what is left in the serving path."*

Zero items refuse a verdict. **Zero items can reach a child, and not one of the reasons is an item.**
Traced from `orchestrator.ts` outward:

**1. NO ENGLISH ITEM IS SERVABLE AT ALL.** `itemPool` takes `status: 'LIVE', pool: 'PRACTICE'`. All
371 are `DRAFT`. In dev it falls back to any-status, so the rest of this is reachable in dev and
nothing is reachable in production.

**2. NO COMPREHENSION ENGINE EXISTS.** The `engines` map in `play-runner.tsx` holds five VR families
and five Maths; there is no comprehension entry. Routing is `engines[activity.family] ?? engines.wordweb`,
and `FAMILY_BY_TYPE` in `packages/core/src/families.ts` names **21 VR question types and no `en-comp-*`
type**, so `familyForType` returns its `?? 'wordweb'` default. **A comprehension item would render in
the Word Web engine** — a synonym tile — and the fallback means it does so silently.

**3. THE STEM WOULD BE BLANK.** `stemText()` returns `stem.prompt` or `''`, and all 371 items carry
`stem.text` (R103). Wordweb, the engine the fallback selects, calls exactly that. So the child would
see options and no question.

**4. THE PASSAGE HAS NO DELIVERY PATH — and this is the one that is not a wiring fault.**
`grep -r passage` over `apps/web/app/crew` and `apps/web/components/crew` returns **nothing**. The 21
extracts sit in `content/passages/`, every item carries `passageRef` and `lineRefs`, `Item.lineRefs`
was migrated to item level under R77 — and no child-facing surface reads any of it. **A comprehension
item without its passage is not a degraded question, it is not a question**, and unlike 1-3 there is
no existing component to point at a different field.

**THE SHAPE OF THE FINDING: EVERY LAYER FAILS OPEN.** `?? engines.wordweb`, `?? 'wordweb'`, and
`: ''` are three defaults in series, and none of them raises. The bank could be signed, published and
LIVE, and a child would get a blank-stemmed synonym tile with no passage — with nothing in any log
saying so. It is R60's family in the serving path: **correct code, true report, and nothing stating
that nothing happened.** Every guard built this month watches content going IN; none watches whether
what came in can come OUT.

`en-determiner-omitted` at 20 words stands unreworded — her wording, her call.

## R119 — R57 a seventh time, and a check that compares before it trusts
*2026-08-16, one line each.*

- **`stem._previousQuotes` refused delivery 83 at the door**, on 4 items — the shadow of the quoted
  spans the reworded items replaced. Declared NOT_CARRIED/PROPOSED like every other `_previous`.
  Seventh outing; the mechanism has now caught a field on every delivery that carried a new one.
- **The naming collision, and no more than this:** two documents, one name. Cowork inferred
  re-serialisation from a hash difference that was two different files. Reasonable inference,
  avoidable cause — I gave the door's output the phrase her own file used.
- **`pnpm check:library-agreement`** compares an emission from Cowork against this store and NEVER
  writes, because the DB authors library text. It reports fields THEY DID NOT STATE separately from
  fields that agree — 8 of 27 comparisons on delivery 83 were `status`, absent from their emission,
  and counting those as agreement is the unstated-denominator fault. Ready for their re-emission.

## R120 — THE CLASS: every guard watches content going IN; none watches whether it can come OUT
*David, 2026-08-16, in my words, recorded as its own class.*

**Two months of instruments on one side of a boundary nobody checked the far side of.** Every gate
built this month — the import door, the key registry, the reviewed guard, the derived-write guard,
the return leg, the invariants, the migration replay, the verdict refusals — screens content
ARRIVING. Not one asks whether what arrived can be delivered. `pnpm check:serving-path` is the first
instrument pointed the other way, and on its first run **0 of 371 English items could reach a child**.

**THE FAR SIDE FAILS OPEN AT EVERY LAYER, WHICH IS WHY NOTHING REPORTED IT.** Three defaults in
series, each individually reasonable:

| | default | consequence |
|---|---|---|
| `engines[family] ?? engines.wordweb` | render another family | a comprehension item becomes a synonym tile |
| `FAMILY_BY_TYPE[type] ?? 'wordweb'` | route to another family | ditto, one layer earlier |
| `stem.prompt … : ''` | render nothing | the question is blank |

**A DEFAULT THAT SILENTLY SUBSTITUTES A DIFFERENT QUESTION TYPE IS WORSE THAN A CRASH** (David's
ruling): the crash is visible in the first minute; the substitution is visible only to the child
sitting in front of it. All three are now throws.

**COWORK'S FRAMING IS THE SHARPER ONE AND IT GENERALISES:** *each side validates its own schema
faithfully and neither validates the JOIN.* `stem.prompt` is unanimous — 344 of 344 there, 371 of
371 here, zero carrying `prompt` — and so were `r4Note` and `stemRedraft` at the import door. **Every
one of those was found by somebody reading the other side's store, never by a gate.** Two correct
validators, one unvalidated seam.

**AND THE CHECK REPEATED R61 ON ITS FIRST RUN.** It called 59 legitimate rows failures — SPaG spot
items that carry their text in the stem, cloze items citing a gap, and whole-passage technique items.
Now declared, with the reason printed every run, and with the discriminator that matters: **`lineRefs:
[]` is a POSITIVE DECLARATION that the whole text is the window and is NOT `null`, which is a field
nobody set.** That distinction is why absence must never coerce to empty at the import door.

**AFTER THE THREE WIRING FIXES: 337 of 371.** All 337 comprehension items route, render a non-empty
stem, resolve their passage and resolve their citations. The remaining **34 are SPaG** — 16 cloze, 9
punctuation-spot, 9 spelling-spot — and they are a DIFFERENT DISTRICT with no family and no engine.
Named, not invented: adding a family without an engine moves the failure rather than fixing it, and
what the SPaG surface should be is a question nobody has asked yet.

**Routing is not delivery.** `engines.comprehension` resolves and the passage still has no surface;
the engine says so on screen, unmissably, rather than rendering a question a child cannot answer. A
component that quietly omitted the passage would have been the fourth default in the series.

## R121 — The pre-cap backups are two removes from her wording, and neither remove is hers
*Cowork's finding, relayed 2026-08-16, before the library file crossed.*

Its `_hintBeforeWordCap` backups look like the repair for the seven shortened hints and are not.
**`en-narrator-voice-as-fact`'s pre-cap text is 26 words and is THE DRAFT SHE REJECTED** — the one
whose third sentence coached the key. Its current 13-word text is a shortening OF that draft. So the
entry is two removes from her wording and **neither remove is hers**, and restoring the backup would
reinstate the coaching she struck, while looking exactly like an undo.

**A BACKUP IS NOT A PRIOR APPROVED STATE. It is only the state before one operation**, and which
operation is the whole question.

The shortening was ONE AD-HOC HAND RUN in delivery 71, not a pipeline: 40 entries carry the pre-cap
text and **no script writes it**. So it will not recur on its own — and nothing stops the next sweep
doing it again, which is the same shape as the sixteen one-shot ruling-appliers in R63: a hazard that
is dormant rather than closed.

## R122 — The passage surface, and the ruling whose premise did not hold
*David's three rulings, 2026-08-16. Built as scoped.*

**RULING 3 WAS AIMED AT A REAL HAZARD AND ITS PREMISE WAS WRONG, MEASURED BEFORE IMPLEMENTING.**
`n: null` was ruled a passage fault — an extract never fully numbered, leaving citations measured
against a line index with holes. **All 507 `n: null` lines across all 29 passages carry `text: ""`.
They are blank PARAGRAPH SEPARATORS, and every passage numbers contiguously 1..N with no gaps.** A
real paper does not number white space either. Failing 27 of 29 passages for that would have been
R61 a third time in one file, in the check written to apply R61.

So the assertion built is the one the ruling was aiming at, pointed at what would actually produce a
holey index: **numbers must run contiguously from 1, and an unnumbered line must be BLANK.** An
unnumbered line carrying TEXT is the real fault — content no citation can reach. 29 of 29 sound.

**THE SURFACE, TO RULINGS 1 AND 2.** One scrolling column: passage in its own scroll region, item
beneath, never side by side — at 375px there is no side, and a layout that only works on a desk is
not the exam room. The passage NEVER COLLAPSES, because collapsing it makes a comprehension question
a memory question, a different skill from the one being tested. The cited window is highlighted from
the start AND carries a "go to lines" control: the highlight says where, the control takes her there.
Highlighted, never ISOLATED — a retrieval item's distractors are routinely true elsewhere in the
text, and hiding the rest would turn a wrong-scope distractor into an unanswerable one.

**AND IT REFUSES RATHER THAN DEGRADES.** An item citing a passage that will not load renders an
unmissable notice and does not present itself as answerable. This district's whole finding was three
silent fallbacks letting an undeliverable item look delivered; a blank space where the passage
belongs would have been the fourth.

**A REGRESSION I INTRODUCED AND CAUGHT.** Removing the `?? 'wordweb'` default from `familyForType`
broke every MATHS item: the orchestrator called core first and overrode for `mq-*` afterwards, so
the default had been silently carrying an entire district. Maths now resolves through its own
registry first and throws if that fails. **The default was load-bearing in a place nobody had
looked, which is what a default that never raises does.**

**WHAT IS NOT VERIFIED:** the surface in a browser. `/crew` requires a child session and the debug
route sits under it. Typecheck, the pure line-naming logic (5 tests) and the serving-path check are
green; the rendering is not visually confirmed. Also found, PRE-EXISTING and not mine: the NVR debug
harness has been failing to build since `aee00d5` — a client page imports the `@cluecrew/core`
barrel, which reaches `draft-self-assessment.ts` and `node:crypto`. **A server-only module pulled
into a client bundle through a barrel: it typechecks and fails at build**, which is the same seam
Cowork named — each side correct, the join unvalidated.

## R123 — Two entries misfiled by a substring, in opposite directions, on the same sheet
*David, 2026-08-16. Classified by carrier; the id string is not a fact about an entry.*

`export:comprehension-library` classified by `id.includes(...)` against a SPaG word list. **It was
wrong in BOTH directions on the same approval sheet:**

| entry | what the id did | carried by | truth |
|---|---|---|---|
| `en-relative-pronoun-choice` | DROPPED — the string contains "relative-pronoun" | `en-spag-cloze` ×3 | SPaG. Correctly excluded, for the wrong reason. |
| `en-determiner-omitted` | KEPT — no string matched | `en-spag-cloze` ×1 | **SPaG. Wrongly included.** |

The second is the one that cost something: it crossed to Cowork as a comprehension entry **carrying
the hint she rewrote in her own words**, and the first never crossed at all despite her approving it.
One entry lost, one entry misdelivered, from the same line of code.

**A SUBSTRING IS NOT A FACT ABOUT AN ENTRY. What an entry IS, is what carries it.** Classification is
now by carrier — comprehension if any `en-comp-*` item carries it, with the id list surviving only as
a fallback for entries nothing carries yet. 38 entries, down from 39.

**AND THE SHEET'S SCOPE WAS THE SAME FAULT ONE LAYER UP.** The approval batch selects "PROPOSED
English entries carrying items" and does not distinguish districts, which is how two SPaG entries
reached a comprehension reviewer. Checked by carrier across all nine: exactly those two.

**HER APPROVAL TRAVELS WITH THE ENTRY, NOT THE FILE** (David's ruling). She read the description and
the hint and ruled on both; her `whom` note is about the entry rather than its district. **Approval
is of the entry, not of the document it was rendered in.**

Every exclusion is now printed by id with its carriers on every run. A filter that drops rows without
saying so is R57 in a filter — and it fails OUTWARD, removing without reporting.

## R124 — The control that highlighted correctly and went nowhere
*2026-08-16. Verified in a browser, twice, because the first verification was of the wrong half.*

The passage surface passed every static check while its one interactive control did nothing.
`behavior: 'smooth'` **moves nothing at all** in the verification engine — `scrollTop` stayed at 0
across an 800ms wait — while `behavior: 'auto'` scrolled correctly to the same target. Not a
reduced-motion setting: `prefers-reduced-motion` was false.

**I diagnosed it wrong first.** I decided the ref was unattached because I was mutating a variable
during render to choose which line got it — real, worth fixing, and NOT the cause. The fix landed and
the control still did not move. **A plausible cause that is genuinely a defect is the most expensive
kind of wrong answer, because fixing it feels like progress.** The measurement that settled it was
two lines: call `scrollTo` with each behaviour and read `scrollTop`.

Now: motion honoured when the browser allows it, instant when reduced motion is set, **and the scroll
CONFIRMED 400ms later and forced if nothing moved.** A control that silently does nothing is this
district's whole failure mode, arriving one last time in the last thing built.

**Verified at 375px:** window 29-33 highlighted on load, tap lands line 29 at the top of the region,
all 67 lines still rendered, lines above still reachable, whole-passage items get no control, a
missing passage refuses. The parts that were never true before today.

## R125 — The comparison had only ever been run on the field a child reads
*David, 2026-08-16. Delivery 88, payload verified 64/64 over all 28 shared entries.*

**12 differ over 58 comparisons.** 11 childHints, all shorter on the drafting side, all the same cap
sweep. And **one description** — which is the finding, because **no comparison between these two
stores had ever looked at a description.**

`en-vocab-dominant-sense` carries a third sentence there that this store has never held:

> *Scoped to the ERROR, not to vocabulary items: it occurs wherever a word's sense is load-bearing,
> including on technique stems.*

Ours ends at "…displaced it." **And that missing sentence is the entire justification for a placement
in the SERVING store**: `ENG-002-pp-13` is an `en-comp-technique` item whose option D carries
`en-vocab-dominant-sense`. Under our description that placement is unexplained; under theirs it is
correct. **The hints were hiding it** — every previous comparison ran on `childHint`, the field a
child reads, and a description is what a DRAFTER reads to decide whether a tag fits.

**Two stores applying different rules while reporting the same tag.**

**CORRECTED, 2026-08-16 — I READ TWO FAULTS ON ONE ITEM AS ONE FAULT.** This entry first said the
missing sentence was "the gate's outstanding delivery-52 problem with its cause finally named". It is
not. On `ENG-002-pp-13` (`lineRefs [41,42,43]`):
- **option D** carries `en-vocab-dominant-sense` — *decided* read as "made a decision" rather than
  "settled upon" — a sense error on a technique stem, which is exactly what the scoping sentence
  describes. **It passes.**
- **option E** carries `en-wrong-scope-retrieval`, and its own note puts the defeater on **line 41,
  INSIDE the item's cited window**. A wrong-scope tag requires the true detail to sit OUTSIDE the
  window. **That is the delivery-52 gate problem, and it has nothing to do with the description.**

Two faults on one item, one of them not a fault, read as a single thing because they were found in
the same lookup. David caught it via Cowork's trace.

**AND THE SENTENCE IS COWORK'S AND UNRULED.** Traced by Cowork: written in its own proposal document,
**reasoning FROM her ruling rather than reporting one**, never in the batch that went to her, and
carrying `approvedBy: Anne` the whole way. So it is a PROPOSAL and goes to her as one. **It is not
being added to our description before she rules** — adding a scoping sentence to a live entry on the
strength of another agent's inference is the fault this whole run has been closing, in its purest
form: an unruled claim wearing an approval it never had.

**TWO FAULTS IN MY OWN CHECK, BOTH THE SAME SHAPE IT WAS BUILT TO CATCH.**
1. It read only `libraryEntries`; this delivery used `entries`, so `requirePopulation` aborted on a
   population that was fully present. **The refusal was right and the reason was wrong** — an
   unrecognised shape is not an empty one, and it now tries every known key and NAMES the one that
   answered.
2. It counted `status: null` as 28 disagreements. They sent hints and descriptions only; **null is
   NOT-STATED, not a value.** The unstated-denominator fault, arriving inside the check written to
   avoid it, as `null` rather than as `undefined`.

**THE ELEVEN CROSSED** (`d8ffb208d588dee5`), including `en-comparison-vehicle-misread` — approved by
the reviewer on **8 August** and never delivered in the eight days since, because the return leg had
no path until 16 August. Ten are ACTIVE and **one is REJECTED**, which is why status travels with
them: an entry the drafting side does not hold is not the same as an entry it may use.

## R125b — R88 repeated by hand, on the day it was recorded
*2026-08-16.*

The eleven-entry emission to Cowork carried **10 of 21 columns**, hand-listed. It dropped
`approvalNote` on six entries, including the vehicle/subject boundary discriminator on
`en-comparison-vehicle-misread` that four cold reads had rebuilt from nothing — **which is R88's
finding exactly, reproduced by hand in a fresh script the same day R88's lesson was applied
elsewhere.**

The two losses worth marking beside it are a PAIR that only functions as one:
`en-technique-label-not-effect` (*"if a device is named, tag THIS"*) and `en-technique-generic-effect`
(*"use THIS only when no device is named"*) — each note names the other as its alternative, and
**neither side held either half.** A discriminator split across two rows is lost entirely when a
projection drops the column, not half-lost.

**A HAND-LISTED PROJECTION IS A PROJECTION.** Re-emitted with every column and no `select`. The
sending side does not get to decide which columns matter, and the moment it writes a field list it
has decided.

Also: `en-parallel-read-as-sequence`, approved in the same 8 August sitting, **is in neither store**.
Not held here under any status. A lost approval rather than an undelivered one — it goes back to her
to restate, and nothing on either side may reconstruct it.

## R126 — Two faults inside the check written to catch them
*2026-08-16, recorded together because they are one lesson twice.*

`check:library-agreement` exists to stop an unstated field being read as an agreeing one. It failed
that test twice in one run, on the same delivery:

1. **AN UNRECOGNISED SHAPE IS NOT AN EMPTY ONE.** It read only `libraryEntries`; delivery 88 used
   `entries`. `requirePopulation` aborted — correctly, loudly, and **for the wrong reason**, telling
   me the population was empty when all 28 rows were present. A refusal that is right about the
   verdict and wrong about the cause sends the next person to the wrong side. It now tries every
   known key and NAMES the one that answered, so a rename surfaces as an unrecognised shape.
2. **NULL IS NOT-STATED, NOT A VALUE.** It counted `status: null` as 28 disagreements. They had sent
   hints and descriptions only. The check already handled `undefined`; absence arrived as `null` and
   walked straight past. **The unstated-denominator fault, inside the check built to avoid it,
   wearing a different type.**

Both are the same shape as R61 and R120: an instrument that is correct about the thing it was
pointed at and wrong about what it was looking at. **The distance between "nothing is there" and "I
could not see it" is the whole of it**, and it has now appeared in a population check, a route check,
and a field comparison.

## R127 — The return-leg check verifies columns, and could not have seen the emission that lost them
*David, 2026-08-16. "Does it verify COLUMNS, or only that a class crossed?"*

**IT VERIFIES COLUMNS — and it would NOT have caught this.** Both halves matter and they point at
different gaps.

**It does check fields.** `carriedBy(script, fields)` requires the export named for a class to
mention every reviewer-authored column — `approvalNote`, `approvalMethod`, `approvedBy`,
`rejectionNote`, `teachback` for the misconception class — and reports CARRIED / STALE / NOT CARRIED
per class. `export-misconception-library.ts` genuinely selects all five. So the DECLARED path is
sound and the class is honestly CARRIED.

**But it checks THE REGISTERED SCRIPT, not the emission that shipped.** My eleven-entry file was a
one-off script in `/tmp`, hand-listing ten columns. **It is not a registered export, so the check had
nothing to look at** — the class stayed CARRIED on the strength of a script that was not the one used.
Green, correct, and about a different artefact than the one that crossed. **The same shape as R63's
sixteen one-shot ruling-appliers: the guarded path is guarded and the ad-hoc path beside it is not,
and the ad-hoc path is the one that gets used under time pressure.**

**A second, smaller weakness in the same function:** `text.includes(f)` is a substring test over the
script's SOURCE. A file mentioning `approvalNote` only in a COMMENT passes. `export-misconception-
library.ts` happens to both discuss and select it — so the check is currently right by luck about a
file it is right about for real reasons. R123's lesson (a substring is not a fact) inside the
return-leg check.

**What this does not reach, and should be said rather than implied:** nothing verifies what an
arriving file CONTAINS. Both halves here are about the sender's code. The receiving side caught this
one — Cowork noticed the discriminator was missing — which is the same way every join fault in this
project has been found: by somebody reading the other side's store, never by a gate.

## R128 — WIW-14 B: a note that argued against its own label for months
*Cowork's sweep, 2026-08-16. The payoff, and it is one.*

Her boundary sentence — *attribute-transfer moves a quality BETWEEN CHARACTERS; this moves it from a
comparison's VEHICLE to its SUBJECT* — crossed on 16 August. Cowork swept all 44
`en-attribute-transfer` carriers against it and found **one**: `ENG-001-WIW-14` option B, whose own
`misconceptionExecution` describes a vehicle-to-subject move while its tag says between-characters.

**The note has been arguing against its label since the item was drafted, and nothing on either side
could see it.** Not the gate, which checks that a tag EXISTS and is ACTIVE, not what it MEANS. Not the
cold reads, which read items rather than comparing a note to its tag. The discriminator that makes the
disagreement legible existed only in the reviewer's approval note, in a column that had never
crossed — so the fault was undetectable by construction rather than by oversight.

**EIGHT DAYS between her writing that discriminator (8 August) and it reaching the store that drafts
against it (16 August)**, and the only reason it took eight rather than indefinitely is that someone
asked why the return leg had never carried anything.

**IT IS NOT BEING RETAGGED.** ENG-001 is signed, the item is in her packet, and this is a READING
rather than a repair — an execution note and a tag disagreeing is a judgement about which is right,
which is hers. Recording it as a finding and leaving the row alone is the whole of the correct
response.

**What this measures: the value of a single field crossing.** One sentence, one column, one direction
of travel that had never carried anything — and the first thing it did on arrival was find a
mislabelled option in a signed cluster that four independent cold reads had passed over.

## R129 — An emission is measured, not just the code that could have made it
*David's ruling, 2026-08-16. One rule, not the general case.*

`check:return-leg` verified that the REGISTERED EXPORT for a class names every reviewer-authored
column. It could not see an emission that was not that export — which is how a hand-listed one-off
carrying 10 of 21 columns crossed while the class stayed CARRIED. **Not "it would have passed": it
never saw it.**

Now: an emission DECLARES `returnLegClass` and `columnsCarried` in its own `transferStamp`, and a
class whose most recent emission carries fewer columns than its registered export names is
**SHORT-EMITTED** — a fourth state beside CARRIED, STALE and NOT CARRIED. **An emission that declares
no class is reported as UNMEASURABLE, not as clean.** Verified by declaring the partial's true ten
columns and watching the class flip to SHORT-EMITTED naming all four missing fields.

Two things the build taught:
- **DIRECTION FIRST.** The delivery folder carries traffic BOTH WAYS and Cowork's inbound files also
  have a `transferStamp`. The first version counted eight of THEIR deliveries as OUR undeclared
  emissions — reporting their file shape as our fault. Only what leaves here is ours to measure.
- **A SUPERSEDED ARTEFACT IN THE DELIVERY FOLDER IS ITSELF THE HAZARD.** The check judged the class
  on the partial because I had edited it most recently. The right answer was not smarter tie-breaking
  but removing it: a superseded file sitting where the recipient looks is one they can pick up, and
  the export machinery already prunes stale artefacts for exactly this reason.

**And the substring test is fixed and its remaining limit is PRINTED.** `carriedBy` now strips
comments before matching, so a script that only DISCUSSES `approvalNote` no longer counts as carrying
it. It is still text and not a parse — a field name in a string literal would pass — and the output
says so on every run rather than leaving a reader to assume more rigour than there is.

## R130 — Tranched shipping, the sentence landing, and the note-vs-tag check outside English
*Annie's replacement for the bracket, 2026-08-16: 27 whole-text T4s plus 60 stratified items, shipped per cluster.*

**1. LIVE IS PER-ITEM. There is no cluster object and nothing to build.** The bank already holds 298
LIVE beside 729 DRAFT, so shipping ENG-028 and ENG-001 and nothing else is publishing those 34 rows
and leaving the rest. Tranched shipping needs no mechanism; it needs a WHERE clause.

The thing that does not yet exist is a per-cluster GATE — one command that says "this cluster is
clean and here is what it would publish". Every check today reports district-wide, which is the right
default and the wrong shape for shipping one cluster at a time. Small, and not yet built.

**2. THE SCOPING SENTENCE IS IN**, ruled by her as her own 8 August ruling applied to this entry:

> *Scoped to the ERROR, not to vocabulary items: it occurs wherever a word's sense is load-bearing,
> including on technique stems.*

126 characters, read from Cowork's emission BY STRUCTURE and never retyped, and applied only after
asserting their description is ours plus a clean suffix — a difference that was not a pure addition
would have meant something else had changed and would have stopped the run.

**3. `ENG-001-WIW-14` OPTION B RETAGGED** `en-attribute-transfer` → `en-comparison-vehicle-misread`,
with an AttributionEvent naming her as actor, David as recorder, and the reason: its own execution
note described a vehicle-to-subject move while the tag said between-characters. A ruling, attributed
— not a repair, and not silent.

**4. HER FINDING COSTS ALMOST NOTHING TO RUN AND CANNOT RUN AT ALL, AND BOTH ARE TRUE.**

A note contradicting its own tag is mechanically detectable — she is right, and Cowork's English sweep
proves it. The cost outside English is not the check. It is that **there are no notes to check.**

| district | tagged options | with an execution note |
|---|---|---|
| ENGLISH | 1166 | **1047 (90%)** |
| VR | 1612 | **0** |
| NVR | 0 tagged | — |
| MATHS | 0 tagged | — |

`misconceptionExecution` is an English-district field. **VR has 1,612 tagged options and not one
note**; NVR and Maths have no tagged options at all, so there is nothing on either side to compare.
So the honest cost is: **£0 of engineering and 1,612 authored notes** — a content programme, not a
check. And it is worth saying which way that cuts: VR is the district with 298 LIVE items, so the
undetectable-by-construction fault she found in English is undetectable across the only district
currently in front of children, and would stay so until every one of those options carries a
statement of what it executes.

**THE NUMBER THAT MATTERS IS HERS: two category-2 faults in 34 items — 10% — on the only fault that
cannot be recovered after publication**, found by neither a scan nor a cold read. Every instrument in
this repo screens structure, provenance and delivery. **None of them can see a second defensible
answer**, and the measured rate at which a qualified reader finds one is one item in seventeen.

## R131 — A restated approval outranks a recovered one
*Annie, 2026-08-16. `annie-parallel-read-as-sequence.md`, sha256 `6bd1a2b0b45d522f`.*

Approved 8 August. **No row existed in EITHER store.** She has rewritten it fresh rather than
allowing either side to reconstruct it, and attached the ruling that matters more than the entry:

> *If a copy of the original turns up later and differs, this version is the one that was approved,
> because this is the one that exists.*

**A RESTATED APPROVAL OUTRANKS A RECOVERED ONE.** That settles a CLASS, not this instance: it says
what to do with every lost ruling this project finds later, and it removes the tempting move —
treating a recovered artefact as more authentic than a living statement from the person who made the
decision. Recorded on the entry so it travels with it.

Created ACTIVE, `proposedBy`/`approvedBy` `reviewer:rev-0001`, `recordedBy` David, `approvalMethod`
naming the document and its hash. `description` (413 ch), `childHint` (106 ch) and `boundaries`
(923 ch) extracted from her file **by document structure and verified byte-identical after the
write** — never retyped.

**A COLUMN HAD TO BE ADDED TO HOLD HER BOUNDARY CLAUSES.** `boundaries` did not exist here. Cowork's
library shape has carried it for months, so every boundary clause she has ever written either sat
squeezed inside `approvalNote` or did not cross at all. **R88's class is literally named
"Misconception approvals — BOUNDARY NOTES, method, approver" and the boundary half had nowhere to
land** — the check reported the class CARRIED because the export named the fields the schema had,
and the schema was the thing missing. A check can only verify the columns that exist.

**AND THE ITEM THE ENTRY WAS PROPOSED ON IS NOT IN THIS STORE.** `ENG-004-AGG-08` is absent: ENG-004
holds AGG-01 to AGG-12 with **08 missing**. So the tag that has resolved to nothing since 13 August
resolved to nothing here for a second, independent reason — there was no row to carry it. The entry
now exists and **0 options reference it**. The item is the gap, not the tag, and that is in the
emission rather than left for Cowork to discover.

## R132 — Where AGG-08 went, why VR has no notes, and the first two clusters LIVE
*2026-08-16.*

**1. `ENG-004-AGG-08` WAS REFUSED AT THE DOOR — TWICE, AND THE SECOND REASON IS THE ONE TO SEE.**
Both refusals are in the receipts, so nothing was dropped or unemitted:
- `misconception library` — *tagged `en-parallel-read-as-sequence`, which the library does not hold.*
  **Now resolved: the entry exists (R131).**
- `checkItemChildFacing` — *`[long-words]` 2 long words (max 1): 'ordinary, 'extraordinary.*

The second still stands, and it is worth stating plainly: **the gate refused the item for containing
the two words its own diagnosis is built on.** Her restatement turns on lines 35-40 giving what an
ORDINARY observer would see and 41-46 what an EXTRAORDINARY one might — same girl, same moment, two
watchers. The mechanism IS the pair. A long-word ceiling applied to a stem cannot know that, and
rewording it would remove the item. Hers to rule: a declared exception, or the item goes.

**2. THE VR NOTE GAP IS A DECISION, AND ONE WHOSE CONSEQUENCE WAS NEVER FACED.**
**76% of VR's tagged options are GENERATED** (`gen-` ids, 1231 of 1612) — built by
`buildDerivedVrDistractors` from a named misconception. There was never a per-option note because
there was never a per-option authoring ACT: the generator was told to produce a step-direction error
and did, so the tag IS the derivation. English is the opposite — **0 of 1166 generated**, every
distractor authored, every one carrying a statement of what it executes.

So her check is not UNRUN on VR; in that form it is **INAPPLICABLE**. A note cannot contradict its tag
where no note was written. **But the fault it detects has a VR twin that nothing screens: a generator
producing an option that does not execute the tag it was asked for.** That is re-derive-and-compare,
not read-and-compare — different check, same question, and the authored VR options have neither.
(FIGURE CORRECTED — R144: 314 uncovered, not 381; 67 already pass the value gate.)
VR holds all the LIVE items, so this is the district in front of children.

**3. THE PER-CLUSTER GATE, AND THE FIRST TWO CLUSTERS ARE LIVE.**
`pnpm check:cluster <id> [--publish]` asks both halves at once — can every item RECEIVE A VERDICT
(the door's own `publishBlockers`, `inactiveMisconceptions`, `checkItemChildFacing`) and can every
item BE DELIVERED (routes, stem, passage, citations). **An item that cannot be delivered is not
shippable however clean its content is** — R120's finding made into a precondition rather than a
report.

**A cluster ships whole or not at all**, because a child meets it whole. Verified in both directions
before publishing anything: ENG-003 refuses on 34 items (`no-family:en-spag-*`), and a cluster name
matching nothing REFUSES as a typo rather than passing as an empty clean set.

**ENG-028 (12) and ENG-001 (22) are LIVE** — 34 items, each with an AttributionEvent naming the
tranched-shipping ruling, serving order preserved. **The first English items ever to reach a child.**
337 remain DRAFT, and 337 of 371 could be delivered, which is now two different numbers about two
different things and both are true.

## R133 — The VR twin, scoped: no note under any name, and no seed to re-derive from
*David, 2026-08-16. Scoping, not building. VR is signed and live; this is not urgent and it is not nothing.*

**THE 381 AUTHORED VR OPTIONS CARRY NOTHING NOTE-SHAPED UNDER ANY NAME. Zero, on every field:**
`misconceptionExecution`, `senseTarget`, `attractorQuote`, `defeaterQuote`, `a36Note`, `windowClass`,
`tagStatus` — 0 of 381 each. Item-level free text on their 145 items: `r4Note` 0, `tierRationale` 0.
**99 of those 145 items are LIVE.**

So her comparison has nothing to reach on VR at all — not a different field name, not a partial
convention, nothing. Every VR distractor's reason for existing is either in a generator function or
nowhere.

**CORRECTED 2026-08-16 — R142. EVERYTHING IN THE PARAGRAPH BELOW IS NVR'S MODEL APPLIED TO VR,
WHERE IT DOES NOT HOLD.** VR generators take NO SEED: `GENERATORS[typeId]()` enumerates, `item.n` is
the ordinal, the id is `gen-${typeId}-${n}`, and the complete derivation input `(typeId, n)` is
therefore IN THE PRIMARY KEY. There is no seed, no template version and no parameter bag to record.
All 514 stored `gen-vr` items reproduce identically from today's generators. **A fault class carried
across a district boundary without checking that the boundary held** — `seedFor(kind, ordinal)` is
NVR's mechanism and I wrote it about VR. The wrong text is left standing below because a corrected
register that hides what it corrected teaches nothing.

**AND THE RE-DERIVE TWIN COSTS MORE THAN IT LOOKS, BECAUSE THE INPUT IS NOT RECORDED.** A generated
item stores its OUTPUT — `gen-vr-03-related-words-02` holds `pairA`, `stemWord`, `prompt` — and no
column holds the SEED, the template version, or the parameters that produced it. `seedFor(kind,
ordinal)` is deterministic and the ordinal is recoverable from the id, so the derivation is
reconstructible **by convention rather than by record**: re-running depends on the id's shape and the
generator's current code both still meaning what they meant at generation. R62's technique (git as
the prior state) applies, and it is the same weakness R62 named — the prior state is recoverable
because nothing has broken yet, not because it was written down.

**One line, as asked: the re-derive check is cheap to write and unsound until generated items record
their seed and template version** — otherwise it compares today's generator against today's ids and
agrees with itself. Recording those is the prerequisite, and it is a migration plus a backfill of
1,231 rows, not a check.

**The honest summary of the district in front of children:** 1,612 tagged VR options; 1,231 generated
with no recorded input to re-derive from; 381 authored, of which 314 have no statement of what they
execute and 67 already pass the value gate (R144); her
check inapplicable to the first group and starved on the second. **Neither half is screened for the
one fault that cannot be recovered after publication.**

`ENG-004-AGG-08` goes to her — the long-word refusal on *ordinary* / *extraordinary*, which are the
pair her own restatement turns on. Declared exception or the item goes; nobody here rewords it.

## R134 — The executor audit run against VR: thirteen executors, one disagreement, twenty-five live options
*Annie's ruling, 2026-08-16: for generated distractors the tag and the value come from the same source and cannot disagree — but does the executor implement what the description NAMES?*

**IT COULD BE RUN AND IT HAD NOT BEEN.** VR carries 13 executors in `VR_EXECUTORS`, every one with an
ACTIVE library row. Twelve implement what their description says. **One does not:**

> `vr07-value-slip` — *"Substituted one letter with the NEIGHBOURING value."*

The executor swaps the target letter's value for **ANY other letter's value in the expression**, not a
neighbouring one. On `P=2, Q=5, R=9 / P+Q+R` it produces six values where a neighbouring reading
produces a handful. **The executor implements a SUPERSET of what the description names**, so an option
can be tagged `value-slip`, carry a value the executor genuinely produces, and still not be the error
the entry describes.

**25 options carry it and ALL 25 ARE ON LIVE ITEMS.** VR is the district that was live before today,
so this is a wrong description against a live tag, in front of children now.

**IT IS NOT A WRONG OPTION.** The gate `check:vr-distractors` verifies the value against the executor,
so every one of the 25 carries a value that error really produces. What is wrong is the ENTRY: the
description is narrower than the code, and the child-facing `childHint` — *"Write each letter's number
above it before you add"* — happens to be correct for both readings, which is why nothing surfaced it.
**A narrow description over a broad executor is invisible to every value-based check by construction.**

Whether the description widens or the executor narrows is a reviewer's decision, not ours: it changes
what the tag MEANS and therefore what the 25 items are evidence of.

**And her framing is the transferable half:** the note-vs-tag check does not apply to generated
distractors because tag and value share a source — but **description-vs-executor** is the same
question asked of the source itself, and it is the only one of the two that can be asked of a
generated district at all.

## R135 — The 400-odd authored VR options, counted exactly and logged
*Annie, 2026-08-16: recorded as a gap rather than folded into the 1,612. Do not build.*

**EXACTLY 381 authored VR options carry a tag** (`itemId` not `gen-`), across **145 distinct items,
99 of them LIVE**. They carry **nothing note-shaped on any field**: `misconceptionExecution`,
`senseTarget`, `attractorQuote`, `defeaterQuote`, `a36Note`, `windowClass`, `tagStatus` — 0 of 381
each; item-level `r4Note` and `tierRationale` — 0 of 145 each.

**Same exposure as English, no instrument.** English's 1,047 notes are what made her comparison
possible and what found `WIW-14 B`; these 381 are authored the same way and have nothing to compare.
They are also not reachable by R134's audit, which screens the 13 executors — an authored option has
no executor. **CORRECTED 2026-08-16 — R144: THE UNCOVERED SET IS 314, NOT 381, AND 188 OF THOSE ARE
LIVE, NOT "99 items' worth".** `vr-09-letter-series` (39) and `vr-11-number-series` (28) carry an
EXECUTABLE tag AND `stem.operands`, so `check:vr-distractors` already derives all 67 — they are inside
its 127 derivation-verified. Of the remaining 314, only **188 options on 74 items** are LIVE
(`vr-04-closest-meaning` 120 on 40, `vr-06-missing-word` 68 on 34); `vr-02` and `vr-08` are entirely
DRAFT. I quoted 381 and 145 all evening. The wrong figure stays below.

**So the 381 sit outside both checks**: too authored for the executor audit, too
note-less for the note comparison.

Counted and logged, not built.

## R136 — The multi-quote gate: broken since it was written, findable only by an item needing two
*2026-08-16, found while confirming her AGG-08 ruling.*

**EVERY STEM DECLARING TWO OR MORE QUOTATIONS FAILED, ALWAYS.** `textsFrom` walks the stem object, so
`quotes[0].text` is screened as its own string — and the gate passed it ALL declared spans, asking
whether quote 1's span appeared inside quote 0's text. It cannot. Each quote reported the others as
broken, with the message *"declares a quoted span that is not in the text"*, **which reads as bad
authoring rather than as the gate comparing a span against the wrong string.**

**WHY IT STAYED HIDDEN, WHICH IS THE DURABLE HALF: one quotation always worked.** The mechanism looked
sound under every test anyone would naturally write, and was untestable by the only kind of item that
exercises it. It was found by USING it — trying to apply her ruling to an item that needs exactly two
spans — not by checking it. A defect whose trigger is "two of the thing" is invisible to a suite built
on one of the thing.

Fixed: a quote's own field carries only itself. Her ruling then holds exactly as she stated it —
declaring the passage's own words clears AGG-08 with **no new rule and no declared exception**.

**And her reason is the one to keep:** *a declared exception is something someone has to remember; a
quotation declaration is a fact about the item.* The first decays, the second is checkable.

## R137 — Audits that exist and have never been pointed at a district they could run on
*David, 2026-08-16. One list, no builds.*

Derived by reading each check's actual population filter, not its prose.

**1. `audit:signed-depth` — 13 NVR signatures, never screened.** It filters
`recordType: { contains: 'template-family' }`, which catches `maths-template-family` (19) and
`spag-template-family` (14). **`nvr-signature` (13) does not contain that string and has never been
seen by it** — and NVR is precisely the district whose signatures carry a `sampleSheetHash`, so it is
the one where "does this signature still describe the family" is most answerable. Annie's second named
artefact, blind to a third of the signatures it exists for.

**2. Description-vs-executor — ran on Maths' 18, never on VR's 13 until today.** R134 is that run: 13
executors, one disagreement, 25 live options. NVR generators have the same shape and have never been
asked the question either.

**3. `verify:solutions` and `check:maths-distractors` — still screening nothing, and now provably.**
Declared under R61 as pointed at a MATHS item bank no code path creates. Confirmed again here: LIVE
items are **ENGLISH (34) and VR (298) only** — there are no MATHS items at all, in any status. The
declaration holds and the population is still zero.

**Not on the list, checked and cleared:** `check:option-positions` reads `status: 'LIVE'` with no
district filter, so it genuinely screens all 332 live items across both districts. Its prose mentions
maths; its query does not. **A district named in a comment is not a district in a WHERE clause** —
which is why this list was built from filters rather than from what each file talks about.

## R138 — The signed-depth audit reaches 14 of 46 signatures; NVR's 13 hold
*David, 2026-08-16. Report, do not fix.*

**IT IS BLIND TO MORE THAN THE 13.** `audit:signed-depth` fetches
`recordType: { contains: 'template-family' }` — 19 `maths-template-family` + 14 `spag-template-family`
— and then **iterates `SPAG_FAMILIES` only**. So of 46 SIGNED events in the store:

| recordType | count | screened |
|---|---|---|
| `spag-template-family` | 14 | yes (13 families reported) |
| `maths-template-family` | 19 | **fetched and never iterated** |
| `nvr-signature` | 13 | **never fetched** |
| `item` | 2 | out of scope by design |

**Annie's second named artefact reaches 14 of 46.** The filter is only half the fault: widening it to
match `nvr-signature` would still change nothing, because the loop is over a hard-coded SPaG family
list. **A check can be scoped twice — once by its query and once by its loop — and fixing the query
alone would have produced a wider fetch and the same output**, which is the more dangerous repair.

**RUN AGAINST NVR, THE 13 HOLD.** Asked the question NVR can actually answer, using the artefact it
records: does each signature's `fingerprint` still match the template it names, at the version it
names? **13 of 13 HOLD** — no fingerprint moved, no version moved, no template gone, and 0 signatures
whose `sampleSheetHash` differs from the fingerprint (`record-nvr-signoff` writes them equal, so a
difference would mean one had moved). Nothing found, and now it has been looked at.

## R139 — NVR generators against their descriptions: coverage exact, three scopes exceeded
*2026-08-16. The audit that found `vr07-value-slip`, pointed at NVR. Report, do not repair.*

Generated 780 items across all 13 templates and 5 tiers and read what they actually emit — the ids
live inside builder bodies, so parsing the templates as data finds nothing (my first attempt returned
0 emitted ids and would have read as "no generator emits anything").

**COVERAGE IS EXACT: 22 ids emitted, 22 library entries, zero orphans in either direction.** No entry
nothing emits, no emitted id without a row. Better than VR, which had 13 executors against a library
that also carries semantic entries.

**BUT THREE DESCRIPTIONS NAME A NARROWER SCOPE THAN THE GENERATORS USE** — the same shape as
`vr07-value-slip`, where the code implements a superset of what the entry says:

| entry | description says | emitted by |
|---|---|---|
| `nvr-transform-not-applied` | *"the option most resembling **C** untransformed (types: **analogy**)"* | folding-punch, machine-analogy, machine-series, turntable-reflection, turntable-rotation |
| `nvr-series-phase-slip` | *"(types: **series**)"* | machine-analogy, machine-matrix, machine-series, turntable-rotation |
| `nvr-wrong-mirror-axis` | *"(types: **reflection tasks**)"* | folding-plans, folding-punch, turntable-reflection |

`C` is analogy notation — A:B::C:? — and there is no C in a series, a reflection or a punch task.
`nvr-rotation-wrong-direction`'s own description distinguishes itself from *"the magnitude slip of
series-phase-slip"*, so phase-slip is doing rotation-magnitude work on `turntable-rotation` that its
`(types: series)` scope does not cover.

**This is a READING and not a proof**, and the distinction matters: the parenthetical type-scopes may
be stale shorthand from the corpus import rather than live constraints. What is certain is that **the
entry and the generator disagree about where the error occurs**, which is exactly the class she asked
to be run — and NVR is signed, so which side moves is hers.

## R140 — The audit's only findings were artefacts of its own unit
*David, 2026-08-16. Six SpaG signatures, eight days, no repair to the content.*

**All six of the "stated depth does not equal generable depth" findings were the check comparing
SENTENCES against ITEMS.** Every one of the reviewer's figures is exactly the family's bank size, and
she named the unit each time — *"24 verified sentences (6/rung)"*, *"12 sentences, 4/rung"*, *"11
keys, 3–4/tier"*. Measured, six for six:

| family | note says | bank | items |
|---|---|---|---|
| `spag-spell-homophone-by-sound` | 24 | **24** | 42 |
| `spag-spell-unstressed-suffix-vowel` | 24 | **24** | 42 |
| `spag-spell-silent-letter-dropped` | 24 | **24** | 41 |
| `spag-spell-double-consonant-boundary` | 16 | **16** | 27 |
| `spag-punct-terminal-boundary` | 12 | **12** | 16 |
| `spag-punct-apostrophe-contraction` | 11 | **11** | 19 |

**Neither DRIFT nor WRONG-AT-SIGNING.** Not drift: every fingerprint matches today. Not wrong at
signing: every figure was correct in the unit stated. `familyDepth` generates to exhaustion and counts
distinct items, and an N-keyed family yields two per sentence.

**A CHECK WHOSE SOLE OUTPUT IS AN ARTEFACT OF ITS OWN UNIT IS WORSE THAN ONE THAT FINDS NOTHING**,
because the nothing is honest. It now prints both figures labelled and reconciles against either;
0 of 13 flagged.

**AND THE REAL FINDING IS THE DECISION MADE FROM THE NUMBER, NOT THE NUMBER.** Her notes carry
judgements — *"exhausted in one sitting"*, *"two sittings exhaust a tier"*, *"SIZE BEFORE SERVING"* —
and **exhaustibility needs the ITEM figure while she was given SENTENCES**. On the six N-keyed
families items run **1.33× to 1.75×** the bank:

| family | sentences | items | ratio |
|---|---|---|---|
| `spag-spell-homophone-by-sound` | 24 | 42 | **1.75×** |
| `spag-spell-unstressed-suffix-vowel` | 24 | 42 | **1.75×** |
| `spag-punct-apostrophe-contraction` | 11 | 19 | **1.73×** |
| `spag-spell-silent-letter-dropped` | 24 | 41 | **1.71×** |
| `spag-spell-double-consonant-boundary` | 16 | 27 | **1.69×** |
| `spag-punct-terminal-boundary` | 12 | 16 | **1.33×** |
| `spag-punct-apostrophe-possessive` | 13 | 13 | 1.00× |
| `spag-punct-speech` | 16 | 16 | 1.00× |
| `spag-punct-comma-needs` | 21 | 21 | 1.00× |
| the four cloze families | — | 6, 15, 6, 8 | not banked |

**The depths are right; the calls made from them may not be.** Every family she judged exhaustible has
roughly half again the depth she was told. Hers to re-make, and the fifth item for the tranche return.

## R141 — Correct, complete, unreachable: the fourth instance tonight
*David, 2026-08-16. One sweep, no repair.*

The diagnosis was already made. `scripts/export-spag-depth-both-figures.ts` opens: *"Annie is
restating every signed depth note in ITEMS rather than SENTENCES, so she needs both figures side by
side."* **The artefact that settles this was built and was unreachable** — no `package.json` entry, and
a docstring naming `pnpm export:spag-depth`, a command that did not exist. So the audit went on
generating the false finding beside a script that explained it.

Same family as `mathsFamilyFingerprint` missing from the core barrel, two hours apart: **correct,
complete, and not reachable by the person who needed it.** Wired now.

**THE SWEEP — 181 scripts, 11 docstring references naming a `pnpm` command that does not exist:**

| script | names |
|---|---|
| `export-terminal-over-ceiling.ts` | `pnpm export:terminal-over-ceiling` |
| `sign-speech-family.ts` | `pnpm sign:speech` |
| `backfill-draft-assessment.ts` | `pnpm backfill:pre-review` |
| `check-draft-assessment-subject.ts` | `pnpm backfill:pre-review`, `pnpm check:pre-review-subject` |
| 5 others (`apply-maths-annie-pass`, `deploy-vr03/07/11-signoff`, `export-maths-calibration-plain`, `export-vr07-vr11-new`) | `pnpm tsx` — a generic invocation, not a missing entry |

**Six are real: four scripts naming five commands that do not exist.** Counted, not repaired.

## R142 — A fabricated 90% divergence, sufficient on its own to justify the schema change
*David, 2026-08-16. The near-miss is worth more than the check that came out of it.*

Scoping the VR seed backfill, the first re-derivation reported **464 of 514 stored items diverging
from today's generators** — a 90% rate, exactly the evidence a migration needed, arriving precisely
when it was wanted.

**It was `JSON.stringify` against JSONB key order.** Every one of the 464 was identical in content:
`{"pairA":…,"prompt":…}` against `{"prompt":…,"pairA":…}`. The trap is documented in CLAUDE.md in
terms — *"Postgres JSONB does not preserve object key order, so a raw `JSON.stringify` diff reports
permanent false drift"* — and **this is the second time I have hit it in one session.**

**WHAT SAVED IT WAS READING ONE DIFF INSTEAD OF TRUSTING THE COUNT.** Nothing structural: no gate, no
review, no second pair of eyes. One `console.log` of a single row, printed because 90% seemed high
rather than because anything required it.

**THE RULE THAT GENERALISES: a measurement that confirms the thing you are about to build is the
measurement to distrust.** This one confirmed it at 90%, on the turn the schema change was being
scoped, and every incentive pointed at accepting it. The register is full of instruments that went
quiet when they should have spoken; this is the opposite failure and the more dangerous one, because
a false positive that agrees with you does not feel like a fault at all.

**AND THE CORRECTED FINDING KILLED THE MIGRATION.** 514 of 514 reproduce identically. VR generators
take no seed — the derivation input is `(typeId, n)` and both are in the id — so there was never
anything to back-fill. R133 is corrected in place: it applied NVR's seeded model to VR, **a fault
class carried across a district boundary without checking the boundary held.** Recommended against
the schema change and David accepted; the wrong version stays visible above the correction.

**RECORDED SO THE ABSENCE DOES NOT SPEAK FOR ITSELF** (David: R98 at the level of the register). *We
looked and there was nothing* and *nobody looked* read identically a month from now. We looked. The
provenance gap did not exist.

## R143 — `check:vr-rederive`: the check that needed no columns
*2026-08-16. Wired, and its limit prints beside its number.*

514 of 514 generated VR items reproduce identically. It needs no seed column, no template version and
no backfill, because the enumeration is stable rather than seeded — which makes it **stronger than a
seed-based check would have been: it works retroactively over every row already in the store, with no
baseline needing to have been captured first.**

It catches a generator changing AT ALL, not merely one changing after a backfill. **Verified by fault
injection on an unprotected DRAFT row** — never a reviewed one — which it flagged by id and field and
failed the build on; restored, and the restoration confirmed by re-reading the row rather than by
re-running the count.

**ITS LIMIT IS IN ITS OWN OUTPUT, WITH THE POPULATION THE CONDITION COVERS:** it cannot see a
generator change that PREDATES a reviewed row. **200 of 514 rows are protected by
`classifyDerivedWrites`** — LIVE, RETIRED, or carrying an attribution event. Those keep their stored
values legitimately, so a divergence on them is the guard working and not a finding, and a change
before protection is indistinguishable from one after. The two classes are counted apart and never
merged, because a single total would be the unit-mismatch fault of R140 in a different costume.

## R144 — A note makes an option READABLE, not CHECKABLE
*David, 2026-08-16. Scoped, and nothing built.*

**WHERE A TAG NAMES A JUDGEMENT RATHER THAN A COMPUTATION, NO FIELD CLOSES THE GAP.** That is the
entry; the population is only the occasion for it.

314 authored VR options sit outside every mechanical check, **188 of them LIVE across 74 items** —
`vr-04-closest-meaning` and `vr-06-missing-word`. Their tags are `vr04-opposite-pull`,
`vr04-associated-not-same`, `vr06-ignores-sentence`: a near-synonym that pulls the wrong way, an
associate offered as an equivalent, a word that ignores its carrier sentence. **There is no value to
derive.** You cannot compute the near-synonym a ten-year-old reaches for; that is a judgement about a
lexicon and a child, which is exactly why `vr-04` became a typed constructor generating to diagnosis
rather than an executor.

So a note would make those 188 options **readable by a reviewer** and would not make them
**checkable**. **314 authored notes to enable a comparison that still ends in a human is the expensive
route to where a cold read arrives directly** — 74 items read, against 314 fields written to support
an instrument that cannot conclude on its own.

**BOTH IMPORTS WERE REFUSED, AND THE SECOND IS THE EVENING'S OTHER MISTAKE AVOIDED:**
- **English's `misconceptionExecution`** — the right shape for a district whose errors are
  interpretive and whose options are hand-authored one at a time. VR's live gap is vocabulary
  judgement; the field would carry prose nothing can check.
- **An executor declaration** — impossible for 275 of the 314, not merely expensive. Only the three
  `vr-move-letter-*-invalid` tags (39 options, **all DRAFT**) are mechanically decidable, and against
  a lexicon as a VALIDITY test rather than a value derivation: a different gate from the one the
  generated options pass, buying nothing in front of children.

**That second refusal is the same error as R142's, four hours later: a mechanism carried across a
district boundary without checking the boundary held.** NVR's seed model onto VR at nine o'clock;
Maths-and-VR's executor model onto VR's vocabulary banks at one. **Twice in one evening, and caught
both times by the same question — what does this district actually have?** Asking it is cheap and
neither instance would have survived asking it first.

**WHAT THE POPULATION IS, since the classes are different problems:** 275 options are BANK-IMPORTED —
cases the generators deliberately no longer produce (`SUPERSEDED_BY_BANK` for `vr-02`/`vr-06`, and
`vr-04` left the set to become a typed constructor). 106 are `seed` items predating the generators. Of
the seed set, 67 already pass the value gate.

**IT GOES TO HER, NOT INTO A BUILD.** These 74 items are the only live content in the project with no
mechanical screen; the reason is that their errors are judgements; the honest options are a sample
cold read or accepting the exposure. **Her own measured rate — two category-2 faults in 34 items —
predicts roughly seven of the 74 carrying a second defensible answer.**

## R145 — The move field's library half: 62% null, five collisions, no additions
*David, 2026-08-16. Cowork's proposal, library side only, ~68 triples. The finding is what filling it taught.*

**1. HOW MANY TAKE A TRIPLE: 26 of 68. Null is 62%, and Cowork predicted the wrong family.**
It expected most of the TECHNIQUE family to be null. Technique is mostly a displacement — writer's
purpose read as character's state, device named instead of its work, effect located in the wrong
window. **The null majority is the ORTHOGRAPHIC and GRAMMATICAL families**: spelling, punctuation,
agreement, tags, question tags, determiners. Nothing moves in those — a form is chosen wrongly, or
omitted. Right prediction, wrong district within the library, and the field covers a minority either
way.

**2. FIVE TRIPLES ARE SHARED, AND FOUR OF THE FIVE ARE THE VOCABULARY BEING TOO COARSE:**

| triple | entries |
|---|---|
| `sense/whole-text/window` | **4** — dominant-sense, neighbouring-sense, form-lookalike, not-this-word |
| `time/window/window` | 2 — chronology-collapse, parallel-read-as-sequence |
| `event/character/character` | 2 — agent-patient-reversal, cause-agent-swap |
| `event/reader/whole-text` | 2 — plausible-not-stated, whole-text-absence-asserted |
| `purpose/writer/question` | 2 — label-not-effect, generic-effect |

**The four vocabulary entries collapsing to one triple is the shape failing where it is needed most.**
Those four are precisely the family the reviewer spent two days separating — dominant versus
neighbouring is *which sense arrives first for a child*, form-lookalike is *a different word
entirely*. Cowork names this limit itself: *"it does not help where the disagreement is about degree
rather than structure"*. Measured, that limit costs four of the twenty-six.

`chronology-collapse` vs `parallel-read-as-sequence` is the same collapse in miniature — one invents
an order where the text gives none, the other misorders two real events, and `time/window/window`
cannot tell them apart.

**3. THE CLOSED LISTS HELD. ZERO ADDITIONS.** All 26 triples came from Cowork's nine `what` values and
eleven roles with nothing forced. That is the strongest result here: **the list did not grow by a
third while being filled, so it is a vocabulary and not free text with extra steps.**

**4. NO TRIPLE CONTRADICTED ITS OWN DESCRIPTION.** WIW-14's fault did not recur at library level. One
near-miss worth recording: `en-subject-verb-agreement-by-proximity` reads like a displacement — the
verb agrees with the wrong noun — and is not. The controller is never IDENTIFIED, so nothing is
relocated; writing the triple is what forced that distinction, which is the field doing its work in
the direction Cowork intended.

**THE VERDICT ON THE SHAPE: it separates the two entries it was built to separate**
(`quality/character/character` against `quality/vehicle/subject`, one glance apart) **and it cannot
separate the four it most needs to.** So it is real and it is partial.

**WHAT THAT MEANS FOR THE 900 HOURS, and it is David's call not mine:** the option-side field would be
checkable against 26 of 68 entries, and blind on the vocabulary family carrying the most items in the
bank. A cheaper reading is available first — the library half now exists, so the two-triple comparison
can be run against ANY option whose tag is one of the 26 the moment a single option declares one.
**The proof of value does not need 900 hours; it needs one cluster's worth of `moveClaimed`.**

## R146 — The blind move pack: what can be stripped, and what cannot be enforced
*David, 2026-08-16. ENG-002, 90 declarations. Emitted, nothing compared yet.*

**THE CLUSTER, CHOSEN ON THE PRIOR RATHER THAN ON INSTINCT.** ENG-002 carries **33 options tagged
`en-wrong-scope-retrieval` or `en-plausible-not-stated`** — the two broad tags where a disagreement is
likeliest — against 13 for the next cluster. 75 of its 90 tagged distractors carry a triple, a better
ratio than ENG-001's 63 of 88, and all 23 items are DRAFT so nothing live rides on the result.

**WHY NOT ENG-001, WHICH WAS THE INSTINCT:** `WIW-14 B` was retagged four hours earlier on her
boundary ruling, so it now reads `quality/vehicle/subject` against a tag declaring the same. **The
case the field was built from agrees with itself; the comparison cannot re-find it.** A null on
ENG-001 could not be distinguished from an instrument that does not bite — ruling on 900 hours from an
unfalsifiable zero.

**AND THE PLANTED-POSITIVE FIX WAS REFUSED, RIGHTLY.** Declaring WIW-14 B's pre-retag intent would
test whether the MECHANISM fires, with a value supplied by the people who know what it should say.
What is worth 900 hours is whether **a drafter's honest declaration disagrees with a wrong tag**, and
a value we supply cannot show that.

**WHAT THE PACK STRIPS, VERIFIED RATHER THAN ASSERTED:** no `misconceptionId` and no
`misconceptionExecution` anywhere in the file; option ids opaque (salted sha256); option order
shuffled on the salt; 90 tag values held back. The key mapping opaque id → row → tag is written to
`content/blind-keys/` and **is not delivered** — confirmed absent from the delivery folder, and it is
the only artefact that can align a return to a stored row.

**WHAT IS CARRIED AND WHY:** the passage with all 85 numbered lines, each item's cited window, and
**which option is correct** — a reader must know the right answer to say what a distractor displaces,
and the key is not a diagnosis. `questionTypeId` is carried and is not a leak: a vocabulary stem
announces itself in its own words.

**THE BLIND IS PROCEDURAL AND THE PACK SAYS SO IN ITS OWN TEXT.** Cowork holds every item and option
text matches trivially. Stripping raises the cost of accidental sighting and does nothing against
deliberate lookup. **It depends on a commitment neither side can verify**, and the pack asks Cowork to
say plainly if it cannot declare blind rather than pretend — that answer costs nothing and is worth
having.

**RECALL IS UNSOLVABLE BY CLUSTER CHOICE.** Cowork drafted every cluster in the bank; there is no
unread-by-the-drafter option, only degrees of staleness, and ENG-002 is weeks old rather than days.

**CONFIDENCE IS EVIDENCE ABOUT THE BLIND, NOT ABOUT THE DRAFTER**, and the pack says that too. A
genuine blind read produces hesitation where two triples both fit; a sighted read agrees smoothly
everywhere. **A distribution with no low-confidence rows is itself a signal** — so the pack asks Cowork
not to smooth it, because a field whose purpose is unstated gets rounded up.

**THE CONTROLS — Cowork's proposal, and they close the gap the design still had.** Six options whose
tags are ALREADY VERIFIED CORRECT sit in the pack unmarked. Without them, two outcomes are
indistinguishable and a ruling on 900 hours would rest on which one it was:

| result on the controls | what a zero elsewhere means |
|---|---|
| declarations AGREE | the vocabulary is usable — the cluster is clean |
| declarations DISAGREE | the field cannot express these errors — **every declaration is a shrug** |

**Not planted, known-good.** They carry `en-attribute-transfer` and survived Cowork's sweep of all 44
carriers against her vehicle/subject boundary, which found exactly one wrong and it was in another
cluster. **Any option on Cowork's stated-recognition list is excluded** — `pp-12` was a candidate and
was dropped, because an option the drafter expects to recognise cannot be evidence that a blind
reading works.

**6 of 90, and the count is in this report and not in the pack.** Enough to read: six agreements is a
usable vocabulary, three or more disagreements is a shrug. Few enough not to dominate.

**THEIR LIMIT, STATED IN THE KEY: all six are the SAME TRIPLE** (`quality/character/character`). They
test whether the vocabulary can express THAT move, not whether it can express every move. It is the
only verified-correct set ENG-002 has — the delivery-83 retags were also verified against each
option's own note, and every one of them is on the recognition list.

**Cowork will flag recognition per option regardless of blinding**, having named nine in advance:
pp-05, -08, -11, -12, -13, -17, -19, -20, -21, most from work done today. **A recognised option's
declaration is not evidence either way**, so the readable population is what remains after both
exclusions.

`content/blind-keys/` is excluded from the vocabulary scanner: it holds internal tag ids
(`en-within-span-wrong-element` tripped the child-facing ban on "wrong") and is the one file that must
never be delivered.

## R147 — The controls answered it: 1 of 6, and the field does not hold
*David, 2026-08-16. ENG-002 blind return scored against the key. The 900 hours are not spent.*

**THE CONTROLS FIRST, BECAUSE THEY DECIDE WHAT EVERY OTHER NUMBER MEANS. ONE OF SIX AGREES.**

| item | entry | declared blind | conf |
|---|---|---|---|
| pp-01 B | `quality/character/character` | `quality/character/character` | low |
| pp-02 D | `quality/character/character` | `referent/character/character` | low |
| pp-03 C | `quality/character/character` | `event/character/character` | high |
| pp-04 C | `quality/character/character` | `event/window/window` | medium |
| pp-09 A | `quality/character/character` | `event/character/character` | medium |
| pp-10 D | `quality/character/character` | `event/character/character` | high |

These six are not planted and not hard: `en-attribute-transfer` carriers that survived the reviewer's
own 44-carrier boundary sweep. **A blind reader given a known-good tag reproduces its triple once in
six.** Under the ruling agreed before the pack was sent, that is the second branch: **the field cannot
express these errors, and every declaration in the return is a shrug.** A zero elsewhere would have
meant nothing, and this is exactly the outcome the controls existed to make distinguishable.

**THE READABLE POPULATION CONFIRMS IT.** 74 rows after removing 6 controls and 10 recognised:
**5 agree, 69 disagree — 6.8%.** And the recognised rows, where Cowork admits it knew the option,
**disagree 10 of 10** — the drafter's own memory of an item does not reproduce the entry's triple
either.

**WHERE IT FAILS IS NOT ONE SLOT, WHICH KILLS THE OBVIOUS REPAIR.** Over 53 triple-vs-triple
comparisons: **3 agree on all three, 13 differ on `what` only, 13 differ on the roles only, 24 differ
on both.** Had the roles reproduced and only `what` slipped, the vocabulary could be narrowed. They do
not. The commonest substitutions are `referent → event`, `event → sense`, `quality → event`;
`whole-text → window` and `character → window` on the destination. **Both halves are unstable
independently.**

**AND THE VOCABULARY IS NOT CLOSED — IT IS A CLOSED LIST PLUS A PRIVATE INTERPRETATION.** Cowork
supplied four readings it needed to declare at all: `window` = the cited lines, `whole-text` = the
passage OUTSIDE that window, `question` = a category mismatch, and `to` = character for an inner
state, window for a fact. **67 of 90 declarations depend on `to: question` or the character/window
split.** Those readings are not in the enum, were never agreed, and without them the triples are
uninterpretable. **Zero additions was never evidence the list was sufficient**: I added nothing
because I authored both the list and the entries, and Cowork added nothing because it left slots
empty and wrote the missing axes into an interpretation instead.

**DAVID'S TWO RULINGS, RECORDED:**
- **`from: reader` for invented content — REJECTED**, Cowork's reasoning upheld. If `reader` means
  "the child supplied it", every `plausible-not-stated` option carries it and the triple stops
  carrying information. **A negative fact is not a role.** The notDisplacement rows stand.
- **The undeclared readings are a FINDING, not a fix.** Scored as stated, and the 67 is the size of
  the gap between the list and its use.

**ONE FIGURE CORRECTED: 16 notDisplacement rows, not 11.** Cowork's own prose says *"11 of the 16 are
invention-shaped and would flip if the reading were ratified; the other 5 are degree, scope, negation
or over-reach"* — the 11 is the subset that turns on the rejected reading, and 16 is the count. The
ruling reaches all 16.

**THE BLIND HELD, on the only evidence available.** Confidence came back **33 low, 51 medium, 6 high**
— a genuinely hesitant distribution, which is what a blind read produces and what a sighted one does
not. Cowork also stated its method: declared without opening its ENG-002 store, without reading a
resolver constant naming an ENG-002 tag, without running a gate. **A commitment and not a proof**, in
its own words, and the confidence shape is consistent with it.

**THE VERDICT.** The field cannot separate the two entries it was built to separate — one control in
six, and `quality/character/character` read as `event/character/character` three times. **It is not
worth Cowork's ~900 drafter-hours, and one cluster of 90 declarations bought that answer.** The
library half stays: 26 triples over 68 entries are a real description of what those entries do, and
the four-way collapse and the zero-additions result are still true statements about the vocabulary —
they are simply not evidence that a second party can reproduce it.

## R148 — The option branch took one argument where the stem branch took four
*David's ruling, 2026-08-16. Cowork's question, and the asymmetry decided it.*

**IS THE EXEMPTION MEANT TO TRAVEL FROM `stem.quotes` TO OPTION TEXT? It was not travelling, and
that was an accident.** The option loop passed `testedTokens` alone — no `quotedSpans`, no
`exemptSpans`, no `passageNames` — so an option reproducing a span declared on its own stem was
blocked **identically** to one where nothing was declared at all: same rule, same wording, no way to
tell them apart.

**`passageNames` is what settles it as accident rather than design.** That field exists so a
child-facing string may name a character the passage names. **There is no reading under which an
option may say *Bingley* only by luck of it being short.** The branch was written before the
declaration machinery and never revisited.

Now takes the same four. Spans are filtered to those actually present in the option
(`spansPresentIn`, as the walk scripts already are), because a span this option did not use is not a
broken claim.

**RE-RUN OVER 1,032 ITEMS: 0 newly pass, 0 newly fail, 0 changed faults, 49 blocked before and after.**
David predicted zero and was right — and predicted the blanking behaviour might bite the other way,
which is worth recording as the thing that did NOT happen: **no item newly failed because an option
declaration merged two sentences.**

**BUT THE FIRST RUN SAID SIX NEWLY FAILED, AND ALL SIX WERE MINE.** `ENG-001-WIW-14`, `-WIW-18`
(both LIVE), `ENG-002-pp-11`, `-13`, `-17`, `-19`, every one reporting *"declares a quoted span that
is not in the text"*. **I filtered `quotedSpans` and left `exemptSpans` raw**, so the ban-list check
received the whole stem list and judged it against an option it was never about. **The same shape as
the multi-quote fault four hours earlier: a declared list compared against a string it was not a
claim about** — and it would have read as six real content faults, two of them on live items, if the
before/after had not been captured.

**Taking the baseline BEFORE the edit is what made that legible.** A re-run alone would have shown 55
blocked items and no way to tell which were new.

**WHAT THE RULING DOES NOT DO, recorded because it will be misread later:** it makes the 266
declarable, and **nobody is declaring them.** Cowork's recommendation stands on its own reasoning —
296 of 297 are borrowings rather than quotations, and a script-written declaration is a true claim
that means nothing. The eight zero-headroom items become fixable by hand if they ever need it. They
do not need it today.

**A NINTH ZERO-HEADROOM ITEM, found by the R159 sweep and recorded here with the eight:**
`ENG-003-A-SP-06` — **"Dictionary" in its walk script, covered by nothing.** Not by an option word
(*"dictionery"* is the option; *"Dictionary"* is not), not by a declaration, and not by
`Item.testedTokens`, which nothing reads. **It passes because it FITS the role's single long-word
allowance, not because anything exempts it** — and it therefore has no headroom at all: one more long
word in that walk script fails it with nothing to fall back on. Recorded, not repaired.

**THE ONE-DIRECTIONAL GAP STAYS OPEN AND STAYS NAMED, so it is not discovered later as new:**
explanation quotes are offered to explanation fields and to nothing else. `stem.quotes` reaches stem
fields, walk scripts and now options; `explanation.quotes` reaches walk scripts only. Not fixed, and
not a fault today because no stem quotes a walk script.

## R149 — Changing an instrument that already reports failures: baseline first, standing
*David's standing ruling, 2026-08-16. `pnpm gate:baseline`.*

**ANY CHANGE TO AN INSTRUMENT WHOSE OUTPUT IS ALREADY NON-ZERO IS MEASURED AGAINST A BASELINE
CAPTURED BEFORE THE EDIT.** Not a rule about gates. A rule about **changing an instrument that
already has a non-zero output**, where a re-run gives a total and no way to tell which rows are new.

Twice in one evening a correct-looking change to `checkItemChildFacing` produced faults that looked
like content defects and were mine:
- the multi-quote gate — every stem declaring two spans reported the others as broken;
- `exemptSpans` passed raw while `quotedSpans` was filtered — **six items newly failed, two of them
  LIVE, on a signed cluster.**

Both said *"declares a quoted span that is not in the text"*, **a sentence that reads as bad
authoring.** With 49 already blocked, the after-run says 55 and points at nothing. **Without a
baseline the next move is reading the content instead of reading your own diff** — and the content
was correct both times.

**IT IS R142 IN A THIRD COSTUME: TRUST THE DIFF, NOT THE COUNT.** There it was a fabricated 90%
divergence that confirmed the schema change being scoped; here it is six fabricated content faults
that confirm a gate is now stricter. **A measurement that agrees with what you just did is the one to
distrust**, and in all three cases one row read by hand settled it.

**MADE CHEAP RATHER THAN LEFT AS DISCIPLINE**, because a rule needing bespoke scripting each time is a
rule nobody follows at eleven at night: `pnpm gate:baseline capture <file>` before, again after,
`diff` between. It reports newly-pass, newly-fail and same-item-different-faults, prints the fault
lines either side, and **says NOTHING MOVED when nothing moved**. It also refuses to compare
snapshots whose populations differ — a moved population is not a row-for-row comparison.

Verified by replaying tonight: fed the real before/after it reproduces all six, and fed the corrected
pair it reports nothing moved.

**COWORK FOUND THE MIRROR IN ITS OWN GATE.** `strip_q` leaves enclosing quote marks standing, so it
over-counts **44 of 67 declaring stems by up to two words** — its cap is stricter than the rule it
implements. Ruled fixed; no verdicts change. **Both sides had a gate quietly stricter than its own
rule, found on the same evening, neither by the gate.**

## R150 — Six docstring references, repaired per script rather than uniformly
*David, 2026-08-17. "Wire them or delete the reference, per script, whichever is true."*

**FOUR SCRIPTS, FOUR DIFFERENT TRUTHS.** The uniform repair — wire all six — would have been wrong
three times out of four:

| script | what was true | done |
|---|---|---|
| `backfill-draft-assessment.ts` | **stale name.** Wired as `backfill:draft-assessment`; the docstring said `backfill:pre-review` | docstring corrected |
| `check-draft-assessment-subject.ts` | **stale name.** Wired as `check:draft-assessment` | docstring corrected |
| `export-terminal-over-ceiling.ts` | **genuinely unwired**, and a repeatable diagnostic | wired; ran clean |
| `sign-speech-family.ts` | **genuinely unwired, and must stay so** | reference deleted |

**`sign-speech-family` is the one that must not be wired.** It re-records and re-pins a reviewer's
signature. A named command invites a second run, and a second run would stamp today's fingerprint as
though she had signed today. **Deleting the reference is the repair; creating the command would be
the fault** — the same class as R63's one-shot ruling-appliers, which are run by path for exactly
this reason.

**AND TWO OF THEM WERE WORSE THAN A DOCSTRING.** `check-draft-assessment-subject` named the
non-existent commands in its `requirePopulation` label AND in its failure message — so an operator
hitting the failure was told to *"Re-run `pnpm backfill:pre-review`"*, a command that does not exist,
**at the moment they most needed a working instruction.** A stale docstring is read once; a stale
error message is read under pressure.

**The sweep's two remaining hits are false positives, checked rather than assumed:**
`export:metadata-params` exists and my regex clipped it at a string-concatenation line break;
`sign:speech` now appears only in the sentence explaining why it does not exist.

## R151 — The SpaG surface: two families, one component, and a layout that took four attempts
*David's ruling, 2026-08-17. Built cheap as scoped. 372 of 372 English items can now reach a child.*

**TWO FAMILIES, NOT THREE.** `punct-spot` and `spelling-spot` are ONE interaction — a sentence split
across the options with an N verdict — differing only in which mistake class the stem names. Cloze is
a different interaction: the sentence is in the stem with a gap, the options are candidate fillers.

**CLOZE COST NOTHING BUT REGISTRY.** It is a select-one, and `wordweb` with no words, groups or
carrier sentence degrades to exactly stem-plus-options. **A separate FAMILY with a shared COMPONENT**
— its own quarter and affirmations so a child meets "The Gap Yard" rather than "The Word Web", while
reusing a renderer that already does the job. Reuse where the interaction is the same; a new
component only where it genuinely differs.

**THE BOUNDARY PROBLEM WAS THE WHOLE DESIGN AND IT DID NOT RESOLVE BY REASONING.** Four attempts,
each looked at in a browser at 375px rather than argued about:

1. **48px line box, no padding** — target met, leading 2.6× the font, and the sentence read as an
   airy STACK. The exact failure the inline layout existed to prevent.
2. **A thin vertical rule between segments** — at 375px these segments are 30-45 characters, so most
   of them START a line, and a `::before` separator renders at the left margin and reads as a
   **BULLET**. It made the sentence look MORE like a list. The author's punctuation cannot carry it
   either: `spelling-spot` segment 1 has no trailing comma.
3. **1.75 line-height + 4px vertical padding to reach 48px** — the tinted runs OVERLAPPED each other
   vertically, because padding on an inline box collides when it exceeds the leading.
4. **Block below 600px, inline above.** Landed.

**THE RESOLUTION IS A FACT ABOUT THE CONTENT, NOT A COMPROMISE.** These segments each take a full
line at 375px ANYWAY, so fighting for inline flow buys nothing that is visible on a phone. Block
rows there — unambiguous boundaries, a real 48px target, no overlap, and the sentence carried by
reading order and the author's own commas. Inline above 600px, where segments genuinely sit side by
side and it flows as prose. Verified at both widths: 4 rows at 375px, `segmentsShareALine: true` at
900px, no overlap and no borders at either.

**N IS SET APART BY POSITION AND SHAPE, AND NO LABEL EXPLAINS IT.** Its own line beneath the
sentence, a bordered pill against untinted runs — a different kind of object, said by the layout. A
sentence explaining that N is not part of the sentence would be an admission the layout had failed.

**372 OF 372 CAN REACH A CHILD**, up from 337. **ENG-003 gates CLEAN on its first ever run** — 34
items, 0 blocked, the first honest statement about whether those items can be delivered. Not
published: that is a shipping decision, not a build one.

**And the engine refuses rather than pretends:** an item without `segmentsInOptions` falls back to
plain tiles, because rendering a non-segmented item as a sentence in pieces would be a lie about the
authored shape.

**THE 35px TARGET AT 900px IS LEFT AND LEFT FLAGGED** (David, 2026-08-17). Touch widths get 48px;
pointer widths get 35px against a 24px guideline. Defensible and different, and **worth having said
rather than silently meeting one number and not the other** — a surface that reports "48px met"
without naming where is the shape of every other fault recorded tonight.

**ENG-003 IS NOT PUBLISHED AND STAYS UNPUBLISHED** (David's ruling, 2026-08-17). It gates clean, and
**that is a statement about DELIVERY, not about CONTENT.** Annie has never seen a SpaG item in the
reviewer surface, ENG-003 was in neither packet, and its 34 items are the only English content
carrying a rendering nobody has reviewed. **A green delivery gate is not a review**, and shipping on
one would be the whole month's lesson inverted: an instrument's pass read as a person's judgement.
It joins the tranche return as the seventh item — the surface exists, the items can be delivered, and
she has not seen it.

## R152 — Four rulings applied, and a check that had been dead in CI since 16 August
*Annie via David, 2026-08-17.*

**1. `vr07-value-slip`: THE EXECUTOR MOVED TO THE DESCRIPTION, not the description to the code.**
Her reasoning is the part to keep: **a child misreading a code table SLIPS ONE ROW, which a hint can
teach against; substituting an arbitrary other letter's value is a random draw and no hint reaches
it.** The description was right and the code was wider than it. Narrowed to neighbouring rows —
`values` key order IS the table's row order.

**Her August verification confirmed independently: 25 of 25 live options are still produced by the
narrowed executor.** Every one was an adjacent-row slip; the extra range was never exercised. Nothing
re-reviewed, nothing re-signed.

**2. THE THREE NVR ENTRIES WIDENED, and recorded as an entry-scope correction in a signed district.**
All three parentheticals were wrong scope claims. **An error is scoped by its CONDITION, not by the
template family that first produced it** — wherever a transform is stated, wherever a cycle repeats,
wherever a mirror line is given. The 13 signatures stand: what was signed is the template and its
samples, and no item, sample or generated value moves. Each entry carries a `SCOPE CORRECTED` note in
`approvalNote`, visible to whoever reads a signature next. **Not a silent tidy.**

**3. THE LOCATION HALF, and the check I nearly shipped was wrong.** `spansPresentIn` FILTERS to
present spans, so a declaration resolving nowhere was silently dropped — and the widened option
exemption would have inherited that. Now reported.

**But the first version flagged `ENG-002-pp-12`, and that row was correct.** Its R4 declaration cites
`lineRefs: [39, 40]`, and the span sits in the passage ACROSS the line break (`…danced only` /
`once with Mrs. Hurst…`); the walk script paraphrases rather than quotes. **`checkItemChildFacing` is
pure over the item and cannot see the passage, so it cannot tell a workaround from a correct
citation.** Scoped to what it can judge: a PLACELESS declaration must resolve in the item; one
carrying `lineRefs`/`passageRef` belongs to `check:line-refs`. **R149 firing on the check written to
apply R149**, caught by the baseline diff.

**AND DEFERRING TO `check:line-refs` IS WHY ANYONE RAN IT: IT HAS BEEN CRASHING SINCE `30d5f33`.**
`bucket` was used 26 lines before its declaration — a temporal dead zone, thrown on the first item.
**It is a CI step, and a crashing step is not a passing one**; nothing reported it because the output
was a stack trace rather than a finding. Six days dead, in the gate that verifies where a child is
sent.

**REVIVED, IT REPORTS 794 BROKEN OF 864 PAIRS — 92% — INCLUDING 83 ON SERVING CONTENT.** I am not
reporting those as content faults, because a 92% rate is R140's signal that the rule is the artefact:
- *"both are required or neither"* contradicts the authored convention. `attractorLine: null` is a
  POSITIVE declaration under Addendum 36's CONTENT NOWHERE ruling, and `defeaterLine: null` with
  `defeatedByAbsence: true` is another. 693 of the 794 are `A-set / D-null / absence=null` — a
  half-filled legacy backfill, not a defect.
- *"defeaterLine comes before attractorLine"* assumes passage order is reasoning order. A child can
  be pulled by line 36 and defeated by line 22.

**83 of those sit on ENG-001 and ENG-028 — clusters she has read twice, which gate clean on
`check:cluster`.** The rules need her ruling before the numbers mean anything, and **the check is
left failing rather than quietly made to pass.**

## R153 — A step that cannot run and a step that finds nothing are the same colour
*Annie's ruling, 2026-08-17. Recorded above the 794, which is where she put it.*

**`check:line-refs` threw on its first item for six days**, in CI, in the gate that verifies where a
child is sent. `bucket` used 26 lines before its declaration — a temporal dead zone, introduced by
the commit that added the Addendum 36 loop. **Nothing reported it because the output was a stack
trace rather than a finding**, and it was only run at all because R152 deferred passage-citation
verification to it.

**THE CLASS: a step that CANNOT RUN and a step that FINDS NOTHING are indistinguishable at a glance.**
Every other blindness in this register is a check looking at the wrong thing — wrong scope, stale
proxy, unreported denominator, a population nothing creates. This one never looked at all, and the
distance between "0 findings" and "0 lines executed" is invisible unless someone reads the log.

**ASKED ONCE, AS RULED — AND IT IS NOT A GREEN-TICK PROBLEM.** 71 CI steps: **69 fail the build** on
any non-zero exit, crash included. So `check:line-refs` did NOT report green. **CI has been RED on
that step for six days and nobody read it.**

**THAT IS THE WEAKER FAULT AND THE MORE USEFUL ONE** (David, 2026-08-17): the signal was there and
unattended, **and no amount of fail-closed design fixes it.** Every mechanism in this register makes
a check speak; none makes anyone listen. A red step nobody reads is worth exactly what a green one
would have been.

**AND HOW "THE EIGHT" HAPPENED, which is the same fault in prose** (Annie, 2026-08-17). The sweep
found **299 undeclared reproductions** and, separately, **seven items surviving on declarations**.
Between those two true measurements, *"eight carrying a word the gates would refuse"* became *"eight
surviving on a declaration nobody made"* — **a true statement and a false one collapsed into one
sentence, and nobody noticed because the sentence is plausible under both readings.** Every
mechanical version of this distinction is already built and holding: `check:library-agreement`
reports fields THEY DID NOT STATE apart from fields that AGREE; the move field carries three states
rather than a silent null; `check:vr-rederive` counts guarded divergence apart from unguarded. **The
distinction survives in code and dissolves in prose, between two people, in one sentence neither
wrote down.** It reached the reviewer as a request for a list that did not exist.

**The two steps that genuinely report green whatever happens are BOTH MINE, added this session:**
`check:serving-path` (`|| true`) and `check:retag-releases` (`continue-on-error`). I wrote them hours
after recording R60 and R61, for defensible reasons — an incomplete population and a delivery-dependent
input — and they are still the only two places where a crash is indistinguishable from a pass. **The
reasons were good and the shape is the one the register spends a hundred entries on.** Left as they
are and named here, because a fail-open step nobody has written down is the actual hazard.

## R154 — Seven, not eight, and every one of them resolves
*For the reviewer, 2026-08-17. `gate-risk-declarations-for-annie.txt`.*

372 English items screened by running the real gate twice — declarations honoured, then stripped —
and reporting the difference. **Seven items pass the child-facing gate ONLY because a declaration
exempts a word the ceiling exists to exclude.** Two are LIVE (`ENG-001-WIW-10`, `ENG-001-WIW-14`).

**The count is SEVEN and she asked for eight**, which is stated rather than reconciled to her number:
the eighth may be a row I cannot see, a different definition of the risk, or a miscount on either
side. The seven are listed with the field, the rule that would fire, the run as a child reads it, the
word, and the passage line it is claimed from.

**AND THE HEADLINE FINDING IS THAT NONE OF THEM IS THE FAULT SHE DESCRIBED.** Her framing was *"a word
the reading-age gate exists to exclude, exempted by a declaration nobody made."* **Every one of the
seven declarations resolves**: `contemptuous` at line 23, `fastidious` at 57, `ordinary`/
`extraordinary` at 35 and 41, `imagination` at 16, `alacrity` at 53. These are quotations of the
passage, declared, and doing exactly what R23 built them to do.

**The per-fault comparison is why the number is trustworthy.** The first pass excluded any item that
also failed for an unrelated reason, and would have under-reported; computing the delta fault-by-fault
catches an exempted word on an item failing for something else. Worth stating because a screen that
silently drops its hardest rows is the fault this register is mostly about.

## R155 — Fixing my own two: the tolerance belongs in the step, not on the CI line
*David's ruling, 2026-08-17. 71 of 71 CI steps now fail the build.*

The only two steps that reported green whatever happened were mine, written this session. Both
defensible when written; both the shape this register spends a hundred entries on.

**`check:serving-path` — `|| true` REMOVED, and the reason is that its reason expired.** It was added
when 34 SPaG items were undeliverable by a decision nobody had made, and blocking on that would have
blocked every push. That decision is made and **all 372 are deliverable**, so the tolerance outlived
the condition. **A step that tolerates a condition after the condition is gone is a step nobody can
fail** — and nothing would have prompted a review of the exception, because an exception produces no
output.

**`check:retag-releases` — the tolerance MOVED INSIDE the step and is now declared.** Its population
is a Cowork delivery (`RETAGDEPENDENCYREPORT.txt`), absent in a clean checkout because the retag
history lives in their store. That is a missing delivery, not a broken build — a real reason, and
`continue-on-error: true` on the workflow line was the wrong place to put it. **A reader of the yaml
could not tell a tolerated absence from a swallowed crash.**

Now the step itself reports `UNMEASURABLE`, says why in five lines, states that **NOTHING WAS
SCREENED**, and **exits zero deliberately**. Every other failure — an unparseable row, a real
disagreement — still exits 1. **Verified by moving the file away and running it**, not by reading the
code.

**THE GENERAL FORM, which is what makes this more than two repairs:** if a step must tolerate an
incomplete population, the tolerance goes where the REASON is. In the step it is declared, printed on
every run, and reviewable; at the CI line it is invisible, unexplained, and indistinguishable from a
crash being swallowed. It is `declareMayBeEmpty()` (R61) applied one level out — to the exit code
rather than to the population.

## R156 — Two counts agreeing is not evidence the populations match; and mine matched anyway
*Annie, 2026-08-17. Stating both rather than reconciling is why this surfaced.*

**THE LISTS ARE IDENTICAL.** Her seven and mine are the same seven items, one role each:
`ENG-001-WIW-10`, `ENG-001-WIW-14`, `ENG-002-pp-17`, `ENG-002-pp-19`, `ENG-004-AGG-03`,
`ENG-004-AGG-08`, `ENG-014-TS-10`. **`TS-10` IS in mine** — it is not a live item outside the
child-safety population. `WIW-19` is in neither, and its gate state confirms why: **0 blocking with
declarations and 0 without, `stem.quotes` null. Nothing is being exempted, so it cannot be in a
population defined by exemption.**

**The "eight roles across six items with WIW-19 carrying two" was not my report**, and none of the
four candidate explanations is true — the file I sent lists seven numbered items and seven `FIELD`
rows, and contains no occurrence of `WIW-19`. Checked against the artefact rather than against my
memory of it, which is the only reason it is settleable.

**HER LESSON STANDS AND IS SHARPENED BY THE OUTCOME: two counts agreeing is not evidence the
populations match.** Here two counts agreed AND the populations matched — but that was discovered,
not assumed, and the discovery cost one query. **The counts agreeing would have been equally
consistent with `TS-10` missing and something else present.** Stating both lists rather than
reconciling to one number is what made the difference visible in either direction.

**THE SECOND TIME ON THIS SAME LIST**, and both times the same shape: a number passed between three
parties, plausible under two readings, believed because it was arithmetically consistent.

## R157 — Within-span is one-ended by site and two-halved by content
*Annie's ruling, 2026-08-17. The requirement is Cowork's; the principle settles one of mine.*

**Her definition, and the framing was wrong rather than compromised:** *true, inside, irrelevant.*
Only the first has a location. `wrong-scope` has TWO SITES — true at line X outside, answer at line Y
inside. **Within-span's second half is a RELATION** — the option answers a different question — and
the answer's location is the KEY's business, established by the walk script. **Asking the distractor
note to carry it is asking the note to prove the key.**

So the note needs the line where the option is true, plus a prose clause naming what it answers
instead. Check for a *"rather than"* / *"instead of"* clause; **do not demand a number.**

**`WITHIN_SPAN_SECOND_END_OPEN` IS NOT MINE TO CLOSE** — no check here requires a within-span note to
name a second location, and the classification lives in Cowork's store. Said rather than built,
because producing a change to look responsive would be the fault this register is about.

**BUT HER REASONING SETTLES MY OPEN ADDENDUM 36 QUESTION** (R152), which is the same principle
wearing a column name. `checkAttractorDefeater`'s *"both are required or neither"* demands a
`defeaterLine` — a NUMBER — for exactly the population whose second half is a relation. Measured:

- **748 of 864** options with an Addendum 36 line are half-filled and fire the rule.
- **163 of those are `en-within-span-wrong-element`** — the largest single tag.
- **101 of the 163 ALREADY CARRY a "rather than" or "instead of" clause** in their execution note.

**Her test, the one that closed the 22: when a requirement fails a population whose notes already say
the right thing, the requirement is wrong.** 62% here, and the rule is asking those notes for a
number the diagnosis has no site for. 62 half-filled options sit on LIVE items.

Still not repaired — the Addendum 36 rules remain hers to rule on, and this is the evidence for that
ruling rather than a licence to act on it.

## R158 — The declaration owns a taught word; and the fourth mechanism reads nothing
*Annie's ruling via David, 2026-08-17. Two mechanisms over one word, and neither gate could name which carried it.*

**THE FOURTH MECHANISM, AND IT IS WORSE HERE THAN COWORK REPORTED.** Cowork found eleven items
declaring an item-level `testedTokens` that nothing reads. This store holds **13**, and:

| | count |
|---|---|
| items with `Item.testedTokens` (the column) | **13** |
| items with `stem.testedTokens` (what the gate reads) | **0** |
| carrying both | **0** |

**`checkItemChildFacing` reads `stem.testedTokens` and NOTHING reads the column.** Not one of the 13
is exempted by it — `pp-21 ["spirit"]`, `RC-07 ["agitation"]`, `JE-09 ["officious"]`, `ML-02
["booty"]` and nine more. **An exemption nobody consults is not a third layer of protection; it is a
fourth thing that looks like one**, and it is the field that reads as safe to keep when either side
trims what it believes is redundant.

**WHICH MECHANISM IS LOAD-BEARING, measured on both named items with four variants each:**

| | TS-10 | pp-19 |
|---|---|---|
| declaration only | **passes** | **passes** |
| `testedTokens` only | **FAILS** | **FAILS** |

The declaration carries 100% on this side, and the `testedTokens`-only row is measuring an empty set
because neither item holds one. **The mirror is exact and inverted: Cowork's gate consults
`testedTokens` FIRST so a cleared word never reaches the declaration; mine UNIONED them so neither
could be named.** Her ruling settles it — a declaration cites a passage line and is checkable, a
token list is bare — and the union is worse than the ordering, because an ordering at least has a
defined winner.

Implemented: the declaration is consulted first (its spans are masked out of the text before the
scan, so a declaration-carried word never reaches the token filter at all), a word cleared by
`testedTokens` ALONE is reported as a **warning naming the mechanism**, and the exemption still
stands. **0 newly pass, 0 newly fail** over 1,032 items — as predicted, since both currently suffice.

**TWO FAULTS OF MINE IN THE IMPLEMENTATION, BOTH CAUGHT BY MEASURING RATHER THAN REASONING:**
1. **The first warning fired on "the", "is", "to"** — 16 on one item. I recorded every token-list
   match before checking whether the word was ever LONG, so it counted matches against the list
   rather than exemptions that did any work. **A number that looks alarming and is an artefact of its
   own filter order.**
2. **It fired on WORD CARDS**, where the headword IS the source and `testedTokens` is the designed
   and only mechanism — there is no passage to cite, so "unsourced" is false there. Scoped out. Two
   existing tests caught it, and they were right to.

The surviving warnings are single real words: `Rikki-tikki`, `extinguisher`, `fifteen-minute`,
`somebody` — taught words resting on an unsourced list, one of them on a LIVE item.

**And the WIW-19 correction belongs beside the eight:** I read `stem.quotes`, found null, and reported
*"nothing is being exempted"* as a fact about the ITEM. It carries `explanation.quotes` — one
declaration, four ceilings, used in both `walkScript` and `hintCore`, which is Cowork's "twice". **One
field read and reported as the whole item**, which is the same shape as the eight and the same shape
as `check:line-refs` reading `stem.lineRefs` after R77 moved it.

## R159 — The unsourced-exemption population is ZERO, and my warning manufactured six
*David, 2026-08-17. Separate the repairs before either.*

**A MERGED LIST CANNOT NAME ITS WINNER — AND I COMMITTED THAT AT THREE DEPTHS INSIDE THE
IMPLEMENTATION OF THE RULING MADE ABOUT EXACTLY THAT.** Recording a match against a merged list
without checking **which member matched**, then **which word it was**, then **which role it was in**:

1. *"the, is, to"* reported as exempted long words — length unchecked.
2. Word cards warned, where `testedTokens` is the designed and only mechanism — role unchecked.
3. Option words reported as an unsourced list — source unchecked.

**The union-versus-ordering ruling was right, and the implementation proved it the hard way, on
itself, three times.** Each fault was the same fault at one more level of the thing I was fixing.

**AND THE POPULATION IS ZERO. My split was of a set that does not exist** — I would have taken both
halves of "declarable" and "nothing to declare", and neither was real.

**THE SIX SURVIVORS WERE ALL THE INSTRUMENT. Every one is exempted by OPTION WORDS.**

`scriptTested = [...testedTokens, ...optionWords]` — a walk script may legitimately name an option's
own words, and I had MERGED that derived list into the authored one. So the warning could not tell
*"resting on a bare list nobody sourced"* from *"naming the option printed on the card"*, and reported
six items whose exemption was the option list doing exactly its job:

| item | word | in an option |
|---|---|---|
| RT-04 | Everything | *"…with everything smoothed down."* |
| RT-10 / RT-11 | Rikki-tikki | *"…made Rikki-tikki jump back."* |
| BF-09 | extinguisher | *"The extinguisher by the double doors."* |
| AL-01 | fifteen-minute | *"It is a fifteen-minute walk…"* |
| PR-05 | somebody | *"Waited about near somebody…"* |

**An option word IS sourced** — the option is on the card and checkable — so it is now passed as
`derivedTokens` and never warned about. **After the fix: 0 items exempted by an authored list alone.
The unsourced-exemption population is empty**, and the split into "declarable" and "nothing to
declare" was a split of a set that does not exist.

**THIRD SELF-CAUGHT FAULT IN ONE IMPLEMENTATION, and all three are one fault:** recording a match
against a MERGED list without checking which member matched, then which word it was, then which role
it was in. *"The, is, to"* (length unchecked), word cards (role unchecked), option words (source
unchecked). **A merged list cannot name its winner — which is the finding the ruling was made about,
committed three times inside the implementation of the ruling.**

**THE THIRTEEN: the column is load-bearing for NOTHING, and one item has zero headroom.**

All 13 pass at **0 blocking, 0 warnings**, with `Item.testedTokens` unread. Of their 15 words: 8 are
too short to trip any ceiling; 5 are covered by option words; 1 by a declaration (`RC-07`
*agitation*). **One is covered by nothing — `ENG-003-A-SP-06` *"Dictionary"*, in its walk script —
and that item passes because the word FITS THE ROLE'S SINGLE LONG-WORD ALLOWANCE**, not because
anything exempts it. Exactly the distinction asked for: **passing because it never trips, not because
it is exempted.**

So the column is safe to delete and **`SP-06` has zero headroom**: nothing changes today, and one more
long word in that walk script fails it with no exemption to fall back on. Recorded rather than
deleted — the ruling was to check first, and the check says delete is safe *and* names the one item
that would notice.

**ONE FIELD READ, REPORTED AS THE WHOLE THING — three instances, named together** (David, 2026-08-17):
`check:line-refs` read `stem.lineRefs` after R77 moved it to the item and checked no citations at all;
I read `stem.quotes` on `WIW-19`, found null, and reported *"nothing is being exempted"* about an item
carrying `explanation.quotes`; and `checkItemChildFacing` reads `stem.testedTokens` while 13 items
carry `Item.testedTokens`. **Same shape every time: a field moved or was added at a second level, one
reader kept reading the first, and the answer it gave was well-formed and about the wrong object.**

## R160 — I disabled the guard and it deleted the wrong column
*2026-08-17, deleting `Item.testedTokens`. Caught by Prisma naming the table.*

**`required=False` IS AN ESCAPE HATCH AND I USED IT CARELESSLY ON THE FIRST ATTEMPT.** The anchor was
`  testedTokens   String[]` — which is **`Misconception.testedTokens`**, a different column on a
different table, never ruled on, carrying values. `edit_file` matched it and removed it **silently**,
because I had told it not to assert.

**The only thing that caught it was `prisma migrate dev` refusing and NAMING THE TABLE:**
*"about to drop the column `testedTokens` on the **Misconception** table, which still contains 7
non-null values."* Not a check of mine. Not a review. A tool declining to do something destructive
and saying what it would have destroyed.

**R87 EXISTS BECAUSE `str.replace` SILENTLY NO-OPS. `required=False` REINTRODUCES EXACTLY THAT** —
and the failure is worse in this direction: a silent no-op leaves the file correct, while a silent
match on the wrong anchor leaves it confidently wrong. **The guard did its job every other time
today**, refusing a non-unique `border-radius` anchor and a mistyped `.crew-seg` anchor, writing
nothing both times. The one edit where I switched it off is the one that did damage.

Restored, with the reason recorded on the field. Verified: the column is back, its data never left
(no migration ran against it), and the live schema now lacks `Item.testedTokens` and nothing else.
`check:migration-replay` and `check:db-invariants` both hold.

**THE DROP ITSELF WENT AHEAD AS RULED**, hand-written because `migrate dev` cannot confirm a
data-loss drop non-interactively — and the SQL carries the clearance in its own comment: 8 words never
trip, 5 covered by option words, 1 by a declaration, 1 (`ENG-003-A-SP-06` "Dictionary") covered by
nothing and passing on the role's allowance. **Recorded as a ninth zero-headroom item beside the
eight.**

## R161 — REFUSALS_NOT_CHECKS: the refusal knows what the check was not asking
*Cowork's formulation, recorded here because two of the five instances are mine.*

**A CHECK MUST BE POINTED AT A POPULATION SOMEBODY PREDICTED. A REFUSAL STANDS IN THE PATH OF THE
ACT, SO THE ARGUMENTS IN FRONT OF IT ARE THE POPULATION — AND IT CANNOT BE AIMED AT THE WRONG ONE.**

**That is the inverse of every instrument in this register that went quiet, and all of them went
quiet by being aimed somewhere else.** Ten entries about checks looking in the wrong place —
`verify:solutions` at a MATHS bank no path creates, `check:line-refs` at `stem.lineRefs` after R77
moved it, `check:maths-distractors` at a population that has never existed, the executor audit never
pointed at VR, `audit:signed-depth` reaching 14 of 46 signatures, `check:library-agreement` reading
one key name, my own gate reading `stem.testedTokens` while 13 items carried the column. **And the
mechanism that structurally cannot have that failure mode was in the toolchain the whole time.**

Cowork's formulation, which follows from it: a check runs where someone remembered to put it and
answers the question it was written for; a refusal fires at the moment of the destructive act, on the
real arguments, and **must name what it is protecting in order to refuse — so it reports the blast
radius for free.**

Five this week, and in every one the refusal knew something no check was asking:

| refusal | what it named that nothing was checking |
|---|---|
| `prisma migrate dev` | **the TABLE** — that my edit had removed `Misconception.testedTokens`, not `Item`'s, and that it held 7 non-null values (R160) |
| the import door on `AGG-08` | **the WORDS** — *ordinary, extraordinary* — which turned out to be the passage's own, and the pair her entry turns on |
| the gate on `ML-02` | **the missing vault entry**, so a dominant-sense claim had no evidence behind it |
| `tools/edit.py` ×2 | **the anchor count** — 3 matches for `border-radius: 4px`, 0 for a mistyped `.crew-seg` — writing nothing both times |
| the dependent-without-bearing assert | **a half-updated population**, refusing before it could be reported as complete |

**MINE ARE THE IMPORT DOOR AND `tools/edit.py`**, and the second is the sharpest instance in both
directions: it refused correctly twice today, and the one edit where I DISABLED it deleted the wrong
column silently. **The same mechanism, proving the rule by working and by being switched off, within
an hour.**

**Why this outranks a check, stated as the design consequence:** a check must be pointed at a
population somebody predicted. A refusal is standing in the path of the act itself, so it cannot be
pointed at the wrong population — the arguments in front of it ARE the population. That is why
`prisma` could name a table nobody was thinking about, and why every instrument in this register that
went quiet went quiet by being aimed somewhere else.

## R162 — ENG-003's id shape, checked before it was assumed
*Cowork, 2026-08-17: the SpaG registry pattern is widening; 34 items may be passing for a reason nobody chose.*

**Checked, and nothing on this side parses an English id positionally.** The bank genuinely holds two
shapes — **338 items at 4 segments** (`ENG-001-WIW-01`) and **34 at 5** (`ENG-003-A-CZ-A1`, where the
tail is a grid reference rather than an index) — and every path that touches them is shape-agnostic:

- `check:cluster` scopes with `startsWith('ENG-003-')`, which is prefix matching, not segmentation.
- Ordering comes from **stored `clusterPosition`**, populated on all 34, never derived from the id.
- The only regexes over English ids are two **filename** filters (`/^ENG-\d+.*\.json$/`), permissive
  by the `.*`.
- `itemId.slice(0, 8)` in the admin actions is display truncation in a skip message, not parsing.

**So ENG-003 passes for a reason that WAS chosen** — prefix scope and a stored position — rather than
by accident of the ids happening to fit. Reported rather than repaired, because there is nothing to
repair.

**Worth keeping: the question was worth asking even though the answer was clean.** "34 items passing
for a reason nobody chose" is a hypothesis that costs one query to refute and would have been
invisible from either side alone — Cowork's pattern is widening, and only this store knows whether
this store cares.

## R163 — ENG-003 gates clean, and 18 of its 34 items are silently outside the gate
*Annie's ruling on item kind as a declared property, 2026-08-17. The other half of the id-shape question, and this half is not clean.*

**THE ID SHAPE WAS NOT THE REASON (R162). THIS IS PART OF THE REASON.**

`check:line-refs` opens with `if (!passageRef) continue;` — **18 of ENG-003's 34 items have no
`passageRef` and are skipped without a word.** Not reported as exempt, not counted as unscreened, not
named anywhere in its output: `PU-01…09` and `SP-01…09` appear nowhere, in any category.

**And the 16 that ARE in the population contribute nothing to what it verifies.** They carry a
`passageRef`, so they are counted in *"354 items citing a passage"* — but `lineRefs` is **null on all
34 ENG-003 items**, so they cite no lines. **Of the 354, only 313 cite anything; 41 are in the
population and citing nothing**, and the headline calls all 354 "items citing a passage".

So ENG-003's clean gate has three different causes and the report separates none of them:
- **18 items** genuinely outside a passage-based check, silently;
- **16 items** inside its population and contributing no citation to check;
- **34 items** outside every ledger-based check (`mechanismLedger` is null on all of them).

**IT IS ALSO NOT WRONG — WHICH IS THE POINT.** A punctuation-spot item has no passage by design and a
cloze cites a gap, not a line. **NOT APPLICABLE is the correct verdict for all 18, and the gate has no
way to say it.** Her ruling is the fix: a check DECLARES which item kinds it governs, a cluster
DECLARES its kind, and not-applicable becomes a stated verdict rather than a `continue`.

**This is R61 with the polarity reversed.** R61 was a check correctly finding nothing in a population
that legitimately does not exist, and the fix was `declareMayBeEmpty()`. Here the population exists,
the check is correct to ignore it, **and the silence is indistinguishable from coverage.** `continue`
is the `|| true` of a loop body.

Reported, not repaired: the declaration is Cowork's ruling to land on both sides and a unilateral
kinds vocabulary here would be a second thing to reconcile.

## R164 — `gapIndex`: the stores already disagree, and the migration closes it
*Cowork, 2026-08-17. Sixteen cloze items hold a gap index in `lineRefs` — on their side.*

**NOT ON THIS SIDE.** All 16 cloze items here carry `lineRefs: null` and the gap in
**`stem.gapRef`** (`ENG-003-A-CZ-A1 gapRef=1`, `CZ-B4 gapRef=4`). The value never entered `lineRefs`
in this store.

**So nothing breaks when it moves, and nothing starts working — because nothing here reads it.**
`stem.gapRef` is referenced in exactly two scripts: `audit-declarations.ts`, which tests its
MALFORMATIONS as fixtures (`gapRef → gapRefs`, `gapRef: 99`), and a comment in
`import-english-items.ts` naming *"the cloze lineRefs/gapRef mismatch"* as a known defect class.
**No gate reads it, and the SpaG cloze engine renders stem-plus-options without it.**

**Her point stands exactly and is confirmed from this side: a window check against gap 3 passes or
fails for reasons unconnected to anything.** Here it does not even do that — it passes because
`lineRefs` is null, so there is no window to check. The gate reaches those 16 items and verifies
nothing about them, which is R163's second cause on the same rows.

**The migration brings the two stores INTO agreement** rather than away from it: Cowork's `gapIndex`
will hold what `stem.gapRef` already holds here. The thing worth doing on this side is the reverse of
a repair — **when `gapIndex` arrives, decide whether a cloze gap should be CHECKED at all**, because
today nothing verifies that gap 4 exists in a passage with three gaps.

## R165 — The kind system adopted, and `check:line-refs` says all three causes
*Annie's ruling, 2026-08-17. Cowork's vocabulary; this is the reconciliation, not a second one.*

**FIVE PROPERTIES PER KIND** — `passageAnchored`, `singlePrefix`, `canonicalIds`, `mechanismLedger`,
`windowedItems` — in `packages/core/src/english/item-kinds.ts`. A cluster declares its kind, a check
declares which kinds it governs, and **a check ABSENT from the map governs EVERYTHING.**

**That default is the whole safety property.** Forgetting to declare makes a check BROADER, never
blinder — applies until ruled otherwise, never the reverse. It is the inverse of every failure in this
register, where an undeclared scope silently narrowed one.

`spag` declares all five `false`, and the reason is worth stating: **`false` means DO NOT ASSUME, not
"never true".** Sixteen of ENG-003's items carry a `passageRef` and the kind still says
`passageAnchored: false`, because the kind is mixed — cloze cites a passage and a GAP, the two spot
mechanics carry their sentence in the stem and cite nothing.

**`check:line-refs` NOW PRINTS THE THREE CAUSES AS THREE LINES:**

```
29 passages · 338 item(s) carrying a passage, of which 313 CITE LINES this gate can verify.
  25 in scope and CITING NOTHING — carried a passageRef, cited no line, so nothing was verified.
  34 NOT APPLICABLE by declared kind — this check governs comprehension, and these are outside it
     BY DECLARATION rather than by falling through a guard.
```

The numbers reconcile against the old output exactly: 354 minus the 16 cloze now declared
not-applicable is 338; 41 citing nothing minus the same 16 is 25. **Nothing moved except what the
report can say.** And the headline no longer calls 338 items "citing a passage" when 313 do.

## R166 — The cloze gap check: worth having, and cheap — one line
*David, 2026-08-17: "against is fine."*

**Worth having, and it is one comparison the data already supports.** Every cloze vehicle declares
`gapCount` in its own passage file, so the check is `gapRef >= 1 && gapRef <= passage.gapCount`.
**Measured now: 16 of 16 in range, 0 faults** — so it buys no repair today.

**The argument FOR is not the current state, it is that the gap number is CHILD-FACING.** The stem
reads *"Gap 1. Choose the words that fit best."* A `gapRef` disagreeing with its vehicle sends a child
to a gap that is not there, and **nothing checks it at all today** — the value is read by two
malformation fixtures and a comment (R164).

**The argument AGAINST, stated because it is real:** nothing serves `gapRef`. The cloze surface routes
to the shared renderer and shows stem-plus-options; the child never sees the vehicle, because the
sentence is already in the stem. So a wrong `gapRef` is currently inert and cannot reach anyone.

**Recommendation: build it WHEN `gapIndex` lands, not before.** Writing it against `stem.gapRef`
means writing it twice, and the migration is the moment the field becomes assertable. One line, on a
real field, against a count the vehicle already declares.

**AND THE DROP HAD FOUR READERS I DID NOT SCAN FOR (R86, on my own change).** `typecheck:scripts`
surfaced them ONE COMPILE ERROR AT A TIME after the column was gone: two `select` clauses and two
verification arms in `migrate-citation-fields.ts`, and — the one that matters — **a WRITE in the
import door.** `Item.testedTokens` was a declared carriage destination, so dropping it silently broke
the path for a field Cowork still sends.

**R86 says a file is every check that reads it, and I dropped a column without asking who read it —
the same fault the drop was fixing, one level up.** Found by a type system rather than by me.

Resolved honestly rather than by deletion: the registry now declares `item.testedTokens` as
**NOT_CARRIED / PROPOSED**, so it appears in the import door's exceptions list awaiting a ruling.
**`stem.testedTokens` still crosses and is still read** — only the item-level duplicate is affected,
and the ruling that removed the column was about a dead READER, not about the field being unwanted.
If item-level tokens should carry, the column comes back and this reverts.

**Worth noting alongside: cloze items carry a `passageRef` the child never sees.** Not a fault — the
sentence is in the stem and the vehicle is context for the author — but it is why these 16 sat in a
passage-anchored gate's population for months while contributing nothing to it.

## R167 — `carriedAt` was prose, and two stale destinations were invisible by reading
*David's ruling, 2026-08-17. Both entries corrected as one ruling, and the field type with them.*

**THE JOIN NOBODY WAS CHECKING.** The registry says where each of Cowork's fields lands; the schema
says which columns exist; **nothing connected them.** Two entries were wrong and neither could be
seen by reading:

| entry | said | truth |
|---|---|---|
| `item.testedTokens` | `Item.testedTokens` | **column DROPPED** (R159). Found by a compile error on a WRITE in the import door — it was a **declared carriage destination**, so the drop silently broke the path for a field Cowork still sends. |
| `lineRefs` | `stem.lineRefs`, *"migration is queued"* | **R77 MOVED it** to `Item.lineRefs` and the door has written there since. The registry described the pre-migration destination. |

**A destination that does not exist, one that moved, and one that is fine look identical when all
three are sentences.** Structured — `{kind, table, column, path}` — they become one assertion.

**50 destinations, all resolving.** `lineRefs` corrected to `col('Item','lineRefs')` **openly**, with
the old claim recorded on it: correcting a declaration quietly is what the registry exists to prevent.

**THE GENERAL SHAPE: A JOIN CHECK NEEDS BOTH DIRECTIONS, BECAUSE "DECLARED BUT ABSENT" AND "PRESENT
BUT UNDECLARED" ARE DIFFERENT FAILURES — AND THE SECOND IS WHERE A MIGRATION HIDES.** A dropped field
announces itself the moment anything reads it. A MOVED field leaves both sides individually valid:
the declaration still resolves against something, the column still exists, and only the pairing is
wrong. Nothing looking in one direction can see it.

**THE TWO FAILURES ARE CAUGHT BY DIFFERENT ARMS, WHICH IS WHY BOTH EXIST.** Fault-injected:
- a **dropped or renamed** column fails the forward arm — *"1 destination that does not exist"*;
- a **moved** column does NOT fail it — reverting `lineRefs` to `stem.lineRefs` still resolves,
  because `Item.stem` exists and the path inside it is data. **It fails the REVERSE arm instead:**
  *"Item.lineRefs neither declared nor platform-owned."* A one-armed check would have caught the
  column I dropped and missed the one R77 moved.

**THE 17 PLATFORM-OWNED COLUMNS ARE DECLARED, so their absence reads as a decision.** The database is
authoritative for status, pool, review provenance, similarity and calibration, and a carriage
registry has no business naming them. Listed in `PLATFORM_OWNED` rather than left as unexplained
gaps someone reads as missing coverage.

**AND THE LIMIT PRINTS EVERY RUN: this asserts a destination RESOLVES, never that it is the RIGHT
one.** `Item.lineRefs` and `Item.passageFlag` both exist; only a reader knows which a field belongs
in. The registry being wrong about WHICH column is still invisible.

**One line rather than an entry: my own join query reported three false positives** — two `carriedAt`
strings carrying trailing prose, two JSON paths read as columns. **A matcher over prose finds what
prose lets it find**, which is the same fault as the free-text field, one layer up, and it is why the
JSON-path case is now expressed rather than written into a sentence.

## R168 — The cloze gap check: three arms, all proven, and it buys nothing today
*David, 2026-08-17. Cowork added arm 2 and arm 3; both earn their place.*

**ALL THREE ARMS FAULT-INJECTED AND EACH CATCHES ITS OWN CASE**, on scratch DRAFT rows and a
restorable count, every change re-read afterwards:

| arm | injected | caught |
|---|---|---|
| **1 RANGE** | `gapRef: 99` | *"claims gap 99; the vehicle carries markers [1..8]"* |
| **2 UNIQUENESS** | two items claiming gap 2 | *"gap …#2 claimed by 2 items"* |
| **3 AGAINST THE TEXT** | `gapCount: 9` | *"declares gapCount 9, text carries 8 marker(s)"* |

**ARM 2 IS COWORK'S AND RANGE ALONE CANNOT REPLACE IT:** two items both claiming gap 3 are both in
range, and a gap answered twice is a gap one of them is wrong about.

**ARM 3 IS THE ONE THIS WEEK ARGUES FOR.** `gapCount` is a number in the vehicle's own file; counting
the markers checks the declaration against the thing it describes. **A declared number checked against
nothing is the shape every entry above is about.**

**AND THE MARKER IS `___(1)___`, SO COUNTING `___` DOUBLES IT** — 16 in an 8-gap vehicle, measured
and printed on every run beside the true count. Cowork caught it before reporting a disagreement that
does not exist. **The compound-signal fault again: an instrument measuring something ADJACENT to the
property under test**, and the third time this month that a naive matcher counted the wrong thing.

**`gapIndex` HAS NOT CROSSED TO THIS STORE. 0 of 16 carry it; all 16 still carry `gapRef`.** The check
reads either and **NAMES WHICH ON EVERY RUN** — verified by injection: setting `gapIndex` on one row
flipped the line to *"1 via stem.gapIndex · 15 via stem.gapRef"*. That is R164 and R167 built in
rather than learned again: **a reader that does not say which field it read cannot tell you the
migration has not crossed**, and this is the field whose migration is in flight right now.

**WHAT IT CATCHES THAT NOTHING CATCHES TODAY:** a cloze item pointing at a gap that is not in its
vehicle, two items answering the same gap, and a vehicle whose declared `gapCount` has drifted from
its own text. **Nothing screened any of those** — `gapRef` was read by two malformation fixtures and
a comment (R164), and `check:line-refs` declares cloze NOT APPLICABLE by kind (R165).

**IS IT WORTH BLOCKING ON? Yes, and its value is entirely PROSPECTIVE — stated rather than assumed.**
16 of 16 are clean, so it buys **no repair today**. What it buys is that the next authored cloze item
cannot claim a gap that does not exist, and the next vehicle edit cannot move a marker without the
count following. Blocking rather than reporting because the population is 16 and the check is
instant: there is no cost to failing loudly, and a gap number is CHILD-FACING — the stem reads
*"Gap 1. Choose the words that fit best."*

**One line, on myself: restoring a test edit with `json.dump` reformatted the entire vehicle file** —
66 lines changed on verbatim literature to put one number back. Restored with `git checkout` and
verified clean. **A restore that changes more than it restores is not a restore**, and `content/passages`
is the one directory whose contents must not be altered by us at all.

## R169 — Every signature that carries a figure names its unit: 33 of 33
*Annie's rule, 2026-08-17: a figure carried on a signature names its unit, because a signature is read by someone who was not in the conversation.*

**COUNTED ACROSS ALL 61 SIGNATURES** — 46 AttributionEvents plus 15 `NvrTemplateSignature` rows:

| | count |
|---|---|
| carry a QUANTITY figure | **33** |
| of those, name a unit | **33** |
| **bare number, no unit** | **0** |
| carry no quantity figure at all | 28 |

**The six SpaG depth notes are not a residue — they are the rule already being followed.** Every one
reads *"24 verified sentences (6/rung)"*, *"12 sentences, 4/rung"*, *"11 keys, 3–4/tier"*. R140 found
the AUDIT comparing sentences against items; **the notes themselves named their unit correctly the
whole time.** The fault was never in the signatures.

**AND MY FIRST COUNT WAS WRONG IN THE SAME WAY R168 WAS, ONE HOUR LATER.** It reported **13 NVR
signatures carrying a bare number** — every one of which reads *"I confirm the folding-net template at
fingerprint `16e5d71d8aed4552` … written review 2026-08-…"*. **The only digits are a HASH and a DATE.**
Neither is a quantity and neither needs a unit; my matcher counted "contains a digit" and called it "carries
a figure".

**Third instance today of an instrument measuring something ADJACENT to the property under test** —
counting `___` instead of `___(n)___`, matching a merged token list without checking which member
matched, and now counting digits instead of quantities. **Each time the number was alarming, precise,
and about the wrong thing**, and each time the only thing that caught it was reading the rows the
number was built from.

The corrected matcher strips fingerprints, ISO dates, bare years and `@version` before asking whether
a figure is present. Reported, not built into a check: the answer is 0 and a gate over a clean
population of 61 is not worth a CI step.

## R100 — Faults logged, one line each
*2026-08-16. Delivery pass: logged, not investigated.*

- `check:register` caught a citation to **R150, an entry that was never written** — I referenced it in a commit message and moved on. **A register with a citation to nothing is the same shape as everything else tonight**: a claim with no artefact behind it, believed because it was written down. Caught by the instrument rather than by me, which is the difference between this one and the 172.

- `export-approval-batch` carried **"Nine entries, 172 items" as a hard-coded literal** in its own `note` field while the code three lines below counted 215 and printed it — the artefact contradicting itself, and the prose is the half a reader believes. Same fault as Cowork's `approvedBy`, in our artefact: not derived from anything. Computed now. One line, no sweep (David, 2026-08-16).

- ENG-013 to ENG-022 (120 items) and ENG-002-pp-23: **no source on this disk**, so 378 is unreachable from here; 174 of 378 held.
- ENG-004: 12 drafted, **10 landed**, 2 gate-held on the long-word ceiling (AGG-03, AGG-08), 1 tag-held on `en-parallel-read-as-sequence`.
- The ten tag-held cluster items stay held: `en-vocab-dominant-sense` cannot cross (R85).
- `clusterPosition` and `options[].tagStatus` were on the carriage list and had no columns; added, and the import refused until they did.
- Item order is `Item.clusterPosition`, backfilled on all 174 and applied in `itemPool` before any take, so a partial serve keeps relative order.
- The 463 `human:staff-reviewer` rows touch **0 ENG items**. Parked.
- Misconception-reject e2e times out on `waitForURL('**?rejected=1')`; reproduces on the pre-change tree, so not from the signature work. Cause unknown. Logged, not chased.
- Every server action redirected unconditionally after a write and none re-read it — a swallowed error still rendered as success. Fixed on the item doors; the finding is the pattern, not the Prisma client.

## R99 — The migration history did not rebuild the database, and every check reads the database
*2026-08-16, found by Prisma refusing to migrate.*

I hand-picked two migration timestamps and got them the wrong way round.
`20260816122500_addendum_36_and_write_log_no_default` DROPS the default on `ContentWriteLog.at`;
`20260816125500_write_log_utc` SETS it. Replaying the history therefore converges on the UTC
expression default, while the live database has none.

**THE LIVE DATABASE WAS RIGHT AND THE HISTORY WAS WRONG, WHICH IS THE WORSE DIRECTION.** Every
check in this repo reads the live database. `check:db-invariants` — written that same hour, for
exactly this class of fault — reported 13 of 13 holding, and **a database rebuilt from migrations
would have failed that very invariant.** The instrument was sound and the thing it measures had
quietly stopped being reproducible.

R80's family again, one layer further out: not a wrong clock, but a wrong RECORD of how the state
came to be. `pnpm check:migration-replay` (`prisma migrate diff --from-migrations … --exit-code`)
now asserts that history rebuilds the live schema, and it is in CI ahead of the invariants it
protects. Corrected by restating the DROP last — R83's decision, in the right order this time.

Found because Prisma refused to run a routine migration, which is luck of the R90 kind: a tool
declining to proceed is not a check, and nothing was watching this until now.
