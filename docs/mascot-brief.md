# Mascot commission brief (BUILD-PHASE-5 §1)

**For: character designer + Rive animator (one person or two). Portfolio must
show children's character work AND shipped Rive state machines. This is the
art budget's anchor.**

## The world (from the manifesto)

ClueCrew is a detective world for 8–11-year-olds preparing for the UK 11+.
Children are detectives who crack Cases, collect Word Cards, and rank up from
Trainee to Chief Inspector. Tone: warm, storybook-modern, competent — not
corporate, not babyish, not tech-clinical. The mascot is the child's
colleague, never their examiner. A wrong answer is a clue, not a failure —
the mascot embodies that.

## Brand DNA

- Palette (canonical): ink `#1B2A4A`, amber `#F5A623`, cream `#FAF6EF`,
  coral `#E8836B` (try-again only). See `assets/brand/cluecrew-brand-board.png`.
- The mark is a magnifying-glass C with an amber spark. The mascot should feel
  **family with the C-lens and the spark** — echo, don't copy.

## The rig (contractual requirements)

- **States (input names must match exactly — these are wired in code):**
  `idle, curious, thinking, celebrating, encouraging, sleeping, pointing, proud`
- **`encouraging` (post-miss) must be visibly distinct from `celebrating` but
  equally warm.** This is the single most important animation note: a child
  who just missed sees `encouraging` — it can never read as disappointment,
  and never as a lesser celebration. Think "teammate leaning in", not
  "consolation prize".
- Separated vector layers; **mouth built rig-ready but unused** (v2 speech is
  a ratified future decision — do not animate speech now).
- Total `.riv` ≤ 250KB; tested smooth on a mid-2019 budget Android tablet.
- Reduced-motion static poses for each state (we swap automatically).
- Delivery: production rig (drops in at `apps/web/public/mascot.riv` — the
  state controller is already wired) + a style sheet licensing all poses for
  print/marketing. **IP assignment in the contract, full stop.**

## Species/name selection process

1. Designer proposes **3 candidates** as idle + celebrating sketches.
2. Tested with ≥6 children from the Phase 4 testing pool: "which would you
   want to help?" and "what would you call it?"
3. David decides with that data; decision note filed in /docs.
4. Name passes a 30-minute IPO sanity search; no famous-character adjacency.

## Inputs to hand the designer

- Manifesto §6–7 (voice, world, palette) — `CLUECREW-MANIFESTO.md`
- Brand board — `assets/brand/cluecrew-brand-board.png`
- Placeholder rig in product (for state semantics, not style):
  `apps/web/components/crew/mascot.tsx` and the debug panel `/crew/debug/mascot`
- **Child-testing observations (attach after Phase 4 testing):** what children
  called the placeholder unprompted; where they smiled. File:
  `docs/child-testing-findings.md` — REQUIRED INPUT, currently pending.

## AI policy (applies to this commission)

The mascot and any character art are **human-made end to end**. No raw AI
output ships child-facing (recorded as law in BUILD-PHASE-5 §2).
