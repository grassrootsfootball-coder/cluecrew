/**
 * The NVR district's automated gates (BUILD-DISTRICT-NVR §7, items 2, 5, 6, 7).
 * Pure — no database, so it runs early in CI and fails fast.
 *
 *   #2  determinism: same (template, version, seed) → byte-identical item
 *   #5  colourblind-safe: no item encodes meaning in hue alone, over ≥1,000
 *       sampled items, and a deliberately hue-only fixture FAILS
 *   #6  density caps enforced per tier, and a deliberately over-dense
 *       template version FAILS
 *   #7  practice / Boss Round / mock seed ranges are provably disjoint
 *
 * Also checks what the plan and the generators say about each other: every
 * slot in content/nvr-district-plan.json must name a template that exists,
 * with the engine and section type the template actually has, and the GL
 * section pool must be fully covered by GL-pool templates.
 *
 * Run: pnpm check:nvr
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  NVR_CONFIG,
  NVR_MISCONCEPTION_IDS,
  NVR_TEMPLATES,
  SAMPLES_PER_TIER,
  TIERS,
  buildSampleSheet,
  checkColourblindSafe,
  checkPlainText,
  checkDensity,
  checkItem,
  glPoolSectionTypes,
  sampleSeeds,
  seedRangesDisjoint,
  templateById,
  templateFingerprint,
  type GeneratedNvrItem,
} from '../packages/core/src/index';

const failures: string[] = [];
function fail(gate: string, detail: string): void {
  failures.push(`[${gate}] ${detail}`);
}

// --- Gate #2: determinism -------------------------------------------------
let determinismChecks = 0;
for (const template of NVR_TEMPLATES) {
  for (const tier of TIERS) {
    for (const seed of [0, 3, 97, 4242, 999_983]) {
      const first = JSON.stringify(template.generate(seed, tier));
      const second = JSON.stringify(template.generate(seed, tier));
      determinismChecks += 1;
      if (first !== second) {
        fail('gate 2', `${template.id}@${template.version} seed ${seed} T${tier} is not reproducible`);
      }
    }
  }
  // The fingerprint must also be stable — it is what voids a signature.
  if (templateFingerprint(template) !== templateFingerprint(template)) {
    fail('gate 2', `${template.id} fingerprint is unstable`);
  }
}

// --- Gates #5 and #6 over the full sample space ---------------------------
let sampled = 0;
for (const template of NVR_TEMPLATES) {
  for (const tier of TIERS) {
    const sheet = buildSampleSheet(template, tier);
    sampled += sheet.items.length;
    for (const failure of sheet.failures) {
      fail(
        failure.check === 'density-cap' ? 'gate 6' : failure.check === 'colour-only-meaning' ? 'gate 5' : 'gate 3',
        failure.detail,
      );
    }
  }
}
if (sampled < 1000) {
  fail('gate 5', `only ${sampled} items sampled; the audit calls for at least 1,000`);
}

// --- The checks must actually bite: deliberately bad fixtures -------------
const overDenseItem: GeneratedNvrItem = (() => {
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
    templateId: 'fixture-overdense',
    templateVersion: 1,
    seed: 1,
    tier: 1,
    engineFamily: 'lineup',
    sectionType: 'like-classification',
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
})();
if (checkDensity(overDenseItem).length === 0) {
  fail('gate 6', 'a deliberately over-dense item PASSED the density cap — the check is not biting');
}

const square = { kind: 'square' as const, size: 2 as const, rotation: 0, pattern: 'solid' as const, x: 1, y: 1 };
const hueOnlyItem: GeneratedNvrItem = {
  ...overDenseItem,
  tier: 3,
  panels: [{ elements: [{ ...square, tone: 'ink' as const }] }],
  options: [
    { visual: { elements: [{ ...square, tone: 'ink' as const }] }, isCorrect: true, misconceptionId: null },
    { visual: { elements: [{ ...square, tone: 'violet' as const }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
    { visual: { elements: [{ ...square, tone: 'ink' as const, rotation: 45 }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
    { visual: { elements: [{ ...square, tone: 'ink' as const, size: 1 as const }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
    { visual: { elements: [{ ...square, tone: 'ink' as const, pattern: 'dots' as const }] }, isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
  ],
};
if (checkColourblindSafe(hueOnlyItem).length === 0) {
  fail('gate 5', 'a hue-only option set PASSED the colourblind check — the check is not biting');
}

// --- Every generated prompt is child-facing copy --------------------------
// The repo's reading-age lint walks authored JSON, so generated prompts would
// otherwise be the one piece of child-facing text nothing checks. Same rule,
// same thresholds — checkPlainText is the function the English district's
// stems-plain gate uses.
const promptFailures = new Set<string>();
for (const template of NVR_TEMPLATES) {
  for (const tier of TIERS) {
    const item = template.generate(sampleSeeds(template.id, template.version, tier)[0]!, tier);
    for (const failure of checkPlainText(`${template.id} prompt`, item.prompt)) {
      promptFailures.add(`${failure.where}: ${failure.detail}`);
    }
  }
}
for (const detail of promptFailures) fail('reading age', detail);

// --- Gate #7: exposure partitioning ---------------------------------------
if (!seedRangesDisjoint()) {
  fail('gate 7', 'practice / Boss Round / mock seed ranges are not disjoint');
}

// --- Plan ↔ generator agreement -------------------------------------------
const plan = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../content/nvr-district-plan.json'), 'utf8'),
) as {
  slots: Array<{ id: string; engine: string; template: string; sectionType: string; glPool: boolean }>;
};
for (const slot of plan.slots) {
  const template = templateById(slot.template);
  if (!template) {
    fail('plan', `${slot.id} names template "${slot.template}", which does not exist`);
    continue;
  }
  if (template.engineFamily !== slot.engine) {
    fail('plan', `${slot.id}: plan says engine ${slot.engine}, template says ${template.engineFamily}`);
  }
  if (template.sectionType !== slot.sectionType) {
    fail('plan', `${slot.id}: plan says ${slot.sectionType}, template says ${template.sectionType}`);
  }
  if (template.glPool !== slot.glPool) {
    fail('plan', `${slot.id}: plan and template disagree on GL-pool membership`);
  }
}

// --- SCP-NVR-1/3: the GL pool is covered, and only by GL-pool templates ----
const covered = glPoolSectionTypes();
for (const section of NVR_CONFIG.glSectionPool) {
  if (!covered.includes(section)) {
    fail('SCP-NVR-1', `GL section "${section}" has no GL-pool template`);
  }
}
const NEVER_IN_GL = ['reflection-identification', 'nets', 'plan-views', 'fold-punch', 'hidden-shapes'];
for (const template of NVR_TEMPLATES.filter((entry) => entry.glPool)) {
  if (NEVER_IN_GL.includes(template.sectionType)) {
    fail('SCP-NVR-3', `${template.id} is marked GL-pool but its section type never appears in GL blueprints`);
  }
}

// --- P3: every distractor executes an entry from the proposed library ------
const usedMisconceptions = new Set<string>();
for (const template of NVR_TEMPLATES) {
  for (const tier of TIERS) {
    for (const item of buildSampleSheet(template, tier).items) {
      for (const option of item.options) {
        if (!option.isCorrect && option.misconceptionId) usedMisconceptions.add(option.misconceptionId);
      }
      for (const failure of checkItem(item)) {
        if (failure.check === 'misconception-mapping') fail('gate 3', failure.detail);
      }
    }
  }
}
const unused = NVR_MISCONCEPTION_IDS.filter((id) => !usedMisconceptions.has(id));

// --- Report ---------------------------------------------------------------
console.log(
  `NVR generator checks: ${NVR_TEMPLATES.length} templates · ${determinismChecks} determinism probes · ` +
    `${sampled} sampled items (${SAMPLES_PER_TIER} per tier per template) · ` +
    `${usedMisconceptions.size}/${NVR_MISCONCEPTION_IDS.length} proposed misconceptions executed.`,
);
if (unused.length > 0) {
  // Not a failure: some entries describe formats this district serves only in
  // practice mode, or await a template. Visible, so it stays a decision.
  console.log(`  Not yet executed by any constructor: ${unused.join(', ')}`);
}
if (failures.length > 0) {
  console.error(`\nNVR generator checks FAILED (${failures.length}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log('All NVR generator gates passed (determinism, density, colourblind, exposure, plan agreement).');
