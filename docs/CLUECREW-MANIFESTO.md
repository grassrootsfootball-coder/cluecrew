# THE CLUECREW MANIFESTO
### Constitution and Anti-Drift Document — v1.0
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
| `maths-green` | #5B9A68 | Maths district accent only |
| `english-rose` | #C76B7E | English district accent only |

District accents appear only inside their district and in navigation. All text/background pairs must pass AA; check before merge.

### Voice
- **Child-facing:** warm, direct, a little playful, never sarcastic, never babyish. Reading age ≤9 for instructions. Second person. Short sentences.
- **Parent-facing:** plain English, no eduspeak, no fear. Explains *what to do*, not just what happened. Assumes intelligence, never assumes UK-system knowledge.
- **Banned vocabulary (child-facing):** fail, failure, wrong, behind, weak, poor, careless, "should have."
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
