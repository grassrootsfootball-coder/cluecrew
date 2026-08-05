/**
 * NVR item templates (BUILD-DISTRICT-NVR §3): a template is (rule sampler,
 * stem composer, key constructor, distractor constructors, difficulty
 * parameters). The KEY IS CORRECT BY CONSTRUCTION — the generator applies
 * the rule; there is nothing to mis-key. Every distractor constructor
 * EXECUTES one named misconception from the 19 corpus-proposed entries
 * (PROPOSED in the reviewer queue; serving is blocked until approval, at
 * the serving layer — serving.ts).
 *
 * Determinism: everything flows from the seeded rng; identical
 * (templateId, version, seed, tier) always builds the identical item. When a
 * sampled rule would produce an ambiguous picture (a reflection that equals a
 * rotation, two options that look the same), the constructor RESAMPLES on the
 * same stream — still deterministic — and refuses loudly after 32 attempts
 * rather than ever emitting a two-answer item.
 *
 * Single-answer-ness is checked against symmetry-aware visual identity
 * (grammar.ts canonical/visualKey), not spec equality: two options that LOOK
 * the same ARE the same. The key's position among the options is seeded —
 * never a fixed slot.
 *
 * Reflection ruling (SCP-NVR-5): in GL-pool templates reflection appears
 * ONLY as a misconception-executor (the mirror-for-rotation distractor),
 * never as the task; reflection-as-task lives in the CEM-style Turntable
 * template alone, and nets/plan-views/fold-punch stay out of GL blueprints
 * (SCP-NVR-3).
 */
import {
  FILL_PATTERNS,
  ROTATABLE_KINDS,
  TONES,
  canonical,
  growSize,
  nextPattern,
  pick,
  reflect,
  reflectHorizontal,
  rng,
  rotate,
  visualKey,
  type FillPattern,
  type ShapeKind,
  type ShapeSpec,
  type Tone,
  type Visual,
} from './grammar';
import { NVR_CONFIG } from './config';
import type { NvrMisconceptionId } from './misconceptions';

export type NvrEngineFamily = 'machine' | 'lineup' | 'turntable' | 'foldingroom';

/** Renderer hints that are part of the stem, not of any shape. */
export type NvrDecoration = 'mirror-vertical' | 'mirror-horizontal' | 'fold-vertical' | 'plan-grid';

export interface NvrOption {
  visual: Visual;
  isCorrect: boolean;
  /** One of the 19 corpus-proposed NVR misconception ids; null on the key. */
  misconceptionId: NvrMisconceptionId | null;
  /** Codes items answer with a letter code rather than a picture. */
  codeLabel?: string;
}

export interface GeneratedNvrItem {
  templateId: string;
  templateVersion: number;
  seed: number;
  tier: number;
  engineFamily: NvrEngineFamily;
  sectionType: string;
  prompt: string;
  /** The stem's panels (a series row, a matrix, a code table…). */
  panels: Visual[];
  /** Letter labels for code panels, parallel to panels where used. */
  panelLabels?: string[];
  stemDecoration?: NvrDecoration;
  optionDecoration?: NvrDecoration;
  options: NvrOption[];
}

export interface NvrTemplate {
  id: string;
  version: number;
  engineFamily: NvrEngineFamily;
  sectionType: string;
  /** GL-pool templates may appear in GL blueprints (SCP-NVR-1/3). */
  glPool: boolean;
  generate(seed: number, tier: number): GeneratedNvrItem;
}

// ---------------------------------------------------------------------------
// Shared construction helpers
// ---------------------------------------------------------------------------

const ATTEMPTS = 32;

/** Deterministic resampling: same stream, so same (seed, tier) → same item. */
function attemptLoop<T>(what: string, make: (attempt: number) => T | null): T {
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const result = make(attempt);
    if (result !== null) return result;
  }
  throw new Error(`nvr generator refused: ${what} could not build an unambiguous item`);
}

function shuffle<T>(random: () => number, values: readonly T[]): T[] {
  const out = [...values];
  for (let index = out.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [out[index], out[swap]] = [out[swap]!, out[index]!];
  }
  return out;
}

/**
 * The gate every option set passes before it may exist: exactly one key,
 * every wrong option tagged, five options (SCP-NVR-1), all pairwise
 * VISUALLY distinct — then the key's position is seeded.
 */
function finalize(
  random: () => number,
  candidates: NvrOption[],
  identity: 'visual' | 'code' = 'visual',
): NvrOption[] | null {
  if (candidates.length !== NVR_CONFIG.optionCount) return null;
  if (candidates.filter((option) => option.isCorrect).length !== 1) return null;
  if (candidates.some((option) => !option.isCorrect && option.misconceptionId === null)) return null;
  const keys = candidates.map((option) =>
    identity === 'code' ? (option.codeLabel ?? '') : visualKey(option.visual),
  );
  if (new Set(keys).size !== candidates.length) return null;
  return shuffle(random, candidates);
}

function single(spec: ShapeSpec, extras: readonly ShapeSpec[] = []): Visual {
  return { elements: [spec, ...extras] };
}

function mainShape(random: () => number, tone: Tone, kinds: readonly ShapeKind[] = ROTATABLE_KINDS): ShapeSpec {
  return {
    kind: pick(random, kinds),
    size: 2,
    rotation: pick(random, [0, 45, 90, 135, 180, 225, 270, 315]),
    pattern: pick(random, FILL_PATTERNS),
    tone,
    x: 1,
    y: 1,
  };
}

/**
 * The decorative frame: identical small border marks repeated in EVERY panel
 * and EVERY option of one item, so figures carry corpus-typical element
 * counts (SCP-NVR-2 typical ranges) without the frame ever differentiating
 * anything. Density stays inside the ratified caps by construction.
 */
const FRAME_SLOTS: ReadonlyArray<[number, number]> = [
  [0, 0], [2, 0], [0, 2], [2, 2], [1, 0], [1, 2], [0, 1], [2, 1],
];

