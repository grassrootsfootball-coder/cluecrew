# BUILD-PHASE-5: PAINTING AND DECORATING
### ClueCrew Build Bible — Phase 5 of 6 — v1.0
**Prerequisites: manifesto + passed Phase 1–4 gates, including child-testing findings triaged. Phase 5 makes the working product beautiful, makes Parent HQ live, and certifies accessibility. No new learning mechanics; if one is proposed, it goes to backlog.**

---

## 1. MASCOT PRODUCTION (the phase's flagship spend)

- **Commission a character designer + Rive animator** (may be one person or two; portfolio must show children's character work AND shipped Rive state machines). Budget guidance: this is the art budget's anchor; economise elsewhere, not here.
- Brief contents: manifesto §6–7 (voice, world, palette), the brand board (mark DNA — the mascot should feel family with the C-lens and spark), the state list (`idle, curious, thinking, celebrating, encouraging, sleeping, pointing, proud`), direction notes from Phase 4 (`encouraging` ≠ `celebrating` but equally warm), and the child-testing observations (what kids called the placeholder, where they smiled).
- **Rig requirements (contractual):** separated vector layers; mouth built rig-ready but unused (v2 speech, ratified decision); state machine matching our `mascotController` input names exactly; total .riv ≤ 250KB; tested on the budget-tablet profile.
- **Species/name selection:** designer proposes 3 candidates as idle+celebrating sketches → tested with ≥6 children from the Phase 4 testing pool (which would you want to help? what would you call it?) → David decides with that data. Name must pass the same trademark sanity check as the brand (30-minute IPO search, no famous-character adjacency).
- Delivery: production rig + a style sheet licensing us all poses for print/marketing. IP assignment in the contract, full stop.

## 2. ART DIRECTION AND ILLUSTRATION PIPELINE

- One-page style guide from the designer (linework, texture, lighting rules on the ink/amber/cream world) — every subsequent asset conforms.
- Asset list: Crew HQ scene, VR District map + 21 case location vignettes, case-open panels (21), Word Card images (300, from a reusable object library), locked-district doors (3), stamp/ceremony set, empty-state and error illustrations (errors are in-world: "the trail's gone cold — let's try again", never technical).
- **AI-assistance policy (recorded as law): AI image generation is permitted for exploration, mood, and drafting of background/object assets ONLY where a human illustrator finishes, owns, and signs off the final file. The mascot and any character art are human-made end to end. No raw AI output ships child-facing. Provenance per asset recorded in the asset manifest** (mirrors the item-bank provenance stance; same defensibility logic).
- Format: SVG where feasible, compressed raster otherwise; per-screen image weight budget enforced in CI.

## 3. SOUND

Small authored set (commissioned or licensed, no generative audio): 8–12 cues — warm-up begin, correct (3 gentle variants to avoid fatigue), not-yet (soft, unmistakably non-punitive), case cracked, word collected, rank up, wind-down. Mixed quiet; global mute one tap from anywhere; sound never carries sole meaning (accessibility). Parent setting: default-off option.

## 4. PARENT HQ GOES LIVE

Dashboard principle (from research): **tell parents what to DO, not just what happened.** Widgets:
- **This week:** sessions done vs the gentle target (5), streak status, minutes — framed as rhythm, never league table.
- **What's clicking / what's tricky:** top 2 strongest and 2 developing question types in plain English ("Hidden words: cracked it" / "Letter codes: still warming up") with ONE suggested support action each, drawn from an authored action library ("Play the alphabet game in the car: pick a letter, jump 3 forward…"). Never raw percentages as the headline; percentages available behind a tap for parents who want them.
- **Words this week:** the child's newly collected words as cards — designed to prompt a real-world conversation ("ask them what 'transport' has in common with 'portable'").
- **Exam runway:** months to exam, current programme position, next milestone. Calm typography; no countdown-clock urgency styling (anxiety law applies to parents too).
- **Do-nothing safety:** a parent who never opens the dashboard must miss nothing critical — anything requiring action also goes to email.

**Weekly email (the product for busy parents):** subject line = one concrete win ("Amara cracked Letter Codes this week"); body = 3 blocks max: the win, the one thing to try at home, the runway line. Reading time under 60 seconds. Send Sunday 17:00 local. One-tap unsubscribe from weekly emails without touching transactional email.

## 5. THE PARENTS' CASEBOOK (differentiator; content authored this phase)

Ten short chapters (each ≤5 min read + 2-min video option later), written for a parent who did not grow up in the UK system, in manifesto parent-voice:
1. What the 11+ actually is (and isn't) · 2. Your region decoded (dynamic: renders their Region Registry entry) · 3. How scoring and standardisation work · 4. The four papers, plainly · 5. The two-year/one-year rhythm — how much is enough · 6. Supporting without pressuring (the evidence on anxiety) · 7. Reading: the biggest lever (+ the reading list) · 8. Mock exams and what results mean · 9. The other doors: what happens if it's a no (written with total respect — this chapter is why parents trust us) · 10. Admissions logistics: dates, forms, appeals signposting (signpost only; we are not advisers).
Chapter 9 and 6 are reviewed by David personally before publish — they carry the mission.

## 6. MARKETING SITE

`/(marketing)`: home (brand, the promise, how it works in 3 steps, pricing with TCV transparency, bursary front-and-centre as access), pricing page, bursary page, Casebook sample chapter free (lead magnet), privacy/safeguarding page in plain English (our S-laws as public commitments — trust asset), FAQ. All claims pass L1/L2 review — process line, never outcome promises. SEO basics: region landing pages generated from the Region Registry ("Preparing for the Kent Test" etc.), each carrying the verify-with-school caveat.

## 7. ACCESSIBILITY CERTIFICATION (WCAG 2.2 AA)

Formal pass over every route: automated (axe in CI, zero criticals) + manual audit checklist (focus order, target sizes incl. 2.2's dragging-alternative and focus-appearance criteria, contrast on all district accents, reflow at 400%, motion-reduction) + one assistive-tech session (screen reader + switch-style keyboard-only) on the full child loop and parent signup. Findings fixed or formally waived with reason in `/docs/a11y-audit.md`. Public accessibility statement page.

## 8. PERFORMANCE AND POLISH HARDENING

Re-run the Phase 4 budget with final art (this is where budgets die — hold the line: if an asset busts the budget, the asset changes, not the budget). Loading states themed (magnifying-glass shimmer), all transitions ≤300ms, copy pass across every string against manifesto voice by one human in one sitting (consistency requires one brain), empty states for brand-new children designed as invitations.

## 9. NON-GOALS

Writing Room, mocks, launch ops (all Phase 6). New mechanics, new districts, talking mascot, native wrappers, A/B framework. Casebook video versions (text ships now, video backlog).

## 10. GATE CHECKLIST

1. Final rig in production: all 8 states, ≤250KB, budget-tablet smooth; art-swap required zero engine changes (the Phase 4 promise held).
2. Mascot selection evidence on file: 3 candidates, ≥6 children's reactions, David's decision note; name passed IPO sanity search.
3. Asset manifest complete with provenance; spot-audit 10 assets; zero raw-AI child-facing files.
4. Parent dashboard reviewed by 3 real parents (≥1 first-generation/non-UK-schooled): can each say, unprompted, what they'd do this week to help? Adjust until yes.
5. Weekly email renders with real staging data; reading time <60s; sends on schedule from time-mocked clock.
6. Casebook: all 10 chapters live; David has personally approved ch. 6 and 9; region chapter renders correctly for 3 test regions.
7. Marketing site claim audit against L1/L2 by checklist; pricing page shows TCV; bursary page framed as access (external read by someone who'll tell us the truth).
8. WCAG: axe zero-critical in CI; manual audit doc complete; AT session findings closed; statement page live.
9. Performance budgets green with final art on the throttled profile; bundle report reviewed.
10. Full-product copy pass completed by one person; banned-vocab scan green.
11. DPIA updated: email analytics (opens off by default), illustration contractor data handling, marketing-site analytics (Plausible only, no child routes).

---
*Changelog: v1.0 — initial Phase 5 spec.*
