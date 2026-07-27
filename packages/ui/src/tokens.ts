/**
 * Canonical design tokens — names come from docs/CLUECREW-MANIFESTO.md §6 and
 * are law.
 * Pure white (#FFFFFF) is banned as a page background (D1/D4); `cream` is the
 * default background. District accents appear only inside their district and
 * in navigation. All text/background pairs must pass WCAG AA before merge.
 */
export const color = {
  /** Primary text, brand, headers */
  ink: '#1B2A4A',
  /** Progress, achievement, CTAs, the "torchlight" */
  amber: '#F5A623',
  /** Default background — never pure white */
  cream: '#FAF6EF',
  /** Try-again states ONLY (D1: errors are never red) */
  coral: '#E8836B',
  /** VR district accent only */
  'vr-teal': '#2A9D8F',
  /** NVR district accent only */
  'nvr-violet': '#7B6FA8',
  /** Maths district accent only */
  'maths-green': '#5B9A68',
  /** English district accent only */
  'english-rose': '#C76B7E',
} as const;

export type ColorToken = keyof typeof color;

/** Emits the palette as CSS custom properties, e.g. `--cc-ink: #1B2A4A;` */
export function cssVariables(): string {
  return Object.entries(color)
    .map(([name, hex]) => `--cc-${name}: ${hex};`)
    .join('\n');
}

/**
 * Accessibility defaults (D4): dyslexia-aware typography.
 * Generous spacing, no justified text, cream backgrounds.
 */
export const typography = {
  lineHeight: 1.6,
  letterSpacing: '0.01em',
  wordSpacing: '0.05em',
  /** text-align: justify is banned in child-facing UI */
  textAlign: 'left',
} as const;
