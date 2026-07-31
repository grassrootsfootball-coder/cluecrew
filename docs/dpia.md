# ClueCrew Data Protection Impact Assessment (DPIA)

**Living document** — updated at every phase gate (manifesto S1, BUILD-PHASE-1 §5).
Owner: David (controller). Basis: UK GDPR, Data Protection Act 2018, ICO Age Appropriate Design Code ("Children's Code").

| Version | Date | Phase | Change |
|---|---|---|---|
| 0.1 | 2026-07-27 | 1 | Initial DPIA: data inventory, lawful bases, minimisation, retention |
| 0.2 | 2026-07-27 | 2 | Payments data (Stripe as processor), bursary evidence handling, email provider as processor, admin roles/audit |
| 0.3 | 2026-07-27 | 3 | Derived learning records (mastery, scheduling, adaptivity state) documented as pseudonymised; L2 firewall automated |
| 0.4 | 2026-07-27 | 4 | Child-testing data handling; text-to-speech approach (on-device, no processor yet) |
| 0.5 | 2026-07-27 | 5 | Weekly email (no open tracking), marketing analytics (Plausible, cookieless, marketing routes only), illustration/animation contractor handling |

---

## 1. Processing overview

ClueCrew is an 11+ preparation service. **Parents own accounts; children have profiles under them** (S6). Primary users include children aged roughly 8–11, which makes the Children's Code apply in full and drives every default below.

Phase 1 processes data only in dev/staging with synthetic seed data. No real child uses the product yet. This DPIA is written now so privacy is structural, not retrofitted.

## 2. Data inventory (maps 1:1 to `packages/db/prisma/schema.prisma`)

| Store | Data | Subject | Purpose |
|---|---|---|---|
| `ParentAccount` | email, argon2id password hash, display name, region code, target schools (parent-entered), lockout counters | Parent | Account, sign-in, regional guidance |
| `ChildProfile` | crew name (first name/nickname only), year group, exam year, accessibility settings, rank | Child | Personalised practice |
| `ConsentEvent` | consent kind, policy version, timestamp | Parent | Evidence of consent (S6) |
| `VerificationToken` | SHA-256 hash of email token | Parent | Email verification |
| `Subscription` | tier, Stripe references (Phase 2), status, renewal dates | Parent | Billing (DMCC/L5) |
| `Attempt`, `Session`, `CaseFile`, `WordVaultEntry`, `ReviewSchedule` | practice interactions: item ids, correctness, latency, mastery levels, scheduling state | Child | Learning engine (mastery, spaced retrieval) |
| `Event` | canonical event name + IDs/enums only | Child/Parent | Product analytics, future evidence base (L1) |
| `AggregateDailyStat` | anonymous daily rollups (no child id) | — | Long-term statistics after retention window |

### What is deliberately absent (minimisation is structural, S1)

- **No child surname field. No date of birth** (year group + exam year suffice). **No school name, no photo, no free-text "about me"** — the columns do not exist; adding one requires a manifesto amendment.
- **No geolocation, ever.** Region comes from the parent's onboarding answer.
- **Events carry IDs and enums only** — never free text a child wrote, enforced in code (`assertEvent`).
- **No third-party trackers.** Child-facing `/crew` routes carry a self-only CSP asserted in CI; no Google Analytics anywhere child-facing. Web analytics (marketing pages only) will be cookieless Plausible.

## 3. Lawful bases

| Processing | Basis |
|---|---|
| Account, profiles, practice data, billing | **Contract** (Art. 6(1)(b)) with the parent |
| Child profile creation | Contract + **verifiable parental consent** for under-13s (S6); consent recorded in `ConsentEvent` |
| Product analytics (first-party event table) | **Legitimate interests** (Art. 6(1)(f)) — balanced in the child's interest per Children's Code; no profiling that is not in the child's interest (adaptive difficulty exists to keep the child in a 70–85% success band, which is squarely in their interest) |
| Marketing email | **Consent**, opt-in only (`marketing_optin` consent kind); never to children |
| Safeguarding escalation (Phase 6 Writing Room) | **Legal obligation / vital interests**; fresh DPIA section before that feature ships (S3/S4) |

