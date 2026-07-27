# ClueCrew

**ClueCrew makes the 11+ make sense — for every child and every parent — through clear teaching, calm design, and a price any family can reach.**

Read [CLUECREW-MANIFESTO.md](CLUECREW-MANIFESTO.md) before contributing. It wins all conflicts. Phases 1–4 are complete and gate-passed; the current build phase is [BUILD-PHASE-5.md](BUILD-PHASE-5.md) — art, sound, live Parent HQ, Casebook, marketing, accessibility. External deliverables (mascot rig per `docs/mascot-brief.md`, illustration set, sound set) drop into clean integration points. Outstanding cross-phase items: Stripe staging validation (parked until keys exist), review of ai-draft items to LIVE (David, via CMS), words 120/300.

Child app dev flow: sign in as the test parent → Parent HQ → Children → "Enter Crew HQ as Alex". `pnpm content:generate` fills the item bank with ai-draft DRAFTs (dev/staging only; the app serves LIVE items in production, falling back to the whole bank elsewhere).

## Quickstart (target: under 10 minutes)

Prerequisites: Node 20.9+, pnpm 9+, a local PostgreSQL running on 5432 (`brew install postgresql@16 && brew services start postgresql@16`).

```bash
createdb cluecrew_dev
createdb cluecrew_shadow          # used by Prisma for migration diffing
cp .env.example .env              # then set AUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm dev                          # migrates, seeds, starts http://localhost:3100
```

Verify: <http://localhost:3100/api/health> returns `{ ok: true, db: { connected: true } }`.

Seeded staging accounts (dev/staging only, never production):

- Family: `test-family@cluecrew.test` / `CrewTest!2026` (children Alex and Sam)
- Staff: `staff-admin@`, `staff-reviewer@`, `staff-author@cluecrew.test` / `CrewStaff!2026`

Without `STRIPE_SECRET_KEY`, the dev payment provider simulates checkout and webhook-driven status transitions, so the entire billing journey (trial → convert → cancel → cooling-off refund) runs locally with no keys. With keys set (staging/production), real Stripe Checkout and the signature-verified webhook at `/api/payments/webhook` take over. `CLUECREW_NOW` time-travels the billing clock for reminder tests (non-production only).

## Repo layout (BUILD-PHASE-1 §1)

| Path | Contents |
|---|---|
| `apps/web` | Next.js app — marketing, Parent HQ, `/crew` child app (self-only CSP), `/admin` |
| `packages/db` | Prisma schema, migrations, seed, retention jobs, analytics queries |
| `packages/core` | Domain logic (mastery, scheduling, events, content schemas) — pure TS |
| `packages/ui` | Design tokens (canonical colour names) |
| `content` | Authored content source (JSON), schema-validated in CI |
| `docs/dpia.md` | Living Data Protection Impact Assessment |
| `assets/brand` | Logo lockups, mark, brand board |

All workspaces read the single root `.env` (Next loads it in `next.config.ts`; package scripts use `dotenv -e ../../.env`).

## Commands

```bash
pnpm dev                 # migrate + seed + run the app on :3100
pnpm typecheck           # all workspaces
pnpm lint
pnpm test                # unit tests (packages/core, incl. 90-day learner simulations)
pnpm test:coverage       # same, gated at 90%+ on mastery/scheduler/adaptivity/session
pnpm sim:report          # regenerate docs/sim-report.html (six learner profiles)
pnpm check:l2            # L2 firewall grep: no modality/learning-style profiles
pnpm jobs:calibrate      # nightly item calibration; drifted items flag to the CMS queue
pnpm e2e                 # Playwright: child-token isolation, CSP (needs dev DB seeded)
pnpm validate:content    # /content against zod schemas
pnpm scan:vocab          # banned vocabulary + pure-white background lint
pnpm db:migrate          # create a new migration after schema changes
pnpm db:migrate:check    # drift check (CI gate)
pnpm jobs:hard-delete    # retention: hard-delete accounts soft-deleted >30 days
pnpm jobs:purge-evidence # retention: clear bursary evidence 30 days after decision
pnpm check:bursary       # grep guarantee: no UI reads isBursary
pnpm --filter @cluecrew/db analytics:sample   # attempts per child per day
```

Scheduled jobs also run over HTTP with `Authorization: Bearer $CRON_SECRET`: `/api/jobs/hard-delete`, `/api/jobs/reminders`, `/api/jobs/purge-evidence`.

CI (GitHub Actions) runs on every PR: typecheck, lint, unit tests, migration drift check, content validation, banned-vocabulary scan, dependency audit, build, and the e2e isolation/CSP suite.

## Environments

- **dev** — local Postgres, console email, synthetic seed.
- **staging** — Neon Postgres (EU-West), synthetic data only. Real child data never leaves production.
- **production** — Neon Postgres (**EU-West region mandatory** for data residency), Resend for transactional email, Vercel hosting.

### Decisions log (Phase 1 gate ratified by David, 2026-07-27)

| Decision | Choice | Notes |
|---|---|---|
| Managed Postgres | **Neon** (EU-West) | Spec allowed Neon or Supabase-DB-only; Neon chosen for Vercel-native integration and branchable databases. Swappable — nothing Neon-specific in code. |
| Transactional email | **Resend** | Spec allowed Resend or Postmark. Dev falls back to console logging without an API key. |
| Retention windows | 30-day hard delete; exam year + 12 months aggregation | Per BUILD-PHASE-1 §5; aggregation job designed but disabled. |
| Minimisation stance | No child surname/DOB/school/photo fields exist | Manifesto S1; schema-structural. |

## Non-negotiables enforced by tooling

- Banned vocabulary (manifesto L2/D1/§6) fails CI — including "fail"/"wrong" in child-facing copy and "guarantee"/"learning style" anywhere.
- Pure white page backgrounds fail the scan; `cream` (#FAF6EF) is the default background.
- `/crew` routes send a self-only Content-Security-Policy — no third-party scripts on child-facing pages, asserted by e2e tests.
- Child-mode tokens are scoped to one child at the API layer; the e2e suite proves a child token cannot read a sibling's data or any billing route.
- Every incorrect item option must map to a tagged misconception before going LIVE (P3).
