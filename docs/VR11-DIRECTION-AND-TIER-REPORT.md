# vr-11 — direction retired, constant-series gap, and the T5 structure (2026-08-06)

Reports the reviewer asked for after retiring the `vr-series-direction` distractor.
Nothing here is invented into the bank — these are proposals for her to author.

## 1. Constant-step series have no second executable diagnosis

With `direction` retired, the executable diagnoses for a number series are:

| diagnosis | needs | works on a CONSTANT step? |
|---|---|---|
| `off-by-one` (answer ± 1) | `answer` | yes |
| `step-carryover` (reuse the last *different* gap) | a changing gap (`prevStep ≠ step`) | **no** — a constant series has no different previous gap; `last + step` **is** the key |
| `direction` | — | retired (produced 0 / negatives, eliminable) |

So a constant series can field **only `off-by-one`** → **two options**. Restoring its
fourth option needs one or two **reviewer-authored** constant-step diagnoses. Two
genuine, executable candidates (each distinct from the key and from `off-by-one`,
which needs step ≥ 2 — every item here has step ≥ 2):

- **`series-stopped-early`** — gives the last shown term, forgetting to add the final
  step. Value = `last`. (e.g. `2,4,6,8 → 8`.) Distinct from key (`last+step`) and from
  `off-by-one` (`last+step±1`).
- **`series-double-step`** — adds the step twice at the end. Value = `last + 2·step`.
  (e.g. `2,4,6,8 → 12`.) Distinct from key and `off-by-one`.

Both are executable from the existing operands. With **one** of them a constant series
reaches three options; with **both**, four. Your call which (or both) to author — I have
not added them.

## 2. A genuine T5 structure

The +2 / +3 growing step tops out at T4 — a bigger grow is more arithmetic, not a harder
*structure*, so T5 stays honestly empty. Your two suggestions, made concrete:

- **Two interleaved operations** — alternate two rules on odd/even positions, e.g.
  `+3, ×2, +3, ×2 …` or `+2` on odds and `−1` on evens. The child must track two threads.
  This also *unlocks new executable diagnoses* (applied-the-wrong-thread, applied-one-op-throughout).
- **A multiplying step** — a geometric or step-multiplying series, e.g. `×2` (`3,6,12,24 → 48`)
  or a step that itself multiplies. Distinct error space from additive series.

Either is a real difficulty jump, not a magnitude bump. Recommend the interleaved-operations
form: it carries the richest, most derivable set of misconceptions.

## Recorded (not for action now): the vr-07 ladder caveat

Her note: vr-07 T2–T4 differ only by magnitude, so tier rides on a single variable — the
same shape as vr-04's difficulty resting on headword rarity. A structural climb is wanted
eventually: two-step expressions, or a letter defined in terms of another at the top tiers
(e.g. `S = P + Q`, then `P + R − S`). Backlog, surfaced, not this job.
