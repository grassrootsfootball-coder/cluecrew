# MATHS: THE SCOPE LINE
### Ratified by David, August 2026. This document closes the maths district.
**Everything not listed under DONE MEANS is v2. A finding that arrives after this line is recorded and shipped later, not fixed now. This applies to findings from anyone — reviewer, agent, or David.**

---

## DONE MEANS

1. **Nineteen template families signed** by the specialist reviewer, at 30 sample items per tier, with each sheet showing the number ranges and the tier rule alongside the outputs. *(Revised from sixteen, 2026-08-07. The change is splits-and-one-orphan, not scope creep: +2 for Annie splitting P-5 into percentage and ratio-share and P-6 into metric-conversion and time-interval; +1 for geometry splitting on her axis into calculate-from-numbers and read-a-diagram; +1 for inverse-reasoning becoming its own family, resolving the algebra and reverse-mean orphans; −1 for scale-reading folding into the reading family. **All nineteen are built and gated** (inverse-reasoning landed 2026-08-07 on Annie's two new ids #109/#110, three reassignments, and the widened PROC-01). Signing is the remaining step.)*
2. **The seven non-parameterisable shapes hand-authored** — 12–18 items, the multi-step and interpretation items a template can't make. Authored by the reviewer, reviewed as items.
3. **The 40 already-approved items** (batch 01) retained as a distinct set, tagged `approved-item-by-item`.
4. **Notation fixed at source** — £, °C, cm² rendered correctly wherever stems are produced, not patched per batch.
5. **The gate green** on generated output: every key recomputes, no distractor equals a key or repeats within an item, every PROC-01 item carries valid `firstStepResults`.

That is the district. When those five are true, maths ships.

## EXPLICITLY OUT — RECORDED AS V2

- Any template family beyond the nineteen.
- **The READING family** (scale-reading + chart-reading + geometry diagram-reading — read a figure to find the numbers before calculating). V2 for three reasons, 2026-08-07: it needs a **chart/diagram render component that does not exist** (a text-only generator cannot pose "read this axis"); it would be the **only all-authored family** in the district (no executor covers axis- or diagram-reading, so its guarantee is weakest); and the DONE-1 target is **already met at 18 built without it**. Recorded with its reasoning rather than dropped silently — when a render component exists, it is the first v2 family to build.
  - **Coverage sizing (per `MATHSSHAPEINVENTORY.md`).** Read-a-value-off-a-chart/table is in the **Dominant band (≥ 8 % of a real paper)**; STATS is 12.2 % overall and "~1 in 5 GL items read a display" (that 20 % includes compute-from-a-display, which M-stats now generates). Batches 01–05 carry **~4 STATS items each (~10 %)**, but the *reading* subset — batch 01's retained table and bar-chart items — is smaller than that (the rest are mean/compute, now covered generatively). So the honest gap is **corpus ≥ 8 % chart/diagram reading vs a low-single-digit % actually shipped**: a real but modest gap, not the 20 % the display figure suggests. Worth building the family when a render component exists; not worth blocking the district for. *(Exact batch-01 chart-item count to be confirmed against the batch-01 file when it is to hand.)*
- Any shape the corpus shows at under 2% frequency.
- Executor implementation for entries currently classed derivable but unimplemented. Families depending on them ship with **authored** distractors, disclosed to the reviewer at signing so she knows what she is warranting.
- Tier-ladder refinements beyond the corpus weights (20/25/30/20/5).
- Any finding that improves an item that already passes the gate.
- The batches 02–05 hand-authored items, superseded by templates. Not re-reviewed, not re-tagged, not deleted — parked.

## WHAT HAPPENS TO A NEW FINDING

Recorded in the v2 log with its evidence, and **not acted on**. If a finding is a genuine child-facing fault — an unanswerable item, a defensible wrong answer, something that misleads — it is fixed and the fix is scoped to that item. Everything else waits.

The test: *would a child be marked wrong for reasoning correctly?* If no, it's v2.

## WORKING RULES THAT CAUSED THE LOOP, AND THE FIXES

**One owner per thread.** Maths templates belong to one agent end to end. Where a second is needed, the first hands over with the files, not with a summary. Two agents holding half a taxonomy each is how the last week went.

**No figures from memory.** Any count, id, or coverage number comes from a file or a query. "I don't have that" is the correct answer where it isn't to hand. Four fabricated figures in one week — 87 of 107, 28 primitives, 42 items, fifteen families — each cost a full round trip to disprove.

**Files travel with the request.** A prompt referencing a document includes its path, and the document is confirmed present before work starts. The calibration log has been found empty three times; exports have gone stale eight.

**The calibration log lives in the file, not the conversation.** R1–R12 written into the on-device skill, and every new rule appended there in the same action that agrees it.

## THE HONEST CAVEAT

The reviewer will keep finding real faults, because she is good at it and the content rewards scrutiny. Holding this line means shipping a district she could improve. That is the trade, made deliberately: a signed, gated, evidence-based maths district in weeks beats a perfect one in months, and v2 exists.
