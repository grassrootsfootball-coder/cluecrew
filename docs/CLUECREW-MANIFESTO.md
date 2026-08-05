# THE CLUECREW MANIFESTO
### Constitution and Anti-Drift Document — v1.11
**Status: pending trademark clearance on "ClueCrew" (UK IPO classes 9, 41, 42) and domain check. No external spend until cleared.**

This document is read by Claude Code at the start of every build session and by every human contributor before any work. Phase specs (BUILD-PHASE-1.md through BUILD-PHASE-6.md) implement this document. Where a phase spec conflicts with this manifesto, the manifesto wins. Where anything conflicts with UK law or child safety, law and safety win.

---

## 1. MISSION

**ClueCrew makes the 11+ make sense — for every child and every parent — through clear teaching, calm design, and a price any family can reach.**

## 2. VISION

**A UK where a child's 11+ result reflects their preparation, not their parents' bank balance or knowledge of the system.**

## 3. WHAT WE BELIEVE (VALUES)

1. **Clarity is kindness.** Every concept explained multiple ways until it clicks. If a 9-year-old can't understand our explanation, the explanation is wrong, not the child.
2. **Calm beats cram.** Fifteen minutes a day, every day, beats Sunday marathons. We reduce exam anxiety by design; we never manufacture it to sell.
3. **Evidence over myth.** We build on mastery learning, spaced retrieval, worked examples, and multiple representations. We do not build on debunked ideas, and we do not claim what we cannot prove.
4. **Every family.** First-generation parents, EAL families, SEN children, tight budgets — these are our core users, not edge cases.
5. **The child's side.** We are the child's ally, not the exam's enforcer. A wrong answer is a clue, not a failure.

## 4. THE TWO PROMISES

**To children:** ClueCrew is a place where you crack cases, collect words, rank up, and become the expert. Mistakes are how detectives work. Nothing here will make you feel stupid, ever.

**To parents:** We will show you exactly what your child is learning, exactly how to help, and exactly what the 11+ involves in your region — in plain language, with no scare tactics, no hidden fees, and no lock-in tricks.

---

## 5. THE LAWS (NON-NEGOTIABLE — CHECK EVERY BUILD AGAINST THESE)

### Legal and claims laws
- **L1.** Never claim, imply, or gamify a "guaranteed pass" or success rate we cannot substantiate with our own audited cohort data. Money-back offers are usage-conditional only, with precisely defined completion criteria.
- **L2.** Never use "learning styles," "visual learner," "kinaesthetic learner" or equivalent framing anywhere — code, copy, marketing, or parent reports. The approved framing is: "every concept, multiple ways — your child chooses how it clicks."
- **L3.** Never imply affiliation with GL Assessment, CEM, ISEB, any school, consortium, or the DfE. Exam-board names appear only factually ("GL-style format").
- **L4.** Never reproduce any question, passage, or content from any past paper or familiarisation material. Every item in the bank is original. Question *types* are fair game; question *content* never is.
- **L5.** Subscription flows meet the DMCC standard regardless of commencement date: total contract value displayed before purchase, renewal reminders, cooling-off honoured, cancellation as easy as signup. No drip pricing. No dark patterns, ever, anywhere.
- **L6.** "For Dummies," "Idiot's Guide" and similar third-party marks never appear in product, code comments, or marketing.

### Child safety and data laws
- **S1.** Children's Code by default: data minimisation, high-privacy defaults, no profiling that isn't in the child's interest, age-appropriate transparency. The DPIA is a living document updated every phase.
- **S2.** No open social features. No child-to-child content sharing, no public profiles, no chat. Any future social feature requires a fresh OSA scope assessment before a line of code.
- **S3.** All child-facing text, audio, and feedback is **authored or template-bound, never free-generated in the moment** — with one exception: writing feedback, which runs the two-pass pipeline (screening pass → human review queue for flags → constrained feedback pass). The feedback engine discusses the writing, never the child's life, and never initiates welfare conversations.
- **S4.** A named Designated Safeguarding Lead exists before the writing feature ships, with a documented escalation decision tree. Flagged work reaches the DSL same-day. The child never sees "flagged."
- **S5.** Child free-text is screened for PII; real names, addresses, schools, and numbers are stripped or blocked with a gentle prompt.
- **S6.** Verifiable parental consent for all under-13 accounts. Parents own accounts; children have profiles.

