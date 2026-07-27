# BUILD-PHASE-3: THE LEARNING ENGINE
### ClueCrew Build Bible — Phase 3 of 6 — v1.0
**Prerequisites: manifesto + passed Phase 1–2 gates. All logic in this phase lives in `/packages/core` as pure, framework-free, unit-tested TypeScript. Phase 4 consumes it through the API surface in §9; nothing here renders UI.**

**Phase 3 delivers the invisible machinery: mastery, scheduling, adaptivity, sessions, streaks, ranks, and the five-Mode content framework. The pedagogy laws (P1–P5) and design laws D2–D3 become executable code here.**

---

## 1. MASTERY MODEL (`core/mastery.ts`)

Per `CaseFile` (question type) and per `WordVaultEntry`, `masteryLevel ∈ [0,1]`:

- Update on every attempt: exponential moving average — `m' = m + α(target − m)` where `target = 1` for correct, `0` for incorrect, and `α` scales with item difficulty relative to the child's current level (harder-than-level correct answers move mastery more; easier-than-level misses move it down less: a miss on an easy item is noise, not collapse).
- Time decay: mastery decays toward 0.6× its value over 45 days without practice, applied lazily at read time. Decay never drops a "cracked" case below the review threshold — it triggers review scheduling instead (P2), it does not punish.
- Thresholds (config, not code): `0.55` = progressing, `0.8` = **case cracked** (sets `solvedAt`, enters long-term review rotation), `<0.4` after ≥10 attempts = **needs a different way in** → engine flags the CaseFile to resurface a not-yet-tried Mode before more practice (P1 doing real work, not decoration).

## 2. ADAPTIVE DIFFICULTY (`core/adaptivity.ts`)

- Target success band **70–85%** rolling over the last 10 attempts per question type (P5).
- Item selection: choose from `LIVE` items of the type at `difficultyTier` matching the child's estimated level; above the band → step up a tier; below → step down. Tier estimate moves one step at a time, never jumps.
- **Anti-frustration rules (hard):** after 2 consecutive misses, next item is one tier easier AND the engine offers (not forces) a Mode revisit. After 3 consecutive misses, the current activity ends with the mascot's `encouraging` state and an authored "let's look at this another way" transition — never a fourth consecutive miss on the same type in one session. This rule outranks the band.
- Confidence-building open: the first item of any type in any session sits one tier below estimate. Cheap, humane, evidence-aligned (success early stabilises effort).
- Nightly job (`core/calibration.ts`): recompute `Item.calibratedDifficulty` from aggregate attempt data (proportion-correct blended by attempt volume; simple empirical calibration now, IRT later if ever needed). Items whose calibrated value drifts ≥1.5 tiers from authored tier are flagged to the CMS review queue — this is the live QC net for authoring errors, including AI-drafted ones.

## 3. SPACED REPETITION (`core/scheduler.ts`)

SM-2 family, tuned for children and an exam horizon:

- On review success: `interval' = interval × easeFactor`, ease +0.05 (cap 2.6). On lapse: ease −0.2 (floor 1.3), interval resets to 1 day, `lapses++`.
- Child-tuned bounds: first intervals 1 → 3 → 7 days; **max interval 21 days** (an adult SRS happily says "see you in 6 months"; a child sitting an exam cannot).
- **Exam-horizon compression:** all intervals are additionally capped at `daysUntilExam / 4`, so review frequency automatically tightens as the exam approaches with no separate "revision mode" to build or explain.
- Review pool per session = due `ReviewSchedule` rows, priority: overdue-longest first, then lapse count, then words before types (vocabulary is the compounding asset). Daily review load is capped (config: 12 units) — overflow rolls forward silently; the child never sees a backlog number (D-law spirit: no debt anxiety mechanics).

## 4. SESSION ENGINE (`core/session.ts`)

The Daily Loop (manifesto pillar 3), composed per session start:
1. **Warm-up** (~3 min): 4–6 due review units + 3 Word Vault cards. Every session opens with retrieval, no exceptions (P2).
2. **Focus Case** (~9 min): current Case; if the CaseFile is flagged "different way in", Mode content precedes practice.
3. **Boss-style closer** (1 item): one exam-formatted question (plain rendering) so test formatting stays familiar (P4). Correct or not, session ends on the authored completion beat.

- **15-minute cap (D2):** at 13 minutes the engine stops issuing new items and routes to the closer + wind-down. `secondsActive` counts foreground interaction only. A child may stop at any moment; partial sessions record everything and punish nothing. There is no mechanism to extend the session; a parent setting can *shorten* it (10 min), never lengthen it.
- **Streaks (D2/D3):** a streak week is intact with ≥5 active days of ≥5 minutes. Two forgiveness days per week are automatic and invisible — the child only ever sees the streak alive or gently "rekindled", never "broken", and never sees the forgiveness ledger. No streak-loss animations exist.
- One session per child at a time; concurrent-device attempts resolve to the newest session.