## 4. Retention schedule

| Data | Rule | Mechanism |
|---|---|---|
| Whole family account | Soft delete on request → **hard delete after 30 days** | `deletedAt` + `runHardDelete` job (implemented Phase 1, incl. Event rows) |
| Attempt-level child data | Aggregated + anonymised after **child's exam year + 12 months** | `aggregate-old-attempts` job — designed Phase 1, enabled after gate review |
| Verification tokens | 24-hour expiry, single use | Enforced in code |
| Auth lockout counters | Reset on successful sign-in | Enforced in code |

## 5. Security measures (Phase 1)

- argon2id password hashing (OWASP parameters); email verification before use; DB-backed lockout with parent notification after repeated failed sign-ins; rate limiting on auth endpoints.
- Child-mode sessions are scoped JWTs limited to one child's practice data, enforced at the API layer and expiring after 60 minutes; exit to Parent HQ requires the parent password. Proven by automated tests (CI).
- Secrets in environment config only; EU-West (London/Dublin) hosting for data residency; staging uses synthetic data only.
- Parent data export endpoint (Art. 15/20) ships in Phase 1.

## 6. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Child accesses billing/another child's data | Low | Med | Scoped token, API-layer enforcement, CI test (gate #4) |
| Third-party script exfiltrates child data | Low | High | Self-only CSP on `/crew`, CI-asserted; no third-party scripts by policy |
| Data kept longer than needed | Med | Med | Structural retention jobs; DPIA review each gate |
| Re-identification from analytics | Low | Med | Events carry IDs/enums only; aggregates drop child id |
| Staging leak of real child data | Low | High | Synthetic-only seed outside production, enforced in seed script |

## 7. Phase 2 additions

### 7.1 Payments (Stripe as processor)

- Card details are entered **only on Stripe-hosted checkout** — they never touch ClueCrew servers or the database. We store Stripe customer/subscription identifiers and status only.
- Trials collect **no card at all** (deliberate: zero accidental-charge risk). Lawful basis: contract.
- Webhook processing is signature-verified and idempotent; the `WebhookEvent` table stores Stripe event ids (no payload) for replay protection.
- Payment state is never visible on any child-facing surface — the child app has no knowledge billing exists.

### 7.2 Bursary evidence (special care)

- One document (school letter or benefit screenshot) confirming FSM/pupil-premium status. This can reveal financial circumstances, so: **AES-256-GCM encrypted at rest**, decrypted only for ADMIN-role staff, every access written to the audit log, **auto-deleted 30 days after the decision** (`evidencePurgeAt` + purge job).
- The `isBursary` flag is used only for capacity accounting; a CI grep guarantees no parent- or child-facing UI reads it. Lawful basis: consent (the parent applies) + legitimate interests for capacity accounting.

### 7.3 Email provider (Resend as processor)

- Transactional email only: verification, trial/renewal reminders (DMCC), receipts, payment issues, cancellation/refund confirmations, bursary decisions, lockout notices. Recipient address and message content pass through Resend under their DPA; no child data appears in any email template.
- Marketing email requires an explicit `marketing_optin` consent event (none is sent in Phase 2).

### 7.4 Admin access

- Staff roles (AUTHOR/REVIEWER/ADMIN) on named accounts; all admin actions land in `AdminAuditLog`. Region Registry entries carry a source URL and last-verified date to keep parent-facing regional claims accountable.

## 8. Phase 3 additions — derived learning records

The learning engine derives per-child records from practice: mastery levels
(`CaseFile.masteryLevel`, `WordVaultEntry.masteryLevel`), spaced-repetition
state (`ReviewSchedule`), per-type difficulty estimates and session state
(`Session.engineState`), streak weeks, and rank. These are **pseudonymised
learning records**: keyed to the child profile id, containing no free text,
no biometrics, and no inferred sensitive attributes.

- **Purpose and child's interest (Children's Code):** every derived value
  exists to keep the child in a 70–85% success band, schedule kind review, or
  prevent frustration (hard anti-frustration rules). Profiling here is
  squarely in the child's interest; nothing is used for advertising, pricing,
  or ranking children against each other (D3 forbids leaderboards).
