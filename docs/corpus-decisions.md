# Corpus decisions log

The audit trail ADDENDUM-E §1 requires: every ratified decision that a corpus
finding motivated — finding → decision → who → date. This file, alongside the
firewall attestations, is the record proving analysis-not-copying if ever
questioned.

Format, one entry per decision:

> **Finding:** (artefact + citation id, e.g. `blueprint-evidence.json` /
> `inventory-vr-042`) · **Decision:** what changed and where ·
> **Who:** name(s) · **Date:** YYYY-MM-DD

---

- **Finding:** `inventory.json` (2026-07-31 inventory pass) rulings —
  1 exact-duplicate VR pair, 3 byte-identical NVR&Maths copies not staged.
  **Decision:** duplicate pair members and hash-matching alternates get
  `statisticalWeight: 0`; orphaned answer keys and fragments excluded from
  question-level passes (Addendum E §4.1). Applied in Cowork before the VR
  pass. **Who:** David (ruling), Corpus Analyst skill (application).
  **Date:** 2026-07-31.

- **Finding:** n/a — engineering prerequisite. **Decision:** similarity gate
  (§3) and misconception PROPOSED-import (§2) built and tested; thresholds
  shipped as config at hardFail 0.85 / review 0.60 pending week-one tuning
  against seed originals and David's private test derivations. **Who:** built
  per David's scoped instruction; threshold ratification PENDING David +
  reviewer. **Date:** 2026-08-01.

*(Entries below this line are appended as decisions are ratified.)*

## Entry 1 — four-pass campaign triage (2026-08-01, David)
Full text as ratified by David (SCP-M-1..5, SCP-NVR-1..5); this repo carries
the decisions and their derived config values only — evidence stays in the
private corpus folder, inventory-cited.

