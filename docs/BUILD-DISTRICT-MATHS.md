# BUILD-DISTRICT-MATHS: THE MATHS DISTRICT
### ClueCrew Build Bible — District Expansion 1 — v1.0
**Prerequisites: CLUECREW-MANIFESTO.md + ADDENDUM-A (both win conflicts) + Phases 1–6 machinery. This spec adds a district to the existing engine: it defines maths question types, five new interaction engines, content standards and volumes. It changes nothing in `/packages/core` learning logic — mastery, scheduling, adaptivity, sessions and Modes all apply unchanged. District accent: `maths-green`. Build order note: Maths jumps NVR by David's decision (every region tests maths; commercial priority).**

---

## 1. WHAT "11+ LEVEL" MEANS (the standard this district is built to)

- **Base:** KS2 National Curriculum through end of Year 5, complete coverage.
- **Stretch:** selected Year 6 content and up-tempo application, because GL-style papers pitch ahead of school pace (research finding; recorded in the first market report).
- **Format truth:** GL maths is multiple-choice, roughly a question a minute, word-problem heavy, no negative marking. Therefore: Plain mode is GL-faithful MC; every topic trains through worded, multi-step application, not just naked calculation.
- **Difficulty tiers (existing 1–5 field) map to:** T1 = secure Y4 · T2 = early Y5 · T3 = secure Y5 (the GL centre of gravity) · T4 = Y5+/early Y6 stretch · T5 = super-selective stretch (multi-step, unfamiliar contexts). Adaptive engine behaviour unchanged.
- **Coverage attestation:** a qualified KS2 maths reviewer signs a coverage map (curriculum objective → Cases → item counts per tier) before the district gate. "11+ level" is attested by a specialist, not assumed by us.

## 2. THE STRANDS AND THE FIVE MATHS ENGINES

