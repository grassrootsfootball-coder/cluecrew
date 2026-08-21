/**
 * THE QUEUE AS A DIFFERENCE (Annie, 2026-08-21 — R445). Run after EVERY delivery, not once.
 *
 * **It is the only instrument either side has that can produce the third column** — artefacts on her
 * disk that were never staged here. No single-sided count can see them.
 *
 * **TWO NUMBERS, AND THEY MEASURE DIFFERENT THINGS.** `check:staging-queue` measures the
 * ACKNOWLEDGEMENT channel: has anything inbound ever named this file. This measures CROSSING: does
 * the receiver's manifest carry these bytes. **A file can be crossed and unacknowledged**, and two
 * of two she checked were exactly that — counted absent because **a 24-character prefix cannot match
 * a sha256.** Her digests are full length from the thirty-fourth return onward.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { requirePopulation } from './lib/population';

const OUT = '/Users/davidb/Downloads/11+/from-cluecrew';
const DOWN = '/Users/davidb/Downloads';
const MANIFEST = join(DOWN, 'annie-held-manifest.md');

function main() {
  let manifest: string;
  try {
    manifest = readFileSync(MANIFEST, 'utf8');
  } catch {
    console.log(
      'check:manifest-diff: NO MANIFEST ON THIS SIDE — nothing compared, which is NOT "0 divergences".\n' +
        `  Expected the receiver's held manifest at ${MANIFEST}.`,
    );
    return;
  }
  const held = new Map<string, string>();
  for (const m of manifest.matchAll(/^\|\s*`([a-f0-9]{64})`\s*\|\s*`([^`]+)`/gm)) held.set(m[1], m[2]);

  const staged = new Map<string, { file: string; days: number }>();
  const now = Date.now();
  for (const f of readdirSync(OUT).filter((x) => !x.endsWith('.sha256'))) {
    let st;
    try { st = statSync(join(OUT, f)); } catch { continue; }
    if (!st.isFile()) continue;
    const d = createHash('sha256').update(readFileSync(join(OUT, f))).digest('hex');
    staged.set(d, { file: f, days: Math.floor((now - st.mtime.getTime()) / 86400000) });
  }

  requirePopulation('check:manifest-diff', {
    'digest(s) she holds': held.size,
    'distinct artefact(s) staged here': staged.size,
  });

  const crossed = [...staged].filter(([d]) => held.has(d));
  const notCrossed = [...staged].filter(([d]) => !held.has(d)).sort((a, b) => b[1].days - a[1].days);
  const hersOnly = [...held].filter(([d]) => !staged.has(d));

  console.log(
    `\n  CROSSED (bytes on both sides) : ${crossed.length}\n` +
      `  STAGED-NOT-CROSSED            : ${notCrossed.length}\n` +
      `  HERS, NEVER STAGED HERE       : ${hersOnly.length}\n` +
      '\n  WHAT THIS MEASURES: crossing, by full-length digest against the receiver\'s own manifest.\n' +
      '  WHAT IT DOES NOT: whether anything was READ, and whether anything was acknowledged.\n' +
      '  `check:staging-queue` measures acknowledgement and reports a different, larger absence —\n' +
      '  a file can be CROSSED and UNACKNOWLEDGED, and a truncated digest cannot match a sha256.',
  );
  if (notCrossed.length > 0) {
    console.log(`\n  oldest staged-not-crossed: ${notCrossed[0][1].days}d  ${notCrossed[0][1].file}`);
  }
}

main();
