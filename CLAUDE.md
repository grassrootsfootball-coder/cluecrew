# ClueCrew — read this first

The build is governed by documents, and the documents win arguments.

**Read at session start, in this order:**
1. `docs/CLUECREW-MANIFESTO.md` — wins ALL conflicts; amendable only by
   David; deviations are surfaced, never silent. Currently v1.11.
2. The phase spec for whatever you're touching: `docs/BUILD-PHASE-1..6.md`,
   `docs/BUILD-DISTRICT-MATHS.md`, `docs/BUILD-DISTRICT-NVR.md`.
3. `docs/ADDENDUM-A..E` (voice/juice, mock papers, readiness, year/intensity,
   corpus firewall) and `docs/AMENDMENT-1-PRICING-V2.md` (pricing + D7).
4. `docs/CLUECREW-STORY-BIBLE.md` (v1.2, REDACTED — the Grey Umbrella
   identity lives only in David's private files, never in this repo) and
   `docs/LIVE-LAUNCH-PACK-V3.md` + `docs/LAUNCH-PACK-V3.1-TEACHING-ENGINE.md`
   for the public page.

**House rules that recur:**
- All child-facing strings pass `pnpm scan:vocab` and the reading-age lint;
  never exempt a scanner hit — reword it.
- Child-facing sentences end only on a full stop, `?` or `!` — a dash does not
  end a sentence for the ≤16-word reading-age cap (reviewer, 2026-08-05, every
  district). A clause a dash breaks off still counts toward the cap; if a hint
  needs a dash to read, split it into two sentences with a full stop instead.
- HOUSE NOTATION is a gate, not an export patch (reviewer, 2026-08-07, maths):
  money on the £ symbol (£5.00, never "5.00 pounds"), temperatures with the
  degree sign (4°C, never "4C"), areas/volumes with a real superscript (48 cm²,
  never "cm2"). Batch 01 was fixed by a manual edit on its own export file, so
  batches 04-05 regressed — at 900 items nobody catches it by reading. The rule
  lives in `checkMathsNotation`/`normaliseMathsNotation` (packages/core) and runs
  inside the one child-facing gate (`checkItemChildFacing`), so every door
  enforces it. An import door NORMALISES then gates; the degree sign is reported,
  never auto-inserted (a bare "C" may be a label).
- CHANGING A VAULT `likelierKnown` IS A CHANGE TO FAMILY COMPOSITION, NOT A DATA
  CORRECTION (annie, 2026-08-08, vocabulary-in-context). The field feeds the
  vocabulary flip AND the guard, which interact: the flip decides which sense an
  item tests, and the guard (headword vault tier <= 2) decides whether the card
  may carry a familiar-sense item at all. So editing one value can move a card's
  TIER, change which HALF of the card survives, and VOID a signed item — `noble`
  did all three, after it was already built and signed. Anyone extending the
  vault will assume it is a spelling-correction-grade edit; it is not. Re-run the
  vocabulary audit and re-sign the affected family after any such change.
- ONE DIRECTION ONLY FOR AUTHORED ITEM CONTENT: COWORK AUTHORS, THE DB HOLDS
  (David, 2026-08-08, after the two English comprehension batches drifted on 13
  fields). Both copies were being edited and neither side knew — Cowork applied
  R23 to `pp-16` while this repo applied the R22 urgency rewording to `WIW-19`
  and `pp-13`. Both edits were CORRECT; the fault was two-way editing, not bad
  judgement, and a drift that size is invisible until someone diffs 44 items.
  So: **Cowork is authoritative for authored item content** (stems, options,
  walk scripts, hints, quotations). This repo does not edit it in place — it
  imports, gates, and when a GATE forces a change it exports the whole batch
  back so Cowork absorbs it and stays the single source. `pnpm --filter
  @cluecrew/db exec dotenv -e ../../.env -- tsx ../../scripts/export-english-batches.ts`
  is that return path. The DB remains authoritative for everything the gates and
  the platform own: status, pool, signatures, misconception library, tiers.
  Before importing a batch, diff it against the DB — if both have moved, the
  gate-forced side exports first and Cowork merges, never the reverse.
  **Export a MERGE, never a wholesale replace.** The first attempt at this
  exported the DB state entire and would have destroyed eleven fields of newer
  Cowork authoring plus R23 quotation declarations on five items the DB never
  held. Drift is rarely one-directional: check FIELD BY FIELD, and carry back
  only what a gate forced. A gate failure is the only thing that overrides
  Cowork's authoring, and the export must say which fields it changed.
  **Compare JSON fields order-insensitively.** Postgres JSONB does not preserve
  object key order, so a raw `JSON.stringify` diff reports permanent false drift
  on any structured field (`quotes`, options). Sort keys before comparing, or a
  synced batch reads as still-drifted and someone re-imports it forever.
- LIBRARY TEXT: THE DB AUTHORS, COWORK PROPOSES TRANSFORMS (annie, 2026-08-08).
  "Cowork authors, the DB holds" is about ITEM content and does not reach the
  misconception library — `childHint` lives on the misconception, which the DB
  owns. Three copy mismatches in two turns came of the gap. So, explicitly:
  **the DB holds library text; Cowork proposes changes as a TRANSFORM against
  quoted DB text, and keeps no local copy to drift from.** A transform survives
  a stale copy where a rewrite does not — "apply the transform, not the text"
  is what saved `or sound right` in `vr-form-without-meaning`, and a rewrite is
  what had lost it. The read path is
  `scripts/export-misconception-library.ts`, which delivers every entry's
  current `childHint` verbatim plus a gate verdict; re-run it rather than
  reusing a download.
- **WHEN A VALUE CARRIES A SIGNATURE, SEND THE VALUE, NOT AN ACCOUNT OF IT**
  (annie's rule, 2026-08-08 — R25; supersedes the earlier "quote the whole
  field" note). Depths from the bank, hints from the field, ranges from the
  generator. A summary is a door into the reviewer's judgement with no guard on
  it — the same fault as the ungated import scripts, one level up. Send the
  export, not the prose; prose may accompany a value, never stand in for it.
- **A VERIFIER STATES ITS SOURCE BEFORE IT RUNS** (annie's standing instruction, 2026-08-09,
  alongside R41). Any new `recomputeParams`/`recompute*`-style check, in any district, states which
  function it calls to define the property it is checking — either "reads the field directly" or
  "calls `<family's own function>`" by name. A re-derivation instead of the family's own code is
  flagged BEFORE it runs, not after it reports. The incident: the first version of M-column's
  recompute reimplemented "across-zero" instead of calling the family's own `subInfo`, and reported
  69 disagreements against a signed sheet, every one manufactured by the checker. Also from that
  pass, R44: metadata (a parameter R31 could not assert) is not one class — it is either genuinely
  unrecoverable BY DESIGN, or a fact the family already knows and simply has not written onto the
  item, same shape as `optionsThatParse` before `parses` existed. State which, per parameter; do
  not report "metadata" as if it settles the question.
- **AN IMPORT DOOR VALIDATES A STEM; IT NEVER FILTERS ONE** (David, 2026-08-12 — R57). Every key
  the schema knows is checked when present; every key it does not know PASSES THROUGH. Call the
  shared `stemSchema` in `packages/core/src/item-stem.ts` — never re-list the fields a door
  expects. An allowlist that drops what it cannot name is a gate that fails OPEN and reports
  success: it silently destroyed a declared field four times (R23 `quotes`, R42 `passageNames`,
  R55 `techniqueKey`, and `sentence` latent on 81 items) before the mechanism itself was removed.
  Two doors that enumerate separately WILL drift — that is R42's finding and it recurred in R55,
  where the CMS door passed a stem through while the script door stripped it.
- **A COUNT IS NECESSARY BUT NOT SUFFICIENT — A ZERO HAS TO BE LOUD, NOT MERELY VISIBLE**
  (annie, 2026-08-12 — R60). Every check and every export states the size of the population it
  actually screened, and when that population is EMPTY it says so in terms that cannot be read as
  a pass. A printed figure alone does not do this: `verify:solutions` printed "0 MATHS items
  checked" in every CI run since it was written, the zero was right there in the log every time,
  and it still read as a pass — because nothing in the line said that nothing had been checked.
  No path anywhere creates a MATHS `questionType`, so that gate and `check:maths-distractors`
  have never screened a single item. Three questions settle it, asked of any check BEFORE trusting
  a green: (1) what does it print when it sees nothing, and is that distinguishable from a clean
  pass? (2) does it know anything it MUST find — a canary that fails if the check goes blind?
  (3) is it reading the artefact, or a copy of it? Question 3 is the one to weight; it is R57's
  finding in checking clothes. A verdict that is legitimate for a considered gap is the worst
  possible default for a blind run — the maths param sweep scored PARTIAL on nineteen families
  that emitted nothing, PARTIAL meaning "a recorded judgement", under a "0 disagreeing" headline.
  An export that delivers must also REFUSE to supersede a good artefact with a blind one.
- **THE FOURTH REGISTER SHAPE: A CHECK NAMED FOR A POPULATION THE PIPELINE NEVER PRODUCES**
  (annie, 2026-08-12 — R61). The other three blind-check shapes are all faults in the check:
  wrong scope, a stale proxy, an unreported denominator. This one is not. The check is CORRECTLY
  WRITTEN and points at something that has never existed, so its empty run is GENUINELY CORRECT —
  and neither of R60's first two questions catches it, because a canary cannot fire on a
  population that is legitimately absent and a printed count of zero is the true number.
  `verify:solutions` and `check:maths-distractors` are the instance: both correct, both screening
  a MATHS item bank no code path creates. **The guard is a DECLARATION, not an inference.** Any
  gate whose population could legitimately be empty says so explicitly, once, in writing, with the
  reason — `declareMayBeEmpty()` in `scripts/lib/population.ts`, which prints that reason on every
  empty run so a temporary gap cannot decay into a green tick. **Every other gate treats an empty
  population as a PIPELINE FAILURE, not a pass** — `requirePopulation()`, same file. A gate calling
  neither has not thought about it, and that is the state this closes.
- **REVIEWED CONTENT IS IMMUTABLE TO CODE CHANGES, AND THE DENOMINATOR IS WHAT WAS ACTUALLY READ**
  (annie, 2026-08-12 — R62). Derived option values are a function of a derivation function, so a
  change to that function rewrites every item it owns, reviewed ones included. `seed:items` and
  `content:generate` both did this, unconditionally, and `content:generate` deleted and recreated
  every option. Both now CLASSIFY BEFORE WRITING (`packages/db/prisma/reviewed-guard.ts`): a row is
  reviewed if LIVE, RETIRED, or carrying any attribution event; reviewed-and-unchanged is a no-op,
  and reviewed-and-would-change FAILS the whole run before a single write. No warning, no version,
  no automatic update with a note — anything softer reintroduces the same path with a paper trail,
  and the trail does not help if nobody reads it before serving.
  **STATE THE DENOMINATOR YOU READ.** The exposure was 127 derived+reviewed items, but only 100
  were measurable: a seed run had already overwritten the other 27, so their "no divergence" was
  trivially true. Report it as 100 measured, 27 reconstructed — never 127 with a caveat. The 27
  were recovered afterwards by running the derivation from a git worktree at the signing commit,
  which is the general technique: derived values are deterministic in code, so git IS the prior
  state. That reconstruction found 14 of 27 changed after their attribution — all by reviewer
  ruling (direction retired, series re-tiered), none silent.
  **ZERO DIVERGENCE IS AN OUTCOME, NOT EVIDENCE THE DESIGN HELD.** `distractors.ts` changed ninety
  minutes AFTER those items were attributed, in a commit touching exactly the four affected
  families. The coupling was live, unguarded, and exercised the same day; it happened not to alter
  those values. Anyone skimming "all re-derived clean" will read reassurance about the design, and
  it is the opposite.
  **THE EXPOSURE SCALES WITH HOW ORDINARY THE COMMAND IS.** 53 files write to Item/Option/Word/
  Misconception/Case. Only TWO write child-facing content on a routine trigger (CI, every push) —
  `seed.ts` and `generate-content.ts`, both now guarded. Two more run in CI but touch only workflow
  flags (`similarity:scan`, gated on RETRO; `check:word-puzzles`, answer-flag columns) — a
  different class, not the same risk.
  **THE TEST IS NOT DELIBERATENESS, IT IS WHO AUTHORED THE VALUE** (annie's narrowing). The seed
  was deliberate and did its damage on its only run. Measured: of 53 content writers, 42 write
  REVIEWABLE fields — the number went UP, not down, because most of those scripts exist to change
  reviewed content, transcribing a ruling into a `childHint`, a `description` or a walk script.
  They ARE the re-review the guard sends you to do; guarding all 42 would leave thirty doors
  permanently overridden and the guard decorative. The line that survives: a DERIVATION FUNCTION
  computed the value (it can change because CODE changed, with no human deciding) → classify
  before writing; a HUMAN RULING supplied it → no guard, it needs provenance and already has it.
  Exactly TWO writers compute what they write, and both are guarded. `pnpm check:derived-writes`
  makes that a property of the WRITE PATH rather than a list: it fails any file that both writes a
  content table and calls a derivation function without calling `classifyDerivedWrites`, so a new
  deriving writer fails on the commit that adds it. The 16 one-shot ruling-appliers carry a header
  saying they write unguarded; that is a warning, not the mechanism.
  **RECOVERING PRIOR STATE — A METHOD, NOT A ONE-OFF.** Derived values are deterministic functions
  of code, so GIT IS THE PRIOR STATE: `git worktree add --detach <dir> <commit-at-signing>`, symlink
  node_modules, run the derivation there, compare with now. That is how the 27 "unmeasurable" seed
  items became measurable (14 had changed, all by ruling). It answers any derived-value history
  question, and it is why a lost prior state is usually not lost.
- Content decisions (items, chapters, misconceptions) go through the CMS
  review pipeline; nothing skips the reviewer.
- **PILOT CONTENT UNDER ACTIVE REVIEW HAS ONE WRITE PATH: `scripts/lib/pilot-review.ts`, NEVER A
  DIRECT EDIT** (David, 2026-08-11). A hand-edit to `ENG-004-anne-green-gables.json` reached the
  right content by coincidence, not by control — the file changed with no actor attached at all,
  and the edit was indistinguishable from that. Harmless that time is not a control. The canonical
  copy lives at `content/pilot-review/` (git-tracked — every change has a commit and a diff),
  chmod 444 at rest (a direct write gets EPERM, not a silent change), gated on every write through
  `checkItemChildFacing` for the items a ruling touches, and logged append-only to
  `content/pilot-review/RULING-LOG.jsonl`. `~/Downloads/11+` holds no source of truth for pilot
  content: `pnpm export:pilot` generates what Cowork reads, `pnpm import:pilot` diffs anything
  coming back and applies nothing automatically. An emergency override
  (`emergencyOverridePilotFile`) exists for a human who must bypass this under time pressure — it
  is deliberately loud (an unmissable console banner, a required reason, a log entry tagged
  `emergencyOverride: true`), because the fault being closed was a change nobody could tell apart
  from noise, and a quiet override would be the same fault again one level up.
- A script that applies reviewer decisions RE-EXPORTS the affected artefact as
  its final step (David, 2026-08-06, after the seventh stall on a file that
  lagged the DB): the export must FOLLOW the state change automatically, not
  wait for someone to notice the freshness stamp is stale. Deliver + prune the
  old file. Exports are reusable functions (e.g. `exportMathsMisconceptions`)
  so an apply script can call one directly rather than duplicating it.
- Bare-card vocabulary items use the TWO-PART SCREEN (reviewer, 2026-08-06,
  any district incl. English): a two-sense headword is NOT disqualified from a
  bare card — the ambiguity only becomes a wrong answer when a distractor is
  correct in the OTHER sense. So (a) flag the headword's other senses, (b)
  forbid, as a hard block, any distractor correct in one of them (they are what
  a near-synonym generator reaches for first). A headword whose senses leave NO
  surviving key at all (FAIR: just / light / fine-weather) is retired to a
  carrier slot or dropped. Shared machinery: `packages/core/src/vr/vr04.ts`.
- Generated-distractor distribution must be held down deliberately (reviewer,
  2026-08-06, every generated district): a shortcut appears whenever one
  distractor type is both predictable AND over-represented. Generating to
  diagnosis makes each type predictable by design, so a generator must never
  drop a scarce diagnosis to top up an abundant one, and must cap any single
  type (position and frequency) rather than let it become the default filler.
  Ship-rate is a review artifact — export it with every generated bank.
- Local dev: Postgres on 5432, app on 3100, root `.env` is the single env
  source. Never run `pnpm build` while the dev server is up.
- e2e fixtures build their own accounts (`apps/web/e2e/fixtures.ts`); the
  seeded test-family is for manual dev sign-in only.

Brand source assets: `packages/ui/assets/brand/` (served copies stay in
`apps/web/public/`).
