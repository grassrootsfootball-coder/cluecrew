/**
 * Asset manifest + image-weight budget check (BUILD-PHASE-5 §2, gate #3/#9).
 *  - Every file in apps/web/public and assets/brand has a manifest entry with
 *    provenance; raw-AI provenance is rejected outright for childFacing files.
 *  - Weight budget (D6): any single image ≤ 200KB, mascot.riv ≤ 250KB,
 *    sounds ≤ 120KB each, apps/web/public total ≤ 3MB.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(ROOT, 'assets/manifest.json'), 'utf8'));
const entries = new Map(manifest.assets.map((asset) => [asset.path, asset]));

const LIMITS = {
  image: 200 * 1024,
  riv: 250 * 1024,
  sound: 120 * 1024,
  publicTotal: 3 * 1024 * 1024,
};
const SKIP = new Set(['crew-sw.js', '.DS_Store']);

function collect(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collect(full));
    else out.push(full);
  }
  return out;
}

const failures = [];
let publicTotal = 0;

for (const scanRoot of ['apps/web/public', 'assets/brand']) {
  for (const file of collect(join(ROOT, scanRoot))) {
    const rel = relative(ROOT, file);
    const size = statSync(file).size;
    if (scanRoot === 'apps/web/public') publicTotal += size;

    const entry = entries.get(rel);
    if (!entry) {
      failures.push(`${rel}: missing from assets/manifest.json (provenance is mandatory)`);
      continue;
    }
    if (/^ai(-raw|-generated)?:/.test(entry.provenance) && entry.childFacing) {
      failures.push(`${rel}: raw AI provenance on a child-facing asset — forbidden (§2)`);
    }
    const limit = rel.endsWith('.riv')
      ? LIMITS.riv
      : /\.(mp3|ogg|wav|m4a)$/.test(rel)
        ? LIMITS.sound
        : LIMITS.image;
    if (size > limit) {
      failures.push(`${rel}: ${Math.round(size / 1024)}KB exceeds its ${Math.round(limit / 1024)}KB budget — the asset changes, not the budget`);
    }
  }
}

if (publicTotal > LIMITS.publicTotal) {
  failures.push(`apps/web/public totals ${Math.round(publicTotal / 1024)}KB > ${Math.round(LIMITS.publicTotal / 1024)}KB budget`);
}

if (failures.length > 0) {
  console.error('Asset check FAILED:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`Asset check passed (${entries.size} manifest entries; public total ${Math.round(publicTotal / 1024)}KB).`);
