/**
 * RETROSPECTIVE PARAMETER SWEEP — MATHS (`pnpm sweep:maths-params`)
 *
 * The 19 signed families, swept the way the 13 SPaG families were. Any family where an emitted
 * item's RECOMPUTED parameters disagree with the declared ones had a sheet that said something
 * untrue when it was signed.
 *
 * Reports three outcomes per family, because they mean different things:
 *   ASSERTED   — every declared parameter is recomputable and agrees on every draw.
 *   PARTIAL    — some declared parameters are family metadata by annie's test (not recomputable
 *                from the emitted item) and are named, so the gap is a recorded judgement.
 *   DISAGREES  — a recomputed parameter contradicts the sheet. This is the finding.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MATHS_FAMILIES } from '../packages/core/src/maths/families';
import { assembleItem, familyTiers, makeRng, GateError } from '../packages/core/src/maths/generator';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-param-sweep';
const DRAWS = 400;

function main(): void {
  const rows = MATHS_FAMILIES.map((f) => {
    const declaredKeys = f.structuralParams ? Object.keys(f.structuralParams(familyTiers(f)[0]!)) : [];
    const mismatches = new Map<string, number>();
    let emissions = 0;
    const recomputed = new Set<string>();
    for (const tier of familyTiers(f)) {
      const r = makeRng(9001 + tier);
      for (let i = 0; i < DRAWS; i += 1) {
        try {
          const item = assembleItem(f, tier, r);
          emissions += 1;
          if (f.recomputeParams) Object.keys(f.recomputeParams(item, tier)).forEach((k) => recomputed.add(k));
        } catch (e) {
          // A GateError naming a declared parameter IS the disagreement; anything else is a
          // legitimate refusal (range, key recompute, notation) and not this sweep's business.
          const msg = e instanceof GateError ? e.message : '';
          if (/but the emitted item has/.test(msg)) mismatches.set(msg, (mismatches.get(msg) ?? 0) + 1);
        }
      }
    }
    const metadata = declaredKeys.filter((k) => !recomputed.has(k));
    return {
      id: f.id,
      tiers: familyTiers(f).map((t) => `T${t}`),
      declared: declaredKeys,
      asserted: [...recomputed].sort(),
      metadataOnly: metadata,
      emissions,
      verdict: mismatches.size ? 'DISAGREES' : declaredKeys.length === 0 ? 'NONE-DECLARED' : metadata.length ? 'PARTIAL' : 'ASSERTED',
      mismatches: [...mismatches].map(([detail, count]) => ({ detail, count })),
    };
  });

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'mixed', 'every signed maths family, with its declared parameters recomputed from emitted items');
  const disagree = rows.filter((r) => r.verdict === 'DISAGREES');

  const md =
    `# Maths families — declared vs emitted\n\n${stampHeader(stamp, 'md')}\n\n` +
    `${rows.length} families · ${rows.reduce((s, r) => s + r.emissions, 0)} items generated · ` +
    `**${disagree.length} disagreeing with the signed sheet**\n\n` +
    `| family | tiers | declared | asserted | metadata only | verdict |\n|---|---|---|---|---|---|\n` +
    rows.map((r) => `| \`${r.id}\` | ${r.tiers.join(',')} | ${r.declared.join(', ') || '—'} | ${r.asserted.join(', ') || '—'} | ${r.metadataOnly.join(', ') || '—'} | ${r.verdict} |`).join('\n') +
    `\n\n**"Metadata only"** means the parameter is not recomputable from the emitted item, so by\n` +
    `annie's test it is not a promise about the item and belongs off the sheet. Named per family\n` +
    `rather than dropped silently — the naming is the judgement.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  writeFileSync(join(OUT_DIR, `${base}.md`), md);
  writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify({ kind: FAMILY, ...stamp, rows }, null, 2));
  for (const ext of ['md', 'json']) deliver(join(OUT_DIR, `${base}.${ext}`), FAMILY);
  console.log(`${rows.length} families · ${rows.reduce((s, r) => s + r.emissions, 0)} items · ${disagree.length} disagreeing`);
  for (const r of rows) console.log(`  ${r.verdict.padEnd(14)} ${r.id.padEnd(11)} asserted [${r.asserted.join(', ')}] metadata [${r.metadataOnly.join(', ')}]`);
}

main();
