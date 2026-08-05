/**
 * The NVR shape grammar (BUILD-DISTRICT-NVR §3): a fixed vocabulary of
 * primitive elements with property axes — count, size, rotation, reflection,
 * shading, position, line-style. Everything an item shows is one of these
 * specs; everything is parametric and deterministic.
 *
 * Colour law (manifesto §6 + spec): shading carries meaning through PATTERN
 * (solid / stripes / dots / cross / open), never hue alone. A tone exists for
 * warmth and is applied ONCE PER ITEM by the templates — every panel and
 * every option in one item share it, so hue can never differentiate anything.
 * The automated check (checks.ts) still refuses any option set whose only
 * difference is tone, as defence in depth.
 *
 * Visual identity is symmetry-aware: a circle looks the same at every
 * rotation, a square repeats every 90°, and every non-hook glyph is drawn
 * mirror-symmetric about its vertical axis, so a reflection of it equals a
 * rotation. `canonical`/`visualKey` encode exactly that, and the templates
 * use them to guarantee the key is the ONLY option that shows the right
 * picture — two options that LOOK the same are the same, whatever their
 * specs say.
 */

export const SHAPE_KINDS = ['circle', 'square', 'triangle', 'arrow', 'star', 'arc', 'hook'] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

/**
 * Rotational symmetry step in degrees on the 45° grid: rotations congruent
 * modulo this step are indistinguishable. (A five-point star's 72° symmetry
 * never lands on the 45° grid, so on-grid it behaves as 360.)
 */
export const ROTATION_SYMMETRY: Record<ShapeKind, number> = {
  circle: 45, // i.e. every grid rotation looks identical
  square: 90,
  triangle: 360,
  arrow: 360,
  star: 360,
  arc: 360,
  hook: 360,
};

/**
 * Kinds whose every 45° step is visually distinct — the only kinds a
 * rotation-carrying rule may use. A circle series that "rotates" would show
 * four identical panels and two defensible answers; that item is banned at
 * the grammar level, not caught downstream.
 */
export const ROTATABLE_KINDS = ['triangle', 'arrow', 'star', 'arc', 'hook'] as const;

/**
 * The one chiral glyph: a hook (J-shape) looks different in the mirror at
 * every rotation. Every other glyph is drawn symmetric about its vertical
 * axis, so its reflection is indistinguishable from a rotation — mirror
 * distractors built on those kinds are honest only when the rotation makes
 * the difference visible, which `canonical` lets the templates verify.
 */
export const CHIRAL_KINDS: readonly ShapeKind[] = ['hook'];

export const FILL_PATTERNS = ['solid', 'stripes', 'dots', 'cross', 'open'] as const;
export type FillPattern = (typeof FILL_PATTERNS)[number];

/** Ratified palette references — resolved to real tokens at render. */
export const TONES = ['ink', 'violet'] as const;
export type Tone = (typeof TONES)[number];

export interface ShapeSpec {
  kind: ShapeKind;
  /** 1–3; renderer maps to radii. */
  size: 1 | 2 | 3;
  /** Degrees, multiples of 45. */
  rotation: number;
  /** True after a reflection of a chiral glyph — renderer applies scale(-1,1). */
  mirrored?: boolean;
  pattern: FillPattern;
  tone: Tone;
  /** Cell coordinates in a 3×3 layout grid; fractional values allowed for
   *  scatter fields and 2.5D stacks (plan-view columns). */
  x: number;
  y: number;
}

/** One panel of an item: a small scene of shapes. */
export interface Visual {
  elements: ShapeSpec[];
}

export function elementCount(visual: Visual): number {
  return visual.elements.length;
}

/** Mulberry32 over an FNV-1a seed of the identity string — deterministic. */
export function rng(identity: string): () => number {
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

export function rotate(spec: ShapeSpec, degrees: number): ShapeSpec {
  return { ...spec, rotation: (spec.rotation + degrees + 720) % 360 };
}

/**
 * Mirror about the vertical axis: position flips across the grid centre and
 * the glyph reflects. For the achiral glyphs the reflected glyph is redrawn
 * as its equivalent rotation (mirror of a vertical-axis-symmetric glyph at
 * rotation r looks like the unreflected glyph at 360−r); the chiral hook
 * keeps a true `mirrored` flag for the renderer.
 */
export function reflect(spec: ShapeSpec): ShapeSpec {
  const flipped = { ...spec, x: 2 - spec.x };
  if (CHIRAL_KINDS.includes(spec.kind)) {
    return { ...flipped, mirrored: !spec.mirrored };
  }
  return { ...flipped, rotation: (360 - spec.rotation) % 360 };
}

/** Mirror about the horizontal axis (the Turntable's second mirror line). */
export function reflectHorizontal(spec: ShapeSpec): ShapeSpec {
  const flipped = { ...spec, y: 2 - spec.y };
  if (CHIRAL_KINDS.includes(spec.kind)) {
    return { ...flipped, mirrored: !spec.mirrored, rotation: (180 - spec.rotation + 360) % 360 };
  }
  return { ...flipped, rotation: (180 - spec.rotation + 360) % 360 };
}

export function nextPattern(pattern: FillPattern): FillPattern {
  return FILL_PATTERNS[(FILL_PATTERNS.indexOf(pattern) + 1) % FILL_PATTERNS.length]!;
}

export function growSize(spec: ShapeSpec): ShapeSpec {
  return { ...spec, size: (spec.size === 3 ? 1 : spec.size + 1) as 1 | 2 | 3 };
}

/**
 * The symmetry-normalised form of a spec: what the child's eye can actually
 * distinguish. Tone is EXCLUDED deliberately — two specs differing only in
 * tone are the same picture as far as meaning is allowed to go (§6: hue never
 * carries meaning alone), so treating them as equal makes the ambiguity
 * checks strictly harsher.
 */
export function canonical(spec: ShapeSpec): Omit<ShapeSpec, 'tone'> {
  const symmetry = ROTATION_SYMMETRY[spec.kind];
  let rotation = ((spec.rotation % 360) + 360) % 360;
  let mirrored = spec.mirrored ?? false;
  if (mirrored && !CHIRAL_KINDS.includes(spec.kind)) {
    rotation = (360 - rotation) % 360;
    mirrored = false;
  }
  rotation = rotation % symmetry;
  return {
    kind: spec.kind,
    size: spec.size,
    rotation,
    mirrored,
    pattern: spec.pattern,
    x: spec.x,
    y: spec.y,
  };
}

/** Order-independent, symmetry-aware identity of a panel. */
export function visualKey(visual: Visual): string {
  return visual.elements
    .map((element) => {
      const c = canonical(element);
      return `${c.kind}|${c.size}|${c.rotation}|${c.mirrored ? 'm' : '-'}|${c.pattern}|${c.x}|${c.y}`;
    })
    .sort()
    .join('||');
}

export function sameVisual(a: Visual, b: Visual): boolean {
  return visualKey(a) === visualKey(b);
}
