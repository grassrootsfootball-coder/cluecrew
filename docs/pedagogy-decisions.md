# Pedagogy decisions — values, rationale, ratification

The numbers the engine runs on, why they are what they are, and who has
signed them. Required by ADDENDUM-D gate #4; the Addendum C thresholds share
the same 8-week review rule.

**⏰ Calendar rule (C §7.7 / D §2): every value on this page is a LAUNCH
DEFAULT, to be revisited against first-cohort data within 8 weeks of launch.
Set the reminder when the launch date is set — these numbers are starting
points, not truths.**

## The intensity matrix (Addendum D §2) — `packages/core/src/intensity.ts`

| Lever | foundations | building | together | final |
|---|---|---|---|---|
| Column trigger (runway) | >18mo (or Y3–4) | 18–9mo | 9–4mo | <4mo |
| New cases / week | 0.5 | 1 | coverage-driven | **0** |
| Review cap / session | 8 | 10 | 12 | 12, overdue-first |
| Boss Round size | 1 | 3 | 3 | 5 |
| Fluency thread | light (off Y3) | light | standard | standard |
| Mock ladder | locked | half | full, monthly | full, fortnightly |
| Weekly target (display) | 4 | 5 | 5 | 5 |
| Parent register | building foundations | building the toolkit | putting it together | staying sharp, staying calm |

**Rationale, cell by cell:**

- **No new types in the final stretch** — the matrix's most important cell.
  Teaching a brand-new question type three weeks before the exam manufactures
  anxiety for marginal marks. Coverage completion is therefore a pacing target
  at −4 months, surfaced to parents on the readiness meter long before it can
  become urgent.
- **Boss Round sizes (1/3/3/5)** resolve the D2 tension by composition: focus
  time yields the difference; the session cap does not move, ever. Recorded
  supersession: Addendum C §2 originally scaled 1→3→5 purely by runway with 1
  above nine months; Addendum D's matrix — which declares itself as modifying
  C — gives 18–9 months a 3. The matrix is the single source.
- **Review caps (8/10/12)** keep the warm-up proportionate to the runway:
  more consolidation as the exam nears, within the same fifteen minutes.
  Overflow rolls forward silently (Phase 3 scheduler; unchanged).
- **Year guard**: a Year 3–4 child never runs hotter than `building`
  regardless of the entered exam date — a strong young child goes deeper,
  not two years forward (D §3). Year 3 additionally runs with the fluency
  thread off and is never marketed as a start point (mission stance, D §1).
- **Weekly target 4 vs 5**: DISPLAY ONLY at present. David's implementation
  instruction for this build was "do not touch streak logic", so streak
  computation still uses its Phase 3 shape; the matrix value feeds parent
  copy only. Wiring it into streak earning is an open decision for David.

## Readiness thresholds (Addendum C §3) — `packages/core/src/readiness.ts`

- **HALF unlock:** 100% of the target blueprint's types at "taught and
  progressing" (mastery ≥ 0.55) + ≥40% of district cases cracked + Boss Round
  transfer ≥50% over the last 20 items.
- **FULL unlock:** ≥60% cracked + transfer ≥60% + one completed Half Boss
  Case.
- **The hard floor (no override):** no paper may contain a question type the
  child has never been taught — "taught" = the case has been opened, so the
  engine's forced first Mode has introduced it. Fairness law, not a setting.
- **Transfer is the Plain-mode signal** — rolling Boss Round accuracy is what
  mocks actually test, which is why it, and not practice accuracy, gates the
  ladder.
- **Early request:** HALF only, above the floor, through the deliberate
  parent flow that shows the readiness picture first. FULL has no early path.

## Ratification

| Decision set | Status |
|---|---|
| Intensity matrix values | **PENDING — David + specialist reviewer** |
| Readiness thresholds | **PENDING — David + specialist reviewer** |
| 8-week cohort review | **PENDING — set with the launch date** |

Nothing above requires ratification to run in dev/staging; production launch
of the mock ladder does (C §7.7).

## Content review checklist — story additions (STORY BIBLE v1.2, 2026-08-01)
Two checks join the reviewer's list for ALL story content (chapters,
storyWrappers, Board framing):
- **Tension-Law check (Law 2):** suspense lives in the mystery, never the
  child's performance. No answer, score or result may raise, lower or colour
  story stakes; resolutions are warm. A reviewer who cannot say "this beat
  reads identically for a child who got everything astray" returns the
  content.
- **Reading-age ladder check (map rule 3):** prose meets its chapter's
  declared readingAgeTarget (Ch1 ≈ 8.5 rising to ≈ 10); the mechanical lint
  (`pnpm check:reading-age`) is the floor, the reviewer's ear is the check.
  Seeded Vault words are the deliberate stretch and are exempt.
The Anti-Marker style scanner (`node scripts/scan-chapter-style.mjs`) runs in
CI: hard budgets block review submission; advisory flags require a logged
dismissal note in the chapter's styleDismissals. David's read-aloud pass
remains the final filter.

## Walk-script house style (reviewer ruling, written review 2026-08-02)

Decided by the specialist reviewer on the first English calibration pack;
recorded by David; method: written review 2026-08-02.

A walk script is the Walk-it mode's voice on a single item. The house style,
as ruled:

- **Direct.** No preamble, no throat-clearing. Start where the work starts.
- **Addresses the child.** Second person, talking to them, not about them and
  not about the item.
- **Three to four sentences.** Long enough to carry a chain of reasoning,
  short enough to read before patience runs out.
- **Scaffolds the logic TOWARD the answer.** It builds the path — where to
  look, what to compare, what that tells you — so the child can walk it.
