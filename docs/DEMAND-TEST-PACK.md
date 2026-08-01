# CLUECREW DEMAND-TEST PACK
### Everything the landing page needs to actually exist — v1.0
**Prerequisite, non-negotiable: the IPO search comes back clear before this goes public. All copy below is L1/L2-clean by construction; the banned-claims scan runs on this file too.**

---

## 1. WHAT THIS TEST IS
One page, one question: will parents in real 11+ Facebook groups give an email for this promise at these prices? Not a brand launch, not the Phase 5 marketing site — a smoke test wearing the brand. Product screenshots are deliberately absent (greybox would undersell); the page sells on the promise, the price, and the bursary.

## 2. PAGE STRUCTURE AND FULL COPY

**[Hero — ink on cream, logo top-left]**
# The 11+ finally makes sense.
Every question type, explained the way that clicks for *your* child — in 15 calm minutes a day. Built for every family, priced like it means it.
**[Waitlist box]** Join the Founding Crew waitlist → [email] [Join]
*Founding families get our best-ever rate, locked for their whole programme.*

**[Three-beat "how it works" — icons, no screenshots]**
**Crack cases, don't do drills.** Verbal reasoning becomes codebreaking. Maths problems become jobs in the Workshop. Same exam skills, completely different feeling.
**Every concept, multiple ways.** Watch it, walk through it, see it, hear it, or just try it — your child chooses how it clicks. When one way doesn't land, another one will.
**Calm by design.** Fifteen minutes a day, capped. No red pen, no leaderboards, no pressure mechanics. Mocks unlock only when your child is genuinely ready for them.

**[The honest line — its own section, small]**
We won't promise you a pass. Nobody honestly can. We promise the clearest teaching we know how to build, real exam-format practice, and a straight answer about how it's going.

**[Pricing — table, TCV shown, per the DMCC standard]**
**Crew — Free, forever.** A real taste: ten full cases, daily word collecting, weekly exam-style questions. No card, no catch, no ads — ever.
**Full Crew — from £8.49/month.** Everything: all subjects as they launch, the full programme paced to your child's year, mock papers, the parent guide. (£8.49/mo on 24 months, total £203.76 · £9.99/mo on 12 months, total £119.88 · £12.99 rolling, cancel in two clicks.)
**Crew Plus — £24.99/month.** Everything, plus a monthly video from a qualified teacher reviewing your child's progress — what's working, what to focus on, what to try at home.
**Crew Bursary — Free.** Full Crew, free, for families on free school meals. One bursary place opens for every ten paid ones. Same product, exactly.

**[For parents who didn't grow up with the 11+ — one short block]**
New to all this? So are half the families we're building for. ClueCrew explains the whole system in plain language — which test your region uses, how scoring works, how much practice is enough, and how to support without pressuring.

**[FAQ — five only]**
*Which exam boards?* GL-style formats first (most grammar regions), with more to follow. Always confirm your target school's format for your entry year — schools do change providers.
*When does it launch?* Founding Crew families get access first, at the founding rate, before general release.
*What ages?* Built for Years 3–6, paced to your child's year and exam date.
*Is it just AI-generated questions?* Every question is reviewed and signed off by a qualified KS2 teacher before any child sees it, and every wrong answer is designed to catch a real misconception — that's where the teaching lives.
*What about screen time?* Fifteen minutes daily, hard-capped. We think that's a feature.

**[Footer]** Privacy notice · Contact · © ClueCrew *(trademark application pending)*

## 3. WAITLIST PLUMBING (personal data, done properly)
- Fields: email (required) · region dropdown (optional, from the Region Registry list + "not sure") · child's school year from this September (optional — Addendum D wording).
- Consent line under the button, unticked-box-free by design: "We'll email you about ClueCrew's launch and nothing else. Unsubscribe anytime." Link to a one-page plain-English privacy notice (what we store, why, retention: deleted 12 months post-launch if unconverted, UK/EU hosting, no third-party trackers).
- Provider: the existing transactional email provider's audience feature; no marketing platform pixels. Plausible only for analytics.
- Double-opt-in confirmation email (protects deliverability and proves consent).

## 4. MEASUREMENT AND THE DECISION RULE (so £50 buys a decision)
- Plausible goals: `waitlist_signup`, `pricing_viewed`. UTM per source: `?src=fb-kent`, `?src=fb-bucks`, plus `org-` variants for unpaid group posts.
- **Thresholds, set before launch so we can't rationalise after:**
  - Visitor→signup **≥10%** = strong demand, proceed at pace.
  - **4–10%** = real but soft; iterate the copy/pricing emphasis once, retest before concluding.
  - **<4%** = stop and talk — positioning conversation before any further spend.
  - Also read: region mix (does it match where we can serve?), year-group mix (are these Year 4s with runway or Year 6s we can't help yet?).
- Test runs 14 days or 500 visitors, whichever first. One variable only if iterating (headline OR pricing emphasis, never both).

## 5. AD/POST CREATIVE (parent-targeted, adult audiences, L1-clean)
**Boosted post A (the gap):** "11+ prep is either £8 workbooks your child ignores or £50+/month platforms. We're building the thing in between: genuinely fun, teacher-reviewed, £8.49–12.99 a month — and free for families on free school meals. Founding families get the best rate we'll ever offer. [link]"
**Boosted post B (the philosophy):** "We're building an 11+ platform with a 15-minute daily cap, no red pen, and mock exams that only unlock when your child's actually ready. If that sounds like your kind of calm, the Founding Crew waitlist is open. [link]"
**Organic group post (where allowed; read each group's promo rules first):** honest founder voice — "I'm a parent building an 11+ platform because everything felt like either boring books or £600/year. Free tier, bursary places for FSM families, teacher-reviewed questions. Would genuinely value this group's brutal feedback on the idea: [link]" *(The ask-for-feedback frame both respects group norms and generates qualitative signal the metrics can't.)*
Groups: one Kent, one Bucks/Berks to start (largest, most active). £25 boost each.

## 6. CODE PROMPT
```
Read /docs/CLUECREW-MANIFESTO.md, Addendum A, Amendment 1, and
/docs/DEMAND-TEST-PACK.md. Build the single-page demand-test site
exactly to §2 copy (verbatim — it is scanned content), §3 plumbing,
§4 analytics. Brand tokens from /packages/ui. No product screenshots,
no countdowns, no popups. Deploy behind a staging URL for David's
review before public DNS. Report: page live, goals firing, double
opt-in round-trip tested, privacy notice linked.
```

## 7. WHAT WOULD MAKE THIS TEST LIE TO YOU (read before judging results)
Posting only in groups that skew affluent (bursary line won't land; conversion reads high but wrong) · running it in late August (panic-adjacent Year 6 parents inflate urgency signups we can't serve until next cohort) · iterating copy AND price together (uninterpretable) · counting organic-post sympathy signups from people you know. The test is only as honest as its audience.
