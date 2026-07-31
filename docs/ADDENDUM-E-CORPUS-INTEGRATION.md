# ADDENDUM E: CORPUS INTEGRATION PIPELINE
### ClueCrew Build Bible — Addendum — v1.0
**Governs how outputs from the Corpus Analyst skill enter the product. Manifesto (esp. L4) and the Corpus Analyst firewall win all conflicts. Core principle: corpus findings are EVIDENCE, not instructions — every change they motivate passes through a named human approval and an existing content door. No corpus-derived text ever enters the item bank directly.**

---

## 1. THE PIPELINE (one page, whole picture)

```
Cowork (Corpus Analyst)          Human approval                Existing door
─────────────────────────        ─────────────────────         ─────────────────────
blueprint-evidence.json    →     Specialist reviewer signs  →  /content/blueprints/*.json (verified)
difficulty-map.json        →     David + reviewer ratify    →  intensity/tier + Okafor batch-mix config
distractor-patterns.md     →     Reviewer approves each     →  CMS misconception bulk import (NEW, small)
  + proposedMisconceptions
vocab-findings.json        →     Reviewer approves list     →  Okafor Word-card drafts → CMS Word import
teaching-notes.md          →     David triages              →  Case/Walk content pipeline + spec-change log
similarity-index/          →     none (protective)          →  CI + CMS batch gate (NEW — the one engine piece)
```

Every ratified decision is logged in `/docs/corpus-decisions.md`: finding → decision → who → date. This file is the audit trail proving analysis-not-copying if ever questioned, alongside the firewall attestations.

## 2. ARTEFACT CONTRACTS (machine-consumed files only)

Cowork's outputs that machines read must be schema-stable; CI validates on ingest:
- **`misconception-import.json`:** `[{id, district, description, childHint, sourcePattern: "corpus-pattern-ref", proposedBy: "ai-corpus:v1", approvedBy: null}]` — import lands them as PROPOSED; CMS shows a review queue; reviewer approval sets `approvedBy` and activates. Un-approved misconceptions cannot be referenced by items (server-enforced, same pattern as item review).
- **`batch-mix.json`:** per-district tier distribution + type weights for Okafor batches, derived from difficulty-map, ratified values only. Okafor reads this file; she never reads the difficulty map directly (keeps generation two steps from the corpus — firewall depth).
- **`similarity-index/`:** hashed n-gram + structural fingerprints per source item; regenerable from the private folder; contains no reconstructable content (spot-audited at gate). Stored in private object storage; CI fetches read-only.
- Human-read artefacts (blueprint-evidence, teaching-notes, distractor-patterns prose) need no schema; they carry the inventory-id citations and attestation line per the Analyst skill.

## 3. THE SIMILARITY GATE (the new engineering)

- Runs at CMS bulk-import validation AND in CI on `/content` changes: every incoming item's stem+options are fingerprinted the same way and compared against the index.
- **Thresholds:** exact/near-exact structural match = hard fail (batch rejected, item quoted BY ID ONLY in the error — never echo matched source text). High-similarity = item flagged `SIMILARITY_REVIEW`, blocked from REVIEWED status until the human reviewer clears it with a note.
- False-positive escape: reviewer clearance with reason, logged. (Some resemblance is inevitable — there are only so many ways to ask a T1 letter-code question; the gate protects against *derivation*, the reviewer judges *coincidence*.)
- The gate also runs retroactively once, over all existing DRAFT items, when the index first lands.
- Threshold values are config, tuned in week one against known-original seed items (false-positive rate) and a handful of deliberately-derived test items David authors privately (detection rate — these test items are destroyed after tuning, never imported).

## 4. SEQUENCED ROLLOUT (what happens in what order)

1. **Now (Cowork):** apply the inventory rulings — `statisticalWeight: 0` on duplicate pair members and hash-matching alternates; exclude orphaned answer keys and fragments from question-level passes. Then run the VR pass in the agreed priority order.
2. **Code, one scoped session:** build §3 similarity gate + §2 misconception PROPOSED-import; nothing else.
3. **Reviewer's first sitting (one session, three jobs):** 40-item Okafor trial batch review · blueprint verification against blueprint-evidence.json · misconception queue approval. This single sitting closes or advances three red gates.
4. **You:** ratify batch-mix + any tier-config proposals; triage teaching-notes into Case-revision tickets vs spec-change proposals.
5. **Okafor volume runs begin** — reading approved misconceptions and ratified batch-mix, checked by the live similarity gate, reviewed by the calibrated human. The pipeline is then fully closed-loop.

## 5. NON-GOALS

No corpus browser UI, no automatic config updates from analysis, no corpus text in any prompt context (including "just as style reference"), no serving or displaying source papers anywhere, no similarity-index contents in the main repo.

## 6. GATE CHECKLIST

1. Similarity gate: hard-fail and flag paths demonstrated; error messages verified to contain no source text; retro-scan of existing DRAFTs run and results triaged.
2. Threshold tuning evidence recorded (false-positive rate on seed originals; detection on David's test derivations; test items destroyed).
3. Misconception import: PROPOSED → approval → active flow works; un-approved ids provably unusable by items.
4. `/docs/corpus-decisions.md` exists with the first ratified decisions logged in the correct format.
5. Index spot-audit: sampled fingerprints confirmed non-reconstructable; storage private; CI access read-only.
6. Duplicate weighting confirmed applied in the first analysis artefacts (blueprint evidence cites weighted counts).
7. One full loop demonstrated end-to-end: corpus pattern → proposed misconception → approval → Okafor item using it → similarity gate pass → human review → LIVE.

---
*Changelog: v1.0 — corpus integration pipeline, similarity gate, approval contracts.*
