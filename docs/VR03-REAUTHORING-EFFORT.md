# What re-authoring the full vr-03 bank into typed shape takes

Report requested before building (reviewer, 2026-08-05). Her three reversal items
are captured as the first typed rows (`docs/vr03-typed-seed.json`).

## The shape
Each analogy becomes `{ pair, stem, answer, distractors:{ reversedRelation, wrongLink,
partForKind, sameTopic, exampleAnchor } }`. The constructor emits one distractor per
named diagnosis and tags it by construction — so every wrong option IS what its tag
produces (the lineup-counting-v5 property), verifiable by a gate.

## The work, in order of who does it

1. **Data authoring (hers) — the bulk.** ~25 analogy rows (the `ANALOGIES` table,
   which drives vr-03 AND vr-10). For each row she chooses which ~3 of the five
   diagnoses apply and authors the distractor word for each. **Not every relation
   supports every diagnosis** — a whole→part relation (flower→petal) has a natural
   reversed-relation (garden) and a part-for-kind, but a young→adult relation
   (kitten→cat) may have neither; there she picks same-topic + wrong-link +
   example-anchor. So it is a per-row curation, ~3 authored words × 25 rows ≈ **75
   distractor words**, each a real diagnostic instance. The three reversal rows are
   the template.

2. **Constructor rewrite (mine) — ~half a day.** Replace the fixed-slot tuple reader
   with a typed-row reader that emits the present distractors, tags each by its
   slot, and a `check:vr-distractors`-style gate that refuses a distractor whose
   value is not what its tag names (the VR gate already exists for the numeric
   banks; this extends it to vr-03's semantic slots by construction rather than
   derivation).

3. **Migration cost.** The re-authored rows generate NEW vr-03 items, so this
   churns the bank the re-import bundle is built from. Sequence it AFTER the current
   re-import lands, or fold it in — otherwise she reviews the same items twice.

## Bottom line
The generator *can* be the fix, exactly as she said — but the leverage is in the
DATA, not the code. The code change is small and one-off; the value is the ~25 rows
of curated diagnostic distractors, which is teacher work and hers. Relabelling the
two existing distractors stays the patch until those rows exist.
