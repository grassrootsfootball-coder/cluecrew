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
