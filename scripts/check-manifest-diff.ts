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
/**
 * **THE MIRROR: what SHE has produced.** The held manifest answers *did our artefacts reach her*.
 * This one answers *did hers reach us*, and until it existed the inbound gap could only be inferred
 * from ordinals — seven numbers with no file, cause unknown. **With it the gap is a LIST, by digest.**
 */
const OUTPUTS_MANIFEST = join(DOWN, 'annie-outputs-manifest.md');

/** One parser for both manifests. Two would disagree eventually, which is R429. */
function parseManifest(path: string): Map<string, string> | null {
  let text: string;
  try { text = readFileSync(path, 'utf8'); } catch { return null; }
  const out = new Map<string, string>();
  for (const m of text.matchAll(/^\|\s*`([a-f0-9]{64})`\s*\|\s*`([^`]+)`/gm)) out.set(m[1] as string, m[2] as string);
  return out;
}

/**
 * THE INBOUND LEG, BY DIGEST. Her outputs manifest against the files actually on this disk.
 *
 *   HERS, NOT HERE        a file she has produced that never crossed. **The list the ordinal gap
 *                         could only guess at.**
 *   HERE, DIGEST DIFFERS  same name, different bytes — the worst state, because every reader here
 *                         would treat it as arrived.
 *   HERE, NOT ON HER LIST a file this store holds that her manifest does not claim.
 */
function inbound(): void {
  const hers = parseManifest(OUTPUTS_MANIFEST);
  if (!hers) {
    console.log(
      `\n  INBOUND: NO OUTPUTS MANIFEST at ${OUTPUTS_MANIFEST}. Nothing compared, which is NOT\n`
      + '  "0 divergences" — the inbound gap falls back to an inference from ordinals.',
    );
    return;
  }
  const byName = new Map<string, string>();
  for (const [d, f] of hers) byName.set(f, d);

  const hereByDigest = new Map<string, string>();
  const hereByName = new Map<string, string>();
  for (const f of readdirSync(DOWN)) {
    let st;
    try { st = statSync(join(DOWN, f)); } catch { continue; }
    if (!st.isFile() || !/\.(md|json|txt|jsonl)$/i.test(f)) continue;
    const d = createHash('sha256').update(readFileSync(join(DOWN, f))).digest('hex');
    hereByDigest.set(d, f);
    hereByName.set(f, d);
  }

  const notHere = [...hers].filter(([d]) => !hereByDigest.has(d));
  const differs = notHere.filter(([, f]) => hereByName.has(f));
  const absent = notHere.filter(([, f]) => !hereByName.has(f));
  const hereNotClaimed = [...hereByName].filter(([f, d]) => !hers.has(d) && !byName.has(f) && /^annie-/.test(f));

  console.log(
    `\n  INBOUND, BY DIGEST — her outputs manifest against this disk.\n`
    + `  she has produced           : ${hers.size}\n`
    + `  CROSSED (bytes both sides) : ${hers.size - notHere.length}\n`
    + `  HERS, NEVER ARRIVED        : ${absent.length}\n`
    + `  HERE BUT DIGEST DIFFERS    : ${differs.length}\n`
    + `  HERE, NOT ON HER LIST      : ${hereNotClaimed.length}`,
  );
  for (const [, f] of absent.sort((a, b) => a[1].localeCompare(b[1]))) console.error(`      NEVER ARRIVED  ${f}`);
  for (const [, f] of differs) console.error(`      DIGEST DIFFERS ${f} — same name, different bytes`);
  for (const [f] of hereNotClaimed) console.log(`      NOT CLAIMED    ${f}`);
  if (absent.length + differs.length > 0) process.exitCode = 1;
}

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
  const held = parseManifest(MANIFEST) as Map<string, string>;

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
    for (const [, v] of notCrossed.slice(0, 8)) console.log(`      ${String(v.days).padStart(2)}d  ${v.file}`);
  }
  inbound();
}

main();
