/**
 * RETROSPECTIVE PARAMETER SWEEP — MATHS (`pnpm sweep:maths-params`)
 *
 * The 19 signed families, swept the way the 13 SPaG families were. Any family where an emitted
 * item's RECOMPUTED parameters disagree with the declared ones had a sheet that said something
 * untrue when it was signed.
 *
 * Reports four outcomes per family, because they mean different things:
 *   ASSERTED   — every declared parameter is recomputable and agrees on every draw.
 *   PARTIAL    — some declared parameters are family metadata by annie's test (not recomputable
 *                from the emitted item) and are named, so the gap is a recorded judgement.
 *   DISAGREES  — a recomputed parameter contradicts the sheet. This is the finding.
 *   BLIND      — the family emitted NOTHING, so this sweep asserts nothing about it either way.
 *
 * BLIND exists because of what the other three did without it (audit, 2026-08-12). A family that
 * emitted zero items scored PARTIAL — every declared key fell into `metadataOnly` for want of a
 * recompute that never ran — and PARTIAL is a LEGITIMATE verdict meaning "a recorded judgement".
 * So total emission failure was reported as considered nuance, under a headline of "0 disagreeing",
 * which is also what a perfect sweep prints. Nineteen maths signatures rest on this sheet.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';
import { sweepMathsFamilies } from './lib/param-sweep';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-param-sweep';

function main(): void {
  const rows = sweepMathsFamilies();

  /**
   * CANARY — things this sweep must find before it is allowed to report.
   *
   * It knew nothing it had to find, and it DELIVERS: a blind run does not merely print a
   * misleading line, it supersedes the good sheet in the reviewer's drop and replaces it with
   * one asserting nothing. Verified by running it at DRAWS=0 — the valid artefact was removed
   * and a zero-emission sweep delivered in its place, still headlined "0 disagreeing".
   *
   * So: refuse to write or deliver anything unless every family emitted, and unless at least one
   * recompute actually fired. The second half catches a dead mechanism — strip `recomputeParams`
   * from every family and each row becomes PARTIAL with "0 disagreeing" on top.
   */
  const blind = rows.filter((r) => r.verdict === 'BLIND');
  const anyRecomputed = rows.some((r) => r.asserted.length > 0);
  if (blind.length > 0 || !anyRecomputed) {
    console.error('MATHS PARAM SWEEP ABORTED — nothing delivered, the existing sheet is left alone.\n');
    if (blind.length > 0) {
      console.error(`  ${blind.length} of ${rows.length} families emitted no items at all:`);
      for (const r of blind) console.error(`    ${r.id} (tiers ${r.tiers.join(',')})`);
      console.error('  A family that emits nothing is not a family whose parameters agree.');
    }
    if (!anyRecomputed) {
      console.error('  No family recomputed a single parameter — the recompute mechanism is dead.');
      console.error('  Every row would read PARTIAL under a "0 disagreeing" headline.');
    }
    console.error('\nNineteen maths signatures rest on this sheet. Fix the generator, then re-run.');
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'mixed', 'every signed maths family, with its declared parameters recomputed from emitted items');
  const disagree = rows.filter((r) => r.verdict === 'DISAGREES');

  const md =
    `# Maths families — declared vs emitted\n\n${stampHeader(stamp, 'md')}\n\n` +
    `${rows.length} families · ${rows.reduce((s, r) => s + r.emissions, 0)} items generated · ` +
    `**${disagree.length} disagreeing with the signed sheet**\n\n` +
    `| family | tiers | emitted | declared | asserted | metadata only | verdict |\n|---|---|---|---|---|---|---|\n` +
    rows.map((r) => `| \`${r.id}\` | ${r.tiers.join(',')} | ${r.emissions} | ${r.declared.join(', ') || '—'} | ${r.asserted.join(', ') || '—'} | ${r.metadataOnly.join(', ') || '—'} | ${r.verdict} |`).join('\n') +
    `\n\n**"Metadata only"** means this run's recompute does not assert the parameter — it is not\n` +
    `currently a promise about the item. That is NOT the same as settled (R44): the gap may be a\n` +
    `genuine design limit (class A) or an open threading gap the family already has the data for\n` +
    `(class B, \`optionsThatParse\`'s shape before \`parses\` existed). Run \`pnpm export:metadata-\n` +
    `params\` for the per-parameter class and reason — this table only reports which; it does not\n` +
    `say why.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  writeFileSync(join(OUT_DIR, `${base}.md`), md);
  writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify({ kind: FAMILY, ...stamp, rows }, null, 2));
  for (const ext of ['md', 'json']) deliver(join(OUT_DIR, `${base}.${ext}`), FAMILY);
  console.log(`${rows.length} families · ${rows.reduce((s, r) => s + r.emissions, 0)} items · ${disagree.length} disagreeing`);
  for (const r of rows) {
    console.log(
      `  ${r.verdict.padEnd(14)} ${r.id.padEnd(11)} ${String(r.emissions).padStart(5)} emitted · ` +
        `asserted [${r.asserted.join(', ')}] metadata [${r.metadataOnly.join(', ')}]`,
    );
  }
}

main();