### Design laws
- **D1.** Errors are never red. Try-again states use Coral (#E8836B) and "not yet" language. The word "wrong" does not appear in child-facing copy; the words "fail," "failure," and "behind" never appear anywhere child-facing.
- **D2.** Session cap of 15 minutes for children, enforced with a warm wind-down, not a cliff. No mechanic may punish stopping or reward bingeing. Streaks forgive two missed days per week.
- **D3.** No leaderboards ranking children against other children. Competition is self-competition and mascot-competition only.
- **D4.** Every screen passes WCAG 2.2 AA. Dyslexia-aware typography (generous spacing, no justified text, cream never pure-white backgrounds), reduced-motion mode, and full audio alternatives are core features, not add-ons.
- **D5.** Narrative never taxes practice: story framing per activity is ≤30 seconds of reading, skippable, and never gates content.
- **D6.** Must run smoothly on a 5-year-old budget Android tablet. Performance budget is a release gate.

### Pedagogy laws
- **P1.** Every concept ships with all five modes: Watch it (≤90s), Walk it (faded worked example), See it (visual/manipulative), Hear it (audio), Try it (practice). No concept is "done" with fewer than five.
- **P2.** Spaced retrieval is the spine: every session opens with review of previously mastered material. Mastery gates progression; nothing advances on exposure alone.
- **P3.** Every distractor in every item maps to a tagged misconception. "Random wrong answers" fail review.
- **P4.** Mock exams render in deliberately plain, GL-faithful formatting — no theme, no mascot. The contrast is the pedagogy.
- **P5.** Adaptive difficulty targets the zone where the child succeeds roughly 70–85% of the time. Sustained scores outside that band trigger difficulty adjustment, not blame.

---

## 6. BRAND FOUNDATIONS

### Name
**ClueCrew.** Rationale: British-idiom adjacent ("clued up"), natively detective-world, promises a state of knowledge rather than an exam outcome (ASA-clean), no implied affiliation, spellable at a school gate, extends beyond the 11+.

### Logo direction (brief for designer; SVG concept supplied as placeholder)
- Wordmark: "ClueCrew" in a rounded, friendly, medium-weight sans. One word, capital C twice.
- Mark: a magnifying glass whose lens encircles the first "C"; handle in Amber angled down-right. The glass motif must survive at 24px favicon size.
- Feel: warm, storybook-modern, competent. Not corporate, not babyish, not tech-clinical.
- Deliverables from designer: full lockup, standalone mark, mono and reversed versions, favicon set.

### Colour tokens (canonical — use these names in code and CSS variables)
| Token | Hex | Use |
|---|---|---|
| `ink` | #1B2A4A | Primary text, brand, headers |
| `amber` | #F5A623 | Progress, achievement, CTAs, the "torchlight" |
| `cream` | #FAF6EF | Default background. Pure white is banned as a page background |
| `coral` | #E8836B | Try-again states only |
| `vr-teal` | #2A9D8F | VR district accent only |
| `nvr-violet` | #7B6FA8 | NVR district accent only |
| `maths-green` | #409020 | Maths district accent only |
| `english-rose` | #C76B7E | English district accent only |

District accents appear only inside their district and in navigation.

**Every token has one role.** A colour dark enough to reach 3:1 against `cream` can never also be light enough to carry `ink` at 4.5:1 — the two luminance windows do not overlap, for any hue. So `ink` is the only token permitted for text; `amber` and `coral` are fills with `ink` on top; the four district colours are accents (borders, rules, nav marks) and never fills carrying text.

**Contrast, required before merge:**
- text against its background — **4.5:1**, or **3:1** at 24px+ or 19px+ bold;
- any colour carrying meaning without text (borders, state fills, focus rings, progress) against what sits next to it — **3:1**.

**Colour is never the only carrier of meaning.** Anything a colour tells a child must also be told by a word, a shape, a position or an icon. Measured under the three common types of colour vision deficiency, the district accents crowd one another, so a colour-only district cue is invisible to roughly one boy in twelve. District names are load-bearing; district colours are decoration on top of them.

`pnpm audit:palette` checks all of the above against `packages/ui/src/tokens.ts` and runs in CI.

### Voice
- **Child-facing:** warm, direct, a little playful, never sarcastic, never babyish. Reading age ≤9 for instructions. Second person. Short sentences.
- **Parent-facing:** plain English, no eduspeak, no fear. Explains *what to do*, not just what happened. Assumes intelligence, never assumes UK-system knowledge.
- **Banned vocabulary (child-facing):** fail, failure, wrong, behind, weak, poor, careless, "should have."
- **Content ABOUT language takes different gate rules from content that USES language** (v1.8). Most of what we write is our voice talking to a child, and the gates police it: short sentences, plain vocabulary, no banned words. But some content has language as its SUBJECT — it teaches a word, quotes a writer, asks a child to proofread a sentence, or plants a misspelling to be found. There the thing the gate would strike out is the thing the content exists to carry, and striking it out does not protect a child; it deletes the lesson. Such content declares what it is, structurally, and the gate steps over exactly that and nothing else. **A new gate rule should ask which of the two it is before it is written.**
- **A quotation reproduces its source EXACTLY, including apparent errors** (v1.10). This is the second half of the principle above, and it exists because the first half would otherwise read as permission. We exempt quoted text from our gates *because the words are not ours*; the same fact forbids us from altering them. Quoting LESS is always allowed — a truncated quotation is still the passage's words — but changing a character never is. The reason is answerability, not reverence: the child is reading the passage while they answer, so a stem quoting something the passage does not say sends them hunting for words that are not there, and the item stops being a comprehension question at all.
- **Two tolerances, and nothing else** (v1.11). Sentence-initial capitalisation of a quoted word, and terminal punctuation on a truncated quote. Both are artefacts of setting someone else's clause into our sentence, not changes to what the passage says — the child scanning the line still finds the words, in the order the passage has them. Everything else stays a failure, including an attribution deleted from the middle of a quotation. **Preferred where it is available: recast the sentence so the quotation needs no adjusting at all.** A tolerance is permission to stop fighting the grammar, not an invitation to lean on it.
- **"Behind" is banned in its PROGRESS sense** (v1.7): D1 protects a child from being told they are lagging — "falling behind", "behind the class", "behind schedule", "behind where you should be". Spatial position is not that, and never was: "a puppy behind a stair gate" says nothing about a child. The scanner distinguishes the two. Word-card image prompts are scanned as a child-facing surface, because a prompt becomes an illustration a child sees.
- **A Word card may use its own headword** (v1.6): where the word being taught is itself on the ban list, that word may appear in the card's definition, sentence and image prompt. A card teaching "guarantee" must be able to say the word. This is a SCANNER RULE derived from the card, never a list of exceptions, and it is bounded to the headword, inside its own card, and only where the headword IS the banned term — every other banned word in that card still fails.
- **The ban list polices PRODUCT VOICE only** (v1.5): stems, options, hints, Walk scripts, UI, emails — everything we write. It does not reach text QUOTED from a curated passage, because a real literary extract contains these words and rewriting it would falsify the source and make our papers unlike the ones children actually sit. A quoted span claims the exemption structurally (`passageQuote: true` plus a `passageRef` that resolves to a real passage), never with a comment marker, and the exemption covers the quoted span alone — a stem discussing the quote is our voice and stays in scope.
- **Banned vocabulary (everywhere):** guarantee(d) [re outcomes], learning style, tutor-proof, "beat the exam."

---

## 7. THE WORLD (CANONICAL VOCABULARY — use these exact terms in code, content, and UI)

| Term | Meaning |
|---|---|
| **The Crew** | **The family: the child (or children) and their parent (or parents).** Not other users' children, ever — the crew is your own household. The child does the detective work; the parent is on the crew, not in the audience, and the weekly "one thing to try at home" is their share of it. Siblings on one subscription are crew-mates. |
| **Crew HQ** | Home screen / hub — the crew's room, not just the child's |
| **District** | One exam paper's world: VR, NVR, Maths, English |
| **Case** | A learning unit for one question type or concept |
| **Case File** | A child's progress record within a Case |
| **Rank** | Progression tier: Trainee → Junior Detective → Detective → Senior Detective → Chief Inspector |
| **Boss Case** | Mock exam (plain GL formatting) |
| **Word Card** | One collectible vocabulary item |
| **Word Vault** | The vocabulary collection + spaced-repetition system |
| **The Mascot** | Silent in v1; state-driven; species/name decided with designer, TBD at character design. Rig spec: separated vector layers, mouth rig-ready but unused, 8–12 states minimum: idle, curious, thinking, celebrating, encouraging (post-miss), sleeping (session end), pointing, proud |
| **Teach-Back** | The child corrects the mascot's authored mistake |
| **Prove It** | Comprehension mechanic: answer + highlight evidence |
| **Mode** | One of the five explanation formats (Watch/Walk/See/Hear/Try) |

Naming drift in code (e.g. "lesson" for Case, "level" for Rank) fails review.

**Crew-mates are never compared.** Because siblings are crew-mates, the crew
framing must always be collaborative and never comparative: no screen, email or
report may set one child's progress beside another's, sibling or otherwise. D3
already bans leaderboards; this states the sibling case explicitly, because
family-as-crew is exactly where that temptation appears.

---

## 8. PRODUCT PILLARS (WHAT V1 IS)

1. **VR District, complete:** all 21 GL VR types as Cases with native mechanics, five Modes each.
2. **Word Vault:** collectible spaced-repetition vocabulary, feeding VR and English.
3. **Daily Loop:** ≤15 min — retrieval warm-up, focus Case, one Boss-style question.
4. **Writing Room:** submit → screen → (human review if flagged) → constrained feedback: two specific strengths, one improvement, one model sentence. Asynchronous only; never a chat.
5. **Parent HQ:** region/school wizard at onboarding, weekly plain-language "what to do" email, live dashboard, the Parents' Casebook (the 11+-explained course).
6. **Three tiers:** 24-month (lowest monthly), 12-month (mid), Summer Intensive (premium). DMCC-standard flows.

**V1 explicitly excludes:** talking mascot, any conversational AI to children, social features, NVR/Maths/English districts (Phases follow), native apps (responsive web/PWA first).

## 9. BUILD SEQUENCE AND GATE RULE

Six phases per the agreed plan: (1) Foundation/data model → (2) Accounts/billing/onboarding → (3) Learning engine → (4) VR District → (5) Art/dashboard/accessibility → (6) Writing Room/mocks/hardening/launch. **No phase begins until the previous phase's gate checklist (in its spec) passes human inspection.** Content authoring runs parallel from Phase 2.

## 10. AMENDMENT

This manifesto changes only by explicit decision of David, recorded in a changelog at the foot of this file. Claude Code may propose amendments; it may never silently deviate. If an instruction in any session conflicts with this document, Code must surface the conflict rather than resolve it unilaterally.

---
*Changelog:*

*v1.0 — initial constitution.*

*v1.1 (2026-07-29) — §7: defined **The Crew** as the family — the child or
children and their parent or parents — after David observed that the product
named a crew and showed none. Decided by David in session; transcribed here by
Claude Code. Chosen partly because it is the only reading compatible with S2:
the crew is your own household, so it needs no social features. Adds the
explicit no-comparison rule for crew-mates, since siblings being crew-mates is
where the temptation to rank children against each other would arise.*

*v1.2 (2026-07-30) — §6: replaced the contrast rule and amended `maths-green`
from #5B9A68 to #409020. Proposed by Claude Code with measurements, accepted by
David in session.*

*The old rule read "All text/background pairs must pass AA". It was not true and
could not be: seven of the eight tokens fail as body text on `cream`, `amber`
worst at 1.88:1. A rule nobody can satisfy is a rule reviewers learn to skip.
The replacement separates the two jobs a colour can do, and records why a token
can only ever do one of them — for any hue, the luminance window for 3:1
against `cream` and the window for carrying `ink` at 4.5:1 do not overlap.*

*The green moved because `maths-green` sat ΔE 22.1 from `vr-teal` — close
enough to read as the same colour — and collapsed to ΔE 8.5 from `nvr-violet`
under tritanopia. It is now 51.6 and 23.5. The value is DARKER than the
"warmer, lighter" the proposal suggested: lighter fights the 3:1 accent floor,
and the darker candidate measured better on both separation and legibility
while staying inside the range the other three accents already occupy. The
deviation was put to David and ratified — "the darker green is fine, keep it" —
so #409020 is the decided value, not a liberty taken. Done now because the
Maths district is unbuilt, so the change costs nothing today and would only get
more expensive.*

*The "colour is never the only carrier of meaning" rule is the part that
actually protects children: roughly one boy in twelve has some red-green
colour vision deficiency, and none of them will report that the districts look
alike.*

*v1.3 (2026-08-01) — Amendment 1 (Pricing V2) recorded as ratified by David:
supersedes §8 pillar 6 and Phase 2 §1 pricing with the Crew / Full Crew /
Crew Plus / Crew Bursary / Summer Intensive ladder, and adds design law D7
(the child never sees a paywall, price, upsell or any signal that money
exists). Full text: docs/AMENDMENT-1-PRICING-V2.md. Recorded on receipt of the
ratified document; the §5 build migration has NOT yet been implemented and
awaits David's build instruction.*

*v1.11 (2026-08-02) — the verbatim tolerances, ratified by David,
transcription Claude Code's. §6.*

*v1.10 said a quotation reproduces its source exactly. Applied without
tolerance that is stricter than any publisher: a quoted clause lifted to the
head of our sentence has to take a capital, and a quotation truncated
mid-sentence has to close somehow. Both are typesetting, not alteration, and a
gate that fired on them would push authors to paraphrase — which is worse for
the child, because a paraphrase is OUR wording and is not on the page they are
searching.*

*Exactly two, named: sentence-initial capitalisation of a quoted word, and
terminal punctuation on a truncated quote. The boundary is what the tolerance
does NOT reach: `ENG-002-pp-19` deleted `," cried Bingley, "` from the middle
of a quotation, and an interior deletion is not terminal punctuation under any
reading. The five corrections of v1.10 stand; the gate simply stops flagging
the two cases that were never faults.*

*Recorded with the ruling because it is the part that will be forgotten:
RECASTING IS PREFERRED. `ENG-001-WIW-10` rewrites its own sentence so the
quotation sits mid-clause and needs no adjusting at all. Where that is
available it is the better answer, and a tolerance should not become the
default route.*

*v1.10 (2026-08-02) — TWO RULINGS, ratified by David, transcription Claude
Code's.*

*(a) VERBATIM QUOTATION. A stem or walk script quoting a passage reproduces it
exactly, including anything that looks like an error in the source. Recorded
as precedent ALONGSIDE the ABOUT-language principle (v1.8), because it is the
same principle read the other way: v1.8 exempts quoted text from our gates on
the ground that the words are not ours, and that ground equally forbids us to
change them. A carve-out that licensed alteration of the thing it exempted
would not be a carve-out.*

*What it cost to find: `ENG-001-WIW-18` quoted Grahame's "Oh, its all very well
to talk" as "it's" — a silent modernisation, kindly meant. The passage was
verbatim and correct; the ITEM was wrong. A child scanning for "it's" would
never have found it, so the item was unanswerable for the most careful readers
and easy for the ones who guessed. Three Austen items had closed a quotation
with a full stop where Austen has a comma, turning a clause into a sentence;
`ENG-002-pp-19` had deleted `," cried Bingley, "` from the middle of a
quotation and presented the join as one continuous cry. None of the five was
visible to a reader who did not have the passage open beside them, which is
why the rule is machine-enforced (`pnpm check:line-refs`) and not a style
note. Truncation is explicitly permitted, and is how all five were fixed.*

*(b) THE PASSAGE DIRECTORY IS EXEMPT AT FILE SCOPE. `content/passages/` holds
nothing but text we did not write and may not alter: fifteen public-domain
extracts verified verbatim against Project Gutenberg, six commissioned
originals, two cloze vehicles. The v1.5 carve-out applies to the FILE rather
than to spans declared inside it, because there is no unquoted wording in that
directory for a scanner to protect — a `preamble` aside, and those are ours
and stay in scope by living on the item, not the passage.*

*This SUPERSEDES, for passage files only, v1.5's "deliberately NOT carved out:
the everywhere-rules still apply to quoted text". That sentence was written
about a span inside an item we authored, where the risk is an author
laundering their own claim through a quotation. A whole file of Kipling and
Jerome K. Jerome carries no such risk: the L1 outcome-claim pattern duly fired
on "would pass him up the hammer", and a novel published in 1889 cannot make a
promise on our behalf. v1.5 stands unchanged everywhere else — a declared span
inside an item still gets the everywhere-rules in full.*

*The honesty condition is the same as v1.5's and is what makes file scope
safe: a passage file cannot be authored casually. It carries its provenance,
its copyright verdict, its editorial cuts and its similarity check, and the
verbatim audit re-derives it from the source. Nobody can put a sentence of
their own into that directory to escape a scanner without first passing all of
that.*

*v1.9 (2026-08-02) — a quotation sits outside the sentence cap, ratified by
David. Extends precedent 2 of the ABOUT-language principle: a declared quoted
span is now exempt from the 16-word cap as well as the ban list. Our wording
around the quotation is still counted and still capped, so the exemption
cannot be widened by quoting loosely. Rationale in David's words: the child
must read the passage's words to answer, and the carve-out exists so
quotations are not butchered.*

*Extended the same day to the VOCABULARY ceiling, which had been flagged here
as the obvious next case. David's rationale: comprehension passages are
pre-1950 literature BY DESIGN, so quoted archaic vocabulary is the content
under test, not a fairness failure. A declared span is now outside all three
gates — ban list, sentence cap, vocabulary ceiling — and our own wording
around it stays fully in scope on every one.*

*The carve-out is now complete for quotation, and the bound that keeps it
honest is unchanged: only a DECLARED span, only inside its own item, and the
declaration must resolve to text that is actually there.*

*v1.8 (2026-08-02) — the ABOUT-language principle, ratified by David. §6.
Decision David's, transcription Claude Code's.*

*Written because the same argument had now been had four times in one day,
each time from scratch, each time discovered by a gate failing on correct
work. The principle names the pattern so the fifth case is anticipated
instead. The four precedents, in the order they arose:*

*1. **Word cards** (v1.5 era, spec correction). A card's example sentence
exists to DISAMBIGUATE a meaning, so it takes reading age ≤9 but no sentence
cap — a long sentence is often the correct one. 164 of 183 cards had been
failing on the thing that made them work.*

*2. **Quoted passages** (v1.5, completed 2026-08-02). A curated extract
carries words our ban list refuses and vocabulary our ceiling refuses,
because real pre-1950 prose does both. A declared span is exempt from all
three gates — ban list, sentence cap, vocabulary ceiling — and our wording
around it stays fully in scope on every one. Extended to inline quotation
inside a stem, declared on the stem and bounded to the quoted characters.
This precedent took three rulings to reach its final shape, each one arriving
when a gate failed on correct work; the ABOUT-language principle exists so the
next one does not need three.*

*3. **Proofread stems** (2026-08-02, spec correction). An error-spotting or
cloze stem IS the sentence to be corrected. Reading age ≤9, no sentence cap.
Keyed on the question type's mechanic, so a future spotting type is covered
the day it is registered.*

*4. **Tested spellings and words** (2026-08-02). An item that plants
`dictionery` for a child to find, or asks what `fastidious` means, was being
marked down for containing its own question. Declared tokens are exempt from
the VOCABULARY CEILING only, inside their own item only.*

*Every one of the four is bounded the same way, and the shape is the rule:
the content DECLARES its exemption structurally rather than claiming it in a
comment; the exemption covers the declared span or token and nothing else;
it lifts one named gate rather than all of them; and a declaration that does
not resolve is reported rather than trusted. An exemption that cannot be
checked is not an exemption, it is a hole.*

*What this does NOT license: turning a gate off because it is inconvenient.
Three of the four precedents began as a gate correctly catching bad content
elsewhere. The question is never "is this rule annoying" but "is this
content about language, or is it language".*

*v1.7 (2026-08-02) — the "behind" narrowing and image-prompt scanning,
ratified by David. §5 D1 lists "behind" among the words that never appear
child-facing; the scanner had implemented that as a bare word match.*

*The evidence for narrowing: of 23 real occurrences of "behind" across the
Word Vault, 23 were SPATIAL — a puppy behind a stair gate, seagulls behind a
ferry, bins behind a chip shop. Zero were about a child lagging. A rule with a
100% false-positive rate does not protect anyone; it teaches authors that the
scanner is noise. D1's intent is that a child is never told they are behind
their peers, so the pattern now catches the progress constructions — a verb of
slipping plus behind, behind a yardstick (schedule, target, the class, the
expected level), behind IN a subject, behind where you should be, and a person
simply being behind — and leaves position alone. Validated against every real
occurrence plus nineteen progress phrasings, all tested.*

*Image prompts became a scanned surface in the same change: the prompt turns
into an illustration a child sees, so what it depicts obeys the child-facing
vocabulary rules. The reading-age caps deliberately do NOT apply — no child
reads a brief to an illustrator, so measuring its sentence length would score
a document nobody sees. After the narrowing, zero image prompts fail.*

*v1.6 (2026-08-02) — the `headwordInOwnCard` rule, ratified by David. §6: a
Word card may use its own headword in its definition, sentence and image
prompt even when that headword is on the ban list. Decision David's,
transcription Claude Code's.*

*Why: the card teaching "guarantee" was caught by L1's outcome-claim rule on
its own example sentence — "the shop guarantees the bike for two years". That
is vocabulary, not a claim about ClueCrew, and it cannot be reworded without
deleting the word being taught. The same shape as the passage-quote problem:
a rule written for our voice catching text that is not our voice.*

*Recorded as a scanner RULE, not a per-card exception, so nothing is listed
anywhere and it applies to any future card teaching a ban-list word. Three
bounds, each tested: the headword only (a "guarantee" card that also says
"clever" still fails on "clever"); inside its own card only (another card
using the word still fails); and only where the headword IS the banned term
(a card teaching "brave" gets no exemption, so "wrong" in its sentence still
fails). The exemption is per RULE — it lifts exactly the rule the headword
trips and leaves every other rule in force. Inflections are covered, bounded
to a shared prefix within three characters, because the motivating case is
itself an inflection ("guarantees").*

*Residual risk, stated: a card teaching a ban-list word cannot be caught by
that word's own rule anywhere in the card. That is inherent to the ruling and
bounded by the card being about the word; the reviewer remains the reader of
last resort.*

*v1.5 (2026-08-02) — the passage-quote carve-out, ratified by David. §6:
the banned-vocabulary scan applies to PRODUCT VOICE only and does not reach
quoted passage text. Decision David's, transcription Claude Code's.*

*Why it was needed: the English district curates public-domain pre-1950
extracts, and those extracts contain "wrong", "failed", "poor" and worse.
Without a carve-out the scanner would have blocked the passage bank at the
door — the curated source could never have been authored in the first place,
which would have made the whole Stream A plan unbuildable.*

*How the exemption is kept honest, because a carve-out in a ban list is
exactly where drift enters: the claim is structural, not a comment marker
(`passageQuote: true` + `passageRef`), and the `passageRef` must resolve to a
real passage in the bank. An author therefore cannot launder their own
sentence through the exemption without first putting that sentence into a
curated, reviewed passage. A claim that does not resolve is REPORTED and its
text stays fully in scope: a broken exemption must never read as a passing
one. The exemption covers the quoted span, not the line it sits on, so a stem
and the quote it discusses can share a line and only the quote is exempt.*

*Deliberately NOT carved out: the everywhere-rules (L1 outcome claims, L2
learning styles, L6 third-party marks) still apply to quoted text — a source
that says "guaranteed" is still a claim when we reprint it. And a passage
file's `preamble` is our own scene-setting sentence, so it stays in scope
while the passage's `lines` do not.*

*v1.4 (2026-08-01) — D7 clarification, ratified by David: bare currency
(£) is permitted ONLY inside item content — stem, options, explanation —
of money-strand-tagged items, because the Maths district teaches money
and a pound sign in arithmetic is curriculum, not commerce. Commerce
shapes remain banned in ALL child scope including item content: any
£N.NN joined to plan/month/upgrade/unlock/subscribe vocabulary, and
every tier name. The scanner and the CMS import gate both enforce the
split. Decision David's, transcription Claude Code's.*
