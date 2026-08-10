# ENG-004 — the comprehension pilot cluster

One passage, twelve items, stopped there. The other nineteen are not drafted.

## The passage, and why this one

**Anne of Green Gables, L. M. Montgomery (1908)** — `stream-a-06-anne-green-gables`, the
station scene: Matthew drives to Bright River to collect a boy and finds a girl.

I picked it on a readability profile of all fifteen Stream A extracts rather than on
impression. Scoring each on Flesch-Kincaid plus Dale-Chall, this one ranks **9th of 15** —
upper-middle, well clear of the easiest (The Railway Children) and the hardest (The
Canterville Ghost). Its mean sentence length, 20.2 words, sits close to the bank's middle.

Three things made it the transferable choice rather than merely the median one. It sits in
the **reading-age 10–13 band, which is ten of the fifteen extracts**, so a standard set here
carries to the majority of the bank rather than to the five-passage hard tail. Its
vocabulary affordance matches the brief's own stated corpus finding exactly — *scope*,
*attitude*, *brand*, *charge*, *case* are polysemous **common** words used in secondary
senses, which is what the brief says real papers discriminate on. And its technique hooks
are the mid-difficulty kind: a comparison, a comic gap between expectation and arrival, one
character described twice. That matters because technique is the type the library has no
tags for, and a standard is more transferable if it is set on a middling instance of the
hardest type than on a virtuoso one.

I also avoided Wind in the Willows and Pride and Prejudice deliberately: those two carry
the existing calibration tranche (ENG-001, ENG-002), and a pilot that retreads reviewed
ground tests less.

## What the cluster is

Twelve items following the passage in order, lines 4 through 65. Five retrieval, three
inference, two vocabulary-in-context, two author's technique. Tiers T1×2, T2×4, T3×4, T4×2.
Keys spread evenly across A, B, C and D.

The type split is derived, not guessed. The corpus file `english-comprehension-evidence-v2.json`
gives the GL mix as retrieval 17.5%, inference 13.6%, vocab 7.8%, technique 4.9% of the
paper. Normalised within the comprehension cluster and scaled to twelve items that is
**4.8 / 3.7 / 2.1 / 1.3**. I authored 5 / 3 / 2 / 2 — every type within one item of the
corpus figure. Technique is rounded up rather than down on purpose: it is the type with no
misconception tags, so it is where the pilot earns its keep.

## Line references and quotations

Every line reference and every quotation is resolved **in code** against the passage file —
`verify_eng004.py` flattens the numbered lines into a continuous string with a
character-to-line map, normalises the curly quotes, then confirms each declared quotation
appears verbatim and that the lines it actually occupies are inside the lines the item
cites. Nothing was counted by eye.

That check earned its place immediately. **One correction to this record (annie, 2026-08-09):**
of the four declared quotations, only *"more scope for imagination"* actually crosses a line
break — it runs from line 15 to 16. *"Her attitude and expression"* sits entirely on line 7;
it was the neighbouring word *"expectation"* that straddles the 6–7 boundary, not the quoted
phrase itself, and the two got conflated here. Doesn't affect either item's validity — AGG-02's
citation is still correctly [6,7] for other reasons (see R21) — but the record was wrong about
which quotation demonstrated the cross-line case. The same script also caught the cluster being
out of passage order on the first build. The order is now enforced by sorting on first line
reference in code rather than by my arranging the items correctly.

I added one more rule to the checker after the cold reads: **the walk script's opening line
reference must sit inside the item's own cited window.** Disposal evidence that lives
thirty lines outside the window the child was sent to is not disposal.

## Review

Two passes, as usual. Pass 1 is the mechanical script above. Pass 2 was **two independent
cold reads by reviewers who had not authored the items** — the brief's standard is a
qualified teacher who did not write them, and one reviewer of my own work is not that.

They found fourteen faults across two rounds. The ones worth your time:

The first read found an item whose **cited line window excluded the very evidence that
disposed of its own distractor** — the cherry-tree item pointed the child at lines 53–57,
but the text that kills "she is never frightened by anything" sits at 51–52. A child obeying
the line reference had in-window support for the distractor and nothing against it. That is
the puddle-and-lake fault in a different coat.

The second read caught something worse, and it was mine: **a fix I had made to the opening
retrieval item introduced a genuinely defensible wrong answer.** I had replaced a weak
distractor with "at the near end of the platform", which made near-versus-far the
discriminator — but the passage says "extreme end" and never says which end, and its own
geography arguably supports *near*. The key's "far end" was my gloss, not the passage's
word, in a Tier 1 item whose whole justification is that the answer is stated. That item is
now rebuilt from a different sentence.