function frame(random: () => number, tier: number, tone: Tone): ShapeSpec[] {
  const count = tier <= 2 ? 2 : tier === 3 ? 4 : 6;
  const offset = Math.floor(random() * FRAME_SLOTS.length);
  return Array.from({ length: count }, (_, index) => {
    const [x, y] = FRAME_SLOTS[(offset + index) % FRAME_SLOTS.length]!;
    return {
      kind: 'circle' as const,
      size: 1 as const,
      rotation: 0,
      pattern: index % 2 === 0 ? ('solid' as const) : ('open' as const),
      tone,
      x: x === 1 ? 1 : x + (x === 0 ? -0.35 : 0.35),
      y: y === 1 ? 1 : y + (y === 0 ? -0.35 : 0.35),
    };
  });
}

/** A row of satellite dots along the top of a panel — the second moving part. */
function satellites(count: number, tone: Tone): ShapeSpec[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: 'circle' as const,
    size: 1 as const,
    rotation: 0,
    pattern: 'solid' as const,
    tone,
    x: 0.35 + index * 0.45,
    y: 0.12,
  }));
}

function base(template: NvrTemplate, seed: number, tier: number) {
  return {
    templateId: template.id,
    templateVersion: template.version,
    seed,
    tier,
    engineFamily: template.engineFamily,
    sectionType: template.sectionType,
  };
}

// ---------------------------------------------------------------------------
// THE MACHINE — series, matrix, analogy
// ---------------------------------------------------------------------------

const machineSeries: NvrTemplate = {
  id: 'machine-series',
  version: 1,
  engineFamily: 'machine',
  sectionType: 'series',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`machine-series@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      const main = mainShape(random, tone);
      const step = tier <= 2 ? pick(random, [45, 90]) : pick(random, [45, 90, 135]);
      const compound = tier >= 4;
      const dotCycle = tier <= 2 ? 2 : 3;
      const dotBase = Math.floor(random() * dotCycle);
      const extras = frame(random, tier, tone);
      const at = (position: number): ShapeSpec => {
        let spec = rotate(main, step * position);
        if (compound) {
          for (let advance = 0; advance < Math.floor(position / 2); advance += 1) {
            spec = { ...spec, pattern: nextPattern(spec.pattern) };
          }
        }
        return spec;
      };
      const dotsAt = (position: number): ShapeSpec[] =>
        satellites(((dotBase + position) % dotCycle) + 1, tone);
      const panel = (position: number): Visual => ({
        elements: [at(position), ...dotsAt(position), ...extras],
      });
      const panels = [0, 1, 2, 3].map(panel);
      const options = finalize(random, [
        { visual: panel(4), isCorrect: true, misconceptionId: null },
        // One cycle-step off (a step too far).
        { visual: panel(5), isCorrect: false, misconceptionId: 'nvr-series-phase-slip' },
        // The last panel repeated — the transformation simply not applied.
        { visual: panel(3), isCorrect: false, misconceptionId: 'nvr-transform-not-applied' },
        // Mirrored instead of rotated (SCP-NVR-5: reflection as the executor).
        {
          visual: { elements: [reflect(at(4)), ...dotsAt(4), ...extras] },
          isCorrect: false,
          misconceptionId: 'nvr-mirror-for-rotation',
        },
        // The big part tracked, the satellite cycle ignored.
        {
          visual: { elements: [at(4), ...dotsAt(3), ...extras] },
          isCorrect: false,
          misconceptionId: 'nvr-multi-part-tracking',
        },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The pattern grows one step at a time. Which picture comes next?',
        panels,
        options,
      };
    });
  },
};

const machineMatrix: NvrTemplate = {
  id: 'machine-matrix',
  version: 1,
  engineFamily: 'machine',
  sectionType: 'matrix',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`machine-matrix@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      const extras = frame(random, tier, tone);
      const step = pick(random, [45, 90, 135]);

      if (tier <= 2) {
        // 2×2: one rule across, applied to a second start shape.
        const a = mainShape(random, tone);
        const c = { ...mainShape(random, tone), pattern: nextPattern(a.pattern) };
        const key = rotate(c, step);
        const options = finalize(random, [
          { visual: single(key, extras), isCorrect: true, misconceptionId: null },
          // Completed from the nearest visible cell instead of the rule.
          { visual: single(c, extras), isCorrect: false, misconceptionId: 'nvr-matrix-local-copy' },
          { visual: single(rotate(c, step * 2), extras), isCorrect: false, misconceptionId: 'nvr-series-phase-slip' },
          { visual: single(reflect(key), extras), isCorrect: false, misconceptionId: 'nvr-mirror-for-rotation' },
          // Looks like the worked row's answer, not this row's.
          { visual: single(rotate(a, step), extras), isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
        ]);
        if (!options) return null;
        return {
          ...base(this, seed, tier),
          prompt: 'The grid follows one rule across each row. Which picture completes it?',
          panels: [single(a, extras), single(rotate(a, step), extras), single(c, extras)],
          options,
        };
      }

      // 3×3: rotation across columns, size down rows, pattern joins at T4+.
      const corner = { ...mainShape(random, tone), size: 1 as const };
      const patterned = tier >= 4;
      const cell = (row: number, column: number): ShapeSpec => {
        let spec = rotate(corner, step * column);
        spec = { ...spec, size: (row + 1) as 1 | 2 | 3 };
        if (patterned) {
          for (let advance = 0; advance < row; advance += 1) {
            spec = { ...spec, pattern: nextPattern(spec.pattern) };
          }
        }
        return spec;
      };
      const panels: Visual[] = [];
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          if (row === 2 && column === 2) continue;
          panels.push(single(cell(row, column), extras));
        }
      }
      const key = cell(2, 2);
      const options = finalize(random, [
        { visual: single(key, extras), isCorrect: true, misconceptionId: null },
        { visual: single(cell(2, 1), extras), isCorrect: false, misconceptionId: 'nvr-matrix-local-copy' },
        // Row rule applied, column rule ignored.
        { visual: single(cell(0, 2), extras), isCorrect: false, misconceptionId: 'nvr-single-axis-fixation' },
        // Column rule applied, row rule ignored.
        { visual: single(cell(2, 0), extras), isCorrect: false, misconceptionId: 'nvr-partial-rule-match' },
        { visual: single(reflect(key), extras), isCorrect: false, misconceptionId: 'nvr-mirror-for-rotation' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The grid follows two rules — one across, one down. Which picture completes it?',
        panels,
        options,
      };
    });
  },
};

