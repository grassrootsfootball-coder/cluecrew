# Two reports, before building (reviewer, 2026-08-05)

## 1. Can the vr-03 constructor generate TO the diagnosis?

**Her question:** rewrite vr-03's distractor constructor to generate one
part-for-kind, one wrong-link, one same-topic *by construction* — the way
lineup-counting v5 generates its distractors — or does the pair data not support
it? Her point: relabelling is the patch, the generator is the fix.

**Answer: not from the data as it stands — but yes if the data is re-authored to
the diagnostic shape. This is a data fix, not a code-only one.**

Why lineup-counting v5 could do it: its errors are **arithmetic**. "Off by k" is
derivable from the count itself — the generator computes `count + offset` and
knows, by the offset, which error it is. Nothing outside the item is needed.

vr-03's errors are **semantic**, and none is derivable from the pair alone:
- *part-for-kind* needs to know the answer's parts vs its kind/whole/category;
- *wrong-link* needs a *different* genuine relationship between the words;
- *same-topic* needs the word's topic associates.

The current `ANALOGIES` data is a bare 6-tuple `[a, b, c, answer, distractor1,
distractor2]` — two hand-authored distractor words, no relationship type, no
diagnostic structure. So the constructor cannot *derive* a part-for-kind or a
wrong-link distractor from `kitten:cat::puppy:?`; it would need a per-word lexicon
(this word's parts, kinds, categories, associates) the tuples don't carry.

**The fix that makes it generate-to-diagnosis:** re-author each analogy into a
typed shape —

```
{ pair: [a, b], stem: c, answer,
  distractors: { partForKind: 'petal', wrongLink: 'garden', sameTopic: 'stem' } }
```

— then the constructor emits one distractor per named diagnosis and tags each with
its id *by construction*, so every wrong option is what its tag produces (the v5
property) and a gate can verify it. That is the real fix; it needs the pair data
re-authored to the diagnostic shape (hers/the corpus's content work), plus a small
constructor rewrite to consume it. Relabelling the two existing distractors is the
patch. Her three reversal items are exactly the shape one row of that data would
carry — they are the seed of the re-authoring, not one-off fixes.

## 2. Bare-example descriptions (before rewriting)

**Her diagnostic:** maths-36 slipped through because "e.g., 100cm = 10,000m" reads
as a statement of fact, with nothing marking it as the CHILD'S output — so a wrong
number has nothing to catch it.

**Count: ~22 descriptions, all in MATHS.** VR, NVR and English descriptions are
prose-framed (they say what the child *did* — "chose", "treats", "reflects"); the
bare-example pattern is confined to the maths library, where a description is (or
centres on) a lone worked example or equation:

- `maths-36` — "e.g., 100cm = 10,000m." (the known error)
- `maths-22` — "e.g., 1/2 + 1/3 = 2/5."
- `maths-26`, `maths-29`, `maths-32`, `maths-06`, `maths-17`, `maths-19`, `maths-14` … (~22 total)

The exact number moves by a few depending on where the line sits (a lone `e.g.`
equation vs one already framed by "believing/treating"), but it is **~22 of the 97
maths entries — roughly a fifth**. That is large: it is a library-wide shape
problem, not a handful of typos. A fixed frame — **"child gives X where the answer
is Y"** — would give every numeric example something to check it against, and
turns a silent factual slip into a visible mismatch. Per your instruction this is
reported, not rewritten: the shape and its wording are yours, and it is a single
consistent pass across the maths library once you settle the frame.
