/**
 * GAP FAMILIES for the reviewer — `pnpm export:maths-gap-families`.
 *
 * The recurring misconception patterns the calibration batch reached for that
 * the 60-entry library does not yet name, clustered from 110 plain-language
 * distractor behaviours. Formatted like her seed library so she can number and
 * word each one (add a hint), then they map to items on import.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';
import { CATEGORY_NAMES, GROUP_ORDER, buildCalibration } from './lib/maths-calibration-source';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-gap-families';

function main(): void {
  const { families } = buildCalibration();
  const stamp = freshnessStamp(families, new Date().toISOString());
  let n = 0;
  const sections = GROUP_ORDER.map((group, gi) => {
    const fams = families.filter((f) => f.group === group);
    const body = fams.map((f) => {
      n += 1;
      const items = Object.entries(f.items).map(([id, c]) => `${id} (${c})`).join(', ');
      return `**G${n}. ${f.title}** — ${f.description}\n*Items:* ${items}  ·  ${f.distractors} distractor${f.distractors === 1 ? '' : 's'} total\n*Hint:* `;
    }).join('\n\n');
    return `## ${gi + 1}. ${CATEGORY_NAMES[group]}\n\n${body}`;
  }).join('\n\n');

  const md = `# KS2 MATHS — GAP FAMILIES FROM CALIBRATION BATCH 01
**Clustered from MATHS-CALIBRATION-01 for the specialist reviewer.**
**${families.length} recurring misconception patterns authoring reached for that the approved 60-entry library does not yet name. Each is a candidate library entry: number it, title it in your words, and add a child hint — then it maps to the items listed and imports through the written-review path, exactly like the seed library.**
**Format matches your seed library so the two read as one document. \`sourceHash: ${stamp.sourceHash}\` · generated ${stamp.generatedAt.slice(0, 10)}.**

---

${sections}

---

## NOTES
- Every gap family is a *derivable* misconception already executed on real item numbers by authoring — the item ids and distractor counts above are exactly where each occurs.
- Numbering (G1…G${n}) is provisional, for reference only. Your final ids and wording become canonical; the batch import maps behaviours to them.
- The three named library entries you supplied — #11, #21, #24 — are already tagged on their items and are NOT repeated here.
`;

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'md'));
  writeFileSync(path, md);
  // A JSON manifest so `check:export-freshness` can verify the doc (an .md
  // carries no parseable hash; this does).
  const manifestPath = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'json'));
  writeFileSync(manifestPath, JSON.stringify({ kind: 'maths-gap-families', ...stamp, familyCount: families.length, artifacts: [stampedName(FAMILY, stamp.sourceHash, 'md')] }, null, 2));
  console.log(`${families.length} gap families → ${path}`);
  deliver(path, FAMILY);
  deliver(manifestPath, FAMILY);
}

main();
