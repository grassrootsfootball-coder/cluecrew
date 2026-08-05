/**
 * Stratified sampling for the generator-level review model (BUILD-DISTRICT-NVR
 * §4): the reviewer signs a template VERSION after inspecting 30 sampled
 * outputs per tier. The sample seeds are a pure function of
 * (templateId, version, tier), so the sheet the reviewer saw is reproducible
 * byte-for-byte forever — the archived artefact is the fingerprint plus the
 * generator, not a filing cabinet of PDFs. The same fingerprint is what the
 * quarterly drift check re-computes.
 */
import { rng } from './grammar';
import { checkItem, type NvrCheckFailure } from './checks';
import type { GeneratedNvrItem, NvrTemplate } from './templates';

export const SAMPLES_PER_TIER = 30;
export const TIERS = [1, 2, 3, 4, 5] as const;

/**
 * Deterministic, stratified sample seeds: spread across the whole seed space
 * in 30 strata, jittered inside each stratum by the template identity. Not
 * drawn from the serving ranges — samples are for the reviewer's eyes, and
 * keeping them off the serving ranges means a child can never meet a
 * published sample item (exposure hygiene, same spirit as Addendum B).
 */
export function sampleSeeds(templateId: string, version: number, tier: number): number[] {
  const random = rng(`samples:${templateId}@${version}:T${tier}`);
  const stratum = Math.floor(2_147_483_647 / SAMPLES_PER_TIER);
  return Array.from({ length: SAMPLES_PER_TIER }, (_, index) =>
    index * stratum + Math.floor(random() * stratum),
  );
}

export interface SampleSheet {
  templateId: string;
  templateVersion: number;
  tier: number;
  items: GeneratedNvrItem[];
  failures: NvrCheckFailure[];
}

export function buildSampleSheet(template: NvrTemplate, tier: number): SampleSheet {
  const items = sampleSeeds(template.id, template.version, tier).map((seed) =>
    template.generate(seed, tier),
  );
  return {
    templateId: template.id,
    templateVersion: template.version,
    tier,
    items,
    failures: items.flatMap(checkItem),
  };
}

/** FNV-1a over a canonical JSON encoding — stable across runs and platforms. */
export function contentHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= BigInt(text.charCodeAt(index));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

/**
 * The behavioural fingerprint of a template version: a hash over its full
 * five-tier sample output. Any change to the template's behaviour — rule
 * sampler, distractors, prompts, anything — changes this value, which is
 * what lets CI enforce "any template change bumps the version and voids the
 * signature" (§4.2) without trusting anyone to remember.
 */
export function templateFingerprint(template: NvrTemplate): string {
  return contentHash(TIERS.map((tier) => buildSampleSheet(template, tier).items));
}