Six content strands collapse into five interaction engines (same consolidation logic as VR's 21→5):

| Engine | Strands served | Core interaction |
|---|---|---|
| **NUMBER FORGE** | Number & place value; four operations; sequences; times-table and fact fluency | Quick-fire fluency rounds; **Estimation Duels** ("closer to 300 or 500?") vs the clock-free mascot; number-line and place-value-chart manipulatives |
| **THE WORKSHOP** | Word problems across ALL strands: fractions/decimals/percentages, ratio & proportion, money, time, measures, early algebra | **The Bar Model Builder** (flagship, §3): drag-to-build Singapore-style bar models beside every word problem; missing-number machines for algebra |
| **MARK THE HOMEWORK** | Cross-strand error-spotting | A worked solution with one authored mistake; the child finds the wrong step, then fixes it. Works over every topic; doubles as Walk-mode's assessment twin |
| **DATA DESK** | Statistics: tables, bar charts, line graphs, pictograms, timetables | Read-and-interrogate: tap the chart region that answers the question; build-the-chart from data; timetable journey planning |
| **SHAPE SHOP** | Geometry: 2D/3D properties, angles, symmetry, area/perimeter, position & coordinates | Direct manipulation: drag mirror lines, rotate shapes, stretch rectangles and watch area/perimeter update live, plot coordinates by tap |

Every engine renders **Case mode + Plain mode from the same item rows** (the Phase 4 transfer principle, unchanged and non-negotiable). The Workshop's Bar Model Builder is the Alphabet Rail of this district: big on-stage in See-it Mode → optional side tool in practice → **absent in Plain mode**. Scaffold fading built into the furniture, again.

## 3. THE BAR MODEL BUILDER (flagship component)

- Child drags bars, splits them into equal parts, labels values/unknowns; the model sits beside the word problem; a "does my model match the story?" check is authored per item (not inferred).
- Every Workshop item ships with an **authored reference model** so See-it Mode can animate story → model → equation → answer, and Mark-the-Homework can show broken models.
- Interaction: tap-tap parity with drag (Phase 4 accessibility rule); works at tablet-landscape sizes per D-laws; reduced-motion swaps animation for stepped stills.
- This component is the district's biggest engineering item and its biggest differentiator (UK platforms barely touch bar modelling — first market report).

## 4. CASES

**~36 Cases** across the strands (indicative: Number 8 · Operations 6 · Fractions/Decimals/Percentages 6 · Ratio/Proportion 3 · Algebra 2 · Measures incl. money/time 4 · Geometry 4 · Statistics 3), sequenced by `orderInDistrict` following a mastery-logical progression (place value before operations before fractions; measures interleaved). Each Case = one concept cluster with all five Modes (P1 unchanged): Watch (≤90s, animated concept), Walk (faded worked example — the maths Walk uses the CPA arc: concrete manipulative → pictorial/bar → abstract method), See (the strand's manipulative), Hear (audio), Try (engine practice). Narrative frame: the maths district is the city's **Workshop quarter** — cases are jobs to price, build, fix and supply; the maths is the tool, never the toll (design decision from the original product conversation; narrative ≤30s per D5).

## 5. ITEMS AND THE MISCONCEPTION ADVANTAGE

- **Volume gate: ≥25 LIVE items per Case across tiers 1–4 (≈900 items), plus a T5 stretch pool of ≥150.** This is the biggest authoring lift of any district — planned, not discovered.
- **Maths' structural advantage #1 — machine-verifiable keys:** every item's correct answer is computed, not asserted. The authoring pipeline REQUIRES a `solution` expression per item; CI recomputes and fails on mismatch. AI-drafted items therefore cannot ship a wrong key. (This kills the hallucinated-answer-key risk flagged in the AI-authoring research.)
- **Maths' structural advantage #2 — the misconception literature:** maths errors are the best-documented in education research (place-value slips, "multiplication always makes bigger", larger-denominator-larger-fraction, perimeter/area confusion, misread scales, inverse-operation errors, unit muddles). The Misconception library for this district is seeded from that literature by the specialist reviewer BEFORE bulk item drafting, and P3 stands: every distractor maps to a tagged misconception — in maths, distractors should BE the result of executing the misconception ("what answer does the place-value slip produce?"), which is exactly how GL-style distractors behave.
- Numeric entry exists ONLY inside NUMBER FORGE fluency drills (number-pad component); everything item-bank-assessed is MC, matching GL.
- Word-problem house style: UK contexts, plain names, no cultural assumptions that disadvantage EAL families (reviewer checks), reading age ≤9 for problem text even when the maths is T5 — we test maths, not decoding (accessibility law in spirit).

## 6. FLUENCY LAYER

A light daily fluency thread inside warm-ups (times tables to 12×12, number bonds, doubling/halving): 60–90 seconds, streak-safe, untimed-feeling (progress by questions, not a countdown — D-laws). Fluency mastery feeds the adaptive engine's readiness signals for Operations/Fractions cases. No leaderboards, obviously.

## 7. VOICE AND JUICE (Addendum A applies; district-specific additions)

- Correct-beat variants for maths name the method: "Bar model told the story." · "You spotted the place-value trap." · "Estimated first — that's the pro move." (≥6 variants per beat rule stands.)
- Juice: bars snap-and-fill with weight; place-value counters clink into columns; the Workshop stamp on case-cracked is a brass tool-stamp variant of the ceremony (same ≤2.5s spec).
- Banned framing extends: never "maths person/not a maths person", never speed pressure language ("quick!", "hurry") anywhere child-facing including fluency.

## 8. CONTENT PIPELINE AND PEOPLE

Same pipeline as VR (AI-draft → human review → misconception tagging → LIVE) with the solution-verification CI added. **Blocking dependency: a KS2 maths specialist reviewer** (may be the existing 11+ reviewer if maths-qualified; otherwise a second hire). Their pre-drafting deliverables: the misconception seed library (≥60 tagged misconceptions), the coverage map, and the T-tier exemplars per strand that anchor difficulty calibration. Estimated review load at VR rates: ~900 items ≈ 45–60 hours.

## 9. NON-GOALS

No calculator features (11+ is non-calculator). No Y6 SATs-specific content beyond the stretch selections. No handwriting/working-out capture. No changes to core engine, session shape, or Mode framework. NVR/English districts. Printable worksheets.

## 10. GATE CHECKLIST

1. All five engines demonstrated Case-mode + Plain-mode from the same rows; Bar Model Builder passes tablet-landscape + tap-tap + reduced-motion checks on the budget device.
2. Coverage map signed by the specialist reviewer: every KS2 objective through Y5 mapped, stretch selections listed, no orphan objectives.
3. Volume gate met: ≥25 LIVE per Case, T5 pool ≥150; CI solution-verification demonstrably fails a deliberately wrong key.
4. Misconception audit: sample 30 items; every distractor executes its tagged misconception; hints read kindly (Addendum voice).
5. Transfer test in child testing (≥6 children, existing protocol): succeed in Workshop with bar models → same question types in Plain mode without the Builder. Collapse = redesign before gate, per the Phase 4 rule.
6. Fluency thread: 10 sessions simulated; never exceeds 90s; no urgency language; streak logic unaffected.
7. Word-problem readability lint (≤9) green across all LIVE items; EAL/context review recorded by reviewer.
8. Estimation Duel and Mark-the-Homework each play-tested by David plus at least two children; observed enjoyment noted honestly (if Mark-the-Homework doesn't land with kids, flag for redesign — its pedagogy only works if they opt in).
9. District map, case art, and Workshop stamp integrated at Phase-5 art standard; performance budgets still green with the Builder loaded.
10. Boss Cases can assemble mixed VR+Maths papers; child results framing and parent score views verified for two-district children.
11. DPIA/D-law sweep: no new data collected; banned-vocab scan green including new strings.

---
*Changelog: v1.0 — initial Maths District spec; build order amended (Maths before NVR) by David's decision.*
*Changelog addendum (2026-08-01, David's ruling): the "Case shells" deliverable is RATIFIED as the 36-slot engineering plan (content/maths-district-plan.json — strand × engine × order); Case rows, titles and narratives remain reviewer-pipeline content. Also ratified: the fluency thread (§6) is a spec'd core change — warm-up composition gains the round, its seconds charged against the D2 cap, presence governed by the Addendum D intensity columns.*