const machineAnalogy: NvrTemplate = {
  id: 'machine-analogy',
  version: 1,
  engineFamily: 'machine',
  sectionType: 'analogy',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`machine-analogy@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      const a = mainShape(random, tone);
      const cKinds = ROTATABLE_KINDS.filter((kind) => kind !== a.kind);
      const c = { ...mainShape(random, tone, cKinds), pattern: pick(random, FILL_PATTERNS) };
      const degrees = tier <= 2 ? pick(random, [90, 180]) : pick(random, [45, 90, 135]);
      const compound = tier >= 4;
      const transform = (spec: ShapeSpec): ShapeSpec => {
        let out = rotate(spec, degrees);
        if (compound) out = { ...out, pattern: nextPattern(out.pattern) };
        return out;
      };
      const extras = frame(random, tier, tone);
      const key = transform(c);
      const options = finalize(random, [
        { visual: single(key, extras), isCorrect: true, misconceptionId: null },
        // The relation missed entirely: C unchanged.
        { visual: single(c, extras), isCorrect: false, misconceptionId: 'nvr-transform-not-applied' },
        // Looks like B rather than relating like A→B.
        { visual: single(transform(a), extras), isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
        { visual: single(reflect(key), extras), isCorrect: false, misconceptionId: 'nvr-mirror-for-rotation' },
        compound
          ? // Compound rule half-applied: turn done, shading ignored.
            { visual: single(rotate(c, degrees), extras), isCorrect: false, misconceptionId: 'nvr-partial-rule-match' as const }
          : { visual: single(rotate(c, degrees + 45), extras), isCorrect: false, misconceptionId: 'nvr-series-phase-slip' as const },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The first two pictures go together in a certain way. Pick the picture that pairs with the third one the same way.',
        panels: [single(a, extras), single(transform(a), extras), single(c, extras)],
        options,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// THE LINE-UP — classifications and codes
// ---------------------------------------------------------------------------

const lineupLike: NvrTemplate = {
  id: 'lineup-like',
  version: 1,
  engineFamily: 'lineup',
  sectionType: 'like-classification',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`lineup-like@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // The family: same kind, same pattern; rotation and size roam free.
      // T4–5 adds a RELATIONAL clause: satellite dots equal the shape's size.
      const relational = tier >= 4;
      const family = mainShape(random, tone, ROTATABLE_KINDS.filter((kind) => kind !== 'hook'));
      const extras = frame(random, tier, tone);
      const member = (degrees: number, size: 1 | 2 | 3): Visual => ({
        elements: [
          { ...rotate(family, degrees), size },
          ...(relational ? satellites(size, tone) : []),
          ...extras,
        ],
      });
      const offPattern = nextPattern(family.pattern);
      const otherKind = pick(random, ROTATABLE_KINDS.filter((kind) => kind !== family.kind && kind !== 'hook'));
      const panels = [member(0, 1), member(90, 2), member(135, 3)];
      const keySize = pick(random, [1, 2, 3] as const);
      const options = finalize(random, [
        { visual: member(225, keySize), isCorrect: true, misconceptionId: null },
        // Kind clause satisfied, shading clause dropped.
        {
          visual: { elements: [{ ...rotate(family, 45), pattern: offPattern, size: 2 }, ...(relational ? satellites(2, tone) : []), ...extras] },
          isCorrect: false,
          misconceptionId: 'nvr-partial-rule-match',
        },
        // Looks like the group without obeying its defining kind.
        {
          visual: { elements: [{ ...rotate(family, 90), kind: otherKind, size: 2 }, ...(relational ? satellites(2, tone) : []), ...extras] },
          isCorrect: false,
          misconceptionId: 'nvr-surface-similarity',
        },
        // Fixated on matching a shown rotation, missed the shading clause.
        {
          visual: { elements: [{ ...rotate(family, 90), pattern: nextPattern(offPattern), size: 2 }, ...(relational ? satellites(2, tone) : []), ...extras] },
          isCorrect: false,
          misconceptionId: 'nvr-single-axis-fixation',
        },
        relational
          ? // Kind and shading right, the dots-match-size relation broken.
            {
              visual: { elements: [{ ...rotate(family, 315), size: 3 as const }, ...satellites(1, tone), ...extras] },
              isCorrect: false,
              misconceptionId: 'nvr-relational-rule-miss' as const,
            }
          : {
              visual: { elements: [{ ...rotate(family, 270), kind: otherKind, pattern: offPattern, size: 1 as const }, ...extras] },
              isCorrect: false,
              misconceptionId: 'nvr-surface-similarity' as const,
            },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'These pictures belong to one group. Pick the picture that belongs with them.',
        panels,
        options,
      };
    });
  },
};

