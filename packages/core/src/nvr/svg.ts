/**
 * Parametric SVG rendering of the shape grammar — one pure string builder
 * used by the reviewer sample sheets (server) and the four engines (client),
 * so what the reviewer signs is pixel-for-pixel what a child sees.
 *
 * Static by construction: no animation lives here, so reduced-motion and
 * Plain mode get the identical render (gate #1's "reduced-motion/static-
 * render integrity" is a property, not a mode). Pattern fills carry the
 * shading axis; the two tones resolve to manifesto tokens and never carry
 * meaning (checks.ts holds the line).
 */
import type { NvrDecoration } from './templates';
import type { ShapeSpec, Tone, Visual } from './grammar';

/** Manifesto §6 tokens (packages/ui/src/tokens.ts is the canonical source;
 *  these two values are asserted against it in apps/web's palette audit). */
const TONE_HEX: Record<Tone, string> = {
  ink: '#1B2A4A',
  violet: '#7B6FA8',
};

const CELL = 44;
const VIEW = CELL * 3;
const RADII: Record<1 | 2 | 3, number> = { 1: 7, 2: 13, 3: 18 };

function patternId(tone: Tone, pattern: string): string {
  return `nvr-${pattern}-${tone}`;
}

/** The defs block every NVR svg shares — pattern fills, hue-independent. */
export function svgDefs(): string {
  const defs: string[] = [];
  for (const tone of Object.keys(TONE_HEX) as Tone[]) {
    const hex = TONE_HEX[tone];
    defs.push(
      `<pattern id="${patternId(tone, 'stripes')}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="none"/><line x1="0" y1="0" x2="0" y2="5" stroke="${hex}" stroke-width="2"/></pattern>`,
      `<pattern id="${patternId(tone, 'dots')}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="${hex}"/></pattern>`,
      `<pattern id="${patternId(tone, 'cross')}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3h6M3 0v6" stroke="${hex}" stroke-width="1.2"/></pattern>`,
    );
  }
  return `<defs>${defs.join('')}</defs>`;
}

function fillFor(spec: ShapeSpec): string {
  const hex = TONE_HEX[spec.tone];
  switch (spec.pattern) {
    case 'solid':
      return hex;
    case 'open':
      return 'none';
    default:
      return `url(#${patternId(spec.tone, spec.pattern)})`;
  }
}

