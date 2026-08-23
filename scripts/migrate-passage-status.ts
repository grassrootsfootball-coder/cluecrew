/**
 * THE PASSAGE-STATUS MIGRATION: DERIVE, NEVER TYPE (David, 2026-08-23 — R657).
 *
 * Every passage takes its status from THE SAME EVALUATION the blast radius ran — re-run here, not
 * trusted from there. The blast-radius artefact (`serve-gate-blast-radius-7528744cdf6c9966.json`,
 * sha256 0a39af8c358c0375183e909c1416d05edcc1560274acd4a75e5be58d8569045c) is cited as the
 * evaluation this RE-RAN, never as the evaluation it believes: R599's discipline — if the corpus
 * moved since, the re-run says so and the migration follows the bytes, not the artefact.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { impliedServingStatus } from '../packages/core/src/index';
import { movePassageStatus } from './lib/passage-status';
import { artefactStamp, deliver, stampedName } from './lib/export-destination';
import { requirePopulation } from './lib/population';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASSAGES = join(REPO, 'content/passages');
const BLAST = 'serve-gate-blast-radius-7528744cdf6c9966.json, sha256 0a39af8c358c0375183e909c1416d05edcc1560274acd4a75e5be58d8569045c';

function main() {
  const files = readdirSync(PASSAGES).filter((f) => f.endsWith('.json'));
  requirePopulation('migrate:passage-status', { 'passage file(s)': files.length });

  const rows: Array<{ passage: string; derived: string; reasons: string[] }> = [];
  for (const f of files) {
    const pid = f.replace(/\.json$/, '');
    const p = JSON.parse(readFileSync(join(PASSAGES, f), 'utf8')) as Record<string, unknown>;
    const existing = (p.passageStatus as { status?: unknown } | undefined)?.status;
    if (existing) {
      rows.push({ passage: pid, derived: `ALREADY SET (${String(existing)}) — untouched`, reasons: [] });
      continue;
    }
    // THE SIGNED DEFAULT, CALLABLE (R659): a passage with no judgement record derives UNRECORDED —
    // never judged is not clean. The first migration derived two cloze passages SERVABLE from
    // silence, and this is the repair in the deriver rather than only in the rows.
    const { implied: derived, reasons } = impliedServingStatus(p);
    movePassageStatus(PASSAGES, pid, 'UNSET', {
      status: derived,
      movedBy: 'migration (derived — the same evaluation the blast radius ran, RE-RUN here)',
      authority: `derived at migration 2026-08-23 from readContentFlags(enforceUse) over this passage's own bytes; cites ${BLAST} as the evaluation it re-ran, not as the evaluation it trusts`,
      at: '2026-08-23',
      ...(reasons.length ? { disposition: reasons.join('; ') } : {}),
    });
    rows.push({ passage: pid, derived, reasons });
  }

  const servable = rows.filter((r) => r.derived === 'SERVABLE').length;
  const withheld = rows.filter((r) => r.derived === 'WITHHELD');
  console.log(`\n  ${rows.length} passages: ${servable} SERVABLE (derived) · ${withheld.length} WITHHELD`);
  for (const w of withheld) console.log(`    WITHHELD ${w.passage}: ${w.reasons.join('; ')}`);

  const payload = {
    what: 'The passage-status migration, CORRECTED EMISSION superseding f41ac75f19b94209 (retained under the retention rule): every status DERIVED via the signed default made callable — a passage with no judgement record derives UNRECORDED, because absence reads as REFER under the standard. The first emission derived the two cloze passages SERVABLE from silence; found on the desk by the gate diff, repaired through movePassageStatus with David\'s authority, and the deriver itself now carries the default.',
    citesAsReRun: BLAST, rows,
  };
  const stamp = artefactStamp(payload, new Date().toISOString(), 'content', 'the passage-status migration, derived', ['what', 'citesAsReRun', 'rows']);
  const out = join(REPO, 'content/exports', stampedName('passage-status-migration', stamp.sourceHash, 'json'));
  writeFileSync(out, JSON.stringify({ stamp, ...payload }, null, 2));
  deliver(out, 'passage-status-migration');
}

main();
