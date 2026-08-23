/**
 * DOES EVERY PASSAGE'S STATUS AGREE WITH WHAT ITS FLAGS IMPLY? (David, 2026-08-23 — R657.)
 *
 * **The demotion of the report-only serve-path evaluator: same logic, new job, named for what it
 * checks rather than for what it almost was.** Enforcement is through passage STATE; this asserts
 * on schedule that the state and the flags have not drifted apart, and FAILS LOUDLY on any
 * divergence — including a reader throw, which on the serve path would have been silence and here
 * is a red build. **It never blocks serving.**
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readContentFlags } from '../packages/core/src/index';
import { requirePopulation } from './lib/population';

const PASSAGES = join(dirname(fileURLToPath(import.meta.url)), '..', 'content/passages');

function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('check:passage-status-divergence', { 'passage file(s)': files.length });

  const divergences: string[] = [];
  let servable = 0; let withheld = 0; let unset = 0;
  for (const f of files) {
    const pid = f.replace(/\.json$/, '');
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const status = (p.passageStatus as { status?: unknown } | undefined)?.status ?? 'UNSET';
    if (status === 'SERVABLE') servable++; else if (status === 'WITHHELD') withheld++; else unset++;

    let implied: string; let why = '';
    try {
      const r = readContentFlags(p, { enforceUse: true });
      const reasons: string[] = [];
      for (const fl of r.standardFlags) if (fl.disposition === 'refer') reasons.push(`flag ${fl.axis} carries REFER`);
      for (const x of r.refusals) reasons.push(`${x.code}: ${x.detail.slice(0, 70)}`);
      implied = reasons.length === 0 ? 'SERVABLE' : 'WITHHELD';
      why = reasons.join('; ');
    } catch (e) {
      divergences.push(`${pid}: READER THREW (${String(e).slice(0, 90)}) — on the serve path this would have been silence; here it is a red build.`);
      continue;
    }
    if (status === 'UNSET') {
      divergences.push(`${pid}: status UNSET — the serve path fails closed on it, and a passage nobody moved is a migration gap, not a ruling.`);
    } else if (status !== implied) {
      divergences.push(`${pid}: status ${String(status)} but the flags imply ${implied}${why ? ` (${why})` : ''} — a disposition landed without moving the state, or a state moved without a disposition.`);
    }
  }

  console.log(`\n  ${files.length} passages: ${servable} SERVABLE · ${withheld} WITHHELD · ${unset} UNSET [units: passages by status]`);
  if (divergences.length === 0) {
    console.log('  status and flags agree on every passage. This check never blocks serving; the serve path reads the status alone.');
    return;
  }
  console.error(`\n  DIVERGENCES: ${divergences.length}`);
  for (const d of divergences) console.error(`    ${d}`);
  process.exitCode = 1;
}

main();
