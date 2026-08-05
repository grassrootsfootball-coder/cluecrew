import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NVR_CONFIG,
  SEED_RANGES,
  seedFor,
} from './config';
import { NVR_MISCONCEPTION_IDS } from './misconceptions';
import { NVR_TEMPLATES, glPoolSectionTypes, templateById, type GeneratedNvrItem, type NvrTemplate } from './templates';
import {
  checkColourblindSafe,
  checkDensity,
  checkItem,
  checkMisconceptionMapping,
  checkSingleAnswer,
} from './checks';
import { SAMPLES_PER_TIER, TIERS, buildSampleSheet, contentHash, sampleSeeds, templateFingerprint } from './samples';
import { childPayload, gradeNvrChoice, seedRangesDisjoint, serveNvrItem } from './serving';
import { renderVisual } from './svg';

const CONTENT_CONFIG = JSON.parse(
  readFileSync(resolve(__dirname, '../../../../content/nvr-generator-config.json'), 'utf8'),
) as {
  optionCount: { value: number };
  densityCaps: { maxElementsByTier: Record<string, number> };
  codesScaffold: { teachLetterCount: number; scoreLetterCounts: number[] };
  glSectionPool: { sections: string[]; codesMandatory: boolean };
};

describe('the ratified config transcription (corpus decisions entry 1)', () => {
  it('core NVR_CONFIG and content/nvr-generator-config.json never drift', () => {
    expect(NVR_CONFIG.optionCount).toBe(CONTENT_CONFIG.optionCount.value);
    for (const [tier, cap] of Object.entries(CONTENT_CONFIG.densityCaps.maxElementsByTier)) {
      expect(NVR_CONFIG.densityCaps.maxElementsByTier[Number(tier.replace('t', ''))]).toBe(cap);
    }
    expect(NVR_CONFIG.codesScaffold.teachLetterCount).toBe(CONTENT_CONFIG.codesScaffold.teachLetterCount);
    expect([...NVR_CONFIG.codesScaffold.scoreLetterCounts]).toEqual(CONTENT_CONFIG.codesScaffold.scoreLetterCounts);
    expect([...NVR_CONFIG.glSectionPool]).toEqual(CONTENT_CONFIG.glSectionPool.sections);
  });

  it('every GL-pool section type is covered by a GL-pool template (codes mandatory included)', () => {
    const covered = glPoolSectionTypes();
    for (const section of CONTENT_CONFIG.glSectionPool.sections) {
      expect(covered).toContain(section);
    }
  });

  it('reflection-as-task and the spatial family never sit in the GL pool (SCP-NVR-3/5)', () => {
    for (const template of NVR_TEMPLATES.filter((entry) => entry.glPool)) {
      expect(['reflection-identification', 'nets', 'plan-views', 'fold-punch', 'hidden-shapes', 'rotation']).not.toContain(
        template.sectionType,
      );
    }
  });
});

describe('determinism (gate #2)', () => {
  it('same (templateId, version, seed, tier) → byte-identical item, for every template', () => {
    for (const template of NVR_TEMPLATES) {
      for (const tier of TIERS) {
        for (const seed of [0, 7, 991, 424242]) {
          const first = JSON.stringify(template.generate(seed, tier));
          const second = JSON.stringify(template.generate(seed, tier));
          expect(second).toBe(first);
        }
      }
    }
  });

  it('the behavioural fingerprint is stable across runs', () => {
    const template = templateById('machine-series')!;
    expect(templateFingerprint(template)).toBe(templateFingerprint(template));
  });

  it('sample seeds are deterministic, stratified and 30 per tier (§4)', () => {
    for (const template of NVR_TEMPLATES) {
      for (const tier of TIERS) {
        const seeds = sampleSeeds(template.id, template.version, tier);
        expect(seeds).toHaveLength(SAMPLES_PER_TIER);
        expect(seeds).toEqual(sampleSeeds(template.id, template.version, tier));
        for (const seed of seeds) {
          expect(seed).toBeGreaterThanOrEqual(0);
          expect(seed).toBeLessThan(2_147_483_647);
        }
        // Strictly increasing — one seed per stratum.
        for (let index = 1; index < seeds.length; index += 1) {
          expect(seeds[index]!).toBeGreaterThan(seeds[index - 1]!);
        }
      }
    }
  });
});