The pattern across both reads is worth recording: **six of thirty-six tags were applied
outside the scope of their own library entry.** Not carelessly — each time, the honest tag
was already taken by another option on the same item, and the one-different-misconception-
per-option rule pushed the third distractor onto the nearest available label. That is a
library-shaped problem, not an authoring-shaped one, and it is the main finding below.

## The four things the library cannot currently do

**1. Vocabulary items can only carry one sense-based distractor.** A vocabulary-in-context
item's wrong answers are all "the wrong sense", and there is exactly one sense tag,
`en-vocab-secondary-sense`. Under the different-misconception rule, one distractor gets it
and the other two have to run on non-sense mechanisms — which is why my *scope* item briefly
carried a distractor that traded on the same optical sense as its neighbour but wore a
different label. Either sub-tag the sense errors (by word-family, by modern usage, by
collocation) or allow-list vocabulary items to repeat the sense tag. This binds on all
twenty passages.

**2. `en-plausible-not-stated` and `en-motive-invention` are not separable.** One is defined
as unsupported invention "especially motives"; the other as "a plausible motive the text
never supports". On any item where two distractors both invent, the second one's label is
decided by which was taken first. Since the tag drives the hint the child sees, that is a
live teaching difference resting on authoring order.

**3. There are no author's-technique tags.** The brief says so and the files confirm it —
`en-repetition-purpose` is the only technique-adjacent entry and it covers repetition alone.
Both technique items here needed something the library does not have.

**4. Nothing covers polarity.** No entry describes a child reading past a negator.

I have proposed **two** new tags, both used on real distractors and marked `tagStatus:
PROPOSED` on the option so nothing is smuggled in as approved:

- `en-comparison-vehicle-misread` — the child takes the bold figure a comparison implies as
  a description of the subject, rather than asking what the comparison measures. Used on the
  "bearding a lion" item.
- `en-parallel-read-as-sequence` — the child converts two parallel descriptions of one thing
  into two moments in time. Used on the two-observers item.

Both carry explicit boundary clauses against their nearest neighbours, because the library's
own recent entries carry them and the first drafts of these two were rejected in cold read
for lacking them.

A third, `en-negation-dropped`, is reported as an **observed gap without an instance**. I had
it on an item; that item was cut for an unrelated reason, and rather than keep a weak item
alive to justify a tag, I have left the gap logged and unevidenced. Expect to want a
demonstrating item before it enters the library.

I dropped a fourth proposal, `en-vocab-collocation-ignored`, when the second cold read showed
it was a re-description of `en-vocab-secondary-sense`.

## On the tag histogram

`en-plausible-not-stated` sits on nine of thirty-six distractors — 25%. I did not retag any
of them to flatten that, because choosing a label for appearance rather than accuracy is
precisely the drift **R5** warns about. Three tags *were* corrected after cold read on
accuracy grounds, and the histogram improved from 28% to 25% as a side effect. Fourteen
distinct misconceptions are in play, which is the number the passage honestly affords.

## Three items to look at first

1. **AGG-02** (*attitude*) — the distractor "What she thought about waiting" is the closest
   thing here to a defensible wrong answer. The key's own phrase contains *expectation*, a
   mental state. The walk now separates what her body showed from what she thought, but you
   should judge whether a Year 5 reader follows that.
2. **AGG-11** (Matthew's decision) — tiered T4, but lines 60–63 state the avoidance almost
   plainly and only the relabelling as kindness is inferential. One cold reader argued T3.
   If it moves, the cluster has a single T4 item.
3. **AGG-07 and AGG-08** — each rests one distractor on a proposed tag. If you decline either
   proposal, that distractor needs rebuilding rather than retagging.

## Two conventions I would ship with the cluster

Both came out of the cold reads and both will otherwise be re-learned nineteen more times.

**A distractor's disposal evidence sits inside the item's own cited line window.** If it
does not, widen the window — and widen it to the end of the sentence, not to the end of the
line, which is how the cherry-tree fix initially still clipped its own evidence.

**A misconception tag has to satisfy its library entry's own scope test**, including the
qualifiers — "in reported speech", "for why/imply questions", "keeps every fact". Where no
entry fits, propose one with a boundary clause rather than borrowing the nearest label.

## What is not done

The other nineteen passages. Not started, per the brief and per your instruction — the
standard gets set on twelve.
