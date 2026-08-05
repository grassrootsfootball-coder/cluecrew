# NVR distractor-tag vocabulary — the gap (for David)

**Why this exists.** The independent audit of the NVR packs found that six of the
thirteen templates emit the *same* misconception tag on two or three of their four
wrong options, on 100% of items — which breaks the rule THE MACHINE keeps, that a
distractor IS the distinct error its tag names. You ruled: **extend the corpus
vocabulary** rather than relax the rule or let me invent tags (corpus firewall).

This is the targeted brief for that. It says, per template, exactly which slot has
no distinct error to name, and describes the *behaviour* the missing tag would
model — so your analysis of the 103 papers can confirm whether that error is real
and give it a ratified id. **I have invented nothing here.** Where a family has no
honest fourth error, that is stated as a finding, not filled.

## The measured state

Every one of the 19 corpus ids is already in use — no constructor is ignoring an
available tag. THE MACHINE (series, matrix, analogy) reaches four distinct tags
because transformation puzzles have four distinct transformation errors.
Classification, counting, pure rotation, reflection and net tasks have two or three
honest error modes in the current vocabulary. So this is thin vocabulary for those
task types, not lazy tagging — with two exceptions called out below.

| Template | Wrong-option tags today | Distinct | Diagnosis |
|---|---|---|---|
| `turntable-rotation` | mirror-for-rotation, transform-not-applied, **series-phase-slip ×2** | 3/4 | thin: needs 1 |
| `turntable-reflection` | wrong-mirror-axis, transform-not-applied, **rotation-for-reflection ×2** | 3/4 | thin: needs 1 |
| `folding-net` | multi-part-tracking, net-mark-orientation, **net-adjacency-blindspot ×2** | 3/4 | thin: needs 1 |
| `lineup-like` (T1–3) | partial-rule-match, single-axis-fixation, **surface-similarity ×2** | 3/4 | thin at low tiers: needs 1 |
| `lineup-odd` | **single-axis-fixation / surface-similarity, assigned by option parity** | 2/4 | **decorative** — not a vocabulary gap |
| `lineup-counting` | **count-by-glance ×3**, surface-similarity | 2/4 | **single-error-mode** — may be inherent |

## The four thin families — one new ratified error mode each

For each, the two options currently sharing a tag are genuinely different pictures
produced by the *same* named error. The fix is a fourth distinct error to re-tag
one of them. Candidate behaviours to confirm against the corpus:

1. **`turntable-rotation`.** The duplicated pair is *over-turned by one step* and
   *under-turned by one step* (degrees ± 45). Candidate distinct error: **turned
   the wrong way** — a whole-angle turn in the opposite direction (anticlockwise
   when clockwise was asked). Is "wrong direction of turn" a distinct error you see
   in the papers, separate from the magnitude slip of phase-slip?

2. **`turntable-reflection`.** The pair is *half-turned instead of flipped* (180°)
   and *quarter-turned instead of flipped* (90°) — both "turned, not reflected".
   Candidate distinct error: **flipped across the shape's own centre, not the given
   mirror line** (a local flip that ignores where the mirror is), distinct from
   `wrong-mirror-axis` (right idea, wrong axis) and from turning.

3. **`folding-net`.** The pair is two different *adjacent* face-pairs offered as
   opposite. Candidate distinct error: **opposite-by-mirror** — picking the face
   directly across the net's centre on the flat sheet (which is not the folded
   opposite), distinct from the adjacency blindspot.

4. **`lineup-like` (T1–3 only).** At T4–5 the relational clause already supplies a
   fourth distinct error (`relational-rule-miss`); at T1–3 there is no fourth, so
   `surface-similarity` doubles. Candidate distinct error for low tiers: **matched
   the example's exact rotation/size** instead of the group's kind+shading rule —
   an over-specific-match error, distinct from the generic look-alike.

If any candidate is not a real error in your corpus, the honest alternative is to
accept the duplicate as a legitimately parameterised misconception for that family
(phase-slip genuinely goes both ways) — but that is the "relax the rule" path you
did not pick, so I have left these as gaps for you.

## The two that are not vocabulary gaps

- **`lineup-odd` is decorative.** The wrong options are the four group members, and
  the tag is currently assigned by `index % 2` — by *position*, not by what the
  figure represents. This is the one true "constructors tagging decoratively" case.
  A child who wrongly picks a group member fixated on the free-roaming axis
  (rotation or size), so the honest tag is `single-axis-fixation` (or
  `surface-similarity`) for all four — which is *fewer* distinct tags, not four.
  This needs a constructor decision, not a new id: retag honestly and accept that
  odd-one-out has one to two error modes.

- **`lineup-counting` has one honest error.** Counting wrong is `count-by-glance`,
  whatever the magnitude; the current `surface-similarity` on the count+2 option is
  a mild mislabel of the same miscount. Unless the corpus distinguishes, e.g.,
  *off-by-one* from *off-by-several* as separate diagnoses, this template may
  legitimately keep `count-by-glance ×3` and have its count+2 retagged to it too.

## What happens after you extend the vocabulary

Once new ids are ratified and imported as PROPOSED, I will: wire each into the named
constructor slot; add a **distinctness check** to `checkItem` (each wrong option a
distinct tag, with an explicit allow-list for any family you rule is legitimately
parameterised); bump those template versions; and re-export the packs. The
distinctness check is deliberately not added yet — it would fail CI on exactly the
six templates above until the vocabulary lands.

## Related

- Item variety for `folding-punch`, `lineup-counting`, `turntable-reflection`,
  `folding-plans` has been fixed (versions bumped to v2) — separate from this.
- Seven PROPOSED child hints exceed the 16-word cap and are flagged "copy fix" in
  the packs for the reviewer to reword; see the misconceptions section of THE
  MACHINE file.
