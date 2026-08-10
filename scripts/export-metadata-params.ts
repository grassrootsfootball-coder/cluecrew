/**
 * THE FIVE NAMED-METADATA PARAMETERS — `pnpm export:metadata-params`
 *
 * Annie's ruling, 2026-08-09: send her which properties fall on the metadata side of R31's test —
 * declared on a signed sheet, but not recomputable from the emitted item, so classed as family
 * metadata rather than an asserted promise (R41's class-2 fault in R43's taxonomy: honest about
 * what it cannot verify, not a defect).
 *
 * Every value below is read from the family's own declaration, not summarised — R25.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { familyTiers, type MathsFamily } from '../packages/core/src/maths/generator';
import { MATHS_FAMILIES } from '../packages/core/src/maths/families';
import { artefactStamp, deliver, stampHeader, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'metadata-only-params';

const METADATA_KEYS: Record<string, string[]> = {
  'M-money': ['kind', 'parts'],
  'M-pct': ['shape'],
  'M-geom': ['shape'],
  'M-inverse': ['mode'],
};

interface Row { family: string; param: string; perTier: Record<string, string | number> }

function collect(): Row[] {
  const rows: Row[] = [];
  for (const [famId, keys] of Object.entries(METADATA_KEYS)) {
    const f = MATHS_FAMILIES.find((x) => x.id === famId) as MathsFamily | undefined;
    if (!f?.structuralParams) continue;
    for (const key of keys) {
      const perTier: Record<string, string | number> = {};
      for (const t of familyTiers(f)) perTier[`T${t}`] = f.structuralParams(t)[key]!;
      rows.push({ family: famId, param: key, perTier });
    }
  }
  return rows;
}

function main(): void {
  const rows = collect();
  const generatedAt = new Date().toISOString();
  const stamp = artefactStamp(rows, generatedAt, 'content', 'the five parameters R31 classes as family metadata — declared, not recomputable, per annie\'s test');

  const md =
    `# The five metadata-only parameters\n\n${stampHeader(stamp, 'md')}\n\n` +
    `R31's test: could you recompute this from the emitted item alone? These five could not, so\n` +
    `they were named as family metadata rather than asserted (R43's class 2 — honest about what it\n` +
    `cannot verify, not a defect). Per-tier value shown is the declaration itself, unsummarised.\n\n` +
    rows.map((r) => `## \`${r.family}\` — \`${r.param}\`\n\n` + Object.entries(r.perTier).map(([t, v]) => `- ${t}: \`${v}\``).join('\n') + '\n').join('\n') +
    `\n## \`tn-teacher\` — still outstanding\n\n` +
    `Not a metadata parameter — flagged alongside this export because it is the other open item on\n` +
    `her desk from the same pass. R36: the seven \`parses: 2\` tense rows needed a per-option call\n` +
    `the aggregate did not carry; six were derivable without ambiguity, and \`tn-teacher\` was held\n` +
    `because the arithmetic admits two readings (a past-perfect key with a past-simple second parse,\n` +
    `or one option parsing two ways rather than two options parsing). The code currently holds the\n` +
    `first reading — key \`had copied\`, second parse \`copied\` — sent as a proposal, not asserted,\n` +
    `because the ruling is hers and has not landed.\n`;

  mkdirSync(OUT_DIR, { recursive: true });
  const base = stampedName(FAMILY, stamp.sourceHash, '').replace(/\.$/, '');
  writeFileSync(join(OUT_DIR, `${base}.md`), md);
  writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify({ kind: FAMILY, ...stamp, rows }, null, 2));
  for (const ext of ['md', 'json']) deliver(join(OUT_DIR, `${base}.${ext}`), FAMILY);
  console.log(`${rows.length} metadata parameters across ${new Set(rows.map((r) => r.family)).size} families · tn-teacher flagged outstanding`);
}

main();
