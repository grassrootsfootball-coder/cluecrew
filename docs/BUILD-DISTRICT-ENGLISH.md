# BUILD-DISTRICT-ENGLISH: THE ARCHIVE
### ClueCrew Build Bible — District Expansion 3 — v1.0
**Prerequisites: manifesto + Addenda A–E + corpus decisions (SCP-E-1 revised, E-7 REVERSED, E-9 to E-17 accepted). Story Bible: the Archive, rose accent, Prue Archer's district; S4 "The Unfinished Story" is phase-2 content.**
**The defining finding: English is TWO subjects wearing one name.** GL English is 56% SPaG error-spotting, all multiple-choice, ceiling T4. Non-GL English is write-in dominant, technique-led (Alleyn's: 22 of 35 reading marks), reaches T5 via graduated analysis ladders, has zero standalone SPaG, and carries compulsory writing at 25–43% of marks. This district therefore ships **two tracks and two item models**, with track assignment driven automatically by the child's Region Registry format tag.

---

## 1. THE TWO TRACKS

| | **GL track** | **Selective track** (CSSE / independent / hybrid) |
|---|---|---|
| Item model | MC + misconception-tagged distractors (existing model, unchanged) | **Open-response** (new model, §3) |
| Comprehension | one deep passage cluster, **23–25 items** (ratified 2026-08-02), line-referenced, **2–4 word-class items embedded mid-run** | one (or two, Bancroft's-style) clusters, 7–16 items, tariffs 1–12 marks |
| SPaG | error-spotting 4-segment+N, spelling/punctuation/cloze — **56% of paper** | **zero standalone**; embedded 1-mark riders in open answers (~25% of CSSE comprehension credit) |
| Technique | ~5% of items but the hardest | **dominant** — up to 63% of reading marks |
| Writing | none | **compulsory, 25–43% of marks** (§5) |
| Tier ceiling | T4 | T5 (graduated ladders, 12-mark analysis) |
| Default for | GL-format regions | CSSE, independent, FSCE-adjacent targets |
Children whose target is unknown default to GL track with Selective available; Parent HQ shows which track and why, with the standing verify-with-the-school caveat.

## 2. CASES (~30 total)
**GL track (~14):** comprehension skills (retrieval · inference · vocabulary-in-context · technique) ×4, spelling error-spotting ×3 (the four high-frequency franchises: homophones, unstressed suffix vowels, silent letters, doubles), punctuation ×3 (apostrophes, terminal/boundary, speech and commas), grammar cloze ×3 (word-class-by-job, tense sequence, conjunctions/tags), plus **N-courage** as its own short Case (children's N-avoidance is an observed, teachable trap).
**Selective track (~16):** the analysis ladder ×4 (locate → name → explain effect → develop to complication — see §4), own-words rephrasing ×2, evidence-selection and quotation-choice ×2, vocabulary-at-tariff ×2, poetry reading ×1, whole-text synthesis ×2, and the composition suite ×3 (§5).
Five Modes each (P1). Word Vault: English contributes technique terms (simile, connotation, atmosphere) and the polysemy sense-pairs identified in the vocab pass.

## 3. THE OPEN-RESPONSE ITEM MODEL (SCP-E-9 — the district's engineering core)

New item type alongside MC. Schema:
```
OpenResponseItem {
  stem
  passageRef: String                // CANONICAL — same field, same meaning,
  lineRefs: Int[]                   // in BOTH item models (ratified 2026-08-02)
  tariff: Int                       // 1–12 marks
  requiredPoints: Int?              // papers routinely state "give two reasons"
  acceptableAnswers: [ { text, tolerance: EXACT|CLOSE_PARAPHRASE|CONCEPT,
                         barredNearMisses: [String] } ]
  creditModel: POINT | GRADUATED    // GRADUATED = the ladder, §4
  bands: [ { level, descriptor, exampleAnswer } ]   // for GRADUATED
  evidenceCapRule: Bool             // unsupported general answers hit a ceiling
  ownWordsRequired: Bool            // lifting scores zero on these
  spagRider: Int?                   // CSSE-style embedded accuracy mark
  misconceptions: [id]              // tagged to ANSWER PATTERNS, not options
}
```
**Marking:** child types a short answer; the engine matches against the acceptable-answer set (exact/paraphrase/concept tiers) and returns credit plus the authored feedback for the matched pattern. Ambiguous or unmatched answers are **never marked wrong** — they return "let's compare yours with a strong answer" plus the model answer and the band descriptors, and are logged for reviewer sampling to improve the acceptable set over time. **No free-generated marking (S3): all feedback text authored per item or per band.**
**Reviewer impact (recorded, from the analyst's note):** reviewing an open-response item is mark-scheme drafting, not distractor checking — slower per item, and scoped accordingly in sittings.

## 4. THE LADDER (SCP-E-17 — pedagogy, resolved)
Outside GL the teachable unit is graded within one question: **locate/quote → name the device or state the point → explain the effect → develop toward a tension or complication.** Resolution: the five-Mode framework is unchanged — **Walk-it already teaches faded multi-step** — but Walk scripts for Selective-track comprehension are authored explicitly as four-rung ladders, with the top rung ("notice a complication") taught as its own skill because that is where mark schemes reserve top marks. GRADUATED credit items score rung by rung; the child sees which rung they reached and what the next one adds. Never a score, per D-laws — rungs are named, not numbered.

## 5. THE COMPOSITION MODULE (SCP-E-7 reversed; writing is in v1)

**Prompt scope (SCP-E-14 — build only what's evidenced):** response-to-stimulus (dominant), continue-the-passage, constrained narrative/descriptive. **Not built:** persuasive, discursive, picture-led — zero corpus occurrences.
**Perspective constraint (SCP-E-15) is taught as a first-class skill** — write as a non-human protagonist, from a hidden character's viewpoint, from a supplied opening sentence, in a mandated person and tense. It's the dominant difficulty lever and almost nobody teaches it.
**Planning (SCP-E-16):** papers expect it, only one scaffolds it — so we teach it: a 5/15 plan-then-write rhythm, timing-hazard teaching for mid-paper writing placement (Dulwich puts composition at Q14 of 16 — over-invest and the remaining reading marks die).
**The five-domain rubric (convergent across both marking philosophies) — this is what the Writing Room engine praises and prompts against:**
1. Content and ideas (invention, task focus, sustained viewpoint)
2. Structure and organisation (**paragraphing is marked as accuracy, not content**)
3. Vocabulary (ambitious **and** accurate — "ambitious but wrong" earns nothing at the top band)
4. Sentence variety (monotony is the named bottom-band failure)
5. Technical accuracy (~⅓ of writing marks, a **positive allocation**)
**Two marker instructions become engine law:** *reward quality over quantity* — **no word counts anywhere** (the papers use none; setting targets would import a convention the format doesn't have); and *never penalise off-mode drift* — redirect toward the required element instead of marking down. Figurative and sensory language is the most-repeated top-band content signal across every scheme: the engine's highest-frequency prompt.
Writing Room pipeline (Phase 6) is unchanged — two-pass screening, DSL queue, authored constrained feedback — now calibrated to these five domains rather than generic craft advice.

## 6. PASSAGES (SCP-E-8 as revised by E-12) — three streams
- **Stream A, public-domain pre-1950 extracts (the majority; 77% of corpus):** 600–1100 words, reading age 10–14 by track (CSSE hardest at 12–14). Curated exactly as the real papers do — Gutenberg-sourced, editorially trimmed, with an authored scene-setting preamble and numbered lines. Zero licensing cost, maximum format fidelity.
- **Stream B, commissioned contemporary prose:** 450–700 words, for Bancroft's/Alleyn's-style tracks. Drafted in-house through the authoring pipeline.
- **Stream C, at least one commissioned complete poem:** Bancroft's runs a real poetry cluster; it's in-format and currently unrepresented in any competitor's prep.
- **The fairness law (SCP-E-8, adopted): passage hard, stems plain.** Passage RA 10–14; every stem, option and instruction RA ≤9. We test comprehension, not decoding of the question.
- **Length pairs inversely with depth** (Alleyn's shortest passage carries 12-mark tariffs): commission short for deep analysis, long for numerous shallower items — never maximise both.
- Passage reuse across products is industry-normal (GL reuses sources across papers); one master extract may serve practice and, with a different trim, a mock — provided items never repeat (Addendum B burn rule).

## 7. BLUEPRINTS
`gl-english-standard` (49–54q, 50 min, four sections: comprehension cluster 23–25 + spelling 9 + punctuation 8–9 + cloze 8–9, MC throughout, error-spotting 4+N with N genuinely keyed 1–2 per section, **2–4 word-class items embedded mid-run** in every comprehension cluster — corpus finding, publish-validated). **Mirror-pair design (SCP-E-4):** paper pairs swap which SPaG skill gets discrete sentences vs continuous passage — adopt for mock-pool pairs.
`csse-english-standard` (comprehension cluster + embedded SPaG riders + two compulsory contrasting writing tasks, ~25% of marks; note the writing allocation is a per-cycle policy — one observed cycle had none, so blueprints must not hard-code it).
`independent-english-standard` (single or dual cluster, technique-dominant, tariffs to 12, compulsory single writing task 27–43%).
All drafted PENDING REVIEWER VERIFICATION.

## 8. NON-GOALS
SUMMARY items (zero corpus evidence anywhere). Persuasive/discursive/picture-led prompts. Structure as a standalone type (it lives inside technique). Free-generated marking of any kind. Story content (S4 is phase 2). Multi-passage GL papers (not in format).

## 9. GATE CHECKLIST
1. Open-response schema built; an item cannot publish without acceptable-answer set, tariff, and (if GRADUATED) full band descriptors with example answers.
2. Unmatched-answer path proven: never returns "wrong"; returns model answer + bands; logs for reviewer sampling.
3. Track assignment from Region Registry verified for three test regions; parent-visible explanation renders with the verify-with-school caveat.
4. GL-track item set reviewed to LIVE at the volume floor; N genuinely keyed in every error-spotting set (automated check).
5. Ladder Walk scripts authored for four Selective comprehension Cases; reviewer confirms the four rungs match mark-scheme reality.
6. Composition: three prompt types live, perspective-constraint Case play-tested, plan-then-write rhythm taught, **no word count appears anywhere** (automated string check).
7. Writing Room feedback engine re-tuned to the five domains; red-team run repeated against the new rubric; off-mode drift provably redirects rather than penalises.
8. Passage bank: ≥15 Stream A extracts curated with preamble and line numbers; reading-age split verified (passage 10–14, stems ≤9 — automated).
9. Embedded SPaG rider scores correctly on CSSE-style items without ever surfacing as a spelling criticism to a child mid-comprehension.
10. Similarity gate covers all passages; no curated extract collides with a corpus paper's chosen extract range (different trims required).
11. DPIA/D-law sweep; banned-vocab green including all band descriptors and model answers.

---
*Changelog v1.1 (2026-08-02, David's ratified corrections): comprehension
cluster narrowed to 23–25 items (was 23–28 in §1 and §7); 2–4 word-class
items embedded mid-run made an explicit, publish-validated requirement of
every comprehension cluster; `passageRef` (String) and `lineRefs` (Int[])
declared canonical across BOTH item models, replacing the open-response
model's `{from,to}` range. Both cluster rules are enforced by
`checkGlComprehensionCluster` in core, and the field shapes at the
bulk-import door.*

*Changelog v1.0: initial English district spec. Two tracks, two item models, writing in v1 (SCP-E-7 reversed on acquired evidence), three passage streams, five-domain composition rubric.*
