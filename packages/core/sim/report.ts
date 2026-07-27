/**
 * One-page HTML simulation report (gate checklist #2): plotted difficulty,
 * mastery, and rolling success curves for the six learner profiles, for
 * David to confirm they FEEL right for real children.
 *
 * Run: pnpm --filter @cluecrew/core sim:report → docs/sim-report.html
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROFILES } from './learners';
import { runSimulation, type SimResult } from './runner';

const COLORS = ['#1B2A4A', '#F5A623', '#2A9D8F', '#7B6FA8', '#5B9A68', '#C76B7E'];
const WIDTH = 340;
const HEIGHT = 150;
const PAD = 28;

function polyline(values: Array<number | null>, min: number, max: number, color: string): string {
  const points = values
    .map((value, index) => {
      if (value === null) return null;
      const x = PAD + (index / Math.max(1, values.length - 1)) * (WIDTH - 2 * PAD);
      const y = HEIGHT - PAD - ((value - min) / (max - min)) * (HEIGHT - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(' ');
  return `<polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"/>`;
}

function chart(title: string, series: Array<{ values: Array<number | null>; color: string }>, min: number, max: number, bandLines?: number[]): string {
  const band = (bandLines ?? [])
    .map((line) => {
      const y = HEIGHT - PAD - ((line - min) / (max - min)) * (HEIGHT - 2 * PAD);
      return `<line x1="${PAD}" x2="${WIDTH - PAD}" y1="${y}" y2="${y}" stroke="#E8836B" stroke-dasharray="4 3" stroke-width="1"/>`;
    })
    .join('');
  return `
    <figure>
      <figcaption>${title}</figcaption>
      <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${title}">
        <rect x="${PAD}" y="${PAD}" width="${WIDTH - 2 * PAD}" height="${HEIGHT - 2 * PAD}" fill="none" stroke="#1B2A4A" stroke-opacity="0.2"/>
        ${band}
        ${series.map((entry) => polyline(entry.values, min, max, entry.color)).join('')}
        <text x="${PAD - 4}" y="${PAD + 4}" text-anchor="end" font-size="9">${max}</text>
        <text x="${PAD - 4}" y="${HEIGHT - PAD}" text-anchor="end" font-size="9">${min}</text>
        <text x="${WIDTH - PAD}" y="${HEIGHT - 8}" text-anchor="end" font-size="9">day 90</text>
      </svg>
    </figure>`;
}

function rolling(result: SimResult, window: number): Array<number | null> {
  return result.days.map((_, index) => {
    const slice = result.days.slice(Math.max(0, index - window + 1), index + 1).filter((day) => day.practiceAttempts > 0);
    const attempts = slice.reduce((sum, day) => sum + day.practiceAttempts, 0);
    if (attempts === 0) return null;
    return slice.reduce((sum, day) => sum + day.practiceCorrect, 0) / attempts;
  });
}

const results = PROFILES.map((profile) => runSimulation(profile, { seed: 42 }));

const profileSections = results
  .map((result, index) => {
    const color = COLORS[index % COLORS.length]!;
    const attendedDays = result.days.filter((day) => day.attended).length;
    const breaks = result.days.filter((day) => day.frustrationBreak).length;
    const onBeat = result.days.filter((day) => day.endedOnCompletionBeat).length;
    return `
    <section>
      <h2 style="color:${color}">${result.profile}</h2>
      <p class="meta">
        ${attendedDays} active days · ${result.casesCracked} cases cracked ·
        ${onBeat} sessions ended on the completion beat · ${breaks} frustration breaks ·
        max review pool ${result.maxReviewPoolSize}/12 · 4-miss streaks: ${result.everFourConsecutiveMisses ? 'YES (LAW BROKEN)' : 'never'}
      </p>
      <div class="charts">
        ${chart('Rolling success rate (10-day) vs 70–85% band', [{ values: rolling(result, 10), color }], 0, 1, [0.7, 0.85])}
        ${chart('Mean difficulty tier estimate', [{ values: result.days.map((day) => day.tierEstimate), color }], 1, 5)}
        ${chart('Mean case mastery (0.8 = cracked)', [{ values: result.days.map((day) => day.meanMastery), color }], 0, 1, [0.8])}
      </div>
    </section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>ClueCrew engine simulation report</title>
<style>
  body { font-family: system-ui, sans-serif; background: #FAF6EF; color: #1B2A4A; max-width: 1120px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; } h2 { margin-bottom: 0.2rem; text-transform: capitalize; }
  .meta { font-size: 0.85rem; opacity: 0.75; margin-top: 0; }
  .charts { display: flex; gap: 1rem; flex-wrap: wrap; }
  figure { margin: 0; } figcaption { font-size: 0.8rem; opacity: 0.8; margin-bottom: 0.25rem; }
  svg { background: #fff8; border-radius: 8px; width: ${WIDTH}px; height: ${HEIGHT}px; }
  .note { border-left: 4px solid #F5A623; padding: 0.5rem 1rem; background: #fff6; }
</style>
</head>
<body>
<h1>Engine simulation report — six synthetic learners, 90 days each</h1>
<p class="note">Gate checklist #2: review the curves and confirm they <em>feel</em> right for real children.
The dashed lines mark the 70–85% success band and the 0.8 cracked threshold. Every run uses the real
session/adaptivity/mastery/scheduler code with a fixed random seed (42).</p>
${profileSections}
<p class="meta">Generated ${new Date().toISOString()} · packages/core/sim/report.ts</p>
</body>
</html>`;

const outPath = resolve(import.meta.dirname, '../../../docs/sim-report.html');
writeFileSync(outPath, html);
console.log(`Simulation report written to ${outPath}`);
