# BUILD-PHASE-4: THE VR DISTRICT
### ClueCrew Build Bible — Phase 4 of 6 — v1.0
**Prerequisites: manifesto + passed Phase 1–3 gates. Phase 4 renders what the Phase 3 engine decides; if UI code starts making pedagogical decisions (choosing items, altering difficulty, computing mastery), STOP — that logic belongs in `/packages/core`.**

**Phase 4 delivers: a child can log in, land in Crew HQ, work the full Daily Loop through the complete VR District (all 21 question types), collect words in the Word Vault, teach the mascot, and rank up — with placeholder art driven by the real state machine. At gate, real children test it.**

---

## 1. DEVICE AND DESIGN TARGETS (ratified decision from David, 27 Jul 2026)

- **Tablet landscape is the design centre.** Every mechanic is designed at 1180×820 logical px first, then adapted to tablet portrait, phone (portrait), and desktop. Phone is a supported adaptation, never the source design.
- Touch targets ≥48px with ≥8px spacing; drag interactions must also offer a tap-tap alternative (pick up → tap destination) for motor accessibility and mouse users.
- **Performance budget (D6, enforced in CI via Lighthouse on a throttled profile):** interactive in <3s on a mid-2019 budget Android tablet profile; every mechanic at 60fps target / 30fps floor on that profile; JS bundle for the crew app <300KB gzipped initial, mechanics lazy-loaded per family; all animation via CSS/SVG transforms and Rive — no layout-thrashing JS animation.
- Offline: cache today's composed session assets via service worker so a mid-session connection drop never loses work; full offline is a non-goal.

## 2. THE 21 QUESTION TYPES → FIVE MECHANIC FAMILIES

We build **five interaction engines, not twenty-one** — each VR type is a configuration of one family. (Publisher numbering of "the 21 types" varies; the `QuestionType` registry from Phase 1 is our source of truth and maps our slugs to GL-familiarisation names. Content team maintains the mapping.)

| Family | Engine | Types covered | Core interaction |
|---|---|---|---|
| **CODEBREAKER** | `engine-code` | Letters for Numbers · Letter Series · Number Series · Word–Number Codes · Complete the Sum · Related Numbers | The **Alphabet Rail** (see §3) + code panel: tap/drag symbols, live decode preview |
| **STOWAWAY** | `engine-stowaway` | Hidden Word · Insert a Letter · Move a Letter · Missing Word · Complete the Word | Letter tiles + swipe-highlight: letters physically move; hidden words glow when found |
| **WORD WEB** | `engine-wordweb` | Closest Meaning · Opposite Meaning · Two Meanings · Two Odd Ones Out · Compound Words · Make a Word | Card decks: sort, pair, snap-together compounds; odd-ones-out flick to the discard tray |
| **BRIDGE** | `engine-bridge` | Related Words · Word Connections · Letter Connections | Analogy bridge: the relationship between pair A visually "lifts" and drops onto pair B; child builds the bridge before answering |
| **DEDUCTION DEN** | `engine-deduction` | Reading Information (logic problems) | Mini-mystery: statements as clue cards, a suspect/possibility grid the child eliminates by tapping |

Every engine has two rendering modes: **Case mode** (themed, mechanics-rich, mascot present) and **Plain mode** (exam-faithful multiple choice, no theme — used by the boss closer and Phase 6 mocks, P4). Same item data renders in both; the transfer from mechanic to exam format is the point.

## 3. THE ALPHABET RAIL (signature tool)

A persistent, summonable A–Z rail: scrubbing it animates position counting; two fingers select a pair to show the jump between letters; mirror mode shows the reverse alphabet for mirror-code types. Available in every CODEBREAKER and relevant STOWAWAY case — first as a big on-stage manipulative (See-it Mode), later shrinking to a corner tool, and **absent in Plain mode** (scaffold fading built into the UI itself). This is our concrete–pictorial–abstract commitment rendered literally.

## 4. CASE FLOW (every Case, uniform)

