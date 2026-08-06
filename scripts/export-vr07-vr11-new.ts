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
  L.push('vr-07 & vr-11 — REBUILT round 2, your three closing changes applied (2026-08-06)');
  L.push('Each item whole: stem, key (*), distractors + tags.');
  L.push(' vr-07: your third diagnosis term-dropped added — four options again, three DISTINCT');
  L.push('   tags (value-slip, operation-slip, term-dropped), no collision on any of the 25.');
  L.push(' vr-11: direction RETIRED. Changing series field step-carryover + off-by-one (3 options).');
  L.push('   CONSTANT series (T1-T2) now field ONLY off-by-one → 2 options: no second EXECUTABLE');
  L.push('   diagnosis exists, so this is REPORTED, not invented (candidates + T5 in the reply).');
  L.push(' vr-11 tiers: T3 13 / T4 13 now (was T3 20 / T4 6) — half the seeds re-grown to +3 (T4).');
  L.push('Tag key — vr-07: value-slip, operation-slip, term-dropped.   vr-11: step-carryover, off-by-one.');

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
