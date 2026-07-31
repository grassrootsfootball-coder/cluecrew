# ADDENDUM B: MOCK PAPERS (BOSS CASES, MADE REAL)
### ClueCrew Build Bible — Addendum — v1.0
**Extends Phase 6 §2 (Boss Cases) and BUILD-DISTRICT-MATHS gate 10. Manifesto and Addendum A win conflicts. Purpose: turn the existing assembly engine into genuine GL-style mock papers for VR and Maths, with valid measurement and honest reporting.**

---

## 1. THE EXPOSURE PROBLEM (the gap that would invalidate everything)

A mock only measures if the child hasn't seen its questions. Practice items the child has already met inflate mock scores and destroy the signal parents are paying attention to.

**Rule: mock items are held out from practice, permanently.**
- New field: `Item.pool ∈ {PRACTICE, MOCK}` (default PRACTICE). MOCK items are never served by the practice/warm-up/review engines, full stop; enforced in `core` item selection, tested.
- Once a child has sat a given paper, that paper's items are burned *for that child*: recomposition for their next mock draws items they've never seen. `MockSitting` records item IDs served per child.
- **Authoring implication (the real cost):** the mock pool is NEW volume on top of practice gates. Requirement: enough MOCK-pool items for **3 distinct full VR papers and 3 distinct full Maths papers** without reuse, per the blueprints in §2, before mocks go live per district. Same pipeline, same review standards, same misconception tagging (distractors still teach in the review screen), plus solution-verification CI for maths.

## 2. PAPER BLUEPRINTS (content, not code)

Real GL papers vary by region in length, timing and type mix, and they change; hardcoding a format would be wrong twice over. Blueprints are authored content:

```json
/content/blueprints/gl-vr-standard.json
{
  "id": "gl-vr-standard",
  "district": "VR",
  "title": "VR Paper — GL Standard Style",
  "sections": [
    { "instructions": "authored-page-ref", "questionCount": N,
      "typeMix": {"vr-03": 4, "vr-08": 4, ...}, "minutes": M }
  ],
  "notes": "Composition modelled on current GL familiarisation materials",
  "verifiedBy": "reviewer-name", "verifiedAt": "date", "sourceRef": "familiarisation edition"
}
```
- Ship with: `gl-vr-standard`, `gl-maths-standard`, plus region variants only where the Region Registry shows a materially different format. **Every blueprint's composition, timing and instruction wording is verified by the specialist reviewer against current familiarisation materials and dated** — blueprints inherit the Region Registry's "verify with the school" honesty discipline, and instruction pages are authored in GL-neutral wording (L3: style-faithful, never claiming affiliation or reproducing GL text).
- The assembly engine composes strictly to blueprint: type mix, per-section timing, section order, tier distribution centred on T3 with authored spread.

## 3. SITTING CONDITIONS

- Full-screen Plain mode, no mascot, no tools (Alphabet Rail and Bar Model Builder absent — the Phase 4/Maths fading contract completes here), juice suppressed to bead progress + soft section chimes (Addendum A §2.2 Boss Case row).
- Per-section timers, amber-only final minute. **No pausing mid-section** (real conditions) — but a child can always stop: abandoning is framed kindly ("We'll call that one a practice run — no case file today"), the sitting is discarded, no partial score reaches the parent, and the burn rule does NOT apply to unseen sections of an abandoned paper.
- Parents schedule mocks from Parent HQ within the programme cadence; **frequency cap: one full paper per district per 7 days** (anti-cram; D-laws apply to parents too). The cap is copy-explained, not silently enforced.
- Device guidance shown pre-sitting: tablet/laptop, quiet room, the authored "exam-day rhythm" one-pager (Casebook cross-link).

## 4. SCORING AND REPORTING — THE HONESTY LADDER

We deliberately do not collect date of birth (Phase 1 minimisation law), so **true age-standardised scores are impossible for us — and we say so rather than fake it.** Reporting maturity is staged:

- **Stage 1 (launch):** parent sees raw score, percentage, per-type breakdown, time-per-section, and trajectory across sittings — wrapped in the authored context copy (Phase 6) and a plain-English note: "Real 11+ results are age-standardised; practice scores here show attainment and progress, not a predicted result." Casebook ch. 3 linked.
- **Stage 2 (when a blueprint has N≥300 sittings):** add cohort percentile ("compared with ClueCrew children in the same year group sitting this paper") with the comparison population named honestly. Year-group banding via `yearGroup` only.
- **Never, at any stage:** predicted pass, predicted standardised score, pass probability, region-threshold comparison, or any outcome claim (L1). CI banned-claims scan extends to mock report templates.
- Child-facing result stays exactly as Phase 6 specced: strengths, one focus, mascot `proud`, no numbers.

## 5. DATA MODEL ADDITIONS

`MockSitting {id, childId, blueprintId, servedItemIds, sectionTimings, responses, status: completed|abandoned, createdAt}` — feeds parent reporting, the burn rule, Stage-2 cohort stats, and (aggregated, consented) the L1 evidence base. No new personal data collected; DPIA note appended.

## 6. GATE CHECKLIST (append to each district's mock go-live)

1. Pool isolation proven: a MOCK item can never appear in practice (core test), and a burned item never reappears for that child across recompositions.
2. Three full papers per district compose without item reuse for one child in staging; a fourth composition correctly fails with a clear admin alert (volume floor monitoring).
3. Blueprint verification signatures present and dated; instruction pages read against L3 (style-faithful, no GL text, no affiliation implication).
4. Timed sitting end-to-end on the budget tablet: section transitions, amber final minute, abandon path (kind copy, no parent score, correct burn behaviour).
5. Parent report Stage 1 reviewed by David + one parent from the test pool: does the "not a predicted result" framing land clearly? Banned-claims scan green on report templates.
6. Frequency cap enforced and explained; scheduling honours programme cadence config.
7. Maths mock items pass solution-verification CI; sampled VR/Maths mock items pass the same misconception audit as practice items.
8. One real child per district sits a full paper (existing testing protocol): stamina observed honestly — if the standard blueprint exceeds attention capacity in testing, note for the "half-paper" starter mock variant (add as blueprint, not code).

---
*Changelog: v1.0 — mock papers specification; exposure control, blueprints, honesty ladder.*
