/**
 * REVIEWER STATUS — `pnpm export:reviewer-status`.
 *
 * One consolidated queue for the specialist reviewer: everything waiting on her,
 * in priority order, with a realistic time estimate against each. Delivered to
 * the Cowork outbound folder, hash-named and freshness-stamped so she can tell a
 * current copy from a stale one. The live DB counts ground the numbers; the
 * per-batch figures (VR bundle, maths calibration, English scope) are cited from
 * the artefacts that carry them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../packages/db/src/index';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'reviewer-status';
const TODAY = new Date().toISOString();

/** The counts that make the queue current — the freshness source. DB-grounded
 * where possible; batch figures cited from the delivered artefacts. */
export async function buildReviewerStatusSource(prisma: PrismaClient): Promise<Record<string, number>> {
  return {
    vrLive: await prisma.item.count({ where: { questionType: { district: 'VR' }, status: 'LIVE' } }),
    vrChanged: 127, // vr-reimport-bundle
    vrStaleScripts: 100, // vr-reimport-bundle
    nvrTemplates: 13,
    nvrProposed: await prisma.misconception.count({ where: { district: 'NVR', status: 'PROPOSED' } }),
    mathsCalibration: 40,
    mathsBundledIds: 11,
    mathsUnmapped: 20,
    englishScope: 390,
    englishImported: await prisma.item.count({ where: { questionType: { district: 'ENGLISH' } } }),
  };
}

async function main(): Promise<void> {
  const c = await buildReviewerStatusSource(prisma);
  const stamp = artefactStamp(c, TODAY, 'status', 'what is waiting for review, and in what order');
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');

  const md = `# Review queue — what's waiting, in order

${stampHeader(stamp, 'md')}

Four content jobs plus two small ones. They are ordered by urgency, not size —
the first is live and actively teaching the wrong thing, so it comes first even
though it is not the biggest. Rough total across everything: **40–48 hours**, so
this is weeks of sittings, not a day. Estimates assume unbroken review time at a
steady pace; halve your day-rate for meetings and fatigue.

| # | Job | Volume | Realistic time | Why here |
|---|---|---|---|---|
| **1** | **VR re-import** | 127 items changed · 100 walk-scripts to rewrite | **8–10 hrs** (2–3 sittings) | Live content, teaching the wrong diagnosis right now |
| **2** | **NVR sign-off** | 13 templates + 22 misconceptions | **2.5–3 hrs** | Lightest per item; unblocks the whole district |
| **3** | **Maths calibration** | 40 items · 11 ids to split · 20 unmapped distractors | **3.5–4 hrs** | Ready to import once the ids resolve |
| **4** | **English** | ~390 items + walk-scripts, never reviewed | **25–30 hrs** (multi-day) | Biggest, but nothing is live yet — no active harm |
| + | vr-15 misconception drafting | 1 misconception, your wording | **20–30 min** | Small; blocks part of job 1 |
| + | VR pattern samples | 40 items (vr-04, vr-07) | **30–45 min** | Spot-check, no rewriting |

---

## 1 · VR re-import — start here

**Why first.** These items are LIVE. The keys are correct — no child is marked
wrong — but the *distractor diagnoses* are wrong, so when a child picks a wrong
answer the "why" they are shown is wrong. That is active mis-teaching, and it is
the only job on this list where something incorrect is in front of children now.

**What to do.** Work the \`vr-reimport-bundle\` (in your VR folder). Per item it
shows the old options beside the new derived ones and your current walk-script,
flagged where it names an option that no longer exists.
- **${c.vrChanged} items changed** across vr-01/03/07/09/11 (vr-14 needed no change).
- **${c.vrStaleScripts} walk-scripts to rewrite** — vr-07 and vr-11 also have new
  stems (new numbers), so read those fresh. vr-03's 23 are tag-only, scripts stay valid.
- Approve the new distractors, rewrite the scripts, re-sign. Then we re-import and
  the derivability gate keeps this class of error out from then on.

**Estimate.** ~100 rewrites at ~5 min each plus ~27 tag-only checks ≈ **8–10 hrs**,
best split over two or three sittings. This clears the only live defect.

## 2 · NVR sign-off — the light one

**What to do.** Off the four refreshed packs (in your NVR folder): sign **13
template versions** and approve **${c.nvrProposed} misconceptions** (19 original +
3 new corpus additions — wrong-direction, partial-reflection, duplicated-face).
You sign a template *version*, and every item it generates inherits the sign-off;
the samples are your evidence, so this is the lightest job per item of content.

**Estimate.** ~10 min per template to flip through its 30-per-tier sample, ~1–2 min
per misconception ≈ **2.5–3 hrs**. Doing this unblocks the whole NVR district.

## 3 · Maths calibration

**What to do.** The 40-item calibration batch needs a pass: confirm each item is
sound, **split the 11 bundled misconception ids** into their distinct modes, and
**map the 20 unmapped distractors** to real ids. Once the ids resolve, the batch
is importable (a distractor may only reference an approved id).

**Estimate.** ~40 items at ~2.5 min, 11 splits at ~5 min, 20 maps at ~3 min ≈
**3.5–4 hrs**.

## 4 · English — the big one

**What to do.** ~${c.englishScope} items and their walk-scripts, never reviewed —
the largest single job here. Nothing is live yet, so there is no active harm and
it sits last despite the size; but it is the long pole and worth starting a steady
daily slice of in parallel with the others.

**Estimate.** ~${c.englishScope} items at ~4 min each (item + script) ≈ **25–30 hrs**,
i.e. multi-day. (${c.englishImported} are imported to the platform so far; the rest
are in the pipeline — confirm the full scope with David before you plan the weeks.)

---

## The two small pieces

- **vr-15 "didn't chain the clues"** — one new misconception to draft in your own
  wording. The corpus confirmed the gap: in the reading-information items the
  middle person (named in both clues) who never chains them is a distinct error
  from first-mention and from clue-flip, and there is no id for it yet. ~20–30 min,
  and it releases the vr-15 part of job 1.
- **VR pattern samples** — the two random 20-item pulls (vr-04 closest-meaning,
  vr-07 letters-for-numbers) in your VR folder. A spot-check that the option
  skeleton and the P+Q shape hold across the bank; no rewriting. ~30–45 min.

---

## Suggested order of sittings

1. vr-15 drafting (30 min) → then it's off your plate and unblocks vr-15 rewrites.
2. VR re-import, sitting one (~3–4 hrs) — the live defect, highest value.
3. NVR sign-off (~3 hrs) — a clean win that unblocks a whole district.
4. VR re-import, remaining sittings + pattern-sample spot-check.
5. Maths calibration (~4 hrs).
6. English — a daily slice, started in parallel from now, since it is the long pole.
`;

  mkdirSync(OUT_DIR, { recursive: true });
  const mdPath = join(OUT_DIR, `${base}.md`);
  writeFileSync(mdPath, md);
  const manifestPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(manifestPath, JSON.stringify({ kind: FAMILY, ...stamp, counts: c, artifacts: [`${base}.md`] }, null, 2));

  console.log(`Reviewer status — 4 jobs + 2 small · sourceHash ${stamp.sourceHash}`);
  for (const p of [mdPath, manifestPath]) deliver(p, FAMILY);
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith('export-reviewer-status.ts')) void main();
