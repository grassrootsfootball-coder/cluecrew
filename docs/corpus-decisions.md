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