function glyphPath(kind: ShapeSpec['kind'], r: number): string {
  switch (kind) {
    case 'circle':
      return `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    case 'square':
      return `M ${-r} ${-r} H ${r} V ${r} H ${-r} Z`;
    case 'triangle':
      // Isoceles, apex up: mirror-symmetric about the vertical axis only.
      return `M 0 ${-r} L ${r} ${r} L ${-r} ${r} Z`;
    case 'arrow':
      return `M 0 ${-r} L ${r * 0.7} ${r * 0.1} L ${r * 0.28} ${r * 0.1} L ${r * 0.28} ${r} L ${-r * 0.28} ${r} L ${-r * 0.28} ${r * 0.1} L ${-r * 0.7} ${r * 0.1} Z`;
    case 'star': {
      // Five points, apex up.
      const points: string[] = [];
      for (let index = 0; index < 10; index += 1) {
        const angle = -Math.PI / 2 + (index * Math.PI) / 5;
        const radius = index % 2 === 0 ? r : r * 0.45;
        points.push(`${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`);
      }
      return `M ${points.join(' L ')} Z`;
    }
    case 'arc':
      // Open semicircle bowl, symmetric about the vertical axis.
      return `M ${-r} 0 A ${r} ${r} 0 0 0 ${r} 0 L ${r * 0.65} 0 A ${r * 0.65} ${r * 0.65} 0 0 1 ${-r * 0.65} 0 Z`;
    case 'hook':
      // The chiral glyph: a J with a flat top bar. Its mirror is a different
      // picture at every rotation.
      return `M ${-r * 0.55} ${-r} H ${r * 0.55} V ${-r * 0.45} H ${r * 0.05} V ${r * 0.35} A ${r * 0.35} ${r * 0.35} 0 0 1 ${-r * 0.65} ${r * 0.35} L ${-r * 0.65} ${r * 0.05} L ${-r * 0.35} ${r * 0.05} A 0.1 0.1 0 0 0 ${-r * 0.25} ${r * 0.35} L ${-r * 0.25} ${-r * 0.45} H ${-r * 0.55} Z`;
    default:
      return `M ${-r} ${-r} H ${r} V ${r} H ${-r} Z`;
  }
}

function renderSpec(spec: ShapeSpec): string {
  const cx = spec.x * CELL + CELL / 2;
  const cy = spec.y * CELL + CELL / 2;
  const r = RADII[spec.size];
  const hex = TONE_HEX[spec.tone];
  const transforms = [`translate(${cx.toFixed(1)} ${cy.toFixed(1)})`];
  if (spec.mirrored) transforms.push('scale(-1 1)');
  if (spec.rotation % 360 !== 0) transforms.push(`rotate(${spec.rotation % 360})`);
  return `<path d="${glyphPath(spec.kind, r)}" transform="${transforms.join(' ')}" fill="${fillFor(spec)}" stroke="${hex}" stroke-width="2" stroke-linejoin="round"/>`;
}

function renderDecoration(decoration: NvrDecoration | undefined): string {
  switch (decoration) {
    case 'mirror-vertical':
      return `<line x1="${VIEW / 2}" y1="4" x2="${VIEW / 2}" y2="${VIEW - 4}" stroke="#1B2A4A" stroke-width="2" stroke-dasharray="6 4"/>`;
    case 'mirror-horizontal':
      return `<line x1="4" y1="${VIEW / 2}" x2="${VIEW - 4}" y2="${VIEW / 2}" stroke="#1B2A4A" stroke-width="2" stroke-dasharray="6 4"/>`;
    case 'fold-vertical':
      return `<rect x="3" y="3" width="${VIEW - 6}" height="${VIEW - 6}" rx="4" fill="none" stroke="#1B2A4A" stroke-width="1.5"/><line x1="${VIEW / 2}" y1="3" x2="${VIEW / 2}" y2="${VIEW - 3}" stroke="#1B2A4A" stroke-width="1.5" stroke-dasharray="4 4"/>`;
    case 'plan-grid': {
      const lines: string[] = [];
      for (let step = 0; step <= 3; step += 1) {
        lines.push(
          `<line x1="${step * CELL}" y1="0" x2="${step * CELL}" y2="${VIEW}" stroke="#1B2A4A" stroke-width="0.75" opacity="0.35"/>`,
          `<line x1="0" y1="${step * CELL}" x2="${VIEW}" y2="${step * CELL}" stroke="#1B2A4A" stroke-width="0.75" opacity="0.35"/>`,
        );
      }
      return lines.join('');
    }
    default:
      return '';
  }
}

/**
 * One panel or option as a self-contained SVG. Label is for the code table's
 * letter rows and the worked-example numbering on sample sheets.
 */
export function renderVisual(
  visual: Visual,
  options: { decoration?: NvrDecoration; label?: string; ariaLabel?: string } = {},
): string {
  const label = options.label
    ? `<text x="${VIEW / 2}" y="${VIEW - 4}" text-anchor="middle" font-family="inherit" font-size="15" font-weight="700" fill="#1B2A4A">${options.label}</text>`
    : '';
  return [
    `<svg viewBox="0 0 ${VIEW} ${VIEW}" width="100%" height="100%" role="img" aria-label="${options.ariaLabel ?? 'shape picture'}" xmlns="http://www.w3.org/2000/svg">`,
    svgDefs(),
    renderDecoration(options.decoration),
    visual.elements.map(renderSpec).join(''),
    label,
    '</svg>',
  ].join('');
}
