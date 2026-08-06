# Maths calibration batch 01 — Annie's pass (2026-08-06)

Current reviewer (annie) over her predecessor (joan). 39/40 items approved, 119/120
distractors derivable. Everything below is recorded via the written-review path and,
where it touches a library entry, as an AttributionEvent (annie AMENDS/AUTHORS over joan).

## Applied

### 11 descriptions reframed — arithmetic verified before landing
Every value-pair recomputed by hand, not copied. All eleven hold as annie wrote them
(she had already corrected three of joan's originals — #11 stopped mid-method, #17 gave
only the child's output, maths-36 was out by four orders of magnitude):

| id | child → answer | check |
|---|---|---|
| #1 | 34 → 304 | drops the zero placeholder ✓ |
| #2 | 3004 → 304 | inserts an extra zero ✓ |
| #6 | 3.4×10=3.40 → 34 | decimal rule misapplied ✓ |
| #11 | 42−17=35 → 25 | 42−17=25; \|4−1\|,\|7−2\|=35 ✓ |
| #14 | 4+5=9+2 → 4+5=7+2 | writes total 9, balance needs 7 ✓ |
| #17 | 13÷5=2.3 → 2.6 | 13÷5=2.6; 2 r 3 → 2.3 ✓ |
| #22 | 1/2+1/3=2/5 → 5/6 | 5/6 correct; (1+1)/(2+3)=2/5 ✓ |
| #26 | 0.4=0.4% → 40% | 0.4=40% ✓ |
| #29 | 3/8>2/3 → 2/3>3/8 | 0.667>0.375; numerators 3>2 ✓ |
| #32 | 2:45+20=2:65 → 3:05 | 45+20=65 base-100 ✓ |
| #44 | 130° → 50° | supplement 180−130=50 ✓ (see check below) |

### Two governance checks
- **#11 — description and its distractors AGREE.** #11 (commutative subtraction) governs seven
  batch distractors (CALC-02 B 45, CALC-04 C 2.85, CALC-08 B 5472, MEAS-01 D £2.50, MEAS-02 B 65,
  GEOM-02 D 65°, STATS-02 D 11). Each is exactly column-wise \|larger−smaller\| of its item —
  e.g. 5.00−3.85 → 2.85, 180−125 → 065. The reframed 42−17=35 is the same error. Consistent.
- **#44 — no governed item in THIS batch.** Batch 01 has no protractor-reading item (GEOM is
  perimeter/area/straight-line/triangle). The pair is internally sound (a protractor misread returns
  the supplement, so 130 pairs with 50). **Confirm against the protractor item #44 actually governs
  before that item ships** — if it uses an angle other than 50°, the numbers won't match.

### Tier moves (field change, not rebuild)
`TIER_RULINGS` in `maths-calibration-source.ts`: **MEAS-03 and MEAS-06 → T3** (annie: unitary method,
two steps with an intermediate value to hold — secure Year 5), overriding joan's T2. **GEOM-06 stays T4.**

### Four splits — three ids become seven (#72 stays whole)
Narrowed: **#71** (quantity left out), **#89** (wrong angle total), **#74** (same numerator means equal).
Created: **#98** digit-dropped-in-column-work, **#99** rounded-without-compensating, **#100** steps-out-of-order,
**#101** unlike-denominators-cannot-be-compared. Library is now 101 entries. #98–101 continue the sequence
(no renumber needed — the library ran to 97).

**Retagging map for the volume run** (settle before the 900 tag against these):

| distractor | → id | | distractor | → id |
|---|---|---|---|---|
| CALC-01 D | #98 | | GEOM-06 A | #100 |
| CALC-02 D | #99 | | GEOM-06 D | #100 |
| CALC-08 D | #99 | | FDP-01 D | #101 |

Unchanged, now under narrowed definitions: CALC-04 B, CALC-07 B → #71; GEOM-02 A/C, GEOM-06 C → #89;
FDP-01 C → #74. CALC-07 D is out of the map (item held). **Library-wide re-read:** each narrowed entry now
describes less than it did, so anything ELSE in the library carrying #71/#89/#74 needs re-reading against
the new wording. In this batch that's the nine above, placed; outside it, unaudited.

## Held / reported (not rewritten)

### CALC-07 — CLOSED (annie: retag, don't change numbers). Batch is 40/40.
Stem: 4 boxes of 6 + 3 loose − 15 = **12**. **D fixed 21 → 27** (the true wrong-order value,
(4+3)×6−15). **C = 42 stays on #72 (wrong operation)** deliberately: two real routes converge on 42 —
add-for-subtract (27+15) and wrong-order ((4+3)×6) — and a distractor can't carry two tags; #72's hint
("check what the question is asking you to do") serves both children, which is the test. The collision is
**logged in the item's `reviewNote`** so it isn't rediscovered as a bug later.

### Notation — all three are SOURCE, not the export
- **Money inconsistent:** MEAS-01 uses £5 / £3.50; **CALC-04's stem writes "5.00 pounds" / "2.65 pounds"
  with bare-decimal options** (1.15). Standardise on the £ symbol.
- **Degree symbols:** GEOM-02 keeps "125°"; **NPV-05's stem reads "4C" / "9C"** with no degree mark. Source.
- **FDP-05 key mismatch:** `solutionValue` is **0.5** while the correct option reads **1/2**. If any import
  step keys on the string it won't find "0.5" among the options (the isKey flag is set, so answerability is
  safe, but the key field should read 1/2 to match).

**APPLIED to the batch (2026-08-06, backup `.bak-2026-08-06`):** money on the £ symbol throughout —
CALC-04, FDP-03, FDP-06 stems and options (the three that used the word "pounds"); degree marks on
NPV-05 (stem `4°C`/`9°C` and options); FDP-05 `solutionValue` stored as `1/2` to match its key option.

### The other 86 entries — 16 bare-example candidates (report only)
annie has seen 20; a scan of the rest flags **16** entries whose description carries a numeric example with
no correct value beside it — the maths-36 shape. The heuristic over-reports (some are prose-framed on a read),
so this is a candidate list for annie, not a rewrite:
#3, #16, #19, #21, #23, #25, #28, #30, #37, #40, #51, #52, #53, #59, #61, #78.
Highest-priority (a bare equation that reads as fact, exactly maths-36): **#37 "1kg = 100g"** (answer 1000g)
and **#25 "1/3 = 0.3"** (answer 0.333…). None shows an outright-wrong arithmetic like maths-36 did — they
state the child's error correctly — but they lack the correct-value frame.
