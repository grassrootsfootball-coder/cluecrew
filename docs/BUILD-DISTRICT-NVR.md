# BUILD-DISTRICT-NVR: THE GALLERY
### ClueCrew Build Bible — District Expansion 2 — v1.0
**Prerequisites: manifesto + Addenda A–E + Phases 1–6 machinery + Story Bible v1.2 (the Gallery, violet accent, Silas Vane's district; S3 "The Mirror Thief" is phase-2 story). This district's defining property: ALL items are procedurally generated with machine-guaranteed keys — the reviewer verifies GENERATORS, not items. That makes NVR the cheapest district to fill, the only one with an effectively infinite mock pool, and the fastest path to a second live subject.**

---

## 1. WHAT "11+ NVR" MEANS (scope standard)

GL-style non-verbal reasoning plus spatial reasoning: series completion · matrices (2×2, 3×3) · analogies (A:B :: C:?) · odd-one-out · shape codes (letter-pair codes mapping to shape properties) · rotation and reflection identification · and the spatial family: nets↔cubes, hidden/composite shapes, 2D plans of 3D views, fold-and-punch. Multiple choice throughout, Plain mode GL-faithful. Coverage attestation by the specialist reviewer against familiarisation-format evidence (corpus `blueprint-evidence` extends to the NVR papers already inventoried).

## 2. FOUR ENGINES (consolidation, as ever)

| Engine | Types served | Case-mode interaction |
|---|---|---|
| **THE MACHINE** | Series, matrices, analogies | Transformation machines: shape goes in, rule transforms it, what comes out? Children first BUILD machines (choose the rule), then reverse-engineer them — the exam skill, taught backwards-first |
| **THE LINE-UP** | Odd-one-out, shape codes | Suspects on a shelf; find who doesn't belong / crack the property code with a tappable code panel |
| **THE TURNTABLE** | Rotation, reflection | Direct manipulation: drag-rotate and flip the shape BEFORE answering; mirror-line dragging; tap-tap parity throughout |
| **THE FOLDING ROOM** | Nets, fold-and-punch, 3D views, hidden shapes | Child-controlled folding animation: fold the net, watch it become the cube, unfold, then do it in the head; punch-and-unfold replays |

Every engine renders Case + Plain from the same generated item rows (the transfer law). Manipulatives follow the fade contract: big on stage in See-it → corner tool → absent in Plain. District accent `nvr-violet`, only in-district.

## 3. THE GENERATOR ARCHITECTURE (the district's heart)

- **Shape grammar:** a fixed vocabulary of primitive elements (circle, square, triangle, arrow, star, arc, dot-clusters…) with property axes: count, size, rotation, reflection, shading (from a colourblind-safe, never-colour-only palette — pattern fills carry meaning, hue never alone), position, line-style. All SVG, all parametric.
- **Item templates per question type:** a template = (rule sampler, stem composer, key constructor, distractor constructors, difficulty parameters). The KEY IS CORRECT BY CONSTRUCTION — the generator applies the rule; there is nothing to mis-key.
- **Distractors ARE misconception executors, procedurally:** each distractor constructor implements one named misconception from the NVR misconception library (rotation-wrong-direction · reflection-instead-of-rotation · count-off-by-one · attended-wrong-property · series-step-misapplied · net-face-adjacency-error · partial-rule-only …). P3 holds: every generated wrong option carries its misconception tag and therefore its authored hint family. The reviewer seeds/approves this library (≈30 entries) BEFORE generator sign-off.
- **Difficulty parameters per tier:** element count, rule-stack depth (one transformation at T1, compounds at T4–5), distractor closeness, visual density caps (a T1 item may never exceed N elements — clutter is a fairness issue, not a difficulty lever).
- **Determinism and identity:** every item is `(templateId, templateVersion, seed)` — reproducible, loggable, and unique. Exposure control becomes trivial: practice, Boss Rounds and mock papers draw non-overlapping seed ranges, and **the mock pool is effectively infinite** — the Addendum B burn rule is satisfied by construction, forever.

## 4. THE REVIEW MODEL (generator-level — the cost revolution)

The reviewer signs **generators**, not items:
1. Per template: review the rule spec + misconception mapping + **30 sampled outputs per tier** (stratified seeds) for correctness-by-inspection, single-answer-ness, fairness (clutter, ambiguity — "could a reasonable child defend the distractor?"), and reduced-motion/static-render integrity.
2. Sign `templateId@version`. All items from a signed version inherit REVIEWED status. **Any template change bumps the version and voids the signature** (CI-enforced; unsigned versions cannot serve).
3. Quarterly drift check: fresh 30-sample per signed template.
This converts ~unlimited items into ~2–3 hours of review per template family — the whole district reviews in roughly **8–12 specialist hours, once, ever.**

## 5. CASES, MODES, CONTENT VOLUME

~16 Cases across the four engines, sequenced simple→compound. Five Modes each (P1): Watch (≤90s — **flag: the Modes asset stream applies; NVR Watch videos are strong candidates for the programmatic-animation approach since the content IS shapes transforming**) · Walk (faded worked transformation, Silas-voiced when story lands) · See (the engine's manipulative on stage) · **Hear (honest design note: NVR audio = spoken transformation reasoning — "it turns a quarter the same way as clock hands" — genuine verbaliser support and accessibility value, but visual items have an irreducible visual core; the accessibility statement should say so plainly rather than overclaim)** · Try. Word Vault: NVR contributes the technical lexicon (rotation, reflection, symmetry, vertex, adjacent…) as tier words.

## 6. NON-GOALS

Hand-authored NVR items (banned — everything through generators) · 3D rendering/WebGL (2.5D SVG folding is sufficient and budget-tablet-safe) · timed pressure anywhere outside Plain/Board contexts · story content (S3 is phase 2; the district launches with standard case intros ≤30s).

## 7. GATE CHECKLIST

1. All four engines demonstrated Case + Plain from identical generated rows; fade contract verified; tap-tap parity; budget-tablet 60/30fps with the Folding Room active.
2. Generator determinism proven: same (template, version, seed) → byte-identical item; unsigned template versions provably cannot serve (CI + server test).
3. Misconception library (~30) approved by reviewer BEFORE any generator sign-off; every distractor constructor maps to an approved entry; sampled hints read warm (Addendum A).
4. Reviewer generator sign-off complete: every template signed at current version with the 30-per-tier sample sheets archived; coverage attestation against NVR familiarisation-format evidence.
5. Colourblind-safe audit: no generated item ever encodes meaning in hue alone (automated check over 1,000 sampled items).
6. Visual-density caps enforced per tier (automated over samples); a deliberately over-dense template version fails CI.
7. Exposure proof: practice/Boss Round/mock seed ranges provably disjoint; a mock paper composes from virgin seeds for a child with full practice history.
8. Child testing (existing protocol, ≥6 children incl. the transfer test: Turntable-taught rotation → Plain-mode rotation without the manipulative); Hear-mode tried by at least one child with the visual hidden — honest notes on where audio support genuinely reaches.
9. Boss Cases assemble mixed VR+NVR papers; two-district child journey verified end-to-end.
10. DPIA/D-law sweep: no new data; banned-vocab green; accessibility statement updated with the honest NVR audio note.

---
*Changelog v1.0: initial NVR district spec; generator-level review model; "all in" resequencing context recorded — NVR promoted as fastest second district by David's decision.*
