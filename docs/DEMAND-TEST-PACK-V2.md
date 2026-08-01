# CLUECREW DEMAND-TEST PACK — v2.0
### Supersedes v1. The architecture change: experience before email.
**Design principles this version is built on (researched, recorded): Duolingo — deliver value before asking for anything, one dominant CTA, mascot-warm minimalism. Atom — the lead magnet is a genuinely useful experience, specificity to the parent's target sells. What we deliberately refuse to copy from Atom: pass-likelihood predictions, comparison-to-other-applicants, and fear-first copy ("school isn't enough"). Our demo shows teaching; theirs shows prediction. That contrast IS the positioning.**

---

## 1. PAGE ARCHITECTURE (order is the argument)

**[Hero]**
# The 11+ finally makes sense.
Every question type, taught the way that clicks for *your* child — 15 calm minutes a day, at a price built for every family.
**[Primary CTA, amber: "Try a question — takes 20 seconds"]** → scrolls to demo
[Secondary, quiet: "Join the Founding Crew waitlist"]
*Visual: ink-on-cream, the C-lens mark large, district-colour accents. No screenshots, no stock photos.*

**[Section 1 — THE DEMO: three playable questions]**
Header: **"Here's what it feels like."**
Three real items, one at a time, fully interactive with the product's actual answer experience:
1. VR letter-code (CODEBREAKER — the signature)
2. VR hidden word (STOWAWAY — the moreish one)
3. Maths word problem (WORKSHOP — the one parents fear)
Behaviour: tap an option → correct = amber spark + method-praise line · wrong = coral "Not yet" + the item's real misconception hint + "Have another go". No score, no timer, exactly the product's rules.
Close beat, after Q3: **"That hint you just got when you slipped? Every wrong answer in ClueCrew is written to catch a real misconception and teach through it. A teacher signs off every question before any child sees it. That's the whole idea."**
→ [Waitlist box #1: "Get your child early access — join the Founding Crew"]
*Build note: these three items are the shop window — hand-polished, reviewer-approved before public DNS (they join the reviewer's first sitting). Static widget is fine; it does NOT need the app's engines, just faithful behaviour and Addendum A voice.*

**[Section 2 — THE REGION DECODER]**
Header: **"Every region runs the 11+ differently. Here's yours."**
Dropdown of the 10 seeded regions + "somewhere else / not sure" → instant card: which test provider style, which subjects, when it's sat, one thing most parents don't know. Card footer: the mandatory caveat — "Schools change providers — always confirm with the school for your entry year."
→ **"Email me my region's one-page guide"** [email field — Waitlist capture #2, tagged by region]
"Not sure" path: the national overview one-pager. *(This is the Atom baseline-test mechanic with the prediction removed and honesty installed: the parent gets real value in 10 seconds, and the email exchange has a reason.)*

**[Section 3 — HOW IT WORKS, three visual cards in district colours]**
**Crack cases, don't do drills** (vr-teal) — VR becomes codebreaking; maths problems become jobs in the Workshop. Same exam skills, different feeling entirely.
**Every concept, multiple ways** (nvr-violet) — watch it, walk it, see it, hear it, or just try it. Your child picks how it clicks.
**Calm by design** (maths-green) — 15 minutes daily, capped. No red pen, no leaderboards. Mocks unlock only when your child is ready for them — never before.

**[Section 4 — THE CREDIBILITY CLUSTER (pre-launch honesty as proof)]**
**The honest line, kept, promoted:** "We won't promise you a pass. Nobody honestly can. We promise the clearest teaching we know how to build, real exam practice, and a straight answer about how it's going."
**Provenance:** "Every question is written to a misconception map and signed off by a qualified KS2 teacher before it goes live. Ask us anything about how it's built — the answer is never 'trade secret'."
**Founder note, 3 sentences, first person:** why David is building this — the gap between £8 workbooks and £600/year platforms, and the families the market ignores.
**The bursary, boxed:** "Full access, free, for families on free school meals. One bursary place opens for every ten paid ones. Same product, exactly."

**[Section 5 — PRICING]** (v1 table unchanged: Crew free / Full Crew £8.49–12.99 with TCV / Plus £24.99 / Bursary / founding-rate line)

**[Section 6 — FAQ]** (v1's five, plus one:) *"Is this like Atom?"* — "Different philosophy. We don't predict your child's chances or compare them to other applicants — we teach, calmly, and show you honestly how it's going. Also: a quarter of the price, and free if you're on free school meals."

**[Sticky bar after first scroll]:** logo · "Founding Crew waitlist" · [Join] — Duolingo's follow-the-scroll pattern.

## 2. WAITLIST PLUMBING — unchanged from v1 §3, plus:
Capture source recorded per box (demo-end vs region-decoder vs sticky) — these are different buyer temperatures and the mix is itself a finding. Region auto-fills from the Decoder when that path is used.

## 3. MEASUREMENT v2
Goals: `demo_started`, `demo_q_answered` (with correct/incorrect prop — are parents experiencing the "Not yet" beat? that's the money moment), `demo_completed`, `region_decoded`, `waitlist_signup` (with source), `pricing_viewed`.
**Decision rule updated:** primary metric stays visitor→signup with the same thresholds (≥10% strong · 4–10% iterate once · <4% stop and talk). New secondary reads: demo start rate (are they playing at all?), demo→signup rate (does experiencing it convert?), decoder→signup rate. If overall conversion is soft but demo→signup is strong, the problem is traffic quality, not product appeal — different fix, and now we can tell the difference.
14 days or 500 visitors, one variable per iteration, all v1 §7 honesty rules stand.

## 4. AD CREATIVE v2 (posts now point at the experience, not the concept)
**Post A:** "Can you crack an 11+ letter code? Most parents can't first try — and the hint you get when you slip is the whole point of what we're building. 20 seconds, no signup: [link]" *(curiosity + the demo does the selling)*
**Post B (the gap, kept from v1):** workbooks-vs-£50-platforms framing, unchanged.
**Organic (feedback frame, kept):** founder voice + "try the 20-second demo and tell me honestly what you think."

## 5. BUILD NOTES FOR CODE
Demo widget: self-contained component, three items inlined as content (marked `demo: true`, excluded from all pools), Addendum A voice strings, coral/amber tokens, no timers, keyboard + screen-reader operable, works flawlessly at 375px width — **the entire test audience is mobile**. Region Decoder reads the seeded Region Registry via a public read-only endpoint (10 regions + fallback). One-pagers: generated as branded PDFs from Registry data (or a clean HTML page if PDF is friction — Code's call, flag which). Sticky bar appears after 60% of hero scrolled. Everything else per v1 §6 prompt, updated to this file.

## 6. WHAT DIDN'T CHANGE AND WHY
The honest line stays (now with a bigger job). Pricing display stays (DMCC). No countdowns, no popups, no exit-intent, no fake scarcity — founding-rate is real scarcity, stated once. The banned-claims scan covers this file; the demo's three items are scanned content too.
