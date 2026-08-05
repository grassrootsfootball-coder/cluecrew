# VR semantic-case rebuild — scope

*Prepared 2026-08-02, after the reviewer's generator audit (corpus-decisions
Entry 27). This is a SCOPE, not a build: it says what the work is, in what
order, and where a decision is David's before code starts.*

The six free-tier VR cases the automated gate cannot verify —
`vr-02 two-odd-ones-out`, `vr-03 related-words`, `vr-04 closest-meaning`,
`vr-06 missing-word`, `vr-10 word-connections`, `vr-15 reading-information` —
carry three structural faults and two content faults. The structural faults
are shared, so the rebuild has ONE backbone task and then per-case work on top.

## The backbone: tier must come from content

**This is the whole reason the cases cannot be signed off, and it is fixed
once for all VR generators.** Today every generator sets `tier = 1 + (i % 4)`:
tier is the loop index, not the difficulty. Until that changes, "Tier Fit"
has nothing to review and the same stem legitimately appears at two tiers
(finding 2).

The fix is a `difficultyOf(item)` per type that returns a tier band, and a
generator that assigns tier FROM it. The difficulty inputs already exist:

- **The word vault is tiered** — T1:26, T2:53, T3:126, T4:66, T5:29 (300
  cards). Any case whose stem turns on a word (vr-03, vr-04, vr-06, vr-10, and
  the words inside vr-02) keys its tier to the vault tier of the target word.
  A synonym item on a T4 word is a T4 item; the same shape on a T1 word is T1.
- **Structural depth** carries the rest — for vr-15, the number of clues and
  whether the chain is direct or transitive; for vr-02, how near the odd
  category sits to the group category.

Consequence to accept up front: content-driven tiers will NOT distribute evenly
25/4. A case may end up 6/7/7/5 rather than a forced 6/6/6/7, and the bank must
be sized so each band has enough distinct stems (see per-case). **Even tier
counts and honest tier counts cannot both be had; honest wins.**

Effort: **M**. One difficulty module, one change to the generation loop,
applied to six generators. Blocks everything else — do it first.

## Per case

### vr-02 two-odd-ones-out — content: expand, then tier by nearness · effort M
Root cause of the 10-stems-for-25 reuse: the category-pair logic yields only as
many distinct stems as there are categories. Needs enough distinct
(group, odd) pairings that 25 items use 25 stems, ideally with headroom per
tier. Difficulty = category nearness (fruit vs vegetables is hard; fruit vs
tools is easy) plus word familiarity from the vault. **No new gate** — odd-one
membership is semantic; human review after the bank is right.

### vr-03 related-words + vr-10 word-connections — DECISION FIRST · effort S or L
They are the same 25 analogies today (finding 1). Two paths, David's call:
- **(a) Two banks.** Author a second, distinct analogy set for vr-10. Keeps
  both cases in the free ten. Effort **L** (a full second bank, ≥25 authored
  analogies with tiered vocabulary and correct distractor relations).
- **(b) Fold and swap.** Drop vr-10, promote a clean non-free case into the
  free ten in its place (Entry 23's rule already picks the next by family).
  Effort **S**. Costs the free tier the "word connections" framing, which is
  only nominally different from "related words" anyway.
Recommendation: (b) unless the two cases are meant to teach genuinely different
relations. They do not today.

### vr-04 closest-meaning — content: enforce the slot contract · effort M
The tag sits on a fixed bank column; the column does not hold what the tag
claims (finding 4). Re-author SYNONYMS (and the parallel ANTONYMS bank) so
column 3 is a real antonym and columns 4–5 are real associates, at tiered
vocabulary. **Light gate possible:** a distractor must not itself be a synonym
of the key, and must not equal the key — a false-negative guard (catches the
"deep"/"hot" class). Full "is this the closest synonym" stays human review.

### vr-06 missing-word — content + a NEW GATE · effort M
The design wants two distinct distractors — one that fits the gap letters but
makes a non-word (`vr06-fits-gap-not-word`), one that makes a REAL word wrong
in context (`vr06-ignores-sentence`). The bank makes both non-words (SHOAK,
SHOWL). Re-author so the ignores-sentence distractor forms a real word. This is
the most machine-checkable of the six: **extend `check:word-puzzles`** to
verify the key forms the intended word, the fits-gap distractor does NOT, and
the ignores-sentence distractor DOES — all with the existing lexicon. Effort
**M**, and it converts vr-06 from human-review to gate-verified.

### vr-15 reading-information — generator + a NEW GATE · effort M
Fully mechanical: a generated ordering puzzle. Tier by clue count and
transitivity depth (2 direct clues = T1; 3+ with a transitive step = higher).
**Gate possible:** the answer is deducible, so a checker can confirm the key is
the UNIQUE answer the clues force and no distractor is also consistent. Effort
**M**; converts vr-15 to gate-verified too.

## What ends up verified vs human-reviewed

After the rebuild the automated gate would cover **vr-06 and vr-15** (add to
the four it already verifies → 6 of 10 free-tier cases machine-checked). The
remaining semantic cases — vr-02, vr-03, vr-04, and vr-10 if kept — depend on
the bank being authored correctly and then human review, because "closest in
meaning" and "which belong together" have no mechanical oracle. The rebuild
does not change that; it makes the banks trustworthy enough that review is
judging content, not catching generator bugs.

## Sequence

1. **Backbone** (content-driven tier) — unblocks all six. M.
2. **vr-06 gate + rebuild** and **vr-15 gate + rebuild** — highest value,
   they leave the gate permanently guarding those types. M + M.
3. **vr-03/vr-10 decision** — cheap if (b), and it removes a whole case from
   the rebuild list. S or L.
4. **vr-02** and **vr-04** bank re-authoring — semantic, so last; they gate
   nothing and need human review regardless. M + M.

## Definition of done

- No VR generator assigns tier by loop index; `pnpm check:db-content` or a new
  check asserts it.
- Each rebuilt case has 25 distinct stems (or a stated, smaller item count) and
  no stem at more than one tier.
- vr-06 and vr-15 pass an extended `check:word-puzzles`.
- vr-04 and vr-02 banks honour their tag contracts, verified by the reviewer at
  a sitting, recorded through the written-review path.
- The two hot-fixed items (Entry 27) are superseded by regenerated content with
  a proper third option, and the stopgap audit rows are noted as closed.

## Not in scope

The nine non-free VR cases and the genuinely uncheckable meaning-relation types
outside the free ten. This rebuild is bounded to making the free ten fit to
sign off; the rest follows the same backbone once it exists.
