/**
 * THE NVR TEMPLATE SIGN-OFF SOURCE — shared by the exporter and the freshness
 * checker, so the file the reviewer receives and the "is it still current?"
 * test read the SAME content (David's ruling, 2026-08-02 — a stamp is inert
 * without one shared builder behind both sides).
 *
 * What the reviewer signs in this district is different from VR/English/Maths,
 * and the shape here encodes that difference. She does not sign 1,950 items —
 * NVR items are generated on demand and never stored. She signs a TEMPLATE
 * VERSION: a (template id, version) whose deterministic output she has seen a
 * 30-per-tier sample of. Every item that version ever generates inherits her
 * approval, and any change to the template moves its FINGERPRINT, which voids
 * the signature (BUILD-DISTRICT-NVR §6; the same fingerprint CI already gates
 * a silent template change with).
 *
 * The freshness SOURCE below is therefore the fingerprints and versions — not
 * the 29 MB of rendered SVG. If a template's output changes at all, its
 * fingerprint changes and the stamp goes stale; cosmetic layout changes to the
 * pack do not. The 19 PROPOSED misconceptions travel with it because a
 * distractor tag that is not ACTIVE cannot serve, so the pack that asks her to
 * sign the templates asks her to approve the tags in the same pass.
 */
import type { PrismaClient } from '@prisma/client';
import {
  NVR_MISCONCEPTION_IDS,
  NVR_TEMPLATES,
  SAMPLES_PER_TIER,
  TIERS,
  buildSampleSheet,
  templateFingerprint,
  type GeneratedNvrItem,
  type NvrTemplate,
} from '@cluecrew/core';

export interface SignoffTierSheet {
  tier: number;
  items: GeneratedNvrItem[];
  /** Seeds the generator refused (ambiguous) — reported, never hidden. */
  failures: number;
}

export interface SignoffTemplate {
  id: string;
  version: number;
  engineFamily: string;
  sectionType: string;
  glPool: boolean;
  /** Voids the signature when it moves. Shown on the sign-off line. */
  fingerprint: string;
  tiers: SignoffTierSheet[];
}

export interface SignoffMisconception {
  id: string;
  description: string;
  childHint: string;
  status: string;
  /** True when the row is missing from the DB entirely (a real gap to flag). */
  missing: boolean;
}

export interface NvrSignoff {
  templates: SignoffTemplate[];
  misconceptions: SignoffMisconception[];
  samplesPerTier: number;
  tiers: readonly number[];
}

function sheetFor(template: NvrTemplate): SignoffTemplate {
  const tiers = TIERS.map((tier) => {
    const sheet = buildSampleSheet(template, tier);
    return { tier, items: sheet.items, failures: sheet.failures };
  });
  return {
    id: template.id,
    version: template.version,
    engineFamily: template.engineFamily,
    sectionType: template.sectionType,
    glPool: template.glPool,
    fingerprint: templateFingerprint(template),
    tiers,
  };
}

/**
 * The full pack: every template's 30-per-tier sample sheet plus the 19 PROPOSED
 * misconceptions read from the DB (so their descriptions and child hints are the
 * ones the approval door will serve, not a copy).
 */
export async function buildNvrSignoff(prisma: PrismaClient): Promise<NvrSignoff> {
  const rows = await prisma.misconception.findMany({
    where: { id: { in: [...NVR_MISCONCEPTION_IDS] } },
    select: { id: true, description: true, childHint: true, status: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const misconceptions: SignoffMisconception[] = NVR_MISCONCEPTION_IDS.map((id) => {
    const row = byId.get(id);
    return row
      ? { id, description: row.description, childHint: row.childHint, status: row.status, missing: false }
      : { id, description: '', childHint: '', status: 'MISSING', missing: true };
  });

  return {
    templates: NVR_TEMPLATES.map(sheetFor),
    misconceptions,
    samplesPerTier: SAMPLES_PER_TIER,
    tiers: TIERS,
  };
}

/**
 * The LIGHT source the freshness stamp hashes: what the reviewer is actually
 * signing. A template's fingerprint already captures every sampled item across
 * every tier, so hashing (id, version, fingerprint) makes the stamp go stale
 * exactly when a signed template's output would change — and stay current
 * through a cosmetic edit to the pack layout. The misconception rows travel in
 * the hash because approving them is part of the same signature.
 */
export async function buildNvrSignoffSource(prisma: PrismaClient): Promise<unknown> {
  const pack = await buildNvrSignoff(prisma);
  return {
    templates: pack.templates.map((t) => ({ id: t.id, version: t.version, fingerprint: t.fingerprint })),
    misconceptions: pack.misconceptions.map((m) => ({
      id: m.id,
      description: m.description,
      childHint: m.childHint,
      status: m.status,
    })),
  };
}
