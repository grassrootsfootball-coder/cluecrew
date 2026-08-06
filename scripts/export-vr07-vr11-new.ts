/**
 * vr-07 & vr-11 — the NEW stems WITH their NEW distractors, plain text.
 *
 * The earlier export showed the current live options against the new stems, so
 * the key had moved and the distractors could not be reviewed. This emits the
 * re-import items whole — new stem, new key, new distractors and tags together.
 *
 * NOTE: vr-07 is NOT deploying (reviewer, 2026-08-06 — the current live items
 * are better than these replacements). This export is for review of the new
 * distractors only. vr-11's 14 seed items are also held pending a re-tier.
 *
 * `pnpm tsx scripts/export-vr07-vr11-new.ts`
 */
import { writeFileSync } from 'node:fs';
import { GENERATORS } from '../packages/db/prisma/generate-content';
import { numberSeriesItems } from '../packages/db/prisma/seed';

const OUT_DIRS = ['/Users/davidb/Downloads/11+/from-cluecrew', '/Users/davidb/Downloads/reviewer-latest'];
const short = (m?: string | null) => (m ?? '').replace(/^vr07-/, '').replace(/^vr-series-/, '');

function opts(list: Array<{ content: unknown; isCorrect: boolean; mid?: string; misconceptionId?: string | null }>): string {
  return list
    .map((o) => {
      const v = (o.content as { value?: unknown }).value;
      const tag = o.mid ?? o.misconceptionId;
      return `${o.isCorrect ? '*' : ''}${v}${tag ? `[${short(tag)}]` : ''}`;
    })
    .join('  ');
}

function main(): void {
  const L: string[] = [];
  L.push('vr-07 & vr-11 — REBUILT, plain text for the reviewer to close the pass (2026-08-06)');
  L.push('Each item whole: stem, key (*), distractors + tags. All three findings applied:');
  L.push(' vr-07: value sets are now PER ITEM (25 distinct, was 8), mixed parity in every set,');
  L.push('   and value-slip / operation-slip never collide. Folded into the vr-03 approach —');
  L.push('   two DISTINCT-tag distractors, so 3-option now (was two value-slips). DEVIATION');
  L.push('   surfaced: every tier now carries a subtraction so operation-slip always applies.');
  L.push(' vr-11: constant series serve two distinct tags (was doubled off-by-one); changing');
  L.push('   series keep three. The 14 seed items are re-tiered to T3 (their +2-grow structure).');
  L.push('Tag key — vr-07: value-slip, operation-slip.   vr-11: step-carryover, off-by-one, direction.');

  const v7 = GENERATORS['vr-07-letters-for-numbers']!();
  L.push(`\n===== vr-07 letters-for-numbers — REBUILT (${v7.length}) [deployable after your sign-off] =====`);
  for (const it of v7) {
    const st = it.stem as { prompt: string };
    L.push(`${String(it.n).padStart(2, '0')} [T${it.tier}]  ${st.prompt}`);
    L.push(`     ${opts(it.options)}`);
  }

  const v11gen = GENERATORS['vr-11-number-series']!();
  const v11seed = numberSeriesItems();
  L.push(`\n===== vr-11 number-series — REBUILT gen bank (${v11gen.length}) =====`);
  for (const it of v11gen) {
    const st = it.stem as { series: number[] };
    L.push(`${String(it.n).padStart(2, '0')} [T${it.tier}]  series [${st.series.join(', ')}] -> ?`);
    L.push(`     ${opts(it.options)}`);
  }
  L.push(`\n===== vr-11 number-series — REBUILT seed items (${v11seed.length}) [re-tiered to T3] =====`);
  for (const s of v11seed) {
    const st = s.stem as { series: number[] };
    L.push(`${s.id} [T${s.difficultyTier}]  series [${st.series.join(', ')}] -> ?`);
    L.push(`     ${opts(s.options as Array<{ content: unknown; isCorrect: boolean; misconceptionId?: string | null }>)}`);
  }

  const text = L.join('\n') + '\n';
  for (const dir of OUT_DIRS) {
    try { writeFileSync(`${dir}/vr07-vr11-rebuilt.txt`, text); } catch (e) { console.error(`skip ${dir}: ${(e as Error).message}`); }
  }
  console.log(`[${Buffer.byteLength(text)} bytes] vr07=${v7.length} vr11gen=${v11gen.length} vr11seed=${v11seed.length}`);
}

main();
