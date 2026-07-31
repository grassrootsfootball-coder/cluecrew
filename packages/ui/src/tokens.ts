/**
 * Canonical design tokens — names come from docs/CLUECREW-MANIFESTO.md §6 and
 * are law. Pure white (#FFFFFF) is banned as a page background (D1/D4);
 * `cream` is the default background.
 *
 * Every token has ONE role, and this is arithmetic rather than preference:
 * a colour dark enough to reach 3:1 against `cream` can never also be light
 * enough to carry `ink` at 4.5:1 — the two luminance windows do not overlap,
 * for any hue. So:
 *
 *   ink                     the only token permitted for text
 *   amber, coral            fills, with ink on top (7.02:1 and 5.34:1)
 *   the four district hues  accents — borders, rules, nav marks — never fills
 *                           carrying text
 *
 * `pnpm audit:palette` enforces this and runs in CI. Colour is never the only
 * carrier of meaning (§6): under the three common types of colour vision
 * deficiency the district accents crowd each other, so anything a colour says
 * must also be said by a word, a shape or a position.
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
  /**
   * Maths district accent only. Amended to #409020 (manifesto v1.2): at
   * #5B9A68 this sat ΔE 22.1 from `vr-teal` — the two read as the same colour —
   * and collapsed to ΔE 8.5 from `nvr-violet` under tritanopia. Now 51.6 and
   * 23.5. Changed while the Maths district is unbuilt, which is the cheapest
   * this could ever be.
   */
  'maths-green': '#409020',
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