- **The L2 firewall:** the system computes NO learning-style, modality, or
  learner-type profile from Mode choices — structurally absent (no columns),
  and enforced by a CI grep (`scripts/check-l2-firewall.mjs`). The single
  stored pointer is `lastUsedMode`, a UI convenience.
- **Retention:** derived records follow the same schedule as attempt data
  (§4): cascade-deleted with the account; attempt-level data aggregates and
  anonymises after the exam year + 12 months.
- **Transparency:** parent-facing dashboards (Phase 5) will present mastery
  in plain language; the data export already includes every derived record.

## 9. Phase 4 additions

### 9.1 Child usability testing

Per `/docs/child-testing-protocol.md`: written parental consent + child assent;
**no face recordings** (screen + written notes only); findings pseudonymised
(Child A–H); recordings deleted within 30 days of triage; consent forms held
offline by the controller. This is offline research data, never entered into
the product database.

### 9.2 Text-to-speech (tap-to-hear)

Phase 4 uses the **device's own speech engine** (Web Speech API): authored text
is spoken locally, no audio or text leaves the device, no processor involved.
The planned Phase 5 upgrade (pre-generated TTS files from authored strings)
would send only AUTHORED CONTENT — never child data — to a TTS provider;
provider selection will add a processor entry here before use.

## 10. Phase 5 additions

- **Weekly summary email:** content derives from the same pseudonymised learning
  records (§8); addressed to the parent; child referred to by crew name only.
  **Open/click tracking is OFF by default and stays off** — disable link/open
  tracking in the Resend dashboard (checklist item). One-tap signed
  unsubscribe; opt-out stored on the account; transactional email unaffected.
- **Marketing analytics:** Plausible (cookieless, no personal data, EU-hosted)
  on marketing routes only, and only when configured. Child-facing routes are
  protected twice over: the component is never rendered there AND the /crew
  CSP blocks all third-party scripts.
- **Contractors (illustrator / Rive animator / sound):** receive brand assets
  and briefs only — never any user or child data. No processor relationship
  arises; contracts cover IP assignment and confidentiality (mascot brief).

## 10a. Addendum B additions — mock sittings

- **`MockSitting` rows** record, per child: the blueprint id, the item ids
  composed into the paper, per-section timings, and the option chosen per item
  with server-side grading. These are the same classes of data the practice
  engine already stores per `Attempt` (§8) — **no new category of personal data
  is collected**, and in particular no date of birth: Addendum B §4 states
  outright that true age-standardised scores are therefore impossible for us,
  and the parent report says so rather than faking it.
- **Purpose:** parent progress reporting (Stage 1), the exposure-control "burn"
  rule (an item a child has seen in a mock is never re-served to that child),
  Stage-2 cohort statistics when a blueprint reaches N≥300 sittings (year-group
  banding via `yearGroup` only), and — aggregated and consented — the L1
  evidence base.
- **Retention:** follows the child profile (cascade on delete), same as
  attempts and sessions.
- **Abandoned sittings** are discarded from reporting entirely: no partial
  score is stored for or shown to the parent (§3).

## 10b. Addenda C + D additions — readiness and the year model

- **`ReadinessSnapshot`** stores per child/district/blueprint coverage,
  cracked and transfer percentages plus the intensity column — all derived
  from data already held (case files, attempts). Parent-facing only; the
  child never sees any readiness artefact (Addendum C §6). No new category of
  personal data.
- **Derived year group (Addendum D §1):** the schema stores year group AT
  CAPTURE plus the capturing academic year; the effective year group is
  computed, never collected and never stored denormalised. Corrections are
  parent-initiated and audited via events.
- **Boss Round outcomes** are ordinary attempts (context `boss_case`),
  already covered in §8.

## 11. Open items for next phase gates

- Phase 2: onboarding wizard region data, Stripe processor agreement, verifiable parental consent flow detail, marketing consent UX, data export UI.
- Phase 6: Writing Room two-pass pipeline DPIA section, DSL appointment (S4), free-text PII screening (S5), OSA scope assessment.