1. **Case open** (≤30s, skippable, D5): one illustrated panel + 2 sentences setting the mystery hook for this type.
2. **Modes shelf:** five Mode cards (Watch / Walk / See / Hear / Try). First visit gently pulses Watch; free choice always; "last used" preselected thereafter (L2 firewall from Phase 3 applies — no other personalisation).
3. **Practice** via the family engine, engine-agnostic frame: progress beads (not bars — beads fill, never drain), mascot dock, help button that re-opens Modes without shame framing ("See it another way").
4. **Feedback beats:** correct → mascot `celebrating` + one-line authored affirmation naming the skill ("You tracked the letter jumps!" — praise the method, not the child's smartness). Incorrect → coral "Not yet" + the chosen distractor's `Misconception.childHint` verbatim (authored, S3) + "Try another?" / "Show me a way in".
5. **Case cracked** (mastery ≥0.8): stamp ceremony — case file stamps CRACKED, amber spark burst, Word Card bonus draw, rank progress tick. ≤6 seconds, skippable after first viewing.
6. **Teach-Back** unlock per Phase 3 triggers: the mascot presents its authored mistake in a thought bubble; the child taps the wrong step, then picks the correction from three authored options.

## 5. WORD VAULT

- Vault screen: collected cards in root-family shelves ("the PORT family"), tier-coloured card backs, flip animation (headword+image → child definition + sentence). Uncollected cards show as silhouettes with counts — collection pull without naming what's missing.
- Collection moments: 3 cards in every warm-up; bonus draw on case cracked; root-family completion gives a shelf ceremony.
- Review integration: due words appear in warm-up as flip-and-answer (choose the meaning / choose the word for the meaning, alternating). Mastery ≥0.8 gilds the card edge.
- All definitions/sentences authored at reading age ≤9 (CI reading-level check on Word content).
  **Corrected 2026-08-02 (David):** "reading age ≤9" here means the VOCABULARY ceiling, not a
  sentence-length cap. The lint applied the 16-word cap to Word cards, which was a spec error:
  a Word-card sentence exists to DISAMBIGUATE a meaning and a long sentence is often the correct
  one. The 16-word cap applies to item stems, options and instructions — text read under time
  pressure. Reading age is now checked BY ROLE (packages/core content-gates.ts).

## 6. CREW HQ AND THE DISTRICT MAP

- **Crew HQ** (child home): mascot greeting (state: `idle`/`curious`), today's loop as a three-stone path (Warm-up → Case → Closer), streak lantern (lit/rekindled states only), rank badge, door to the VR District, locked doors for the other three districts (visible, mysterious, no release-date promises).
- **VR District map:** a small illustrated neighbourhood; each Case is a location; cracked cases show the stamp; current case glows amber. Path order from `Case.orderInDistrict` but any unlocked case is enterable (autonomy within structure).
- Wind-down (session cap or natural end): mascot `sleeping` beat, today's collected words fan out, "See you tomorrow, Detective." No "one more" prompts of any kind (D2).

## 7. MASCOT INTEGRATION (placeholder art, real machinery)

- Rive runtime wired with a placeholder rig implementing the full manifesto state machine: `idle, curious, thinking, celebrating, encouraging, sleeping, pointing, proud`. State transitions driven only by engine events through a single `mascotController` — no component may set mascot state directly (keeps Phase 5's art swap to a file replacement).
- `encouraging` (post-miss) must be visibly distinct from `celebrating` but equally warm — the direction note for Phase 5's animator starts here.
- Reduced-motion setting swaps Rive states for static poses.

## 8. ACCESSIBILITY (live in this phase, not Phase 5 polish)

Audio-first support: every instruction, stem, and option has a tap-to-hear speaker (pre-generated TTS from authored text, cached); dyslexia toggle switches to the dyslexia-aware font stack + wider spacing app-wide; every mechanic keyboard-operable (tab/arrow/enter) and screen-reader labelled; colour never sole information carrier (cracked = stamp + colour; correct = tick + colour); reading-age lint on all child-facing strings in CI.

## 9. CONTENT REQUIREMENT TO EXIT PHASE 4 (parallel authoring track lands here)

Minimum to gate: **all 21 types LIVE with ≥25 reviewed items each across tiers 1–4** (≥525 items), every case's five Modes complete, ≥300 Words with full card content, ≥2 authored misconceptions per type (≥42) with hints, all through the Phase 2 CMS review workflow (P3 constraints enforce themselves).

## 10. CHILD TESTING (gate requirement, per validation plan)

- ≥8 children aged 8–11 (recruited via parent network; written parental consent; child assent; sessions ≤20 min; parent present; no recordings of faces — screen + audio notes only; thank-you voucher).
- Protocol: unmoderated-style first session (observe, don't rescue), then task prompts. Capture: can they start unaided; do they understand Not-yet beats; Mode shelf comprehension; where they smile; where they stall; what they call the mascot unprompted.
- Success signals to look for: asks to continue past the cap (we won't let them — but wanting to is the metric), retells a mechanic to the parent, returns willingly for session 2.
- Findings triaged into: fix-in-phase-4 (comprehension blockers), phase-5 (polish), backlog. Ezra is a pilot tester for protocol-debugging only; his data is excluded from findings.

## 11. NON-GOALS

Other three districts (map doors only), real mascot art (Phase 5), Parent HQ live data (Phase 5), Writing Room and mock assembly (Phase 6), sound design beyond TTS + 3 placeholder chimes, any social/visible-to-others feature (S2).

## 12. GATE CHECKLIST

1. Full Daily Loop end-to-end on the throttled budget-tablet profile: warm-up → case → closer → wind-down, 60/30fps budget met, Lighthouse CI green.
2. All five engines demonstrated with a type from each family in both Case mode and Plain mode from the same item rows.
3. Alphabet Rail: big-stage → corner-tool → absent-in-Plain progression works in one CODEBREAKER case.
4. Content counts of §9 verified by CMS query; spot-check 20 random items for quality; David personally attempts one case per family.
5. Miss-path review: deliberately answer wrong repeatedly — hints show the correct authored misconception text; 3-miss frustration break reads kindly; no red anywhere; banned-vocab scan green.
6. Mascot state machine exercised by a debug panel; every state distinct; reduced-motion swap works; no component sets state outside `mascotController` (lint rule).
7. Accessibility: keyboard-only full session; screen-reader pass on one case per family; dyslexia toggle and tap-to-hear verified on every screen type.
8. Child testing complete per §10; comprehension blockers fixed and retested; report filed in /docs.
9. Session cap, streak lantern, and rank-up all observed live in staging with a time-mocked clock.
10. Events flowing for every new interaction; a "minutes-to-first-crack" query runs on staging data.
11. DPIA updated: child-testing data handling; TTS provider as processor.

---
*Changelog: v1.0 — initial Phase 4 spec; tablet-landscape-first ratified.*
