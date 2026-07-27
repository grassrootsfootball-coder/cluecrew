# BUILD-PHASE-2: THE OUTSIDE STRUCTURE
### ClueCrew Build Bible — Phase 2 of 6 — v1.0
**Prerequisites: CLUECREW-MANIFESTO.md (wins all conflicts) and a passed Phase 1 gate. Ratified pricing below is final; changes require David's sign-off recorded in the changelog.**

**Phase 2 delivers: a parent can discover, sign up, take a trial, pay, create child profiles, and manage their account. An admin can author and review items. No child-facing learning UI yet (Phase 3–4).**

---

## 1. RATIFIED PRICING (canonical — hardcode nowhere; lives in `/packages/core/pricing.ts`)

| Tier | Price | Billing | Commitment | Total contract value |
|---|---|---|---|---|
| `TWO_YEAR` "2-Year Crew" | £8.99/mo | Monthly via Stripe subscription | 24 months | **£215.76** |
| `ONE_YEAR` "1-Year Crew" | £12.99/mo | Monthly via Stripe subscription | 12 months | **£155.88** |
| `SUMMER` "Summer Intensive" | £69.00 | One-off Stripe payment | 8-week programme | £69.00 |
| `BURSARY` "Crew Bursary" | £0 (or £1/mo if friction is wanted later — launch at £0) | Internal flag + 100% Stripe coupon | Matches TWO_YEAR term | £0 |

- **Trial: 7 days, all paid tiers, NO card required.** Card is collected only at conversion. Rationale: parent-forum trust and zero accidental-charge complaints outweigh the conversion hit; this is a deliberate positioning choice, not an oversight.
- Bursary places are capped at a configurable ratio (launch: 1 bursary place unlocked per 10 paid subscriptions; config in pricing.ts). Waitlist when cap reached.
- VAT: prices are VAT-inclusive; confirm VAT treatment of digital education services with the accountant before launch (flag in gate checklist).

## 2. STRIPE DESIGN

