/**
 * The serving door (BUILD-DISTRICT-NVR §4 + gate #2): items from a template
 * version serve ONLY when
 *
 *   1. that exact (templateId, version) carries a reviewer signature,
 *   2. the signature's fingerprint still matches the template's behaviour
 *      (a changed template with an unbumped version is a voided signature,
 *      not a serving template), and
 *   3. every misconception id the template's distractors execute is ACTIVE —
 *      PROPOSED entries are the reviewer's queue, not servable content
 *      (Addendum E §2; the constructors may reference them, children may
 *      never meet them).
 *
 * This module is pure — the database rows come in as plain values — so the
 * rule is unit-testable; apps/web/lib/nvr wraps it with the actual queries.
 *
 * Seed-range exposure partitioning (spec §3): practice, Boss Rounds and mock
 * papers draw from provably disjoint ranges, so the Addendum B burn rule
 * holds by construction, forever.
 */
import { SEED_RANGES, type SeedKind } from './config';
import { checkItem } from './checks';
import type { GeneratedNvrItem, NvrTemplate } from './templates';

export interface NvrSignature {
  templateId: string;
  version: number;
  /** Behavioural fingerprint at signing time (samples.ts templateFingerprint). */
  fingerprint: string;
  signedBy: string;
}

export interface MisconceptionState {
  id: string;
  /** Only ACTIVE serves. PROPOSED is awaiting a reviewer; REJECTED was
   *  refused by one and kept (soft reject) — both are equally unusable. */
  status: 'PROPOSED' | 'ACTIVE' | 'REJECTED';
}

export type ServeRefusal =
  | { ok: false; reason: 'unsigned-version'; detail: string }
  | { ok: false; reason: 'voided-signature'; detail: string }
  | { ok: false; reason: 'misconception-not-active'; detail: string }
  | { ok: false; reason: 'failed-checks'; detail: string }
  | { ok: false; reason: 'seed-out-of-range'; detail: string };

export type ServeVerdict = { ok: true; item: GeneratedNvrItem } | ServeRefusal;

export function seedInRange(kind: SeedKind, seed: number): boolean {
  const range = SEED_RANGES[kind];
  return seed >= range.from && seed < range.to;
}

/** The disjointness proof the gate wants (#7), as a checkable function. */
export function seedRangesDisjoint(): boolean {
  const ranges = Object.values(SEED_RANGES).sort((a, b) => a.from - b.from);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index]!.from < ranges[index - 1]!.to) return false;
  }
  return ranges.every((range) => range.from < range.to);
}

/**
 * Generate an item for serving, or refuse with the exact rule that blocked
 * it. Every serve re-runs the fairness checks on the one item it built —
 * cheap, and it means a bad item cannot reach a child even if a sampling
 * check somehow missed its seed.
 */
export function serveNvrItem(input: {
  template: NvrTemplate;
  currentFingerprint: string;
  signature: NvrSignature | null;
  misconceptions: MisconceptionState[];
  kind: SeedKind;
  seed: number;
  tier: number;
}): ServeVerdict {
  const { template, currentFingerprint, signature, misconceptions, kind, seed, tier } = input;
  if (!signature || signature.version !== template.version) {
    return {
      ok: false,
      reason: 'unsigned-version',
      detail: `${template.id}@${template.version} has no reviewer signature — unsigned versions cannot serve`,
    };
  }
  if (signature.fingerprint !== currentFingerprint) {
    return {
      ok: false,
      reason: 'voided-signature',
      detail: `${template.id}@${template.version} changed since it was signed — bump the version and re-review`,
    };
  }
  if (!seedInRange(kind, seed)) {
    return {
      ok: false,
      reason: 'seed-out-of-range',
      detail: `seed ${seed} is outside the ${kind} range — exposure partitioning is not optional`,
    };
  }
  const item = template.generate(seed, tier);
  const byId = new Map(misconceptions.map((entry) => [entry.id, entry.status]));
  for (const option of item.options) {
    if (option.isCorrect || !option.misconceptionId) continue;
    const status = byId.get(option.misconceptionId);
    if (status !== 'ACTIVE') {
      return {
        ok: false,
        reason: 'misconception-not-active',
        detail: `${option.misconceptionId} is ${status ?? 'missing from the library'} — the reviewer's approval is the door (Addendum E §2)`,
      };
    }
  }
  const failures = checkItem(item);
  if (failures.length > 0) {
    return {
      ok: false,
      reason: 'failed-checks',
      detail: failures.map((failure) => failure.detail).join('; '),
    };
  }
  return { ok: true, item };
}

/**
 * What actually travels to the child's device: no isCorrect flag, no
 * misconception tags — grading happens server-side, exactly like mock
 * sittings. The option order is already seeded by the generator.
 */
export function childPayload(item: GeneratedNvrItem) {
  return {
    templateId: item.templateId,
    templateVersion: item.templateVersion,
    seed: item.seed,
    tier: item.tier,
    engineFamily: item.engineFamily,
    sectionType: item.sectionType,
    prompt: item.prompt,
    panels: item.panels,
    panelLabels: item.panelLabels,
    stemDecoration: item.stemDecoration,
    optionDecoration: item.optionDecoration,
    options: item.options.map((option, index) => ({
      id: `${item.templateId}:${item.seed}:${index}`,
      visual: option.visual,
      codeLabel: option.codeLabel,
    })),
  };
}

export type NvrChildPayload = ReturnType<typeof childPayload>;

/** Server-side grading for an option index chosen by the child. */
export function gradeNvrChoice(item: GeneratedNvrItem, optionIndex: number) {
  const option = item.options[optionIndex];
  if (!option) return null;
  return { correct: option.isCorrect, misconceptionId: option.misconceptionId };
}
