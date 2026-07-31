/**
 * Enforces manifesto §6 (v1.2) against the real tokens.
 *
 * §6 gives every token exactly one role, because a colour cannot do both jobs:
 * for any hue, the luminance window for 3:1 against `cream` and the window for
 * carrying `ink` at 4.5:1 do not overlap. So this checks each token against the
 * role it is declared to have, and fails the build when one slips.
 *
 * It also reports how the district accents behave under the three common types
 * of colour vision deficiency. That part does NOT fail the build — the accents
 * genuinely do crowd each other, and §6 answers it with the "colour is never
 * the only carrier of meaning" rule instead, which no script can check. The
 * numbers are printed so the crowding is never a surprise to anyone.
 */
import { readFileSync } from 'node:fs';

// Read from the real token source rather than a copy, so this can never
// quietly audit a palette the product no longer ships.
const tokenSource = readFileSync(new URL('../packages/ui/src/tokens.ts', import.meta.url), 'utf8');
const color = Object.fromEntries(
  [...tokenSource.matchAll(/'?([a-z-]+)'?:\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2]]),
);
if (Object.keys(color).length !== 8) {
  console.error(`expected 8 tokens from tokens.ts, parsed ${Object.keys(color).length}`);
  process.exit(1);
}

/** The role §6 assigns each token. */
const ROLE = {
  ink: 'text',
  cream: 'background',
  amber: 'fill', // a surface carrying ink on top
  coral: 'fill',
  'vr-teal': 'accent', // borders and rules, never text-bearing
  'nvr-violet': 'accent',
  'maths-green': 'accent',
  'english-rose': 'accent',
};

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const asHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lin = (v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const lum = (hex) =>
  rgb(hex)
    .map(lin)
    .reduce((sum, c, i) => sum + [0.2126, 0.7152, 0.0722][i] * c, 0);
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
};
const toLab = (hex) => {
  const [r, g, b] = rgb(hex).map(lin);
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
const simulate = (hex, type) => {
  const [r, g, b] = rgb(hex);
  const m = {
    protanopia: [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
    deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
    tritanopia: [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
  }[type];
  return asHex(m.map((row) => Math.min(255, row[0] * r + row[1] * g + row[2] * b)));
};

const failures = [];
const check = (ok, message) => {
  console.log(`  ${ok ? '✓' : '✗'} ${message}`);
  if (!ok) failures.push(message);
};

console.log('§6 roles — each token checked against the ONE job it has\n');

console.log('text');
check(
  contrast(color.ink, color.cream) >= 4.5,
  `ink on cream ${contrast(color.ink, color.cream)}:1 (needs 4.5)`,
);

console.log('\nfills — a surface with ink on top');
for (const [name, role] of Object.entries(ROLE)) {
  if (role !== 'fill') continue;
  const ratio = contrast(color.ink, color[name]);
  check(ratio >= 4.5, `ink on ${name} ${ratio}:1 (needs 4.5)`);
}

console.log('\naccents — carry meaning without text, so measured against cream');
for (const [name, role] of Object.entries(ROLE)) {
  if (role !== 'accent') continue;
  const ratio = contrast(color[name], color.cream);
  check(ratio >= 3.0, `${name} on cream ${ratio}:1 (needs 3.0)`);
}

console.log('\nevery token distinguishable from every other (ΔE > 25)');
const names = Object.keys(color);
let tooClose = 0;
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const d = deltaE(color[names[i]], color[names[j]]);
    if (d <= 25) {
      check(false, `${names[i]} vs ${names[j]} ΔE ${d} — too close to tell apart`);
      tooClose += 1;
    }
  }
}
if (tooClose === 0) console.log(`  ✓ all ${(names.length * (names.length - 1)) / 2} pairs separated`);

console.log('\nD1 — the try-again colour must not be red');
check(
  deltaE(color.coral, '#FF0000') > 40,
  `coral is ΔE ${deltaE(color.coral, '#FF0000')} from pure red (needs > 40)`,
);

console.log('\nreport only — district accents under colour vision deficiency.');
console.log('§6 answers this with "colour is never the only carrier of meaning",');
console.log('which no script can check. The numbers are here to stay honest:\n');
const districts = names.filter((n) => ROLE[n] === 'accent');
for (const type of ['protanopia', 'deuteranopia', 'tritanopia']) {
  const crowded = [];
  for (let i = 0; i < districts.length; i++) {
    for (let j = i + 1; j < districts.length; j++) {
      const d = deltaE(simulate(color[districts[i]], type), simulate(color[districts[j]], type));
      if (d < 25) crowded.push(`${districts[i]}/${districts[j]} (ΔE ${d})`);
    }
  }
  console.log(
    `  ${type.padEnd(14)} ${crowded.length ? 'crowds: ' + crowded.join(', ') : 'all four stay distinct'}`,
  );
}

if (failures.length > 0) {
  console.error(`\nPalette audit FAILED: ${failures.length} rule(s) broken (manifesto §6).`);
  process.exit(1);
}
console.log('\nPalette audit passed (manifesto §6 v1.2).');
