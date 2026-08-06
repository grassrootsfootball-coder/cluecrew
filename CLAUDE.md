# ClueCrew — read this first

The build is governed by documents, and the documents win arguments.

**Read at session start, in this order:**
1. `docs/CLUECREW-MANIFESTO.md` — wins ALL conflicts; amendable only by
   David; deviations are surfaced, never silent. Currently v1.11.
2. The phase spec for whatever you're touching: `docs/BUILD-PHASE-1..6.md`,
   `docs/BUILD-DISTRICT-MATHS.md`, `docs/BUILD-DISTRICT-NVR.md`.
3. `docs/ADDENDUM-A..E` (voice/juice, mock papers, readiness, year/intensity,
   corpus firewall) and `docs/AMENDMENT-1-PRICING-V2.md` (pricing + D7).
4. `docs/CLUECREW-STORY-BIBLE.md` (v1.2, REDACTED — the Grey Umbrella
   identity lives only in David's private files, never in this repo) and
   `docs/LIVE-LAUNCH-PACK-V3.md` + `docs/LAUNCH-PACK-V3.1-TEACHING-ENGINE.md`
   for the public page.

**House rules that recur:**
- All child-facing strings pass `pnpm scan:vocab` and the reading-age lint;
  never exempt a scanner hit — reword it.
- Child-facing sentences end only on a full stop, `?` or `!` — a dash does not
  end a sentence for the ≤16-word reading-age cap (reviewer, 2026-08-05, every
  district). A clause a dash breaks off still counts toward the cap; if a hint
  needs a dash to read, split it into two sentences with a full stop instead.
- Content decisions (items, chapters, misconceptions) go through the CMS
  review pipeline; nothing skips the reviewer.
- A script that applies reviewer decisions RE-EXPORTS the affected artefact as
  its final step (David, 2026-08-06, after the seventh stall on a file that
  lagged the DB): the export must FOLLOW the state change automatically, not
  wait for someone to notice the freshness stamp is stale. Deliver + prune the
  old file. Exports are reusable functions (e.g. `exportMathsMisconceptions`)
  so an apply script can call one directly rather than duplicating it.
- Generated-distractor distribution must be held down deliberately (reviewer,
  2026-08-06, every generated district): a shortcut appears whenever one
  distractor type is both predictable AND over-represented. Generating to
  diagnosis makes each type predictable by design, so a generator must never
  drop a scarce diagnosis to top up an abundant one, and must cap any single
  type (position and frequency) rather than let it become the default filler.
  Ship-rate is a review artifact — export it with every generated bank.
- Local dev: Postgres on 5432, app on 3100, root `.env` is the single env
  source. Never run `pnpm build` while the dev server is up.
- e2e fixtures build their own accounts (`apps/web/e2e/fixtures.ts`); the
  seeded test-family is for manual dev sign-in only.

Brand source assets: `packages/ui/assets/brand/` (served copies stay in
`apps/web/public/`).
