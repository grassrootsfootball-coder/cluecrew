import { readFileSync } from 'node:fs';

/**
 * Measures every child-facing colour pair in the manifesto §6 palette, plus
 * how distinguishable the four district accents are from one another — the
 * thing that matters if colour is ever load-bearing for a child.
 */
// Read from the real token source rather than a copy, so this can never
// quietly audit a palette the product no longer ships.
const tokenSource = readFileSync(
  new URL('../packages/ui/src/tokens.ts', import.meta.url),
  'utf8',
);
const color = Object.fromEntries(
  [...tokenSource.matchAll(/'?([a-z-]+)'?:\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]),
);
if (Object.keys(color).length !== 8) {
  console.error(`expected 8 tokens from tokens.ts, parsed ${Object.keys(color).length}`);
  process.exit(1);
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) =>
  rgb(hex)
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + [0.2126, 0.7152, 0.0722][i] * c, 0);
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};

// Perceptual distance in OKLab-ish terms via simple CIE76 on Lab.
const toLab = (hex) => {
  let [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [X, Y, Z] = [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883,
  ];
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
const deltaE = (a, b) => {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.round(Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 10) / 10;
};

const AA_BODY = 4.5;
const AA_LARGE = 3.0;

console.log('TEXT ON THE TWO BACKGROUNDS (AA body needs 4.5, large text 3.0)\n');
for (const bg of ['cream', 'amber']) {
  for (const [name, hex] of Object.entries(color)) {
    if (name === bg) continue;
    const ratio = contrast(hex, color[bg]);
    const body = ratio >= AA_BODY ? 'body ok ' : 'BODY FAIL';
    const large = ratio >= AA_LARGE ? 'large ok' : 'LARGE FAIL';
    console.log(`  ${name.padEnd(14)} on ${bg.padEnd(6)} ${String(ratio).padStart(6)}:1   ${body}  ${large}`);
  }
  console.log('');
}

console.log('DISTRICT ACCENTS AGAINST EACH OTHER (deltaE; under ~25 reads as "similar")\n');
const districts = ['vr-teal', 'nvr-violet', 'maths-green', 'english-rose'];
for (let i = 0; i < districts.length; i++) {
  for (let j = i + 1; j < districts.length; j++) {
    const d = deltaE(color[districts[i]], color[districts[j]]);
    console.log(`  ${districts[i].padEnd(14)} vs ${districts[j].padEnd(14)} ΔE ${String(d).padStart(5)}${d < 25 ? '   ← close' : ''}`);
  }
}

console.log('\nCOMMON COLOUR VISION DEFICIENCY: how the accents collapse\n');
// Brettel-style approximation, enough to show which pairs merge.
const simulate = (hex, type) => {
  const [r, g, b] = rgb(hex);
  const m = {
    protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
    deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
    tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
  }[type];
  const out = m.map((row) => Math.round(Math.min(255, row[0] * r + row[1] * g + row[2] * b)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
for (const type of ['protanopia', 'deuteranopia', 'tritanopia']) {
  const merged = [];
  for (let i = 0; i < districts.length; i++) {
    for (let j = i + 1; j < districts.length; j++) {
      const d = deltaE(simulate(color[districts[i]], type), simulate(color[districts[j]], type));
      if (d < 25) merged.push(`${districts[i]}/${districts[j]} (ΔE ${d})`);
    }
  }
  console.log(`  ${type.padEnd(14)} ${merged.length ? 'merges: ' + merged.join(', ') : 'all four stay distinct'}`);
}

console.log('\nCORAL — the try-again colour (D1 says errors are never red)\n');
console.log(`  coral on cream        ${contrast(color.coral, color.cream)}:1`);
console.log(`  ink on coral          ${contrast(color.ink, color.coral)}:1`);
console.log(`  ΔE coral vs pure red  ${deltaE(color.coral, '#FF0000')}`);
