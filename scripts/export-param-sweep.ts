/**
 * RETROSPECTIVE PARAMETER SWEEP — `pnpm export:param-sweep`
 *
 * Annie's R31 asked for this explicitly, and over the SIGNED families, not only the unsigned:
 * any family where an emitted item's recomputed parameters disagree with its declared ones had a
 * sample sheet that said something untrue when she signed it.
 *
 * So this emits every family to exhaustion, recomputes each declared parameter FROM THE EMITTED
 * ITEM, and reports disagreements. It also reports the families that cannot be swept — a family
 * with no `recomputeParams` is not passing, it is unchecked, and the two must never read alike.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SPAG_FAMILIES } from '../packages/core/src/english/spag-families';
import { assembleSpagItem, SpagGateError } from '../packages/core/src/english/spag-generator';
import { spagFamilyTiers } from '../packages/core/src/english/spag-fingerprint';
import { makeRng } from '../packages/core/src/maths/generator';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY_FILE = 'spag-param-sweep';
const DRAWS = 600;

interface Row {
  id: string;
  swept: boolean;
  tiers: string[];
  declared: Record<string, Record<string, string | number>>;
  metadata: Record<string, Record<string, string | number>>;
  emissions: number;
  mismatches: Array<{ tier: number; detail: string; count: number }>;
}

function main(): void {
  const rows: Row[] = [];
  for (const family of SPAG_FAMILIES) {
    const tiers = spagFamilyTiers(family);
    const declared: Row['declared'] = {};
    const metadata: Row['metadata'] = {};
    for (const t of tiers) {
      declared[`T${t}`] = family.structuralParams(t);
      if (family.metadata) metadata[`T${t}`] = family.metadata(t);
    }
    const mismatch = new Map<string, { tier: number; detail: string; count: number }>();
    let emissions = 0;
    for (const tier of tiers) {
      const r = makeRng(4242 + tier);
      for (let i = 0; i < DRAWS; i += 1) {
        try {
          assembleSpagItem(family, tier, r);
          emissions += 1;
        } catch (e) {
          // Only a PARAMETER disagreement is a sweep finding. A gate refusal (a draw that failed
          // the child-facing check, a duplicate) is the generator working, not a false sheet.
          const msg = e instanceof SpagGateError ? e.message : String(e);
          if (/declared .* but the emitted item has|cannot recompute it/.test(msg)) {
            const k = `${tier}|${msg}`;
            const prev = mismatch.get(k);
            mismatch.set(k, { tier, detail: msg, count: (prev?.count ?? 0) + 1 });
          }
        }
      }
    }
    rows.push({
      id: family.id,
      swept: Boolean(family.recomputeParams),
      tiers: tiers.map((t) => `T${t}`),
      declared,
      metadata,
      emissions,
      mismatches: [...mismatch.values()],
    });
  }

  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'content', 'every SPaG family swept for disagreement between its declared parameters and the items it emits');
  const swept = rows.filter((r) => r.swept);
  const unchecked = rows.filter((r) => !r.swept);
  const bad = rows.filter((r) => r.mismatches.length);

  const md =
    `# Parameter sweep — declared against emitted\n\n${stampHeader(stamp, 'md')}\n\n` +
    `**${swept.length} of ${rows.length} families swept · ${swept.reduce((s, r) => s + r.emissions, 0).toLocaleString('en-GB')} items emitted · ` +
    `${bad.length} families with a disagreement.**\n\n` +
    (unchecked.length
      ? `**${unchecked.length} families are UNCHECKED, not passing** (${unchecked.map((r) => `\`${r.id}\``).join(', ')}). ` +
        `They declare no recomputation, so nothing was asserted about them. Stated separately because an ` +
        `unchecked family and a clean one must never read alike.\n\n`
      : '') +
    `| family | swept | tiers | items emitted | disagreements |\n|---|---|---|---:|---:|\n` +
    rows.map((r) => `| \`${r.id}\` | ${r.swept ? 'yes' : '**no**'} | ${r.tiers.join(',')} | ${r.emissions} | ${r.mismatches.length ? `**${r.mismatches.reduce((s, m) => s + m.count, 0)}**` : '0'} |`).join('\n') +
    `\n\n## Declared parameters, per family per tier\n\n` +
    rows
      .map(
        (r) =>
          `**\`${r.id}\`**\n` +
          Object.entries(r.declared).map(([t, p]) => `  · ${t} asserted: \`${JSON.stringify(p)}\``).join('\n') +
          (Object.keys(r.metadata).length
            ? `\n` + Object.entries(r.metadata).map(([t, p]) => `  · ${t} metadata (NOT asserted — fails the recomputability test): \`${JSON.stringify(p)}\``).join('\n')
            : '') +
          '\n',
      )
      .join('\n') +
    (bad.length
      ? `\n## Disagreements\n\n` + bad.map((r) => `**\`${r.id}\`**\n` + r.mismatches.map((m) => `  · [${m.count}×] ${m.detail}`).join('\n')).join('\n\n') + '\n'
      : `\n## Disagreements\n\nNone. Every declared parameter, on every item emitted, recomputes to the declared value.\n`);

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY_FILE, stamp.sourceHash, '').replace(/\.$/, '');
  const mdPath = join(OUT_DIR, `${base}.md`);
  const jsonPath = join(OUT_DIR, `${base}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify({ kind: FAMILY_FILE, ...stamp, rows }, null, 2));
  for (const p of [mdPath, jsonPath]) deliver(p, FAMILY_FILE);
  console.log(`${swept.length}/${rows.length} swept · ${swept.reduce((s, r) => s + r.emissions, 0)} items · ${bad.length} families with a disagreement`);
}

main();
