# ADDENDUM C: READINESS AND THE MOCK LADDER
### ClueCrew Build Bible — Addendum — v1.0
**Modifies Phase 3 §4 (session closer) and Addendum B §3 (mock scheduling). Manifesto and Addenda A–B win conflicts. Purpose: a daily mini-mock inside every session, and a readiness threshold that gates access to half and full papers — so no child ever sits a paper they haven't been prepared for.**

---

## 1. THE LADDER (canonical vocabulary additions)

| Rung | Name | What it is | When |
|---|---|---|---|
| 1 | **Boss Round** | 1–5 exam-format questions closing every session (replaces the single-item closer) | Every session, always |
| 2 | **Half Boss Case** | Half-length paper from a blueprint (the Addendum B half-paper variant, now a first-class rung) | Unlocks at the HALF threshold |
| 3 | **Boss Case** | Full blueprint paper per Addendum B | Unlocks at the FULL threshold |

## 2. THE BOSS ROUND (Phase 3 session engine change)

- **Composition:** Plain-mode rendering, mixed question types the child has already been taught, drawn from the **PRACTICE pool only** (never MOCK — Addendum B's exposure/burn protection applies exclusively to papers), preferring items unseen in the last 14 days, at the child's current tier (fairness: the Boss Round measures transfer, not stretch).
- **Runway scaling (resolves the D2 tension — the session stays ≤15 min):** questions per Boss Round = 1 (>9 months to exam) → 3 (9–4 months) → 5 (<4 months). Focus-case time yields the difference. Config values, not code.
- **Framing (Addendum A voice):** "Boss Round. [Three] quick ones — real exam rules." No tools, no hints, no mascot until the round ends. After: mascot returns for the wind-down; misses are NOT reviewed in the moment (no post-round teaching beat — the round closes the session; missed types are picked up by the scheduler as review priority next session instead). Child sees no score, ever; completion is the beat.
- **Once multiple districts are live**, Boss Rounds mix districts by the child's active programme — the only place in daily play where VR and Maths interleave in exam format, which is exactly what the real day demands.

## 3. READINESS MODEL (`core/readiness.ts` — new, pure, tested)

Per child, per district, per target blueprint, recomputed nightly and on session end:

- **Coverage:** % of the blueprint's `typeMix` question types whose CaseFile mastery ≥ 0.55 ("taught and progressing"), and % of district cases cracked (≥0.8).
- **Transfer:** rolling Boss Round accuracy over the last 20 Boss Round items (the Plain-mode signal — this is what mocks actually test).
- **Rhythm:** streak-weeks in the last 6 (a proxy for practice consistency; never shown as a judgement).

**Thresholds (config, ratified by David + reviewer; launch defaults):**
- **HALF unlock:** coverage ≥ 100% of blueprint types at "progressing" + ≥40% cases cracked + transfer ≥ 50%.
- **FULL unlock:** ≥60% cases cracked + transfer ≥ 60% + at least one completed Half Boss Case.
- **Hard floor (no override, stated plainly):** no paper — half or full — may contain a question type the child has never been taught. This is a fairness law, not a setting. Parent-facing copy explains why: "A mock should measure readiness, not surprise."

## 4. PARENT EXPERIENCE (Parent HQ + weekly email)

- **Readiness meter** per district: a progress view framed as building toward the mock ("Mock unlocks when the last 3 case types are underway — currently: Letter Series, Compound Words, Two Meanings"), always naming what's left, never a percentage judgement of the child.
- When HALF or FULL unlocks: dashboard beat + a line in the weekly email ("Amara's first half-paper is ready when you are — here's how to set the room up"), linking the exam-day one-pager.
- **No parent override below the hard floor.** Above the floor but below threshold, a parent may request an early Half Boss Case via a deliberate flow that shows the readiness picture first ("You can go ahead — here's what the mock will and won't tell you yet"). Full papers are never available below FULL threshold. Addendum B's 7-day frequency cap stands above all unlocks.
- Programme cadence (Phase 6) reframes: cadence now *suggests* mock timing once unlocked, rather than scheduling regardless of readiness.

## 5. DATA AND EVENTS

`ReadinessSnapshot {childId, district, blueprintId, coveragePct, crackedPct, transferPct, tier, computedAt}` (nightly, feeds the meter and the L1 evidence base). Events: `boss_round_started/completed`, `readiness_half_unlocked`, `readiness_full_unlocked`, `early_half_requested`. IDs and enums only, as ever.

## 6. NON-GOALS

No child-visible readiness scores or meters (the child's world stays cases and ranks; readiness is parent-facing). No pass-prediction anywhere (L1 — readiness ≠ likelihood, and no copy may imply it). No change to the session cap, streak logic, or Mode framework. No shortening of full blueprints (the Half Boss Case is its own blueprint variant, authored, not a truncation at runtime).

## 7. GATE CHECKLIST

1. Session simulation re-run (Phase 3 suite) with Boss Rounds at all three runway scalings: cap never exceeded; struggling-profile sessions still end on completion beats.
2. Pool proof: Boss Round can never draw a MOCK item (core test); 14-day recency preference verified.
3. Hard floor proof: attempt to compose any paper containing an untaught type fails, for parent-request and cadence paths alike.
4. Threshold walk-through in staging with a time-mocked child journey: HALF unlocks, Half Boss Case completes, FULL unlocks, Boss Case sits — events and parent beats fire in order.
5. Readiness meter and early-request flow reviewed by two parents from the test pool: does "what's left" framing read as building, not judging? Copy adjusted until yes.
6. Weekly email unlock lines render correctly; banned-claims scan green (no prediction language anywhere, including "ready to pass").
7. David + reviewer ratify the threshold defaults against real children's data from the first cohort within 8 weeks of launch (calendar reminder in the runbook — these numbers are starting points, not truths).
8. Half Boss Case blueprints authored and reviewer-verified for VR and Maths (composition = representative type spread at half length, not a truncation).

---
*Changelog: v1.0 — Boss Rounds, readiness model, mock ladder gating.*
