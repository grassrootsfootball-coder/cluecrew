# vr-06 Missing Word: rebuild to the GL rule (R1035)

## Why
The GL missing three-letter-word question rests on one rule: **the three missing letters are a word by
themselves.** MO___ with USE gives MOUSE; USE is a word. Children are taught to use the rule. It
narrows the options before they even read the sentence. Our prompt states the rule ("Three letters
that make a word are missing"), but only about 9 of the 40 LIVE keys are three-letter words a child
knows. The rest are fragments (EAD, PLA, CLE) or dictionary oddities (USH, OSE, BUR). The bank teaches
"complete the word" instead of the question type the child will sit.

## The design, every row
Three options, the same option ids, one key.
- **Key:** three letters that are a three-letter word a 9 to 11-year-old knows, such as OUT, ARM, EAR,
  PET, CAN, HIP, ATE or TEN. Put into the gap, they make a real, everyday word that completes the
  sentence sensibly.
- **Wrong answer 1, tag `vr06-ignores-sentence`:** a familiar three-letter word that also makes a
  REAL word in the gap, but that word does not fit the sentence. The child must read the sentence.
- **Wrong answer 2, tag `vr06-fits-gap-not-word`:** three letters that are NOT a word. Put into the
  gap, they make a NON-word. The child rejects it with the GL rule. (The tag's child hint is "The
  missing three letters make a little word all by themselves.")
- Vary which wrong answer is the harder one. On roughly a third of rows, give BOTH wrong answers
  `vr06-ignores-sentence` (two real words that don't fit), so the rule alone never settles a row.
  The answer must always need the sentence or the rule, never a surface feature.

## Hard rules
- **Exactly one defensible answer.** No other offered option makes a word that fits the sentence.
- **The target word is everyday vocabulary.** The child reads it in a sentence and must recognise it.
  No two rows use the same target word or the same key.
- **The gap word is in CAPITALS in the sentence**, with `___` for the three letters, e.g. "We dug in
  the soil to PL___ the seeds." Keep the gap the same length (three underscores).
- **The sentence is one or two sentences, each at most 16 words**, ending in a full stop. A dash does
  not end a sentence. British English. Words a 9 to 11-year-old knows.
- **Prompt, the same on every row:** "Three letters are missing from the word in capitals. Together
  they spell a word. Which three?"
- **Walk script:** two to four short sentences that show the method. Use the rule to rule out the
  non-word, then the sentence to choose between the real words. Name the target word. Never use
  "wrong". Each sentence is at most 16 words.
- **Executions** (staff-facing, at least 40 characters, every fact true): say what the letters make in
  the gap, and why it is the tagged mistake.
- Keep each row's existing option ids: a `rebuild` gives the whole row with the same three
  `optionId`s. Do not change `isKey` positions just to change them; the app shuffles options per child.

## Checks
From `packages/db`:
- `pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-proposals.ts --door=vr-06-gl --precheck --from-live`
  must report 0 fail. It runs the key gate, the child-facing gate and the tag-write gate on each row
  as written.
- `pnpm check:word-puzzles` checks the rule mechanically, but only on LIVE rows, so it runs after
  landing. Before that, use the same lexicon (`makeLexicon` in `packages/core/src/word-puzzles.ts`,
  as `scripts/check-word-puzzles.ts` builds it) to confirm the following: the key makes a word, every
  `ignores-sentence` answer makes a word, every `fits-gap-not-word` answer makes a non-word, and the
  key's three letters are themselves a word.