- Products: `cluecrew_2yr`, `cluecrew_1yr` (recurring monthly prices) and `cluecrew_summer` (one-off price). Commitment is enforced by us, not Stripe: the Subscription row's `commitmentEndsAt` drives UI and cancellation handling.
- Webhooks (idempotent, signature-verified): `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`. Webhook handler is the only writer of `Subscription.status`.
- Failed payment: 3 retries over 14 days (Stripe smart retries), warm email at each stage, then status `past_due` → access pauses (never deletes data). No child-facing sign of payment state, ever — the child app never knows billing exists.
- **DMCC-standard flows (manifesto L5), implemented now regardless of commencement date:**
  1. **Pre-contract clarity:** checkout page states, above the pay button: price per month, commitment length, TOTAL contract value, renewal behaviour, and how to cancel. Plain English, no drip pricing, no pre-ticked boxes.
  2. **Cooling-off:** 14-day full refund from first payment, self-serve, no questions. (Statutory position may be narrower; we exceed it deliberately.)
  3. **Renewal reminders:** email at T-14 and T-3 before (a) trial→paid conversion would need action, and (b) commitment end/renewal. Scheduled from `renewalReminderAt`.
  4. **Exit parity:** cancellation is a two-click flow in Parent HQ — one click to reach it, one to confirm. A single optional save-offer screen maximum, skippable, never guilt-copy. Cancelling before `commitmentEndsAt`: remaining commitment is payable OR parent takes the documented early-exit option (pay the difference between their tier rate and the shorter tier's rate for months used — fair-exit formula in pricing.ts). This formula appears at checkout, not only at cancellation.
- Receipts and VAT invoices emailed on every charge.

## 3. ONBOARDING WIZARD (parent, post-signup)

Step order is fixed; every step skippable except 1 and 2:
1. **Verify email** (Phase 1 flow).
2. **Create first child profile:** crewName (first name/nickname), yearGroup, accessibility quick-set (dyslexia-friendly font? audio on by default? reduced motion?). Consent notice: what we collect and don't (link to plain-English privacy page), writing-review notice (S4 disclosure text — shown now even though Writing Room ships in Phase 6, so no surprises later). Log `ConsentEvent`s.
3. **Region wizard:** "Which area or schools are you aiming for?" → parent picks region or searches school from the **Region Registry** (`/content/regions.json`: region → exam board/format, typical test month, subjects tested, sourced-and-dated). Output sets `regionCode`, `targetSchools`, `examYear`, and the programme pacing. **Every result carries the caveat line: "Schools change providers — always confirm with the school for your entry year." (research caveat, verbatim requirement).** Unknown/undecided is a first-class option and defaults to GL-style full coverage.
4. **Programme recommendation:** from yearGroup + examYear, recommend a tier (Year 4 → 2-Year Crew, Year 5 → 1-Year, post-Easter Year 5 → 1-Year + note Summer). Show all three regardless; recommendation is advisory, never dark-patterned.
5. **Start trial** (no card). Trial banner in Parent HQ shows days remaining; child app shows nothing.

## 4. PARENT HQ (skeleton this phase; live data arrives Phase 5)

Routes: `/parent` dashboard (placeholder cards wired to real queries where data exists: children list, subscription status, "what happens next" checklist), `/parent/account` (email, password, data export button — wire the Phase 1 endpoint to a download), `/parent/billing` (plan, TCV, next payment, cancel flow, invoices), `/parent/children` (add/edit/archive child, accessibility settings), `/parent/casebook` (empty shell for the Parents' Casebook course — content lands Phase 5).
Add child: additional children are **free on the same subscription at launch** (sibling-friendly, retention-positive; revisit only with data). Cap 4 profiles.

## 5. ADMIN CMS (`/admin`, role-gated, staff only)

- Item workflow honouring Phase 1 statuses: create/edit DRAFT → submit for review → reviewer (different user) checks and either returns with notes or marks REVIEWED → publish to LIVE. **Publishing is blocked unless every incorrect option has a `misconceptionId` and `reviewedBy` is set** (P3 as a hard constraint, enforced server-side).
- Bulk import: JSON matching the content schema, validated on upload, lands as DRAFT with `authoredBy` provenance preserved (`ai-draft:<model>` imports can never skip review).
- Misconception library CRUD; Word list CRUD; Region Registry editor with source-URL and last-verified date per region.
- Bursary queue: applications with evidence attachment, approve/decline, capacity counter.
- Audit log on all admin actions.

## 6. BURSARY FLOW

Public page (mission-framed, access-framed, never charity-framed) → short application: FSM/pupil-premium confirmation + one evidence upload (school letter or benefit screenshot; stored encrypted, deleted 30 days after decision) → admin review → approval creates a TWO_YEAR subscription with 100% coupon and `isBursary` flag used ONLY for capacity accounting and aggregate reporting. **Grep-level guarantee: no child-facing or parent-facing UI reads `isBursary`. The product is identical. (Manifesto: bursary children's experience may never differ.)**

## 7. TRANSACTIONAL EMAIL SET (all plain-English, parent voice per manifesto §6)

verify-email, welcome/trial-started, trial-ending T-2, receipt, payment-failed (warm, "no access lost yet"), renewal reminders T-14/T-3, cancellation-confirmed, cooling-off-refund-confirmed, bursary received/approved/waitlist. No marketing email without explicit opt-in consent event.

## 8. NON-GOALS FOR PHASE 2

No learning UI, no mascot, no content beyond seed items entered via CMS, no referral codes, no sibling discounts (free profiles cover it), no annual-prepay variants, no A/B testing framework.

## 9. GATE CHECKLIST

1. Full journey on staging with Stripe test mode: signup → verify → child → region wizard → trial → convert with test card → invoice email received.
2. Checkout screenshot review: price, commitment, **TCV**, renewal terms and cancellation route all visible above the pay button; David ratifies the copy.
3. Cancel flow measured at two clicks; early-exit formula displayed and computes correctly in a unit test.
4. Cooling-off refund end-to-end in test mode returns full amount and pauses access correctly.
5. Renewal reminder emails fire from a time-travelled staging clock.
6. Webhook handler passes replay/idempotency tests; out-of-order event test passes.
7. Region Registry: 10 launch regions entered with sources and dates; caveat line renders on every result; David spot-checks 3 regions against school websites.
8. CMS: an item cannot reach LIVE without reviewer + misconceptions (attempt fails with clear error); bulk-imported `ai-draft` item cannot skip review.
9. Bursary: application → approval → subscription works; `grep -r isBursary apps/web` shows zero UI reads; evidence file auto-deletes after decision + 30 days in staging test.
10. Trial requires no card anywhere; conversion path collects card only at upgrade.
11. DPIA updated: payments data, bursary evidence handling, email provider as processor.
12. Banned-vocabulary CI scan passes on all new user-facing strings and email templates.

---
*Changelog: v1.0 — initial Phase 2 spec with ratified pricing (£8.99/£12.99/£69 + bursary, no-card trial).*
