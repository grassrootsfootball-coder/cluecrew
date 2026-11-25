# ClueCrew — session handoff (2026-11-25)

Written so a fresh Claude session, on a new account, can pick up exactly where the last one stopped.
**This file is a snapshot, not a ruling.** The manifesto, the phase specs and the register win any
conflict with it (CLAUDE.md, "the documents win arguments"). This repo is PUBLIC: nothing secret
belongs here, and nothing secret is in it.

## 1. Read first (in this order)

1. `CLAUDE.md` — house rules, and the reading order for everything else.
2. `docs/CLUECREW-MANIFESTO.md` (v1.11) — wins all conflicts; only David amends it.
3. `docs/authoring-calibration-log.md` — THE REGISTER. Highest entry today: **R1066**.
   Parallel sessions have collided on numbers: always read the highest `## R` immediately before
   adding one, and add the ruling here FIRST.
4. The phase or district spec for whatever you touch (`docs/BUILD-PHASE-1..5.md`,
   `docs/BUILD-DISTRICT-{ENGLISH,MATHS,NVR}.md`), plus the addenda and Amendment 1.

## 2. Standing facts the previous account kept in memory

A new account does not inherit Claude's memory. These were the remembered facts that still hold:

- **Cowork is retired (R1034, 2026-11-22).** This repo and its database author, review, hold and
  serve all content. Nothing is exported to Cowork or awaited from it. CLAUDE.md rules about
  Cowork, returns, the outbound folder or Annie's channel are history: read them for the lesson.
- **Annie no longer reviews (R1031).** Agents draft; a SEPARATE agent reviews and signs as
  `rev-agent-01`. A machine verdict never wears a person's name (R94). Agreement between agents
  measures agreement, not what a person would sign — say so wherever a number depends on it.
- **Dev database:** `cluecrew_dev` on Homebrew postgresql@16, port 5432, created with
  `LC_COLLATE=C LC_CTYPE=C` from `template0`. A default `createdb` gives en_US collation, which
  changes `ORDER BY id`, option order and pin digests — never recreate it without C collation.
  The untouched pg14 original is at `/opt/homebrew/var/postgresql@14`; a dump is in
  `~/cluecrew-backups/`. `cluecrew_shadow` may need recreating for `prisma migrate dev`.
- **The dev DB is not rebuildable from git.** It holds signatures and attribution history that
  exist nowhere else. The encrypted snapshot (§4) carries the content, not the full history.
- **Local dev:** app on port 3100; root `.env` is the single env source. Never run `pnpm build`
  while the dev server is up (both write `apps/web/.next`; recovery is `rm -rf apps/web/.next`).
- **E2E fixtures build their own accounts** (`apps/web/e2e/fixtures.ts`); the seeded test family is
  for manual dev sign-in only. Use `completeFluency` when a session opens on a fluency round.
- **Production and deploy writes need David's explicit yes, each time.** So do governance edits
  the classifier blocks (scanner exclusions, backlog bounds, restoring LIVE status). Ask; never
  work around a block.

## 3. Where the build stands

Measured 2026-11-24 against the dev store (production holds the same content).

| District | LIVE items | with hint | with walk | types | cases (free) |
|---|---|---|---|---|---|
| VR | 618 | **0** | 317 | 21 | 21 (10) |
| English | 379 | 379 | 379 | 7 | 6 (2) |
| Maths | 179 | 179 | 179 | 7 | 1 (0) |
| NVR | 0 | — | — | 0 | 0 |

- **Maths worked examples (R1064):** on for 155 items through `land-replays.ts`, rendered in house
  notation by `packages/core/src/maths/replay-render.ts`, which refuses rather than approximates.
  24 items have no replay by reviewer judgement. Maths routes by `QuestionType.district`
  (`apps/web/lib/crew/maths.ts`); an unknown mechanic is refused, never defaulted.
- **Mock papers:** all 8 blueprints are "PENDING REVIEWER VERIFICATION", so none can be served.
- **Story mode:** dark behind `STORY_MODE`; only a test fixture chapter exists.
- **Phase 5:** no mascot rig yet (drop-in path `apps/web/public/mascot.riv`, state controller ready);
  illustration and sound sets, dashboard review and the AT accessibility session are outside work.
  No `BUILD-PHASE-6.md` exists yet.
- **Billing:** no Stripe keys, so the platform runs TEST-by-absence.

## 4. Infrastructure

