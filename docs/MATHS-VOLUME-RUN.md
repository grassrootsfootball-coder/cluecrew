# Maths volume run (BUILD-DISTRICT-MATHS §5) — drafted 2026-08-06

Batch 01 is closed (40/40, library at 101). This is the run that fills the district to the
volume gate (≥25 LIVE per Case, ≈900 + a T5 pool ≥150), on the engine batch 01 proved.

## The engine (both structural advantages mechanised)

- **Advantage #1 — machine-verified keys.** Every item carries a `solution` expression;
  `evalArithmetic` recomputes it and `checkMathsItem` fails on any mismatch with the key.
  A hallucinated answer key cannot ship. (`check:maths-distractors` fails a LIVE item on it;
  the batch-02 harness self-tests it — a wrong key IS caught.)
- **Advantage #2 — distractors ARE the executed misconception.** `MISCONCEPTION_EXECUTORS`
  run the error on the item's own operands and produce the distractor value. The batch-02
  harness *generates* every distractor this way, so — unlike joan's hand-typed originals,
  three of which annie caught — **no distractor number is authored by hand.** The gate then
  re-derives and confirms it.

## The authoring loop (`scripts/build-maths-batch-02.ts`)

Author the **shape** — stem, `operands` (named numbers), `solution`, and which misconceptions
each distractor carries. The engine fills the numbers and `checkMathsItem` verifies the whole
item. Batch 02 built this way: **12 items, 0 defects.** Two-pass review is annie's, same
contract as batch 01. Batches ship in 40s.

## Executor audit (2026-08-06) — a wrong executor is a class of failure

The gate verifies `distractor == executor(operands)`, so an executor that encodes the
WRONG error produces a wrong-but-self-consistent distractor the gate blesses (annie caught
one by hand). Audited all 18 executors against their descriptions:

**Fixed now:**
- **#9 rounding-misdirection (always down)** — was `floor(value)` (3847→3847, the unrounded
  number). Now rounds DOWN to a `place` operand: `floor(value/place)*place` (3847, place 1000
  → 3000). Missing `place` returns null — a visible gap, not a silent floor. *This is the bug
  annie flagged; she named #10, but #10's definition is .5-halves — the floor≠place bug is #9.*
- **#10 rounding-exact-halves** — same floor code, now place-relative too (25, place 10 → 20).

**Held for annie (report before fixing — each is a semantic call):**
- **#25 confusing-thirds-and-tenths** — the error reads the DENOMINATOR ("1/3 → 0.3" writes the
  *bottom*), but the executor reads operand `numerator`. It only gives the right value if the
  caller feeds the denominator in as `numerator` — a mislabel. Rename the operand to `denominator`.
- **#31 dropping-the-zero-in-money** — produces a value NUMERICALLY EQUAL to the key (£3.5 = £3.50
  under numeric compare), so it can't be a distractor at all. It's a notation error — reclassify
  as conceptual, or the money gate needs string-exact compare.
- **#1 zero-placeholder-missing** — removes ALL zeros, not just the internal placeholder (3040→34,
  1000→0). Over-applies on multi-zero numbers; should drop one placeholder.

**Verified correct:** #6 #8 #11 #16 #22 #26 #32 #37 #51 #52 #56 #57 #98. (Note #56 is
incomplete-MEAN — sum without dividing; my batch-02 mis-used it as a total. Authoring error, not
an executor one.)

## Two tags per distractor — the join table (annie's decision, built)

`ItemOptionTag{optionId, misconceptionId, role: TOPIC|PROCESS}`, `@@unique([optionId, role])`.
The PROCESS tag is the derivable one — `checkMathsItem` executes `processMisconceptionId ?? misconceptionId`,
so a distractor's derivation runs on its process error while its topic id carries domain teaching in
the walk script, and (at serve time) the process tag owns the child-facing hint. Extensible: any
process error (stop-early, reversed-operation, off-by-one) is a PROCESS tag across topics.

## Authoring guidance (annie's mechanical test, 2026-08-06)

**Execute the description on the item's own numbers. If you must CHOOSE partway through
which error it is, it is two entries, not one.** A description that runs cleanly to a
single wrong number is one id; a description that forks — "does the first step, then
*either* stops *or* does the wrong second step" — is hiding two children under one label
and must be split. This is the test that catches a bundled id before it ships (it is why
`stop-early` cuts across eight topic ids — see the two-ids report).

### R11 and its parametric exemption (same shape as the lineup-odd documented exception)

R11 forbids **two options in one item under a single misconception** (the double-key the
place-value split — #61/#62 — was made to prevent). The **acknowledged exemption**: a
misconception that is genuinely *parameter-varied* — the same error read at a different
place, e.g. the wrong column at tens vs at thousands — may tag two options in one item,
*because it produces two different values*. The gate enforces the boundary automatically:
`checkMathsItem`'s `duplicate-id-same-value` rule permits a shared id with different values
(the parametric case) and blocks a shared id with the same value (the mislabel case). Like
lineup-odd's single-axis exception, this is a named, bounded permission — not a loophole.

## Annie's two rules — both now in the gate

1. **Duplicate ids within an item** are fine only where the same misconception is *parameter-varied*
   (wrong column at tens vs thousands) — which means a **different value**. `checkMathsItem` now
   raises `duplicate-id-same-value` when one id tags two distractors with the same value (self-tested).
2. **Converging routes** — where two errors land on one number, tag it to the more common route and
   the hint must serve both children. This is a review judgement (it can't be mechanised — the "more
   common" route is pedagogical), carried on the item's `reviewNote`, as done for CALC-07's 42.

## What batch 02 proves, and what the volume needs next

Batch 02 uses **only executor-covered misconceptions**, so every value is machine-safe — but that
caps most items at one or two distractors. Reaching the full **four options** GL uses (key + 3) at
900-item scale needs the **executor library widened** so three distinct derivable errors apply per
item. Current coverage (`check:maths-distractors` reports it live):

- **Covered** (17+ executors): commutative subtraction, ×10-adds-a-zero, add-num-and-denom,
  thirds/tenths, percent-as-unit, base-100 time, metric-prefix, ratio-to-fraction, reversing
  division, incomplete total, median-for-mean, digit-dropped (#98), …
- **Gaps to executor next** (the tranche): wrong-operation-chosen (#72, needs the item's intended
  op), rounded-without-compensating (#99), steps-out-of-order (#100), place-value column reads
  (#61/#62 parameterised by column — the exact case annie's duplicate-id rule is written for).
- **Conceptual** (review-only, never gated): #15 #20 #27 #28 #30 #40 #41 #42 #43 #49 #50 #58 #59 #101.

**Order of work:** widen the executors above → author shapes per Case against `maths-district-plan.json`
(strand × engine × order) → generate in 40s → annie's two-pass → import DRAFT → publish via the
written-review path. The gate stands between every batch and a child.
