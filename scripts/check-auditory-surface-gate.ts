/**
 * THE AUDITORY SURFACE'S BUILD GATE (David's ruling, 2026-08-23 — R661, from the silence-as-clean
 * class report; the shape is Annie's 109th: "the auditory surface has no gate").
 *
 * **REPORT-ONLY TODAY, ENFORCEMENT ARMED ON A PRE-STATED CONDITION**: a seat with scope
 * 'accessibility' landing in MAY_JUDGE_SEATS. A hard gate today would redden forty-one channels
 * against a reviewer who does not exist yet; a gate armed on the seat filling records rather than
 * hurries — **and the day the scope lands, enforcement turns on mechanically, with no edit here.**
 *
 * What it screens: every channel of child-facing UI copy (the check-channel-has-reviewer
 * population — accessible names, aria labels, status text, the strings a screen reader speaks),
 * requiring a `// COPY-REVIEW:` declaration naming a reviewer. Silence on this surface currently
 * reads as clean; this instrument is the counting half of closing that, and the seat is the gate's
 * missing half.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAY_JUDGE_SEATS } from '../packages/core/src/index';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['apps/web/components', 'apps/web/app', 'apps/web/lib/crew'];
const CHANNEL_MARK = /aria-label|aria-live|role="status"|VOICE\.|MODE_BLURBS|aria-describedby/;

function files(): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(n)) out.push(p);
    }
  };
  for (const r of ROOTS) walk(join(REPO, r));
  return out;
}

function main() {
  const enforcerSeat = MAY_JUDGE_SEATS.find((s) => s.scope === 'accessibility');
  const enforcing = Boolean(enforcerSeat);

  const all = files();
  requirePopulation('check:auditory-surface-gate', { 'source file(s) walked': all.length });

  const channels: string[] = [];
  const undeclared: string[] = [];
  for (const f of all) {
    const body = readFileSync(f, 'utf8');
    if (!CHANNEL_MARK.test(body)) continue;
    const rel = f.replace(`${REPO}/`, '');
    channels.push(rel);
    if (!body.includes('// COPY-REVIEW:')) undeclared.push(rel);
  }

  console.log(`\n  ${channels.length} auditory/UI-copy channel(s) [unit: source files carrying accessible strings]`);
  console.log(`  ${undeclared.length} with NO COPY-REVIEW declaration — silence currently reads as clean on this surface:`);
  for (const u of undeclared) console.log(`    ${u}`);

  if (enforcing) {
    console.log(`\n  ENFORCING — the accessibility seat is filled (${enforcerSeat!.name}, ruled: ${enforcerSeat!.ruledBy}).`);
    if (undeclared.length > 0) {
      console.error(`  ${undeclared.length} undeclared channel(s) redden the build.`);
      process.exitCode = 1;
    }
  } else {
    console.log(
      '\n  REPORT-ONLY. Enforcement is ARMED on a pre-stated condition: a seat with scope'
      + " 'accessibility' landing in MAY_JUDGE_SEATS (packages/core/src/passage-content.ts)."
      + '\n  The day that seat is ruled, this run exits 1 on the list above WITH NO EDIT HERE —'
      + '\n  machinery that records rather than a hand that hurries. This line is not a pass.',
    );
  }
}

main();