const lineupOdd: NvrTemplate = {
  id: 'lineup-odd',
  version: 2, // v2: honest set-level tagging, not index parity (corpus 2026-08-05)
  engineFamily: 'lineup',
  sectionType: 'odd-classification',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`lineup-odd@2:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      const family = mainShape(random, tone, ROTATABLE_KINDS.filter((kind) => kind !== 'hook'));
      const extras = frame(random, tier, tone);
      // The defining axis alternates by seed at T3+; T1–2 keeps shading.
      const axis: 'pattern' | 'kind' = tier >= 3 && random() < 0.5 ? 'kind' : 'pattern';
      const otherKind = pick(random, ROTATABLE_KINDS.filter((kind) => kind !== family.kind && kind !== 'hook'));
      const members = [0, 90, 180, 315].map((degrees, index) =>
        single({ ...rotate(family, degrees), size: ((index % 3) + 1) as 1 | 2 | 3 }, extras),
      );
      const odd =
        axis === 'pattern'
          ? single({ ...rotate(family, 45), pattern: nextPattern(family.pattern), size: 2 }, extras)
          : single({ ...rotate(family, 45), kind: otherKind, size: 2 }, extras);
      const position = Math.floor(random() * NVR_CONFIG.optionCount);
      const lineup = [...members];
      lineup.splice(position, 0, odd);
      // Odd-one-out is a SET-LEVEL misconception: the four wrong options are the
      // group members, so there is no per-option constructed error to name (corpus
      // 2026-08-05). A child pulled to any member fixated on a free-roaming axis
      // (rotation or size), so all four are honestly single-axis-fixation — NOT
      // tagged by index parity, which was decorative. The distinctness check
      // allow-lists this template for exactly this reason.
      const candidates: NvrOption[] = lineup.map((visual, index) => ({
        visual,
        isCorrect: index === position,
        misconceptionId: index === position ? null : 'nvr-single-axis-fixation',
      }));
      // The line-up IS the option row — no reshuffle; the odd position is
      // already seeded. Distinctness and single-answer still verified.
      if (candidates.filter((option) => option.isCorrect).length !== 1) return null;
      const keys = candidates.map((option) => visualKey(option.visual));
      if (new Set(keys).size !== candidates.length) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'Four of these belong together. Find the one that does not.',
        panels: [],
        options: candidates,
      };
    });
  },
};

const lineupCounting: NvrTemplate = {
  id: 'lineup-counting',
  version: 3, // v3: count+2 retagged to count-by-glance — off-by-several is the same
  //             estimate error, magnitude a parameter (corpus 2026-08-05)
  engineFamily: 'lineup',
  sectionType: 'like-classification',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`lineup-counting@3:${seed}:${tier}`);
    const tone = pick(random, TONES);
    // Counting IS the task — the one place extreme density is allowed
    // (SCP-NVR-2), still inside the tier cap even at count+2.
    const cap = NVR_CONFIG.densityCaps.maxElementsByTier[tier]!;
    const span: [number, number] =
      tier === 1 ? [5, 8] : tier === 2 ? [8, 12] : tier === 3 ? [12, 20] : tier === 4 ? [20, 32] : [28, 43];
    const count = Math.min(cap - 2, span[0] + Math.floor(rngSpan(random, span)));
    // The narrow count range at low tiers meant two items of the same count were
    // byte-identical pictures. The count is still the answer, but the SCATTER is
    // now seeded: dots land in a shuffled subset of a 54-cell grid with a seeded
    // fill parity, so equal-count items look different without changing the task.
    const layout = shuffle(random, Array.from({ length: 54 }, (_, index) => index));
    const parity = Math.floor(random() * 2);
    const dot = (index: number): ShapeSpec => {
      const cellIndex = layout[index]!;
      return {
        kind: 'circle',
        size: 1,
        rotation: 0,
        pattern: (cellIndex + parity) % 2 === 0 ? 'solid' : 'open',
        tone,
        x: (cellIndex % 9) * 0.27,
        y: Math.floor(cellIndex / 9) * 0.3,
      };
    };
    const withCount = (n: number): Visual => ({ elements: Array.from({ length: n }, (_, index) => dot(index)) });
    const candidates: NvrOption[] = [
      { visual: withCount(count), isCorrect: true, misconceptionId: null },
      { visual: withCount(count - 1), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
      { visual: withCount(count + 1), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
      { visual: withCount(count - 2), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
      // Off-by-several is the same estimate-instead-of-count error, the size of
      // the miss a parameter — count-by-glance ×3 is honest here (corpus 2026-08-05).
      { visual: withCount(count + 2), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
    ];
    const options = finalize(random, candidates);
    if (!options) throw new Error('nvr generator refused: lineup-counting collision');
    return {
      ...base(this, seed, tier),
      prompt: 'Count carefully. Which picture holds exactly as many shapes as the first?',
      panels: [withCount(count)],
      options,
    };
  },
};

function rngSpan(random: () => number, [low, high]: [number, number]): number {
  return random() * (high - low + 1);
}

const lineupCodes: NvrTemplate = {
  id: 'lineup-codes',
  version: 1,
  engineFamily: 'lineup',
  sectionType: 'codes',
  glPool: true,
  generate(seed, tier) {
    const random = rng(`lineup-codes@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // SCP-NVR-4: teach on 2 letters, score on 2–3 — T1–2 items carry 2
      // letters, T3+ carry 3. Axes: kind, shading, (T3+) rotation.
      const letters = tier <= 2 ? NVR_CONFIG.codesScaffold.teachLetterCount : NVR_CONFIG.codesScaffold.scoreLetterCounts[1]!;

      // THREE values per axis, not two. With two values a 2-letter code has
      // only four possible strings — fewer than the five options SCP-NVR-1
      // requires — so a fifth option could only be an out-of-alphabet string
      // like "SZB", which any child who has cracked the table eliminates on
      // sight. That is a free mark, not a misconception. Three values give
      // nine legal codes, and every distractor below is one of them.
      const kindPool = shuffle(random, ROTATABLE_KINDS.filter((kind) => kind !== 'hook'));
      const kinds = [kindPool[0]!, kindPool[1]!, kindPool[2]!];
      const patternStart = pick(random, FILL_PATTERNS);
      const patterns = [patternStart, nextPattern(patternStart), nextPattern(nextPattern(patternStart))];
      const rotations = [0, 90, 180];
      const kindLetters = shuffle(random, ['A', 'B', 'C', 'D']).slice(0, 3);
      const patternLetters = shuffle(random, ['W', 'X', 'Y', 'Z']).slice(0, 3);
      const rotationLetters = shuffle(random, ['R', 'S', 'T', 'U']).slice(0, 3);
      const build = (k: number, p: number, r: number): Visual =>
        single({
          kind: kinds[k]!,
          size: 2,
          rotation: letters === 3 ? rotations[r]! : 0,
          pattern: patterns[p]!,
          tone,
          x: 1,
          y: 1,
        });
      const label = (k: number, p: number, r: number): string =>
        letters === 2
          ? `${kindLetters[k]}${patternLetters[p]}`
          : `${kindLetters[k]}${patternLetters[p]}${rotationLetters[r]}`;

      // The three examples run down the diagonal, so every letter of every
      // axis is pinned exactly once — the code is fully inferable, which is
      // what makes a single answer defensible.
      const examples: Array<[number, number, number]> = [[0, 0, 0], [1, 1, 1], [2, 2, 2]];
      // The target mixes values the examples pinned separately, and is never
      // itself an example.
      const target: [number, number, number] = [0, 1, 2];
      const correct = label(...target);

      const candidates: NvrOption[] = [
        { visual: { elements: [] }, isCorrect: true, misconceptionId: null, codeLabel: correct },
        // Row alignment lost: the first two axes read into each other's
        // positions. Legal letters throughout — the child cannot spot this
        // by alphabet, only by checking the mapping.
        {
          visual: { elements: [] },
          isCorrect: false,
          misconceptionId: 'nvr-code-row-swap',
          codeLabel: label(target[1], target[0], target[2]),
        },
        // First letter verified, the rest assumed from the example it came
        // from — the classic stop-checking-early answer.
        {
          visual: { elements: [] },
          isCorrect: false,
          misconceptionId: 'nvr-code-partial-verification',
          codeLabel: label(target[0], target[0], target[0]),
        },
        // The most similar keyed figure's code, copied wholesale.
        {
          visual: { elements: [] },
          isCorrect: false,
          misconceptionId: 'nvr-code-nearest-box-copy',
          codeLabel: label(target[1], target[1], target[1]),
        },
        // A previous question's code carried forward into this one.
        {
          visual: { elements: [] },
          isCorrect: false,
          misconceptionId: 'nvr-code-stale-mapping',
          codeLabel: label(target[2], target[2], target[2]),
        },
      ];
      const options = finalize(random, candidates, 'code');
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'Each letter tells you one thing about its shape. Work out the code for the last shape.',
        panels: [...examples.map(([k, p, r]) => build(k, p, r)), build(...target)],
        panelLabels: [...examples.map(([k, p, r]) => label(k, p, r)), '?'],
        options,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// THE TURNTABLE — rotation (practice for the GL pool's rotation-bearing
// rules) and reflection-as-task (CEM-legacy only, SCP-NVR-5)
// ---------------------------------------------------------------------------

const turntableRotation: NvrTemplate = {
  id: 'turntable-rotation',
  version: 2, // v2: the fourth distinct error is now wrong-direction (corpus 2026-08-05)
  engineFamily: 'turntable',
  sectionType: 'rotation',
  glPool: false, // GL treats rotation inside the pool types (SCP-NVR-3)
  generate(seed, tier) {
    const random = rng(`turntable-rotation@2:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // The hook is chiral, so its mirror twin is honestly wrong at every
      // angle; the achiral kinds stay in the mix and the distinctness gate
      // resamples any angle where the mirror collapses into a rotation.
      const spec = mainShape(random, tone, ['triangle', 'arrow', 'arc', 'hook', 'hook']);
      // 180 is excluded: at a half-turn clockwise and anticlockwise coincide, so
      // the wrong-direction distractor would equal the key. 270 gives the same
      // "big turn" without that collapse.
      const degrees = tier <= 2 ? pick(random, [90, 270]) : pick(random, [45, 90, 135, 270]);
      const extras = frame(random, tier, tone);
      const key = rotate(spec, degrees);
      const options = finalize(random, [
        { visual: single(key, extras), isCorrect: true, misconceptionId: null },
        { visual: single(reflect(key), extras), isCorrect: false, misconceptionId: 'nvr-mirror-for-rotation' },
        // Right amount, one step too far (phase-slip) — and, distinct from it,
        // the right amount turned the WRONG WAY (wrong-direction, corpus 4th).
        { visual: single(rotate(spec, degrees + 45), extras), isCorrect: false, misconceptionId: 'nvr-series-phase-slip' },
        { visual: single(rotate(spec, -degrees), extras), isCorrect: false, misconceptionId: 'nvr-rotation-wrong-direction' },
        { visual: single(spec, extras), isCorrect: false, misconceptionId: 'nvr-transform-not-applied' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: `The shape turns ${degrees} degrees the way clock hands move. Which picture shows it after the turn?`,
        panels: [single(spec, extras)],
        options,
      };
    });
  },
};

const turntableReflection: NvrTemplate = {
  id: 'turntable-reflection',
  version: 3, // v3: figure gains an internal mark so the fourth error is a genuine
  //             partial reflection — one element unflipped (corpus 2026-08-05)
  engineFamily: 'turntable',
  sectionType: 'reflection-identification',
  glPool: false, // CEM-legacy practice ONLY (SCP-NVR-5); never in GL blueprints
  generate(seed, tier) {
    const random = rng(`turntable-reflection@3:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // The figure is a main shape at centre PLUS a smaller internal mark off to
      // one side. Reflecting the figure flips both; the partial-reflection
      // distractor flips the main shape but leaves the mark — a genuinely
      // different picture, not a relabel (corpus-attested fourth error).
      const shape = { ...mainShape(random, tone, ['hook', 'hook', 'arrow', 'triangle', 'arc']), x: 1, y: 1 };
      const mark: ShapeSpec = { kind: 'hook', size: 1, rotation: 0, pattern: 'solid', tone, x: 1.35, y: 0.65 };
      const vertical = tier <= 2 ? true : random() < 0.5;
      const mirror = vertical ? reflect : reflectHorizontal;
      const wrongAxis = vertical ? reflectHorizontal : reflect;
      const id = (s: ShapeSpec): ShapeSpec => s;
      const turn = (s: ShapeSpec): ShapeSpec => ({ ...rotate(s, 180), x: 2 - s.x, y: 2 - s.y });
      const extras = frame(random, tier, tone);
      const fig = (shapeT: (s: ShapeSpec) => ShapeSpec, markT: (s: ShapeSpec) => ShapeSpec): Visual => ({
        elements: [shapeT(shape), markT(mark), ...extras],
      });
      const options = finalize(random, [
        { visual: fig(mirror, mirror), isCorrect: true, misconceptionId: null },
        // Turned instead of flipped.
        { visual: fig(turn, turn), isCorrect: false, misconceptionId: 'nvr-rotation-for-reflection' },
        // Flipped across the wrong mirror line.
        { visual: fig(wrongAxis, wrongAxis), isCorrect: false, misconceptionId: 'nvr-wrong-mirror-axis' },
        // Near-correct mirror — every part flipped EXCEPT the mark (corpus 4th).
        { visual: fig(mirror, id), isCorrect: false, misconceptionId: 'nvr-partial-reflection' },
        // Not flipped at all.
        { visual: fig(id, id), isCorrect: false, misconceptionId: 'nvr-transform-not-applied' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The shape flips over the mirror line. Which picture shows it after the flip?',
        panels: [fig(id, id)],
        stemDecoration: vertical ? 'mirror-vertical' : 'mirror-horizontal',
        options,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// THE FOLDING ROOM — nets, fold-and-punch, hidden shapes, plan views
// (CEM-style practice; never in GL blueprints, SCP-NVR-3)
// ---------------------------------------------------------------------------

/** Cross-net face layout: 0 top · 1 left · 2 centre · 3 right · 4 bottom · 5 tail. */
const NET_POSITIONS: ReadonlyArray<[number, number]> = [
  [1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3],
];
/** Pairs that fold to OPPOSITE faces (one square between on a strip). */
const NET_OPPOSITE_PAIRS: ReadonlyArray<[number, number]> = [[1, 3], [0, 4], [2, 5]];
/** A sample of pairs that fold ADJACENT — the plausible wrong answers. */
const NET_ADJACENT_PAIRS: ReadonlyArray<[number, number]> = [
  [2, 0], [2, 1], [2, 3], [2, 4], [5, 0], [5, 1], [5, 3], [5, 4], [0, 1], [4, 3],
];

const foldingNet: NvrTemplate = {
  id: 'folding-net',
  version: 2, // v2: fourth distinct error is a duplicated face (corpus 2026-08-05)
  engineFamily: 'foldingroom',
  sectionType: 'nets',
  glPool: false,
  generate(seed, tier) {
    const random = rng(`folding-net@2:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // Six DISTINCT face marks by construction: kind × pattern pairs are
      // seeded without replacement, so no two faces can be confused.
      const combos = shuffle(
        random,
        ROTATABLE_KINDS.flatMap((kind) => FILL_PATTERNS.map((pattern) => ({ kind, pattern }))),
      ).slice(0, 6);
      const marks: ShapeSpec[] = combos.map((combo, index) => ({
        kind: combo.kind,
        size: 1,
        rotation: 0,
        pattern: combo.pattern as FillPattern,
        tone,
        x: NET_POSITIONS[index]![0],
        y: NET_POSITIONS[index]![1] * 0.78,
      }));
      const net: Visual = { elements: marks };
      const pair = (a: number, b: number, transformSecond?: (spec: ShapeSpec) => ShapeSpec): Visual => ({
        elements: [
          { ...marks[a]!, x: 0.55, y: 1 },
          { ...(transformSecond ? transformSecond(marks[b]!) : marks[b]!), x: 1.45, y: 1 },
        ],
      });
      const [keyA, keyB] = pick(random, NET_OPPOSITE_PAIRS);
      const adjacents = shuffle(random, NET_ADJACENT_PAIRS).slice(0, 1);
      const swapSource = [0, 1, 2, 3, 4, 5].find((face) => face !== keyA && face !== keyB)!;
      const options = finalize(random, [
        { visual: pair(keyA, keyB), isCorrect: true, misconceptionId: null },
        // Faces that sit near each other on the net fold ADJACENT, not
        // opposite — the one-square-between rule not known.
        { visual: pair(adjacents[0]![0], adjacents[0]![1]), isCorrect: false, misconceptionId: 'nvr-net-adjacency-blindspot' },
        // The same motif shown on two faces though the net carries it once — a
        // cube that cannot exist (corpus-attested fourth error).
        { visual: pair(keyA, keyA), isCorrect: false, misconceptionId: 'nvr-net-duplicated-face' },
        // Right faces, one mark mis-tracked from another face.
        { visual: pair(keyA, swapSource), isCorrect: false, misconceptionId: 'nvr-multi-part-tracking' },
        // Right faces, the second mark turned — which way marks point after
        // the fold not checked.
        { visual: pair(keyA, keyB, (spec) => rotate(spec, 90)), isCorrect: false, misconceptionId: 'nvr-net-mark-orientation' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'Fold this net into a cube in your head. Which two faces end up on opposite sides?',
        panels: [net],
        options,
      };
    });
  },
};

/** Left-half punch cells: three columns (x 0, 0.4, 0.8, all left of the x=1
 * fold) × three rows. Nine cells give a real spread of hole subsets where v1
 * offered barely two configurations per tier. */
const PUNCH_CELLS: ReadonlyArray<[number, number]> = [
  [0, 0], [0, 1], [0, 2], [0.4, 0], [0.4, 1], [0.4, 2], [0.8, 0], [0.8, 1], [0.8, 2],
];

const foldingPunch: NvrTemplate = {
  id: 'folding-punch',
  version: 2, // v2: seeded multi-cell hole sets (v1 had ~2 pictures per tier)
  engineFamily: 'foldingroom',
  sectionType: 'fold-punch',
  glPool: false,
  generate(seed, tier) {
    const random = rng(`folding-punch@2:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // The paper folds right-half-onto-left along x=1. Holes are punched
      // through both layers on the left half (x < 1); unfolding mirrors them to
      // x = 2 - x. The hole set is a seeded subset of the punch grid, chosen
      // y-asymmetric so the top-to-bottom distractor is a genuinely different
      // picture from the key.
      // T1 one hole, then 2, then 3 — nine cells make even the one-hole tier
      // carry six distinct configurations, and two/three holes far more.
      const holeCount = tier <= 1 ? 1 : tier <= 3 ? 2 : 3;
      const chosen = shuffle(random, [...PUNCH_CELLS]).slice(0, holeCount);
      const setKey = (cells: ReadonlyArray<[number, number]>): string =>
        cells.map(([x, y]) => `${x}:${y}`).sort().join(',');
      // If the set is its own top-to-bottom mirror, the wrong-axis distractor
      // collapses onto the key — resample.
      if (setKey(chosen) === setKey(chosen.map(([x, y]) => [x, 2 - y]))) return null;
      const hole = (x: number, y: number): ShapeSpec => ({
        kind: 'circle', size: 1, rotation: 0, pattern: 'open', tone, x, y,
      });
      const asVisual = (specs: ShapeSpec[]): Visual => ({ elements: dedupeByPosition(specs) });
      const punched = chosen.map(([x, y]) => hole(x, y));
      const key = asVisual([...punched, ...chosen.map(([x, y]) => hole(2 - x, y))]);
      // A right-half cell not already taken by the unfolded key — the extra hole.
      const extra = PUNCH_CELLS.map(([x, y]) => [2 - x, y] as [number, number]).find(
        ([x, y]) => !key.elements.some((element) => element.x === x && element.y === y),
      )!;
      const options = finalize(random, [
        { visual: key, isCorrect: true, misconceptionId: null },
        // Unfold not applied: only the punched half shown.
        { visual: asVisual(punched), isCorrect: false, misconceptionId: 'nvr-transform-not-applied' },
        // Mirrored top-to-bottom instead of across the fold line.
        { visual: asVisual([...punched, ...chosen.map(([x, y]) => hole(x, 2 - y))]), isCorrect: false, misconceptionId: 'nvr-wrong-mirror-axis' },
        // Copies turned half a turn instead of reflected.
        { visual: asVisual([...punched, ...chosen.map(([x, y]) => hole(2 - x, 2 - y))]), isCorrect: false, misconceptionId: 'nvr-rotation-for-reflection' },
        // One hole too many — counted at a glance.
        { visual: asVisual([...key.elements, hole(extra[0], extra[1])]), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The paper folds in half, then a hole punch goes through. Which picture shows the paper opened out?',
        panels: [asVisual(punched)],
        stemDecoration: 'fold-vertical',
        optionDecoration: 'fold-vertical',
        options,
      };
    });
  },
};

function dedupeByPosition(specs: ShapeSpec[]): ShapeSpec[] {
  const seen = new Set<string>();
  return specs.filter((spec) => {
    const key = `${spec.x}:${spec.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const foldingHidden: NvrTemplate = {
  id: 'folding-hidden',
  version: 1,
  engineFamily: 'foldingroom',
  sectionType: 'hidden-shapes',
  glPool: false,
  generate(seed, tier) {
    const random = rng(`folding-hidden@1:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      const target: ShapeSpec = {
        ...mainShape(random, tone, ['triangle', 'arrow', 'arc', 'hook']),
        pattern: 'open',
      };
      const targetKey = JSON.stringify(canonical({ ...target, x: 0, y: 0 }));
      const containsTarget = (visual: Visual): boolean =>
        visual.elements.some((element) => JSON.stringify(canonical({ ...element, x: 0, y: 0 })) === targetKey);
      const clutterCount = tier <= 2 ? 2 : tier === 3 ? 4 : 6;
      const scene = (embedded: ShapeSpec | null): Visual => {
        const clutter: ShapeSpec[] = Array.from({ length: clutterCount }, (_, index) => ({
          kind: pick(random, ['circle', 'square', 'star'] as const),
          size: pick(random, [1, 2] as const),
          rotation: pick(random, [0, 45, 90]),
          pattern: pick(random, ['solid', 'dots', 'stripes'] as const),
          tone,
          x: (index % 3) * 0.9 + 0.1,
          y: Math.floor(index / 3) * 0.9 + 0.1,
        }));
        const elements = embedded ? [{ ...embedded, x: 1.2, y: 1.4 }, ...clutter] : clutter;
        return { elements };
      };
      const otherKind = pick(random, (['triangle', 'arrow', 'arc'] as const).filter((kind) => kind !== target.kind));
      const candidates: NvrOption[] = [
        { visual: scene(target), isCorrect: true, misconceptionId: null },
        // The mirror twin accepted as the shape itself.
        { visual: scene(reflect({ ...target, x: 0.8 })), isCorrect: false, misconceptionId: 'nvr-mirror-for-rotation' },
        // Right outline, size clause missed.
        { visual: scene(growSize(target)), isCorrect: false, misconceptionId: 'nvr-partial-rule-match' },
        // Right outline, shading attended instead of shape.
        { visual: scene({ ...target, pattern: 'solid' }), isCorrect: false, misconceptionId: 'nvr-single-axis-fixation' },
        // A similar-looking outline that is a different shape.
        { visual: scene({ ...target, kind: otherKind }), isCorrect: false, misconceptionId: 'nvr-surface-similarity' },
      ];
      // A clutter shape must never accidentally BE the target (two answers).
      if (candidates.some((option) => !option.isCorrect && containsTarget(option.visual))) return null;
      if (!containsTarget(candidates[0]!.visual)) return null;
      const options = finalize(random, candidates);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'The small shape hides inside one of these pictures. Find the picture holding it.',
        panels: [single({ ...target, x: 1, y: 1 })],
        options,
      };
    });
  },
};

const foldingPlans: NvrTemplate = {
  id: 'folding-plans',
  version: 2, // v2: taller low-tier stacks widen the 2×2's cramped output space
  engineFamily: 'foldingroom',
  sectionType: 'plan-views',
  glPool: false,
  generate(seed, tier) {
    const random = rng(`folding-plans@2:${seed}:${tier}`);
    const tone = pick(random, TONES);
    return attemptLoop(this.id, () => {
      // Column heights on a small grid; the stem draws 2.5D stacks, the
      // options draw plans (filled cells seen from above). At least one
      // column must hide a shorter one behind it, or the signature
      // misconception has nothing to execute.
      const gridSize = tier <= 2 ? 2 : 3;
      const columns: Array<{ x: number; y: number; height: number }> = [];
      for (let x = 0; x < gridSize; x += 1) {
        for (let y = 0; y < gridSize; y += 1) {
          if (random() < (tier <= 2 ? 0.7 : 0.55)) {
            // Heights reach 3 even at T1 (was capped at 2), so the small 2×2
            // grid stops repeating the same handful of low arrangements.
            columns.push({ x, y, height: 1 + Math.floor(random() * Math.min(3, tier + 2)) });
          }
        }
      }
      // Constructive repair, deterministic: the scene MUST hold a hidden
      // column (or the signature misconception has nothing to execute) and
      // must not fill the grid (or the mirrored plan equals the key).
      const at = (x: number, y: number) => columns.find((column) => column.x === x && column.y === y);
      if (columns.length === 0) columns.push({ x: 0, y: 0, height: 1 });
      const targetX = columns[0]!.x;
      const backCell = at(targetX, 0) ?? (() => { const c = { x: targetX, y: 0, height: 1 }; columns.push(c); return c; })();
      const frontCell =
        at(targetX, gridSize - 1) ??
        (() => { const c = { x: targetX, y: gridSize - 1, height: 1 }; columns.push(c); return c; })();
      if (frontCell.height <= backCell.height) frontCell.height = Math.min(3, backCell.height + 1);
      if (frontCell.height <= backCell.height) backCell.height = frontCell.height - 1;
      if (columns.length === gridSize * gridSize) {
        const removable = columns.findIndex((column) => column.x !== targetX);
        columns.splice(removable, 1);
      }
      if (columns.length < 2) return null;
      const hidden = columns.filter((column) =>
        columns.some((other) => other.x === column.x && other.y > column.y && other.height > column.height),
      );
      if (hidden.length === 0) return null;

      const stack = (column: { x: number; y: number; height: number }): ShapeSpec[] =>
        Array.from({ length: column.height }, (_, level) => ({
          kind: 'square' as const,
          size: 1 as const,
          rotation: 0,
          pattern: level === column.height - 1 ? ('solid' as const) : ('stripes' as const),
          tone,
          x: column.x + (2 - column.y) * 0.18,
          y: 2 - column.x * 0.12 - level * 0.4 - (2 - column.y) * 0.28,
        }));
      const sceneElements = [...columns]
        .sort((a, b) => a.y - b.y)
        .flatMap(stack);

      const plan = (cells: Array<{ x: number; y: number }>): Visual => ({
        elements: cells.map((cell) => ({
          kind: 'square' as const,
          size: 1 as const,
          rotation: 0,
          pattern: 'solid' as const,
          tone,
          x: cell.x,
          y: cell.y,
        })),
      });
      const footprint = columns.map(({ x, y }) => ({ x, y }));
      const missingHidden = footprint.filter(
        (cell) => !hidden.some((column) => column.x === cell.x && column.y === cell.y),
      );
      const mirrored = footprint.map(({ x, y }) => ({ x: gridSize - 1 - x, y }));
      const collapsed = [...new Set(footprint.map(({ x }) => x))].map((x) => ({ x, y: gridSize - 1 }));
      const totalCubes = columns.reduce((sum, column) => sum + column.height, 0);
      const cubeCells = Array.from({ length: Math.min(totalCubes, gridSize * gridSize) }, (_, index) => ({
        x: index % gridSize,
        y: Math.floor(index / gridSize),
      }));
      const options = finalize(random, [
        { visual: plan(footprint), isCorrect: true, misconceptionId: null },
        // Only the visible tops counted; the square a tower still covers
        // from above goes missing.
        { visual: plan(missingHidden), isCorrect: false, misconceptionId: 'nvr-hidden-footprint-blocks' },
        { visual: plan(mirrored), isCorrect: false, misconceptionId: 'nvr-wrong-mirror-axis' },
        // The layout flattened onto one row — one axis attended.
        { visual: plan(collapsed), isCorrect: false, misconceptionId: 'nvr-single-axis-fixation' },
        // A cell per CUBE instead of per column.
        { visual: plan(cubeCells), isCorrect: false, misconceptionId: 'nvr-count-by-glance' },
      ]);
      if (!options) return null;
      return {
        ...base(this, seed, tier),
        prompt: 'Look straight down at these stacks from above. Which plan shows what you would see?',
        panels: [{ elements: sceneElements }],
        optionDecoration: 'plan-grid',
        options,
      };
    });
  },
};

// ---------------------------------------------------------------------------

export const NVR_TEMPLATES: readonly NvrTemplate[] = [
  machineSeries,
  machineMatrix,
  machineAnalogy,
  lineupLike,
  lineupOdd,
  lineupCounting,
  lineupCodes,
  turntableRotation,
  turntableReflection,
  foldingNet,
  foldingPunch,
  foldingHidden,
  foldingPlans,
];

export function templateById(id: string): NvrTemplate | null {
  return NVR_TEMPLATES.find((template) => template.id === id) ?? null;
}

/** The GL section pool must be covered by GL-pool templates (SCP-NVR-1/3). */
export function glPoolSectionTypes(): string[] {
  return [...new Set(NVR_TEMPLATES.filter((template) => template.glPool).map((template) => template.sectionType))];
}
