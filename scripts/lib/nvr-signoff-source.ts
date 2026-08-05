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
 * The four engine families, each shipped as its own reviewer file (David's
 * ruling — a reviewer signs one machine at a time, not a 13-template omnibus).
 * `key` is the template's engineFamily; the child stations are its sectionTypes.
 * The 19 shared misconceptions ride with THE MACHINE (the first file), because
 * the tags cut across every family and asking for them once is enough.
 */
export const NVR_FAMILIES = [
  { key: 'machine', title: 'THE MACHINE', blurb: 'series · matrix · analogy', family: 'nvr-signoff-machine', kind: 'nvr-signoff-machine', misconceptions: true },
  { key: 'lineup', title: 'THE LINE-UP', blurb: 'like · odd one out · counting · codes', family: 'nvr-signoff-lineup', kind: 'nvr-signoff-lineup', misconceptions: false },
  { key: 'turntable', title: 'THE TURNTABLE', blurb: 'rotation · reflection', family: 'nvr-signoff-turntable', kind: 'nvr-signoff-turntable', misconceptions: false },
  { key: 'foldingroom', title: 'THE FOLDING ROOM', blurb: 'nets · fold-and-punch · hidden shapes · plan views', family: 'nvr-signoff-foldingroom', kind: 'nvr-signoff-foldingroom', misconceptions: false },
] as const;

export type NvrFamilyKey = (typeof NVR_FAMILIES)[number]['key'];

/**
 * The LIGHT source the freshness stamp hashes for ONE family file: what the
 * reviewer is actually signing in it. A template's fingerprint already captures
 * every sampled item across every tier, so hashing (id, version, fingerprint)
 * makes the stamp go stale exactly when a signed template's output would change
 * — and stay current through a cosmetic edit to the pack layout. THE MACHINE's
 * source also carries the misconception rows, because approving them is part of
 * that file's signature; the other three do not repeat them.
 *
 * Pure over an already-built pack so the exporter (which builds the pack once
 * for all four files) and the checker (which rebuilds per file) serialise the
 * SAME bytes — the whole point of one shared builder behind both sides.
 */
export function familySource(pack: NvrSignoff, key: NvrFamilyKey): unknown {
  const fam = NVR_FAMILIES.find((f) => f.key === key);
  return {
    templates: pack.templates
      .filter((t) => t.engineFamily === key)
      .map((t) => ({ id: t.id, version: t.version, fingerprint: t.fingerprint })),
    misconceptions: fam?.misconceptions
      ? pack.misconceptions.map((m) => ({ id: m.id, description: m.description, childHint: m.childHint, status: m.status }))
      : [],
  };
}

/** The checker's entry point: rebuild the pack, then the family's light source. */
export async function buildNvrSignoffFamilySource(prisma: PrismaClient, key: NvrFamilyKey): Promise<unknown> {
  return familySource(await buildNvrSignoff(prisma), key);
}
