# BUILD-PHASE-1: FOUNDATION
### ClueCrew Build Bible — Phase 1 of 6 — v1.0
**Prerequisite reading: CLUECREW-MANIFESTO.md. The manifesto wins all conflicts. If any instruction in this spec conflicts with it, STOP and surface the conflict.**

**Phase 1 delivers no user-visible product. It delivers the repo, environments, data model, auth skeleton, privacy defaults, and analytics spine that every later phase stands on. Nothing in this phase is throwaway.**

---

## 1. STACK (DECIDED — do not substitute without surfacing)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15+ (App Router) + TypeScript strict | One codebase for marketing site, parent HQ, child app, admin. PWA-capable per manifesto (no native apps in v1) |
| Database | PostgreSQL via Prisma ORM | Relational fits the item-bank and progress model; Prisma migrations give auditable schema history |
| Hosting | Vercel (app) + managed Postgres (Neon or Supabase-DB-only) | Low ops burden for a solo founder; UK/EU region for data residency — **EU-West region mandatory** |
| Auth | Auth.js (NextAuth) with email+password and email verification; parent accounts only | Children never have credentials; child profiles live under the parent account |
| Payments | Stripe (schema now, integration Phase 2) | |
| Email | Resend or Postmark (transactional only in Phase 1) | |
| Analytics | Self-hosted event table (see §6) + Plausible for web analytics | **No third-party trackers on any child-facing route. No Google Analytics anywhere child-facing. Non-negotiable (Children's Code, S1)** |
| Animation runtime | Rive (@rive-app/react-canvas) — stub only in Phase 1 | |
| Testing | Vitest + Playwright; CI on GitHub Actions | |

Monorepo layout:
```
/apps/web          — Next.js app (routes: /(marketing), /(parent), /(crew) child app, /(admin))
/packages/db       — Prisma schema, migrations, seed
/packages/core     — domain logic (mastery, scheduling, adaptivity) — pure TS, no framework imports
/packages/ui       — design tokens, shared components
/content           — authored content source (JSON/MDX), validated by schema in CI
```
Design tokens in `/packages/ui/tokens.ts` must use the manifesto's canonical colour names (`ink`, `amber`, `cream`, `coral`, `vr-teal`, `nvr-violet`, `maths-green`, `english-rose`). Pure white page backgrounds fail lint (D1/D4 enforcement starts now).

## 2. ENVIRONMENTS AND CI

- `dev` (local), `staging`, `production`. Staging seeds with synthetic data only — **never real child data outside production**.
- CI gates on every PR: typecheck, lint, unit tests, Prisma migration check, content-schema validation, and a banned-vocabulary scan of all user-facing strings (fails on: "fail", "wrong", "guarantee", "learning style" — the manifesto L2/D1 lists).
- All secrets in environment config; none in repo. Dependency audit in CI.

## 3. DATA MODEL

Canonical vocabulary (manifesto §7) maps to code as follows. Prisma model names are law; drift fails review.

### 3.1 Accounts and families
```prisma
model ParentAccount {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  emailVerified DateTime?
  displayName   String            // how we address the parent, e.g. "David"
  regionCode    String?           // 11+ region, set by onboarding wizard (Phase 2)
  targetSchools Json?             // [{name, examBoard, examDate}] — parent-entered
  consentLog    ConsentEvent[]
  children      ChildProfile[]
  subscription  Subscription?
  createdAt     DateTime @default(now())
  deletedAt     DateTime?         // soft delete; hard-delete job runs after 30 days
}

model ChildProfile {
  id           String  @id @default(cuid())
  parentId     String
  parent       ParentAccount @relation(fields: [parentId], references: [id])
  crewName     String          // first name or nickname ONLY — no surname field exists
  yearGroup    Int             // 4, 5, or 6
  examYear     Int?            // e.g. 2028 — drives programme pacing
  settings     Json            // accessibility prefs: reducedMotion, dyslexiaFont, audioDefault
  rank         Rank    @default(TRAINEE)
  caseFiles    CaseFile[]
  wordVault    WordVaultEntry[]
  attempts     Attempt[]
  sessions     Session[]
  createdAt    DateTime @default(now())
  deletedAt    DateTime?
}

enum Rank { TRAINEE  JUNIOR_DETECTIVE  DETECTIVE  SENIOR_DETECTIVE  CHIEF_INSPECTOR }

model ConsentEvent {
  id        String   @id @default(cuid())
  parentId  String
  parent    ParentAccount @relation(fields: [parentId], references: [id])
  kind      String   // "tos", "privacy", "child_profile_created", "writing_review_notice", "marketing_optin"
  version   String   // policy version consented to
  createdAt DateTime @default(now())
}
```
**Data minimisation is structural, not procedural:** there is no field for a child's surname, date of birth (yearGroup + examYear suffice for age-standardisation-style pacing), school name, photo, or free-text "about me". If a later phase wants one, it must amend the manifesto first. (S1)

### 3.2 Subscription (schema only; Stripe wiring is Phase 2)
```prisma
model Subscription {
  id                String   @id @default(cuid())
  parentId          String   @unique
  tier              Tier     // TWO_YEAR | ONE_YEAR | SUMMER
  stripeCustomerId  String?
  stripeSubId       String?
  status            String   // trialing | active | past_due | canceled
  commitmentEndsAt  DateTime?   // for DMCC-compliant display of total contract value
  renewalReminderAt DateTime?   // scheduled reminder before renewal (L5)
  createdAt         DateTime @default(now())
}
enum Tier { TWO_YEAR  ONE_YEAR  SUMMER }
```

### 3.3 Item bank
```prisma
model QuestionType {           // e.g. VR type 8 "Move a Letter"; the 21 GL VR types seed this
  id          String @id       // stable slug: "vr-08-move-letter"
  district    District
  name        String
  glCode      String?          // GL familiarisation numbering where applicable
  mechanic    String           // slug of the game mechanic that renders it
  items       Item[]
  cases       Case[]
}
enum District { VR  NVR  MATHS  ENGLISH }

model Item {
  id             String @id @default(cuid())
  questionTypeId String
  questionType   QuestionType @relation(fields: [questionTypeId], references: [id])
  difficultyTier Int          // 1–5 authored estimate; live calibration adjusts calibratedDifficulty
  calibratedDifficulty Float? // updated nightly from attempt data
  stem           Json         // structured content, never HTML strings
  options        ItemOption[]
  explanation    Json         // per-mode explanation asset refs (watch/walk/see/hear)
  status         ItemStatus @default(DRAFT)   // DRAFT → REVIEWED → LIVE → RETIRED
  authoredBy     String       // "human:<name>" | "ai-draft:<model>" — provenance is mandatory
  reviewedBy     String?      // human reviewer name; REQUIRED before LIVE (P3, AI-QC)
  createdAt      DateTime @default(now())
}
enum ItemStatus { DRAFT  REVIEWED  LIVE  RETIRED }

model ItemOption {
  id              String @id @default(cuid())
  itemId          String
  item            Item @relation(fields: [itemId], references: [id])
  content         Json
  isCorrect       Boolean
  misconceptionId String?     // REQUIRED on every incorrect option before item goes LIVE (P3)
  misconception   Misconception? @relation(fields: [misconceptionId], references: [id])
}

model Misconception {
  id          String @id      // slug: "vr-analogy-surface-match"
  district    District
  description String          // teacher-facing
  childHint   String          // the authored hint shown when this distractor is chosen
  options     ItemOption[]
}

model Case {                  // a learning unit for one QuestionType/concept
  id             String @id   // slug: "case-vr-08"
  questionTypeId String
  questionType   QuestionType @relation(fields: [questionTypeId], references: [id])
  title          String       // child-facing case name
  narrativeIntro Json         // ≤30s of story (D5)
  modes          Json         // asset manifest for the five Modes (P1)
  orderInDistrict Int
  caseFiles      CaseFile[]
}

model CaseFile {              // a child's progress within a Case
  id           String @id @default(cuid())
  childId      String
  child        ChildProfile @relation(fields: [childId], references: [id])
  caseId       String
  case         Case @relation(fields: [caseId], references: [id])
  masteryLevel Float  @default(0)   // 0–1; mastery model in /packages/core
  solvedAt     DateTime?            // case "cracked"
  @@unique([childId, caseId])
}
```

### 3.4 Practice, scheduling, vocabulary
```prisma
model Attempt {
  id          String @id @default(cuid())
  childId     String
  child       ChildProfile @relation(fields: [childId], references: [id])
  itemId      String
  sessionId   String
  chosenOptionId String?
  correct     Boolean
  latencyMs   Int
  context     String    // "case_practice" | "warmup_review" | "boss_case" | "word_vault"
  createdAt   DateTime @default(now())
}

model ReviewSchedule {         // spaced-repetition state per child per reviewable unit
  id          String @id @default(cuid())
  childId     String
  unitKind    String           // "question_type" | "word"
  unitId      String
  dueAt       DateTime
  intervalDays Float
  easeFactor  Float  @default(2.3)
  lapses      Int    @default(0)
  @@unique([childId, unitKind, unitId])
  @@index([childId, dueAt])
}

model Word {                   // vocabulary master list
  id        String @id        // slug of the word
  headword  String
  definitionChild String      // authored, reading age ≤9
  sentence  String
  rootFamily String?          // "latin-port", "greek-tele"
  imageRef  String?
  tier      Int               // frequency/difficulty tier 1–5
}

model WordVaultEntry {
  id        String @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id])
  wordId    String
  word      Word @relation... // collectedAt, masteryLevel — mirrors CaseFile pattern
  collectedAt DateTime @default(now())
  masteryLevel Float @default(0)
  @@unique([childId, wordId])
}

model Session {
  id        String @id @default(cuid())
  childId   String
  child     ChildProfile @relation(fields: [childId], references: [id])
  startedAt DateTime @default(now())
  endedAt   DateTime?
  secondsActive Int @default(0)   // 15-min cap enforcement (D2) reads this
}
```

## 4. AUTH AND SESSION RULES

- Parent signs up with email + password (argon2id hashing), verifies email before any child profile can be created.
- Child mode entry: parent selects a child profile; child-mode session is a scoped token that can read/write only that child's practice data — it cannot reach billing, settings, other children, or account email. Enforced at the API layer, not the UI.
- Child-mode sessions expire after 60 minutes idle. Parent re-entry to Parent HQ from child mode requires the parent password (prevents a child wandering into billing).
- Rate limiting on all auth endpoints; lockout with email notification on repeated failures.

## 5. PRIVACY DEFAULTS (Children's Code — implemented in Phase 1, not retrofitted)

- **Geolocation: never collected.** Region comes from the parent's onboarding answer only.
- **No third-party scripts on `/(crew)` routes.** CSP headers enforce this; CI asserts the CSP.
- Data retention: soft-delete on account deletion; scheduled hard-delete after 30 days; attempt-level data older than the child's exam year + 12 months is aggregated and anonymised by a scheduled job (design the job now, enable later).
- DPIA: `/docs/dpia.md` starts in this phase and is updated at every phase gate. Phase 1 entries: data inventory (the schema above), lawful bases, minimisation decisions, retention schedule.
- Data export: parent can request full export of their family's data (build the endpoint now; UI in Phase 2).

## 6. ANALYTICS SPINE

One append-only `Event` table: `{id, childId?, parentId?, name, props Json, createdAt}`. Canonical event names ship in `/packages/core/events.ts` — starting set: `session_started`, `session_ended`, `case_opened`, `mode_selected`, `attempt_submitted`, `case_cracked`, `word_collected`, `rank_up`, `warmup_completed`. Every later feature must emit from this vocabulary or extend it via PR to that file. **Events never contain free text a child wrote, item content, or anything beyond IDs and enums.** This table is the future evidence base for success-rate claims (manifesto L1), so completeness of instrumentation is a launch-critical concern, not a nice-to-have.

## 7. SEED DATA

Seed script creates: all 21 VR QuestionTypes (slugs `vr-01`…`vr-21` with GL-familiarisation names), 4 Districts, Rank thresholds config, 40 synthetic Items across 3 VR types (marked `authoredBy: "seed"`, never shippable), 60 seed Words across tiers, one test family (parent + 2 children) for staging.

## 8. EXPLICIT NON-GOALS FOR PHASE 1

No UI beyond a health-check page and a bare admin login. No Stripe calls. No content authoring UI. No mascot. No email sending beyond verification. Resist all scope creep; it is recorded here so Code can decline it.

## 9. GATE CHECKLIST (human inspection before Phase 2 begins)

1. Fresh clone → `pnpm install && pnpm dev` gives a running app + migrated DB in under 10 minutes, documented in README.
2. CI is green and demonstrably fails on: type error, banned-vocabulary string, migration drift, invalid content JSON.
3. Schema review: create a family with two children in staging; confirm no field anywhere can store child surname, DOB, school, or photo.
4. Child-scoped token provably cannot read another child's data or any billing route (Playwright test exists and passes).
5. Soft-delete → hard-delete job runs in staging and removes all family rows and events.
6. Event table receives all seed-flow events with correct names; a sample analytics query (attempts per child per day) runs.
7. CSP on `/(crew)` blocks a deliberately injected third-party script in a test.
8. `/docs/dpia.md` exists with Phase 1 sections complete.
9. Prisma schema field names match manifesto vocabulary (spot-check: Case, CaseFile, Rank, WordVault, District).
10. David has read the schema section of this spec and ratified: stack, region, retention windows, and the "no surname/DOB" minimisation stance.

---
*Changelog: v1.0 — initial Phase 1 spec.*