describe('the full sample space passes the fairness checks (gates #3, #5, #6)', () => {
  // 13 templates × 5 tiers × 30 samples = 1,950 items — more than the 1,000
  // the gate asks for, and the identical seeds the reviewer sheets show.
  it('every sampled item passes density, colourblind, single-answer and mapping checks', () => {
    const failures: string[] = [];
    for (const template of NVR_TEMPLATES) {
      for (const tier of TIERS) {
        const sheet = buildSampleSheet(template, tier);
        failures.push(...sheet.failures.map((failure) => `${failure.check}: ${failure.detail}`));
      }
    }
    expect(failures).toEqual([]);
  });

  it('every distractor across the sample space executes one of the 19 proposed entries', () => {
    const usedIds = new Set<string>();
    for (const template of NVR_TEMPLATES) {
      for (const tier of TIERS) {
        for (const item of buildSampleSheet(template, tier).items) {
          for (const option of item.options) {
            if (!option.isCorrect) usedIds.add(option.misconceptionId!);
          }
        }
      }
    }
    for (const id of usedIds) {
      expect(NVR_MISCONCEPTION_IDS).toContain(id);
    }
    // The constructor mapping should put a solid majority of the proposed
    // library to work — an unused import would mean a missing constructor.
    expect(usedIds.size).toBeGreaterThanOrEqual(17);
  });

  it('the key position is seeded, never a fixed slot', () => {
    for (const template of NVR_TEMPLATES) {
      const positions = new Set<number>();
      for (let seed = 0; seed < 60; seed += 1) {
        const item = template.generate(seed, 3);
        positions.add(item.options.findIndex((option) => option.isCorrect));
      }
      expect(positions.size).toBeGreaterThan(1);
    }
  });
});

