# AMENDMENT 1: PRICING V2
### ClueCrew Build Bible — Formal Amendment — v1.0
**Supersedes Phase 2 §1 (ratified pricing) and manifesto §8 pillar 6. Recorded in the manifesto changelog per §10. All DMCC flows (Phase 2 §2), the early-exit formula, and L5 stand unchanged in principle and apply to the new structure. Ratified by David.**

---

## 1. THE NEW LADDER

| Tier | Price | Terms | What it is |
|---|---|---|---|
| **Crew** (free) | £0 | Forever; no card, ever | The genuine front door: first 2 Cases of each VR engine family (10 Cases, all five Modes — pedagogy is never crippled), Word Vault daily drip (3 cards/day), 1 Boss Round/week, full mascot/voice/juice, region wizard, Casebook ch. 1, light monthly parent email |
| **Full Crew** | £8.49/mo (24-mo, TCV £203.76) · £9.99/mo (12-mo, TCV £119.88) · £12.99 rolling | Monthly billing; commitment ladder; early-exit formula at checkout | Everything: all districts as they ship, full readiness ladder + mocks, full Parent HQ + weekly email, full Casebook, Writing Room |
| **Crew Plus** | £24.99 rolling | Rolling only at launch; capacity-capped (§3) | Full Crew + a monthly recorded teacher review of the child's progress (§3) |
| **Crew Bursary** | £0 | FSM/pupil-premium verified; 1 place per 10 paid | **Full Crew**, identical product; bursary waitlist families hold Crew automatically |
| **Summer Intensive** | £69 one-off | 8 weeks | Unchanged (final-stretch preset per Addendum D) |
| **Schools** | — | Register-interest page only | Year-two intention; waitlist measures demand, nothing built |

Trial: Crew IS the trial — plus an optional 7-day Full Crew preview (no card, existing pattern). Free never converts to paid silently; there is no auto-upgrade path of any kind.

## 2. NEW DESIGN LAW (manifesto D-laws, added as D7)

**D7. The child never sees a paywall, price, upsell, lock-out moment, or any signal that money exists.** Crew-tier locked Cases render exactly like unbuilt district doors — "Locked. Not your patch yet." — indistinguishable from content that simply isn't released. All conversion communication lives in Parent HQ and parent email only, in the established no-dark-pattern register. A child on Crew and a child on Full Crew inhabit the same world with different amounts of it open; neither ever knows a transaction exists. (Rationale: Children's Code nudge rules, the calm brand, and basic decency toward 9-year-olds who don't control the family budget.)

Corollaries: no ads anywhere, ever, any tier (Children's Code; brand). No streak/mascot/juice differences between tiers. Free-tier session cap, forgiveness, and all D-laws identical.

## 3. CREW PLUS: THE TEACHER REVIEW (operational + safeguarding spec)

- **Format ruling: the review is a recorded ~5-minute video addressed to the PARENT about the child** — not a live call, not child-facing. This one decision removes scheduling cost, no-shows, and the entire live-adult-to-child safeguarding surface; recorded media is checked before release and sits cleanly inside the existing DSL framework. Parents may choose to watch it with their child.
- **Content contract (L1 applies in full):** what's going well (method-praised), one focus for the month, one at-home suggestion — grounded in the dashboard data the teacher sees. Banned: predictions, pass-probability, comparisons to other children, urgency. A one-page recording guide + checklist per review; reviews failing checklist re-record.
- **Reviewer bench:** qualified teachers (QTS or equivalent), safer-recruitment checks, paid per completed review; they see the child's progress snapshot only (crewName, year group, dashboards — the Phase 1 minimisation means there's nothing else to see). Item-level child writing is NOT in scope of the review.
- **Tooling:** admin queue (child snapshot → record → checklist self-attest → spot-check sample by DSL/admin → release to Parent HQ + email link). Retention: videos deleted 12 months after the subscription ends.
- **Economics guardrail:** bench cost target ≤£10/review fully loaded; **subscription capacity is capped to bench capacity with a public waitlist** — an unfulfilled review month auto-credits the Plus premium (£15) without being asked. Under-promise machinery, in code.
- Plus cancellation downgrades to Full Crew terms seamlessly; no review claw-backs.

## 4. WHAT THIS FIXES AND WHAT IT RISKS (recorded honestly)

Fixes: acquisition engine without ad money (Crew), the premium-differentiation gap (Plus — no competitor bridges software and teacher near this price), bursary optics (even the waitlist gets something real), and preserves the churn-cliff answer (commitment ladder intact under the same £9.99 headline).
Risks, owned: Crew cannibalisation of Full Crew (mitigation: depth limit is real — 10 of 21+ Cases, no mocks; watch conversion cohorts), Plus margin sensitivity to bench cost (mitigation: async format + cap), free-tier support load (mitigation: Crew gets self-serve support only). Review at cohort-one data alongside the Addendum C/D config ratifications.

## 5. BUILD MIGRATION (the engineering this actually requires)

1. **Entitlements layer (the real work):** a single `core/entitlements.ts` mapping tier → capabilities (case access by `freeTier` flag on Case, mock ladder access, Writing Room, dashboard depth, email cadence, teacher-review eligibility). Every feature checks entitlements; no tier logic scattered in UI. Cases gain `freeTier: boolean` (the 10 chosen Cases set by David + reviewer — first 2 per engine family by `orderInDistrict` as default).
2. `pricing.ts` rewrite to §1; Stripe products/prices updated; rolling-monthly product added; Plus product + capacity counter + waitlist.
3. Checkout: three-way Full Crew term picker with TCV per term (DMCC display rules as built); Plus page with capacity state.
4. Parent HQ: tier state, upgrade/downgrade flows (two-click parity with cancellation), review video surface for Plus.
5. D7 sweep: audit every child-facing string/screen for price/paywall leakage; extend banned-vocab CI with price terms in child-facing string files.
6. Teacher-review admin tooling per §3.
7. Marketing site pricing page rebuild; bursary page updated ("waitlist holds Crew"); Schools register-interest page.

## 6. GATE CHECKLIST

1. Entitlements unit-tested per tier × capability matrix; a Crew child provably cannot reach mocks/Writing Room by any route (API-level, not UI-level).
2. D7 audit: full child-app walkthrough on Crew — zero price/upsell/paywall signals; locked Cases indistinguishable from unbuilt districts; CI price-term scan green.
3. Checkout: all three Full Crew terms show correct TCV; early-exit formula recomputed for new prices in unit tests; rolling tier cancellable in two clicks.
4. Plus: capacity cap + waitlist + missed-review auto-credit demonstrated in staging; one end-to-end review (snapshot → record → checklist → spot-check → parent surface) completed with a test video.
5. Review recording guide + checklist written; L1 banned-claims scan covers review checklist text; DSL spot-check flow documented in runbook.
6. Downgrade/upgrade paths tested including Plus→Full mid-month and free→paid→free round-trip; no data loss, no child-visible change beyond content unlocking.
7. Free-tier Case selection ratified by David + reviewer (are the 10 the right 10 pedagogically and commercially?).
8. DPIA updated: teacher bench as processors, review video retention, entitlement data.
9. Manifesto changelog entry recorded (this amendment + D7); Phase 2 §1 marked superseded with pointer here.

---
*Changelog: v1.0 — Pricing V2: Crew free tier, Full Crew commitment ladder at £9.99 headline, Crew Plus teacher review at £24.99, D7 (child never sees money), Schools deferred.*