- **Does not hand the answer over**, and **does not narrate the mistake.**
  Those are the two failure modes either side of the ruling: a script that
  states the answer teaches nothing, and one that recounts what a child got
  wrong teaches shame. Neither is the job.

Why it is written down here rather than left to taste: 78 items arrived with
walk scripts drafted against no stated style, and every future batch will
have the same problem until the style is a document. This is that document.

The scripts already in the bank were drafted BEFORE this ruling and have not
been re-checked against it — that is a reviewer pass on the second sitting,
not something to apply retroactively by script.

## OPEN — awaiting David: the storyWrapper consumer (raised 2026-08-12)

**Status: NOT DECIDED. This is a ruling David owes, recorded here so it stops
being a silence.**

### The gap

Story Bible v1.2 §9 lists, in **phase 1**: *"Case schema + `storyWrapper`
(open line, clue-skin labels, close line, season/thread tags)"*. §4 describes
what consumes it: a Case opens as a season lead, practice items render with
clue-skinning **in Case mode only** (the frame calls them "the postmarks";
stems untouched), and the cracked-stamp closes the lead with one story line.

§9's own deferred list — *"Deferred to art arrival / phase 2"* — names avatar
cosmetic slots, rank-transform outfits, cast art integration, spot
illustrations, and the signature story cases' bespoke staging. **It does not
name the storyWrapper consumer.**

What actually shipped: the field. `Case.storyWrapper Json?` exists, the zod
schema validates it, `seedCases` writes it. **Nothing reads it.** No app code,
no component, no route. The schema half of a phase-1 item is built and the
rendering half is not, and no decision was recorded either way.

### Why it needs answering rather than leaving

Zero cases carry a wrapper today, so nothing is broken and nothing is being
served incorrectly. That is exactly what makes it easy to leave — and why it
is worth deciding now:

- **The field is authored content.** The first case author to see it in the
  schema will fill it in, and their open and close lines will go through
  review, into the database, and render nowhere. Effort spent on content that
  reaches no child is the specific cost of leaving this open.
- **The cost of deciding is lowest today.** The shape was tightened on
  2026-08-12 (shared `season` type, `family` bound to `MECHANIC_FAMILIES`,
  constrained clue-skin keys, no `caseId` by ruling) precisely because zero
  wrappers exist. Every one of those constraints becomes a content migration
  after the first authored wrapper.
- **A dead field decays into a trusted one.** `Json?` in Prisma holds no
  shape. `pnpm check:db-content` now re-derives it off the row so a second
  door cannot write past the gate, but a field nobody reads is a field nobody
  notices going wrong.

### The three answers available

1. **Build the consumer in phase 1, as §9 says.** Case-mode open/close lines
   and clue-skin label substitution in the frame. Law 1 holds by construction
   — the wrapper never touches a stem.
2. **Defer it explicitly to phase 2**, and add it to §9's deferred list so the
   bible stops claiming it shipped. The field stays, gated and unauthored,
   with a note in the case-authoring brief telling authors to leave it empty.
3. **Drop the field** and re-add it when the consumer is built. Cheapest to
   reason about; loses the phase-1 schema work, which is small.

**Recommendation: (2).** The consumer is real work with a real design (which
frame words are skinnable is undecided, and that is a product question, not a
schema one), and there is no child-facing cost to waiting. What there IS a
cost to is the bible saying phase 1 delivered something it did not — a
deferred list that omits a deferred item is how the next reader concludes it
was built.

Whichever way it goes, `docs/CLUECREW-STORY-BIBLE.md` §9 needs the line, and
only David amends that document.

## OPEN — awaiting David: `clueTap.engineFamily` (raised 2026-08-12)

**Status: NOT DECIDED, but no longer unguarded.** The same shape as the
storyWrapper entry above, one level down, and recorded here so it does not stay
a smaller instance of a ruling already made.

### What it is

`chapter.clueTap.engineFamily` is authored on every chapter that carries a
clue-tap. **No code reads it** — not the reader, not the component, not the API
route. It was `z.string().min(1)`, so `wordweb`, `vr-04-closest-meaning` and
`banana` were equally legal, and the first chapter to carry one duly wrote a
question-type id into a field named for a family.

It is also **redundant**: the item's own `questionTypeId` already implies the
family, so nothing about it is a fact only the author knows.

### What was done now, and what is still open

Constrained rather than dropped, pending the ruling:

- the value is `MECHANIC_FAMILIES`, **optional** — only VR has that vocabulary,
  and a Maths or NVR clue-tap has an engine, not a `MechanicFamily`;
- `pnpm verify:chapters` already fetches the item, so the declaration is
  **proved** against `familyForType(item.questionTypeId)` rather than trusted.
  A wrong-but-legal family now fails the gate by name.

That makes it safe to author against. It does not answer whether it should
exist.

### The three answers available

1. **Give it a consumer.** The plausible one: a writer picks a clue by family
   ("a WORD WEB clue here"), and production resolves a real `itemId` at serve
   time from the family plus the child's tier. That is the design already
   recommended for chapter authoring — point at a family, never at an item id —
   and under it `engineFamily` becomes the load-bearing field and `itemId`
   becomes the derived one, which is the opposite of today's shape.
2. **Keep it as authoring metadata**, checked but unread, and say so — the same
   status as `Walk-it`'s `voicedBy`.
3. **Drop it.** It is derivable from the item, so nothing is lost but the
   author's statement of intent.

**Recommendation: (1), decided before Phase 2 authoring.** 28 chapters will
carry a clue-tap each, and the choice between "the chapter names an item" and
"the chapter names a family" changes what a writer delivers. Deciding after the
chapters are written means rewriting them — which is the same trap as binding a
wrapper to case ids, and it is why `storyWrapper` has no `caseId` field.

If the answer is (2) or (3), this entry is the record that it was asked.