**Executed by Code (this entry's ingestion):** similarity index built per
Addendum E §3 (1,495 fingerprints, 86/103 papers; 17 image-only skipped —
OCR owed) → private storage, wired via SIMILARITY_INDEX_PATH; retro scan
over 565 unpublished items: ZERO fails, ZERO review flags. 37 corpus
misconceptions (18 VR + 19 NVR) imported PROPOSED with provenance.
SCP-M-3 plan revision applied (36 slots: +Puzzle 3 via deduction-den,
Stats 4, FDP 5; donors Number 8→6, Ops 6→5 — donor choice flagged for
ratification). SCP-M-2/M-4 → content/batch-mix.json (PROPOSED/ACCEPTED as
ruled). SCP-NVR-1..5 → content/nvr-generator-config.json (RATIFIED values)
+ gl-nvr-standard blueprint authored as draft PENDING REVIEWER VERIFICATION.
Sitting #1 page at /admin/sitting-one.

**Newly arrived since the log (NOT triaged — awaiting David):** the VR pass
evidence landed with four proposals (SCP-VR-1..4: blueprint shape/timing
verification, registry homes for letter-shift ciphers and related-numbers,
demotion of never-observed types in batch mixes, the unscaffolded
read-and-reason teaching convention). Listed in the session report's
ratification block; nothing applied.

## Entry 2 — VR difficulty pass and the first English pass (2026-08-01, David)

- **Finding:** `difficulty-map.json` (pass-1 VR, 400 questions across five
  weighted GL-format papers) / SCP-VR-5. **Decision:** the VR batch mixes
  move off the 20/30/30/20 spec default. Practice pool RATIFIED at
  **15/30/35/18/2**, mock pool at **10/30/40/18/2** — mocks match observed
  reality, practice keeps a kinder T1 floor. The intensity matrix's T3
  centre of gravity is confirmed by the data, not amended.
  **Who:** David (ruling), Code (applied to `content/batch-mix.json`).
  **Date:** 2026-08-01.

- **Finding:** `difficulty-map.json` per-type distributions / SCP-VR-6.
  **Decision:** per-type tier envelopes are constrained to the OBSERVED
  range rather than a uniform T1–T5 — 17 registry types carry ratified
  envelopes in `batch-mix.json.typeTierEnvelopes`. Three observed types
  (`vrP-06_complete-word-sentence`, `vrP-19_two-meanings`,
  `vrP-EXTRA-alphabet-cipher`) have no unambiguous registry home and are
  recorded as `pendingRegistryMapping`, NOT applied — mapping them is
  David's or the reviewer's call, and a guess would constrain the wrong
  generator. **Who:** David (ruling), Code (applied + flagged).
  **Date:** 2026-08-01.

- **Finding:** `batch-mix-proposal.json` (Maths section) / SCP-M-2.
  **Decision:** unchanged in status — **still reviewer-held**. The GL-maths
  values are re-copied from the proposal artefact as PROPOSED
  (practice 20/33/30/15/2, mock 20/35/28/15/2). **Discrepancy flagged, not
  resolved:** the value previously recorded in `batch-mix.json` was
  [20,32,28,15,5], which matches neither the spec default nor the proposal
  artefact; its origin is unexplained. **Who:** David (status), Code
  (transcription + flag). **Date:** 2026-08-01.

- **Finding:** English pass (v1) SCP-E-1/2/5/6/8. **Decision:** accepted as
  the GL-family evidence base. *(Superseded in part the same day — see
  Entry 3.)* **Who:** David. **Date:** 2026-08-01.

- **Finding:** SCP-E-7 (no writing tasks in the v1 corpus). **Decision:**
  accepted as "writing scoped out of English v1". **REVERSED the same day
  by Entry 3** on acquired evidence; the entry stands here because the log
  records what was decided when, not only what survived.
  **Who:** David. **Date:** 2026-08-01.

- **Finding:** `misconception-import.json` (Addendum E §2 contract).
  **Decision:** import as PROPOSED with provenance; the 26 English entries
  of that version queue against a district that did not yet exist.
  **Who:** David (ruling), Code (import). **Date:** 2026-08-01.

- **Finding:** engineering prerequisite — the OCR gap recorded in Entry 1.
  **Decision:** close it locally. `scripts/build-similarity-index.ts` now
  falls back to macOS Vision OCR (`scripts/ocr-page.swift`) for image-only
  papers, and writes a `similarity-index-coverage.json` sidecar naming every
  paper indexed, OCR'd or still missing — the previous build only logged its
  skip list to a terminal. Nothing leaves the machine; recognised text is
  fingerprinted in memory and discarded. **Who:** Code, per David's
  instruction to close the gap. **Date:** 2026-08-01.

- **Finding:** `teaching-notes.md` (cross-district technique observations).
  **Decision:** two nodes enter the exam-technique tree as CONTENT SLOTS
  only — a foundational "finish the check" node (partial verification,
  cross-subject) and a "know your paper's clock" node. Scripts, Modes and
  item links remain reviewer-pipeline content.
  **Who:** David (ruling), Code (slots authored in
  `content/exam-technique-tree.json`). **Date:** 2026-08-01.

## Entry 3 — English v2 (acquired papers) and the writing reversal (2026-08-01, David)

Twelve acquired papers (6 CSSE-style, 6 independent-school, 4 mark schemes)
extended the English evidence base and changed its shape. Recorded here
BEFORE any English build, per David's instruction.

- **SCP-E-7 REVERSED. Writing is IN v1.** The v1 corpus carried no writing
  tasks; the acquired papers carry compulsory writing at 25–43% of marks.
  The earlier "scoped out" ruling in Entry 2 is superseded, not amended —
  both entries stand with their dates. **Who:** David. **Date:** 2026-08-01.
- **SCP-E-1 revised to GL-specific.** The 56% SPaG share does not
  generalise: standalone SPaG is ~0 outside GL. Error-spotting scopes to
  the GL track only (SCP-E-10).
- **SCP-E-5 and SCP-E-6 superseded by SCP-E-11.** The T4 ceiling breaks
  outside GL (graduated ladders, 12-mark analysis essays, banded writing
  grids reach T5), and authorial technique inverts from marginal (~5% of GL
  items) to dominant (22 of 35 reading marks at Alleyn's). SUMMARY stays
  unbuilt — still zero evidence anywhere.
- **SCP-E-9 accepted:** English needs a second item model — open-response
  with an acceptable-answer set, point or graduated credit, band
  descriptors and optional embedded SPaG riders. Distractor authoring does
  not apply to it.
- **SCP-E-10 accepted:** error-spotting is GL-only; CSSE-style open items
  need embedded-SPaG-rider support.
- **SCP-E-11 accepted:** T5 allowed on independent tracks; technique
  weighting raised sharply there.
- **SCP-E-12 accepted (revises E-8):** the passage bank needs three
  streams — public-domain pre-1950 extracts (the 77% majority),
  commissioned contemporary prose, and at least one commissioned complete
  poem. The passage-hard/stems-plain fairness split still holds.
- **SCP-E-13 accepted:** writing support is cheaper than assumed — one
  five-domain rubric implementation serves the whole non-GL market.
- **SCP-E-14 accepted:** prompt scope is response-to-stimulus,
  continue-the-passage and constrained narrative/descriptive ONLY.
  Persuasive, discursive and picture-led have zero evidence and are not
  built.
- **SCP-E-15 accepted:** the perspective constraint is taught as a
  first-class skill.
- **SCP-E-16 accepted:** mid-paper writing placement is taught as a timing
  hazard, and planning-without-scaffold as a habit.
- **SCP-E-17 accepted:** the teachable unit outside GL is a four-rung
  ladder graded within one question. Resolved without changing the Mode
  framework — Walk-it already teaches faded multi-step.

**Who:** David (all rulings), Code (transcription).
**Date:** 2026-08-01.

**Executed by Code against Entries 2–3:** misconception import re-run
against the v2 artefact — 34 ENGLISH entries imported PROPOSED with
provenance (the file's own count rose from 26 to 34 on the v2 append);
18 VR + 19 NVR already present and left untouched, per the re-runnable
import rule. Database state after: 71 PROPOSED (18 VR / 19 NVR / 34
ENGLISH), zero claiming approval, zero referenced by any item option —
the Addendum E §2 door verified closed by query, not by assertion.

## Entry 4 — Word Vault card import (2026-08-02, David)

- **Finding:** `word-vault-cards.json` (180 cards, 6 batches, drafted
  `ai-draft:cowork-okafor-v1` from `vocab-findings.json` plus the Stream A/B/C
  passage candidates). **Decision:** import to the Word table as DRAFT,
  pending reviewer approval. **Who:** David (ruling), Code (import).
  **Date:** 2026-08-02.

- **Finding:** engineering prerequisite discovered during that import — the
  Word table had **no review door at all**. Anything written to it was
  immediately collectable by a child, so "import as DRAFT" was not expressible
  and 180 AI-drafted cards would have gone straight to children.
  **Decision:** Word gains `status` (DRAFT default, fail-closed), `authoredBy`,
  `reviewedBy`, and every child-facing query — vault, warm-up collection,
  review-quiz distractors, session bonus, story seeding, story collect-word —
  now filters `status: LIVE`. The 120 pre-existing cards were backfilled to
  LIVE, since they were already being served. Two CHECK constraints: a
  two-sense card must carry a second sense, and a LIVE card must name its
  reviewer. **Who:** Code, surfaced to David in the same report.
  **Date:** 2026-08-02.

- **Finding:** `supersede-proposals.json` — three incoming cards duplicate an
  existing headword (`genuine`, `hollow`, `transparent`). **Decision:**
  replace the existing card, take the CORPUS tier, and keep an audit note on
  the row carrying the displaced values verbatim plus the ratification.
  Applied: genuine T3→T3 (unchanged), hollow T1→T2, transparent T5→T3.
  All three replacements carry two senses where the originals carried one.
  **Who:** David (ratification), Code (application). **Date:** 2026-08-02.

- **Finding:** 67 cards in the vault carry two senses (64 of the 180 plus all
  three supersedes). **Decision:** these are the item-pool source for the
  WORD WEB **"Two Meanings"** question type. The flag is queryable —
  `Word.twoMeanings`, indexed with `status` — so the pool is a query, not a
  hand-maintained list. **BLOCKED, NOT APPLIED:** the VR registry has no
  "Two Meanings" question type (21 types; the nearest are `vr-16-opposite-meaning`
  and `vr-21-same-meaning`, both `select-two`), and no registered mechanic
  binds to the WORD WEB engine family. This is the same gap already recorded
  as `vrP-19_two-meanings` in `batch-mix.json.typeTierEnvelopes.pendingRegistryMapping`
  and held under SCP-VR-2/3. Creating the type is David's or the reviewer's
  call, so the pool source is declared and the binding is left open.
  **Who:** David (declaration), Code (flag + escalation). **Date:** 2026-08-02.

**Quality gates run against the incoming cards (not yet passed — this is why
they are DRAFT):** 164 of 183 cards carry at least one sentence longer than
the repo's 16-word reading-age cap (worst: 31 words), and 21 cards carry
banned child-facing vocabulary in a definition or sentence. The authoring
brief asked for disambiguating sentences and the house lint caps sentence
length; the two pull against each other and the reviewer needs to rule.
Recorded rather than resolved.

## Entry 5 — three rulings on the vault import (2026-08-02, David)

- **Finding:** the reading-age lint failed 164 of 183 incoming Word cards on
  sentence length. **Decision — SPEC CORRECTION, David's own:** the 16-word
  cap applies to item stems, options and instructions only — text a child
  reads under time pressure. A Word-card sentence has reading age ≤9 but **no
  word cap**: disambiguation is its required function and a long sentence is
  often correct. Reading age is now checked BY ROLE. Recorded against
  BUILD-PHASE-4 §5 (which said "reading age ≤9" and never said 16 words — the
  cap was an implementation over-reach). The manifesto §6 wording, "Reading
  age ≤9 for instructions", was already correctly scoped and is unchanged.
  **Who:** David (correction), Code (applied). **Date:** 2026-08-02.

- **Finding:** banned child-facing vocabulary in incoming Word cards.
  **Decision:** these are PRODUCT VOICE, not quoted text — the manifesto v1.5
  passage-quote carve-out does not apply. The affected cards go back to Cowork
  for redraft. Applied: **23 cards** (not the 21 first reported — the canonical
  ban list is broader than the ad-hoc check used in the first pass) marked with
  reviewer notes and exported to
  `vault/word-card-redraft-requests.json`. **Who:** David (ruling), Code.
  **Date:** 2026-08-02.

- **Finding:** the lint reads `content/words/words.json` and the scanner reads
  source files, so a database import evaded both. **Decision — the priority of
  the three:** the gates run against the DATABASE as well as the content files.
  Applied: the ban list and the reading-age rules now live in ONE place
  (`packages/core/src/banned-vocabulary.json` + `content-gates.ts`), read by
  the file scanner, the new `pnpm check:db-content` sweep, and the Word publish
  door. Policy: a row that can SERVE fails the build; a DRAFT row is reported
  as backlog, because blocking CI on an authoring queue teaches people to skip
  the gate. **Who:** David (ruling), Code. **Date:** 2026-08-02.

**Caught immediately by the new database sweep** — a live violation no
file-based lint could ever have seen: `misconception:vr10-topic-match`'s child
hint was 17 words and ACTIVE, i.e. reaching children. Reworded at source
(`generate-content.ts`) and in the serving row.

**RESOLVED — the `guarantee` card.** David ruled 2026-08-02: a
`headwordInOwnCard` exemption, recorded as a scanner rule (manifesto v1.6),
not a per-card exception. The card is back in the approvable set; the redraft
list drops from 23 to 22. Superseded text follows.

**Was open, now resolved — the `guarantee` card.** The card teaching the word
"guarantee" is caught by L1's outcome-claim rule, on its own example sentence
("The shop guarantees the bike for two years"). That is vocabulary, not a
claim about ClueCrew, and it cannot be reworded without removing the word
being taught. The same shape as the passage-quote problem. Options: exempt a
Word card's own headword within its own card — mirroring the exemption the
long-word rule already grants it — or drop the card. NOT decided here; the
card sits returned.

**Two Meanings registry binding: left open**, held under SCP-VR-2/3 for the
reviewer at sitting, per David's instruction.

## Entry 6 — the headwordInOwnCard rule (2026-08-02, David)

- **Finding:** the card teaching "guarantee" failed L1 on its own example
  sentence. **Decision:** a Word card may use its own headword in its
  definition, sentence and image prompt even where that headword is on the ban
  list — a SCANNER RULE, tightly bounded, not a per-card exception. Applied in
  both gates: `packages/core/src/content-gates.ts` (database sweep + publish
  door) and `scripts/scan-vocab.mjs` (content files), with the same matching
  logic so the two cannot disagree. The `guarantee` card returned to the
  approvable set. **Who:** David (ruling), Code. **Date:** 2026-08-02.

**Found while implementing, NOT applied — image prompts are not scanned at
all.** The ruling names the image prompt as a place the exemption applies, and
it does; but switching image prompts on as a scanned surface is a separate
decision. 13 existing cards would fail immediately, almost all on spatially
innocent phrasing ("a puppy behind a stair gate", "seagulls behind a ferry"),
where D1's ban on "behind" is about a child being behind in progress, not
about position. That needs a role of its own. `checkWordCardImagePrompts` is
exported and correct for whenever the call is made.

**Vault state after the ruling:** 183 imported cards — 161 approvable, 22 out
for redraft.

## Entry 7 — "behind" narrowed, image prompts scanned (2026-08-02, David)

- **Finding:** the D1 ban on "behind" was implemented as a bare word match.
  Across the Word Vault, **23 of 23** real occurrences were spatial ("a puppy
  behind a stair gate", "seagulls behind a ferry") and none was about a child
  lagging — a 100% false-positive rate. **Decision:** narrow the pattern to
  the progress senses only. D1's intent is that a child is never told they are
  lagging; position is not that. **Who:** David (ruling), Code.
  **Date:** 2026-08-02.

- **Finding:** image prompts were unscanned. **Decision:** scan them under the
  child-facing vocabulary rules — a prompt becomes an illustration a child
  sees. The reading-age caps are deliberately excluded: no child reads an
  illustrator's brief. **Who:** David (ruling), Code. **Date:** 2026-08-02.

**Effect, measured.** 8 cards returned to the approvable set, all of them
spatial-"behind" false positives — including `hollow` and `transparent`, two
of the three supersede replacements, which had been blocked on nothing.
**Image-prompt failures after the narrowing: zero.** The redraft list falls
22 → 14, and every one of the 14 is a real violation ("wrong" ×10, plus
"fail", "clever", "should have", "you must").

**Vault state:** 183 imported cards — **169 approvable**, 14 out for redraft.

## Entry 8 — English calibration tranche imported, reviewer rulings applied (2026-08-02)

- **Finding:** the first reviewer pack found an empty item table. The 78
  GL-track English items had been drafted by Cowork and never imported.
  **Decision:** import all three batches as DRAFT. **Who:** David (ruling),
  Code. **Date:** 2026-08-02.

  Two prerequisites the batches could not supply were created on the way in:
  the **seven ENGLISH question types** (the district had none registered, so
  an item had no foreign key to point at and literally could not exist), and
  the **10 misconceptions authoring raised while drafting**, landed PROPOSED.
  That resolves the 34-vs-44 discrepancy reported against the first pack:
  34 from the corpus passes, 10 raised by authoring, 44 in the queue.

- **Finding:** reviewer rulings from the written review. **Decision:**
  approve the **34** the reviewer actually saw — identified by provenance
  (`ai-corpus:v1`), so the 10 raised afterwards stay PROPOSED because they
  were never in the pack. `benevolent` moved tier 5 → 4. Walk-script house
  style recorded in `docs/pedagogy-decisions.md`. All recorded through the
  written-review path: approvedBy = the reviewer, recordedBy = David,
  method = "written review 2026-08-02". **Date:** 2026-08-02.

- **Finding:** approving a misconception makes its child hint SERVE, and
  nothing checked that hint on the way through. **Decision:** the approval
  door now runs the child-facing gates before activating, with an explicit
  `skipCopyGate` escape hatch that someone has to own. **Date:** 2026-08-02.

- **Finding:** internal ids could reach a child. **Decision:** a gate in both
  the shared content-gates module and the file scanner refusing district
  slugs, provenance strings, batch ids and internal statuses in child copy —
  shaped to leave ordinary hyphenated English alone. **Date:** 2026-08-02.

**Open and reported, not resolved here:**
1. **13 of the 34 approved hints fail the child-facing gates** (11 over the
   16-word hint cap, 2 carrying "wrong"). They are ACTIVE, so the database
   sweep is red until a copy pass. Not reworded by script: the reviewer owns
   that wording. No child is affected today — every English item is DRAFT.
2. **23 of 26 item gate failures are SPaG stems**, where a long sentence is
   the format: an error-spotting stem IS a sentence to proofread, and a cloze
   stem carries the sentence with the gap. This looks like the same category
   of spec error David corrected for Word cards, and wants a role of its own.
3. **Quoted passage text inside stems.** `ENG-002-pp-17` embeds an Austen
   line ("in this stupid manner") directly in the stem. The v1.5 carve-out
   only sees a structural `passageQuote` span, so inline quotation in a stem
   is invisible to it — this is the Austen carve-out ruling, now with a
   concrete instance.
4. **No engine binds `error-spot` or `cloze`.** The types are registered
   honestly; the items cannot render until an engine exists.

## Entry 9 — three corrections and a standing note (2026-08-02, David)

- **SPaG STEM ROLE (spec correction, David's own — same class as the
  Word-card one).** Error-spotting and cloze stems take reading age ≤9 but
  **no word cap**: the sentence to be proofread or gapped IS the format, and
  shortening it destroys the question. Added as `item-stem-proofread`, keyed
  on the question type's **mechanic** (`error-spot`, `cloze`) rather than a
  list of type ids, so any future error-spotting type is covered the day it
  is registered. English item failures fell **26 → 8**.

- **INLINE QUOTATION.** The v1.5 carve-out only saw a standalone span, so a
  quotation embedded in a stem was invisible to it and an author had no way
  to declare one. A stem now declares its quoted spans
  (`stem.quotes: [{ text, passageRef, lineRefs }]`), validated at the
  bulk-import door: the span must genuinely appear in the prompt, and it may
  only cite the passage the item itself reads. The ban list steps over
  exactly those characters. Reading age is deliberately NOT exempted — a
  child reads the quote as well as our wording, so it still counts toward the
  load; the carve-out is about whose VOCABULARY it is, never about how much
  there is to read. `ENG-002-pp-17` is annotated as the worked example.

- **The 13 failing child hints** (across 12 misconceptions — one carries two
  faults) are listed for the reviewer at
  `content/exports/hints-to-reword-2026-08-02.{html,json}`. **Not amended:**
  the copy is theirs. The approval door now gates on these rules, so this
  cannot recur silently.

**STANDING NOTE — the 78 walk scripts predate the house-style ruling.** They
were drafted before the style was written down (direct; addresses the child;
3–4 sentences; scaffolds the logic toward the answer rather than handing it
over or narrating the mistake). **They need a pass against it before any of
these items goes LIVE.** Not applied retroactively by script: rewriting 78
teaching scripts to a style is authoring work, and doing it mechanically
would produce 78 scripts that satisfy a word count and teach nothing.

## Entry 10 — tested tokens, and the principle behind all four (2026-08-02, David)

- **TESTED-TOKEN EXEMPTION.** A spelling-spot item may declare its tested
  tokens (planted misspelling plus correct form); a vocabulary item may
  declare the word under examination. Declared tokens are exempt from the
  **vocabulary ceiling inside their own item only** — bounded exactly like
  `headwordInOwnCard`. It reaches neither the ban list nor sentence length,
  and matching is normalised equality rather than a prefix, so one
  declaration cannot cover a family of words nobody vetted. At most six
  tokens per item: beyond that it is not a test, it is an exemption.
  Applied to `ENG-003-A-SP-06`, `ENG-003-A-SP-09`, `ENG-002-pp-19`, which
  were being marked down for containing their own questions.

- **MANIFESTO v1.8 — content ABOUT language vs content that USES language.**
  Recorded with the four precedents that produced it: word cards, quoted
  passages (standalone and inline), proofread stems, tested spellings. The
  shape they share IS the rule — declare the exemption structurally, cover
  only the declared span or token, lift one named gate rather than all of
  them, and report a declaration that does not resolve rather than trusting
  it. Written so the fifth case is anticipated rather than discovered by a
  gate failing on correct work, which is how all four of these arrived.

**Effect.** English item failures: **26 → 8 → 5**. The five remaining are
genuine comprehension stems over the 16-word cap, exported for Cowork at
`content/exports/stem-redraft-requests-2026-08-02.json` to go back with the
word-card redraft batch. Note the sixth: `ENG-002-pp-19` was a false positive
that the tested-token exemption resolved — it was flagged for containing
`fastidious` twice, on the item whose question is what `fastidious` means.

## Entry 11 — reviewer's second pass (2026-08-03)

Recorded via the written-review path: approvedBy = the reviewer,
recordedBy = David, method = "written review 2026-08-03".

- **Two mistagged distractors corrected.** `ENG-001-WIW-14` "The Mole was
  tired and wanted to go home" moved wrong-scope-retrieval →
  **plausible-not-stated** (the detail is not in the passage at all).
  `ENG-002-pp-11` "To show that the two men were really rather alike" moved
  vocab-secondary-sense → **`en-relation-word-flipped`** ("alike" is an
  antonym of the target word "contrast", not another sense of it). The
  reviewer's point is the one that matters: **the tag chooses the hint**, so a
  mistagged distractor teaches the wrong lesson to exactly the child who
  needed the right one.

  `en-relation-word-flipped` is **PROPOSED**, one of the ten raised by
  authoring that the reviewer has not yet seen. `ENG-002-pp-11` therefore
  cannot reach LIVE until it is approved — correct behaviour, and the reason
  those ten are now packaged for them.

- **Five stems applied verbatim** from the reviewer's reply. Four pass the
  gates outright. `ENG-001-WIW-14` does not — see Entry 11 note below.

- **Authoring calibration log created** (`docs/authoring-calibration-log.md`)
  with two house rules: R1 over-long stems are SPLIT, not compressed, with
  the reviewer's five rewrites as worked examples; R2 tag the misconception
  the distractor actually executes.

**Note — one rewrite does not clear the gates.** `ENG-001-WIW-14` now passes
the 16-word cap but trips the VOCABULARY ceiling: the split traded "a man who
tells exciting stories" for "a storyteller", and with "comparison" already in
the sentence that is two four-syllable words where one is allowed. Not
edited — it is the reviewer's copy. Worth their attention that **splitting
can raise vocabulary**, which is the counter-pressure to R1. Also worth
noting the syllable heuristic counts "storyteller" as hard because it is a
compound, which may be a false positive of the same family as the four
already corrected.

**Reviewer reports two artefacts never reached them** — `hints-to-reword`
and the ten new misconceptions. Both are now packaged:
`review-pack-english-misconceptions-2026-08-02.pdf` (the ten, with a
decisions template) and `hints-to-reword-2026-08-02.html` (the twelve).

## Entry 12 — quotation outside the cap, and the ENG-003 remodel (2026-08-03)

- **GATE RULE (manifesto v1.9).** Text inside a declared `stem.quotes` span
  is excluded from the 16-word sentence cap. Our wording around it is still
  counted and still capped, so the exemption cannot be widened by quoting
  loosely. `ENG-002-pp-17` passes on nine words of our own wording, carrying
  a 15-word Austen line. Implementation note: the quotation is STRIPPED
  before sentence splitting rather than blanked, because a quote ending in a
  full stop would otherwise cut our sentence in two and each half would look
  short — flattering the count instead of measuring it.

- **STRUCTURAL FIX, ENG-003.** 18 error-spotting items remodelled: the stem
  now carries the instruction only, and the four-segment sentence lives where
  the format puts it, in options A–D with N as the fifth. The stem had been
  carrying a full duplicate of the sentence (38–47 words) that the child
  already had in front of them. **No segment text was altered.** Each item
  was verified first by reconstructing the sentence from options A–D and
  comparing it to the stem's copy — all 18 matched exactly. One audit row per
  item.

  **N remains genuinely keyed 1–2 per set of nine**: spelling 2, punctuation
  1. Relocating text does not touch a key, and both were re-counted after.

  **Cannot be cleanly split — the 16 cloze items, and correctly so.** Their
  options are candidate words for a gap, and the sentence carrying that gap
  has to stay in the stem or there is no question. They are a different item
  shape wearing the same district prefix, not a defect. This is why the
  instruction's "34 SPaG items" resolves to 18 remodelled and 16 left alone.

**Effect: ENGLISH items failing the gates are down to 1 of 78** — only
`ENG-001-WIW-14`, the reviewer's own rewrite, on the vocabulary ceiling
("storyteller", "comparison"). That one is with them.

## Entry 13 — the quotation carve-out completed (2026-08-02)

- **Extended to the vocabulary ceiling.** Words inside a declared
  `stem.quotes` span no longer count toward the long-word ceiling, on the
  same bounds as the sentence-cap rule: declared span only, own item only,
  lifts that one gate. Rationale (David's): comprehension passages are
  pre-1950 literature by design, so quoted archaic vocabulary is the content
  under test, not a fairness failure. Manifesto v1.9 updated — precedent 2 is
  now complete, exempting a declared span from all three gates.

- **ENG-001-WIW-14 confirmed, and it stays with the reviewer.** It declares
  **no quotation at all**: the stem paraphrases the passage ("a small child
  walking beside a storyteller") rather than quoting it. Both flagged words
  are therefore our own wording — verified, not assumed — so the extension
  does not touch it.

**Honest note on the effect: this change cleared nothing.** Exactly one item
in the bank declares a quote (`ENG-002-pp-17`), and its Austen line contains
no four-syllable words. The rule is correct, tested and forward-looking — it
matters for the passage-heavy items still to come, not for what is here now.
English items failing the gates remain **1 of 78**.

**The teaching point, now in the calibration log:** a paraphrase is OUR
wording and is measured as such; a declared quotation is the passage's and is
not. WIW-14 fails precisely because it paraphrased where it could have quoted.

## Entry 14 — reviewer's returns, second pass (2026-08-03)

Recorded via the written-review path: approvedBy = the reviewer,
recordedBy = David, method = "written review 2026-08-03".

- **Ten new English proposals: 8 approved, 2 refused by the copy gate.**
  `en-narrator-voice-as-fact` (20-word hint) and `en-relative-pronoun-choice`
  (17-word hint) were refused because their child hints fail the 16-word cap.
  Not forced through — `skipCopyGate` exists but is a decision someone has to
  own, and the reviewer is already rewording twelve hints, so these join that
  list rather than bypassing the door that was built last week for exactly
  this. `en-relative-pronoun-choice` sits on 3 options of `ENG-003-A-CZ-B4`,
  which therefore stays blocked from LIVE; the other has no items yet.

- **`ENG-001-WIW-14` stem applied verbatim** and it **passes every gate**.
  The reviewer's second attempt drops "storyteller" for "a man. The man tells
  tales." — the compound noun that tripped the vocabulary ceiling is gone,
  and the split follows R1. **The English item bank now has ZERO gate
  failures across all 78 items.**

- **Mistag check complete.** The reviewer checked tagging across the
  remaining 69 items and confirmed it sound. Both errors found in the whole
  tranche were inside the nine the authoring pass had self-flagged as low
  confidence.

  **The signal worth keeping: Okafor's low-confidence self-flagging
  correlated with the actual errors.** Two errors, both inside the nine
  flagged, none in the sixty-nine unflagged. On one tranche that is not
  proof, but it is the first evidence that the self-flag carries real
  information — and it is cheap to act on. **Recommendation for future
  batches: review the self-flagged set first and at full depth.** If the
  correlation holds over a second tranche, it becomes a basis for sampling
  the unflagged remainder rather than reading every item, which is the
  difference between a reviewer sitting that scales and one that does not.
  Worth measuring deliberately on the next batch rather than assuming.

## Entry 15 — The reviewer's returned copy, and the surface nobody was checking
*2026-08-02. Written by the reviewer, recorded by David via the written-review path.*

**Twelve reworded child hints, ten applied.** The reviewer's rewrites came back
against the fault list in the hints-to-reword pack. Ten passed the child-facing
gates and were written verbatim; the previous wording is preserved in the audit
detail on each `misconception.hint_rewrite_recorded` row, because replacing a
hint changes content a child may already have met.

**Two were held back, unamended.** `en-inference-literal-lookalike` and
`en-wrong-scope-retrieval` both fixed the fault they were sent for and
introduced a new one: "incorrect" (§1.3). The rule holds in both directions —
we do not amend the reviewer's copy, and we do not wave a scanner hit through
because of who wrote it. Both go back with the specific word named. Their old
text still serves and still fails, so `check:db-content` stays red on 3 faults
across those 2 hints, down from 13 across 12.

**Three walk scripts, all applied, all clean.** Recorded on the items with
`walkScriptBy` so the rewrite pass can tell a reviewer-written script from a
drafted one. Written up as R5 in the authoring calibration log.

**The gap this opened up.** Applying the scripts meant gating them, and gating
them meant noticing that `check:db-content` had never looked at
`explanation` at all — walk scripts, hint cores, the lot. Item stems and
options were screened; the explanation Json beside them was not. That is the
same evasion route as the vault import, one column over, so it is closed the
same way: `explanation.walkScript`, `.walk` and `.hintCore` now screen under
the hint role, with the item's declared quotations passed through.

It found **97 faults across 66 items**, and every one is DRAFT — nothing LIVE
carries a failing explanation, so CI is unaffected and the backlog is now
visible instead of invisible. 88 of the 97 are sentence-length, which is the
walk-script rewrite pass restating itself in gate terms: these scripts were
drafted to explain the item, at a length that suits explaining. The reviewer's
three run 27–30 words where the drafted median is 51.

**Standing consequence.** No walk script written from here on can reach LIVE
without passing, and the rewrite pass now has a machine-checkable target
rather than only a style note.

**Closed the same day.** David ruled on the two held-back hints: "incorrect"
is banned for the same reason "wrong" is — both reach a child the same way —
and supplied replacement wording. Applied, and `check:db-content` is now
**green**: everything currently serving passes the child-facing gates.

The wording is David's, not the reviewer's, and the record says so. A rewrite
may now name its own `writtenBy`, and where that is the person entering it the
audit row reads `authorship: direct` instead of being dressed up as a returned
pack. This is deliberately NOT the approval rule: an approval recorded by its
own author launders a decision, which is why the identity guard refuses it,
but someone writing a hint and entering it themselves is the ordinary case.
What would be dishonest is filing their words under a name that did not write
them. The reviewer should be told these two hints changed, since the pedagogy
of both is still theirs.

## Entry 16 — WS-REDRAFT-2, the CZ-A2 mistag, and UK spelling
*2026-08-02. David's instructions; applied and reported.*

**WS-REDRAFT-2: 72 of 75 walk scripts landed as DRAFT.** The batch correctly
excluded the three reviewer-written scripts, and the importer refuses to
overwrite a script carrying `walkScriptBy` regardless — the guard is in the
code, not in the batch's good intentions. Each landed script keeps its
predecessor in `walkScriptPrevious` so the reviewer can read them side by side.

Three were held back on the long-word ceiling, and they are **two different
problems that look identical in the report**:

`ENG-001-WIW-10` ("contemptuous") and `ENG-002-pp-21` ("disposition",
"ridiculous") quote the passage but never DECLARE the quotation. Under R4 a
declared span is outside the vocabulary ceiling, so both would pass on
declaration alone — WIW-10 quotes 'impatient and contemptuous' and then
glosses the word, which is exactly the right teaching move and costs it
nothing once the quote is declared. This is R4's practical consequence
arriving in the walk script: **declare the quotation rather than paraphrasing
it away.** The batch was not told that rule.

`ENG-002-pp-05` is a genuine fault. "celebration" and "everybody" are our own
words in our own sentences, and no declaration helps. It needs a rewrite.

**Fixed on the way through**: passing an item's declared quotations to a walk
script reported every UNUSED quote as a broken claim, because the declaration
was made about the stem. `spansPresentIn` now narrows the list to the spans
the text actually uses. That was inflating the failure count by one
(`ENG-002-pp-17`) and would have done so on every future batch.

**ENG-003-A-CZ-A2 option C, retagged.** "no word is needed" was tagged
`en-article-definiteness`, which describes choosing BETWEEN a, the and no
article on definiteness grounds. That is not what the option executes: before
"hour", a child picking it has not weighed definiteness at all, they have
treated the determiner as optional. Nothing in the existing 44 English
misconceptions covered omission, so `en-determiner-omitted` is raised
**PROPOSED** and the option retagged, with the old tag kept in the audit
detail. R2 again — tag what the distractor executes.

Consequence, stated rather than worked around: CZ-A2 now joins
`ENG-003-A-CZ-B4` as an item blocked behind a PROPOSED misconception. Two of
the sixteen cloze items cannot serve until the reviewer rules.

**UK SPELLING THROUGHOUT — no exceptions.** A new gate, in the shared module
so the file scan, the database sweep and the publish doors all read one table
(`packages/core/src/uk-spelling.json`, beside the ban list, for the same
reason). Covers -ize/-isation, -or for -our, single-l past tenses, -er for
-re, -se for -ce, the assorted forms (grey, plough, mould, catalogue,
aluminium), and "math" for "maths" — which matters more than most for an 11+
product.

**Severity is the design.** A form that does not exist in British English is
an error. A form that IS British in another sense — 'practice' the noun,
'meter' the gas meter, 'draft' the first version — is a warning: a scanner
cannot tell which sense is meant without parsing the sentence, and making
those errors would train people to bypass the gate, which costs more than the
misses.

**Result across all existing content: ZERO US spellings.** Not one, in 300
word cards, 643 items, 126 misconceptions, 21 cases and every content file.
Eight warnings in the file scan (engineering notes using "practice" and
"draft" in their ordinary senses) and two in the database, both on
`ENG-003-A-SP-07`, which is a spelling item about practise/practice — the
warning is the gate working, not a fault.

**One judgement call, flagged for ratification.** "No exceptions" is applied
to product voice absolutely. It is NOT applied to a declared quotation or a
tested token, on the manifesto's ABOUT-language principle (v1.8): we do not
re-spell someone else's text, and a spelling item that presents a US form AS
the error to spot is content about the spelling. If that reading is wrong,
the exemptions are two lines to remove.

## Entry 17 — Passages in the repo, the line-reference gate, and the verbatim audit
*2026-08-02. David's three instructions; applied and reported.*

### The passages were never in the repo

The 21 curated extracts existed only in David's Downloads folder, which is why
no gate had ever resolved a line citation: there was nothing to resolve it
against. They are now `content/passages/*.json`, schema-validated, plus the two
SPaG cloze vehicles that had also never landed — 23 in all.

One structural fact worth recording because everything else depends on it:
`numberedLines` carries paragraph breaks as entries with `n: null`, so the
array is LONGER than the line count. The last line of Wind in the Willows is
67; the array has 83 entries. Anything using `.length` as the last line is
wrong by the number of paragraphs.

### The line-reference gate

`pnpm check:line-refs`, in CI beside the database content gate and under the
same policy: serving fails the build, DRAFT is reported. Rules in ascending
order of usefulness — the passage exists; every cited line is inside it; every
quoted span is in the passage somewhere; at least one quoted span anchors the
cited line.

Three and four are separated on purpose. "That quote is not in the passage"
and "the quote is real but you sent the child to the wrong place" are
different mistakes with different fixes.

Two design decisions that cost time and are worth not relearning:

**A script may legitimately quote away from the line it cites** — "back on
line 59 he had 'unfastened a rope'", "'step lively' comes a moment later". So
the rule is that the citation is anchored by AT LEAST ONE quote, not that
every quote sits at every cited line. The stricter rule failed correct writing.

**Report where the match IS, never where the search began.** The first
implementation slid an 8-line window and returned the window's first line,
which made every multi-line quote look six lines early and invented a uniform
offset that did not exist. Four "findings" evaporated when it was fixed. There
is a regression test.

**What it caught.** Four non-verbatim quotations in the Pride and Prejudice
items, all the same family and none of them a wrong line number: "Mrs Hurst"
for Austen's "Mrs. Hurst"; a comma turned into a full stop twice, which
converts a mid-sentence clause into a sentence; and `pp-19` silently deleting
`," cried Bingley, "` from the middle of a quotation and presenting the result
as continuous speech. Plus three bad line citations in the incoming
WS-REDRAFT-3 batch, caught at the door rather than after the fact.

**And one modelling error.** All 16 cloze items carry `lineRefs: [n]` where n
is exactly the gap number in their own stem. Resolving those as line numbers
would have passed silently — a vehicle has enough paragraphs that 1–8 are all
"in range" — so the gate would have certified a citation it never checked. A
passage that declares `gapCount` is now resolved in gaps and the unit mismatch
is REPORTED. Whether the fix is a renamed field or corrected items is David's
call, not a gate's.

### The stem corrections: nothing was applied, and that is the finding

72 of the 78 batch stems were identical to what is stored. Of the six that
differed, **none should have landed**:

Four (`WIW-14`, `pp-11`, `pp-16`, `pp-17`) are stems the reviewer or David
wrote, and the batch — regenerated from an earlier draft — would have reverted
every one. The importer now queries the audit log for
`item.stem_rewritten_recorded` and refuses. The row shows what a stem IS; only
the log shows who decided it.

Two failed the gates. `pp-19` breaches the vocabulary ceiling and still
misquotes Austen. `WIW-18` is the interesting one — see below.

### The verbatim audit: the brief was met, and WIW-18 is refuted

All 15 Stream A extracts checked token by token against their Project
Gutenberg sources, aligning on a letters-only key so that "it's" and "its" land
on each other as the same word and the difference in the ORIGINAL surfaces.
A raw diff cannot find this class; that is why it was never found before.

**12 of 15 are verbatim.** The other three carry exactly one difference each,
and **all four differences across the set sit at a documented editorial-cut
seam** — an opening quotation mark restored where the cut removed the middle
of a speech (Treasure Island, Tom Sawyer), a semicolon becoming a full stop
where the cut removed the clause after it (The Jungle Book), a small-caps
bracket dropped (The Canterville Ghost). Each is the minimum repair that makes
the join grammatical. 22 further differences are Project Gutenberg's own
typesetting — `_italics_`, ALL CAPS for small capitals — whose removal is what
curating a plain extract means.

Quote-mark convention follows each source individually. The set mixes curly
and straight because Gutenberg's editions do; nothing was normalised across
them. All 6 commissioned Stream B/C texts and both cloze vehicles reconstruct
their body from `numberedLines` exactly.

**WIW-18's flag is refuted, and the error runs the other way.** Project
Gutenberg #289 prints "Oh, its all very well to talk" — with "its". Our
extract reproduces it exactly. The ITEM's stem reads "it's": authoring
silently corrected Grahame, and the batch's proposed stem restored the
source's "its", which is why the line-reference gate flagged the stored one.
Nothing in the passages needs fixing. `ENG-001-WIW-18` needs a decision about
whether an item may quietly modernise the text it quotes.

## Entry 18 — Verbatim quotation, the five corrections, and the 7-vs-5 reconciliation
*2026-08-02. David's five rulings; applied. Manifesto v1.10.*

**The five corrections, all made to the passage's exact text.** Every one was
fixed by TRUNCATING rather than rewriting, which is the practical shape of the
new rule: quoting less is still quoting the passage.

`ENG-001-WIW-18` — "it's" → "its", as Grahame wrote it. The passage was
verbatim and correct; the item had modernised it.
`ENG-002-pp-12` — "Mrs Hurst" → "Mrs. Hurst" in the walk script.
`ENG-002-pp-13`, `ENG-002-pp-18` — the invented full stop removed; Austen runs
on with a comma in both, so the quotation now stops before it.
`ENG-002-pp-19` — the priority. The item had deleted `," cried Bingley, "`
from the middle of a quotation and presented the join as one continuous cry.
Truncated at the attribution: `'I would not be so fastidious as you are'`. The
word under test is inside the span.

All five quotations are now DECLARED in `stem.quotes` rather than left loose.
An undeclared quotation gets the worst of both — measured as our wording by
the reading-age gates, and unchecked against its source by the line-reference
gate. `pp-18` and `pp-19` also carry `testedTokens`, which is what lets
"engaged" and "fastidious" sit in a stem at all.

**`pnpm check:line-refs` now reports "Every line reference resolves."**

**The rename.** All 16 cloze `lineRefs` are now `gapRef`, with an audit row
each. The gate refuses `lineRefs` on a cloze vehicle and `gapRef` on a prose
passage, in both directions, and `import-english-items` writes `gapRef` for
the cloze mechanic so a future batch cannot reintroduce the old name.

### The reconciliation: both numbers are right about different things

**7** is the count of comprehension stems over the 16-word cap AS THE AUDIT
MEASURED THEM — every row carries `declaredQuoteWords: 0`, so the audit ran
before the R4 declarations existed. **5** is what WS-REDRAFT-3 reported fixed.

Measuring the batch's final stems against the cap, with declared quotations
stripped, resolves it:

| resolved by | count | items |
|---|---|---|
| declaring the quotation (R4) | 5 | WIW-18, pp-11, pp-13, pp-17, pp-19 |
| splitting the sentence (R2) | 2 | pp-08, pp-16 |
| still over the cap | 0 | — |

So the batch's summary is miscounted twice: **7 breached, not 5**, and only
**2 were split, not 5**. R2's line — "The 5 breaching comprehension stems
split, not compressed" — attributes to splitting what declaration did. The
five that were fixed by declaring kept every word they had; what changed was
the exemption, not the prose. Worth correcting in the authoring log because
the two techniques teach different lessons, and "we split five stems" is the
wrong lesson to carry into the next batch.

### And a defect the reconciliation turned up

The batch declares each quoted span as **`span`**. Our canonical field is
**`text`** — it is what the reading-age gate, the vocabulary ceiling, the
database sweep and the line-reference gate all read. Every one of the six R4
declarations would therefore have imported as `undefined`: the exemption would
have vanished silently, the five stems it was carrying would have failed the
cap again, and nothing would have said why.

This is the same class as the cloze `lineRefs`/`gapRef` mismatch — **a field
name that reads as absence**. Both were invisible because the failure mode is
a missing value, not a wrong one. `import-english-items` now reports any
declared quote using `span` by name rather than dropping it, and that is the
general lesson: when a structural claim goes missing, the importer must say
so. A silently absent exemption is indistinguishable from an author who never
made the claim.

## Entry 19 — The declaration audit, the verbatim tolerances, and the VR publish that did not happen
*2026-08-02. David's rulings; applied except where blocked.*

### Structural declarations: exemptions fail closed, obligations vanish

`pnpm audit:declarations` plants each malformation and runs the real gates,
because this is the class of defect where reading the code makes you confident
and running it does not — `quote.span` for `quote.text` survived four readings.
Three outcomes, and the middle one is the point: REPORTED (a gate names the
fault), FAILS CLOSED (nothing names it but the protection is gone so something
else fires), SILENT (nothing fires at all).

12 item-level probes: **4 REPORTED · 4 FAILS CLOSED · 4 SILENT**. 5 file-level
markers: 1 REPORTED, 3 FAILS CLOSED, 0 SILENT.

The pattern is exact and it is not a coincidence:

> **A declaration that buys an EXEMPTION fails closed. A declaration that
> carries an OBLIGATION vanishes.**

An exemption is consumed by a gate that runs anyway, so losing it makes that
gate fire. An obligation only produces a check when the field is FOUND, so
losing it removes the check entirely and nothing is left to complain. All four
silent cases carry an obligation; not one exemption is silent.

**The four silent fields** — reported, not fixed, pending David:
`stem.gapRef` misnamed · `stem.gapRef` absent on a cloze item ·
`stem.lineRefs` misnamed on a prose item · `stem.passageRef` absent on an item
that quotes a passage. The last is the widest: `check:line-refs` skips any item
without a `passageRef`, so an item can quote a passage it never names and no
gate looks at it.

Each fix is small and the same shape: require the obligation rather than
consuming it if present. An English item whose question type reads a passage
MUST carry a `passageRef`; a cloze item MUST carry a `gapRef`.

Two probes were wrong before they were right, and both were caught by adding a
CONTROL that asserts the declaration works. The first tested-token probe used
a stem that passed either way and reported a false SILENT; the first
file-level probe read only stdout while the scanner prints to stderr, and
reported a clean bill of health for markers that had just failed by hand. **A
probe with nothing to fire on cannot tell an exemption that held from one that
was never needed.**

### The two verbatim tolerances (manifesto v1.11)

Sentence-initial capitalisation of a quoted word, and terminal punctuation on
a truncated quote. Nothing else. Both are artefacts of setting someone else's
clause into our sentence, and a gate that fired on them would push authors to
paraphrase — which is worse for the child, because a paraphrase is our wording
and is not on the page they are searching.

`ENG-002-pp-19`'s deletion of an attribution from the MIDDLE of a quotation is
not terminal punctuation under any reading and stays a failure. Recorded with
the ruling because it is the part that will be forgotten: **recasting the
sentence is preferred**, as `ENG-001-WIW-10` does. A tolerance is permission to
stop fighting the grammar, not an invitation to lean on it.

### Six citations widened to ranges

Where a quoted span runs onto the next line, the citation now names both.
The gate checks that a citation is TRUE; this makes it USEFUL, and only a
person can tell those apart — a child told to read line 8 reads line 8, does
not reach the end of the sentence, and concludes they have misunderstood.

Two of the six needed subject-verb agreement fixing as well ("Lines 14 and 15
says" → "say"). Worth noting for any future mechanical edit of child-facing
copy: a find-and-replace that satisfies a rule and leaves ungrammatical prose
has not made the item better.

### R1–R7 against the §4 pre-review rubric: R8 is the only one there

Of the eight calibration rules, **R8 is the only one with a rubric entry — and
it is the only one that became a machine gate.** R4 and R5 are partially
covered by rubric items 8 and 6; R1, R2, R3, R6 and R7 appear nowhere. The
rubric never looks at a walk script at all.

Proposed rubric items 9–13 drafted at
`content/exports/prereview-rubric-additions-2026-08-02.md` (copy in Downloads),
covering sentence length by role, split-not-compress, quotation before
paraphrase, error-spotting shape, walk-script style and trap lines, and
meaning surviving a ban-list rewrite. The skill file is Cowork's, so this is a
proposal to hand over rather than an edit made here.

### The VR publish did not happen, and must not

**Zero of the 565 VR items carry any review signal** — none has `reviewedBy`
set, none is REVIEWED, none is LIVE. There is no set of "reviewed VR items" to
publish. Publishing them would put 565 unreviewed items in front of children,
which is the precise failure the whole review architecture exists to prevent,
and the instruction itself said to report rather than publish anything that
fails.

Blocked on two things: which items the reviewer signed off, and the
confirmation text to quote in the note (none was supplied).

Gates run over the pool anyway, so the answer is ready when the sign-off is:
**63 items fail a gate beyond the missing reviewer**, all on the 16-word stem
cap — 25 in `vr-07-letters-for-numbers`, 25 in `vr-13-make-a-word`, 13 in
`vr-08-move-letter`. Only `vr-07` is inside the free-ten, so **25 of the
free-ten pool would be held back** and the rest are otherwise clean.

**LIVE VR items: 0. Per free-tier case: 0.** Free-ten pools stand at 25 items
each except `vr-09` (38) and `vr-11` (39).

On volume, nine of the ten clear the 15-item interim floor — and the 25/case
Phase 4 gate — the moment a sign-off is recorded. **`vr-07-letters-for-numbers`
does not, and the failure is total: all 25 of its items breach the 16-word stem
cap, so that case would publish ZERO.** It is the one free-tier case that
cannot reach the floor by signing off what exists; its stems have to be fixed
first. `vr-13-make-a-word` is in the same state but is not a free-tier case,
so it does not block launch.

## Entry 20 — Tokenisation, the dictionary gate, and label collision
*2026-08-02. David's four rulings; all applied.*

### The word counter was counting punctuation. 25 of the 63 breaches were artefact.

`"If A = 3, B = 4, C = 5, D = 6, what is A + B + C?"` counted **20 words**, six
of them the four `=` and two `+`. Every one of the 25
`vr-07-letters-for-numbers` stems was over the 16-word cap on notation alone,
and no rewriting of the English would have brought it under.

A token carrying no letter or digit is now not a word. Gap markers (`___`) and
separators (`—`) fall out the same way.

**Breach count: 63 → 38. Inside the free-ten: 25 → 0.** What remains is real:
13 `vr-08-move-letter` and 25 `vr-13-make-a-word`, both genuinely 17 words of
English, and neither is a free-tier case.

The counter-argument is recorded in the code because it is not silly: read
ALOUD that sentence IS twenty words, since `=` is spoken "equals". The cap
measures what a child reads under time pressure, not what they would say, and
an item built on notation cannot otherwise carry as many English words as a
prose one. One predicate to reverse if that reading is wrong.

One existing test had to be lengthened: stripping a declared quote leaves an
orphaned `''`, and that token used to count. The test was passing on sixteen
words of ours plus a piece of punctuation.

### The dictionary gate — `pnpm check:word-puzzles`

Every candidate the item's own rule permits is enumerated, checked against a
wordlist, and counted. More than one survivor and the item has more than one
right answer. Same discipline as the Maths computed key: **derived and
counted, never asserted.**

**79 findings, all DRAFT**: 38 ambiguous-answer, 25 label-collision, 8
key-not-derivable, 8 ambiguous-outcome.

`gen-vr-08-move-letter-04` is the shape of the problem: the key is "S" but the
only valid move is "H". `-01`, `-13` and `-25` (CHAIR/MOP) admit **no** valid
move at all. `gen-vr-05-hidden-word-16` keys "PEAR" where the only word hidden
at a join is "airs".

**I had David's example backwards, and fixing it changed the design.** SPARE
to TILE is not "move the S or move the E" — E cannot go into TILE and make a
word. It is ONE letter in TWO positions: PARE + STILE, or PARE + TILES. Our
`vr-08` options are letters, so both are the same tick and the item is
answerable; but the stem says "so that both make new words" and a child who
wrote TILES obeyed it exactly as well. So the solver returns every outcome and
the caller counts letters separately — `ambiguous-answer` when the letter is
in doubt, `ambiguous-outcome` when only the result is. Collapsing to one row
per letter, which is what the first draft did, discarded the case the gate was
built for.

**The wordlist is the weak part, and the numbers say so.** It is the system
dictionary reduced to lower-case alphabetic entries, which still contains
"teth", "habu" and "tala". Narrowing to common usage was tried and **rejected**:
it drops "stile" and "pare", which is to say it drops the SPARE/TILE case. A
missed ambiguity costs a child a mark; a false one costs a reviewer a minute.

So the wide list decides and a common-usage list annotates. **36 of the 46
ambiguity findings (38 answer + 8 outcome) have two or more answers in common
usage** and are
near-certainly real; the rest turn on entries no eleven-year-old would
produce. A curated UK primary wordlist is the proper follow-up.

### Label collision — all 25 of `vr-07`

`"If A = 3, B = 4, C = 5, D = 6, what is A + B + C?"` over options the
interface labels A–E. The A in the question and the A beside the first option
are different things wearing the same letter, and the child has to know that
before they can start. Not a typo — two namespaces sharing a glyph, which no
amount of careful reading fixes.

The check reads the labels the item WILL be given, not the ones stored:
generated items carry no label at all and the interface supplies A–E, so a
check reading the stored value would have found nothing to collide with and
passed all 25.

**This is now the free-ten's blocker.** `vr-07` has no gate failures left
after the tokenisation fix, and 25 label collisions instead. Volume is not the
problem for any of the ten; `vr-07` needs its code letters moved out of A–E —
P, Q, R, S would do it.

### The free-ten bank is exported

`pnpm export:vr-free-ten` → `content/exports/vr-free-ten-<date>.json`. 10 cases,
277 items, each with its full structured stem (these types carry their payload
in `word1`/`word2`, `sentence`, `code`, so a rewrite that only sees the prompt
cannot check its own answer), its options, its current gate verdict, and an
empty `rewrittenStem`. The CMS was the only copy.

## Entry 21 — vr-07 relabelled, unanswerable items blocked, and the free-ten's true position
*2026-08-02. David's two fixes; both applied.*

**vr-07's symbols moved out of the option-label range.** A→P, B→Q, C→R, D→S,
across all three places they live — the `code` keys, the `sum`, and the prompt
a child reads. All 25 label collisions cleared. The generator was fixed
alongside the rows so regeneration cannot reintroduce it, and the rule is
recorded as **R7**: an item's internal symbols never draw from the
option-label range.

**The 8 unanswerable items are now defects.** `answerFlaggedAt` is set by
`pnpm check:word-puzzles` and has **no clearing field** — deliberately unlike
the similarity flag, which a reviewer clears with a note because
coincidence-versus-derivation is a judgement. This is not a judgement: the
item's own rule produces nothing, or produces something other than the key, so
a signature would record only that nobody checked. The flag lifts when the
item is fixed and the gate stops setting it. Recorded as **R8**.

The check lives in `publishBlockers`, which all four routes to REVIEWED and
LIVE already call, so a fifth route added later inherits it. The gate also
fails the build if a flagged item is ever found at REVIEWED or LIVE, and it
reconciles both ways each run — a stale flag would be as bad as a missing one,
because it would block an item nobody could unblock.

### The free-ten's true position

| case | question type | total | copy | defect | ambiguous | **clean** | floor |
|---|---|---|---|---|---|---|---|
| case-vr-01 | insert-letter | 25 | 0 | 0 | 0 | **25** | meets |
| case-vr-02 | two-odd-ones-out | 25 | 0 | 0 | 0 | **25** | meets |
| case-vr-03 | related-words | 25 | 0 | 0 | 0 | **25** | meets |
| case-vr-04 | closest-meaning | 25 | 0 | 0 | 0 | **25** | meets |
| **case-vr-05** | **hidden-word** | 25 | 0 | 1 | 19 | **5** | **BELOW** |
| case-vr-07 | letters-for-numbers | 25 | 0 | 0 | 0 | **25** | meets |
| case-vr-09 | letter-series | 38 | 0 | 0 | 0 | **38** | meets |
| case-vr-10 | word-connections | 25 | 0 | 0 | 0 | **25** | meets |
| case-vr-11 | number-series | 39 | 0 | 0 | 0 | **39** | meets |
| case-vr-15 | reading-information | 25 | 0 | 0 | 0 | **25** | meets |

**Nine of ten would meet the 15-item floor if signed off today. 257 items are
gate-clean.** Not one fails on copy any more — the tokenisation fix and the
vr-07 remap between them cleared every copy and collision finding in the
free-tier pool.

**`case-vr-05` is now the only blocker, and it is a real one.** 19 of its 25
hidden-word items admit more than one word at a join, leaving five clean —
ten short of the floor. Ambiguity does not block automatically, so the
reviewer could in principle sign them; that would be signing items where a
child who found "sofa" instead of "cans" is marked wrong for reading
correctly.

The honest options are to rewrite the 19 sentences so only one word hides at a
join, or to hold `case-vr-05` back from the free ten. The first is a small
authoring job now that the solver can check each rewrite instantly; the second
is a product decision.

**Caveat on that 19.** It is measured with the system dictionary, which counts
"teth" and "tala" as words. The triage says 36 of the 46 ambiguity findings
have two or more answers in COMMON usage, so most of the 19 are real — but the
exact number will move when the wordlist is replaced.

### Backlog

**A curated UK primary wordlist to replace the system dictionary for the
ambiguity gate.** The current list is US-derived, missing most inflections
(handled by rule at lookup), and carries entries no eleven-year-old will ever
produce. Narrowing to a frequency list was tried and rejected: it drops
"stile" and "pare" and with them the SPARE/TILE case the gate exists for. The
right source is a curated list at primary reading level, and until it exists
the ambiguity counts are indicative rather than exact.

## Entry 22 — Delivery, the three-outcome model, and the proper-noun leak
*2026-08-02. David's rulings; all applied. Export path confirmed with David.*

### Exports are now DELIVERED, not generated and remembered

Three named exports failed to reach authoring, and the cause was not the
folder. Copying to Downloads was never part of any export command — it was a
separate manual step I took after generating the file, and a manual step at the
end of a long task is a step that gets missed. It happened twice out of five.

Delivery is now part of every export. `scripts/lib/export-destination.ts`
holds one confirmed constant — **`/Users/davidb/Downloads/11+/from-cluecrew`** —
and a `deliver()` that copies and prints the destination. It throws rather than
warns: a silent delivery failure is the whole problem it exists to fix.

Wired into walk scripts, VR free-ten, review packs (HTML, PDF and decisions
template), hints-to-reword, and the passage-integrity audit. Each still writes
its working copy to `/content/exports`; that is the local record, not the
delivery.

The outbound folder is separate from the rest of the 11+ project on purpose:
what this repo SENDS is never mixed with what authoring sends back, so a batch
file and its review pack cannot be confused. Four files are in it now — the VR
free-ten bank, the English walk scripts, the rubric proposal and the passage
audit.

### Three outcomes, adopted from Cowork

**PASS** — one candidate. **AMBIGUOUS** — a competitor survives the strict
floor, so a child can plausibly find it and the item is unfair. **REVIEW** —
competitors exist only under the permissive floor, so probably noise and a
person decides.

The two floors are both necessary. Narrowing the GATE to common usage was
tried and rejected — it drops "stile" and "pare", and with them the SPARE/TILE
case. Treating every dictionary entry as equally credible buries real findings
under obscure ones. So the permissive list decides what EXISTS and the strict
list decides how much it MATTERS.

**`case-vr-05`'s 19 becomes 14 AMBIGUOUS + 6 REVIEW** — but not by simple
reclassification, because two other changes landed in the same pass and moved
the underlying counts:

- the proper-noun fix removed candidates like "theo" and "ido", which *reduces*
  ambiguity;
- the punctuation ruling added joins at hyphens and full stops, which
  *increases* it.

Net: 25 items → 1 defect, 14 AMBIGUOUS, 6 REVIEW, 4 clean. The honest reading
is that **14 are real fairness problems**, 6 want a human glance, and the case
is further from the floor than the earlier "19" implied, not closer.

### The proper-noun leak was in the COMMON list, not the dictionary

"theo" and "ido" were never in `en-lower.txt` — they came in through
`common-en.txt`, built from a subtitle frequency list where every name appears
in lower case. That list was doing the *strict* half of the judgement, so a
leaked name did not merely add noise: it promoted REVIEW findings to
AMBIGUOUS.

Fixed on both sides. `common-en.txt` now keeps only entries that resolve to a
real lower-case dictionary word, directly or through the inflection rule:
**46,844 → 30,946**. `en-lower.txt` drops entries web2 also capitalises and
common usage does not know: **198,631 → 197,938**, and none of "stile",
"pare", "spar", "tile" was lost.

**Residual, stated rather than buried:** "dover" survives, because web2 genuinely
lists it in lower case. Words that are both a common noun and a place name
cannot be separated by case alone, and the curated UK primary list on the
backlog is the real answer.

### Punctuation does not block a join

Ratified. A child scans the line as text, not as a parsed sentence. The units
are now maximal runs of LETTERS, so "empty-handed" is two units and "Dan's" is
two, and a span crossing any boundary between them counts. Treating a hyphen as
a wall missed the joins a child finds FIRST — a hyphen is the most visible
place to look.

## Entry 23 — case-vr-05 held out, and the free tier's replacement
*2026-08-02. David's ruling; applied.*

**The ruling.** `case-vr-05` (Hidden Word) is held out of the free ten rather
than rushed. Four gate-clean items against a floor of fifteen is authoring a
case, not fixing one. It goes to the paid tier once rebuilt properly.

### A replacement exists, and the existing rule picks it

Nine non-free VR cases carry 25 gate-clean items each. The free tier's rule is
already "the first two cases of each family in district order" (plus
`case-vr-11` as the tenth, since deduction has only one case), so the question
is not which case we like — it is which case the rule yields once vr-05 is
skipped.

That is **`case-vr-06`, "The Gap in the Report"** (Missing Word): the same
stowaway family, the next in district order, **25 of 25 clean** with no
defects, no ambiguity and no copy faults.

Held out in the DERIVATION rather than by hard-coding the replacement. The
rule is unchanged; a `HELD_OUT_OF_FREE_TIER` set means vr-05's return, or the
next case to be held out, is one line rather than a re-derivation by hand.

**Free ten is now:** vr-01, vr-02, vr-03, vr-04, **vr-06**, vr-07, vr-09,
vr-10, vr-11, vr-15 — 277 items, **all ten meeting the 15-item floor**, and
family coverage unchanged at stowaway 2 · wordweb 2 · bridge 2 · code 3 ·
deduction 1.

### Why vr-06 rather than vr-20

`case-vr-20` (Complete the Word) is the other stowaway with 25 clean, and it is
the closer mechanical cousin of Hidden Word — both are letter-pattern work. That
is the argument against it. `case-vr-01` (Insert Letter) is already in the free
ten and is also letter-level, so pairing it with vr-20 would give the free tier
two letter-manipulation stowaways and no contextual one. vr-06 works at the
level of a word in a sentence, so the family shows its range rather than one
trick twice. It is also the mechanic that transfers most directly to real
papers, where missing-word items are everywhere.

### The free-nine position, since it was asked for

Not needed, but worth recording as the fallback. Without a replacement the free
tier would be nine cases and **stowaway would drop to a single case**
(`case-vr-01`), joining deduction as the only families with one. That is the
specific loss: the free tier would still cover all five families, so nothing
would be invisible, but a child would meet the stowaway idea exactly once and
through its narrowest form — insert a letter to make two words. The breadth
claim the free tier makes is "here is what each family feels like", and one
letter-level case does not carry that for a family whose range runs from single
letters to whole words in context.

### The other cases the gate found in poor shape

Neither is free-tier, so neither blocks launch, but both are the same class of
work as vr-05 and should be scheduled together:

- **`case-vr-08`** (Move Letter): 6 clean of 38 — 7 unanswerable defects, 19
  REVIEW, 6 copy faults.
- **`case-vr-13`** (Make a Word): **0 clean of 25** — every stem is the 17-word
  instruction that survived the tokenisation fix because it is genuinely long
  English, not notation.

## Entry 24 — The VR free-ten reviewer pack
*2026-08-02. Generated and delivered.*

`pnpm export:vr-review-pack` → HTML, PDF and a decisions template, all three
delivered to the shared folder. **10 cases, 277 items**, grouped by case.

Grouped by CASE rather than by question type, because a Case is what a child
sits down to and what the reviewer is being asked to sign. Each group opens
with what the case teaches — question type, interaction mechanic, engine
family, and a plain sentence on what that family asks a child to do — so the
items can be judged against the thing they are meant to practise.

The structured payload is printed beside every stem. For these types the stem
alone is not the question: `word1`/`word2` IS the move-letter item, and a pack
that printed only the prompt could not be checked.

The format is now shared with the English pack
(`scripts/lib/review-pack-format.ts`). Two packs that look different are two
packs a reviewer has to learn; the English pack was refactored onto it and
renders identically.

**The decisions page** carries the three cases held back for rebuild —
`case-vr-05` (4 of 25 clean), `case-vr-08` (6 of 38), `case-vr-13` (0 of 25) —
as context rather than as decisions. A reviewer signing off ten cases out of
twenty-one should know which were held back and on what evidence, or the ten
read as the whole district. Then the sign-off line, with ruled space for the
confirmation in their own words, since that text is quoted verbatim into the
record.

### The finding the pack surfaced: NO VR item has a walk script

**0 of 277.** Only 40 of the 565 VR items carry any explanation content at
all. Every item in the pack says so in place of the script rather than leaving
a gap the reviewer has to interpret — but the effect is that the reviewer sees
the question and the answer and no teaching.

That is not a blocker for judging whether an item is fair and correctly keyed,
which is what sign-off asks. It is a blocker for the district being finished:
a child who gets a VR item wrong currently gets a misconception hint and
nothing else, where an English child gets a walk script. The 78 English scripts
took three authoring rounds and a house style to produce; VR has 277 items in
the free ten alone and none.

Worth scheduling before launch rather than after, and worth knowing now rather
than at the sitting.

All wrong options in the free ten carry a tagged misconception — 0 untagged.

## Entry 25 — Insert-letter double-keys, the coverage audit, and the export bug
*2026-08-02. Two reviewer findings, both blocking; both fixed.*

### Insert-letter was never covered, and 4 of 25 are double-keyed

The reviewer found `gen-vr-01-insert-letter-01` (key "t" for plan(?)/(?)ail,
but "s" gives plans/sail) and `-13` (key "n" for clea(?)/(?)ose, but "r" gives
clear/rose). The gate had never covered this type at all — it checked
move-letter, make-a-word, hidden-word and letters-for-numbers, and insert-letter
looked enough like them that its absence was easy to miss.

Now covered: every OFFERED option is substituted into both fragments and
checked against the wordlist. Only offered options, because a child ticks what
is on the card — a letter that would work but is not shown cannot make the item
ambiguous. **A genuine double-key is a DEFECT** (`answerFlaggedAt`, no
sign-off clears it), exactly as David ruled.

**7 of 25 have a second offered letter that completes both fragments; 4 are
genuine defects, 3 are dictionary-only REVIEW.** The split uses the standing
common-usage floor:

- **DEFECT (4):** `-01` (plans/sail), `-12` (bloom/moor), `-13` (clear/rose),
  `-21` (pains/sent) — both competing words in common usage. The reviewer found
  two; the gate found the other two.
- **REVIEW (3):** `-09` (spoom/moise), `-17` (greet/toise), `-20` (clour/rance)
  — the distractor completes both only through a word no child produces. Worth
  a glance, not a block.

**A deliberate departure from the letter of the ruling, flagged for
ratification.** David said "more than one option completes both is a defect."
Applied with the permissive dictionary that is literally 7 of 25 — but three
turn on "toise", "moise" and "rance", which are the same obscure-dictionary
false positives the hidden-word gate already learned to set aside. So the
common-usage floor decides DEFECT vs REVIEW here too, consistent with Entry 22.
If David wants all 7 blocked regardless, it is a one-line change; the 3 are
reported either way.

### Coverage audit — where the gate still cannot see

Of 21 VR types, **5 are covered** (insert-letter, hidden-word, move-letter,
make-a-word, letters-for-numbers). The other 16 fall in two groups:

**Mechanically checkable, NOT yet covered — the real gap (≈9):**
`vr-06-missing-word`, `vr-09-letter-series`, `vr-11-number-series`,
`vr-14-letter-connections`, `vr-17-complete-the-sum`, `vr-18-related-numbers`,
`vr-19-word-number-codes`, `vr-20-complete-the-word`, plus **`vr-07` only
half-covered** — the label-collision check runs, but nothing verifies the
arithmetic, so a wrong computed key would pass. These have derivable answers
(a sequence rule, an equation, a code, a gap a letter fills) and a generator
bug in any of them produces the same silent double-key insert-letter had. Two
of them — vr-09, vr-11 — are in the FREE TEN.

**Semantic, not machine-checkable by nature (≈7):** `vr-02-two-odd-ones-out`,
`vr-03-related-words`, `vr-04-closest-meaning`, `vr-10-word-connections`,
`vr-16-opposite-meaning`, `vr-21-same-meaning`, and `vr-15-reading-information`.
These turn on meaning or multi-step deduction; there is no wordlist or rule
that settles "closest in meaning", so they depend on human review and always
will. `vr-12-compound-words` sits on the line — a real-compound check is
possible and worth adding.

The honest headline: **two free-ten cases (vr-09, vr-11) carry derivable
answers the gate does not yet verify.** They pass every gate today, but "passes
every gate" currently means less for them than for insert-letter. Building the
series/arithmetic gate is the priority follow-up, above the semantic types,
which no gate will ever reach.

### The export bug was rendering, not data

The data was present in every case. The pack printed only SCALAR stem fields
and only `option.content.value`, so anything stored as an array or object
vanished:

- `series` (vr-09, vr-11), `words` (vr-02, vr-04), `pairA` (vr-10) are ARRAYS —
  dropped, which is the "missing series / single word where a pair should be".
- vr-02's options are `{pair: [w1, w2]}`, not `{value}` — so they printed blank.

Fixed with one `renderValue` that prints scalars as themselves, arrays as a
spaced list, and objects as `key=value`, used for both stem fields and options.
Verified: all five reported cases now show their variables (odd-one-out words
and pair options, the card word, both series, and the analogy pair). The pack
was regenerated, delivered, and the Downloads copies refreshed.

**The general lesson, worth a rule:** a pack that cannot print every shape an
item can store does not fail — it silently omits, and the reader cannot tell an
empty field from an absent one. Same class as the `span`/`text` and
`lineRefs`/`gapRef` defects: a value that reads as absence.

## Entry 26 — The series/arithmetic gate
*2026-08-02. Built before the corrected pack shipped. DEFECT/REVIEW split ratified as applied.*

`check:word-puzzles` now solves **215 rule-based items** (was 113). The three
types added:

**vr-09 letter series & vr-11 number series (77 free-ten items).** The rule is
DERIVED from the four given terms, not asserted. A finite sequence has
infinitely many continuations in principle, so `deriveSeries` fits a bounded
family of the rules 11+ papers actually use — arithmetic step, integer
geometric ratio, constant second difference (triangular), sum-of-previous-two,
and interleaved pairs — and returns every rule that reproduces the terms, each
with the term it predicts next. Letters are handled as alphabet positions
(A=1..Z=26) run through the same numeric fitter.

- **Key check:** the key must be the next term under at least one fitting rule,
  else DEFECT.
- **Rival check:** a distractor that is the next term under a DIFFERENT fitting
  rule is a competing answer. Common-tier rule (step, ratio, alternating) →
  AMBIGUOUS; exotic-tier (second difference, Fibonacci) → REVIEW. Same split as
  insert-letter, which David ratified this turn.

**Result: all 77 pass. 0 defects, 0 ambiguities.** The generator's rules are
sound and its keys follow them, including the triangular (3,6,10,15→21) and
interleaved (4,8,5,9→6; 5,33,10,31→15) sets.

**vr-07 arithmetic (25 items).** The label-collision check ran but the sum was
never evaluated. Now each code letter's value is substituted into the
expression and evaluated left to right (handling both `-` and the unicode
minus the stems use), and the result must equal the key. **All 25 resolve to
their key. 0 mismatches.**

### Two honesty conditions in the fitter, both learned the hard way

Both are the same lesson: a rule needs enough data to be CONSTRAINED before it
can be claimed to fit.

- **Interleaving is offered only as a last resort.** Two points always define a
  step, so an interleaved reading fits ANY four-term sequence — it would
  manufacture a rival on every clean series. It is returned only when no
  determinate rule explains the terms, which is exactly the 4,8,5,9 case.
- **Second difference needs two of them.** Three points always define a
  quadratic, so a single second difference confirms nothing; the rule fires
  only from four terms up (two second differences that agree). Caught by a
  three-term test that the first version wrongly "explained".

### The other six checkable types — scoped, not built

What each would need, in rough order of value:

- **vr-20 complete-the-word** (`wordWithGap`): a dictionary gate like
  insert-letter — every offered letter that fills the gap to make a real word;
  more than one common word = defect. Small, high value, reuses the lexicon.
- **vr-17 complete-the-sum** (`sum`, an equation to balance) and
  **vr-18 related-numbers** (`sum`, a number-triple rule): arithmetic
  evaluation like vr-07 — derive the missing value, confirm the key. Small,
  mechanical.
- **vr-14 letter-connections** (`pairA`, `stemWord`): letter-position analogy —
  the position shift in the first pair applied to the stem letter; derive and
  confirm. Reuses the alphabet mapping.
- **vr-19 word-number-codes** (`code`): a substitution cipher — apply the code
  to derive the answer word/number and confirm. Moderate; the code grid has to
  be parsed.
- **vr-06 missing-word** (`sentence`): the hardest of the six. If it is a
  fixed-rule letter/word insertion it is checkable like vr-05; if it turns on
  meaning it is semantic and belongs with the uncheckable group. Needs its
  generator read before scoping.

The seven genuinely semantic types (odd-one-out, related/closest/opposite/same
meaning, word connections, reading-information) are out of reach for any
wordlist or rule and depend on human review by nature — vr-12 compound-words
is the one borderline case, where a real-compound check is possible.

**The corrected pack ships on a verified free ten:** every free-ten case with a
derivable answer — insert-letter, letters-for-numbers, both series — is now
machine-confirmed, on top of the export-rendering fix from Entry 25.

## Entry 27 — Generator-level faults in the VR semantic cases (reviewer audit)
*2026-08-02. Reported before fixing, per David. Two false negatives hot-fixed; the rest are rebuilds.*

The reviewer's audit found faults in the GENERATORS, not the items. Four
confirmed against the database and the source.

### 1. vr-03 and vr-10 are the same 25 questions

Both call one function, `analogies()`, over one 25-entry bank; vr-10 passes
offset 12, which only rotates the order. **All 25 stems are shared** — same
pairs, same answers, same distractor pairings — differing ONLY in tag names
(`vr03-same-topic`/`vr10-topic-match`, `vr03-reversed-relation`/`vr10-reversed`).
The shared example `kitten:cat::puppy:?` is `dog* / bone / kennel` in both.
vr-10 adds zero content over vr-03. One of the two needs a genuinely different
bank, or the free tier is teaching one case twice under two names.

### 2. vr-02 has 10 stems for 25 items, every one reused across tiers

`oddOnesOut` draws from a small set of category combinations, so only **10
distinct stems** appear across its 25 items, and **all 10 sit at more than one
tier** — `apple/lorry/pear/tram/plum` at T1 AND T3, `chair/chisel/…` at T2 AND
T4, exactly as she found. The other five cases (vr-03, vr-04, vr-06, vr-10,
vr-15) have 25 distinct stems and no cross-tier reuse; the reuse defect is
vr-02 alone. Root cause is the same as (3).

### 3. No generator varies difficulty by tier — tier is loop position

**Every** VR generator sets `tier: 1 + (i % 4)`. The tier is a function of the
item's position in the loop and nothing else; the vocabulary or difficulty of
the chosen entry never enters into it. A hard word lands at T1 as readily as an
easy one at T4, and — combined with (2) — the SAME stem is served at two tiers
with no change to its content, which is only coherent if tier means nothing.
This is the deepest of the four: the tier field is currently decorative across
the whole VR district.

### 4. Distractor constructors assign tags by position, not by meaning

The constructors place a tag on a fixed option SLOT and trust the bank to fill
that slot with matching content. The bank does not.

- **vr-04:** `vr04-opposite-pull` sits on bank column 3 whether or not it holds
  an antonym — correct for `shut/open`, `large/tiny`, `quick/slow`, but wrong
  for `begin/lend`, `rich/generous`, `gift/ticket` (none an opposite).
  `vr04-associated-not-same` sits on columns 4–5, which hold unrelated fillers
  (shout, carry, paint, lift, flat, round) — almost never a genuine associate.
  So the "associated" tag is systematically wrong and the "opposite" tag is
  right only when the data happens to comply.
- **vr-06:** both distractors are 3-letter strings dropped into the gap, and
  the bank does not ensure they form real words. `SH___`+`OAK` → **SHOAK**,
  `SH___`+`OWL` → SHOWL — both non-words, yet one is tagged
  `vr06-fits-gap-not-word` and the other `vr06-ignores-sentence`. The second
  tag claims a real word chosen against context; it delivers gibberish. The
  two tags describe different reasoning and the data supports neither.

### The hot-fix

Two false negatives, each duplicated across vr-03 and vr-10 (finding 1), so
**4 items**:

- `puddle:small::lake:?` keyed "large", offered "deep" as wrong — a lake IS
  deep. Removed "deep" from `gen-vr-03-related-words-23` and
  `gen-vr-10-word-connections-11`.
- `rain:wet::sun:?` keyed "dry", offered "hot" as wrong — the sun IS hot.
  Removed "hot" from `gen-vr-03-related-words-10` and
  `gen-vr-10-word-connections-23`.

The offending distractor is removed rather than re-tagged: it is a defensible
answer, so it cannot be a scored-wrong option under any tag. Each removal has
an audit row and is marked a STOPGAP — the real fix is the generator rebuild,
which will restore a proper third option that is genuinely wrong. Flagging via
`answerFlaggedAt` was rejected because `check:word-puzzles` does not cover these
semantic types and would lift the flag on its next run.

### What the rebuilds need (scoped, not built)

- **vr-10:** a distinct analogy bank, or fold it into vr-03 and give the
  free-tier slot to a different case.
- **vr-02:** more category combinations so 25 items need 25 stems, or fewer
  items per case.
- **All VR generators:** tier must be driven by content difficulty, not loop
  index — otherwise Tier Fit cannot be reviewed because there is nothing to
  review.
- **vr-04 / vr-06 banks:** the positional tag contract must be enforced —
  column 3 an actual antonym, columns 4–5 actual associates; vr-06 distractors
  must form real words. A gate can check vr-06 (real-word) mechanically; vr-04
  "is this an antonym / an associate" is semantic and needs the bank authored
  correctly, then human review.

## Entry 28 — Cross-district tier audit: the number is real in NVR, decorative in VR, unset in Maths
*2026-08-02. David's priority question, answered before any rebuild code ships.*

"If the same pattern exists in the Maths engines or the NVR generator config,
we've been calibrating batch mixes against a number nobody was setting." The
answer differs by district, and only one is a problem.

**VR — decorative in PART. Refined 2026-08-02 (Entry 32).** Every generator
sets `tier = 1 + (i % 4)`, which is why this first read as uniformly decorative.
A closer read of each generator shows it is not: in the SERIES and ARITHMETIC
generators the loop tier is fed back in to CHOOSE a harder structure
(numberSeries builds arithmetic at T1 and interleaved at T4; letterSeries
widens the step; lettersForNumbers/completeTheSum/relatedNumbers switch to
subtraction or multiplication at T≥3; letterConnections' jump = the tier). For
those, tier is a genuine difficulty input, so their batch-mix envelopes ARE
backed — coarsely (the arithmetic ones have two real levels labelled as four).
Truly decorative were the WORD-MEANING and WORD/LETTER-BANK generators, where
tier was stamped and the content came from `bank[i % len]` regardless — those
are the ones the backbone fixes. The batch-mix tier envelopes ratified for
VR (practice 15/30/35/18/2, and the SCP-VR-6 per-type ranges) have therefore
been calibrated against a label that was never set by difficulty. A VR paper
built to "35% tier 3" selects items whose tier-3 stamp is noise. This is the
district already being rebuilt, so the fix is in hand — but the ratified VR
ratios should be treated as unbacked until the backbone lands.

**NVR — real. No action.** NVR does the opposite: `template.generate(seed,
tier)` takes tier as an INPUT and the item genuinely changes with it. In
`templates.ts` the element count is `tier <= 2 ? 2 : tier === 3 ? 4 : 6`,
rotation steps widen at higher tiers (`[45,90]` → `[45,90,135]`), `compound =
tier >= 4`, `dotCycle` grows, and `config.ts` caps elements per tier
(15/15/30/45/45) with the density check enforcing it. A tier-4 NVR item is
demonstrably denser and harder than a tier-1. The NVR batch-mix envelopes are
calibrated against a number that means what it says. Nothing to fix.

**Maths — unset, because there are no items.** The Maths district has **zero
generated items**: a plan, two blueprints and the solution-key migration
exist, but no generator. So there is no tier-by-loop bug — and equally, the
ratified Maths tier ratios have never been tested against real items. They are
prospective. The risk is forward-looking: whoever builds the Maths generator
must key tier to content (step count, operand size, carrying/borrowing,
operation) and not to loop index. Recorded here so that constraint is on the
record before the generator is written, not discovered after.

**Bottom line for David's fear:** true for VR, false for NVR, not-yet-real for
Maths. One district was calibrated against a decorative number; it is the one
we are already fixing.

## Entry 29 — VR semantic rebuild, increment 1: backbone + vr-10 fold
*2026-08-02. Backbone (content-driven tier) and the vr-10 fold.*

**vr-10 folded (David's decision).** vr-10 added nothing over vr-03 (Entry 27),
so it is dropped from the generated set and from the free ten. By Entry 23's
rule — first two cases of each family in district order — the freed stowaway
slot's replacement is chosen to show the family's RANGE rather than repeat a
mechanic already present, exactly the vr-06 reasoning David cited.

**The backbone: `difficulty.ts`.** Tier is now derived from content, not the
loop index. `vocabTier(word)` returns the word-vault tier where the word is in
the vault, and a frequency-and-length band otherwise; `structuralTier` handles
vr-15 (clue count and transitivity) and vr-02 (category nearness).

**A finding that shapes the backbone: the VR banks barely touch the vault.**
Only 2 of 25 vr-04 target words, 0 of 25 vr-03, and 3 of 25 vr-16 are in the
vault. Keying tier to vault MEMBERSHIP alone would leave 90% on a default and
tiers would stay meaningless. So `vocabTier` falls back to an intrinsic proxy
(common-usage frequency + length/syllables) for words the vault does not hold.
This is honest but second-best; the real fix is the later step where the
word-based banks are re-authored FROM the vault, at which point every target
word resolves to a genuine tier and the fallback stops carrying the load.

**Applied as code, not yet re-seeded.** Regeneration runs
`itemOption.deleteMany` then recreates options, so a blind re-seed would
resurrect the two hot-fixed false-negative distractors (Entry 27). The backbone
is therefore landed as generator code with unit tests proving tiers now vary by
content; the coordinated re-seed — with the hot-fix baked into the analogy bank
so it survives — is the apply step, called out rather than done silently.

## Entry 30 — VR rebuild increment 2: vr-06 and vr-15 gate conversion
*2026-08-02. Both cases now machine-verified.*

`check:word-puzzles` now solves **265 rule-based items** (was 215). Two of the
six human-review cases convert to gate-verified.

**vr-15 reading-information — converted, passes clean.** The answer is deduced,
not asserted: `solveOrdering` builds the transitive closure of the "X is taller
than Y" clues and returns the unique person at the requested end, or null when
the clues do not force one (too few clues, a tie, a cycle). The key must be
that person. **All 25 keys uniquely deduced — 0 defects, 0 ambiguities.** vr-15
was sound; it just had no gate. Now a mis-keyed or under-determined vr-15 item
can never reach REVIEWED. Its only remaining issue is the tier range the
backbone already exposed: every item is 2 clues / 3 people, so honest tier is
T1–T2; genuine T3–T4 needs deeper puzzles, which is the vr-15 rebuild proper.

**vr-06 missing-word — converted, fails systematically.** The gate rebuilds
the whole word by dropping each option into the gap and checks it against what
its TAG claims: `fits-gap-not-word` must make a non-word, `ignores-sentence`
must make a real word. **All 25 keys make real words (answerable), but 30
distractors across all 25 items are mistagged**, both directions:

- `ignores-sentence` distractors almost never make real words — SHOAK, RATROT,
  BONTEN — so the hint a child sees misdiagnoses them (the reviewer's finding).
- occasionally a `fits-gap-not-word` DOES make a word — PAR → PARROT — the
  opposite mistag.

Reported (needs-review), not answerability defects: the item is answerable, but
every one teaches the wrong lesson to a child who picks a distractor. The vr-06
distractor bank needs re-tagging in the rebuild; the gate confirms each fix.

**Coverage now: 6 of 10 free-tier cases machine-verified** — insert-letter,
letters-for-numbers, letter series, number series, plus vr-15 and vr-06.
`solveOrdering` and the vr-06 reconstruction are covered by core unit tests
(37 word-puzzle tests).

## Entry 31 — VR rebuild increment 3: backbone applied to the DB, fold applied, and what it exposed
*2026-08-02. `content:generate` re-seed (VR-only, isolated); vr-10 fold live.*

**The backbone reached further than the six.** `synonymItems` is shared by
vr-04, vr-16 and vr-21, so wiring it once gave content-driven tiers to all
three — **8 word-meaning cases** now derive tier from content: vr-02, vr-03,
vr-04, vr-06, vr-10, vr-15, vr-16, vr-21.

**Applied to the DB safely.** `content:generate` is VR-only and upserts, so it
touched no English item, reviewer decision or account. 525 VR items regenerated
with content-driven tiers. The hot-fix was baked into the analogy bank first so
the re-seed could not resurrect the two false-negative distractors (Entry 27):
lake now offers `large / water / little` and sun `dry / wet / yellow` — the
defensible "deep"/"hot" gone, and a proper third option restored, which the
Entry 27 stopgap could not do. One imperfection flagged: sun's "wet" sits in
the same-topic tag slot though it reads as a reversed-relation error; both
analogies are weak and are marked for replacement in the vr-03 bank rebuild.

**vr-10 folded in the live DB.** Free tier is now vr-01, vr-02, vr-03, vr-04,
vr-06, vr-07, vr-09, vr-11, vr-14, vr-15 — vr-10 out, vr-14 (letter analogy) in,
family coverage intact.

### The finding the backbone exposed: the VR banks aren't T3–T5 hard

With tier keyed to content, the word-meaning cases come out **compressed into
tiers 1–2** — vr-04 `2,1,1,2,1,2,2,2`, vr-03 mostly 1, vr-15 `1,1,2,2`. Two
causes, both real: the proxy is weak for out-of-vault words (Entry 29), AND the
bank vocabulary is genuinely common and short. So the honest reading is that
**the current VR banks do not contain tier-3-to-5 difficulty at all.**

This turns the decorative-tier problem into a sharper one. The ratified VR
batch mix wants 35% tier 3 and a tail at tiers 4–5; those items cannot be built
from the present banks, because the difficulty isn't in them — the old loop
index was manufacturing a spread that the content never had. The fix is the
same bank re-authoring already scoped, now with a firm target: draw words from
the vault's T3–T5 bands (126 + 66 + 29 = 221 cards) so the harder tiers have
real content. Until then, an honest VR paper is a T1–T2 paper.

### Consequence for the delivered packs

The free-ten review pack and human-review breakdown were generated when the set
still held vr-10. It is now vr-14, and every tier in them predates this
re-seed. They are STALE. They should be regenerated before the sitting — held
back here rather than silently re-delivered, because the reviewer is mid-review
and swapping her working copy without a word would be worse than a stale one
she knows the shape of. David's call on timing.

## Entry 32 — Correction: the VR tier was decorative in PART, not whole
*2026-08-02. A closer read of the generators, made while wiring structural tiers.*

Entry 28 said every VR generator's tier was decorative. That was too broad, and
the correction matters because it changes what is and is not backed.

Reading each generator body rather than just the `tier = 1 + (i % 4)` line:

- **Tier DRIVES difficulty (honest):** `numberSeries` (T1 arithmetic → T4
  interleaved), `letterSeries` (step widens with tier), `letterConnections`
  (jump size = tier), and the arithmetic trio `lettersForNumbers`,
  `completeTheSum`, `relatedNumbers` (T≥3 switches to subtraction/
  multiplication). The loop index is fed back in to select a harder structure,
  so the item genuinely is its tier. Their batch-mix envelopes are backed. The
  arithmetic three are COARSE — two real levels (≤2, ≥3) labelled as four — a
  refinement, not a defect.
- **Tier was DECORATIVE (stamped, content chosen by `bank[i % len]`):** the
  word-meaning cases (fixed in increment 1) and the word/letter-bank puzzles
  `insert-letter`, `move-letter`, `hidden-word`, `make-a-word`,
  `complete-the-word`, `compounds`, plus `word-number-codes` whose tier was
  never referenced at all.

**Fixed this increment.** The seven decorative puzzle generators now key tier
to their content — `vocabTier`/`vocabTierOfSet` on the words each puzzle uses,
and the coded word's tier for `word-number-codes`. Re-seeded (VR-only). As with
the word-meaning cases they land mostly T1–T2, which is the honest reading: the
puzzle banks use short common words, so the items genuinely are easy. Real
T3–T5 volume across VR comes from two places — the series/arithmetic generators
(which already produce it) and re-authoring the word banks from the vault's
higher tiers.

**Net effect on David's original fear.** "Calibrating batch mixes against a
number nobody was setting" was HALF right for VR: the series and arithmetic
sections were backed all along; the word and letter-puzzle sections were not,
and now are. NVR was always backed (Entry 28), Maths has no items yet. The
correction is worth having because it means the VR mock papers were not wholly
built on sand — the reasoning sections stood; the vocabulary sections did not.

## Entry 33 — VR rebuild increment 4: the coarse arithmetic refined to four levels
*2026-08-02. vr-07, vr-17, vr-18 — the honest-but-coarse cases from Entry 32.*

Entry 32 flagged three arithmetic generators as honest but coarse: they drove
difficulty from tier, but only at a single ≤2 / ≥3 boundary, so four labelled
tiers were two real levels. Now they are four:

- **vr-07 letters-for-numbers:** T1 `P + Q` (two terms) · T2 `P + Q + R` · T3
  `P + Q − R` · T4 `P + Q + R − S`. Operand count and operation both climb.
  The arithmetic gate confirms every key still equals its expression.
- **vr-17 complete-the-sum:** T1 find a missing addend · T2 the second addend ·
  T3 a subtrahend · T4 the middle term of a two-operation equation. Verified:
  all 25 keys balance their displayed equation.
- **vr-18 related-numbers:** addition (T1), addition with larger operands (T2),
  multiplication (T3), multiplication with larger operands (T4) — operation and
  magnitude both climb.

All three now show four distinct tiers (`1,2,3,4` genuinely, not stamped), and
distractors are de-duplicated so no item offers the key twice.

**Where this leaves VR tiering.** The reasoning sections — series (vr-09,
vr-11) and arithmetic (vr-07, vr-17, vr-18) — now genuinely span T1–T4 with
difficulty in the content. The vocabulary and letter-puzzle sections sit at
T1–T2 because their banks are short common words (Entry 31/32). So a VR paper's
tier profile is now honest everywhere; the remaining gap is not decorative
tiers but real content — the word banks need the vault's T3–T5 vocabulary to
give the vocabulary sections a top end. That is authoring, not engineering, and
it is the last piece of the backbone story.

**Backbone status: complete.** No VR generator assigns tier by loop index as a
decorative stamp. Every tier is either derived from content (word cases) or
genuinely drives structure across four levels (series, arithmetic,
letter-connections). The batch-mix envelopes are now backed by real difficulty
wherever the content contains it, and where it does not, the tier honestly says
so rather than inventing a spread.

## Entry 34 — Three exhaustive-check findings: vr-02 unkeyable, vr-01 redesigned, vr-06 retags
*2026-08-02. Reported before fixing on vr-02, per David.*

### 1. vr-02 — oddOnesOut DID write a key, but not a readable one

Established before acting: every vr-02 item has exactly one `isCorrect` option
(25/25), so the generator did not forget the key. But the answer is stored as
`{pair: [a, b]}` with **no `value` field** — all 100 options — against a
`select-two` mechanic. Any value-based consumer (the answer checker, the
exhaustive check, the review pack before its pair-fix) reads the item as
valueless and unkeyable, and a four-pairs model does not match "pick two
words" anyway. So the items are unanswerable as served, even though a key
exists in the data.

Per David's ruling, vr-02 is **out of the free ten until the interaction is
rebuilt** — held out in the derivation like vr-05 and vr-10. The rule fills the
freed wordweb slot with `case-vr-12` (Compound Words), which is answerable
(value options, one key). Free ten is now vr-01, vr-03, vr-04, vr-06, vr-07,
vr-09, vr-11, vr-12, vr-14, vr-15.

### 2. vr-01 — distractor constructor and tags redesigned together

The old distractors were baked bank columns whose `vr01-first-word-only` tag
described nothing they did (named the second word on 9 items, neither on 7, the
first on none), and on four items a distractor completed BOTH words — a second
right answer offered on the card.

Both fixed at once by COMPUTING distractors from the words. The constructor
walks the alphabet, sorts every non-key letter by what it actually does, and
**never offers a letter that completes both** (that class of double-key is now
impossible by construction). Each offered distractor is tagged by its real
behaviour: `vr01-first-word-only`, `vr01-second-word-only`, or
`vr01-completes-neither` (the tag library redesigned to match). Result: the
four insert-letter defects (01, 12, 13, 21) are **lifted** — the word-puzzle
gate's unanswerable count fell 12 → 8 — and every tag now describes its letter.

### 3. vr-06 — items 04 and 15 retagged

`PAR → PARROT` and `ANT → WANTED` are real words that were tagged
`fits-gap-not-word` (which claims a non-word). Fixed at the bank by swapping the
two distractor columns for those rows, so the real word now carries
`ignores-sentence` and the genuine non-word (`RATROT`, `WAXEED`) carries
`fits-gap-not-word`. Durable through re-seed. The rest of vr-06's mistags remain
for the bank rebuild; these two were the specific real-word-as-non-word cases.

All applied via a VR-only `content:generate` (no English/reviewer data touched)
plus the free-tier derivation. The delivered review packs are now further out of
date (vr-02 → vr-12, vr-01 options changed) and should be regenerated before the
sitting.

## Entry 35 — VR walk scripts imported, and the free ten's true state for the final pack
*2026-08-02. 227 scripts across eight cases; report-only on failures.*

**223 of 227 landed as DRAFT.** Each was screened by the child-facing gates on
the way in (hint role). Four were held back, not published — all on the
reading-age long-word ceiling (two 4+ syllable words in one sentence):
`vr-03-11` and `vr-10-24` ("caterpillar" twice), `vr-04-18` ("Courageous",
"unrelated"), `vr-04-23` ("Ordinary", "unrelated"). They go back for a reword;
`vr-10-24` is not free-tier.

### The free ten's true state

| case | items | gate-clean | walk scripts | floor |
|---|---|---|---|---|
| vr-01 insert-letter | 25 | 25 | **STALE** | meets |
| vr-03 related-words | 25 | 25 | 24/25 | meets |
| vr-04 closest-meaning | 25 | 25 | 23/25 | meets |
| vr-06 missing-word | 25 | 25 | all | meets |
| vr-07 letters-for-numbers | 25 | 25 | all | meets |
| vr-09 letter-series | 38 | 38 | all | meets |
| vr-11 number-series | 39 | 39 | all | meets |
| vr-12 compound-words | 25 | 25 | **NONE** | meets |
| vr-14 letter-connections | 25 | 25 | **NONE** | meets |
| vr-15 reading-information | 25 | 25 | all | meets |

**All ten meet the 15-item clean floor.** No case is short. Every free-ten item
is gate-clean (no answerability defect, no copy fault, and where a script
exists it passes). The gap before the pack ships is walk-script coverage, in
three places:

1. **vr-12 — NONE.** David already flagged this; scripts to be drafted.
2. **vr-14 — NONE.** New gap: vr-14 entered the free ten this turn via the
   vr-10 fold, and no scripts were ever authored for letter-connections.
3. **vr-01 — STALE, and this is the sharp one.** A vr-01 script file was
   delivered, but this turn's distractor redesign changed the options, and
   **22 of 25 scripts name a letter no longer on the card** ("An r leaves
   plan_ broken" — but r is not offered any more; the options are now t/e/b).
   The scripts must be re-drafted against the new distractors. A walk script
   that names specific options is coupled to those options, so redesigning
   distractors invalidates the scripts — worth carrying as a rule: re-script
   after any distractor change.

Plus the **four held reading-age failures** (three in free-tier cases: vr-03×1,
vr-04×2) to reword.

**So the final pack needs, before it ships:** vr-12 scripts drafted, vr-14
scripts drafted, vr-01 scripts re-drafted against the redesign, and four
scripts reworded. Nothing in the item content blocks it — the shortfall is
teaching text, not answerability.

## Entry 36 — The three re-authored VR banks, and the tier-derivation finding
*2026-08-02. vr-04 (40), vr-06 (40), vr-02 (25) imported; report-only on failures.*

The banks replace the procedurally-generated items for their three types
(generate-content now skips them, so a re-seed cannot resurrect the old ones).
Stored difficultyTier is the bank's DECLARED, vault-bound tier — authoritative
per David's note. All imported as DRAFT; nothing publishes.

### The finding David anticipated: the generator's derived tier does NOT match the banks

Deriving tier from vocabulary — as the generators do — reproduces the declared
distribution only partially:

| bank | declared | generator's vocabTier reproduces |
|---|---|---|
| vr-04 synonyms | 8/8/8/8/8 | 30/40 |
| vr-06 missing-word | 8/8/8/8/8 | 16/40 |
| vr-02 odd-ones-out | 5/5/5/5/5 | 6/25 |

Three causes, all real:

1. **`bandTier` capped at 4.** VR was mis-read as four tiers (the old
   `1 + (i % 4)`); the ratified batch mix is five buckets and the vault is
   tiered 1–5. Corrected to 1–5 this turn — otherwise the declared T5 (8, 8 and
   5 items) could never be derived at all.
2. **The difficulty shim reads `words.json` (120 cards), not the full 300-card
   vault.** vr-04's 40 targets are all in the DB vault but only 28 in
   words.json, so 12 fall to the proxy. The shim must read the full vault to
   reproduce vault tiers; until it does, `vocabTier` is a proxy for the
   vocabulary sections, not a reproduction.
3. **vr-06 and vr-02 targets are not single vault words.** A missing-word target
   is SHOUT; an odd-one-out has five stem words and no single target. Only 6 of
   40 vr-06 targets are vault entries. Their declared tiers are the author's
   judgement, not a vault lookup, so `vocabTier` was never going to match.

**Conclusion:** the banks are right to carry their tier explicitly, and the
generator's derivation is not a substitute for the authored, vault-bound tier.
This is exactly why the standing rule holds — **a supersede or re-tier on a
target word means REGENERATING the bank, not editing the item.** The tier is
data the author owns, bound to the vault, not something the generator can be
trusted to recompute while the shim is under-provisioned.

### What the import fixed and what it flags

- **vr-06 mistags: gone.** The re-authored distractors build real words (SHORT,
  SHINY) correctly tagged `ignores-sentence`; `check:word-puzzles` finds **0
  mistags** across all 40 (was 30 across 25).
- **vr-02 keyable.** Every item has one `isCorrect` key and every option now
  carries a `value` (a `[word, word]` pair). The serving orchestrator scores by
  `chosen.isCorrect`, so the pairs are scoreable as served; the old blocker was
  the missing `value`, which broke the renderer, the export and the exhaustive
  check — not the scorer.
- **One gate failure to rule on:** `bank-vr-04-closest-meaning-20` offers
  "weak" as an option, which hits the child-facing ban ("weak", voice). It is a
  vocabulary option, not product voice — the same ABOUT-language tension as the
  passage-quote and tested-token carve-outs. Needs a ruling: carve out
  vocabulary options, or reword the item. Reported, not resolved.

### Can vr-02 return to the free ten?

**Yes.** It is keyable, gate-clean, scoreable by the orchestrator, and its
options carry values. Under Entry 23's rule — the first two cases of each family
in district order — the wordweb pair is `vr-02, vr-04`, so **vr-02 returns and
displaces `case-vr-12`** (Compound Words), which had filled the slot when vr-02
was held out (Entry 34).

One caveat to ratify before flipping the flag: the item models "which TWO are
the odd ones out" as select-ONE-of-four-pairs, not select-two-of-five-words.
That is answerable and scoreable today, but if the intended interaction is
picking two individual words, the serving UX is a separate rebuild. Reported for
David's decision; the free-tier membership is unchanged pending it.

## Entry 37 — Export freshness stamp, and the option-word exemption for walk scripts
*2026-08-02. Two rulings applied.*

### 1. Freshness stamp — four runs stalled on stale exports

Every delivered export now carries a `generatedAt` timestamp and a `sourceHash`
— a 16-char sha256 over the CANONICAL (sorted-key) source rows it was built
from, not the rendered file. A consumer tells stale from current by re-running
the export and comparing `sourceHash`: same → the source has not changed, the
file is current; different → stale. Cosmetic layout changes do not move the
hash; a real change to the items always does.

Added to `freshnessStamp()` in the shared export lib and wired into
`export:vr-free-ten`, `export:walk-scripts`, and `export:vr-human-review`.

**The VR free-ten export re-run and confirmed current.** It had gone stale
across three changes — vr-01's computed-distractor redesign, the vr-10→vr-14
fold, and vr-02's replacement by vr-12 — which is why Cowork rightly refused to
draft against it. The fresh file carries the current ten cases (vr-01, 03, 04,
06, 07, 09, 11, 12, 14, 15) and vr-01 item 1 shows the computed options `t / e /
b`, not the old `s / r`. 307 items; the one gate failure carried in `gateFaults`
is the vr-04 "weak" option awaiting David's ruling (Entry 36).

### 2. Option words are stimulus, exempt from the script's long-word ceiling

Same logic as R4 (declared quotations) and tested tokens: an item's own option
TEXT is stimulus printed on the card, not the walk script's chosen vocabulary.
A script naming a ten-letter key ("courageous") cannot be penalised on the
long-word ceiling for a word the child is already reading. Bounded exactly:
the option's own words, only in that item's own script, lifting only the
vocabulary ceiling — implemented by feeding the option words in as tested
tokens (which already exempt the vocabulary ceiling and nothing else).

Applied in the canonical DB sweep (`check:db-content`) and both walk-script
importers. Its reach is forward-looking: it did NOT rescue the four scripts held
last turn — `caterpillar` (vr-03-11, vr-10-24) is the script's OWN word, not an
option, so it still fails, correctly; and the two vr-04 scripts are now orphaned
anyway (their gen-* items were replaced by the bank). What it protects is the
NEW bank scripts Cowork will draft, which name keys like "courageous".

**A staleness note that keeps recurring:** importing the re-authored vr-04/06
banks deleted the old gen-vr-04/06 items, and with them the 50 walk scripts
written against those ids — so the VR script import now reports 50 "no such
item". Bank re-authoring invalidates scripts bound to the old item ids, the
same coupling as the vr-01 redesign. The free-ten scripting gaps are now vr-01
(re-draft), vr-04 (bank, none), vr-06 (bank, none), vr-12 (none), vr-14 (none).


## Entry 38 — The staleness catch: a script may not name an option not on its card
*2026-08-02. The machine-catch for the class that kept recurring.*

Twice now a walk script has named an option that no longer existed — the vr-01
distractor redesign left 22 scripts naming "r" when the card offered t/e/b, and
the bank swap orphaned 50 more — and both were caught by eye, not by a gate.
`lettersNamedNotOnCard` closes that route.

**What it checks.** For a letter-option item (every option a single letter), any
lone letter the script names must be either an option or a letter present in the
stem. A letter that is neither is stale — the script was written against a
different version of the item. Applied in both walk-script importers (which
refuse the script) and the database sweep (which reports it).

**Two honesty bounds, both learned in the building:**

1. **Stimulus letters are allowed.** The first cut flagged every letter-series
   script, because a series script must name its terms — "A, B, C, D, so E" —
   and A–D are stem letters, not options. The check now allows any letter in the
   stem, so it fires only on a letter that is genuinely neither offered nor
   shown. Word-option staleness (a script naming a distractor WORD that was
   removed) needs a different heuristic and is left for later; letter options
   are where the staleness has actually bitten.

2. **It under-flags rather than over-flags.** A stale distractor letter that
   happens to appear somewhere in the stem word is not caught. That is the safe
   direction — a false "stale" on a correct script would train people to ignore
   the gate, which is worse than the occasional miss.

Re-running the VR import with the check live: 177 scripts land, 50 are refused
as orphaned items ("no such item"), and 0 current scripts trip the stale-letter
rule — the letter-series scripts pass because their stem letters are allowed.
The check would have turned both prior staleness incidents from an inspection
into a build failure.

## Entry 39 — Two rulings: the "weak" reword, and the free ten declared final
*2026-08-02. Both applied.*

### 1. "weak" reworded, not exempted

The ban hit on `bank-vr-04-closest-meaning-20` was `weak` — and it was the KEY
(feeble → weak), not a distractor as the ruling assumed. The reword action
applies either way: exempting a banned word because it is vocabulary is the R4/
tested-token move for the word an item is ABOUT, not for an ordinary answer that
happens to trip the ceiling. So the key was reworded **weak → frail**, a
same-tier (T3) synonym of feeble that clears the voice ban. `feeble` is a T3
vault card; `weak` was never a vault word, so nothing was lost by dropping it.
Changed in both the source bank (so a re-import stays consistent) and the DB,
with an audit row noting it was the key. `check:db-content` now reports
everything serving clears the gates.

### 2. The free ten is final

vr-02 does NOT return. vr-12 is in, meets the floor, is answerable and scoreable,
and swapping back would cost another script run and pack regeneration for no
pedagogical gain. vr-02 ships in the paid tier once its select-two interaction
is built.

**THE FREE TEN, FINAL:** vr-01, vr-03, vr-04, vr-06, vr-07, vr-09, vr-11, vr-12,
vr-14, vr-15. The live DB already carries exactly this; no change was needed,
only the ruling on the record. The free-ten export was re-run against it — 307
items, **0 gate failures** (the reworded key cleared the last one), delivered
with a current freshness stamp.

## Entry 40 — The stale export: what happened, and the three fixes
*2026-08-02. A freshness stamp that failed silently on first use.*

**What happened.** The export ran correctly, read the live DB (correct), and
delivered the right file to `11+/from-cluecrew/`. But a manual copy made to
`~/Downloads/` root on an early "put it in my downloads" turn — dated 18:42,
pre-redesign, pre-banks, no stamp — was never refreshed, because `deliver()`
only writes to from-cluecrew. Cowork reads the `11+/` tree, but that stray
root copy was the one being diffed. The DB and the delivered file were both
right the whole time; a stale sibling outside the delivery path was not. The
freshness stamp was present in the delivered file and could not help, because
nothing compared it and the stale copy was a different file with no stamp at
all — inert exactly as feared.

**Three fixes, all applied.**

1. **No copies outside the delivery path.** Every export artifact at
   `~/Downloads/` root and the `reviewer-pack-vr/` folder deleted; `deliver()`
   to `11+/from-cluecrew/` is the only path, and manual copying is banned.
   David's inputs (misconceptionimport.json etc.) left untouched.

2. **The content hash is in the filename.** `vr-free-ten-c17a98c9d7c439cf.json`,
   not `vr-free-ten-2026-08-02.json`. Copies self-identify; versions no longer
   collide on one date. `deliver(path, family)` supersedes any older file of the
   same family, so the outbound folder holds exactly one current copy — the run
   removed the stale `vr-free-ten-2026-08-02.json` on delivery.

3. **A checker, because a stamp without a comparison is inert.**
   `pnpm check:export-freshness [file]` rebuilds the current source with the
   SAME shared builder the export used (`buildFreeTenSource`, extracted so the
   two cannot drift) and compares hashes. Missing hash is a failure, not a
   pass — an unstamped file is precisely the stale one we could not see.
   Verified end to end: a current file → CURRENT (exit 0); a wrong-hash file →
   STALE (exit 1); a hashless file → UNSTAMPED (exit 1). With no argument it
   scans the outbound folder and gates on any stale or unstamped file.

**Scope, stated honestly.** The full mechanism — hash-named delivery,
supersede-on-deliver, shared source builder, checker registry — is complete and
tested for the `vr-free-ten` export, the one that failed four times. The other
exports (walk-scripts, human-review, review packs) still carry the freshness
STAMP in their payload but not yet in their filename, and have no checker
builder, so they self-report a hash but are not yet auto-verified. They adopt
the same three lines (stampedName, deliver-with-family, a registry builder) when
next touched; I did not hash-name them without a builder, because a hash-named
file the checker skips is the same "looks handled, isn't" gap this entry is
about. `check:export-freshness` reads a local machine path (David's Downloads),
so it is a pre-delivery check, not a CI step.

## Entry 41 — vr-01 common-usage floor, vr-12 compound gate, and the 155-script import
*2026-08-02. Two upstream fixes, then a gated import.*

### 1. vr-01 distractors judged against the common-usage floor

The insert-letter constructor classified distractor letters with the permissive
lexicon (`isWord`), so a letter "completed" a word even when that word was
below child vocabulary (boor, cruse) or a lexicon-accepted non-word (clamb,
drinn). The first/second-word tag then claimed a completion the child could not
see. Now the constructor uses `isCommon` — the SAME `common-en.txt` list that
splits DEFECT from REVIEW in the gate, so generator and gate agree on what a
child knows. A letter completing only an uncommon word is classed
completes-neither, honestly.

Regenerated: **0 of 25 vr-01 items now carry a first/second-word tag whose
completion is not common** (was 18). Every tag names a word a child recognises.

### 2. vr-12 compound double-key gate

A distractor that forms a real compound with the base is a second right answer,
the same class as an insert-letter double-key. The gate now rejects any vr-12
item where `base+distractor` (either order) is a real word. **7 of 25 fail** —
all four the reviewer named (02 raindrop, 03 toothpaste, 10 starshine, 22
airplane) plus three the gate found (13 lamplight, 14 footwalk, 24 storybook).
All seven are answerFlagged defects, blocked from REVIEWED.

**A coverage limit, stated plainly.** The gate sees only compounds the wordlist
contains. `toothpaste` was ABSENT from en-lower.txt, so the gate missed item 03
until I added the word — a legitimate dictionary entry that should have been
there. Other closed compounds absent from the list would slip the same way; the
honest follow-up is a curated compound list, and until then the reviewer's eye
still matters for vr-12. The miss is instructive: a real-word gate is only as
complete as its word list.

### 3. The 155 scripts — 147 landed, 8 held

`VR-FINAL-FIVE-CASES.json` (25 vr-01 + 40 vr-04 + 40 vr-06 + 25 vr-12 + 25
vr-14). **147 landed as DRAFT; 8 held, all banned-vocabulary voice failures**,
not published: `gen-vr-01-16` ("smart"), `bank-vr-04-20` ("weak" — the
feeble→frail item, whose script still names the old key), and five vr-06 scripts
("poor"/"poorly"). They go back for a voice pass.

**R10 in action, and its result.** The staleness check (`lettersNamedNotOnCard`)
ran on every vr-01 script, since fix 1 had just changed the distractor letters.
**It caught none** — the scripts name no letter fix 1 removed, so they are
current on the card. The only vr-01 casualty was a voice word, not a stale
letter. R10 did its job; the answer happened to be clean.

## Entry 42 — vr-12 both-direction compounds, the 9 swaps, and the 17 scripts
*2026-08-02.*

### 1. Both join directions — already checked; the miss was coverage

The gate already tested `base+distractor` AND `distractor+base` (one line,
either order). "day + sun = Sunday" slipped not because a direction was
skipped but because **`sunday` was absent from the lexicon** — the islower()
filter that built en-lower.txt dropped the days of the week as proper nouns.
Added the seven days; the gate then caught item 17 (`day`+`sun`=sunday) via the
reverse direction. **8 of 25 flagged** with the days present — the earlier
seven plus item 17.

This is the third coverage miss in a row (toothpaste, gameplay, sunday), each a
real compound absent from a general dictionary. The gate is exactly as complete
as its wordlist, and closed compounds are precisely what a general word list
under-covers. The curated compound list is now a firm backlog item, not a
nice-to-have — until it exists, vr-12 needs the reviewer's eye as a backstop.

Item 16 (`play`+`game`=gameplay) is the standing proof: a real compound, still
absent from en-lower.txt, that the gate cannot see. The swap fixed it anyway.

### 2. The 9 option swaps, applied before the scripts (R10)

`case-vr-12-CORRECTED-BANK.json` replaces each compound-forming distractor with
a clean one: drop→umbrella, paste→dentist, shine→planet, lamp→shadow,
walk→ankle, game→toy, sun→hour, plane→breeze, story→chapter. Options landed
FIRST, because script and options are coupled — a script naming "umbrella" is
wrong until the card offers it. All nine new values pass the child-facing gate;
`check:word-puzzles` **lifted all eight vr-12 flags** (item 16 was fixed
proactively, the one the gate could not see). vr-12 now has zero compound
double-keys.

### 3. The 17 changed scripts

With the options in place, re-importing `VR-FINAL-FIVE-CASES.json` landed the
17 scripts that differed from the database — 9 vr-12 rescripts written against
the new distractors, plus the 8 held last turn (1 vr-01 "smart", 1 vr-04
"weak", 6 vr-06 "poor"), now revised of their banned vocabulary. **155/155 land;
0 gate failures.** Every free-ten VR script the five final cases needed is in,
and every one passed the child-facing gates on the way.

## Entry 43 — The VR review pack for the final free ten
*2026-08-02. Hash-named, freshness-checked, delivered.*

`pnpm export:vr-review-pack` regenerated for the final ten (vr-01, 03, 04, 06,
07, 09, 11, 12, 14, 15) — **307 items, and for the first time every one carries
a walk script (307/307).**

The decisions page now carries three things the reviewer asked for:

- **The three cases held out**, each with its reason: vr-02 (unanswerable as
  first served — options carried no value; rebuilt but NOT returning, vr-12
  holds the slot); vr-05 (nineteen hidden-word items admit a second word at the
  join); vr-10 (folded into vr-03 — identical analogy bank, no distinct
  content; slot went to vr-14).
- **Where to spend attention**: machine-verified (vr-09/11 series, vr-07
  arithmetic, vr-15 deduction, vr-01 insert-letter, vr-12 compounds) vs human
  judgement (vr-04 closest meaning, vr-03 related words, vr-06 missing word),
  so the verified cases can be read quickly and the semantic ones closely.
- **The vr-12 caveat, plainly**: the compound gate is only as complete as its
  wordlist; toothpaste, gameplay and sunday were invisible until added by hand,
  so her eye is the backstop until a curated compound list exists.

**Freshness, now genuinely closed.** The pack hashes the SAME free-ten source
the item bank and checker use, so its filename carries the hash
(`review-pack-vr-free-ten-f410f71ad503fb8f.*`) and a manifest lets
`check:export-freshness` verify it. Generating the pack immediately exposed
that the item bank itself had gone stale (its items changed this session:
`c17a98c9` ≠ `f410f71a`) — the checker flagged it, the bank was refreshed, and
both now read CURRENT. The mechanism caught a real stale file on its first
genuine use, which is exactly what Entry 40 was missing.

**A prune bug, caught and fixed.** The first delivery superseded its own
decisions file — the family prune matched same-family/same-extension siblings
regardless of hash. Fixed to key on the 16-hex content hash: a same-family file
is removed only when its hash DIFFERS, so a pack's .html/.pdf/-decisions.json/
manifest (one hash, four files) all survive while every older version is
cleared.

## Entry 44 — Reviewer's three fixes on the rebuilt pack
*2026-08-02. Zero double-keys and zero ambiguities confirmed; three fixes.*

**1. Two stale vr-03 walk scripts (R10).** `gen-vr-03-related-words-10` names
"hot" and `-23` names "deep" — the two Entry-25 false-negative hot-fixes, whose
distractors were removed from the cards but whose scripts were never redrafted.
Sent for redraft. The vr-10 folds (`-23`, `-11`) carry the same stale scripts;
not free-tier, but flagged for the same redraft.

**2. Staleness checker extended to WORD options.** `lettersNamedNotOnCard`
only caught lone letters; `wordOptionsNamedNotOnCard` now catches a script
naming a distractor WORD the card no longer offers. The signal is coordination
with a real option — "X and Y" where one side IS a current option and the other
is a content word that is neither an option nor stem stimulus — which is how a
script lists the choices it dismisses. Restricted to "and", with a stop-word
filter, after a first pass fired on "cut, so cut" and other prose: 56 false
positives down to the 4 genuine stale scripts. Wired into check:db-content and
the walk-script importer.

**3. vr-15 first-mention derived, not fixed-slot.** `vr15-first-mention` sat on
a fixed person while the tier≥3 clues are given out of order, so it named the
wrong person in **12 of 25**. Now derived from the clue text — the distractor
whose name opens the clues carries the tag; if the first-named person is the
answer, neither distractor is a first-mention trap. After regeneration, **0 of
25 mistagged** (18 carry the tag, all correct).

**A regression this surfaced and closed.** Regenerating for the vr-15 fix ran
`content:generate`, which recreates options from the banks — and REVERTED the
nine vr-12 swaps, which had been applied to the database only. The corrected
scripts (naming umbrella, dentist, …) were then stale against reverted options,
and the new word-option checker caught all eight. The fix was to bake the swaps
into the COMPOUNDS bank so regeneration produces them, the same lesson as the
Entry-25 analogy hot-fix: a correction applied to the database and not to its
generator is reverted the next time the generator runs. Both exports were
flagged stale by the freshness checker and refreshed (d0ee2df5).

## Entry 45 — KS2 maths misconception seed library (reviewer-authored)
*2026-08-02. 60 entries; 40 imported and approved, 20 held on the gates.*

The specialist reviewer authored 60 KS2 maths misconceptions, her wording
verbatim. Imported per David's notes.

**Gate result: 40 pass, 20 held.** The 20 fail the child-facing hint gates —
sentence length over 16 words (15), "you must" (§1.3 pressure phrasing, 5), and
long words (thermometer/temperature, isosceles/equilateral). Her wording is not
amended; the 20 go back to her, exactly as with the English hint set. The 40
that pass landed PROPOSED and were approved through the written-review path —
approvedBy the reviewer, recordedBy David, method "written review — maths
misconception seed library", she being the author.

**Her six groupings are preserved** as a new `category` field on Misconception
(migration `misconception-category`): Place Value & Decimals, the four
operations, Fractions/Decimals/Percentages, Measurement, Geometry, and
Statistics/Ratio/Proportion.

**Derivable vs conceptual, across all 60.** A DERIVABLE misconception executes
on an item's own numbers to yield one specific wrong answer, so a gate can
machine-verify a distractor the way insert-letter and compound gates do; a
CONCEPTUAL one is a belief or definition that authoring and review must judge.
**47 derivable, 13 conceptual** — conceptual: 15, 20, 27, 28, 30, 40, 41, 42,
43, 49, 50, 58, 59, anchored on David's examples. Geometry is the most
conceptual strand (5 of 10); Place Value is entirely derivable (10 of 10).
Among the 40 APPROVED, 31 are derivable and 9 conceptual (four conceptual
entries were among the 20 held on the gates).

**Exported for authoring**: `pnpm export:maths-misconceptions` writes the
approved ACTIVE ids with category, class, description and hint — hash-named,
stamped and freshness-checkable like every other export. Only ACTIVE ids are
exported, since a PROPOSED id cannot be referenced by a live item.

## Entry 46 — Maths hint rewords, source docs into the repo, and a stored exemption
*2026-08-05. All 20 held hints reworded; the maths seed set is complete at 60.*

**Source documents moved into the repo.** The reviewer's original seed library
had vanished from Downloads by the time the rewords arrived — the exact
staleness the outbound discipline exists to prevent, now proven on the input
side. Both source documents live in `docs/` from here:
`maths-misconception-seed-library.md` (reconstructed from the reviewer's
verbatim text and validated byte-for-byte against the 40 already-imported
descriptions — 40/40 match) and `maths-misconception-seed-reworded.md`. Neither
sits in a scanned scope, so their by-design gate-failing text does not redden
CI.

**The 20 reworded hints all pass; all 20 imported and approved** through the
written-review path (method "written review — maths hint rewords"). The maths
seed set is now **60/60 ACTIVE**. None came back with a new fault; her rewords
were clean.

**The #49 tested-token exemption, stored on the row.** "isosceles" and
"equilateral" are the vocabulary the universal-symmetry hint is ABOUT, so they
are exempt from the long-word ceiling on that hint — but the first import
approved 59 of 20+39 and left #49 stuck PROPOSED, because the exemption lived
only in the import script and the APPROVAL door re-gated without it. The fix is
a `Misconception.testedTokens` field: the exemption is stored once, on the
entry, and read by every gate that screens the hint — the import, the approval
door, and the `check:db-content` sweep. A serving hint's exemption can no longer
be honoured in one place and forgotten in another, which is the same failure
class as a DB-only fix reverted by its generator (Entry 44).

## Entry 47 — The derivable maths distractor gate
*2026-08-05. BUILD-DISTRICT-MATHS §5, gate #4, built ahead of item authoring.*

The maths district's structural advantage is that a distractor can BE the
misconception executed on the item's own numbers — "what answer does the
place-value slip give for 304?" is 34, computable, not asserted. This gate
makes that verifiable.

**What it does.** For every MATHS item: the key is recomputed from the item's
`solution` expression (a small safe arithmetic evaluator — four operations and
parentheses, nothing else executes), and every distractor tagged with a
DERIVABLE misconception must equal the number that misconception produces on the
item's operands. A distractor that does not is a defect; a defect on a LIVE item
fails the build, on a DRAFT item it is backlog.

**The executors.** One function per derivable misconception, keyed by the
reviewer's entry number, in `packages/core/src/maths`. `#11` commutative
subtraction runs |top−bottom| per column (42−17 → 35); `#16` divides the other
way; `#22` adds numerators and denominators; `#52` reads a ratio straight as a
fraction; `#56`/`#57` give the total or the median instead of the mean. **17 of
the 47 derivable misconceptions have an executor so far** — the crisp numeric
ones across all six strands. The gate REPORTS the 30 still uncovered by number,
so the coverage gap is visible rather than a silent pass, and each slots in as a
pure, tested function.

**Conceptual entries are review-only.** The 13 conceptual misconceptions (a
belief or definition — "a square is not a rectangle") have no single executable
answer; the gate reports them as verified by human review, never as a defect.

**Contract for authoring.** A maths item carries `stem.operands` (its named
numbers) and a `solution`. Without operands the executors cannot run and the
gate says so per item. Wired into CI after `verify:solutions` (gate #3), and
there are no maths items yet, so it is a green no-op that is ready the day the
first item lands. 13 unit tests cover the executors, the evaluator and the item
check.

## Entry 48 — VR free-ten published LIVE, and two gate holes it exposed
*2026-08-05. The reviewer signed off VR; 299 items now LIVE.*

The specialist reviewer's verbatim confirmation — "I confirm I am content for the
VR items I have passed to go live to children" — recorded on every published
item through the written-review path: `reviewedBy` the reviewer, `reviewRecordedBy`
David (a LIVE item's DB CHECK requires `reviewedBy`, and the two identities may
never be equal). `pnpm publish:vr-signoff` runs every gate per item and REFUSES
any that fail, because publishing to a child is one-way.

**299 of 307 published; all ten cases clear the 15-item floor.** vr-01 25, vr-03
23, vr-04 40, vr-06 34, vr-07 25, vr-09 38, vr-11 39, vr-12 25, vr-14 25, vr-15
25. Eight held back as DRAFT: the two vr-03 scripts naming a removed distractor
(hot/deep — the reviewer's open finding, correctly refused by the word-option
staleness gate), and six vr-06 items whose cloze `stem.sentence` fails the
child-facing gate (three over 16 words, plus "poorly", "You must", "weak").

**Two gate holes this surfaced, both fixed — honestly, because one leaked.**
1. The publish gate first checked only `stem.prompt`, so six vr-06 items went
   LIVE with a faulty `stem.sentence` before `check:db-content` caught them as
   serving failures. I reverted all six to DRAFT immediately and rebuilt the
   gate to screen EVERY stem string (the same extraction the serving sweep
   uses), not just the prompt. A publish gate that checks less than the serving
   gate is worse than none.
2. `check:word-puzzles` failed the build on a REVIEW-level finding once the item
   was LIVE — a dictionary-only competitor ("crush/hent") is a worth-a-glance,
   not a second answer a child can pick. Soft findings (needs-review,
   ambiguous-outcome) now route to a non-blocking reports bucket; only a real
   double-key or an unanswerable key blocks serving.

**Gate-5A content status: MET.** Ten free-tier cases, each ≥15 LIVE, 299 total.
Every serving gate green — check:db-content, check:word-puzzles, check:nvr,
validate:content, 508 core tests. The 8 held items go back to authoring; each
returns through the same gated publish once fixed.
