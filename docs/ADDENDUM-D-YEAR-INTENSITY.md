# ADDENDUM D: THE YEAR MODEL AND PROGRAMME INTENSITY
### ClueCrew Build Bible — Addendum — v1.0
**Modifies Phase 1 schema, Phase 2 onboarding, Phase 3 config, Addendum C. Manifesto wins conflicts. Purpose: make the child's school year an accurate, self-maintaining fact, and consolidate every intensity decision into one declared model — so a Year 4 and a Year 5 child on the same product get visibly, deliberately different programmes.**

---

## 1. THE YEAR MODEL (fixing the staleness bug)

`yearGroup Int` as a static field goes stale every 1 September — a child entered as Year 4 in March is Year 5 by October, and every runway and pacing calculation quietly rots. Replace with:

- Schema: `yearGroupAtCapture Int` + `capturedAcademicYear Int` (e.g. 2026 = academic year 2026/27). **Effective year group is always derived**: `yearGroupAtCapture + (currentAcademicYear − capturedAcademicYear)`, computed in `core/year.ts`, never stored denormalised.
- **September rollover beat:** on each 1 September, Parent HQ + weekly email confirm the derived change ("Amara starts Year 5 this week — her programme steps up gently from today. Tap here if that's not right."). One-tap correction; corrections update capture fields with an audit event.
- **Onboarding wording fix (summer ambiguity):** parents signing up in July–August routinely mean the *incoming* year. The wizard asks: "Which year group is [name] in from this September?" with the academic year named explicitly. This one sentence prevents a full-year pacing error for every summer signup — and summer is the signup peak in this market.
- Validation: yearGroup × examYear combinations outside the plausible set (exam sits at the start of Year 6) trigger advisory copy, not blocks ("Most children sit the test in September of Year 6 — that would make [name]'s exam [year]. Keep your dates if you know better; schools vary.").
- Supported range: Years 3–6. Year 3 is accepted as an early start and maps to the gentlest column of the matrix (no marketing may *encourage* Year 3 starts — mission stance, recorded here).

## 2. THE INTENSITY MATRIX (one model, declared, config-driven)

Intensity was previously scattered (Phase 3 exam-horizon compression, Addendum C runway scaling, cadence config). Consolidate into `core/intensity.ts`, driven by **two inputs only: effective year group and runway (days to exam)** — runway leads, year group guards.

| Lever | Y3–4 / >18mo runway | Y5 / 18–9mo | Y5–6 / 9–4mo | Final stretch <4mo |
|---|---|---|---|---|
| New-case pacing | Slow: 1 new case per ~2 wks/district; play-forward | Steady: ~1/wk | Coverage-driven: pace to complete blueprint types by −4mo | **No new types**; consolidation only |
| Review load cap (per session) | 8 | 10 | 12 | 12, overdue-first |
| Boss Round size (Add. C) | 1 | 3 | 3 | 5 |
| Fluency thread | Off (Y3) / light | Light | Standard | Standard |
| Mock ladder | Locked (floor can't be met early anyway) | HALF reachable | FULL reachable; cadence suggests monthly | Cadence suggests fortnightly |
| Weekly session target (streak) | 4 | 5 | 5 | 5 |
| Parent copy register | "building foundations" | "building the toolkit" | "putting it together" | "staying sharp, staying calm" |

- **The "no new types in the final stretch" rule is the matrix's most important cell:** teaching a brand-new question type three weeks before the exam manufactures anxiety for marginal marks. Coverage completion is therefore a *pacing target at −4 months*, and the readiness meter surfaces it to parents well before it becomes urgent.
- All values are config, ratified by David + reviewer, and revisited against cohort-one data (same 8-week calendar rule as Addendum C thresholds).

## 3. WHAT INTENSITY NEVER TOUCHES (the calm-beats-cram line, restated as law)

- **The 15-minute session cap does not scale. Ever.** Intensity is *composition* (what fills the minutes), never duration. Final-stretch families asking for more get the authored Casebook answer: focused daily quarter-hours beat weekend marathons, plus weekend Boss Cases when unlocked. (Clarification, now explicit: **mock sittings are parent-scheduled separate events outside the daily session and its cap** — a full paper is its own occasion; the cap governs the Daily Loop.)
- Streak forgiveness (2 days/week), no-red, no urgency language, and every D-law hold at every intensity. The final stretch gets *calmer* copy, not louder.
- Content ceiling guardrail: adaptive difficulty may stretch a strong child's *tier*, but new-case sequencing never front-runs the school curriculum by more than the district specs' stretch mapping — a strong Y4 goes deeper, not two years forward.

## 4. TOUCHPOINT CHANGES

- **Onboarding (Phase 2):** wording per §1; programme recommendation now reads from the matrix ("Year 4 from September → 2-Year Crew at foundations intensity").
- **Parent HQ:** the runway widget shows the current intensity column in plain words ("Steady build: one new case type a week, mock unlocks ahead") — parents see the *plan*, so the product's restraint reads as design, not absence.
- **Weekly email:** September rollover beat; intensity-column transitions get one calm line ("From this month we stop introducing new question types and sharpen what's there — this is deliberate.").
- **Summer Intensive tier:** maps to the final-stretch column by definition; its 8-week programme is a preset walk through consolidation + mock ladder, not a separate engine.

## 5. EVENTS AND DATA

`year_rollover_confirmed/corrected`, `intensity_column_changed`. `ReadinessSnapshot` gains `intensityColumn`. No new personal data; DPIA note: derived year group documented as computed, not collected.

## 6. GATE CHECKLIST

1. `core/year.ts` unit-tested across capture/rollover/correction cases incl. capture-in-August edge; no denormalised year stored anywhere (schema check).
2. Time-mocked journey: child captured summer-2026 as "Year 4 from September" rolls to Year 5 on 1 Sep 2027; parent beat fires; correction path works and audits.
3. Simulation suite re-run per intensity column: cap never exceeded; struggling profiles still land in the 70–85% band; final-stretch profile receives zero new types.
4. Matrix config ratified by David + reviewer; values documented with rationale in `/docs/psychometric... /docs/pedagogy-decisions.md`.
5. Onboarding wording tested with 3 summer-scenario parents: all three correctly interpret "from this September".
6. Parent HQ intensity copy + email transition lines pass banned-vocab and no-urgency review.
7. Mock-sitting-outside-cap clarification reflected in parent copy ("mocks are their own occasion — pick a calm morning").
8. Full-journey staging test: Y4 two-year child and Y5 one-year child compared side-by-side — pacing, Boss Round size, and mock availability visibly differ per matrix.

---
*Changelog: v1.0 — year model with rollover, consolidated intensity matrix, calm-line clarifications.*
