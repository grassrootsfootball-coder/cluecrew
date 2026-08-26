/**
 * A REFUSAL WITH AN ADDRESSEE (Annie's 154th, David's ruling, 2026-08-25 — R712).
 *
 * Her rule, second clause of the pair: **a door that refuses must route the refusal to someone
 * who can act on it.** Five items failed correctly at a gate, every run for six days, and nobody
 * who could repair them was told — *"the gate believed it was protecting children while the items
 * believed they were shipped, and both were right about themselves and wrong about the system."*
 *
 * This is the shared routing path: a door calls it with its refusals and it produces ONE CROSSABLE
 * ARTEFACT naming, per refusal, the SUBJECT, the EXACT FAULT and the PARTY WHO MUST REPAIR IT.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: claim arrival. `deliver()` stages; the receiving store reports
 * arrival by naming the digest (R255). A routed refusal is a refusal that CAN be received.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliver, stampedName } from './export-destination';

export type Repairer = 'cowork' | 'reviewer' | 'this-store';

export interface Refusal {
  /** The row, file or id refused — never a summary. */
  subject: string;
  /** The gate's own words. Captured from the check, never retyped (R649). */
  fault: string;
  /** Who can act. `this-store` means CI is the correct destination and no crossing is owed. */
  repairableBy: Repairer;
  /** Anything the repairer needs that the subject id alone does not carry. */
  context?: Record<string, unknown>;
}

/**
 * Returns the staged file's path, or null when nothing is owed outward — an EMPTY refusal set and
 * a set owned entirely by this store are both "no crossing", and the caller is told which (R61:
 * an empty population states its reason rather than reading as a pass).
 */
export function routeRefusals(input: {
  repoRoot: string;
  door: string;
  refusals: Refusal[];
  note?: string;
}): { staged: string | null; reason: string; outward: number } {
  const outward = input.refusals.filter((r) => r.repairableBy !== 'this-store');
  if (input.refusals.length === 0) {
    return { staged: null, reason: 'NO REFUSALS — nothing to route, and this is a clean run rather than a silent one.', outward: 0 };
  }
  if (outward.length === 0) {
    return {
      staged: null,
      outward: 0,
      reason: `${input.refusals.length} refusal(s), ALL repairable by this store — CI is the correct destination and no crossing is owed. Routing outward would address a party that cannot act.`,
    };
  }
  const artefact = {
    kind: 'refusal-with-an-addressee',
    door: input.door,
    what: `${outward.length} refusal(s) from ${input.door}, each naming the subject, the gate's exact words, and the party who must repair it.`,
    rule: 'a door that refuses must route the refusal to someone who can act on it (R712)',
    note: input.note,
    staged: 'STAGED, not delivered — arrival is the receiving store\'s to report by naming this file\'s digest (R255).',
    refusals: outward,
    heldBack: input.refusals.length - outward.length > 0
      ? { count: input.refusals.length - outward.length, why: 'repairable by this store; CI is their destination and they are not crossed' }
      : undefined,
  };
  const json = JSON.stringify(artefact, null, 1) + '\n';
  const family = `refusals-${input.door.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const name = stampedName(family, createHash('sha256').update(json).digest('hex').slice(0, 16), 'json');
  const local = join(input.repoRoot, 'content/exports', name);
  writeFileSync(local, json);
  deliver(local, family);
  return { staged: local, reason: `${outward.length} refusal(s) routed to their repairer.`, outward: outward.length };
}
