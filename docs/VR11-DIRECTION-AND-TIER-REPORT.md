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

### RESOLVED (reviewer, 2026-08-06)

- **`series-stopped-early` REJECTED** — it gives the last term, already printed in the stem, so
  it eliminates without reasoning (the same fault as `direction`). Not added.
- **`series-double-step` ACCEPTED, renamed `vr-series-step-applied-twice`** — "Added the step
  twice from the last term, usually after losing track of the gaps." Value = `answer + step`.
- **`vr-series-sum-of-last-two` ADDED (her authoring)** — "Read the series as each term being the
  sum of the two before it, and added the last pair." Value = `2·answer − 3·step`. The gate
  confirmed **all 13** constant items carry it with zero collisions, so constant series are now
  **four options**: off-by-one + step-applied-twice + sum-of-last-two.

## 2. A genuine T5 structure — RATIFIED (reviewer, 2026-08-06)

Alternating operations, **five terms shown**: `3, 6, 12, 15, 30, ?` running `+3, ×2, +3, ×2`,
answering **33**. A real structural jump, not a magnitude bump — the +2/+3 growing step tops
out at T4, so T5 stays empty until this lands.

It also **opens a new derivable error**: the child applying the wrong operation at the final
step (`×2` instead of `+3`), giving **60**. That is a fresh executable diagnosis to author when
the structure is built (`wrong-op-at-final-step`, value = apply the other operation to the last
term). Backlog — her spec, not this job. Needs: a five-term series generator with an
alternating-op operand shape, and the new diagnosis wired to the derivability gate.

## Recorded (not for action now): the vr-07 ladder caveat

Her note: vr-07 T2–T4 differ only by magnitude, so tier rides on a single variable — the
same shape as vr-04's difficulty resting on headword rarity. A structural climb is wanted
eventually: two-step expressions, or a letter defined in terms of another at the top tiers
(e.g. `S = P + Q`, then `P + R − S`). Backlog, surfaced, not this job.
