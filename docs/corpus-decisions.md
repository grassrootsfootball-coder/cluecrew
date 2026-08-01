# Corpus decisions log

The audit trail ADDENDUM-E §1 requires: every ratified decision that a corpus
finding motivated — finding → decision → who → date. This file, alongside the
firewall attestations, is the record proving analysis-not-copying if ever
questioned.

Format, one entry per decision:

> **Finding:** (artefact + citation id, e.g. `blueprint-evidence.json` /
> `inventory-vr-042`) · **Decision:** what changed and where ·
> **Who:** name(s) · **Date:** YYYY-MM-DD

---

- **Finding:** `inventory.json` (2026-07-31 inventory pass) rulings —
  1 exact-duplicate VR pair, 3 byte-identical NVR&Maths copies not staged.
  **Decision:** duplicate pair members and hash-matching alternates get
  `statisticalWeight: 0`; orphaned answer keys and fragments excluded from
  question-level passes (Addendum E §4.1). Applied in Cowork before the VR
  pass. **Who:** David (ruling), Corpus Analyst skill (application).
  **Date:** 2026-07-31.

- **Finding:** n/a — engineering prerequisite. **Decision:** similarity gate
  (§3) and misconception PROPOSED-import (§2) built and tested; thresholds
  shipped as config at hardFail 0.85 / review 0.60 pending week-one tuning
  against seed originals and David's private test derivations. **Who:** built
  per David's scoped instruction; threshold ratification PENDING David +
  reviewer. **Date:** 2026-08-01.

*(Entries below this line are appended as decisions are ratified.)*

## Entry 1 — four-pass campaign triage (2026-08-01, David)
Full text as ratified by David (SCP-M-1..5, SCP-NVR-1..5); this repo carries
the decisions and their derived config values only — evidence stays in the
private corpus folder, inventory-cited.

**Executed by Code (this entry's ingestion):** similarity index built per
Addendum E §3 (1,495 fingerprints, 86/103 papers; 17 image-only skipped —
OCR owed) → private storage, wired via SIMILARITY_INDEX_PATH; retro scan
over 565 unpublished items: ZERO fails, ZERO review flags. 37 corpus
misconceptions (18 VR + 19 NVR) imported PROPOSED with provenance.
SCP-M-3 plan revision applied (36 slots: +Puzzle 3 via deduction-den,
Stats 4, FDP 5; donors Number 8→6, Ops 6→5 — donor choice flagged for
ratification). SCP-M-2/M-4 → content/batch-mix.json (PROPOSED/ACCEPTED as
ruled). SCP-NVR-1..5 → content/nvr-generator-config.json (RATIFIED values)
+ gl-nvr-standard blueprint authored as draft PENDING REVIEWER VERIFICATION.
Sitting #1 page at /admin/sitting-one.

**Newly arrived since the log (NOT triaged — awaiting David):** the VR pass
evidence landed with four proposals (SCP-VR-1..4: blueprint shape/timing
verification, registry homes for letter-shift ciphers and related-numbers,
demotion of never-observed types in batch mixes, the unscaffolded
read-and-reason teaching convention). Listed in the session report's
ratification block; nothing applied.
