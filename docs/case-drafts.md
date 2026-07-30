# The remaining 15 cases — DRAFT, awaiting David's approval

Titles and narrative hooks for the fifteen VR question types that have no Case
yet. **Nothing here is live.** No case files exist for these; the district map
shows them as chips reading "Still on the Chief's desk." On approval each
becomes a `content/cases/case-vr-NN.json`, and the map picks it up on the next
seed.

Written to the same rules as the six already in the product:

- **Reading age ≤9** — sentences ≤16 words, at most one long word per hook
  (checked against the CI lint's own rules, all 15 pass).
- **≤30 seconds of reading**, skippable, never gating content (D5). All 15 sit
  at 12–18 seconds.
- **In-world always.** A case is a case, not an exercise.
- **The crew beat is an invitation, never a requirement** (manifesto §7 v1.1).
  A child alone must never feel blocked or lesser, so no hook waits on anyone
  else being there. The form varies so twenty-one cases do not read as a
  template.
- No exclamation-mark spam, no praise of the child, no banned vocabulary.

Mark up anything that misses. Titles are the easiest thing to change later; the
hooks are what set the mechanic up, so they matter more.

---

## Stowaway Alley — words hiding inside other words

| Type | Title | Hook |
|---|---|---|
| `vr-01-insert-letter` | **The Extra Guest** | A letter wants in. Slip the right one into the word and a new word appears. Leave one in a note for your crew to spot. |
| `vr-05-hidden-word` | **The Stowaway** | A small word is hiding across the join of two bigger ones. Look at the ends and the beginnings. Find one on a sign on the way home. |
| `vr-06-missing-word` | **The Gap in the Report** | Part of the report has worn away. Three letters are gone, and only one set fits. Read it to your crew and let them guess first. |
| `vr-20-complete-the-word` | **The Smudged Page** | Rain got to the case notes and took some letters with it. The word is still in there. Work out what belongs in the gap. |

## The Word Web — meanings that match, and meanings that trick you

| Type | Title | Hook |
|---|---|---|
| `vr-02-two-odd-ones-out` | **Two Don't Belong** | Five suspects. Three have something in common, and two do not. Find the pair that does not fit. Try it with things on the table at tea. |
| `vr-12-compound-words` | **The Joining Job** | Two small words can lock together to make one bigger word. Find the pair that clicks. See how many your crew can build from SUN. |
| `vr-13-make-a-word` | **The Word Builder** | Take the front of one word and the front of another. Put them together and a new word appears. Build one for your crew to solve. |
| `vr-16-opposite-meaning` | **The Mirror File** | Every word in this file has an exact opposite. Not just different — the true reverse. Call one out and see if your crew can flip it. |
| `vr-21-same-meaning` | **The Matching Pair** | Two words here mean almost the same thing. Swap one for the other and the sentence still works. Test one on your crew tonight. |

## Codebreaker Lane — codes, number trails and letter jumps

| Type | Title | Hook |
|---|---|---|
| `vr-07-letters-for-numbers` | **The Price of Letters** | Every letter has a price. Add them up and the word has a price too. Give your crew a word and see what it costs. |
| `vr-17-complete-the-sum` | **The Balanced Scales** | Both sides of the sign must weigh the same. One number is missing from the scales. Set one for your crew on paper. |
| `vr-18-related-numbers` | **The Middle Number** | Three numbers sit in a row, and the middle one comes from the outside two. Find the rule, then use it again. One triple is plenty for your crew. |
| `vr-19-word-number-codes` | **The Digit Code** | Someone wrote a word as numbers. Each letter has its own digit. Crack the key and you can read the rest. Send your crew a coded name. |

## Bridge Street — two words joined by a rule

| Type | Title | Hook |
|---|---|---|
| `vr-10-word-connections` | **The Missing Link** | Two words are joined by something. Work out what it is, then find the word that joins the same way. Ask your crew for a pair, then find its rule. |
| `vr-14-letter-connections` | **The Same Jump** | B to E is a jump of three. Find the jump in the first pair, then make the same jump again. An A to Z strip on the fridge helps the whole crew. |

---

## Notes for you

**The Deduction Den keeps one case.** Only `vr-15-reading-information` maps to
that family, and it is already written as The Locked Room. That quarter is
complete at one case, which is correct rather than thin.

**Two titles worth a second look.** *The Stowaway* names the quarter it sits in,
which may be a feature or may be confusing — say which. And *The Gap in the
Report* and *The Smudged Page* are neighbours doing similar work (letters
missing from a word); if they feel duplicative, the two GL types genuinely are
close, and one could take a different angle.

**What approval unlocks.** These fifteen plus the six live cases complete the
21 types the Phase 4 gate requires. They do not complete the gate: that also
needs ≥25 reviewed items per type through the CMS, which is still the larger
piece of work and still needs your review pass.