## 5. THE FIVE MODES (`core/modes.ts`) — and the L2 firewall

- Every Case's `modes` manifest must contain all five: `watch` (≤90s video ref), `walk` (faded worked-example script: guided → half-guided → solo), `see` (interactive visual/manipulative component ref), `hear` (audio ref), `try` (practice entry). CI validates completeness before a Case can go live (P1).
- The child chooses Modes freely; the UI may default to the child's most recently chosen Mode **as a convenience only**.
- **The L2 firewall, stated for the engine explicitly: the system must not compute, store, or infer any "preferred learning style", modality profile, or learner-type label from Mode choices — no field, no derived analytics dimension, no recommendation weighting by modality. Mode choice history exists only as raw events and the single "last used" pointer.** Any future feature wanting modality inference must amend the manifesto first. Reviewer instruction: reject any PR adding a modality-shaped column or score.

## 6. TEACH-BACK ENGINE (`core/teachback.ts`)

Trigger: a case is cracked (≥0.8) or a review succeeds on a previously lapsed unit. The engine selects an authored misconception for that type, presents the mascot's wrong answer + the misconception's authored working, and asks the child to (a) spot the wrong step and (b) pick the correction (both from authored options — evaluation is deterministic, no free-text marking). Success grants the case file a `taughtBack` badge and a small mastery bump. All content comes from the `Misconception` table; the engine never generates text (S3).

## 7. RANKS (`core/ranks.ts`)

Rank advances on **cases cracked + review consistency**, never on volume alone (grinding easy items must not rank a child up): Trainee→Junior 3 cases; Junior→Detective 7 cases + 2 streak-weeks; Detective→Senior 12 cases + 1 taught-back; Senior→Chief 18 cases + boss-case participation. Thresholds in config. Rank never decreases (D-laws: no loss mechanics).

## 8. EVENTS

Extend the Phase 1 vocabulary: `warmup_item_result`, `mode_opened`, `mode_completed`, `difficulty_stepped`, `frustration_break_triggered`, `review_due_served`, `teachback_completed`, `streak_week_earned`, `session_capped`. Same rule: IDs and enums only, never content.

## 9. API SURFACE FOR PHASE 4 (`core/index.ts`)

`startSession(childId)`, `nextActivity(sessionId)` (returns a discriminated union: warmup_item | mode_content | practice_item | teachback | closer | wind_down), `submitAttempt(...)`, `chooseMode(...)`, `endSession(...)`, `getCrewState(childId)` (ranks, streak, due counts, casefile summaries for HQ rendering). Phase 4 renders states; it makes no pedagogical decisions. That boundary is the anti-drift line for the whole child app.

## 10. SIMULATION TESTING (required, not optional)

`/packages/core/sim/`: scripted synthetic learners (fast, average, struggling, erratic, 3-day-absent, 30-day-absent) run 90 simulated days each. Assertions: success rate converges into 70–85% band for all profiles; no simulated learner ever sees 4 consecutive misses; struggling profile's sessions end on completion beats, not frustration breaks, in ≥80% of sessions; review load never exceeds cap; exam-horizon compression tightens intervals as expected; mastery decay never un-cracks a case. These simulations are the pedagogy laws' unit tests and run in CI.

## 11. NON-GOALS

No UI, no real content authoring, no writing feedback, no mock-exam assembly (Phase 6), no ML/embedding-based personalisation, no IRT.

## 12. GATE CHECKLIST

1. `/packages/core` has zero framework imports; 90%+ line coverage on mastery, scheduler, adaptivity, session.
2. Simulation suite passes; David reviews the plotted difficulty/mastery curves for the six profiles (a one-page HTML report the sim emits) and confirms they *feel* right for real children.
3. Time-travel test: a child 30 days from exam shows compressed review intervals vs. 300 days out.
4. Frustration-rule test transcript reviewed: the 2-miss and 3-miss behaviours read as kind, not clinical.
5. Grep + schema check: no field, metric, or analytics dimension resembling a modality/learning-style profile exists (L2 firewall).
6. Streak logic: forgiveness invisible in every API response; no "broken" state representable.
7. Session cap fires at 13 min in a clock-mocked test; no code path issues a new practice item after it.
8. Calibration job flags a deliberately mis-tiered seed item to the CMS queue.
9. Events emit for a full simulated session with correct names and no content payloads.
10. DPIA updated: derived mastery/scheduling data documented as pseudonymised learning records.

---
*Changelog: v1.0 — initial Phase 3 spec.*