- **GitHub:** `main` is clean at `10ec3e1`; CI (checks + lighthouse) green.
- **Encrypted content snapshot:** `packages/db/snapshot.enc` + plain `snapshot.manifest.json`
  (`scripts/content-snapshot.ts`, export / restore / check). AES-256-GCM, manifest digest as AAD.
  The key is `SNAPSHOT_KEY`: in the root `.env` locally and a GitHub Actions secret in CI. **Keep a
  copy of that key somewhere safe outside this machine** — without it the snapshot is unreadable.
  Restore detects whether it runs as a superuser; on Neon (owner is not a superuser) it uses
  `ALTER TABLE … DISABLE TRIGGER USER` with foreign keys still enforced.
- **Every apply door re-exports the snapshot** as its last step; commit `snapshot.enc` and the
  manifest with the content change.
- **Vercel:** project `cluecrew-staging`, team scope `private-projects-700758f3`, Root Directory
  `apps/web`. Pushes make PREVIEW builds; production moves only on `vercel promote <deployment>`
  (needs David's yes). Production is `939046c` (`dpl_9aeUytahEguriexK7Cnim9tRHwQT`), health
  `{"ok":true,"db":{"connected":true}}`, `PRELAUNCH=on`. The local Vercel CLI is old (58.x).
- **Neon Postgres 17:** migrated to the latest migration, replay diff clean, 13/13 invariants,
  47,571 content rows loaded (R1066). Test accounts were kept.
- **Pre-load backup of production:** `~/ClueCrew-backups/prod-20261124/` (TSV of all 29 tables).
- **Production secrets** were pulled to the old session's scratchpad only; that copy will be gone.
  Re-pull with `vercel env pull` into a scratch location — never into the repo.
- **SUBTLEX file:** CI fetches it; locally it lives where the root `.env` points.
- **Similarity index:** private storage, path in `SIMILARITY_INDEX_PATH`; a malformed index is
  refused by name (`SimilarityIndexUnreadable`), never crashed on and never skipped.

## 5. Tooling: Prisma 7, zod 4, vitest 5, Next 15.5

- Prisma 7: URLs live in `packages/db/prisma.config.ts`, not `schema.prisma`; use
  `createPrismaClient()` (PrismaPg adapter). `migrate diff` takes `--to-schema` /
  `--to-config-datasource`.
- zod 4: `z.record` needs a key schema. vitest 5: core declares `@types/node` itself.

## 6. How content changes land (agent review doors)

All under `scripts/agent-review/`, with briefs in `content/agent-review/*.md` and per-run folders
beside them. The pattern: a drafter agent writes `proposals.json`; a SEPARATE reviewer agent writes
`proposal-review.json` signed `rev-agent-01`; the door re-runs every gate itself, refuses the whole
batch on any fault, lands only ATTESTed rows, records an AttributionEvent, re-signs over the row
as it now stands, and re-exports the snapshot.

- `land-proposals.ts` (`--precheck` / `--apply` / `--from-live`) and the publish door
  (`--door=<case> --ready --apply`);
- `land-option-lines.ts` (Addendum 36 option notes);
- `land-solutions.ts` (Maths solution expressions);
- `land-replays.ts` (Maths worked examples).

## 7. Open items, in the order I'd take them

**To let a few families test (David's to supply or decide):**
1. `RESEND_API_KEY` in production (emails and error alerts go nowhere without it).
2. A real `NEXT_PUBLIC_CONTACT_EMAIL`.
3. The children's-data / ICO decision (`docs/dpia.md`).
4. How testers get in while `PRELAUNCH=on`.

**Build work an agent can do now:**
5. **VR hints** — 0 of 618. The largest gap a child would notice; same door pattern that landed
   English and Maths hints. Then the ~300 missing VR walk-throughs.
6. More Maths cases (one exists, and it is paid — free testers never meet Maths).
7. Mock-paper blueprint verification (8 pending).
8. Two passage text/line disagreements to verify against the source text when Gutenberg answers:
   `stream-a-03` (its / it's) and `stream-a-16` (than / then).

**Larger, later:** the NVR district (spec exists, nothing built); story chapters; Phase 5 art and
sound; Stripe; child testing per `docs/child-testing-protocol.md`.

## 8. Opening prompt for the new session

> Read `CLAUDE.md`, then `docs/HANDOFF.md`, then the manifesto and the register's latest entries.
> Confirm the dev database is up (`cluecrew_dev`, port 5432) and that `SNAPSHOT_KEY` is in the root
> `.env`. Then tell me where things stand and what you'd do first.
