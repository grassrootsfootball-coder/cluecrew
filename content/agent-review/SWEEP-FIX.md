# Fixing the sweep findings: drafter brief (R1037)

The second-reader sweep (`content/agent-review/sweep/findings.json`) lists every LIVE row a second
reader would not sign, with the exact fault. You are a DRAFTING agent. A separate agent reviews
everything you write, so be exact.

## Faults you must NOT fix at row level (the library track fixes them)
A fault whose ONLY cause is the wording of one of these library entries is fixed once, in the library:
`maths-07-decimals-as-two-separate-whole-numbers`, `maths-47-translation-by-gap`,
`maths-61-reading-the-wrong-place-value-column`, `maths-72-wrong-operation-chosen`,
`maths-77-treating-a-percentage-as-money`, `maths-79-dividing-by-a-fraction-error`,
`maths-85-miscount-or-rounding-in-measures`, `maths-89-wrong-angle-total`, `vr04-wrong-strength`,
`vr16-loose-opposite`, `vr14-step-direction`, `vr13-wrong-pieces`, `vr-move-letter-second-word-invalid`,
`en-article-avoids-the-sound-choice`.

If a row's fault is a tag hint from that list and nothing else, leave the row alone. If the TAG
ITSELF is wrong for the option (a different mistake produces it), that IS a row fault: retag it.

## Your door
`content/agent-review/<door>/`:
1. Write a read-only scratchpad script (never in the repo), run from packages/db with
   `pnpm exec dotenv -e ../../.env -- tsx <path>`. It builds `packet.json` with your rows exactly as LIVE
   now: itemId, questionType, passageRef, stem, lineRefs, explanation, and options (optionId, value,
   isKey, tag, execution). Add `passages` (numberedLines) for English, `entries` (every ACTIVE attested
   tag with its description and child hint; the lander accepts only tags approved by `reviewer:rev-0001`
   or `reviewer:rev-agent-01`), and per row the sweep `finding` copied verbatim from findings.json.
   For shape, see `content/agent-review/english-rewrite/calibration/packet.json`.
2. Write `proposals.json` in the shape of `content/agent-review/english-rewrite/calibration/proposals.json`:
   - `seats` (replace one option's value/tag/execution);
   - `redrafts` (execution only);
   - `rebuilds` (the whole row with the same optionIds; hint or walk-script changes go in
     `explanationPatch`);
   - `notes`, with one line per row naming the fault fixed.

   Fix exactly the fault named, and nothing else unless a gate forces it.

## Rules
- Exactly one defensible answer. Every wrong answer is wrong under every reading and wrong in the way
  its tag names. Use only attested tags. Never create a second answer.
- Every line number and quotation is exact against `numberedLines`. Redo all arithmetic.
- Hints never hand over the answer: no either/or whose halves are options, and no restating the key.
  A walk script must reach the key and state it.
- Child-facing text:
  - sentences of at most 16 words, ending in `.`, `?` or `!` (a dash does not end a sentence);
  - British English and words a 9 to 11-year-old knows;
  - never "wrong", "fail", "weak", "careless" or "should have"; "behind" only for place;
  - maths notation £5.00, 4°C, 48 cm²;
  - never tell a child to say something aloud or draw (not every child can).
- If you rewrite a hint or walk script that carries an authorship marker (`hintAuthoredBy`,
  `hintAuthority`, `walkScriptApprovedBy`, `_walkScriptAuthority`), clear the marker and keep the old
  text under `_previous<Field>`, as earlier rounds did.
- A row you cannot fix honestly: leave it out and say why in `notes`.

## Self-check
From packages/db, until 0 fail:
`pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-proposals.ts --door=<door> --precheck --from-live`

Do not land, publish or commit. Reply with one line per row (fault → fix) and the precheck result.