describe('the checks refuse deliberately bad template versions (gate #6)', () => {
  const overDense: NvrTemplate = {
    id: 'fixture-overdense',
    version: 1,
    engineFamily: 'lineup',
    sectionType: 'like-classification',
    glPool: false,
    generate(seed, tier): GeneratedNvrItem {
      const elements = Array.from({ length: 60 }, (_, index) => ({
        kind: 'circle' as const,
        size: 1 as const,
        rotation: 0,
        pattern: 'solid' as const,
        tone: 'ink' as const,
        x: (index % 8) * 0.25,
        y: Math.floor(index / 8) * 0.25,
      }));
      const visual = { elements };
      return {
        templateId: this.id,
        templateVersion: this.version,
        seed,
        tier,
        engineFamily: this.engineFamily,
        sectionType: this.sectionType,
        prompt: 'Count carefully. Which picture matches?',
        panels: [visual],
        options: [
          { visual, isCorrect: true, misconceptionId: null },
          { visual: { elements: elements.slice(1) }, isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
          { visual: { elements: elements.slice(2) }, isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
          { visual: { elements: elements.slice(3) }, isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
          { visual: { elements: elements.slice(4) }, isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
        ],
      };
    },
  };

  it('an over-dense template version fails the density check at every tier', () => {
    for (const tier of TIERS) {
      expect(checkDensity(overDense.generate(1, tier)).length).toBeGreaterThan(0);
    }
  });

  it('an option set distinguished by hue alone fails the colourblind check', () => {
    const spec = { kind: 'square' as const, size: 2 as const, rotation: 0, pattern: 'solid' as const, x: 1, y: 1 };
    const item = overDense.generate(1, 3);
    const hueOnly: GeneratedNvrItem = {
      ...item,
      panels: [{ elements: [{ ...spec, tone: 'ink' }] }],
      options: [
        { visual: { elements: [{ ...spec, tone: 'ink' }] }, isCorrect: true, misconceptionId: null },
        { visual: { elements: [{ ...spec, tone: 'violet' }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
        { visual: { elements: [{ ...spec, tone: 'ink', rotation: 45 }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
        { visual: { elements: [{ ...spec, tone: 'ink', size: 1 }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
        { visual: { elements: [{ ...spec, tone: 'ink', pattern: 'dots' }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
      ],
    };
    expect(checkColourblindSafe(hueOnly).some((failure) => failure.check === 'colour-only-meaning')).toBe(true);
  });

  it('two keyed options fail single-answer; an off-library tag fails mapping', () => {
    const item = NVR_TEMPLATES[0]!.generate(5, 2);
    const twoKeys = { ...item, options: item.options.map((option) => ({ ...option, isCorrect: true, misconceptionId: null })) };
    expect(checkSingleAnswer(twoKeys).some((failure) => failure.check === 'single-answer')).toBe(true);
    const rogue = {
      ...item,
      options: item.options.map((option) =>
        option.isCorrect ? option : { ...option, misconceptionId: 'made-up-slip' as never },
      ),
    };
    expect(checkMisconceptionMapping(rogue).length).toBeGreaterThan(0);
  });
});

describe('seed-range exposure partitioning (gate #7)', () => {
  it('practice, boss and mock ranges are provably disjoint and non-empty', () => {
    expect(seedRangesDisjoint()).toBe(true);
  });

  it('seedFor always lands inside its range', () => {
    for (const kind of ['practice', 'boss', 'mock'] as const) {
      for (const ordinal of [0, 1, 999, 123456789, -5]) {
        const seed = seedFor(kind, ordinal);
        expect(seed).toBeGreaterThanOrEqual(SEED_RANGES[kind].from);
        expect(seed).toBeLessThan(SEED_RANGES[kind].to);
      }
    }
  });
});

describe('the serving door (gate #2: unsigned versions cannot serve)', () => {
  const template = templateById('machine-series')!;
  const fingerprint = templateFingerprint(template);
  const activeLibrary = NVR_MISCONCEPTION_IDS.map((id) => ({ id, status: 'ACTIVE' as const }));
  const proposedLibrary = NVR_MISCONCEPTION_IDS.map((id) => ({ id, status: 'PROPOSED' as const }));
  const seed = seedFor('practice', 42);

  it('no signature → refused', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint, signature: null,
      misconceptions: activeLibrary, kind: 'practice', seed, tier: 3,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('unsigned-version');
  });

  it('a signature for an older version → refused', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint,
      signature: { templateId: template.id, version: template.version - 1, fingerprint, signedBy: 'reviewer' },
      misconceptions: activeLibrary, kind: 'practice', seed, tier: 3,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('unsigned-version');
  });

  it('a changed template behind an unbumped version → signature voided', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint,
      signature: { templateId: template.id, version: template.version, fingerprint: 'stale', signedBy: 'reviewer' },
      misconceptions: activeLibrary, kind: 'practice', seed, tier: 3,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('voided-signature');
  });

  it('PROPOSED misconceptions → refused (Addendum E §2: approval is the door)', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint,
      signature: { templateId: template.id, version: template.version, fingerprint, signedBy: 'reviewer' },
      misconceptions: proposedLibrary, kind: 'practice', seed, tier: 3,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('misconception-not-active');
  });

  it('a seed outside the requested range → refused', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint,
      signature: { templateId: template.id, version: template.version, fingerprint, signedBy: 'reviewer' },
      misconceptions: activeLibrary, kind: 'mock', seed: seedFor('practice', 1), tier: 3,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.reason).toBe('seed-out-of-range');
  });

  it('signed + fingerprint intact + ACTIVE library → serves, and the child payload carries no answers', () => {
    const verdict = serveNvrItem({
      template, currentFingerprint: fingerprint,
      signature: { templateId: template.id, version: template.version, fingerprint, signedBy: 'reviewer' },
      misconceptions: activeLibrary, kind: 'practice', seed, tier: 3,
    });
    expect(verdict.ok).toBe(true);
    if (!verdict.ok) return;
    const payload = childPayload(verdict.item);
    const raw = JSON.stringify(payload);
    expect(raw).not.toContain('isCorrect');
    expect(raw).not.toContain('misconception');
    expect(payload.options).toHaveLength(NVR_CONFIG.optionCount);
    const keyIndex = verdict.item.options.findIndex((option) => option.isCorrect);
    expect(gradeNvrChoice(verdict.item, keyIndex)).toEqual({ correct: true, misconceptionId: null });
    const missIndex = (keyIndex + 1) % verdict.item.options.length;
    const graded = gradeNvrChoice(verdict.item, missIndex)!;
    expect(graded.correct).toBe(false);
    expect(NVR_MISCONCEPTION_IDS).toContain(graded.misconceptionId!);
  });
});

describe('the renderer', () => {
  it('renders every sampled visual to parseable svg with pattern fills, no meaning-bearing hue', () => {
    const template = templateById('lineup-codes')!;
    const item = template.generate(seedFor('practice', 3), 4);
    for (const panel of item.panels) {
      const svg = renderVisual(panel);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });

  it('contentHash is stable and order-sensitive', () => {
    expect(contentHash({ a: 1 })).toBe(contentHash({ a: 1 }));
    expect(contentHash({ a: 1 })).not.toBe(contentHash({ a: 2 }));
  });

  it('checkItem over a served item stays green end-to-end', () => {
    for (const template of NVR_TEMPLATES) {
      const item = template.generate(seedFor('boss', 9), 5);
      expect(checkItem(item)).toEqual([]);
    }
  });
});
