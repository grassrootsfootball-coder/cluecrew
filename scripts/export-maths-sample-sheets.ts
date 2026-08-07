/**
 * MATHS SAMPLE SHEETS for the reviewer sitting — `pnpm export:maths-sample-sheets`.
 *
 * Annie signs the RULE, not the output (docs/annie-maths-families.md), so each family's
 * sheet shows, per tier: the tier rule, the number ranges, 30 generated items, and the
 * per-family EXECUTOR COVERAGE — which distractor ids are derived (the gate recomputes
 * them on the item's own numbers) and which are authored (trusted to the author). Every
 * item shown has already passed the derivability + notation gates (it could not generate
 * otherwise). Seeded, so a signed sheet regenerates byte-for-byte.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { MATHS_FAMILIES, derive, familyExecutorCoverage, generateSample, mathsEntryNumber, type GenMathsItem, type MathsFamily, type Tier } from '@cluecrew/core';
import { deliver, freshnessStamp, stampedName } from './lib/export-destination';

const OUT_DIR = resolve(import.meta.dirname, '../content/exports');
const FAMILY = 'maths-sample-sheets';
const SEED = 20260807;
const PER_TIER = 30;

const entryOf = (id: string | null | undefined): number | null => (id ? mathsEntryNumber(id) : null);

/** Is this served distractor DERIVED — did an executor (numeric, or PROC-01's
 *  firstStepResults) produce its value on the item's own operands? */
function isDerived(item: GenMathsItem, opt: GenMathsItem['options'][number]): boolean {
  if (opt.processMisconceptionId?.includes('proc-01')) return Array.isArray(item.operands.firstStepResults);
  const n = entryOf(opt.misconceptionId);
  return n !== null && derive(n, item.operands) !== null;
}

function renderFamily(family: MathsFamily): string {
  const L: string[] = [];
  const tiers: Tier[] = family.id === 'M-05a' ? [3, 4, 5] : [1, 2, 3, 4, 5];
  L.push(`## ${family.id} — ${family.name}`);
  L.push(`*Shape: ${family.shape}. Generated through the derivability + notation gates; every item below passed both.*\n`);

  const cov = familyExecutorCoverage(family);
  L.push('**Executor coverage (annie requirement #2).** A derived distractor is recomputed by the gate on the item\'s numbers; an authored one is trusted to the author (disclosed, not gate-verified).');
  L.push(`- **Derived** ids: ${cov.derived.length ? cov.derived.map((n) => `#${n}`).join(', ') : '—'}`);
  L.push(`- **Authored** ids: ${cov.authored.length ? cov.authored.map((n) => `#${n}`).join(', ') : '—'}`);
  if (family.distractorFloor === 2) L.push('- **Two-distractor floor (R9):** allow-listed to ship two distractors — a third is correct by construction.\n');
  else L.push('');

  for (const tier of tiers) {
    const items = generateSample(family, tier, PER_TIER, SEED);
    L.push(`### Tier ${tier}`);
    L.push(`- **Tier rule:** ${family.tierRule(tier)}`);
    L.push(`- **Number ranges:** ${family.ranges(tier)}`);
    if (items[0]?.hint) L.push(`- **Hint:** ${items[0].hint}`);
    L.push('');
    items.forEach((item, i) => {
      L.push(`${i + 1}. ${item.stem}`);
      const parts = [`  ✓ **${item.key}**`];
      for (const o of item.options.filter((x) => !x.isKey)) {
        const tag = o.processMisconceptionId?.includes('proc-01') ? 'PROC-01' : `#${entryOf(o.misconceptionId) ?? '?'}`;
        parts.push(`${o.value} [${isDerived(item, o) ? 'D' : 'A'} ${tag}]`);
      }
      L.push(parts.join('   '));
    });
    L.push('');
  }
  return L.join('\n');
}

function main(): void {
  const sheets = MATHS_FAMILIES.map(renderFamily).join('\n---\n\n');
  const doc = [
    '# MATHS TEMPLATE SAMPLE SHEETS',
    `*For the reviewer sitting. ${MATHS_FAMILIES.length} families, ${PER_TIER} items per tier, seeded ${SEED}. Gate-verified; regenerates byte-for-byte.*`,
    '',
    'Legend: `✓` key · `[D #n]` distractor derived by executor #n · `[A #n]` authored (disclosed) · `[D PROC-01]` stop-early, verified against firstStepResults.',
    '',
    '---',
    '',
    sheets,
  ].join('\n');

  const stamp = freshnessStamp(doc, new Date().toISOString());
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, stampedName(FAMILY, stamp.sourceHash, 'md'));
  writeFileSync(path, doc);
  const total = MATHS_FAMILIES.reduce((n, f) => n + (f.id === 'M-05a' ? 3 : 5) * PER_TIER, 0);
  console.log(`Sample sheets: ${MATHS_FAMILIES.length} families, ${total} gated items → ${stampedName(FAMILY, stamp.sourceHash, 'md')}`);
  deliver(path, FAMILY);
}

main();
