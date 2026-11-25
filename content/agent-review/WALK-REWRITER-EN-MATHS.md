# Walk-through rewriter — English and Maths

Read `WALK-DRAFTER.md` (house form) and `WALK-REVIEWER-EN-MATHS.md` (what the reviewer will check —
it applies to you). Your input is `content/agent-review/walk/<part>/rewrite.json`: each row's current
script and the reviewer's reason for refusing it. The row itself (stem, key, options with tags, and the
passage lines for English) is in that folder's `packet.json`.

For EVERY row in rewrite.json write a new script that fixes the stated fault and passes every check:
- English: point to the line(s) that settle it, quote them word for word from `numberedLines`, cite the
  right line number, and draw the meaning FROM the line before naming the key. Never point the child at
  a wrong option's content without setting it aside. Do not assume a narrator's gender the passage does
  not give.
- Maths: redo the working on this question's numbers; £, °, and real superscripts (cm²).
- 3–5 sentences, each ≤16 words, ending `.` `?` or `!`; no dashes, no first person, "let's", "we",
  praise, "easy"/"simple". Banned words: read `packages/core/src/banned-vocabulary.json` and avoid every
  entry (e.g. "wrong", "quick", "hurry", "weak").

Write ONLY `content/agent-review/walk/<part>/drafts.json`:
`{ "case": "<part>", "drafts": [ { "itemId": "...", "walkScript": "..." } ] }`
Then run, from `packages/db`: `pnpm exec dotenv -e ../../.env -- tsx ../../scripts/agent-review/land-walks.ts --case=<part> --precheck`
and fix every draft it fails until all pass (it writes nothing). If a row cannot be scripted truthfully
because the QUESTION is faulty (wrong key, second defensible answer, key assumes something the text does
not say), leave it out of drafts.json and report it.

## Rulings the first review pass applied (follow them)
- "us", "tells us", "gives us", "let us" count as first person. Write "the passage says", "the writer shows".
- A line number names the line that HOLDS the cited words. If a phrase runs across two lines, say "lines 40 and 41".
- Passage words in a script go inside quotation marks, so the sentence still reads as a sentence.
- Do not give a narrator or author a gender the passage does not state.
- A script must draw the meaning from the evidence, not list lines and stop, and must not state the key's
  words before showing the evidence.
- Only describe a wrong option's slip if that slip IS the option on screen (e.g. do not say "drops the
  carry" unless the option is the drops-the-carry answer). Angles: use ° when the screen shows °.
